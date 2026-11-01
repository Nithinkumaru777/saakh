# Phase 2: Data & Model Training

## Goal
Implement the synthetic dataset generator (F06) generating 5,000 realistic Indian retail lending applicants, the feature engineering pipeline (F04), train a monotonically constrained XGBoost classifier calibrated with Platt scaling (F07), and implement PD prediction (F08) and risk grade mapping A–E (F09). Save model artifacts and verify all 100-run properties in the ledger.

---

## Function Cards & Design Sections
- **SPEC §F06**: `generate_dataset(n=5000, seed=42) -> DataFrame`
- **SPEC §F04**: `engineer_features(app: dict | ApplicationIn) -> dict`
- **SPEC §F07**: `train_model(df: DataFrame) -> tuple[model, metrics]`
- **SPEC §F08**: `predict_pd(features: dict | np.ndarray) -> float`
- **SPEC §F09**: `pd_to_grade(pd: float) -> tuple[str, str]`
- **DESIGN §3.2**: Grade colors and definitions (A < 0.03, B < 0.07, C < 0.15, D < 0.30, E >= 0.30)
- **DESIGN §7.1**: Deterministic calibrated risk scores

---

## Step-by-Step Build Order

1. **Feature Engineering (`services/api/ml/features.py`)**:
   - `FEATURE_NAMES`: Fixed ordered list of model features.
   - `engineer_features(app: dict) -> dict`:
     - `reference_rate = BASE_RATES[loan_type] + 1.0`
     - `new_emi_ref = calc_emi(loan_amount, reference_rate, tenure_months)`
     - `foir = calc_foir(...)`
     - `lti = loan_amount / (12 * total_income)`
     - `is_secured = 1 if loan_type in ("home", "auto") and collateral_value > 0 else 0`
     - `ltv = loan_amount / collateral_value if collateral_value > 0 else None`
     - `ltv_filled = ltv if ltv is not None else 1.0`
     - `dti = (outstanding_debt + loan_amount) / (12 * total_income)`
     - `age_at_maturity = age + tenure_months / 12.0`
     - `no_credit_history = 1 if cibil_score == -1 else 0`
     - `cibil_filled = 650 if cibil_score == -1 else cibil_score`
     - One-hot encoding for `employment_type` (`salaried`, `self_employed`, `business_owner`), `residence` (`owned`, `rented`, `family`), and `loan_type` (`home`, `auto`, `personal`, `education`, `business`).
     - Returns dictionary with both raw derived financial features and the model input vector.

2. **Data Generation (`services/api/ml/data.py`)**:
   - `generate_dataset(n: int = 5000, seed: int = 42) -> pd.DataFrame`:
     - Uses numpy random generator with seed.
     - Generates valid distributions per SPEC §F06.
     - Calculates latent log-odds $z$ and Bernoulli label `default_12m = (sigmoid(z) > U(0,1)).astype(int)`.
     - Writes `services/api/data/applicants_5000.csv` and `services/api/data/batch_sample.csv` (50 rows).

3. **Model Training & Artifacts (`services/api/ml/model.py`)**:
   - `train_model(df: pd.DataFrame)`:
     - 70/15/15 stratified train/val/test split.
     - `XGBClassifier` with monotone constraints on 9 risk features:
       `cibil_filled: -1, foir: +1, lti: +1, ltv_filled: +1, dti: +1, credit_utilisation_pct: +1, missed_payments_24m: +1, enquiries_6m: +1, past_default: +1`.
     - Fit on train, early stopping on val.
     - Calibrate on validation split using sigmoid Platt scaling.
     - Compute test metrics: AUC (>= 0.80), Brier score (<= 0.11), KS statistic, confusion matrix, ROC curve points, calibration curve, global feature importance.
     - Baseline LogisticRegression for comparison.
     - Save artifacts to `services/api/artifacts/`: `model.joblib`, `metrics.json`, `model_card.md`.

4. **Inference & Risk Grading (`services/api/ml/model.py`)**:
   - `predict_pd(app_or_features: dict) -> float`: Calibrated probability in (0, 1), rounded to 4 decimal places.
   - `pd_to_grade(pd: float) -> tuple[str, str]`:
     - A: `< 0.03`, "Low risk"
     - B: `< 0.07`, "Low risk"
     - C: `< 0.15`, "Moderate"
     - D: `< 0.30`, "Elevated"
     - E: `>= 0.30`, "High"

5. **Hypothesis Property Tests (`services/api/tests/test_model.py`)**:
   - F06: 100 seeds generate valid datasets with default rate in [8%, 18%].
   - F04: 100 random applications generate valid feature vectors without NaN/inf.
   - F07: 100 bootstrap test samples maintain AUC >= 0.78.
   - F08: 100 executions proving monotonicity in CIBIL, FOIR, credit utilisation, missed payments, enquiries.
   - F09: 100 executions proving monotonic band mappings and boundary upper-band assignments.

---

## Pass Criteria
1. `services/api/artifacts/` contains valid `model.joblib`, `metrics.json`, and `model_card.md`.
2. XGBoost test AUC >= 0.80 and Brier <= 0.11.
3. `uv run --project services/api pytest` passes all tests.
4. `python scripts/test_ledger.py` confirms F04, F06, F07, F08, F09 all show PASS (>= 100 runs, 0 failures).
5. Write `.handoff/PHASE-02.result.md`.
