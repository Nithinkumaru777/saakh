"""Credit Policy Rules and Decision Engine.

SPEC cards: F05, F10.
"""

from __future__ import annotations

from typing import Any, Mapping


def _get(app: Any, field: str, default: Any = 0) -> Any:
    if isinstance(app, Mapping):
        return app.get(field, default)
    return getattr(app, field, default)


def policy_rules(app: Any, features: dict[str, Any]) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    """Evaluate policy knock-outs (hard declines) and referral review flags.
    
    SPEC §F05:
    Knock-outs:
    - K1: age < 21
    - K2: age_at_maturity > 65 (salaried) or > 70 (others)
    - K3: 300 <= cibil_score < 600
    - K4: foir > 0.65
    - K5: ltv > 0.90 (home) or > 0.85 (auto)
    - K6: existing_emi / total_income >= 0.55

    Flags:
    - R1: past_default
    - R2: missed_payments_24m >= 3
    - R3: new to credit and loan_amount > 5,00,000
    - R4: 0.55 < foir <= 0.65
    """
    age = int(_get(app, "age", 25))
    emp_type = str(_get(app, "employment_type", "salaried")).lower()
    cibil = int(_get(app, "cibil_score", 750))
    loan_type = str(_get(app, "loan_type", "personal")).lower()
    loan_amount = int(_get(app, "loan_amount", 100000))
    existing_emi = int(_get(app, "existing_emi", 0))
    missed_payments = int(_get(app, "missed_payments_24m", 0))
    past_default_val = _get(app, "past_default", False)
    past_default = bool(past_default_val in (True, 1, "true", "True"))

    foir = float(features.get("foir", 0.0))
    total_income = float(features.get("total_income", 1.0))
    age_at_maturity = float(features.get("age_at_maturity", age))
    ltv = features.get("ltv")

    knockouts: list[dict[str, str]] = []
    flags: list[dict[str, str]] = []

    # K1
    if age < 21:
        knockouts.append({
            "code": "K1",
            "message": "Applicants must be at least 21.",
        })

    # K2
    maturity_limit = 65 if emp_type == "salaried" else 70
    if age_at_maturity > maturity_limit:
        max_tenure = max(0, int((maturity_limit - age) * 12))
        knockouts.append({
            "code": "K2",
            "message": f"The loan would end after age {maturity_limit}. Choose a tenure of at most {max_tenure} months.",
        })

    # K3 (Note: new to credit -1 is NOT knocked out by K3)
    if 300 <= cibil < 600:
        knockouts.append({
            "code": "K3",
            "message": f"CIBIL score {cibil} is below the minimum of 600.",
        })

    # K4
    if foir > 0.65:
        foir_pct = round(foir * 100, 1)
        knockouts.append({
            "code": "K4",
            "message": f"EMIs would take {foir_pct} % of income; the limit is 65 %.",
        })

    # K5
    if ltv is not None:
        ltv_float = float(ltv)
        if loan_type == "home" and ltv_float > 0.90:
            ltv_pct = round(ltv_float * 100, 1)
            knockouts.append({
                "code": "K5",
                "message": f"Loan is {ltv_pct} % of the asset value; the limit is 90 %.",
            })
        elif loan_type == "auto" and ltv_float > 0.85:
            ltv_pct = round(ltv_float * 100, 1)
            knockouts.append({
                "code": "K5",
                "message": f"Loan is {ltv_pct} % of the asset value; the limit is 85 %.",
            })

    # K6
    existing_ratio = existing_emi / total_income if total_income > 0 else 1.0
    if existing_ratio >= 0.55:
        ratio_pct = round(existing_ratio * 100, 1)
        knockouts.append({
            "code": "K6",
            "message": f"Existing EMIs already use {ratio_pct} % of income.",
        })

    # Flags
    # R1
    if past_default:
        flags.append({
            "code": "R1",
            "message": "Applicant has a past loan default on record.",
        })

    # R2
    if missed_payments >= 3:
        flags.append({
            "code": "R2",
            "message": f"{missed_payments} missed payments recorded in the last 24 months.",
        })

    # R3
    if cibil == -1 and loan_amount > 5_00_000:
        flags.append({
            "code": "R3",
            "message": "New to credit with loan request above ₹5,00,000.",
        })

    # R4
    if 0.55 < foir <= 0.65:
        foir_pct = round(foir * 100, 1)
        flags.append({
            "code": "R4",
            "message": f"FOIR of {foir_pct} % is in the elevated review band (55%–65%).",
        })

    return knockouts, flags


def decide(
    app: Any,
    features: dict[str, Any],
    pd_val: float,
    grade: str,
    knockouts: list[dict[str, str]],
    flags: list[dict[str, str]],
) -> tuple[str, str]:
    """Execute final decision hierarchy and formulate plain-language headline.
    
    SPEC §F10:
    1. Any knock-out -> DECLINED, headline "Declined — {first knock-out message, short}".
    2. Else grade E -> DECLINED, headline "Declined — estimated default risk {pd} %".
    3. Else any flag or grade C/D -> REFER, headline "Refer for review — grade {g}".
    4. Else (A/B, no flags) -> SANCTIONED, headline "Sanctioned at grade {g}".
    """
    g = grade.upper()
    pd_pct = round(pd_val * 100, 1)

    if knockouts:
        first_msg = knockouts[0]["message"]
        # Formulate concise short headline from first knockout
        first_short = first_msg.rstrip(".")
        if "below the minimum of 600" in first_short:
            reason = f"CIBIL score {_get(app, 'cibil_score', 0)} below 600"
        elif "EMIs would take" in first_short:
            reason = f"FOIR {round(features.get('foir', 0.0) * 100, 1)}% exceeds 65%"
        elif "The loan would end after age" in first_short:
            reason = "tenure exceeds retirement age"
        elif "asset value" in first_short:
            reason = "LTV exceeds regulatory cap"
        elif "Existing EMIs already use" in first_short:
            reason = "existing EMIs exceed 55% of income"
        elif "must be at least 21" in first_short:
            reason = "applicant under minimum age 21"
        else:
            reason = first_short

        return "DECLINED", f"Declined — {reason}"

    if g == "E":
        return "DECLINED", f"Declined — estimated default risk {pd_pct} %"

    if flags or g in ("C", "D"):
        return "REFER", f"Refer for review — grade {g}"

    return "SANCTIONED", f"Sanctioned at grade {g}"
