"""End-to-End Credit Assessment and Scoring Pipeline.

SPEC cards: F15, F16.
"""

from __future__ import annotations

from datetime import datetime, timezone
import json
from typing import Any, Mapping
import uuid
from sqlmodel import Session

from app.db import AssessmentRecord, engine
from app.schemas import (
    ApplicationIn,
    AssessmentOut,
    CounterfactualOut,
    FactorOut,
    FeaturesOut,
    FlagOut,
    KnockoutOut,
)
from ml.counterfactual import counterfactuals
from ml.explain import explain
from ml.features import engineer_features
from ml.finance import calc_emi, indicative_rate, max_eligible_amount
from ml.model import pd_to_grade, predict_pd
from ml.policy import decide, policy_rules


def build_assessment(
    app: ApplicationIn | dict[str, Any],
    include_counterfactuals: bool = True,
) -> dict[str, Any]:
    """Execute the core machine learning and policy assessment pipeline."""
    # Ensure application is validated
    if isinstance(app, dict):
        valid_app = ApplicationIn(**app)
    else:
        valid_app = app

    app_dict = valid_app.model_dump()

    # 1. Feature Engineering (F04)
    feat = engineer_features(app_dict)

    # 2. Policy Rules (F05)
    knockouts_raw, flags_raw = policy_rules(app_dict, feat)

    # 3. Model Prediction (F08)
    pd_val = predict_pd(feat)

    # 4. Grade Mapping (F09)
    grade, grade_label = pd_to_grade(pd_val)

    # 5. Decision Engine (F10)
    outcome, headline = decide(app_dict, feat, pd_val, grade, knockouts_raw, flags_raw)

    # 6. Indicative Rate (F11)
    rate = indicative_rate(valid_app.loan_type, grade) if outcome != "DECLINED" else None

    # 7. Final EMI (F02)
    effective_rate = rate if rate is not None else feat["reference_rate"]
    emi = calc_emi(valid_app.loan_amount, effective_rate, valid_app.tenure_months)

    # 8. Max Eligible Amount (F12)
    max_amount = max_eligible_amount(app_dict, effective_rate)

    # 9. SHAP Explanations (F13)
    factors_raw = explain(app_dict)

    # 10. Counterfactuals (F14)
    if include_counterfactuals:
        cfs_raw = counterfactuals(app_dict)
    else:
        cfs_raw = []

    now_iso = datetime.now(timezone.utc).isoformat()
    record_id = str(uuid.uuid4())

    features_out = FeaturesOut(
        total_income=feat["total_income"],
        reference_rate=feat["reference_rate"],
        new_emi_ref=feat["new_emi_ref"],
        foir=feat["foir"],
        lti=feat["lti"],
        ltv=feat["ltv"],
        dti=feat["dti"],
        age_at_maturity=feat["age_at_maturity"],
        no_credit_history=feat["no_credit_history"],
    )

    assessment_data = {
        "id": record_id,
        "created_at": now_iso,
        "application": app_dict,
        "features": features_out.model_dump(),
        "pd": pd_val,
        "grade": grade,
        "grade_label": grade_label,
        "outcome": outcome,
        "knockouts": knockouts_raw,
        "flags": flags_raw,
        "indicative_rate": rate,
        "emi": emi,
        "max_eligible_amount": max_amount,
        "factors": factors_raw,
        "counterfactuals": cfs_raw,
        "headline": headline,
        "model_version": "xgb-2026.11-v1",
    }

    return assessment_data


def score_application(app: ApplicationIn | dict[str, Any]) -> dict[str, Any]:
    """Fast scoring path for live sheet and What-if simulator (F16).
    
    No counterfactuals, no database write. Latency p95 < 150 ms.
    """
    return build_assessment(app, include_counterfactuals=False)


def assess_application(
    app: ApplicationIn | dict[str, Any],
    persist: bool = True,
    session: Session | None = None,
) -> dict[str, Any]:
    """Full assessment pipeline with counterfactuals and SQLite persistence (F15)."""
    data = build_assessment(app, include_counterfactuals=True)

    if persist:
        record = AssessmentRecord(
            id=data["id"],
            created_at=data["created_at"],
            full_name=data["application"]["full_name"],
            outcome=data["outcome"],
            grade=data["grade"],
            loan_type=data["application"]["loan_type"],
            loan_amount=data["application"]["loan_amount"],
            pd=data["pd"],
            assessment_json=json.dumps(data),
        )
        if session is not None:
            session.add(record)
            session.commit()
        else:
            with Session(engine) as sess:
                sess.add(record)
                sess.commit()

    return data
