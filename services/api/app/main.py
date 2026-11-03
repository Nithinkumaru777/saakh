"""Saakh FastAPI Application: Endpoints for Credit Assessment, Portfolio Analytics, and Model Transparency.

SPEC cards: F01, F15, F16, F17, F18, F19, F22, F23.
"""

from __future__ import annotations

import csv
import io
import json
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, Optional
from fastapi import Depends, FastAPI, File, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse, StreamingResponse
from sqlmodel import Session, col, desc, func, select

from app.db import AssessmentRecord, get_session, init_db, seed_database_if_empty
from app import events
from app.pipeline import assess_application, build_assessment, score_application, warm_up
from app.schemas import ApplicationIn, AssessmentOut

API_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = API_DIR / "data"
ARTIFACTS_DIR = API_DIR / "artifacts"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database and seed with demo personas and generated assessments."""
    init_db()
    seed_database_if_empty()
    # Load model + SHAP explainer now so the first real applicant isn't the one paying ~200 ms.
    warm_up()
    yield


app = FastAPI(
    title="Saakh API",
    description="AI-Based Loan Eligibility & Risk Assessment System",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    # Comma-separated list, e.g. "https://saakh.example.com,http://localhost:3000".
    allow_origins=[
        o.strip()
        for o in os.environ.get("SAAKH_CORS_ORIGINS", "http://localhost:3000").split(",")
        if o.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==============================================================================
# Health
# ==============================================================================

@app.get("/api/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "product": "Saakh",
        "student": "NITHIN KUMAR U",
        "usn": "2102508611",
    }


@app.get("/api/events")
async def event_stream(request: Request):
    """Server-Sent Events: `change` frames when assessments are created or deleted."""
    queue = events.try_subscribe()
    if queue is None:
        return JSONResponse({"detail": "Too many live connections. Try again shortly."}, status_code=503)
    return StreamingResponse(
        events.stream(queue, request.is_disconnected),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no"},
    )


# ==============================================================================
# F16: /api/score (Fast Path)
# ==============================================================================

@app.post("/api/score")
def score(application: ApplicationIn) -> dict[str, Any]:
    """Fast scoring path for live sheet and What-if simulator.
    
    SPEC §F16: No counterfactuals, no DB write, p95 < 150 ms.
    """
    return score_application(application)


# ==============================================================================
# F15: /api/assess (Full Pipeline + Persistence)
# ==============================================================================

@app.post("/api/assess", response_model=AssessmentOut)
def assess(application: ApplicationIn, session: Session = Depends(get_session)) -> dict[str, Any]:
    """Full credit assessment pipeline with counterfactual advice and SQLite persistence.
    
    SPEC §F15.
    """
    result = assess_application(application, persist=True, session=session)
    events.publish("assessment.created", ids=[result["id"]])
    return result


# ==============================================================================
# F19: /api/assessments (History CRUD & Search)
# ==============================================================================

@app.get("/api/assessments")
def list_assessments(
    q: Optional[str] = Query(None, description="Search by applicant full name"),
    outcome: Optional[str] = Query(None, description="Filter by outcome: SANCTIONED | REFER | DECLINED"),
    grade: Optional[str] = Query(None, description="Filter by grade: A | B | C | D | E"),
    loan_type: Optional[str] = Query(None, description="Filter by loan type"),
    page: int = Query(1, ge=1, description="Page number (20 items per page)"),
    page_size: int = Query(20, ge=1, le=100),
    session: Session = Depends(get_session),
) -> dict[str, Any]:
    """Paginated list of historical credit assessments with search and filtering.
    
    SPEC §F19.
    """
    filters = []
    if q:
        # autoescape: a search for "50%" or "a_b" matches literally, not as a LIKE wildcard.
        filters.append(col(AssessmentRecord.full_name).contains(q.strip(), autoescape=True))
    if outcome:
        filters.append(AssessmentRecord.outcome == outcome.upper())
    if grade:
        filters.append(AssessmentRecord.grade == grade.upper())
    if loan_type:
        filters.append(AssessmentRecord.loan_type == loan_type.lower())

    # Count and page in SQL instead of loading every matching row into memory.
    total = session.exec(select(func.count()).select_from(AssessmentRecord).where(*filters)).one()
    records = session.exec(
        select(AssessmentRecord)
        .where(*filters)
        .order_by(desc(AssessmentRecord.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    items = [json.loads(r.assessment_json) for r in records]

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total + page_size - 1) // page_size),
    }


@app.get("/api/assessments/{assessment_id}")
def get_assessment(assessment_id: str, session: Session = Depends(get_session)) -> dict[str, Any]:
    """Retrieve full assessment record by ID."""
    record = session.get(AssessmentRecord, assessment_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Assessment {assessment_id} not found.")
    return json.loads(record.assessment_json)


@app.delete("/api/assessments/{assessment_id}")
def delete_assessment(assessment_id: str, session: Session = Depends(get_session)) -> dict[str, Any]:
    """Delete an assessment record by ID."""
    record = session.get(AssessmentRecord, assessment_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Assessment {assessment_id} not found.")
    session.delete(record)
    session.commit()
    events.publish("assessment.deleted", ids=[assessment_id])
    return {"status": "deleted", "id": assessment_id}


# ==============================================================================
# F17: /api/batch & template (Batch CSV Upload)
# ==============================================================================

BATCH_FIELDS = [
    "full_name", "age", "employment_type", "years_in_job", "city_tier",
    "dependents", "residence", "monthly_income", "other_monthly_income",
    "cibil_score", "credit_history_years", "open_credit_lines",
    "credit_utilisation_pct", "missed_payments_24m", "enquiries_6m",
    "past_default", "existing_emi", "outstanding_debt", "loan_type",
    "loan_amount", "tenure_months", "collateral_value", "purpose",
]
BATCH_MAX_ROWS = 5000  # SPEC F17
BATCH_MAX_BYTES = 5 * 1024 * 1024  # 5,000 template rows are ~1 MB; 5 MB leaves headroom


@app.get("/api/batch/template")
def get_batch_template() -> PlainTextResponse:
    """Download CSV template for batch loan applications."""
    fields = BATCH_FIELDS
    sample = [
        "Aarav Sharma", "29", "salaried", "4.5", "1",
        "0", "rented", "85000", "0",
        "760", "5.0", "3",
        "22.5", "0", "1",
        "false", "10000", "120000", "personal",
        "500000", "36", "0", "Home improvement"
    ]
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(fields)
    writer.writerow(sample)
    return PlainTextResponse(output.getvalue(), media_type="text/csv")


@app.post("/api/batch")
async def batch_score(
    file: UploadFile = File(...),
    save: bool = Query(False, description="Whether to persist valid applications"),
    session: Session = Depends(get_session),
) -> dict[str, Any]:
    """Score batch applications from uploaded CSV.
    
    SPEC §F17.
    """
    content = await file.read(BATCH_MAX_BYTES + 1)
    if len(content) > BATCH_MAX_BYTES:
        raise HTTPException(status_code=413, detail="CSV is larger than 5 MB. Split it into smaller files.")
    text = content.decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(text))

    # SPEC F17: the header must match the template (column order is free).
    header = [h.strip() for h in (reader.fieldnames or [])]
    missing = [f for f in BATCH_FIELDS if f not in header]
    extra = [h for h in header if h not in BATCH_FIELDS]
    if missing or extra:
        parts = []
        if missing:
            parts.append("missing columns: " + ", ".join(missing))
        if extra:
            parts.append("unknown columns: " + ", ".join(extra))
        raise HTTPException(
            status_code=422,
            detail="CSV header does not match the template (" + "; ".join(parts) + "). Download /api/batch/template.",
        )
    reader.fieldnames = header

    rows = list(reader)
    if len(rows) > BATCH_MAX_ROWS:
        raise HTTPException(
            status_code=422,
            detail=f"CSV has {len(rows):,} rows; the limit is {BATCH_MAX_ROWS:,} per upload.",
        )

    results: list[dict[str, Any]] = []
    errors: list[dict[str, Any]] = []

    for row_idx, row in enumerate(rows, start=1):
        try:
            # Type casting from CSV strings
            clean_row: dict[str, Any] = {
                "full_name": str(row.get("full_name", "")).strip(),
                "age": int(row.get("age", 0)),
                "employment_type": str(row.get("employment_type", "")).strip().lower(),
                "years_in_job": float(row.get("years_in_job", 0.0)),
                "city_tier": int(row.get("city_tier", 1)),
                "dependents": int(row.get("dependents", 0)),
                "residence": str(row.get("residence", "")).strip().lower(),
                "monthly_income": int(float(row.get("monthly_income", 0))),
                "other_monthly_income": int(float(row.get("other_monthly_income", 0))),
                "cibil_score": int(row.get("cibil_score", 0)),
                "credit_history_years": float(row.get("credit_history_years", 0.0)),
                "open_credit_lines": int(row.get("open_credit_lines", 0)),
                "credit_utilisation_pct": float(row.get("credit_utilisation_pct", 0.0)),
                "missed_payments_24m": int(row.get("missed_payments_24m", 0)),
                "enquiries_6m": int(row.get("enquiries_6m", 0)),
                "past_default": str(row.get("past_default", "")).strip().lower() in ("true", "1", "yes"),
                "existing_emi": int(float(row.get("existing_emi", 0))),
                "outstanding_debt": int(float(row.get("outstanding_debt", 0))),
                "loan_type": str(row.get("loan_type", "")).strip().lower(),
                "loan_amount": int(float(row.get("loan_amount", 0))),
                "tenure_months": int(row.get("tenure_months", 0)),
                "collateral_value": int(float(row.get("collateral_value", 0))),
                "purpose": str(row.get("purpose", "")).strip(),
            }

            validated = ApplicationIn(**clean_row)
            if save:
                assessed = assess_application(validated, persist=True, session=session)
            else:
                assessed = score_application(validated)
            results.append(assessed)

        except Exception as e:
            errors.append({
                "row": row_idx,
                "field": "application",
                "message": str(e),
            })

    if save and results:
        events.publish("assessment.created", ids=[r["id"] for r in results if "id" in r], count=len(results))

    return {
        "total_rows": len(results) + len(errors),
        "processed": len(results),
        "failed": len(errors),
        "results": results,
        "errors": errors,
    }


# ==============================================================================
# F18: /api/portfolio (Portfolio Analytics)
# ==============================================================================

@app.get("/api/portfolio")
def portfolio_stats(session: Session = Depends(get_session)) -> dict[str, Any]:
    """Aggregate portfolio metrics over stored loan assessments.
    
    SPEC §F18.
    """
    records = session.exec(select(AssessmentRecord)).all()
    count = len(records)

    if count == 0:
        return {
            "count": 0,
            "sanction_rate": 0.0,
            "refer_rate": 0.0,
            "decline_rate": 0.0,
            "avg_pd": 0.0,
            "expected_loss": 0,
            "grade_distribution": {"A": 0, "B": 0, "C": 0, "D": 0, "E": 0},
            "pd_histogram": [{"bin": f"{i*5}–{(i+1)*5}%", "count": 0} for i in range(12)],
            "loan_type_breakdown": [],
            "foir_vs_pd": [],
        }

    sanction_count = sum(1 for r in records if r.outcome == "SANCTIONED")
    refer_count = sum(1 for r in records if r.outcome == "REFER")
    decline_count = sum(1 for r in records if r.outcome == "DECLINED")

    sanction_rate = round(sanction_count / count, 4)
    refer_rate = round(refer_count / count, 4)
    decline_rate = round(decline_count / count, 4)

    avg_pd = round(float(sum(r.pd for r in records) / count), 4)

    # Expected Loss = sum(pd * 0.45 * loan_amount) for SANCTIONED + REFER
    expected_loss = sum(
        int(round(r.pd * 0.45 * r.loan_amount))
        for r in records
        if r.outcome in ("SANCTIONED", "REFER")
    )

    # Grade counts
    grades = {"A": 0, "B": 0, "C": 0, "D": 0, "E": 0}
    for r in records:
        if r.grade in grades:
            grades[r.grade] += 1

    # PD Histogram: 12 bins of 5% each from 0% to 60%+
    bins = [0] * 12
    for r in records:
        bin_idx = min(11, int(r.pd // 0.05))
        bins[bin_idx] += 1

    bin_labels = [
        "0–5 %", "5–10 %", "10–15 %", "15–20 %", "20–25 %", "25–30 %",
        "30–35 %", "35–40 %", "40–45 %", "45–50 %", "50–55 %", "55 %+"
    ]
    pd_histogram = [{"bin": bin_labels[i], "count": bins[i]} for i in range(12)]

    # Loan type breakdown
    type_records: dict[str, list[AssessmentRecord]] = {}
    for r in records:
        type_records.setdefault(r.loan_type, []).append(r)

    loan_type_breakdown = []
    for lt, recs in type_records.items():
        s_count = sum(1 for r in recs if r.outcome == "SANCTIONED")
        avg_amt = sum(r.loan_amount for r in recs) / len(recs)
        loan_type_breakdown.append({
            "loan_type": lt,
            "count": len(recs),
            "sanction_rate": round(s_count / len(recs), 4),
            "avg_amount": int(round(avg_amt)),
        })

    # FOIR vs PD scatter points (up to 500)
    foir_vs_pd = []
    for r in records[:500]:
        try:
            data = json.loads(r.assessment_json)
            foir = data["features"]["foir"]
            foir_vs_pd.append({
                "foir": foir,
                "pd": r.pd,
                "outcome": r.outcome,
                "grade": r.grade,
                "loan_type": r.loan_type,
            })
        except Exception:
            pass

    return {
        "count": count,
        "sanction_rate": sanction_rate,
        "refer_rate": refer_rate,
        "decline_rate": decline_rate,
        "avg_pd": avg_pd,
        "expected_loss": expected_loss,
        "grade_distribution": grades,
        "pd_histogram": pd_histogram,
        "loan_type_breakdown": loan_type_breakdown,
        "foir_vs_pd": foir_vs_pd,
    }


# ==============================================================================
# F22: /api/personas
# ==============================================================================

@app.get("/api/personas")
def get_personas() -> list[dict[str, Any]]:
    """Return the 8 calibrated demo personas."""
    personas_file = DATA_DIR / "personas.json"
    if personas_file.exists():
        with open(personas_file, encoding="utf-8") as f:
            return json.load(f)
    return []


# ==============================================================================
# F23: /api/model
# ==============================================================================

@app.get("/api/model")
def get_model_info() -> dict[str, Any]:
    """Return model metrics, model card markdown, and transparency architecture.
    
    SPEC §F23.
    """
    metrics = {}
    metrics_path = ARTIFACTS_DIR / "metrics.json"
    if metrics_path.exists():
        with open(metrics_path, encoding="utf-8") as f:
            metrics = json.load(f)

    model_card = ""
    card_path = ARTIFACTS_DIR / "model_card.md"
    if card_path.exists():
        model_card = card_path.read_text(encoding="utf-8")

    pipeline_nodes = [
        {"step": 1, "name": "Application Validation", "desc": "22 fields validated against RBI & banking bounds"},
        {"step": 2, "name": "Feature Engineering", "desc": "10 derived ratios + 1-hot categorical encodings"},
        {"step": 3, "name": "Policy Rules Engine", "desc": "Hard knockouts K1–K6 and referral flags R1–R4"},
        {"step": 4, "name": "Monotone XGBoost", "desc": "Gradient boosted trees with monotonic directional constraints"},
        {"step": 5, "name": "Platt Scaling Calibration", "desc": "Sigmoid calibration converting margins to empirical probabilities"},
        {"step": 6, "name": "SHAP TreeExplainer", "desc": "Game-theoretic local feature attributions and risk contributions"},
        {"step": 7, "name": "Counterfactual Search", "desc": "Single-lever optimization to discover paths to superior credit grades"},
    ]

    return {
        "metrics": metrics,
        "model_card": model_card,
        "global_importance": metrics.get("global_importance", []),
        "pipeline_nodes": pipeline_nodes,
        "training_data_summary": {
            "total_records": metrics.get("total_records", 5000),
            "train_size": metrics.get("train_size", 3500),
            "val_size": metrics.get("val_size", 750),
            "test_size": metrics.get("test_size", 750),
            "default_rate": metrics.get("default_rate", 0.13),
            "model_version": metrics.get("model_version", "xgb-2026.11-v1"),
        },
    }
