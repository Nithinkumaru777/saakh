# Test ledger

Generated 2026-11-01 07:11 UTC by `python scripts/test_ledger.py`. Rule (SPEC §T): a function is done at >= 100 executions and 0 failures.

**25 of 26 function cards PASS.** PENDING means the function has not been built yet.

| Function | Spec | Executions | Passed | Failed | Status |
|---|---|---|---|---|---|
| F01 validate_application | SPEC §F01 | 101 | 101 | 0 | PASS |
| F02 calc_emi | SPEC §F02 | 101 | 101 | 0 | PASS |
| F03 calc_foir | SPEC §F03 | 101 | 101 | 0 | PASS |
| F04 engineer_features | SPEC §F04 | 100 | 100 | 0 | PASS |
| F05 policy_rules | SPEC §F05 | 101 | 101 | 0 | PASS |
| F06 generate_dataset | SPEC §F06 | 100 | 100 | 0 | PASS |
| F07 train_model | SPEC §F07 | 100 | 100 | 0 | PASS |
| F08 predict_pd | SPEC §F08 | 100 | 100 | 0 | PASS |
| F09 pd_to_grade | SPEC §F09 | 101 | 101 | 0 | PASS |
| F10 decide | SPEC §F10 | 101 | 101 | 0 | PASS |
| F11 indicative_rate | SPEC §F11 | 101 | 101 | 0 | PASS |
| F12 max_eligible_amount | SPEC §F12 | 101 | 101 | 0 | PASS |
| F13 explain | SPEC §F13 | 100 | 100 | 0 | PASS |
| F14 counterfactuals | SPEC §F14 | 100 | 100 | 0 | PASS |
| F15 assess (POST /api/assess) | SPEC §F15 | 100 | 100 | 0 | PASS |
| F16 score (POST /api/score) | SPEC §F16 | 100 | 100 | 0 | PASS |
| F17 batch_score (POST /api/batch) | SPEC §F17 | 100 | 100 | 0 | PASS |
| F18 portfolio_stats (GET /api/portfolio) | SPEC §F18 | 100 | 100 | 0 | PASS |
| F19 history list / get / delete | SPEC §F19 | 100 | 100 | 0 | PASS |
| F20 ReportPdf (web) | SPEC §F20 | 100 | 100 | 0 | PASS |
| F21 web formatting (lib/format.ts) | SPEC §F21 | 300 | 300 | 0 | PASS |
| F22 personas and sample data (GET /api/personas) | SPEC §F22 | 100 | 100 | 0 | PASS |
| F23 model page data (GET /api/model) | SPEC §F23 | 100 | 100 | 0 | PASS |
| F24 shell features (web) | SPEC §F24 | 500 | 500 | 0 | PASS |
| F25 quality gate: no emoji | SPEC §F25 | 200 | 200 | 0 | PASS |
| F26 report and docs | SPEC §F26 | 0 | 0 | 0 | PENDING |

## Suites (JUnit)

| Report | Tests | Failed | Skipped |
|---|---|---|---|
| junit-api.xml | 40 | 0 | 0 |
| junit-web.xml | 26 | 0 | 0 |
