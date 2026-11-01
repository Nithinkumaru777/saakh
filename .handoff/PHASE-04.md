# Phase 4: API Endpoints & Persistence

## Goal
Implement the complete FastAPI backend suite in `services/api/app/`: Pydantic application validation (F01), SQLModel SQLite database and seeding (F15, F18, F19), fast scoring path `/api/score` (F16), full assessment and persistence `/api/assess` (F15), CSV batch evaluation `/api/batch` (F17), portfolio aggregation `/api/portfolio` (F18), history CRUD `/api/assessments` (F19), persona loader `/api/personas` (F22), and model transparency `/api/model` (F23). Verify all 100-run properties in the ledger and ensure `/api/score` p95 < 150 ms.

---

## Function Cards & API Endpoints
- **SPEC §3.1 & F01**: Pydantic `ApplicationIn` schema & cross-field validators
- **SPEC §3.2 & F15**: `POST /api/assess` (full pipeline + SQLModel persistence)
- **SPEC §F16**: `POST /api/score` (fast path, no counterfactuals, no DB write; p95 < 150 ms)
- **SPEC §F17**: `POST /api/batch` & `GET /api/batch/template` (CSV multipart processing)
- **SPEC §F18**: `GET /api/portfolio` (statistical aggregation over stored loans)
- **SPEC §F19**: `GET /api/assessments`, `GET /api/assessments/{id}`, `DELETE /api/assessments/{id}`
- **SPEC §F22**: `GET /api/personas` + DB seeding (8 personas + 120 synthetic assessments)
- **SPEC §F23**: `GET /api/model` (model card, metrics, ROC curve, pipeline nodes)

---

## Step-by-Step Build Order

1. **Schemas (`services/api/app/schemas.py`)**:
   - `ApplicationIn`: All 22 fields from SPEC §3.1 with field validators:
     - `years_in_job <= age - 16`
     - `credit_history_years == 0` when `cibil_score == -1`
     - `collateral_value > 0` required for `home` and `auto`
     - Type bounds: personal (10k–40L, 6–84m), auto (10k–1Cr, 12–96m), education (10k–1.5Cr, 12–180m), business (10k–2Cr, 12–120m), home (10k–10Cr, 60–360m).
   - `AssessmentOut`: JSON structure matching SPEC §3.2 (`id`, `created_at`, `application`, `features`, `pd`, `grade`, `grade_label`, `outcome`, `knockouts`, `flags`, `indicative_rate`, `emi`, `max_eligible_amount`, `factors`, `counterfactuals`, `headline`, `model_version`).

2. **Database & SQLModel (`services/api/app/db.py`)**:
   - `AssessmentRecord(SQLModel, table=True)` storing assessment JSON, id, created_at, full_name, outcome, grade, loan_type, loan_amount, pd.
   - SQLite database path `services/api/data/saakh.db`.
   - Seeding function: On startup, if table is empty, seed with the 8 demo personas + 120 generated records from `data/applicants_5000.csv`.

3. **FastAPI Endpoints (`services/api/app/main.py` & routers)**:
   - `POST /api/score`: F01 -> F04 -> F05 -> F08 -> F09 -> F10 -> F11 -> F02 -> F12 -> F13 (fast path).
   - `POST /api/assess`: Same as score + F14 + save to DB.
   - `POST /api/batch`: Parse CSV (up to 5,000 rows), return `{results: [...], errors: [...]}`.
   - `GET /api/batch/template`: Return CSV headers.
   - `GET /api/portfolio`: SQL aggregation (counts, rates, avg_pd, expected_loss, grade distribution, histogram, loan type breakdown, FOIR-vs-PD points).
   - `GET /api/assessments`: Search query `q`, filter `outcome`, `grade`, `loan_type`, pagination `page`.
   - `GET /api/assessments/{id}` & `DELETE /api/assessments/{id}`.
   - `GET /api/personas`: Return 8 personas from `data/personas.json`.
   - `GET /api/model`: Return metrics, model card, global importance, pipeline steps.

4. **Hypothesis & API Tests (`services/api/tests/test_api.py`)**:
   - F01: 100 valid applications pass, 100 invalid applications fail with 422.
   - F15: 100 generated applications assessed and retrieved by ID.
   - F16: 100 score calls verify identical pd/grade/outcome as assess, latency p95 < 150 ms.
   - F17: 100 generated CSVs (mix of valid and error rows) correctly parsed.
   - F18: 100 portfolio queries verify mathematical consistency and zero handling.
   - F19: 100 history queries test search, filter, pagination, and deletion.
   - F22: 100 calls verify persona endpoints and DB seed presence.
   - F23: 100 calls verify model metrics and monotonicity.

---

## Pass Criteria
1. `uv run --project services/api pytest` passes all tests.
2. `python scripts/test_ledger.py` confirms F01, F15, F16, F17, F18, F19, F22, F23 show PASS (>= 100 runs, 0 failures).
3. `/api/score` p95 latency benchmark < 150 ms.
4. Write `.handoff/PHASE-04.result.md`.
