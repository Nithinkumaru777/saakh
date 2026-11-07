# Website 1 inventory: Saakh full-stack app

**Location:** `apps/web` (front end) and `services/api` (back end)

**Stack:** Next.js 16.4.3 (Turbopack, React 19), Tailwind v4, FastAPI with SQLite (SQLModel), XGBoost and SHAP. Managed with pnpm and uv.

**How the UI is built:** every route renders `components/SaakhApp.tsx`, which injects `components/saakhMarkup.ts` (all views as HTML) and starts `components/saakhRuntime.ts` (all behaviour). Moving between views changes the URL hash, for example `/#assess`. Each route also exists as a real path, for example `/assess`.

## Pages and routes

| Route | View | Access |
|---|---|---|
| `/` | Home (landing) | Public |
| `/about` | About this project | Public |
| `/model` | How the AI decides | Public |
| `/login` | Sign in and create account | Public; signed-in users go to Profile |
| `/assess` | Assessment wizard and sheet | Sign-in required |
| `/what-if` | What-if simulator | Sign-in required |
| `/applicants` | History table and detail view | Sign-in required |
| `/batch` | CSV batch scoring | Sign-in required |
| `/portfolio` | KPIs and charts | Sign-in required |
| `/tutorials` | Full guide and 44 clips | Sign-in required |
| `/profile` | Account details, password, delete | Sign-in required |
| any other path | Next.js 404 page | Public |

## Links

- **Sidebar (768px and up):** brand, Assess, What-if, Applicants, Batch, Portfolio, Model, Tutorials, About, Profile (signed in only), account block with Sign in or Sign out.
- **Top bar:** brand, Guided demo, Search, Sign in or account name, theme toggle.
- **Phone tab bar (under 768px):** Assess, What-if, Applicants, Portfolio, More.
- **Home:** About the project, Sign in, Assess a full application, See how the AI decides, Watch tutorial video.
- **Login:** brand, Back to home.
- **Applicants:** New assessment, plus an Assess link in the empty state.
- **Profile:** Start an assessment.
- **Footer (Home only):** text, no links.
- **Anchor links:** all in-app navigation uses hashes (`#assess` and so on). There are no in-page scroll anchors.
- **External links, `tel:`, `mailto:`, WhatsApp:** none exist anywhere in the site.

## Buttons and actions

| Area | Controls |
|---|---|
| Shell | Guided demo (Next, End, Finish), Search, theme toggle, More (phone) |
| Assess | Load sample applicant, Clear, Back, Continue, stepper jumps, Run assessment, Try changes, Download PDF, drawer handle (phone) |
| What-if | Reset to application, sliders, apply a path to a better grade |
| Applicants | Search, filter (All, Sanctioned, Refer, Declined), Previous, Next, row open (click or Enter), Back to applicants, Download report |
| Batch | Download CSV template, Choose file, Use the 50-row sample, drag and drop, Download results CSV |
| Model | Tabs (Pipeline, Performance, Explainability, Model card), stage cards, trace applicant select, Trace an application |
| Tutorials | Search box, topic toggles, video players |
| About | Start guided demo |
| Login | Mode switch, Use demo, submit |
| Profile | Save profile, Update password, Sign out, Delete my account |

## Forms

| Form | Fields | Validation | Submits to |
|---|---|---|---|
| Hero sentence | employment, income, CIBIL, amount, tenure | Values clamped for scoring | `POST /api/score`, with a local model as fallback |
| Sign in | email, password | Email format, password required | `POST /api/auth/login` |
| Create account | name, email, password | Name letters only, email format, password of 8+ with a letter and a number | `POST /api/auth/register` |
| Assess wizard (4 steps) | 20+ applicant, income, credit and loan fields | Per-step range checks | `POST /api/score` (live), `POST /api/assess` (Run) |
| Batch CSV | File upload | Columns, rows, per-row checks | `POST /api/score` for each row |
| Profile | name, phone, city, employment, income | Server side | `PATCH /api/auth/me` |
| Change password | current, new | Server side | `POST /api/auth/change-password` |
| Delete account | Browser confirmation | None | `DELETE /api/auth/me` |

There are no contact, booking, enquiry or newsletter forms.

## Interactive elements

- **Mobile menu:** tab bar plus More, which opens the command palette. There is no hamburger drawer.
- **Modals and overlays:** command palette (Ctrl+K), guided demo card and spotlight, browser confirm on account delete.
- **Tabs:** Model page. **Accordion:** Tutorials topics, one open at a time.
- **Segmented controls:** employment, residence, loan type, outcome filter, sign-in mode.
- **Sliders:** What-if.
- **Charts (SVG):** four on Portfolio, ROC curve, confusion matrix and feature importance on Model.
- **Videos:** `public/tutorial/full.mp4` and 44 clips, plus `poster.jpg`.
- **Not present:** carousels, image galleries, maps, embedded third-party video.

## Animations

Route fade, nav pill, wizard step slide, risk ruler spring, number tween, scan line, decision stamp, highlighter sweep, factor bars, chart growth, pipeline trace, view transitions on Applicants, toasts, icon hover animations. `prefers-reduced-motion` is honoured.

## Backend

| Endpoint | Purpose | Auth |
|---|---|---|
| `GET /api/health` | Health check | None |
| `GET /api/events` | Live updates (Server-Sent Events) | None |
| `POST /api/score` | Score without saving | None |
| `POST /api/assess` | Score and save | Bearer token |
| `GET /api/assessments`, `GET`/`DELETE /api/assessments/{id}` | History | Bearer token |
| `GET /api/batch/template`, `POST /api/batch` | Batch | Template public, upload needs token |
| `GET /api/portfolio` | Portfolio statistics | Bearer token |
| `GET /api/personas`, `GET /api/model` | Sample data and model metrics | None |
| `/api/auth/register`, `login`, `me`, `change-password` | Accounts | Mixed |

**Database:** SQLite at `services/api/data/saakh.db`, overridable with `SAAKH_DB_PATH`. The end-to-end tests use a throwaway copy.

**Email sending:** none.
