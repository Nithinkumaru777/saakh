# Phase 3: Policy, Decision, Explanation & Advice

## Goal
Implement policy rule verification (F05) covering hard knock-outs K1–K6 and referral flags R1–R4, the final multi-stage decision engine (F10), SHAP TreeExplainer feature attribution with plain-language explanations (F13), and single-lever counterfactual search (F14). Verify all 100-run properties in the ledger and confirm the 8 personas match their target outcomes.

---

## Function Cards & Design Sections
- **SPEC §F05**: `policy_rules(app: dict, features: dict) -> tuple[list[dict], list[dict]]`
- **SPEC §F10**: `decide(app: dict) -> tuple[str, str]` (outcome and headline)
- **SPEC §F13**: `explain(app: dict) -> list[dict]` (SHAP feature attribution)
- **SPEC §F14**: `counterfactuals(app: dict) -> list[dict]` (actionable advice paths)
- **SPEC §F22**: 8 demo personas
- **DESIGN §3.2**: Outcomes SANCTIONED, REFER, DECLINED
- **DESIGN §7.2**: Assessment run sequence copy and explanations

---

## Step-by-Step Build Order

1. **Policy Rules (`services/api/ml/policy.py`)**:
   - `policy_rules(app: dict, features: dict) -> tuple[list[dict], list[dict]]`:
     - Knock-outs:
       - K1: `age < 21`
       - K2: `age_at_maturity > 65` (salaried) or `> 70` (others)
       - K3: `300 <= cibil_score < 600` (does not knock out -1)
       - K4: `foir > 0.65`
       - K5: `ltv > 0.90` (home) or `> 0.85` (auto)
       - K6: `existing_emi / total_income >= 0.55`
     - Flags:
       - R1: `past_default == True`
       - R2: `missed_payments_24m >= 3`
       - R3: new to credit (`cibil_score == -1`) and `loan_amount > 5,00,000`
       - R4: `0.55 < foir <= 0.65`
     - Returns `(knockouts, flags)` with `code` and `message`.

2. **Decision Engine (`services/api/ml/policy.py`)**:
   - `decide(app: dict, features: dict, pd_val: float, grade: str) -> tuple[str, str]`:
     - 1. Any knock-out -> `DECLINED`, headline "Declined — {first knock-out message, short}".
     - 2. Else grade E -> `DECLINED`, headline "Declined — estimated default risk {pd_pct} %".
     - 3. Else any flag or grade C/D -> `REFER`, headline "Refer for review — grade {grade}".
     - 4. Else (A/B, no flags) -> `SANCTIONED`, headline "Sanctioned at grade {grade}".

3. **SHAP Explanation (`services/api/ml/explain.py`)**:
   - `explain(app: dict) -> list[dict]`:
     - SHAP `TreeExplainer` on base XGBoost margin.
     - Group one-hot features (`loan_type`, `employment_type`, `residence`) to single logical factors.
     - `contribution_pp_i = 100 * (P(m) - P(m - shap_i))`
     - Sort by |shap| desc, return top 6.
     - Plain-language sentences containing real numbers.

4. **Counterfactual Search (`services/api/ml/counterfactual.py`)**:
   - `counterfactuals(app: dict) -> list[dict]`:
     - Target: 1 grade better (D->C, C->B, B->A), or clearing knock-outs if DECLINED.
     - Levers: `loan_amount` (-5% to -60%), `tenure_months` (+12 to max), `credit_utilisation_pct` (-5 to 10), `existing_emi` (-10% to 0), `co_applicant_income` (+10% to +100%).
     - Up to 3 best paths.

5. **Personas & Sample Data (`services/api/data/personas.json`)**:
   - Encode the 8 demo personas from SPEC §F22.
   - Verify that all 8 achieve their expected outcome.

6. **Hypothesis Property Tests (`services/api/tests/test_policy_explain.py`)**:
   - F05: 100 property executions testing boundaries for K1–K6 and R1–R4.
   - F10: 100 property executions verifying decision branches and priority hierarchy.
   - F13: 100 property executions verifying SHAP attribution consistency, margin additivity, and directions.
   - F14: 100 property executions verifying that returned paths strictly reach the targeted new_grade and new_pd.

---

## Pass Criteria
1. `uv run --project services/api pytest` passes all tests.
2. `python scripts/test_ledger.py` confirms F05, F10, F13, F14 show PASS (>= 100 runs, 0 failures).
3. 8 personas verified to match intended outcomes.
4. Write `.handoff/PHASE-03.result.md`.
