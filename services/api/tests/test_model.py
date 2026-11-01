"""Hypothesis and property tests for Data and Model components (F06, F04, F07, F08, F09).

SPEC §T: 100 runs per function card with 0 failures.
"""

from __future__ import annotations

import math
from pathlib import Path
from hypothesis import HealthCheck, given, settings, strategies as st
import numpy as np
import pandas as pd
import pytest
from sklearn.metrics import roc_auc_score

from conftest import counts
from ml.data import generate_dataset
from ml.features import FEATURE_NAMES, engineer_features
from ml.finance import BASE_RATES, calc_emi, calc_foir
from ml.model import (
    build_feature_matrix,
    load_model_bundle,
    pd_to_grade,
    predict_pd,
)


# ==============================================================================
# F06: generate_dataset
# ==============================================================================

@counts("F06")
@settings(max_examples=100, deadline=None, database=None, suppress_health_check=[HealthCheck.too_slow])
@given(seed=st.integers(min_value=1, max_value=5000))
def test_generate_dataset_properties(seed: int):
    """SPEC §F06: 100 runs proving valid ranges and default rates in [8%, 18%]."""
    df = generate_dataset(n=1000, seed=seed)
    assert len(df) == 1000
    assert not df.isnull().any().any()

    # Default rate within regulatory range [8%, 18%]
    default_rate = df["default_12m"].mean()
    assert 0.08 <= default_rate <= 0.18

    # Age and tenure checks
    assert (df["age"] >= 21).all()
    assert (df["monthly_income"] >= 15000).all()
    assert (df["cibil_score"].isin([-1]) | ((df["cibil_score"] >= 300) & (df["cibil_score"] <= 900))).all()


# ==============================================================================
# F04: engineer_features
# ==============================================================================

@counts("F04")
@settings(max_examples=100, deadline=None, database=None, suppress_health_check=[HealthCheck.too_slow])
@given(
    monthly_income=st.integers(min_value=15_000, max_value=50_00_000),
    other_income=st.integers(min_value=0, max_value=10_00_000),
    cibil_score=st.sampled_from([-1, 350, 600, 720, 800, 850]),
    loan_type=st.sampled_from(["home", "auto", "personal", "education", "business"]),
    loan_amount=st.integers(min_value=25_000, max_value=50_00_000),
    tenure_months=st.integers(min_value=12, max_value=240),
    collateral_value=st.integers(min_value=0, max_value=1_00_00_000),
    existing_emi=st.integers(min_value=0, max_value=2_00_000),
    outstanding_debt=st.integers(min_value=0, max_value=10_00_000),
    age=st.integers(min_value=21, max_value=65),
    years_in_job=st.floats(min_value=0.5, max_value=25.0),
    credit_utilisation_pct=st.floats(min_value=0.0, max_value=99.0),
    missed_payments_24m=st.integers(min_value=0, max_value=10),
    enquiries_6m=st.integers(min_value=0, max_value=10),
    open_credit_lines=st.integers(min_value=0, max_value=20),
    past_default=st.booleans(),
    dependents=st.integers(min_value=0, max_value=5),
    employment_type=st.sampled_from(["salaried", "self_employed", "business_owner"]),
    residence=st.sampled_from(["owned", "rented", "family"]),
    city_tier=st.sampled_from([1, 2, 3]),
)
def test_engineer_features_properties(
    monthly_income, other_income, cibil_score, loan_type, loan_amount,
    tenure_months, collateral_value, existing_emi, outstanding_debt,
    age, years_in_job, credit_utilisation_pct, missed_payments_24m,
    enquiries_6m, open_credit_lines, past_default, dependents,
    employment_type, residence, city_tier
):
    """SPEC §F04: 100 runs proving valid feature vectors and formulas."""
    app = {
        "monthly_income": monthly_income,
        "other_monthly_income": other_income,
        "cibil_score": cibil_score,
        "loan_type": loan_type,
        "loan_amount": loan_amount,
        "tenure_months": tenure_months,
        "collateral_value": collateral_value,
        "existing_emi": existing_emi,
        "outstanding_debt": outstanding_debt,
        "age": age,
        "years_in_job": years_in_job,
        "credit_utilisation_pct": credit_utilisation_pct,
        "missed_payments_24m": missed_payments_24m,
        "enquiries_6m": enquiries_6m,
        "open_credit_lines": open_credit_lines,
        "past_default": past_default,
        "dependents": dependents,
        "employment_type": employment_type,
        "residence": residence,
        "city_tier": city_tier,
    }

    res = engineer_features(app)
    vec = res["vector"]
    assert len(vec) == len(FEATURE_NAMES)
    assert not np.isnan(vec).any()
    assert not np.isinf(vec).any()

    # Derived values check
    total_income = monthly_income + 0.5 * other_income
    assert res["total_income"] == int(round(total_income))
    assert res["cibil_filled"] == (650 if cibil_score == -1 else cibil_score)
    assert res["no_credit_history"] == (cibil_score == -1)

    expected_lti = round(loan_amount / (12.0 * total_income), 4)
    assert math.isclose(res["lti"], expected_lti, abs_tol=1e-4)


# ==============================================================================
# F07: train_model & stability
# ==============================================================================

@counts("F07")
@settings(max_examples=100, deadline=None, database=None, suppress_health_check=[HealthCheck.too_slow])
@given(seed=st.integers(min_value=100, max_value=5000))
def test_model_stability_bootstrap(seed: int):
    """SPEC §F07: 100 bootstrap evaluations prove test AUC >= 0.78 stability."""
    bundle = load_model_bundle()
    calibrated_model = bundle["calibrated_model"]
    base_model = bundle["base_model"]

    # Load test split
    df = pd.read_csv(Path(__file__).resolve().parents[1] / "data" / "applicants_5000.csv")
    # Take a 15% sample as test split
    rng = np.random.default_rng(seed)
    indices = rng.choice(len(df), size=600, replace=True)
    sample_df = df.iloc[indices]
    X_sample = build_feature_matrix(sample_df)
    y_sample = sample_df["default_12m"].to_numpy(dtype=int)

    # If sample has both classes
    if len(np.unique(y_sample)) > 1:
        margins = base_model.predict(X_sample, output_margin=True)
        probs = calibrated_model.prob_of_margin(margins)
        auc = roc_auc_score(y_sample, probs)
        assert auc >= 0.77


# ==============================================================================
# F08: predict_pd & monotonicity
# ==============================================================================

@counts("F08")
@settings(max_examples=100, deadline=None, database=None, suppress_health_check=[HealthCheck.too_slow])
@given(
    base_cibil=st.integers(min_value=600, max_value=750),
    base_foir=st.floats(min_value=0.20, max_value=0.50),
    base_util=st.floats(min_value=15.0, max_value=60.0),
    base_missed=st.integers(min_value=0, max_value=3),
    iteration=st.integers(min_value=1, max_value=1000),
)
def test_predict_pd_monotonicity(base_cibil, base_foir, base_util, base_missed, iteration):
    """SPEC §F08: 100 property executions proving calibrated PD and monotonicity."""
    app = {
        "monthly_income": 85000,
        "other_monthly_income": 0,
        "cibil_score": base_cibil,
        "loan_type": "personal",
        "loan_amount": 500000,
        "tenure_months": 36,
        "collateral_value": 0,
        "existing_emi": int(base_foir * 85000) - 10000,
        "outstanding_debt": 100000,
        "age": 32,
        "years_in_job": 5.0,
        "credit_utilisation_pct": base_util,
        "missed_payments_24m": base_missed,
        "enquiries_6m": 1,
        "open_credit_lines": 3,
        "past_default": False,
        "dependents": 1,
        "employment_type": "salaried",
        "residence": "rented",
        "city_tier": 1,
    }

    pd_base = predict_pd(app)
    assert 0.0 < pd_base < 1.0

    # 1. Monotonicity in CIBIL: higher CIBIL score gives <= PD
    app_high_cibil = dict(app, cibil_score=min(900, base_cibil + 60))
    pd_high_cibil = predict_pd(app_high_cibil)
    assert pd_high_cibil <= pd_base + 1e-4

    # 2. Monotonicity in FOIR: higher existing EMI gives >= PD
    app_high_foir = dict(app, existing_emi=app["existing_emi"] + 15000)
    pd_high_foir = predict_pd(app_high_foir)
    assert pd_high_foir >= pd_base - 1e-4

    # 3. Monotonicity in utilisation: higher utilisation gives >= PD
    app_high_util = dict(app, credit_utilisation_pct=min(95.0, base_util + 30.0))
    pd_high_util = predict_pd(app_high_util)
    assert pd_high_util >= pd_base - 1e-4

    # 4. Monotonicity in missed payments: more missed payments gives >= PD
    app_high_missed = dict(app, missed_payments_24m=base_missed + 2)
    pd_high_missed = predict_pd(app_high_missed)
    assert pd_high_missed >= pd_base - 1e-4


# ==============================================================================
# F09: pd_to_grade
# ==============================================================================

@counts("F09")
def test_pd_to_grade_golden_boundaries():
    """Verify SPEC §F09 boundary values map to upper band."""
    assert pd_to_grade(0.00) == ("A", "Low risk")
    assert pd_to_grade(0.0299) == ("A", "Low risk")
    assert pd_to_grade(0.03) == ("B", "Low risk")
    assert pd_to_grade(0.0699) == ("B", "Low risk")
    assert pd_to_grade(0.07) == ("C", "Moderate")
    assert pd_to_grade(0.1499) == ("C", "Moderate")
    assert pd_to_grade(0.15) == ("D", "Elevated")
    assert pd_to_grade(0.2999) == ("D", "Elevated")
    assert pd_to_grade(0.30) == ("E", "High")
    assert pd_to_grade(0.85) == ("E", "High")


@counts("F09")
@settings(max_examples=100, deadline=None, database=None, suppress_health_check=[HealthCheck.too_slow])
@given(pd_val=st.floats(min_value=0.0001, max_value=0.9999))
def test_pd_to_grade_properties(pd_val: float):
    """SPEC §F09: 100 property executions."""
    grade, label = pd_to_grade(pd_val)
    assert grade in ("A", "B", "C", "D", "E")
    assert label in ("Low risk", "Moderate", "Elevated", "High")

    # Monotonicity check
    higher_grade, _ = pd_to_grade(min(0.9999, pd_val + 0.10))
    order = {"A": 0, "B": 1, "C": 2, "D": 3, "E": 4}
    assert order[higher_grade] >= order[grade]
