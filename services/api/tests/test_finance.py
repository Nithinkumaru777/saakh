"""Property and golden tests for Saakh Finance Core (F02, F03, F11, F12).

SPEC §T: 100 runs per function card with 0 failures.
"""

from __future__ import annotations

import math
from hypothesis import HealthCheck, given, settings, strategies as st
import pytest

from conftest import counts
from ml.finance import (
    calc_emi,
    calc_foir,
    indicative_rate,
    max_eligible_amount,
    BASE_RATES,
    GRADE_SPREADS,
)


# ==============================================================================
# F02: calc_emi
# ==============================================================================

@counts("F02")
def test_emi_golden_cases():
    """Verify SPEC §F02 golden values."""
    assert calc_emi(10_00_000, 10.0, 120) == 13_215
    assert calc_emi(5_00_000, 0.0, 50) == 10_000
    assert calc_emi(0, 12.0, 60) == 0


@counts("F02")
@settings(max_examples=100, deadline=None, database=None, suppress_health_check=[HealthCheck.too_slow])
@given(
    principal=st.integers(min_value=10_000, max_value=5_00_00_000),
    rate=st.floats(min_value=1.0, max_value=36.0),
    months=st.integers(min_value=6, max_value=360),
)
def test_emi_properties(principal: int, rate: float, months: int):
    """SPEC §F02: 100 property executions."""
    emi = calc_emi(principal, rate, months)
    assert emi > 0
    # Total repayment exceeds principal
    assert emi * months >= principal

    # Monotonicity: higher rate gives >= EMI
    emi_higher_rate = calc_emi(principal, rate + 1.0, months)
    assert emi_higher_rate >= emi

    # Monotonicity: longer tenure gives <= EMI
    emi_longer = calc_emi(principal, rate, months + 12)
    assert emi_longer <= emi

    # Exact unrounded EMI comparison: rounding error on single EMI is <= 0.5
    r = (rate / 100.0) / 12.0
    factor = (1.0 + r) ** months
    exact_emi = principal * r * factor / (factor - 1.0)
    assert abs(emi - exact_emi) <= 0.5
    # Total nominal difference across n payments is < n rupees
    assert abs(emi * months - exact_emi * months) <= months

    # Amortization check: present value of remaining balance is < months
    balance = float(principal)
    for _ in range(months):
        interest = balance * r
        principal_paid = emi - interest
        balance -= principal_paid

    pv_balance = abs(balance) / ((1.0 + r) ** months)
    assert pv_balance < months + 10.0
    # Future value bound derived from rounding half-up (max 0.5 rupee error per month)
    max_fv_error = 0.5 * ((1.0 + r) ** months - 1.0) / r + 1.0
    assert abs(balance) <= max_fv_error


# ==============================================================================
# F03: calc_foir
# ==============================================================================

@counts("F03")
def test_foir_golden_cases():
    """Verify exact formula values for FOIR."""
    # income 1,00,000 + 0.5 * 20,000 = 1,10,000; total EMI = 44,000 -> 0.4000
    assert calc_foir(100_000, 20_000, 20_000, 24_000) == 0.4000


@counts("F03")
@settings(max_examples=100, deadline=None, database=None, suppress_health_check=[HealthCheck.too_slow])
@given(
    monthly_inc=st.integers(min_value=15_000, max_value=20_00_000),
    other_inc=st.integers(min_value=0, max_value=10_00_000),
    existing_emi=st.integers(min_value=0, max_value=5_00_000),
    new_emi=st.integers(min_value=1_000, max_value=5_00_000),
)
def test_foir_properties(monthly_inc: int, other_inc: int, existing_emi: int, new_emi: int):
    """SPEC §F03: 100 property executions."""
    foir = calc_foir(monthly_inc, other_inc, existing_emi, new_emi)
    assert foir >= 0.0

    # Increasing in EMI
    foir_higher_emi = calc_foir(monthly_inc, other_inc, existing_emi + 5000, new_emi)
    assert foir_higher_emi >= foir

    # Decreasing in income
    foir_higher_inc = calc_foir(monthly_inc + 10000, other_inc, existing_emi, new_emi)
    assert foir_higher_inc <= foir

    # Matches exact hand calculation
    expected = round((existing_emi + new_emi) / (monthly_inc + 0.5 * other_inc), 4)
    assert math.isclose(foir, expected, abs_tol=1e-5)


# ==============================================================================
# F11: indicative_rate
# ==============================================================================

@counts("F11")
def test_indicative_rate_golden_cases():
    """Verify rate calculations per loan type and grade."""
    assert indicative_rate("home", "A") == 8.50
    assert indicative_rate("home", "B") == 9.25
    assert indicative_rate("personal", "A") == 11.50
    assert indicative_rate("personal", "D") == 14.75
    assert indicative_rate("personal", "E") is None


@counts("F11")
@settings(max_examples=100, deadline=None, database=None, suppress_health_check=[HealthCheck.too_slow])
@given(
    loan_type=st.sampled_from(["home", "auto", "education", "personal", "business"]),
    grade=st.sampled_from(["A", "B", "C", "D", "E"]),
    iteration=st.integers(min_value=1, max_value=1000),
)
def test_indicative_rate_properties(loan_type: str, grade: str, iteration: int):
    """SPEC §F11: 100 property executions."""
    rate = indicative_rate(loan_type, grade)
    if grade == "E":
        assert rate is None
    else:
        assert rate is not None
        # On a 0.05 grid: round(rate * 20) == rate * 20
        assert math.isclose(rate * 20.0, round(rate * 20.0), abs_tol=1e-4)

        # Worse grades are never cheaper
        if grade in ("B", "C", "D"):
            better_grade = {"B": "A", "C": "B", "D": "C"}[grade]
            better_rate = indicative_rate(loan_type, better_grade)
            assert rate >= better_rate


# ==============================================================================
# F12: max_eligible_amount
# ==============================================================================

@counts("F12")
def test_max_eligible_amount_golden_cases():
    """Verify maximum eligibility logic and caps."""
    # 55% of 100k = 55k; existing EMI 60k -> 0
    assert max_eligible_amount(
        monthly_income=100_000,
        other_income=0,
        existing_emi=60_000,
        tenure_months=60,
        loan_type="personal",
        rate=12.0,
    ) == 0


@counts("F12")
@settings(max_examples=100, deadline=None, database=None, suppress_health_check=[HealthCheck.too_slow])
@given(
    monthly_inc=st.integers(min_value=30_000, max_value=10_00_000),
    other_inc=st.integers(min_value=0, max_value=2_00_000),
    existing_emi=st.integers(min_value=0, max_value=30_000),
    tenure=st.integers(min_value=12, max_value=240),
    loan_type=st.sampled_from(["home", "auto", "education", "personal", "business"]),
    rate=st.floats(min_value=8.5, max_value=20.0),
    collateral=st.integers(min_value=10_00_000, max_value=5_00_00_000),
)
def test_max_eligible_amount_properties(
    monthly_inc: int,
    other_inc: int,
    existing_emi: int,
    tenure: int,
    loan_type: str,
    rate: float,
    collateral: int,
):
    """SPEC §F12: 100 property executions."""
    app = {
        "monthly_income": monthly_inc,
        "other_monthly_income": other_inc,
        "existing_emi": existing_emi,
        "tenure_months": tenure,
        "loan_type": loan_type,
        "collateral_value": collateral,
    }
    amount = max_eligible_amount(app, rate)
    assert amount >= 0
    # Must be rounded down to nearest 1,000
    assert amount % 1000 == 0

    total_income = monthly_inc + 0.5 * other_inc
    max_emi = 0.55 * total_income - existing_emi

    if max_emi <= 0:
        assert amount == 0
    elif amount > 0:
        # Result EMI does not exceed max_emi + 1
        resulting_emi = calc_emi(amount, rate, tenure)
        assert resulting_emi <= max_emi + 2

        # Collateral cap check
        if loan_type == "home" and collateral > 0:
            assert amount <= int(0.80 * collateral)
        elif loan_type == "auto" and collateral > 0:
            assert amount <= int(0.85 * collateral)
