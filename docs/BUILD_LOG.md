# Saakh Build Log

## Phase 0: Scaffold, Tokens & Tooling
- **Date:** 2026-11-01
- **Status:** Done (All pass criteria met)
- **Built:**
  - Monorepo structure (`apps/web` Next.js 16 / React 19 / TS strict / Tailwind v4; `services/api` FastAPI / uv).
  - Design tokens ("Ink & Haldi" light and "Night ledger" dark) in `app/globals.css`, fonts (Source Serif 4 + Geist), `lib/motion.ts`, `AnimatedIcon` with 5 presets, NeoPOP button in 5 variants.
  - `/design-system` test page with screenshots in `docs/screenshots/phase-00-design-system-light.png` and `docs/screenshots/phase-00-design-system-dark.png`.
  - 100-run test infrastructure (`@counts` fixture in `services/api/tests/conftest.py`, `countRuns` in `apps/web/tests/count-runs.ts`, `scripts/test_ledger.py`, and `scripts/check_no_emoji.mjs`).
- **Test Counts:**
  - F25 (Quality gate: no emoji): 200 runs, 0 failures (PASS).
  - JUnit API: 11 tests passed.
  - JUnit Web: 12 tests passed.
- **Ledger Status:** 1 PASS, 25 PENDING.


## Phase 1: Finance Core
- **Date:** 2026-11-01
- **Status:** Done (All pass criteria met)
- **Built:**
  - `services/api/ml/finance.py`: `calc_emi` (F02), `calc_foir` (F03), `indicative_rate` (F11), `max_eligible_amount` (F12).
  - `apps/web/lib/format.ts`: `formatINR`, `formatINRShort`, `parseINR`, `inrToWords`, `formatPct` (F21).
  - Hypothesis test suite `services/api/tests/test_finance.py` (F02, F03, F11, F12).
  - Fast-check test suite `apps/web/tests/format.test.ts` (F21).
- **Test Counts:**
  - F02: 101 runs, 101 passed, 0 failed (PASS).
  - F03: 101 runs, 101 passed, 0 failed (PASS).
  - F11: 101 runs, 101 passed, 0 failed (PASS).
  - F12: 101 runs, 101 passed, 0 failed (PASS).
  - F21: 300 runs, 300 passed, 0 failed (PASS).
  - F25: 200 runs, 200 passed, 0 failed (PASS).
- **Ledger Status:** 6 PASS, 20 PENDING.


## Phase 2: Data & Model
- **Date:** 2026-11-01
- **Status:** Done (All pass criteria met)
- **Built:**
  - `services/api/ml/features.py`: `engineer_features` (F04), `FEATURE_NAMES`, `MONOTONE_CONSTRAINTS`.
  - `services/api/ml/data.py`: `generate_dataset` (F06), synthetic data generation for 5,000 records.
  - `services/api/ml/model.py`: `train_model` (F07), `predict_pd` (F08), `pd_to_grade` (F09), `PlattCalibrator`.
  - Artifacts: `artifacts/model.joblib`, `artifacts/metrics.json`, `artifacts/model_card.md`.
  - Dataset files: `data/applicants_5000.csv`, `data/batch_sample.csv`.
  - Hypothesis test suite `services/api/tests/test_model.py` (F06, F04, F07, F08, F09).
- **Test Counts:**
  - F04: 100 runs, 100 passed, 0 failed (PASS).
  - F06: 100 runs, 100 passed, 0 failed (PASS).
  - F07: 100 runs, 100 passed, 0 failed (PASS).
  - F08: 100 runs, 100 passed, 0 failed (PASS).
  - F09: 101 runs, 101 passed, 0 failed (PASS).
- **Ledger Status:** 11 PASS, 15 PENDING.
