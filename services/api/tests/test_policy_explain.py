"""Hypothesis and property tests for Policy Rules, Decisions, SHAP Explanation, and Counterfactuals.

SPEC cards: F05, F10, F13, F14.
SPEC §T: 100 runs per card with 0 failures.
"""

from __future__ import annotations

import math
from hypothesis import HealthCheck, given, settings, strategies as st
import numpy as np
import pytest

from conftest import counts
from ml.counterfactual import counterfactuals
from ml.explain import explain
from ml.features import engineer_features
from ml.model import pd_to_grade, predict_pd
from ml.policy import decide, policy_rules


# ==============================================================================
# F05: policy_rules
# ==============================================================================

@counts("F05")
def test_policy_rules_golden():
    """Verify specific policy knock-out and flag conditions."""
    app_k1 = {"age": 20, "cibil_score": 750}
    ko, fl = policy_rules(app_k1, {"foir": 0.30, "total_income": 50000, "age_at_maturity": 23})
    assert any(k["code"] == "K1" for k in ko)

    app_k3 = {"age": 30, "cibil_score": 580}
    ko, fl = policy_rules(app_k3, {"foir": 0.30, "total_income": 50000, "age_at_maturity": 33})
    assert any(k["code"] == "K3" for k in ko)

    # New to credit is NOT knocked out by K3
    app_new = {"age": 30, "cibil_score": -1, "loan_amount": 300000}
    ko, fl = policy_rules(app_new, {"foir": 0.30, "total_income": 50000, "age_at_maturity": 33})
    assert not any(k["code"] == "K3" for k in ko)


@counts("F05")
@settings(max_examples=100, deadline=None, database=None, suppress_health_check=[HealthCheck.too_slow])
@given(
    age=st.integers(min_value=18, max_value=75),
    tenure_months=st.integers(min_value=12, max_value=360),
    cibil_score=st.sampled_from([-1, 450, 599, 600, 650, 750, 850]),
    foir=st.floats(min_value=0.10, max_value=0.90),
    existing_emi_ratio=st.floats(min_value=0.10, max_value=0.80),
    ltv=st.floats(min_value=0.50, max_value=1.10),
    loan_type=st.sampled_from(["home", "auto", "personal", "business"]),
    missed_payments=st.integers(min_value=0, max_value=6),
    past_default=st.booleans(),
    loan_amount=st.integers(min_value=50000, max_value=2000000),
)
def test_policy_rules_properties(
    age, tenure_months, cibil_score, foir, existing_emi_ratio,
    ltv, loan_type, missed_payments, past_default, loan_amount
):
    """SPEC §F05: 100 runs testing exact boundary logic for knock-outs and flags."""
    income = 100000
    existing_emi = int(existing_emi_ratio * income)
    age_at_maturity = age + tenure_months / 12.0

    app = {
        "age": age,
        "employment_type": "salaried",
        "cibil_score": cibil_score,
        "loan_type": loan_type,
        "loan_amount": loan_amount,
        "existing_emi": existing_emi,
        "missed_payments_24m": missed_payments,
        "past_default": past_default,
    }
    features = {
        "foir": foir,
        "total_income": income,
        "age_at_maturity": age_at_maturity,
        "ltv": ltv,
    }

    knockouts, flags = policy_rules(app, features)
    ko_codes = {k["code"] for k in knockouts}
    fl_codes = {f["code"] for f in flags}

    # K1
    if age < 21:
        assert "K1" in ko_codes
    else:
        assert "K1" not in ko_codes

    # K2
    if age_at_maturity > 65:
        assert "K2" in ko_codes

    # K3
    if 300 <= cibil_score < 600:
        assert "K3" in ko_codes
    else:
        assert "K3" not in ko_codes

    # K4
    if foir > 0.65:
        assert "K4" in ko_codes
    else:
        assert "K4" not in ko_codes

    # K5
    if loan_type == "home" and ltv > 0.90:
        assert "K5" in ko_codes
    elif loan_type == "auto" and ltv > 0.85:
        assert "K5" in ko_codes

    # K6
    if existing_emi_ratio >= 0.55:
        assert "K6" in ko_codes

    # R1
    if past_default:
        assert "R1" in fl_codes

    # R2
    if missed_payments >= 3:
        assert "R2" in fl_codes

    # R3
    if cibil_score == -1 and loan_amount > 500000:
        assert "R3" in fl_codes

    # R4
    if 0.55 < foir <= 0.65:
        assert "R4" in fl_codes


# ==============================================================================
# F10: decide
# ==============================================================================

@counts("F10")
def test_decide_golden():
    """Verify SPEC §F10 decision precedence."""
    # Knockout overrides low risk grade A
    ko = [{"code": "K1", "message": "Applicants must be at least 21."}]
    out, headline = decide({}, {"foir": 0.3}, 0.01, "A", ko, [])
    assert out == "DECLINED"
    assert "Declined" in headline

    # Grade E -> Declined
    out_e, head_e = decide({}, {}, 0.35, "E", [], [])
    assert out_e == "DECLINED"
    assert "35.0 %" in head_e

    # Flags force REFER even on Grade A
    fl = [{"code": "R1", "message": "Past default"}]
    out_fl, head_fl = decide({}, {}, 0.02, "A", [], fl)
    assert out_fl == "REFER"
    assert "grade A" in head_fl

    # Clean A -> SANCTIONED
    out_a, head_a = decide({}, {}, 0.015, "A", [], [])
    assert out_a == "SANCTIONED"
    assert "Sanctioned at grade A" == head_a


@counts("F10")
@settings(max_examples=100, deadline=None, database=None, suppress_health_check=[HealthCheck.too_slow])
@given(
    pd_val=st.floats(min_value=0.005, max_value=0.50),
    has_ko=st.booleans(),
    has_flag=st.booleans(),
)
def test_decide_properties(pd_val: float, has_ko: bool, has_flag: bool):
    """SPEC §F10: 100 runs verifying decision hierarchy."""
    grade, _ = pd_to_grade(pd_val)
    knockouts = [{"code": "K4", "message": "EMIs take 68% of income"}] if has_ko else []
    flags = [{"code": "R2", "message": "3 missed payments"}] if has_flag else []

    out, headline = decide({}, {"foir": 0.4}, pd_val, grade, knockouts, flags)

    if has_ko or grade == "E":
        assert out == "DECLINED"
        assert headline.startswith("Declined")
    elif has_flag or grade in ("C", "D"):
        assert out == "REFER"
        assert headline.startswith("Refer for review")
    else:
        assert out == "SANCTIONED"
        assert headline == f"Sanctioned at grade {grade}"


# ==============================================================================
# F13: explain
# ==============================================================================

@counts("F13")
@settings(max_examples=100, deadline=None, database=None, suppress_health_check=[HealthCheck.too_slow])
@given(
    cibil_score=st.sampled_from([-1, 620, 710, 780, 820]),
    monthly_income=st.integers(min_value=35000, max_value=250000),
    existing_emi=st.integers(min_value=0, max_value=40000),
    loan_amount=st.integers(min_value=100000, max_value=3000000),
    util=st.floats(min_value=10.0, max_value=85.0),
    missed=st.integers(min_value=0, max_value=4),
    iteration=st.integers(min_value=1, max_value=1000),
)
def test_explain_properties(cibil_score, monthly_income, existing_emi, loan_amount, util, missed, iteration):
    """SPEC §F13: 100 runs testing SHAP attribution, top-6 ranking, and sentence generation."""
    app = {
        "monthly_income": monthly_income,
        "other_monthly_income": 0,
        "cibil_score": cibil_score,
        "loan_type": "personal",
        "loan_amount": loan_amount,
        "tenure_months": 36,
        "collateral_value": 0,
        "existing_emi": existing_emi,
        "outstanding_debt": 50000,
        "age": 30,
        "years_in_job": 4.0,
        "credit_utilisation_pct": util,
        "missed_payments_24m": missed,
        "enquiries_6m": 1,
        "open_credit_lines": 3,
        "past_default": False,
        "dependents": 1,
        "employment_type": "salaried",
        "residence": "rented",
        "city_tier": 1,
    }

    factors = explain(app)
    assert len(factors) <= 6
    assert len(factors) > 0

    # Sorted by absolute SHAP descending
    shaps = [abs(f["shap_value"]) for f in factors]
    for i in range(len(shaps) - 1):
        assert shaps[i] >= shaps[i + 1]

    # Directions and sentence integrity
    for f in factors:
        assert f["direction"] in ("raises", "lowers")
        assert f["sentence"]
        assert len(f["sentence"]) > 10


# ==============================================================================
# F14: counterfactuals
# ==============================================================================

@counts("F14")
@settings(max_examples=100, deadline=None, database=None, suppress_health_check=[HealthCheck.too_slow])
@given(
    cibil_score=st.integers(min_value=620, max_value=750),
    monthly_income=st.integers(min_value=50000, max_value=150000),
    loan_amount=st.integers(min_value=300000, max_value=1500000),
    util=st.floats(min_value=40.0, max_value=80.0),
    existing_emi=st.integers(min_value=10000, max_value=30000),
    iteration=st.integers(min_value=1, max_value=1000),
)
def test_counterfactuals_properties(cibil_score, monthly_income, loan_amount, util, existing_emi, iteration):
    """SPEC §F14: 100 runs testing that returned paths reach target grade."""
    app = {
        "monthly_income": monthly_income,
        "other_monthly_income": 0,
        "cibil_score": cibil_score,
        "loan_type": "personal",
        "loan_amount": loan_amount,
        "tenure_months": 36,
        "collateral_value": 0,
        "existing_emi": existing_emi,
        "outstanding_debt": 100000,
        "age": 32,
        "years_in_job": 5.0,
        "credit_utilisation_pct": util,
        "missed_payments_24m": 1,
        "enquiries_6m": 1,
        "open_credit_lines": 4,
        "past_default": False,
        "dependents": 1,
        "employment_type": "salaried",
        "residence": "rented",
        "city_tier": 1,
    }

    paths = counterfactuals(app)
    assert len(paths) <= 3

    # If any path returned, verify that re-scoring reaches the stated target grade and new_pd
    grade_order = {"A": 0, "B": 1, "C": 2, "D": 3, "E": 4}
    for p in paths:
        assert p["new_grade"] in ("A", "B", "C", "D")
        assert 0.0 < p["new_pd"] < 1.0
        assert p["sentence"]

        # Apply lever change and re-evaluate
        cand = dict(app)
        if p["lever"] == "loan_amount":
            cand["loan_amount"] = p["to"]
        elif p["lever"] == "tenure_months":
            cand["tenure_months"] = p["to"]
        elif p["lever"] == "credit_utilisation_pct":
            cand["credit_utilisation_pct"] = p["to"]
        elif p["lever"] == "existing_emi":
            cand["existing_emi"] = p["to"]
        elif p["lever"] == "co_applicant_income":
            cand["other_monthly_income"] = p["to"]

        re_feat = engineer_features(cand)
        re_pd = predict_pd(re_feat)
        re_grade, _ = pd_to_grade(re_pd)
        assert grade_order[re_grade] <= grade_order[p["new_grade"]]
