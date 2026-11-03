"""Database connection, SQLModel tables, and initial seeding.

SPEC §F15, §F18, §F19, §F22.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Generator, Optional
from sqlmodel import Field, Session, SQLModel, create_engine, select

DB_DIR = Path(__file__).resolve().parents[1] / "data"
DB_DIR.mkdir(parents=True, exist_ok=True)
import os  # noqa: E402

# SAAKH_DB_PATH lets deployments put the database on a persistent volume and lets the
# test suite use a throwaway file instead of the committed demo database.
DB_PATH = Path(os.environ.get("SAAKH_DB_PATH") or DB_DIR / "saakh.db")
DB_PATH.parent.mkdir(parents=True, exist_ok=True)
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


class AssessmentRecord(SQLModel, table=True):
    """Persisted credit assessment record."""

    id: str = Field(primary_key=True, index=True)
    created_at: str = Field(index=True)
    full_name: str = Field(index=True)
    outcome: str = Field(index=True)  # SANCTIONED | REFER | DECLINED
    grade: str = Field(index=True)    # A | B | C | D | E
    loan_type: str = Field(index=True)
    loan_amount: int
    pd: float
    assessment_json: str  # Full serialized AssessmentOut


def init_db() -> None:
    """Initialize database tables."""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """Yield database session."""
    with Session(engine) as session:
        yield session


def seed_database_if_empty() -> None:
    """Seed the database with the 8 demo personas + 120 generated records if empty."""
    init_db()
    with Session(engine) as session:
        count = session.exec(select(AssessmentRecord)).first()
        if count is not None:
            return  # Already seeded

        # Avoid circular imports by importing pipeline lazily
        from app.pipeline import assess_application

        # 1. Seed 8 demo personas
        personas_path = DB_DIR / "personas.json"
        if personas_path.exists():
            with open(personas_path, encoding="utf-8") as f:
                personas = json.load(f)
            for p in personas:
                try:
                    assess_application(p, persist=True, session=session)
                except Exception as e:
                    print(f"Error seeding persona {p.get('full_name')}: {e}")

        # 2. Seed 120 generated records from applicants_5000.csv
        applicants_path = DB_DIR / "applicants_5000.csv"
        if applicants_path.exists():
            import pandas as pd
            df = pd.read_csv(applicants_path)
            # Take 120 records (starting after initial rows)
            sample_df = df.iloc[10:130]
            for _, row in sample_df.iterrows():
                try:
                    row_dict = row.to_dict()
                    # Clean types
                    row_dict["age"] = int(row_dict["age"])
                    row_dict["city_tier"] = int(row_dict["city_tier"])
                    row_dict["dependents"] = int(row_dict["dependents"])
                    row_dict["monthly_income"] = int(row_dict["monthly_income"])
                    row_dict["other_monthly_income"] = int(row_dict["other_monthly_income"])
                    row_dict["cibil_score"] = int(row_dict["cibil_score"])
                    row_dict["open_credit_lines"] = int(row_dict["open_credit_lines"])
                    row_dict["missed_payments_24m"] = int(row_dict["missed_payments_24m"])
                    row_dict["enquiries_6m"] = int(row_dict["enquiries_6m"])
                    row_dict["existing_emi"] = int(row_dict["existing_emi"])
                    row_dict["outstanding_debt"] = int(row_dict["outstanding_debt"])
                    row_dict["loan_amount"] = int(row_dict["loan_amount"])
                    row_dict["tenure_months"] = int(row_dict["tenure_months"])
                    row_dict["collateral_value"] = int(row_dict["collateral_value"])
                    row_dict["past_default"] = bool(row_dict["past_default"])

                    assess_application(row_dict, persist=True, session=session)
                except Exception:
                    pass
