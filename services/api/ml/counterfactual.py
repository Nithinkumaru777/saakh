"""Counterfactual Advisory Engine: Single-Lever Search for Credit Profile Optimization.

SPEC §F14.
"""

from __future__ import annotations

import copy
from typing import Any, Mapping
from ml.features import engineer_features
from ml.finance import TYPE_MAX_AMOUNTS
from ml.model import pd_to_grade, predict_pd
from ml.policy import policy_rules

TENURE_MAX: dict[str, int] = {
    "personal": 84,
    "auto": 96,
    "education": 180,
    "business": 120,
    "home": 360,
}

TARGET_BETTER: dict[str, str] = {
    "E": "D",
    "D": "C",
    "C": "B",
    "B": "A",
    "A": "A",
}


def _get(app: Any, field: str, default: Any = 0) -> Any:
    if isinstance(app, Mapping):
        return app.get(field, default)
    return getattr(app, field, default)


def counterfactuals(app: Any) -> list[dict[str, Any]]:
    """Search for actionable single-lever paths to reach a superior risk grade.
    
    SPEC §F14:
    - Target: 1 grade better (D->C, C->B, B->A). If grade A, return [].
    - Levers:
      1. loan_amount: -5% to -60%
      2. tenure_months: +12 to type max
      3. credit_utilisation_pct: -5 to 10
      4. existing_emi: -10% to 0
      5. co_applicant_income: +10% to +100% of income
    - At most 3 paths sorted by minimal relative change.
    """
    app_dict = dict(app) if isinstance(app, Mapping) else copy.deepcopy(app.__dict__)

    feat_base = engineer_features(app_dict)
    pd_base = predict_pd(feat_base)
    grade_base, _ = pd_to_grade(pd_base)

    if grade_base == "A":
        return []

    target_grade = TARGET_BETTER.get(grade_base, "A")
    grade_order = {"A": 0, "B": 1, "C": 2, "D": 3, "E": 4}
    target_rank = grade_order[target_grade]

    loan_amount = int(_get(app_dict, "loan_amount", 500000))
    tenure = int(_get(app_dict, "tenure_months", 36))
    loan_type = str(_get(app_dict, "loan_type", "personal")).lower()
    util = float(_get(app_dict, "credit_utilisation_pct", 50.0))
    existing_emi = int(_get(app_dict, "existing_emi", 0))
    monthly_income = int(_get(app_dict, "monthly_income", 50000))
    other_income = int(_get(app_dict, "other_monthly_income", _get(app_dict, "other_income", 0)))

    paths: list[dict[str, Any]] = []

    # Lever 1: Reduce loan amount (-5% to -60% in steps of 5%)
    for pct_drop in range(5, 65, 5):
        reduced_amt = int(round((loan_amount * (1.0 - pct_drop / 100.0)) / 10000) * 10000)
        if reduced_amt < 10000:
            break
        cand = dict(app_dict, loan_amount=reduced_amt)
        feat = engineer_features(cand)
        ko, _ = policy_rules(cand, feat)
        if not ko:
            pd_new = predict_pd(feat)
            g_new, _ = pd_to_grade(pd_new)
            if grade_order[g_new] <= target_rank:
                paths.append({
                    "lever": "loan_amount",
                    "from": loan_amount,
                    "to": reduced_amt,
                    "relative_change": pct_drop / 100.0,
                    "new_grade": g_new,
                    "new_pd": pd_new,
                    "sentence": f"Reduce loan amount to ₹{reduced_amt:,} to reach grade {g_new} (risk {round(pd_new * 100, 1)} %).",
                })
                break

    # Lever 2: Increase tenure (+12m steps up to type max)
    max_ten = TENURE_MAX.get(loan_type, 84)
    for ext in range(12, max_ten - tenure + 1, 12):
        new_tenure = tenure + ext
        cand = dict(app_dict, tenure_months=new_tenure)
        feat = engineer_features(cand)
        ko, _ = policy_rules(cand, feat)
        if not ko:
            pd_new = predict_pd(feat)
            g_new, _ = pd_to_grade(pd_new)
            if grade_order[g_new] <= target_rank:
                paths.append({
                    "lever": "tenure_months",
                    "from": tenure,
                    "to": new_tenure,
                    "relative_change": ext / tenure,
                    "new_grade": g_new,
                    "new_pd": pd_new,
                    "sentence": f"Extend tenure to {new_tenure} months to reach grade {g_new} (risk {round(pd_new * 100, 1)} %).",
                })
                break

    # Lever 3: Reduce credit utilisation (-5% steps down to 10%)
    if util > 15:
        for u in range(int(util) - 5, 5, -5):
            cand = dict(app_dict, credit_utilisation_pct=float(u))
            feat = engineer_features(cand)
            ko, _ = policy_rules(cand, feat)
            if not ko:
                pd_new = predict_pd(feat)
                g_new, _ = pd_to_grade(pd_new)
                if grade_order[g_new] <= target_rank:
                    rel = (util - u) / util
                    paths.append({
                        "lever": "credit_utilisation_pct",
                        "from": round(util, 1),
                        "to": float(u),
                        "relative_change": rel,
                        "new_grade": g_new,
                        "new_pd": pd_new,
                        "sentence": f"Pay down card balances to {u} % utilisation to reach grade {g_new} (risk {round(pd_new * 100, 1)} %).",
                    })
                    break

    # Lever 4: Prepay / close existing loans (existing_emi -10% down to 0)
    if existing_emi > 0:
        for pct_emi in range(10, 110, 10):
            new_emi = int(round(existing_emi * (1.0 - pct_emi / 100.0) / 500) * 500)
            cand = dict(app_dict, existing_emi=new_emi)
            feat = engineer_features(cand)
            ko, _ = policy_rules(cand, feat)
            if not ko:
                pd_new = predict_pd(feat)
                g_new, _ = pd_to_grade(pd_new)
                if grade_order[g_new] <= target_rank:
                    paths.append({
                        "lever": "existing_emi",
                        "from": existing_emi,
                        "to": new_emi,
                        "relative_change": pct_emi / 100.0,
                        "new_grade": g_new,
                        "new_pd": pd_new,
                        "sentence": f"Prepay or close loans to lower existing EMIs to ₹{new_emi:,} to reach grade {g_new} (risk {round(pd_new * 100, 1)} %).",
                    })
                    break

    # Lever 5: Add co-applicant income (+10% to +100% of income)
    for pct_inc in range(10, 110, 10):
        add_inc = int(round(monthly_income * (pct_inc / 100.0) / 1000) * 1000)
        cand = dict(app_dict, other_monthly_income=other_income + add_inc)
        feat = engineer_features(cand)
        ko, _ = policy_rules(cand, feat)
        if not ko:
            pd_new = predict_pd(feat)
            g_new, _ = pd_to_grade(pd_new)
            if grade_order[g_new] <= target_rank:
                paths.append({
                    "lever": "co_applicant_income",
                    "from": 0,
                    "to": add_inc,
                    "relative_change": pct_inc / 100.0,
                    "new_grade": g_new,
                    "new_pd": pd_new,
                    "sentence": f"Add a co-applicant earning ₹{add_inc:,}/month to reach grade {g_new} (risk {round(pd_new * 100, 1)} %).",
                })
                break

    # Sort by smallest relative change and keep at most 3
    paths.sort(key=lambda x: x["relative_change"])
    return paths[:3]
