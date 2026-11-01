# SPEC.md — Saakh functional specification

> Topic 4 · AI-Based Loan Eligibility and Risk Assessment System
> AI for Finance CIA-2 · **NITHIN KUMAR U** · USN **2102508611**

Every function in this file has an ID (`F01`…). Antigravity hands these cards to Claude Code one phase at a time.
Claude Code implements each card exactly, then proves it with **100 test executions per function** (see §T).
Visual/motion behaviour lives in `DESIGN.md`. Where they overlap, `DESIGN.md` governs looks and this file governs logic.

---

## 1. What the app must do (maps to the assignment)

| Assignment line | How Saakh fulfils it |
|---|---|
| Analyse applicant's financial information, income, credit history, existing debts | 4-step application wizard captures all of it (F01), features engineered (F04) |
| Assess loan eligibility | Policy rules + model decision: Sanctioned / Refer / Declined (F05, F10), max eligible amount (F12) |
| Estimate credit risk | Calibrated probability of default + grade A–E (F08, F09), risk-based indicative rate (F11) |
| Use AI tools to design and develop | Built with Antigravity (planning/orchestration/browser QA) + Claude Code (implementation/tests); documented in report |
| Working application, user-friendly interface | Next.js app per `DESIGN.md` |
| Demonstrate main features with sample data | Synthetic 5,000-applicant dataset (F06), 8 demo personas (F22), sample batch CSV |
| Explain how AI is used | SHAP explanations per decision (F13), counterfactual advice (F14), Model page with metrics + pipeline (F23) |
| Source code + brief report | Repo + `docs/REPORT.md` → `REPORT.docx` + `REPORT.pdf` (F26) |
| Present and explain practical applications | Guided demo mode (F24), `docs/DEMO_SCRIPT.md` |

---

## 2. Repository layout

```
saakh/
├─ apps/web/                     Next.js app (App Router, TS strict)
│  ├─ app/(shell)/assess|what-if|applicants|applicants/[id]|batch|portfolio|model|about/page.tsx
│  ├─ app/page.tsx               Landing
│  ├─ components/…               per DESIGN.md §8
│  ├─ lib/format.ts motion.ts api.ts schema.ts ruler.ts
│  └─ tests/ (vitest)  e2e/ (playwright)
├─ services/api/
│  ├─ app/main.py routers/ schemas.py db.py settings.py
│  ├─ ml/finance.py features.py policy.py data.py model.py explain.py counterfactual.py portfolio.py
│  ├─ artifacts/model.joblib metrics.json model_card.md
│  ├─ data/applicants_5000.csv personas.json batch_sample.csv
│  └─ tests/
├─ docs/DESIGN.md SPEC.md prototype/index.html REPORT.md DEMO_SCRIPT.md screenshots/
├─ tests/ledger/                 per-function run counts (generated)
├─ scripts/test_ledger.py check_no_emoji.mjs dev.sh
└─ .handoff/                     Antigravity ⇄ Claude Code phase files
```

Run: `pnpm dev` starts API on `:8000` and web on `:3000` (concurrently). `pnpm test:all` runs every suite and rebuilds the ledger.

---

## 3. Data model

### 3.1 `ApplicationIn` (shared: zod in `apps/web/lib/schema.ts`, Pydantic in `services/api/app/schemas.py` — must match field-for-field)

| Field | Type | Rule |
|---|---|---|
| `full_name` | string | 2–80 chars, letters, spaces, `.` `'` `-` |
| `age` | int | 18–75 |
| `employment_type` | enum | `salaried` · `self_employed` · `business_owner` |
| `years_in_job` | number | 0–40 and ≤ `age − 16` |
| `city_tier` | int | 1, 2, 3 |
| `dependents` | int | 0–6 |
| `residence` | enum | `owned` · `rented` · `family` |
| `monthly_income` | int ₹ | 10,000 – 50,00,000 |
| `other_monthly_income` | int ₹ | 0 – 20,00,000 |
| `cibil_score` | int | 300–900, or `-1` = new to credit |
| `credit_history_years` | number | 0–40; must be 0 when `cibil_score = -1` |
| `open_credit_lines` | int | 0–30 |
| `credit_utilisation_pct` | number | 0–100 |
| `missed_payments_24m` | int | 0–24 |
| `enquiries_6m` | int | 0–20 |
| `past_default` | bool | |
| `existing_emi` | int ₹ | 0 – 20,00,000 (monthly) |
| `outstanding_debt` | int ₹ | 0 – 5,00,00,000 |
| `loan_type` | enum | `home` · `auto` · `personal` · `education` · `business` |
| `loan_amount` | int ₹ | ≥ 10,000 and ≤ type max: personal 40 L, auto 1 Cr, education 1.5 Cr, business 2 Cr, home 10 Cr |
| `tenure_months` | int | personal 6–84, auto 12–96, education 12–180, business 12–120, home 60–360 |
| `collateral_value` | int ₹ | required > 0 for `home`/`auto`; optional (0) otherwise |
| `purpose` | string | ≤ 200 chars, optional |

### 3.2 `AssessmentOut`

```json
{
  "id": "uuid", "created_at": "iso",
  "application": { ...ApplicationIn },
  "features": { "total_income": 0, "reference_rate": 0, "new_emi_ref": 0, "foir": 0, "lti": 0, "ltv": null, "dti": 0, "age_at_maturity": 0, "no_credit_history": false },
  "pd": 0.041, "grade": "B", "grade_label": "Low risk",
  "outcome": "SANCTIONED | REFER | DECLINED",
  "knockouts": [{ "code": "K4", "message": "..." }],
  "flags":     [{ "code": "R1", "message": "..." }],
  "indicative_rate": 12.25, "emi": 18420, "max_eligible_amount": 960000,
  "factors": [{ "feature": "cibil_score", "label": "CIBIL score 782", "direction": "lowers", "contribution_pp": -2.3, "sentence": "..." }],
  "counterfactuals": [{ "lever": "loan_amount", "from": 800000, "to": 640000, "new_grade": "B", "new_pd": 0.058, "sentence": "..." }],
  "headline": "Sanctioned at grade B",
  "model_version": "xgb-2026.11-v1"
}
```

### 3.3 API

| Method & path | Function | Notes |
|---|---|---|
| `POST /api/score` | F16 | Fast path, no DB write, no counterfactuals; p95 < 150 ms |
| `POST /api/assess` | F15 | Full pipeline + persist; returns `AssessmentOut` |
| `GET /api/assessments?q=&outcome=&grade=&loan_type=&page=` | F19 | Paginated list |
| `GET /api/assessments/{id}` · `DELETE /api/assessments/{id}` | F19 | |
| `POST /api/batch` (multipart CSV) | F17 | Returns results + row errors |
| `GET /api/batch/template` | F17 | CSV header template |
| `GET /api/portfolio` | F18 | Aggregates over stored assessments |
| `GET /api/model` | F23 | metrics.json + model card + global importance |
| `GET /api/personas` | F22 | 8 demo personas |
| `GET /api/health` | — | `{status:"ok", model_version}` |

---

## 4. Function cards

Each card: **purpose · inputs → output · exact rule · edge cases · where it shows in the UI · what the 100 runs must prove.**

### F01 `validate_application` (web zod + API Pydantic)
- Rules: §3.1. Cross-field: `years_in_job ≤ age − 16`; `credit_history_years = 0` if new to credit; collateral required for home/auto; tenure and amount bounds by loan type.
- Error messages name the fix, e.g. "Tenure for a home loan must be 60–360 months".
- UI: wizard field errors (DESIGN §7.6), API returns 422 with field paths.
- 100 runs: 100 random **valid** applications all pass both validators identically; 100 random **invalid** applications (one rule broken each) all fail in both, with the correct field path. Web and API verdicts must agree on every case (shared JSON fixtures generated by the Python side).

### F02 `calc_emi(principal, annual_rate_pct, months) → int`
- `r = annual_rate_pct / 12 / 100`; if `r == 0`: `principal / months`; else `principal · r · (1+r)^n / ((1+r)^n − 1)`. Round half-up to whole rupees.
- Golden: `calc_emi(10_00_000, 10, 120) = 13_215`; `calc_emi(5_00_000, 0, 50) = 10_000`.
- 100 runs: EMI > 0; EMI × n ≥ principal; increasing in rate; decreasing in months; `r=0` case exact; amortising the EMI for n months leaves |balance| < n rupees.

### F03 `calc_foir(monthly_income, other_income, existing_emi, new_emi) → float`
- `total_income = monthly_income + 0.5 · other_income` (other income is haircut 50 %).
- `foir = (existing_emi + new_emi) / total_income`, rounded to 4 dp.
- 100 runs: ≥ 0; increasing in EMIs; decreasing in income; equals hand formula.

### F04 `engineer_features(app) → Features`
- `reference_rate = base_rate[loan_type] + 1.00` (used before the grade is known; avoids circularity).
- `new_emi_ref = calc_emi(loan_amount, reference_rate, tenure_months)`
- `foir = calc_foir(...)` with `new_emi_ref`
- `lti = loan_amount / (12 · total_income)`
- `ltv = loan_amount / collateral_value` if `collateral_value > 0` else `None`; model uses `ltv_filled = ltv or 1.0` plus `is_secured`
- `dti = (outstanding_debt + loan_amount) / (12 · total_income)`
- `age_at_maturity = age + tenure_months / 12`
- `no_credit_history = cibil_score == -1`; `cibil_filled = 650 if new to credit else cibil_score`
- Model feature vector (fixed order, saved in `model_card.md`): `cibil_filled, no_credit_history, foir, lti, ltv_filled, is_secured, dti, credit_utilisation_pct, missed_payments_24m, enquiries_6m, credit_history_years, years_in_job, open_credit_lines, past_default, dependents, age, city_tier, employment_type (one-hot), residence (one-hot), loan_type (one-hot)`.
- 100 runs: no NaN/inf; types and order match model card; each derived value equals its formula.

### F05 `policy_rules(app, features) → (knockouts[], flags[])`
Knock-outs (any → DECLINED regardless of model):

| Code | Rule | Message |
|---|---|---|
| K1 | `age < 21` | "Applicants must be at least 21." |
| K2 | `age_at_maturity > 65` (salaried) or `> 70` (others) | "The loan would end after age {limit}. Choose a tenure of at most {max} months." |
| K3 | `300 ≤ cibil_score < 600` | "CIBIL score {s} is below the minimum of 600." |
| K4 | `foir > 0.65` | "EMIs would take {x} % of income; the limit is 65 %." |
| K5 | `ltv > 0.90` (home) or `> 0.85` (auto) | "Loan is {x} % of the asset value; the limit is {y} %." |
| K6 | `existing_emi / total_income ≥ 0.55` | "Existing EMIs already use {x} % of income." |

Flags (force at least REFER):

| Code | Rule |
|---|---|
| R1 | `past_default` |
| R2 | `missed_payments_24m ≥ 3` |
| R3 | new to credit and `loan_amount > 5,00,000` |
| R4 | `0.55 < foir ≤ 0.65` |

- 100 runs: for each rule, 100 generated applications on both sides of the boundary (just inside / just outside) produce exactly the expected codes; messages contain the real numbers.

### F06 `generate_dataset(n=5000, seed=42) → DataFrame`
Synthetic, reproducible, documented in the report as "synthetic data modelled on Indian retail lending ranges".
- `monthly_income ~ LogNormal(ln 55,000, 0.6)` clipped to §3.1; `cibil ~ N(720, 70)` clipped 300–900, 6 % set to −1; `credit_utilisation ~ Beta(2,3)·100`; `missed_payments ~ Poisson(0.4)`; `enquiries ~ Poisson(1.2)`; `past_default ~ Bernoulli(0.04)`; employment 70/20/10; loan_type mix home 25 / auto 20 / personal 35 / education 10 / business 10; tenure and amount drawn within type bounds with amount scaled to income; collateral = amount / U(0.55, 0.95) for secured.
- Label `default_12m ~ Bernoulli(sigmoid(z))` where
  `z = −2.9 + 0.011(720 − cibil_filled) + 0.6·no_history + 3.0(foir − 0.35) + 0.016(util − 30) + 0.32·missed + 0.10·enquiries − 0.035·min(years_in_job,10) − 0.025·min(history,15) + 0.25·[not salaried] + 0.35·max(0, lti − 3) + 1.1·past_default + 0.08·dependents − 0.15·[owned] + 0.4·max(0, ltv − 0.8)·is_secured + N(0, 0.6)`
- Writes `data/applicants_5000.csv` and `data/batch_sample.csv` (50 rows, no label).
- 100 runs (100 different seeds, n = 2,000): all rows pass F01; default rate in [8 %, 18 %]; same seed → identical frame.

### F07 `train_model(df) → (model, metrics)`
- Split 70/15/15 stratified, seed 42.
- `XGBClassifier(n_estimators=600, max_depth=4, learning_rate=0.05, subsample=0.9, colsample_bytree=0.9, eval_metric="auc", early_stopping_rounds=50)` with **monotone constraints**: `cibil_filled −1`, `foir +1`, `lti +1`, `ltv_filled +1`, `dti +1`, `credit_utilisation_pct +1`, `missed_payments_24m +1`, `enquiries_6m +1`, `past_default +1`; others 0.
- Calibrate on the validation split with **Platt scaling** (sigmoid; smooth and monotone so explanations stay consistent).
- Baseline: `LogisticRegression` on standardised features — reported for comparison.
- Metrics on test split → `artifacts/metrics.json`: AUC, KS, Brier, accuracy/precision/recall at the D/E boundary (PD 0.30), confusion matrix, ROC points (≤ 100), calibration curve (10 bins), global importance (mean |SHAP|).
- Acceptance: XGB test **AUC ≥ 0.80**, **Brier ≤ 0.11**, XGB AUC ≥ baseline AUC.
- Writes `model.joblib`, `metrics.json`, `model_card.md` (intended use, data, features, limitations, fairness note: no gender/religion/caste features used).
- 100 runs: 100 bootstrap resamples of the test split each keep AUC ≥ 0.78 (stability).

### F08 `predict_pd(features) → float`
- Returns calibrated PD in (0, 1), 4 dp.
- 100 runs each property: in (0,1); deterministic; **non-increasing in `cibil_score`**, **non-decreasing in `foir`, `credit_utilisation_pct`, `missed_payments_24m`, `enquiries_6m`** with other inputs fixed (sweep the feature over its range for each of 100 random base applicants).

### F09 `pd_to_grade(pd) → (grade, label)`
- A `< 0.03` "Low risk" · B `< 0.07` "Low risk" · C `< 0.15` "Moderate" · D `< 0.30` "Elevated" · E `≥ 0.30` "High".
- 100 runs: monotone mapping; every boundary value maps to the upper band (0.03 → B).

### F10 `decide(app) → outcome, headline`
1. Any knock-out → `DECLINED`, headline "Declined — {first knock-out message, short}".
2. Else grade E → `DECLINED`, "Declined — estimated default risk {pd} %".
3. Else any flag or grade C/D → `REFER`, "Refer for review — grade {g}".
4. Else (A/B, no flags) → `SANCTIONED`, "Sanctioned at grade {g}".
- 100 runs: generated apps hitting each branch give the right outcome; outcome never SANCTIONED when a K or R code is present.

### F11 `indicative_rate(loan_type, grade) → float | None`
- `base_rate = {home 8.50, auto 9.25, education 9.75, personal 11.50, business 13.00}`; `spread = {A 0, B 0.75, C 1.75, D 3.25}`; E or DECLINED → `None`. Round to nearest 0.05.
- 100 runs: worse grade never cheaper; result on a 0.05 grid.

### F12 `max_eligible_amount(app, rate) → int`
- `max_emi = 0.55 · total_income − existing_emi`; ≤ 0 → 0.
- `p_foir = max_emi · ((1+r)^n − 1) / (r(1+r)^n)` at the offered (or reference) rate and requested tenure.
- Caps: home `0.80 · collateral`, auto `0.85 · collateral`, type max from §3.1.
- Result = `floor(min(p_foir, caps) / 1000) · 1000`.
- 100 runs: `calc_emi(result, rate, n) ≤ max_emi + 1`; never above any cap; increasing in income; 0 when existing EMIs ≥ 55 % of income.

### F13 `explain(app) → factors[]`
- SHAP `TreeExplainer` on the XGB margin. Collapse one-hot groups to one factor. For factor i: `contribution_pp_i = 100 · (P(m) − P(m − shap_i))` where `P` = calibrated probability of margin `m`.
- Return top 6 by |shap|, each with human label (e.g. "CIBIL score 782", "EMIs take 41 % of income"), `direction` `"raises" | "lowers"`, and a sentence from templates in `ml/explain.py`, e.g.:
  - foir raises: "Your EMIs would take {x} % of your monthly income. Lenders prefer under 40 %."
  - cibil lowers: "A CIBIL score of {s} shows a strong repayment record."
  - utilisation raises: "You are using {u} % of your card limits. Keeping it under 30 % lowers risk."
- 100 runs: signs match direction; the top factor has the largest |shap|; Σ shap + base = margin (±1e-3); every sentence contains its number; no factor references a feature not in the model.

### F14 `counterfactuals(app) → paths[] (≤ 3)`
- Target = one grade better than current (D → C, C → B, B → A; A → none; DECLINED by knock-out → the change that removes the knock-out).
- Single-lever search, smallest change first:
  - `loan_amount` −5 % steps to −60 %
  - `tenure_months` +12 steps to type max
  - `credit_utilisation_pct` −5 steps to 10
  - `existing_emi` −10 % steps to 0 ("close or prepay a loan")
  - `co_applicant_income` +10 % of income steps to +100 % (added to `other_monthly_income` at full weight)
- Keep paths that reach the target with no knock-outs; sort by relative change; sentence "Reduce the loan to ₹6,40,000 to reach grade B (risk 5.8 %)".
- 100 runs: re-scoring each returned path really reaches `new_grade` and `new_pd` (±0.0001); at most 3; none for grade A.

### F15 `assess(app)` — `POST /api/assess`
- Pipeline: F01 → F04 → F05 → F08 → F09 → F10 → F11 → F02 (final EMI at indicative rate, or reference rate if declined) → F12 → F13 → F14 → persist (SQLite via SQLModel) → `AssessmentOut`.
- 100 runs: 100 random valid apps return 200, schema-valid, persisted and retrievable by id; invalid → 422.

### F16 `score(app)` — `POST /api/score`
- Same as F15 minus F14 and persistence. Used by live sheet + What-if.
- 100 runs: equals F15's pd/grade/outcome for the same input; p95 latency over the 100 calls < 150 ms.

### F17 `batch_score(csv)` — `POST /api/batch`
- Up to 5,000 rows; header must match template; invalid rows returned as `{row, field, message}` while valid rows are scored; results include all `AssessmentOut` core fields; not persisted unless `?save=true`.
- 100 runs: 100 generated CSVs (random sizes 1–200, ~10 % bad rows) → `scored + errors = rows`, error row numbers correct, results identical to per-row F16.

### F18 `portfolio_stats(assessments)` — `GET /api/portfolio`
- `count`, `sanction_rate`, `refer_rate`, `decline_rate`, `avg_pd`, `expected_loss = Σ pd · 0.45 · loan_amount` (SANCTIONED + REFER only), grade counts, PD histogram (12 bins of 5 % from 0 to 60 %, last bin open), counts and sanction rate by loan type, FOIR-vs-PD points (≤ 500).
- 100 runs: rates sum to 1; histogram counts sum to count; expected loss equals hand sum; empty input returns zeros, not errors.

### F19 history — list / get / delete
- Search by name (case-insensitive contains), filter by outcome/grade/loan_type, sort by date desc, 20 per page.
- 100 runs: random insert sets → filters return exactly the matching subset; pagination covers all without duplicates; delete removes only that id.

### F20 `ReportPdf` (web)
- Sanction-note PDF (DESIGN §8). File name `Saakh_{Name}_{YYYY-MM-DD}.pdf`.
- 100 runs: 100 random assessments render to a non-empty PDF whose extracted text contains name, outcome, grade, EMI and the footer with "NITHIN KUMAR U" and "2102508611"; no emoji in text.

### F21 web formatting — `lib/format.ts`
- `formatINR(n)` → `₹12,50,000`; `formatINRShort(n)` → `₹12.5 L` / `₹1.2 Cr` / `₹85,000`; `parseINR("12,50,000") = 1250000`; `inrToWords(1250000) = "Twelve lakh fifty thousand rupees"`; `formatPct(0.041) = "4.1 %"`.
- 100 runs: `parseINR(formatINR(n)) = n`; grouping regex `^₹\d{1,2}(,\d{2})*(,\d{3})?$` for n ≥ 1000; words round-trip for 100 random amounts against a reference implementation.

### F22 personas & sample data — `GET /api/personas`
Eight fictional demo applicants (names invented for demo):

| # | Persona | Key inputs | Intended outcome |
|---|---|---|---|
| 1 | Ananya Rao, 29, salaried engineer, Bengaluru (tier 1) | ₹1,45,000/mo, CIBIL 791, personal ₹6,00,000 / 36 m | SANCTIONED A |
| 2 | Rahul Mehta, 41, salaried, Pune | ₹95,000, CIBIL 742, home ₹45,00,000 / 240 m, collateral ₹62,00,000 | SANCTIONED B |
| 3 | Fatima Shaikh, 34, self-employed boutique owner, Hyderabad | ₹70,000, CIBIL 701, utilisation 68 %, business ₹12,00,000 / 60 m | REFER (C/D) |
| 4 | Karthik Iyer, 26, salaried, Chennai | ₹48,000, new to credit, auto ₹7,50,000 / 60 m, collateral ₹8,40,000 | REFER (R3) |
| 5 | Priya Nair, 38, teacher, Kochi (tier 2) | ₹62,000, CIBIL 768, education ₹15,00,000 / 120 m | SANCTIONED B |
| 6 | Vikram Singh, 52, business owner, Jaipur | ₹2,10,000, CIBIL 655, 4 missed payments, home ₹80,00,000 / 240 m | DECLINED (K2 age at maturity 72) |
| 7 | Sneha Kulkarni, 31, salaried, Mumbai | ₹55,000, existing EMIs ₹31,000, personal ₹8,00,000 / 48 m | DECLINED (K6/K4) |
| 8 | Arjun Das, 45, salaried, Kolkata | ₹1,20,000, CIBIL 812, auto ₹14,00,000 / 60 m, collateral ₹17,00,000 | SANCTIONED A |

If the trained model puts a persona in a different outcome, adjust that persona's inputs (never the model) so all three outcomes stay represented. Seed the DB with these 8 plus 120 generated assessments so Applicants and Portfolio are full on first run.
- 100 runs: personas load, pass F01, and give their intended outcome on every one of 100 repeated `/api/assess` calls.

### F23 Model page data — `GET /api/model`
- Returns metrics.json, model card markdown, global importance, pipeline node list, training data summary (rows, default rate, date).
- 100 runs: response stable, AUC field ≥ 0.80, ROC points monotone in FPR.

### F24 shell features (web)
- Theme toggle (persisted), command palette (`⌘/Ctrl K`), guided demo (8 steps: landing → load persona 1 → run assessment → explain factors → what-if → applicants → portfolio → model page), About page with student details.
- 100 runs: covered by E2E E7, E8, E9 repeated 100×.

### F25 quality gate — no emoji
- `scripts/check_no_emoji.mjs` + `tests/quality/no-emoji.test.ts` scan `apps/web/{app,components,lib}`, `services/api/{app,ml,data}`, `docs/REPORT.md` for `/\p{Extended_Pictographic}/u` (allow `₹`, `©`).
- Runs in every test command.

### F26 report & docs
- `docs/REPORT.md` (6–8 pages): cover (title, "AI for Finance — CIA-2", Topic 4, **NITHIN KUMAR U**, **USN 2102508611**, date), problem, objectives, how AI is used (ML model, SHAP, counterfactuals; AI dev tools Antigravity + Claude Code), architecture diagram, dataset, model & metrics table, screenshots (both themes), testing summary (the ledger table), practical applications (banks, NBFCs, fintech apps, loan officers, applicants self-checking), limitations & future work, references.
- Export to `REPORT.docx` (python-docx) and `REPORT.pdf`.
- `docs/DEMO_SCRIPT.md`: 5-minute presentation script following the guided demo.
- `README.md`: setup, run, test, screenshots.

---

## T. The 100-run testing rule

"Test every function 100 times" is implemented as:

1. **Python functions (F02–F19, F22, F23):** `pytest` + **Hypothesis** with `@settings(max_examples=100, deadline=None, database=None, suppress_health_check=[HealthCheck.too_slow])`. Each test is decorated with `@counts("F0x")` (a fixture in `tests/conftest.py`) that increments a counter per executed example and **asserts ≥ 100 executions** at teardown — so a filtered strategy that runs fewer examples fails loudly. Plus fixed golden cases.
2. **Web functions & components (F01 web side, F20, F21, ruler mapping, components):** **Vitest + fast-check** `fc.assert(fc.property(...), { numRuns: 100 })`; components rendered with Testing Library for 100 generated prop sets (grade letters, PD values, outcomes) asserting text, `aria-label`, and no crash.
3. **API endpoints:** each endpoint hit 100 times with generated payloads via `httpx`/`TestClient`, plus `pytest --count=100` (pytest-repeat) on the golden endpoint tests to catch flakiness.
4. **End-to-end flows:** Playwright, each spec run with `--repeat-each=100` (headless, `workers` = CPU count), plus one full pass with `reducedMotion: 'reduce'` and one at 390 × 844:
   - E1 persona 1 → Run assessment → stamp SANCTIONED, grade A, toast
   - E2 persona 7 → DECLINED with K6/K4 reason visible
   - E3 wizard: invalid income → error shown → fix → continue
   - E4 What-if: move CIBIL/amount sliders → grade changes; apply a counterfactual → target grade reached
   - E5 Applicants: search → open row (shared transition) → back
   - E6 Batch: upload `batch_sample.csv` → results → download CSV
   - E7 Theme toggle persists after reload
   - E8 Command palette navigates to every page
   - E9 Guided demo completes all 8 steps
5. **Ledger:** `scripts/test_ledger.py` merges JUnit XML from pytest, vitest and playwright plus the `@counts` counters into `tests/ledger/LEDGER.md`:

| Function | Spec | Executions | Passed | Failed | Status |
|---|---|---|---|---|---|
| F02 calc_emi | SPEC §F02 | 100 | 100 | 0 | PASS |

A phase is done only when every function in that phase shows **≥ 100 executions, 0 failures**.
