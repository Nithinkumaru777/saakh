# Saakh — AI-Based Loan Eligibility & Risk Assessment System
### AI for Finance — CIA-2 · Topic 4
**Student:** NITHIN KUMAR U · **USN:** 2102508611  
**Submission Date:** November 2026

---

## 1. Overview
**Saakh** is an AI-powered credit underwriting and risk assessment platform built for Indian retail banking and NBFCs. It bridges the gap between rigid regulatory policy rules and black-box credit scores by combining:
1. **Deterministic Regulatory Gates:** Automated evaluation of RBI knockout rules (age limits, minimum income, CIBIL floors, FOIR ceilings).
2. **Calibrated Monotone XGBoost Model:** 28 engineered financial features trained with monotone constraints, post-hoc calibrated via Platt Scaling (Test AUC: 0.8074, Brier Score: 0.0899).
3. **Transparent Explainability:** TreeSHAP marginal percentage-point feature attributions and plain-language narrative sentences.
4. **Actionable Counterfactual Advice:** Single-lever optimization recommendations ("Paths to a better grade") with one-click form patching.
5. **Ink & Haldi Design System:** Swiss-editorial typography (Source Serif 4 + Geist), zero emoji discipline, and CRED NeoPOP extruded tactile physical buttons.
6. **100-Run Testing Rule:** All 26 function cards (F01–F26) verified with $\ge 100$ property-based executions and 0 failures.

---

## 2. Architecture & Monorepo Structure

```
AI FOR FINANCE CIA-2/
├── apps/web/                    # Next.js 16.4.3 (Turbopack, React 19, Tailwind v4, Motion)
│   ├── app/                     # App router pages: landing, assess, what-if, applicants, batch, portfolio, model, about
│   ├── components/              # Shared primitives (CurrencyInput, Slider, RiskRuler, GradeChip, NeoPOP Button)
│   ├── lib/                     # API client, INR formatting (formatINR, inrToWords), motion tokens, ruler mapping
│   └── tests/                   # Vitest unit and fast-check property test suites
├── services/api/                # FastAPI Microservice & Python ML Risk Engine
│   ├── app/                     # FastAPI endpoints (/api/score, /api/assess, /api/batch, /api/portfolio, /api/model)
│   ├── ml/                      # Data generator, feature engineering, XGBoost training, Platt calibration, TreeSHAP
│   ├── artifacts/               # Trained model.joblib, metrics.json, model_card.md
│   ├── data/                    # applicants_5000.csv, personas.json, saakh.db (SQLite SQLModel)
│   └── tests/                   # Pytest + Hypothesis 100-run test suites
├── docs/                        # Academic deliverables
│   ├── REPORT.md                # Full 8-page academic research report
│   ├── REPORT.docx              # Formatted Microsoft Word submission report
│   ├── DEMO_SCRIPT.md           # 5-minute timed presentation script
│   └── BUILD_LOG.md             # Complete 11-phase development audit log
├── scripts/                     # Tooling & automated verification
│   ├── test_ledger.py           # 100-run verification ledger aggregator
│   ├── check_no_emoji.mjs       # Zero emoji scanner
│   └── export_report_docx.py    # Report docx generator
└── tests/ledger/                # LEDGER.md, counts.json, counts.web.json, junit XMLs
```

---

## 3. Quick Start & Execution

### One-Click Launch (Recommended for Windows)
Double-click `start.bat` in the project root (or run `.\start.bat` from terminal).
It automatically:
1. Validates `uv` and `pnpm` availability.
2. Spawns the FastAPI backend on `http://localhost:8000`.
3. Spawns the Next.js web application on `http://localhost:3000`.
4. Opens your default web browser directly to `http://localhost:3000`.

To stop both services at any time, run `stop.bat` or close the terminal windows.

---

### Manual Launch

#### 1. Launch the Backend Risk Engine
```powershell
# From project root
cd services/api
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API documentation is available at `http://localhost:8000/docs`.

### 2. Launch the Web Application
```powershell
# In a new terminal from project root
cd apps/web
pnpm dev
```
Open `http://localhost:3000` in your browser.

### Production Deployment

```powershell
# API (no --reload; put SAAKH_DB_PATH on a persistent volume)
cd services/api
$env:SAAKH_CORS_ORIGINS = "https://saakh.example.com"
$env:SAAKH_DB_PATH = "D:\saakh-data\saakh.db"
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000

# Web (NEXT_PUBLIC_API_URL is baked in at build time)
cd apps/web
$env:NEXT_PUBLIC_API_URL = "https://api.saakh.example.com"
pnpm build
pnpm start
```

| Variable | Default | Purpose |
|---|---|---|
| `SAAKH_CORS_ORIGINS` | `http://localhost:3000` | Comma-separated origins allowed to call the API |
| `SAAKH_DB_PATH` | `services/api/data/saakh.db` | SQLite file location (tests use a temp file automatically) |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | API base URL used by the browser |

Production behaviour:

- **Model warm-up:** the XGBoost bundle and SHAP explainer load at startup, so the first `/api/score` after a restart is as fast as the rest (~12 ms instead of ~200 ms).
- **Batch limits (SPEC §F17):** `POST /api/batch` rejects files over 5 MB (`413`), more than 5,000 rows, or a header that does not match the template (`422`, naming the missing/unknown columns).
- **History:** `GET /api/assessments` counts and paginates in SQL; `%` and `_` in the search box match literally.

### Real-time Updates

`GET /api/events` is a Server-Sent Events stream. Whenever an assessment is saved (`/api/assess`, `/api/batch?save=true`) or deleted, every open browser receives a `change` frame and the **Applicants** table and **Portfolio** charts refresh in place, so several loan officers see each other's decisions without reloading. A status chip in the top bar shows **Live / Reconnecting / Offline**; assessments from another desk raise a toast; after a reconnect the page re-syncs anything it missed. The feed is in-process (one API worker); with several workers, back `app/events.py` with Redis pub/sub.

---

## 4. Quality Verification & Testing

### Run All 100-Run Tests & Verify Ledger
```powershell
# Run backend pytest suite (40 tests, all >= 100 runs)
uv run --project services/api pytest services/api/tests/ --junitxml=tests/ledger/junit-api.xml

# Run frontend vitest suite (26 tests, all >= 100 runs)
pnpm --prefix apps/web test

# Update and verify test ledger (all 26 cards PASS)
uv run python scripts/test_ledger.py

# Verify zero emoji discipline across all files
node scripts/check_no_emoji.mjs
```

---

## 5. Academic Accreditation
- **Course:** AI for Finance — CIA-2 · Topic 4
- **Project Title:** AI-Based Loan Eligibility and Risk Assessment System
- **Student Name:** NITHIN KUMAR U
- **USN:** 2102508611
- **Academic Year:** 2026–2027

## Tutorial videos

The Tutorials page plays the full guide and one short clip per feature. The clips are generated, and are not in git because of their size (GitHub allows 100 MB per file). To create them after cloning, run `node video/web-export.mjs` from the project root; it needs `video/output/` from the video pipeline and ffmpeg. They are written to `apps/web/public/tutorial/`. Copy that folder when deploying. Without it, the page still opens and shows "This video could not be loaded".


## Accounts and production deployment

### Customer accounts
- Visitors can open Home, About and Model without an account. The Home page live score stays public.
- Assess, What-if, Applicants, Batch, Portfolio and Profile require sign in. Create an account from the Sign in page.
- Profile page: name, mobile, city, employment, monthly income, change password, sign out, delete account.
- Passwords are hashed with scrypt (salted). Sessions are HMAC-signed bearer tokens (7 days by default).
  Five failed sign-ins for one email from one address locks that pair for 10 minutes.
- Auth endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `GET|PATCH|DELETE /api/auth/me`,
  `POST /api/auth/change-password`.

### Configure
Copy `.env.example` to `.env` and set at least:

| Variable | Purpose |
| --- | --- |
| `SAAKH_ENV=production` | Hides `/docs`, enables HSTS, makes the secret key mandatory |
| `SAAKH_SECRET_KEY` | Token signing key (`python -c "import secrets; print(secrets.token_hex(32))"`) |
| `SAAKH_CORS_ORIGINS` | Public website URL(s), comma separated |
| `SAAKH_DB_PATH` | SQLite file on a persistent disk or volume |
| `NEXT_PUBLIC_API_URL` | Public API URL. Baked in at build time, so set it before `pnpm build` |

### Deploy
- Docker: `docker compose --env-file .env up --build -d` (API on 8000, web on 3000).
  Put both behind HTTPS (a reverse proxy such as Caddy or nginx, or your host's TLS).
- Without Docker: run `uvicorn app.main:app --host 0.0.0.0 --port 8000` in `services/api`
  and `pnpm build && pnpm start` in `apps/web`, with the variables above exported.

### Known limits
- The assessment history, portfolio and seeded demo records are shared by all signed-in users
  (they are not yet filtered per customer).
- SQLite suits a single server. Move to PostgreSQL before running several API instances.
- The model is trained on synthetic data; decisions are illustrative, not real credit decisions.
