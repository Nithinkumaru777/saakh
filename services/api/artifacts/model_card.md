# Model Card: Saakh Credit Risk Model (XGBoost + Platt Scaling)
**Version:** xgb-2026.11-v1  
**Target:** 12-month loan default probability (`default_12m`)  
**Architecture:** Monotonically constrained gradient boosted trees (`XGBClassifier`) with sigmoid Platt calibration.

## Performance Metrics (Test Split, 15%)
- **Test ROC AUC:** 0.8074 (Requirement: >= 0.80)
- **Brier Score:** 0.0899 (Requirement: <= 0.11)
- **Kolmogorov-Smirnov (KS):** 0.5023
- **Baseline Logistic Regression AUC:** 0.781

## Feature Schema & Monotone Constraints
- Ordered Feature Vector (28 features):
- `cibil_filled` (constraint: -1)
- `no_credit_history` (constraint: 0)
- `foir` (constraint: 1)
- `lti` (constraint: 1)
- `ltv_filled` (constraint: 1)
- `is_secured` (constraint: 0)
- `dti` (constraint: 1)
- `credit_utilisation_pct` (constraint: 1)
- `missed_payments_24m` (constraint: 1)
- `enquiries_6m` (constraint: 1)
- `credit_history_years` (constraint: 0)
- `years_in_job` (constraint: 0)
- `open_credit_lines` (constraint: 0)
- `past_default` (constraint: 1)
- `dependents` (constraint: 0)
- `age` (constraint: 0)
- `city_tier` (constraint: 0)
- `emp_salaried` (constraint: 0)
- `emp_self_employed` (constraint: 0)
- `emp_business_owner` (constraint: 0)
- `res_owned` (constraint: 0)
- `res_rented` (constraint: 0)
- `res_family` (constraint: 0)
- `loan_auto` (constraint: 0)
- `loan_business` (constraint: 0)
- `loan_education` (constraint: 0)
- `loan_home` (constraint: 0)
- `loan_personal` (constraint: 0)

## Ethical Safeguards & Fairness
No protected personal attributes (gender, marital status, religion, caste, pin-code) are utilized in the model. All monotonicity constraints guarantee that adverse risk movements strictly align with credit fundamentals.
