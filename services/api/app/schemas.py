"""Pydantic data models and schemas for Saakh API.

SPEC §3.1, §3.2, and F01.
"""

from __future__ import annotations

import re
from typing import Any, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

# Allowed characters regex for full_name: letters, spaces, . ' -
NAME_REGEX = re.compile(r"^[A-Za-z\s\.\'\-]+$")

TYPE_BOUNDS: dict[str, dict[str, Any]] = {
    "personal": {"max_amount": 40_00_000, "min_tenure": 6, "max_tenure": 84},
    "auto": {"max_amount": 1_00_00_000, "min_tenure": 12, "max_tenure": 96},
    "education": {"max_amount": 1_50_00_000, "min_tenure": 12, "max_tenure": 180},
    "business": {"max_amount": 2_00_00_000, "min_tenure": 12, "max_tenure": 120},
    "home": {"max_amount": 10_00_00_000, "min_tenure": 60, "max_tenure": 360},
}


class ApplicationIn(BaseModel):
    """Loan application payload matching SPEC §3.1."""

    full_name: str = Field(..., min_length=2, max_length=80)
    age: int = Field(..., ge=18, le=75)
    employment_type: Literal["salaried", "self_employed", "business_owner"]
    years_in_job: float = Field(..., ge=0.0, le=40.0)
    city_tier: Literal[1, 2, 3]
    dependents: int = Field(..., ge=0, le=6)
    residence: Literal["owned", "rented", "family"]
    monthly_income: int = Field(..., ge=10_000, le=50_00_000)
    other_monthly_income: int = Field(default=0, ge=0, le=20_00_000)
    cibil_score: int = Field(..., description="300-900 or -1 for new to credit")
    credit_history_years: float = Field(..., ge=0.0, le=40.0)
    open_credit_lines: int = Field(..., ge=0, le=30)
    credit_utilisation_pct: float = Field(..., ge=0.0, le=100.0)
    missed_payments_24m: int = Field(..., ge=0, le=24)
    enquiries_6m: int = Field(..., ge=0, le=20)
    past_default: bool = Field(default=False)
    existing_emi: int = Field(default=0, ge=0, le=20_00_000)
    outstanding_debt: int = Field(default=0, ge=0, le=5_00_00_000)
    loan_type: Literal["home", "auto", "personal", "education", "business"]
    loan_amount: int = Field(..., ge=10_000)
    tenure_months: int = Field(...)
    collateral_value: int = Field(default=0, ge=0)
    purpose: Optional[str] = Field(default="", max_length=200)

    @field_validator("full_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        s = v.strip()
        if not NAME_REGEX.match(s):
            raise ValueError("Full name must contain only letters, spaces, hyphens, periods, and apostrophes.")
        return s

    @field_validator("cibil_score")
    @classmethod
    def validate_cibil(cls, v: int) -> int:
        if v != -1 and not (300 <= v <= 900):
            raise ValueError("CIBIL score must be between 300 and 900, or -1 for new to credit.")
        return v

    @model_validator(mode="after")
    def validate_cross_field(self) -> ApplicationIn:
        # Cross-field: years_in_job <= age - 16
        if self.years_in_job > (self.age - 16):
            raise ValueError(f"Years in job ({self.years_in_job}) cannot exceed age minus 16 ({self.age - 16}).")

        # Cross-field: credit_history_years == 0 if new to credit (-1)
        if self.cibil_score == -1 and self.credit_history_years > 0:
            raise ValueError("Credit history years must be 0 for applicants new to credit.")

        # Cross-field: collateral required > 0 for home and auto
        if self.loan_type in ("home", "auto") and self.collateral_value <= 0:
            raise ValueError(f"Collateral value is required and must be greater than 0 for a {self.loan_type} loan.")

        # Cross-field: Loan amount and tenure bounds by type
        bounds = TYPE_BOUNDS.get(self.loan_type)
        if bounds:
            max_amt = bounds["max_amount"]
            if self.loan_amount > max_amt:
                raise ValueError(f"Loan amount for a {self.loan_type} loan cannot exceed ₹{max_amt:,}.")

            min_ten = bounds["min_tenure"]
            max_ten = bounds["max_tenure"]
            if not (min_ten <= self.tenure_months <= max_ten):
                raise ValueError(f"Tenure for a {self.loan_type} loan must be {min_ten}–{max_ten} months.")

        return self


class FactorOut(BaseModel):
    feature: str
    label: str
    direction: Literal["raises", "lowers"]
    contribution_pp: float
    sentence: str


class CounterfactualOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    lever: str
    from_: Any = Field(..., alias="from")
    to: Any
    relative_change: float
    new_grade: str
    new_pd: float
    sentence: str


class KnockoutOut(BaseModel):
    code: str
    message: str


class FlagOut(BaseModel):
    code: str
    message: str


class FeaturesOut(BaseModel):
    total_income: int
    reference_rate: float
    new_emi_ref: int
    foir: float
    lti: float
    ltv: Optional[float] = None
    dti: float
    age_at_maturity: float
    no_credit_history: bool


class AssessmentOut(BaseModel):
    """Assessment output schema matching SPEC §3.2."""

    id: str
    created_at: str
    application: ApplicationIn
    features: FeaturesOut
    pd: float
    grade: str
    grade_label: str
    outcome: Literal["SANCTIONED", "REFER", "DECLINED"]
    knockouts: list[KnockoutOut]
    flags: list[FlagOut]
    indicative_rate: Optional[float] = None
    emi: int
    max_eligible_amount: int
    factors: list[FactorOut]
    counterfactuals: list[CounterfactualOut] = Field(default_factory=list)
    headline: str
    model_version: str = "xgb-2026.11-v1"
