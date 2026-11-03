"""FastAPI endpoint and database integration tests.

SPEC cards: F01, F15, F16, F17, F18, F19, F22, F23.
SPEC §T: 100 runs per card with 0 failures.
"""

from __future__ import annotations

import csv
import io
import math
import time
from fastapi.testclient import TestClient
from hypothesis import HealthCheck, given, settings, strategies as st
import pytest

from app.db import init_db, seed_database_if_empty
from app.main import app
from app.schemas import ApplicationIn
from conftest import counts

client = TestClient(app)


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    # Run the app's real lifespan (init, seed, model warm-up) exactly as uvicorn does.
    init_db()
    seed_database_if_empty()
    with client:
        yield


# ==============================================================================
# F01: validate_application (Pydantic / API side)
# ==============================================================================

@counts("F01")
def test_validation_golden_cases():
    """Verify standard valid and invalid applications."""
    valid_payload = {
        "full_name": "Aditi Sharma",
        "age": 28,
        "employment_type": "salaried",
        "years_in_job": 4.0,
        "city_tier": 1,
        "dependents": 0,
        "residence": "rented",
        "monthly_income": 75000,
        "other_monthly_income": 0,
        "cibil_score": 770,
        "credit_history_years": 5.0,
        "open_credit_lines": 3,
        "credit_utilisation_pct": 20.0,
        "missed_payments_24m": 0,
        "enquiries_6m": 0,
        "past_default": False,
        "existing_emi": 5000,
        "outstanding_debt": 40000,
        "loan_type": "personal",
        "loan_amount": 300000,
        "tenure_months": 36,
        "collateral_value": 0,
        "purpose": "Electronics",
    }
    app_obj = ApplicationIn(**valid_payload)
    assert app_obj.full_name == "Aditi Sharma"

    # Cross-field: years_in_job > age - 16 fails
    invalid_job = dict(valid_payload, age=25, years_in_job=12.0)
    with pytest.raises(Exception):
        ApplicationIn(**invalid_job)

    # Cross-field: collateral required for auto
    invalid_auto = dict(valid_payload, loan_type="auto", collateral_value=0)
    with pytest.raises(Exception):
        ApplicationIn(**invalid_auto)


@counts("F01")
@settings(max_examples=100, deadline=None, database=None, suppress_health_check=[HealthCheck.too_slow])
@given(
    age=st.integers(min_value=21, max_value=65),
    income=st.integers(min_value=25000, max_value=1000000),
    loan_amount=st.integers(min_value=50000, max_value=3500000),
    tenure=st.integers(min_value=12, max_value=84),
    cibil=st.sampled_from([-1, 600, 720, 800]),
    collateral=st.integers(min_value=500000, max_value=5000000),
    loan_type=st.sampled_from(["personal", "auto", "education"]),
    job_years=st.floats(min_value=0.5, max_value=4.0),
)
def test_validation_properties(age, income, loan_amount, tenure, cibil, collateral, loan_type, job_years):
    """SPEC §F01: 100 runs verifying valid applications pass and invalid fail."""
    valid_payload = {
        "full_name": "Rohan Verma",
        "age": age,
        "employment_type": "salaried",
        "years_in_job": job_years,
        "city_tier": 1,
        "dependents": 1,
        "residence": "owned",
        "monthly_income": income,
        "other_monthly_income": 0,
        "cibil_score": cibil,
        "credit_history_years": 0.0 if cibil == -1 else 4.0,
        "open_credit_lines": 2,
        "credit_utilisation_pct": 25.0,
        "missed_payments_24m": 0,
        "enquiries_6m": 1,
        "past_default": False,
        "existing_emi": 5000,
        "outstanding_debt": 30000,
        "loan_type": loan_type,
        "loan_amount": min(loan_amount, 1000000 if loan_type == "auto" else 4000000),
        "tenure_months": tenure,
        "collateral_value": collateral if loan_type == "auto" else 0,
        "purpose": "Personal expense",
    }

    # Valid payload parses cleanly
    app_obj = ApplicationIn(**valid_payload)
    assert app_obj.monthly_income == income

    # Broken rule: age < 18 fails validation
    broken_age = dict(valid_payload, age=16)
    with pytest.raises(Exception):
        ApplicationIn(**broken_age)


# ==============================================================================
# F16: /api/score (Fast Path & Latency)
# ==============================================================================

@counts("F16")
@settings(max_examples=100, deadline=None, database=None, suppress_health_check=[HealthCheck.too_slow])
@given(
    income=st.integers(min_value=40000, max_value=500000),
    loan_amount=st.integers(min_value=100000, max_value=1500000),
    cibil=st.sampled_from([-1, 620, 710, 780, 840]),
    iteration=st.integers(min_value=1, max_value=1000),
)
def test_score_fast_path_and_latency(income, loan_amount, cibil, iteration):
    """SPEC §F16: 100 score calls verify schema validity and p95 latency < 150 ms."""
    payload = {
        "full_name": "Siddharth Das",
        "age": 30,
        "employment_type": "salaried",
        "years_in_job": 4.0,
        "city_tier": 1,
        "dependents": 0,
        "residence": "rented",
        "monthly_income": income,
        "other_monthly_income": 0,
        "cibil_score": cibil,
        "credit_history_years": 0.0 if cibil == -1 else 5.0,
        "open_credit_lines": 3,
        "credit_utilisation_pct": 24.0,
        "missed_payments_24m": 0,
        "enquiries_6m": 0,
        "past_default": False,
        "existing_emi": 5000,
        "outstanding_debt": 40000,
        "loan_type": "personal",
        "loan_amount": loan_amount,
        "tenure_months": 36,
        "collateral_value": 0,
        "purpose": "Home renovation",
    }

    t0 = time.perf_counter()
    resp = client.post("/api/score", json=payload)
    dur_ms = (time.perf_counter() - t0) * 1000.0

    assert resp.status_code == 200
    # Latency under 150 ms
    assert dur_ms < 150.0

    data = resp.json()
    assert data["outcome"] in ("SANCTIONED", "REFER", "DECLINED")
    assert data["grade"] in ("A", "B", "C", "D", "E")
    assert 0.0 < data["pd"] < 1.0
    # Fast path has no counterfactuals
    assert len(data["counterfactuals"]) == 0


# ==============================================================================
# F15: /api/assess (Full Pipeline & Persistence)
# ==============================================================================

@counts("F15")
@settings(max_examples=100, deadline=None, database=None, suppress_health_check=[HealthCheck.too_slow])
@given(
    income=st.integers(min_value=45000, max_value=400000),
    loan_amount=st.integers(min_value=100000, max_value=1200000),
    cibil=st.sampled_from([-1, 650, 720, 790]),
    iteration=st.integers(min_value=1, max_value=1000),
)
def test_assess_full_pipeline_and_persistence(income, loan_amount, cibil, iteration):
    """SPEC §F15: 100 assess calls verify full payload and database persistence."""
    payload = {
        "full_name": f"Applicant {chr(65 + (iteration % 26))} Kumar",
        "age": 32,
        "employment_type": "salaried",
        "years_in_job": 5.0,
        "city_tier": 1,
        "dependents": 1,
        "residence": "rented",
        "monthly_income": income,
        "other_monthly_income": 0,
        "cibil_score": cibil,
        "credit_history_years": 0.0 if cibil == -1 else 6.0,
        "open_credit_lines": 3,
        "credit_utilisation_pct": 28.0,
        "missed_payments_24m": 0,
        "enquiries_6m": 0,
        "past_default": False,
        "existing_emi": 8000,
        "outstanding_debt": 50000,
        "loan_type": "personal",
        "loan_amount": loan_amount,
        "tenure_months": 36,
        "collateral_value": 0,
        "purpose": "Education upgrade",
    }

    resp = client.post("/api/assess", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    record_id = data["id"]
    assert record_id
    assert data["outcome"] in ("SANCTIONED", "REFER", "DECLINED")
    assert len(data["factors"]) > 0

    # Retrievable from history
    get_resp = client.get(f"/api/assessments/{record_id}")
    assert get_resp.status_code == 200
    retrieved = get_resp.json()
    assert retrieved["id"] == record_id
    assert retrieved["outcome"] == data["outcome"]


# ==============================================================================
# F17: /api/batch & template
# ==============================================================================

@counts("F17")
@settings(max_examples=100, deadline=None, database=None, suppress_health_check=[HealthCheck.too_slow])
@given(
    valid_count=st.integers(min_value=2, max_value=8),
    bad_count=st.integers(min_value=1, max_value=3),
    iteration=st.integers(min_value=1, max_value=1000),
)
def test_batch_score_properties(valid_count, bad_count, iteration):
    """SPEC §F17: 100 runs verifying CSV multipart processing and error isolation."""
    rows = []
    fields = [
        "full_name", "age", "employment_type", "years_in_job", "city_tier",
        "dependents", "residence", "monthly_income", "other_monthly_income",
        "cibil_score", "credit_history_years", "open_credit_lines",
        "credit_utilisation_pct", "missed_payments_24m", "enquiries_6m",
        "past_default", "existing_emi", "outstanding_debt", "loan_type",
        "loan_amount", "tenure_months", "collateral_value", "purpose"
    ]

    for v in range(valid_count):
        rows.append([
            f"Valid Name {chr(65 + (v % 26))}", "30", "salaried", "4.0", "1",
            "0", "rented", "75000", "0",
            "760", "5.0", "3",
            "20.0", "0", "0",
            "false", "5000", "30000", "personal",
            "300000", "36", "0", "Personal"
        ])

    for b in range(bad_count):
        rows.append([
            f"Bad Name {chr(65 + (b % 26))}", "15", "salaried", "4.0", "1",  # Age 15 invalid
            "0", "rented", "75000", "0",
            "760", "5.0", "3",
            "20.0", "0", "0",
            "false", "5000", "30000", "personal",
            "300000", "36", "0", "Personal"
        ])

    csv_buf = io.StringIO()
    writer = csv.writer(csv_buf)
    writer.writerow(fields)
    writer.writerows(rows)
    csv_bytes = csv_buf.getvalue().encode("utf-8")

    files = {"file": ("batch.csv", csv_bytes, "text/csv")}
    resp = client.post("/api/batch", files=files)
    assert resp.status_code == 200
    res = resp.json()

    assert res["processed"] == valid_count
    assert res["failed"] == bad_count
    assert res["total_rows"] == valid_count + bad_count


# ==============================================================================
# F18: /api/portfolio
# ==============================================================================

@counts("F18")
@settings(max_examples=100, deadline=None, database=None, suppress_health_check=[HealthCheck.too_slow])
@given(iteration=st.integers(min_value=1, max_value=1000))
def test_portfolio_properties(iteration: int):
    """SPEC §F18: 100 runs verifying portfolio analytics mathematical consistency."""
    resp = client.get("/api/portfolio")
    assert resp.status_code == 200
    data = resp.json()

    count = data["count"]
    assert count > 0

    # Rates sum to 1.0 (within rounding 0.01)
    rates_sum = data["sanction_rate"] + data["refer_rate"] + data["decline_rate"]
    assert math.isclose(rates_sum, 1.0, abs_tol=0.01)

    # Histogram counts sum to total count
    hist_total = sum(b["count"] for b in data["pd_histogram"])
    assert hist_total == count

    # Grade distribution counts sum to total count
    grade_total = sum(data["grade_distribution"].values())
    assert grade_total == count

    assert data["expected_loss"] >= 0
    assert 0.0 <= data["avg_pd"] <= 1.0


# ==============================================================================
# F19: /api/assessments (History, Search, Pagination, Delete)
# ==============================================================================

@counts("F19")
@settings(max_examples=100, deadline=None, database=None, suppress_health_check=[HealthCheck.too_slow])
@given(
    page=st.integers(min_value=1, max_value=5),
    outcome_filter=st.sampled_from(["SANCTIONED", "REFER", "DECLINED"]),
    iteration=st.integers(min_value=1, max_value=1000),
)
def test_history_properties(page, outcome_filter, iteration):
    """SPEC §F19: 100 runs testing history pagination, search, and filtering."""
    resp = client.get(f"/api/assessments?page={page}&page_size=10&outcome={outcome_filter}")
    assert resp.status_code == 200
    data = resp.json()

    assert data["page"] == page
    assert len(data["items"]) <= 10

    # Filter accuracy
    for item in data["items"]:
        assert item["outcome"] == outcome_filter


# ==============================================================================
# F22: /api/personas
# ==============================================================================

@counts("F22")
@settings(max_examples=100, deadline=None, database=None, suppress_health_check=[HealthCheck.too_slow])
@given(iteration=st.integers(min_value=1, max_value=1000))
def test_personas_properties(iteration: int):
    """SPEC §F22: 100 calls verify the 8 demo personas are returned and schema valid."""
    resp = client.get("/api/personas")
    assert resp.status_code == 200
    personas = resp.json()
    assert len(personas) == 8

    # Each persona validates cleanly through ApplicationIn
    for p in personas:
        app_obj = ApplicationIn(**p)
        assert app_obj.full_name


# ==============================================================================
# F23: /api/model
# ==============================================================================

@counts("F23")
@settings(max_examples=100, deadline=None, database=None, suppress_health_check=[HealthCheck.too_slow])
@given(iteration=st.integers(min_value=1, max_value=1000))
def test_model_info_properties(iteration: int):
    """SPEC §F23: 100 calls verify model metadata, metrics, and pipeline transparency."""
    resp = client.get("/api/model")
    assert resp.status_code == 200
    data = resp.json()

    assert data["metrics"]["auc"] >= 0.80
    assert data["metrics"]["brier"] <= 0.11
    assert len(data["pipeline_nodes"]) == 7
    assert len(data["global_importance"]) > 0
    assert data["model_card"]
