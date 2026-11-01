"""Feature engineering pipeline for Saakh Credit Risk Model.

SPEC §F04.
"""

from __future__ import annotations

from typing import Any, Mapping
import numpy as np

from ml.finance import BASE_RATES, calc_emi, calc_foir

# Fixed ordered list of model features
FEATURE_NAMES: list[str] = [
    "cibil_filled",
    "no_credit_history",
    "foir",
    "lti",
    "ltv_filled",
    "is_secured",
    "dti",
    "credit_utilisation_pct",
    "missed_payments_24m",
    "enquiries_6m",
    "credit_history_years",
    "years_in_job",
    "open_credit_lines",
    "past_default",
    "dependents",
    "age",
    "city_tier",
    "emp_salaried",
    "emp_self_employed",
    "emp_business_owner",
    "res_owned",
    "res_rented",
    "res_family",
    "loan_auto",
    "loan_business",
    "loan_education",
    "loan_home",
    "loan_personal",
]

MONOTONE_CONSTRAINTS: dict[str, int] = {
    "cibil_filled": -1,
    "foir": 1,
    "lti": 1,
    "ltv_filled": 1,
    "dti": 1,
    "credit_utilisation_pct": 1,
    "missed_payments_24m": 1,
    "enquiries_6m": 1,
    "past_default": 1,
}


def _get(app: Any, field: str, default: Any = 0) -> Any:
    if isinstance(app, Mapping):
        return app.get(field, default)
    return getattr(app, field, default)


def engineer_features(app: Any) -> dict[str, Any]:
    """Extract derived financial features and construct the model feature vector.
    
    SPEC §F04:
    - reference_rate = base_rate[loan_type] + 1.00
    - new_emi_ref = calc_emi(loan_amount, reference_rate, tenure_months)
    - foir = calc_foir(...)
    - lti = loan_amount / (12 * total_income)
    - ltv = loan_amount / collateral_value if collateral_value > 0 else None
    - dti = (outstanding_debt + loan_amount) / (12 * total_income)
    - age_at_maturity = age + tenure_months / 12
    - no_credit_history = 1 if cibil_score == -1 else 0
    - cibil_filled = 650 if new to credit else cibil_score
    """
    monthly_income = int(_get(app, "monthly_income", 50000))
    other_income = int(_get(app, "other_monthly_income", _get(app, "other_income", 0)))
    total_income = monthly_income + 0.5 * other_income
    if total_income <= 0:
        total_income = 1.0

    loan_amount = int(_get(app, "loan_amount", 100000))
    loan_type = str(_get(app, "loan_type", "personal")).lower()
    tenure_months = int(_get(app, "tenure_months", 36))
    collateral_value = int(_get(app, "collateral_value", 0))
    existing_emi = int(_get(app, "existing_emi", 0))
    outstanding_debt = int(_get(app, "outstanding_debt", 0))
    cibil_score = int(_get(app, "cibil_score", 750))
    age = int(_get(app, "age", 30))
    years_in_job = float(_get(app, "years_in_job", 3.0))
    credit_history_years = float(_get(app, "credit_history_years", 5.0))
    credit_utilisation_pct = float(_get(app, "credit_utilisation_pct", 25.0))
    missed_payments_24m = int(_get(app, "missed_payments_24m", 0))
    enquiries_6m = int(_get(app, "enquiries_6m", 0))
    open_credit_lines = int(_get(app, "open_credit_lines", 2))
    past_default_val = _get(app, "past_default", False)
    past_default = 1 if past_default_val in (True, 1, "true", "True") else 0
    dependents = int(_get(app, "dependents", 0))
    city_tier = int(_get(app, "city_tier", 1))

    emp_type = str(_get(app, "employment_type", "salaried")).lower()
    residence = str(_get(app, "residence", "rented")).lower()

    # Derived financial features
    base_rate = BASE_RATES.get(loan_type, 11.50)
    reference_rate = base_rate + 1.00
    new_emi_ref = calc_emi(loan_amount, reference_rate, tenure_months)
    foir = calc_foir(monthly_income, other_income, existing_emi, new_emi_ref)
    lti = round(loan_amount / (12.0 * total_income), 4)

    is_secured = 1 if loan_type in ("home", "auto") and collateral_value > 0 else 0
    ltv = round(loan_amount / collateral_value, 4) if collateral_value > 0 else None
    ltv_filled = ltv if ltv is not None else 1.0

    dti = round((outstanding_debt + loan_amount) / (12.0 * total_income), 4)
    age_at_maturity = round(age + tenure_months / 12.0, 2)

    no_credit_history = 1 if cibil_score == -1 else 0
    cibil_filled = 650 if no_credit_history else cibil_score

    # One-hot encodings
    emp_salaried = 1 if emp_type == "salaried" else 0
    emp_self_employed = 1 if emp_type == "self_employed" else 0
    emp_business_owner = 1 if emp_type == "business_owner" else 0

    res_owned = 1 if residence == "owned" else 0
    res_rented = 1 if residence == "rented" else 0
    res_family = 1 if residence == "family" else 0

    loan_auto = 1 if loan_type == "auto" else 0
    loan_business = 1 if loan_type == "business" else 0
    loan_education = 1 if loan_type == "education" else 0
    loan_home = 1 if loan_type == "home" else 0
    loan_personal = 1 if loan_type == "personal" else 0

    feature_dict: dict[str, Any] = {
        "cibil_filled": cibil_filled,
        "no_credit_history": no_credit_history,
        "foir": foir,
        "lti": lti,
        "ltv_filled": ltv_filled,
        "is_secured": is_secured,
        "dti": dti,
        "credit_utilisation_pct": credit_utilisation_pct,
        "missed_payments_24m": missed_payments_24m,
        "enquiries_6m": enquiries_6m,
        "credit_history_years": credit_history_years,
        "years_in_job": years_in_job,
        "open_credit_lines": open_credit_lines,
        "past_default": past_default,
        "dependents": dependents,
        "age": age,
        "city_tier": city_tier,
        "emp_salaried": emp_salaried,
        "emp_self_employed": emp_self_employed,
        "emp_business_owner": emp_business_owner,
        "res_owned": res_owned,
        "res_rented": res_rented,
        "res_family": res_family,
        "loan_auto": loan_auto,
        "loan_business": loan_business,
        "loan_education": loan_education,
        "loan_home": loan_home,
        "loan_personal": loan_personal,
    }

    # Vector in exact order
    vector = np.array([feature_dict[name] for name in FEATURE_NAMES], dtype=np.float32)

    return {
        "total_income": int(round(total_income)),
        "reference_rate": reference_rate,
        "new_emi_ref": new_emi_ref,
        "foir": foir,
        "lti": lti,
        "ltv": ltv,
        "ltv_filled": ltv_filled,
        "is_secured": bool(is_secured),
        "dti": dti,
        "age_at_maturity": age_at_maturity,
        "no_credit_history": bool(no_credit_history),
        "cibil_filled": cibil_filled,
        "features": feature_dict,
        "vector": vector,
    }
