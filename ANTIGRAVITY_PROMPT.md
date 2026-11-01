# Paste this into Antigravity (Agent Manager → new task, Planning mode)

---

You are the **lead architect and orchestrator** for a college project. You do not write the application code yourself. You plan, write precise step-by-step instructions for **Claude Code**, run Claude Code from the terminal for each phase, then verify its work (tests + your browser) before moving on. Claude Code is the builder; you are the guide and the reviewer.

## The project

- **Course:** AI for Finance — CIA-2 · **Topic 4: AI-Based Loan Eligibility and Risk Assessment System**
- **Student:** NITHIN KUMAR U · **USN:** 2102508611
- **Product name:** Saakh — analyses an applicant's financial information, income, credit history and existing debts to decide loan eligibility (Sanctioned / Refer / Declined), estimate credit risk (probability of default + grade A–E), and explain every decision in plain language.
- **Assignment general requirements (all must be visibly met):**
  1. Use AI tools to design and develop the project (that's you + Claude Code — keep a log, see Phase 10).
  2. A working application with a user-friendly interface.
  3. Demonstrate the main features with sample data.
  4. Explain how AI is used in the project (inside the app *and* in the report).
  5. Submit source code and a brief project report.
  6. Present the working project and explain practical applications (guided demo mode + demo script).

## Design rules (apply before any UI code)

Before writing any code, read `design-spec.md`. It defines the exact palette ("Ink & Haldi"), typography, and the three reference sites for Saakh's visual direction: **Ramp** (layout, restraint, the single highlighter accent), **Mercury** (serif/sans split, colour discipline, result before controls) and **CRED NeoPOP** (extruded press buttons, pop-art punch).

Do not default to generic AI-generated UI patterns: no purple/blue gradients, no Inter font, no generic rounded cards with soft shadows, no centered hero + 3-icon feature grid. Every layout and colour decision must trace back to the spec or the references. In every UI handoff, tell Claude Code which reference drives that screen's layout, and require it to state which reference(s) influenced the layout in its result file before showing the screen.

## Source-of-truth files (already in the repo root — move them to `docs/` in Phase 0)

- `design-spec.md` — the visual direction and the three references. Read it first.
- `DESIGN.md` — every visual, font, color, component library, animation, button state, layout transition and icon, derived from `design-spec.md`. **No emoji anywhere; every emoji is replaced by an animated icon from DESIGN §6.**
- `SPEC.md` — every function card `F01`–`F26`, API contract, data model, and the **100-run testing rule (§T)**.
- `prototype/index.html` — a clickable visual prototype of every screen and animation. Open it in your browser now and keep it open; the final app must match it.

Read all four completely before planning. If anything in your own defaults conflicts with them, they win.

## How you drive Claude Code

For every phase:

1. **Write a handoff file** `.handoff/PHASE-NN.md` containing:
   - Goal of the phase in 2 sentences.
   - The exact function cards copied from `SPEC.md` (full text, not references) and the exact `DESIGN.md` sections that apply.
   - **Step-by-step build order**, one numbered step per file or function: what the file is, what each function inside it takes and returns, the exact formula/rule, the edge cases, and which UI element uses it.
   - The tests to write for each function, stating the properties the **100 executions** must prove (from SPEC §T and the card).
   - The commands Claude Code must run at the end and the exact pass criteria (e.g. "`pnpm test:all` exits 0 and `tests/ledger/LEDGER.md` shows ≥ 100 executions, 0 failures for F02, F03, F11, F12, F21").
   - "Write your result to `.handoff/PHASE-NN.result.md`": files changed, functions done, ledger excerpt, anything that deviated from spec and why.
2. **Run Claude Code** in the terminal from the repo root:
   ```bash
   claude -p "Read CLAUDE.md, then execute .handoff/PHASE-NN.md completely. Do not stop until every pass criterion in it is met. Write .handoff/PHASE-NN.result.md when done." --permission-mode bypassPermissions --output-format text | tee .handoff/PHASE-NN.log
   ```
   For follow-up fixes in the same phase use `claude -c -p "<fix instructions>" --permission-mode bypassPermissions`.
3. **Verify yourself** — do not trust the result file alone:
   - Run the phase's test command and open `tests/ledger/LEDGER.md`. Every function in the phase must show **≥ 100 executions and 0 failures**.
   - For UI phases: start `pnpm dev`, open `http://localhost:3000` in your browser agent next to `docs/prototype/index.html`, and compare layout, colors, fonts, spacing, icons and every animation listed in the phase (record a browser video for the walkthrough artifact). Check both themes, 1440 px and 390 px widths, and reduced motion.
   - Grep for emoji: `node scripts/check_no_emoji.mjs` must exit 0.
4. **If anything fails or differs from the prototype**, write `.handoff/PHASE-NN-fix-K.md` with the exact difference (screenshot path, expected vs actual, file and line if known) and run Claude Code again. Repeat until clean.
5. Only then mark the phase done in `docs/BUILD_LOG.md` (date, phase, what was built, test counts, screenshots) and start the next phase.

## Phase plan (write a handoff for each, in this order)

**Phase 0 — Scaffold, tokens, tooling**
Monorepo per SPEC §2 (pnpm workspace; `apps/web` Next.js latest App Router + TS strict; `services/api` FastAPI with `uv`). Move design-spec.md, DESIGN.md, SPEC.md and the prototype into `docs/`. Write `CLAUDE.md` at the repo root (project summary, the hard rules from DESIGN §0, commands, "read docs/design-spec.md, docs/DESIGN.md and docs/SPEC.md before every task; state which reference influenced each screen's layout"). Install and configure: Tailwind v4 with every token from DESIGN §3 as CSS variables (both themes), Source Serif 4 + Geist via `next/font/google` (never Inter), shadcn/ui (init, then add: button input label select slider tabs dialog sheet drawer tooltip popover table toggle switch progress skeleton sonner command chart), restyle all to tokens: radius 2 px (buttons 0), hairline borders, no blurred shadows, NeoPOP extruded button edges (DESIGN §5.1, §7.5). Install `motion`, `@number-flow/react`, `@tanstack/react-table`, `@tanstack/react-query`, `react-hook-form`, `zod`, `@hookform/resolvers`, `next-themes`, `recharts`, `@react-pdf/renderer`, `lucide-react`. Install **every** lucide-animated icon in DESIGN §6 with `npx shadcn@latest add "https://lucide-animated.com/r/<name>.json"`; create `components/icons/AnimatedIcon.tsx` with the 5 presets. Create `lib/motion.ts` exactly as DESIGN §7.1 plus `useMotionPreset()`. Python: fastapi, uvicorn, pydantic, sqlmodel, pandas, numpy, scikit-learn, xgboost, shap, joblib, python-multipart, python-docx, pytest, hypothesis, pytest-repeat, httpx. Test infra: Vitest + Testing Library + fast-check, Playwright (chromium), `tests/conftest.py` with the `@counts` fixture (SPEC §T.1), `scripts/test_ledger.py`, `scripts/check_no_emoji.mjs` + `no-emoji.test.ts` (F25), root scripts `pnpm dev`, `pnpm test:all`, `pnpm e2e:100`.
Pass: both apps boot, a token preview page renders both themes, ledger script produces an (empty) table, emoji check passes.

**Phase 1 — Finance core:** F02, F03, F11, F12 (Python) and F21 (web). Pass: all five at ≥ 100/0.

**Phase 2 — Data & model:** F06, F04, F07, F08, F09. Generate the dataset, train, write `model.joblib`, `metrics.json`, `model_card.md`. Pass: AUC ≥ 0.80, Brier ≤ 0.11, monotonicity properties hold over 100 runs each, ledger clean.

**Phase 3 — Policy, decision, explanation, advice:** F05, F10, F13, F14. Pass: ledger clean; print the 8 personas' outcomes and confirm they match SPEC F22 (adjust persona inputs, never the model).

**Phase 4 — API & persistence:** F01 (API side), F15, F16, F17, F18, F19, F22, F23, seeding (8 personas + 120 generated assessments). Pass: ledger clean, `/api/score` p95 < 150 ms.

**Phase 5 — App shell & design system in code:** landing page per DESIGN §5.3 (left-aligned serif headline, sentence-form live demo driving a RiskRuler, inverted ink band with the five decision stages; no hero image, no icon grid), dot-grid canvas, shell (rail / icon rail / bottom tabs, sliding haldi nav marker), theme toggle, command palette, Button (NeoPOP edge collapse on press, all variants and states incl. loading→success morph and hold-to-decline from DESIGN §7.5), CurrencyInput, segmented control, slider, toasts, skeletons, empty states, route transitions (`template.tsx`), and a hidden `/design-system` page reproducing the prototype's Design system screen. F01 web zod schema. Pass: visual match with prototype screens "Home" and "Design system"; component tests 100 runs each.

**Phase 6 — Assess page (signature screen):** ApplicationWizard (4 steps, direction-aware transitions, stepper fill + check morph, session draft), AssessmentSheet on the left with the form on the right (Mercury: result first), RiskRuler (spring marker), GradeChip (flip), FactorBars (diverging, staggered), Highlight, live estimate (debounced `/api/score`), DecisionStamp and the **full run sequence from DESIGN §7.2** (scan line, marker spring, stamp, highlighter swipe), decision headline, toast, persona loader. Phone layout: peek bar + drawer. Pass: E1, E2, E3 at 100 repeats; side-by-side video vs prototype "Assess" screen.

**Phase 7 — What-if, Applicants, Batch:** WhatIfPanel + CounterfactualList (apply animates sliders), ApplicantsTable + detail page with shared-element `layoutId` transition, BatchUploader. Pass: E4, E5, E6 at 100 repeats; visual match.

**Phase 8 — Portfolio, Model, About, Report PDF, Guided demo:** KPI figures with NumberFlow, 4 charts with chart tokens (draw once), Model page (pipeline with "Trace an application", ROC, confusion matrix, importance, model card, tabs with sliding underline), About page with student name and USN, ReportPdf (F20), GuidedDemo (F24). Pass: E7, E8, E9 at 100 repeats; F20 at 100 runs.

**Phase 9 — Full verification:** `pnpm test:all` + `pnpm e2e:100` (all nine flows × 100), reduced-motion pass, 390 × 844 pass, Lighthouse a11y ≥ 95 on Assess/Applicants/Portfolio, emoji check, and a final side-by-side review of every prototype screen. Capture `docs/screenshots/` for every page in both themes.

**Phase 10 — Report & presentation:** F26 — `docs/REPORT.md` → `REPORT.docx` + `REPORT.pdf` with cover (Topic 4, NITHIN KUMAR U, USN 2102508611), the "How AI tools were used to build this" section written from `docs/BUILD_LOG.md` (your plans, the handoffs, Claude Code's builds, test counts), screenshots and the final ledger table; `docs/DEMO_SCRIPT.md`; `README.md`.

## Your standards when reviewing

- Logic must match SPEC formulas exactly (spot-check 3 cases per function by hand in a Python REPL).
- UI must match the prototype: same fonts (Source Serif 4 for headlines, Geist for everything else), the exact hex tokens, haldi used for one job per region, 2 px radius / 0 px buttons, no blurred shadows, Indian number formatting, the stamp and highlighter timing, the ruler marker's spring overshoot, NeoPOP press, direction-aware wizard slides, the sliding nav marker, an instant command palette.
- Run the `design-spec.md` §8 checklist on every screen and reject anything that looks like a generic AI template.
- Zero emoji. Every icon is from DESIGN §6 and animates on hover/press.
- Every function: ≥ 100 executions, 0 failures in the ledger. No skipped or `xfail` tests.

Start now: read the three files, open the prototype in the browser, produce your implementation plan artifact, then write and run `.handoff/PHASE-00.md`. Continue through Phase 10 without waiting between phases.
