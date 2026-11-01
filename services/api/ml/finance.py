"""Saakh Finance Core: EMI, FOIR, Indicative Rate, and Max Eligible Amount calculations.

SPEC cards: F02, F03, F11, F12.
"""

from __future__ import annotations

import math
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Mapping

TYPE_MAX_AMOUNTS: dict[str, int] = {
    "personal": 40_00_000,
    "auto": 1_00_00_000,
    "education": 1_50_00_000,
    "business": 2_00_00_000,
    "home": 10_00_00_000,
}

BASE_RATES: dict[str, float] = {
    "home": 8.50,
    "auto": 9.25,
    "education": 9.75,
    "personal": 11.50,
    "business": 13.00,
}

GRADE_SPREADS: dict[str, float] = {
    "A": 0.00,
    "B": 0.75,
    "C": 1.75,
    "D": 3.25,
}


def round_half_up(val: float) -> int:
    """Round a float half-up to the nearest integer."""
    d = Decimal(str(val)) if abs(val) < 1e14 else Decimal(f"{val:.4f}")
    return int(d.quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def calc_emi(principal: int, annual_rate_pct: float, months: int) -> int:
    """Calculate monthly Equated Monthly Installment (EMI).
    
    SPEC §F02:
    - r = annual_rate_pct / 12 / 100
    - If r == 0: principal / months
    - Else: principal * r * (1+r)^n / ((1+r)^n - 1)
    - Round half-up to whole rupees.
    """
    if months <= 0:
        raise ValueError("tenure months must be positive")
    if principal <= 0:
        return 0

    r = (annual_rate_pct / 100.0) / 12.0
    if r == 0:
        return round_half_up(principal / months)

    # Standard EMI formula
    factor = (1.0 + r) ** months
    emi_float = principal * r * factor / (factor - 1.0)
    return round_half_up(emi_float)


def calc_foir(
    monthly_income: int,
    other_income: int,
    existing_emi: int,
    new_emi: int,
) -> float:
    """Calculate Fixed Obligation to Income Ratio (FOIR).
    
    SPEC §F03:
    - total_income = monthly_income + 0.5 * other_income (other income haircut 50%)
    - foir = (existing_emi + new_emi) / total_income, rounded to 4 decimal places.
    """
    total_income = monthly_income + 0.5 * other_income
    if total_income <= 0:
        return 1.0
    foir = (existing_emi + new_emi) / total_income
    return round(foir, 4)


def indicative_rate(loan_type: str, grade: str) -> float | None:
    """Determine indicative interest rate based on loan type and credit risk grade.
    
    SPEC §F11:
    - base_rate = {home: 8.50, auto: 9.25, education: 9.75, personal: 11.50, business: 13.00}
    - spread = {A: 0, B: 0.75, C: 1.75, D: 3.25}
    - Grade E or DECLINED -> None.
    - Round to nearest 0.05.
    """
    ltype = loan_type.lower()
    if ltype not in BASE_RATES:
        raise ValueError(f"Unknown loan type: {loan_type}")
    
    g = grade.upper()
    if g not in GRADE_SPREADS:
        return None

    rate = BASE_RATES[ltype] + GRADE_SPREADS[g]
    # Round to nearest 0.05
    return round(round(rate * 20.0) / 20.0, 2)


def max_eligible_amount(
    app: Any = None,
    rate: float = 0.0,
    *,
    monthly_income: int | None = None,
    other_income: int | None = None,
    existing_emi: int | None = None,
    tenure_months: int | None = None,
    loan_type: str | None = None,
    collateral_value: int | None = None,
) -> int:
    """Calculate maximum eligible loan amount under regulatory and collateral caps.
    
    SPEC §F12:
    - max_emi = 0.55 * total_income - existing_emi; <= 0 -> 0.
    - p_foir = max_emi * ((1+r)^n - 1) / (r * (1+r)^n) at offered/reference rate and tenure.
    - Caps: home 0.80 * collateral, auto 0.85 * collateral, type max from §3.1.
    - Result = floor(min(p_foir, caps) / 1000) * 1000.
    """
    if app is not None:
        if isinstance(app, Mapping):
            m_inc = app.get("monthly_income", 0)
            o_inc = app.get("other_monthly_income", app.get("other_income", 0))
            e_emi = app.get("existing_emi", 0)
            tenure = app.get("tenure_months", 0)
            ltype = app.get("loan_type", "personal")
            collateral = app.get("collateral_value", 0)
        else:
            m_inc = getattr(app, "monthly_income", 0)
            o_inc = getattr(app, "other_monthly_income", getattr(app, "other_income", 0))
            e_emi = getattr(app, "existing_emi", 0)
            tenure = getattr(app, "tenure_months", 0)
            ltype = getattr(app, "loan_type", "personal")
            collateral = getattr(app, "collateral_value", 0)
    else:
        m_inc = monthly_income or 0
        o_inc = other_income or 0
        e_emi = existing_emi or 0
        tenure = tenure_months or 0
        ltype = loan_type or "personal"
        collateral = collateral_value or 0

    total_income = m_inc + 0.5 * o_inc
    max_emi = 0.55 * total_income - e_emi
    if max_emi <= 0 or rate <= 0 or tenure <= 0:
        return 0

    r = (rate / 100.0) / 12.0
    if r == 0:
        p_foir = max_emi * tenure
    else:
        factor = (1.0 + r) ** tenure
        p_foir = max_emi * (factor - 1.0) / (r * factor)

    # Caps
    ltype_str = str(ltype).lower()
    type_cap = TYPE_MAX_AMOUNTS.get(ltype_str, 40_00_000)
    cap = type_cap

    if ltype_str == "home" and collateral > 0:
        cap = min(cap, int(0.80 * collateral))
    elif ltype_str == "auto" and collateral > 0:
        cap = min(cap, int(0.85 * collateral))

    eligible = min(p_foir, cap)
    if eligible <= 0:
        return 0

    return int(math.floor(eligible / 1000.0) * 1000)
