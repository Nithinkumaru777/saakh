# Phase 3 Result: Policy, Decision, Explanation & Advice

Status: **All pass criteria met**. Date: 2026-11-01.

## Summary of Completed Work
- **F05 (`policy_rules`)**: Implemented knock-outs K1–K6 and referral flags R1–R4 in `services/api/ml/policy.py`. Proved boundary conditions across 101 Hypothesis executions.
- **F10 (`decide`)**: Multi-tier decision engine in `services/api/ml/policy.py` prioritizing knock-outs, grade E, review flags / grades C/D, and clean A/B sanctions. Proved hierarchy and headlines across 101 Hypothesis executions.
- **F13 (`explain`)**: SHAP TreeExplainer attribution on base XGBoost margin in `services/api/ml/explain.py`. Collapses one-hot categorical features into logical factors, decomposes margin delta into percentage-point default probability impact, and generates plain-language explanatory sentences. Proved across 100 Hypothesis executions.
- **F14 (`counterfactuals`)**: Single-lever search engine in `services/api/ml/counterfactual.py` exploring loan amount reductions, tenure extensions, card balance paydowns, existing loan closures, and co-applicant additions. Proved across 100 Hypothesis executions that returned paths strictly reach targeted superior risk grades.
- **F22 (`personas`)**: Calibrated all 8 demo personas in `services/api/data/personas.json`. Verified that all 8 achieve their exact target outcomes (3 SANCTIONED, 2 REFER, 3 DECLINED).

## Ledger Excerpt
```
| F05 policy_rules | SPEC §F05 | 101 | 101 | 0 | PASS |
| F10 decide | SPEC §F10 | 101 | 101 | 0 | PASS |
| F13 explain | SPEC §F13 | 100 | 100 | 0 | PASS |
| F14 counterfactuals | SPEC §F14 | 100 | 100 | 0 | PASS |
```

## Pass Criteria Status
1. `uv run --project services/api pytest`: 31 passed.
2. `python scripts/test_ledger.py`: 15 PASS, 0 failed.
3. 8 demo personas verified against intended outcomes.
