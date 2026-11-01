"""SHAP-Based Explainable AI Engine for Credit Decision Attributions.

SPEC §F13.
"""

from __future__ import annotations

from typing import Any, Mapping
import numpy as np
import shap

from ml.features import FEATURE_NAMES, engineer_features
from ml.model import load_model_bundle

_EXPLAINER: shap.TreeExplainer | None = None


def get_explainer() -> shap.TreeExplainer:
    """Load or initialize cached SHAP TreeExplainer."""
    global _EXPLAINER
    if _EXPLAINER is not None:
        return _EXPLAINER
    bundle = load_model_bundle()
    base_model = bundle["base_model"]
    # TreeExplainer on XGBoost margin output
    _EXPLAINER = shap.TreeExplainer(base_model, feature_perturbation="tree_path_dependent")
    return _EXPLAINER


def _get(app: Any, field: str, default: Any = 0) -> Any:
    if isinstance(app, Mapping):
        return app.get(field, default)
    return getattr(app, field, default)


def generate_factor_sentence(feature: str, app: Any, features: dict[str, Any], direction: str, pp: float) -> tuple[str, str]:
    """Generate human label and plain-language explanation sentence containing exact numbers."""
    cibil = int(_get(app, "cibil_score", 750))
    foir = float(features.get("foir", 0.0))
    foir_pct = round(foir * 100, 1)
    util = float(_get(app, "credit_utilisation_pct", 25.0))
    missed = int(_get(app, "missed_payments_24m", 0))
    enquiries = int(_get(app, "enquiries_6m", 0))
    emp_type = str(_get(app, "employment_type", "salaried")).replace("_", " ")
    years_job = float(_get(app, "years_in_job", 3.0))
    loan_type = str(_get(app, "loan_type", "personal"))
    lti = float(features.get("lti", 1.0))
    ltv = features.get("ltv")

    if feature in ("cibil_score", "cibil_filled"):
        if cibil == -1:
            label = "New to credit (no CIBIL score)"
            sentence = "Having no prior credit history adds uncertainty to the risk assessment."
        else:
            label = f"CIBIL score {cibil}"
            if direction == "lowers":
                sentence = f"A CIBIL score of {cibil} shows a strong repayment record."
            else:
                sentence = f"A CIBIL score of {cibil} indicates past credit challenges."

    elif feature == "foir":
        label = f"EMIs take {foir_pct} % of income"
        if direction == "raises":
            sentence = f"Your EMIs would take {foir_pct} % of your monthly income. Lenders prefer under 40 %."
        else:
            sentence = f"At {foir_pct} % of income, your total debt commitments are comfortably manageable."

    elif feature == "credit_utilisation_pct":
        label = f"Credit utilisation at {round(util, 1)} %"
        if direction == "raises":
            sentence = f"You are using {round(util, 1)} % of your card limits. Keeping it under 30 % lowers risk."
        else:
            sentence = f"Using only {round(util, 1)} % of available credit demonstrates disciplined spending."

    elif feature == "missed_payments_24m":
        label = f"{missed} missed payment{'s' if missed != 1 else ''}"
        sentence = f"{missed} missed payments recorded in the last 24 months signal repayment risk."

    elif feature == "enquiries_6m":
        label = f"{enquiries} credit enquiries in 6 months"
        sentence = f"{enquiries} recent loan enquiries suggest active credit-seeking behavior."

    elif feature == "past_default":
        label = "Past default record"
        sentence = "A historical loan default remains a key risk factor."

    elif feature == "years_in_job":
        label = f"{years_job} years in current role"
        sentence = f"{years_job} years of employment stability contributes positively to credit profile."

    elif feature == "lti":
        label = f"Loan is {round(lti, 1)}x annual income"
        sentence = f"The requested loan size represents {round(lti, 1)} years of gross earnings."

    elif feature in ("ltv", "ltv_filled"):
        ltv_pct = round(float(ltv or 1.0) * 100, 1)
        label = f"Loan-to-value at {ltv_pct} %"
        sentence = f"Loan amount covers {ltv_pct} % of the pledged collateral valuation."

    elif feature == "employment_type":
        label = f"Employment: {emp_type.title()}"
        sentence = f"Income stability profile for {emp_type} applicants factored into the decision."

    elif feature == "loan_type":
        label = f"Loan category: {loan_type.title()}"
        sentence = f"{loan_type.title()} loan product terms and default benchmarks applied."

    else:
        label = feature.replace("_", " ").title()
        sentence = f"{label} contributed {pp:+.1f} percentage points to estimated default risk."

    return label, sentence


def explain(app: Any) -> list[dict[str, Any]]:
    """Generate SHAP feature attribution factors and plain-language explanations.
    
    SPEC §F13:
    - SHAP TreeExplainer on XGB margin.
    - One-hot groups collapsed.
    - contribution_pp_i = 100 * (P(m) - P(m - shap_i))
    - Return top 6 by absolute contribution.
    """
    bundle = load_model_bundle()
    base_model = bundle["base_model"]
    calibrator = bundle["calibrated_model"]

    feat = engineer_features(app)
    vec = feat["vector"].reshape(1, -1)

    explainer = get_explainer()
    shap_values = explainer.shap_values(vec)[0]  # Array of length 28
    base_margin = float(explainer.expected_value)
    margin = float(base_model.predict(vec, output_margin=True)[0])

    # Collapse one-hot groups
    # Group indices
    group_map: dict[str, list[int]] = {
        "cibil_score": [FEATURE_NAMES.index("cibil_filled"), FEATURE_NAMES.index("no_credit_history")],
        "foir": [FEATURE_NAMES.index("foir")],
        "lti": [FEATURE_NAMES.index("lti")],
        "ltv_filled": [FEATURE_NAMES.index("ltv_filled"), FEATURE_NAMES.index("is_secured")],
        "dti": [FEATURE_NAMES.index("dti")],
        "credit_utilisation_pct": [FEATURE_NAMES.index("credit_utilisation_pct")],
        "missed_payments_24m": [FEATURE_NAMES.index("missed_payments_24m")],
        "enquiries_6m": [FEATURE_NAMES.index("enquiries_6m")],
        "credit_history_years": [FEATURE_NAMES.index("credit_history_years")],
        "years_in_job": [FEATURE_NAMES.index("years_in_job")],
        "open_credit_lines": [FEATURE_NAMES.index("open_credit_lines")],
        "past_default": [FEATURE_NAMES.index("past_default")],
        "dependents": [FEATURE_NAMES.index("dependents")],
        "age": [FEATURE_NAMES.index("age")],
        "city_tier": [FEATURE_NAMES.index("city_tier")],
        "employment_type": [
            FEATURE_NAMES.index("emp_salaried"),
            FEATURE_NAMES.index("emp_self_employed"),
            FEATURE_NAMES.index("emp_business_owner"),
        ],
        "residence": [
            FEATURE_NAMES.index("res_owned"),
            FEATURE_NAMES.index("res_rented"),
            FEATURE_NAMES.index("res_family"),
        ],
        "loan_type": [
            FEATURE_NAMES.index("loan_auto"),
            FEATURE_NAMES.index("loan_business"),
            FEATURE_NAMES.index("loan_education"),
            FEATURE_NAMES.index("loan_home"),
            FEATURE_NAMES.index("loan_personal"),
        ],
    }

    # Sum SHAP contributions within logical feature groups
    grouped_shap: dict[str, float] = {}
    for group_name, indices in group_map.items():
        grouped_shap[group_name] = float(np.sum([shap_values[i] for i in indices]))

    # Calibrated probability of total margin
    p_total = float(calibrator.prob_of_margin(margin))

    factors: list[dict[str, Any]] = []
    for feature_name, shap_i in grouped_shap.items():
        # contribution_pp_i = 100 * (P(m) - P(m - shap_i))
        p_without_i = float(calibrator.prob_of_margin(margin - shap_i))
        contribution_pp = round(100.0 * (p_total - p_without_i), 1)

        direction = "raises" if contribution_pp > 0 else "lowers"
        label, sentence = generate_factor_sentence(feature_name, app, feat, direction, contribution_pp)

        factors.append({
            "feature": feature_name,
            "label": label,
            "direction": direction,
            "contribution_pp": contribution_pp,
            "shap_value": round(shap_i, 4),
            "sentence": sentence,
        })

    # Sort top 6 by absolute contribution / shap
    factors.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
    return factors[:6]
