# Phase 2 Result: Data & Model

Status: **All pass criteria met**. Date: 2026-11-01.

## Summary of Completed Work
- **F06 (`generate_dataset`)**: Synthetic Indian retail lending applicant generator written in `services/api/ml/data.py`. Generates 5,000 realistic rows with default rate in [8%, 18%]. Writes `data/applicants_5000.csv` and `data/batch_sample.csv`. Proved across 100 Hypothesis seed runs.
- **F04 (`engineer_features`)**: Feature engineering pipeline in `services/api/ml/features.py` extracting derived financial indicators (`total_income`, `reference_rate`, `new_emi_ref`, `foir`, `lti`, `ltv_filled`, `dti`, `age_at_maturity`, `no_credit_history`, `cibil_filled`) and one-hot encodings. Proved across 100 Hypothesis executions.
- **F07 (`train_model`)**: XGBoost with 9 monotone constraints (`cibil_filled: -1, foir: +1, lti: +1, ltv_filled: +1, dti: +1, credit_utilisation_pct: +1, missed_payments_24m: +1, enquiries_6m: +1, past_default: +1`) and sigmoid Platt scaling calibration.
  - Test ROC AUC: **0.8074** (>= 0.80)
  - Test Brier score: **0.0899** (<= 0.11)
  - Baseline Scorecard Logistic Regression AUC: **0.7810** (XGB AUC >= Baseline AUC)
  - Proved stability across 100 bootstrap test samples (AUC >= 0.77).
  - Saved artifacts: `artifacts/model.joblib`, `artifacts/metrics.json`, `artifacts/model_card.md`.
- **F08 (`predict_pd`)**: Calibrated probability of default in (0, 1). Monotonicity in CIBIL, FOIR, utilisation, and missed payments proved across 100 Hypothesis executions.
- **F09 (`pd_to_grade`)**: Calibrated risk grade bands A (< 0.03), B (< 0.07), C (< 0.15), D (< 0.30), E (>= 0.30) with upper boundary assignment. Proved across 101 executions.

## Ledger Excerpt
```
| F04 engineer_features | SPEC §F04 | 100 | 100 | 0 | PASS |
| F06 generate_dataset | SPEC §F06 | 100 | 100 | 0 | PASS |
| F07 train_model | SPEC §F07 | 100 | 100 | 0 | PASS |
| F08 predict_pd | SPEC §F08 | 100 | 100 | 0 | PASS |
| F09 pd_to_grade | SPEC §F09 | 101 | 101 | 0 | PASS |
```

## Pass Criteria Status
1. `services/api/artifacts/` contains `model.joblib`, `metrics.json`, and `model_card.md`.
2. XGB test AUC >= 0.80 and Brier <= 0.11.
3. `uv run --project services/api pytest`: 25 passed.
4. `python scripts/test_ledger.py`: 11 PASS, 0 failed.
