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


## Phase 3: Policy, Decision, Explanation & Advice
- **Date:** 2026-11-01
- **Status:** Done (All pass criteria met)
- **Built:**
  - `services/api/ml/policy.py`: `policy_rules` (F05), `decide` (F10).
  - `services/api/ml/explain.py`: `explain` (F13), SHAP TreeExplainer, plain-language templates.
  - `services/api/ml/counterfactual.py`: `counterfactuals` (F14), single-lever optimization search.
  - `services/api/data/personas.json`: 8 calibrated demo personas matching target outcomes.
  - Hypothesis test suite `services/api/tests/test_policy_explain.py` (F05, F10, F13, F14).
- **Test Counts:**
  - F05: 101 runs, 101 passed, 0 failed (PASS).
  - F10: 101 runs, 101 passed, 0 failed (PASS).
  - F13: 100 runs, 100 passed, 0 failed (PASS).
  - F14: 100 runs, 100 passed, 0 failed (PASS).
- **Ledger Status:** 15 PASS, 11 PENDING.


## Phase 4: API & Persistence
- **Date:** 2026-11-01
- **Status:** Done (All pass criteria met)
- **Built:**
  - `services/api/app/schemas.py`: `ApplicationIn` (F01), `AssessmentOut`, `BatchScoreIn`, `BatchScoreOut`.
  - `services/api/app/db.py`: `AssessmentRecord` (SQLModel SQLite), startup database seeding.
  - `services/api/app/pipeline.py`: `score_application` (F16), `assess_application` (F15).
  - `services/api/app/main.py`: Endpoints for `/api/score`, `/api/assess`, `/api/batch`, `/api/portfolio`, `/api/assessments`, `/api/personas`, `/api/model`, `/api/health`.
  - Hypothesis test suite `services/api/tests/test_api.py` (F01, F15, F16, F17, F18, F19, F22, F23).
- **Test Counts:**
  - F01: 101 runs, 101 passed, 0 failed (PASS).
  - F15: 100 runs, 100 passed, 0 failed (PASS).
  - F16: 100 runs, 100 passed, 0 failed (PASS).
  - F17: 100 runs, 100 passed, 0 failed (PASS).
  - F18: 100 runs, 100 passed, 0 failed (PASS).
  - F19: 100 runs, 100 passed, 0 failed (PASS).
  - F22: 100 runs, 100 passed, 0 failed (PASS).
  - F23: 100 runs, 100 passed, 0 failed (PASS).
- **Ledger Status:** 23 PASS, 3 PENDING.


## Phase 5: App Shell & Design System in Code
- **Date:** 2026-11-01
- **Status:** Done (All pass criteria met)
- **Built:**
  - `apps/web/lib/api.ts`: API client for FastAPI backend.
  - `apps/web/lib/ruler.ts`: Piecewise linear mapping from PD to ruler percentage.
  - Shared UI Primitives:
    - `CurrencyInput.tsx`: Real-time Indian currency formatting, words below.
    - `Slider.tsx`: 4px track, 14x24 haldi thumb stretching 12% on drag.
    - `SegmentedControl.tsx`: Sliding ink block (`spring.snappy`), white text inversion.
    - `RiskRuler.tsx`: 5 grade segments (A–E), spring needle marker.
    - `GradeChip.tsx`: 3D flipping grade letter block with decision colors.
    - `CommandPalette.tsx`: Instant modal search (`Cmd+K`/`Ctrl+K`).
  - App Shell: `NavRail.tsx`, `Header.tsx`, `app/(shell)/layout.tsx`, `app/template.tsx`.
  - Landing Page: `app/page.tsx`, `SentenceDemo.tsx`, inverted ink band, student details in footer.
  - Starter shell routes: `/assess`, `/what-if`, `/applicants`, `/batch`, `/portfolio`, `/model`, `/about`.
  - Vitest test suite `apps/web/tests/ui/primitives.test.tsx` (F24).
- **Test Counts:**
  - F24: 500 runs, 500 passed, 0 failed (PASS).
- **Ledger Status:** 24 PASS, 2 PENDING.


## Phase 6: Assess Signature Screen & Run Sequence
- **Date:** 2026-11-01
- **Status:** Done (All pass criteria met)
- **Built:**
  - `apps/web/components/assess/DecisionStamp.tsx`: Tactile rubber stamp with `spring.stamp`, -3deg tilt.
  - `apps/web/components/assess/Highlight.tsx`: Haldi highlighter swipe across decision text.
  - `apps/web/components/assess/FactorBars.tsx`: Diverging SHAP feature contribution bar chart.
  - `apps/web/components/assess/CounterfactualList.tsx`: Actionable recommendations with "Apply" button.
  - `apps/web/components/assess/ApplicationWizard.tsx`: 4-step wizard with step indicator and persona loader.
  - `apps/web/components/assess/AssessmentSheet.tsx`: Pop elevated card (1.5px ink border, 6px solid offset).
  - `apps/web/app/(shell)/assess/page.tsx`: Result-first layout (Cols 1–7 = AssessmentSheet, Cols 8–12 = ApplicationWizard) with mobile drawer.
  - Vitest test suite `apps/web/tests/ui/assess.test.tsx`.
- **Test Counts:**
  - F24: 500 runs, 500 passed, 0 failed (PASS).
- **Ledger Status:** 24 PASS, 2 PENDING.


## Phase 7: What-If, Applicants Table & Batch Processing
- **Date:** 2026-11-01
- **Status:** Done (All pass criteria met)
- **Built:**
  - `apps/web/app/(shell)/what-if/page.tsx`: 7 sensitivity sliders, live 150ms re-scoring, counterfactuals with apply patch.
  - `apps/web/app/(shell)/applicants/page.tsx`: Swiss table, name search, outcome filter, pagination, detail modal, delete action.
  - `apps/web/app/(shell)/batch/page.tsx`: Drag-and-drop CSV upload, template download, stacked grade strip, CSV results export.
- **Test Counts:**
  - F24: 500 runs, 500 passed, 0 failed (PASS).
- **Ledger Status:** 24 PASS, 2 PENDING.


## Phase 8: Portfolio, Model Transparency, About, PDF & Guided Demo
- **Date:** 2026-11-01
- **Status:** Done (All pass criteria met)
- **Built:**
  - `apps/web/app/(shell)/portfolio/page.tsx`: 4 headline KPI figures, 4 Recharts visual panels.
  - `apps/web/components/model/ModelPipeline.tsx`: 7-node interactive pipeline tracer.
  - `apps/web/app/(shell)/model/page.tsx`: AUC, Brier, ROC curve, Calibration curve, Feature importance, Model Card.
  - `apps/web/components/reports/ReportPdf.tsx`: Formal banking Sanction Memorandum with student name and USN in footer (F20).
  - `apps/web/components/demo/GuidedDemo.tsx`: Interactive 8-step guided tour.
  - Vitest test suite `apps/web/tests/ui/pdf.test.tsx` (F20).
- **Test Counts:**
  - F20: 100 runs, 100 passed, 0 failed (PASS).
  - F24: 500 runs, 500 passed, 0 failed (PASS).
- **Ledger Status:** 25 PASS, 1 PENDING.


## Phase 9: Full Monorepo Verification & Quality Gate
- **Date:** 2026-11-01
- **Status:** Done (All pass criteria met)
- **Built:**
  - `apps/web`: Next.js 16.4 production build passed with Turbopack, static prerendering of 10 pages.
  - TypeScript strict typecheck clean.
  - Full Python suite: 40 tests passed, 0 failures.
  - Full Vitest suite: 26 tests passed, 0 failures.
  - Zero-emoji scan: 0 emoji across 56 scanned files.
- **Test Counts:**
  - All 25 cards F01–F25 verified as PASS.
- **Ledger Status:** 25 PASS, 1 PENDING.






