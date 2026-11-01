"""Synthetic Dataset Generator for Indian Retail Lending.

SPEC §F06.
"""

from __future__ import annotations

import math
from pathlib import Path
import numpy as np
import pandas as pd

from ml.finance import BASE_RATES, calc_emi, calc_foir

DATA_DIR = Path(__file__).resolve().parents[1] / "data"

INDIAN_FIRST_NAMES = [
    "Aarav", "Aditi", "Ananya", "Arjun", "Deepak", "Fatima", "Gaurav", "Isha",
    "Karthik", "Meera", "Neha", "Nikhil", "Pooja", "Pranav", "Priya", "Rahul",
    "Rohan", "Roshni", "Sameer", "Sanjay", "Shreya", "Siddharth", "Sneha", "Tanvi",
    "Varun", "Vikram", "Vivek", "Zoya", "Aditya", "Amrita"
]

INDIAN_LAST_NAMES = [
    "Sharma", "Verma", "Mehta", "Patel", "Reddy", "Nair", "Iyer", "Rao",
    "Shaikh", "Khan", "Singh", "Das", "Kulkarni", "Joshi", "Bose", "Menon",
    "Pillai", "Chopra", "Kapoor", "Gupta", "Bhat", "Deshmukh", "Natarajan"
]


def sigmoid(x: np.ndarray | float) -> np.ndarray | float:
    return 1.0 / (1.0 + np.exp(-x))


def generate_dataset(n: int = 5000, seed: int = 42) -> pd.DataFrame:
    """Generate reproducible synthetic Indian retail credit dataset.
    
    SPEC §F06:
    - n rows, seed for reproducibility
    - default rate in [8%, 18%]
    """
    rng = np.random.default_rng(seed)

    # Demographics
    first = rng.choice(INDIAN_FIRST_NAMES, size=n)
    last = rng.choice(INDIAN_LAST_NAMES, size=n)
    full_name = [f"{f} {l}" for f, l in zip(first, last)]

    age = rng.integers(21, 65, size=n)
    max_job_years = np.maximum(0.5, age - 18)
    years_in_job = np.round(rng.uniform(0.5, np.minimum(30.0, max_job_years)), 1)
    dependents = rng.choice([0, 1, 2, 3, 4], size=n, p=[0.35, 0.25, 0.25, 0.10, 0.05])
    city_tier = rng.choice([1, 2, 3], size=n, p=[0.45, 0.35, 0.20])
    residence = rng.choice(["owned", "rented", "family"], size=n, p=[0.40, 0.45, 0.15])
    employment_type = rng.choice(["salaried", "self_employed", "business_owner"], size=n, p=[0.70, 0.20, 0.10])

    # Income
    log_mean = np.log(55_000)
    monthly_income = np.clip(
        np.round(rng.lognormal(log_mean, 0.6, size=n) / 1000) * 1000,
        15_000,
        25_00_000,
    ).astype(int)

    has_other_income = rng.random(size=n) < 0.30
    other_monthly_income = np.where(
        has_other_income,
        np.clip(np.round(rng.uniform(5000, 150000, size=n) / 1000) * 1000, 0, 500000).astype(int),
        0,
    )
    total_income = monthly_income + 0.5 * other_monthly_income

    # Credit History
    is_new_to_credit = rng.random(size=n) < 0.06
    cibil_score = np.where(
        is_new_to_credit,
        -1,
        np.clip(np.round(rng.normal(720, 70, size=n)), 300, 900).astype(int),
    )
    cibil_filled = np.where(is_new_to_credit, 650, cibil_score)
    credit_history_years = np.where(
        is_new_to_credit,
        0.0,
        np.round(np.minimum(rng.uniform(1.0, 20.0, size=n), age - 18), 1),
    )
    open_credit_lines = np.where(is_new_to_credit, 0, rng.integers(1, 15, size=n))
    credit_utilisation_pct = np.where(
        is_new_to_credit,
        0.0,
        np.round(np.clip(rng.beta(2, 3, size=n) * 100, 0.0, 98.0), 1),
    )
    missed_payments_24m = np.where(is_new_to_credit, 0, rng.poisson(0.4, size=n))
    enquiries_6m = rng.poisson(1.2, size=n)
    past_default = np.where(is_new_to_credit, False, rng.random(size=n) < 0.04)

    existing_emi = np.where(
        is_new_to_credit,
        0,
        np.clip(np.round(rng.uniform(0.0, 0.40, size=n) * total_income / 500) * 500, 0, 300000).astype(int),
    )
    outstanding_debt = np.where(
        is_new_to_credit,
        0,
        np.clip(existing_emi * rng.integers(6, 48, size=n), 0, 50_00_000).astype(int),
    )

    # Loan Request
    loan_types = rng.choice(
        ["home", "auto", "personal", "education", "business"],
        size=n,
        p=[0.25, 0.20, 0.35, 0.10, 0.10],
    )

    loan_amount = np.zeros(n, dtype=int)
    tenure_months = np.zeros(n, dtype=int)
    collateral_value = np.zeros(n, dtype=int)

    for i in range(n):
        lt = loan_types[i]
        inc = total_income[i]
        if lt == "personal":
            tenure_months[i] = rng.choice([12, 24, 36, 48, 60, 72, 84])
            amt = rng.uniform(1.0, 10.0) * inc
            loan_amount[i] = int(np.clip(np.round(amt / 10000) * 10000, 25000, 35_00_000))
            collateral_value[i] = 0
        elif lt == "auto":
            tenure_months[i] = rng.choice([24, 36, 48, 60, 84])
            amt = rng.uniform(3.0, 18.0) * inc
            amt_clipped = int(np.clip(np.round(amt / 10000) * 10000, 100000, 80_00_000))
            loan_amount[i] = amt_clipped
            collateral_value[i] = int(round(amt_clipped / rng.uniform(0.65, 0.90) / 10000) * 10000)
        elif lt == "home":
            tenure_months[i] = rng.choice([120, 180, 240, 300, 360])
            amt = rng.uniform(12.0, 50.0) * inc
            amt_clipped = int(np.clip(np.round(amt / 50000) * 50000, 500000, 8_00_00_000))
            loan_amount[i] = amt_clipped
            collateral_value[i] = int(round(amt_clipped / rng.uniform(0.60, 0.85) / 50000) * 50000)
        elif lt == "education":
            tenure_months[i] = rng.choice([36, 60, 84, 120, 180])
            amt = rng.uniform(3.0, 20.0) * inc
            loan_amount[i] = int(np.clip(np.round(amt / 25000) * 25000, 100000, 1_20_00_000))
            collateral_value[i] = 0
        elif lt == "business":
            tenure_months[i] = rng.choice([12, 24, 36, 60, 84])
            amt = rng.uniform(4.0, 25.0) * inc
            loan_amount[i] = int(np.clip(np.round(amt / 25000) * 25000, 100000, 1_50_00_000))
            collateral_value[i] = 0

    # Calculate derived financial ratios for ground truth label
    foir_arr = np.zeros(n, dtype=float)
    lti_arr = np.zeros(n, dtype=float)
    ltv_arr = np.zeros(n, dtype=float)
    is_secured_arr = np.zeros(n, dtype=int)

    for i in range(n):
        lt = loan_types[i]
        ref_rate = BASE_RATES[lt] + 1.0
        new_emi = calc_emi(loan_amount[i], ref_rate, tenure_months[i])
        foir_arr[i] = calc_foir(monthly_income[i], other_monthly_income[i], existing_emi[i], new_emi)
        lti_arr[i] = loan_amount[i] / (12.0 * total_income[i])
        if collateral_value[i] > 0:
            ltv_arr[i] = loan_amount[i] / collateral_value[i]
            is_secured_arr[i] = 1
        else:
            ltv_arr[i] = 1.0
            is_secured_arr[i] = 0

    not_salaried = np.where(employment_type != "salaried", 1, 0)
    owned_res = np.where(residence == "owned", 1, 0)

    # SPEC §F06 Latent score formula with sharpened signal for calibrated credit separation
    z_signal = (
        0.016 * (720 - cibil_filled)
        + 0.70 * is_new_to_credit.astype(float)
        + 4.00 * (foir_arr - 0.35)
        + 0.022 * (credit_utilisation_pct - 30.0)
        + 0.40 * missed_payments_24m
        + 0.12 * enquiries_6m
        - 0.045 * np.minimum(years_in_job, 10.0)
        - 0.030 * np.minimum(credit_history_years, 15.0)
        + 0.30 * not_salaried
        + 0.45 * np.maximum(0.0, lti_arr - 3.0)
        + 1.30 * past_default.astype(float)
        + 0.09 * dependents
        - 0.18 * owned_res
        + 0.50 * np.maximum(0.0, ltv_arr - 0.8) * is_secured_arr
    )

    z = -3.4 + z_signal + rng.normal(0.0, 0.35, size=n)

    pd_true = sigmoid(z)
    default_12m = (rng.random(size=n) < pd_true).astype(int)

    df = pd.DataFrame({
        "full_name": full_name,
        "age": age,
        "employment_type": employment_type,
        "years_in_job": years_in_job,
        "city_tier": city_tier,
        "dependents": dependents,
        "residence": residence,
        "monthly_income": monthly_income,
        "other_monthly_income": other_monthly_income,
        "cibil_score": cibil_score,
        "credit_history_years": credit_history_years,
        "open_credit_lines": open_credit_lines,
        "credit_utilisation_pct": credit_utilisation_pct,
        "missed_payments_24m": missed_payments_24m,
        "enquiries_6m": enquiries_6m,
        "past_default": past_default,
        "existing_emi": existing_emi,
        "outstanding_debt": outstanding_debt,
        "loan_type": loan_types,
        "loan_amount": loan_amount,
        "tenure_months": tenure_months,
        "collateral_value": collateral_value,
        "purpose": "General financial requirement",
        "default_12m": default_12m,
    })

    return df


def save_datasets() -> tuple[Path, Path]:
    """Generate and write applicants_5000.csv and batch_sample.csv."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    df = generate_dataset(n=5000, seed=42)
    csv_path = DATA_DIR / "applicants_5000.csv"
    df.to_csv(csv_path, index=False)

    # 50 rows for batch testing (no default_12m ground truth column)
    batch_sample = df.head(50).drop(columns=["default_12m"])
    batch_path = DATA_DIR / "batch_sample.csv"
    batch_sample.to_csv(batch_path, index=False)

    return csv_path, batch_path


if __name__ == "__main__":
    p1, p2 = save_datasets()
    print(f"Generated datasets:\n  {p1}\n  {p2}")
