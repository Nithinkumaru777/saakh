# Saakh — AI-Based Loan Eligibility & Risk Assessment System
**Course:** AI for Finance — CIA-2 · **Topic 4: AI-Based Loan Eligibility and Risk Assessment System**  
**Student:** NITHIN KUMAR U · **USN:** 2102508611  
**Architect:** Antigravity · **Builder:** Claude Code  

---

## Before Every Task
1. Read `docs/design-spec.md` before writing any UI code. Every layout and colour decision must trace back to the spec or the 3 references (**Ramp**, **Mercury**, **CRED NeoPOP**). Do not default to generic AI patterns (no purple/blue gradients, no Inter font, no soft shadow cards, no centered 3-icon grid).
2. Read `CLAUDE.md`, `docs/DESIGN.md`, and `docs/SPEC.md`. State which reference(s) influenced each screen's layout in the result file.
3. Read the current handoff file (`.handoff/PHASE-NN.md`) completely. Follow numbered steps in order.
4. Open `docs/prototype/index.html` (view source) for visual reference: copy structure, tokens, spacing, timings, and animation choreography into React.

---

## Hard Product Rules (Non-Negotiable)
- **Zero Emoji Anywhere**: Not in code, JSX, strings, seed data, toasts, docs, PDF, or commits. Use animated icons from `docs/DESIGN.md §6` via `components/icons/AnimatedIcon.tsx`. `node scripts/check_no_emoji.mjs` must always pass.
- **Color Discipline**:
  - Haldi (`#F2C12E`) is rationed: 1 job per region (primary button face, highlighter mark, active nav marker, 1 chart series).
  - Red (`#C42B3B`) is strictly reserved for DECLINED and error states. Nothing decorative is red.
  - Ink (`#17171A`) on canvas (`#F6F6F3`) with 1px dot-grid (`#DEDDD6`, 20px spacing).
- **Typography**:
  - Source Serif 4 (600) for headlines, page titles, and decision headlines (Mercury split).
  - Geist (400, 500, 600, tabular-nums) for everything else, including all numbers and labels. Never Inter or Roboto.
  - Uppercase only inside the decision stamp (Geist 800 +0.12em).
- **Geometry & Elevation**:
  - Radius: Panels and inputs 2px; buttons 0px (NeoPOP sharp); stamp 4px. No 12-16px SaaS card curves.
  - Flat panels with 1px hairline border (`--rule`). No blurred shadows.
  - Only the Assessment Sheet and modal dialogs are elevated (1.5px ink border + 6px solid ink offset).
- **Tactile Buttons (CRED NeoPOP)**:
  - 3D extruded 4px ink edge that collapses on press (90ms down, 160ms up).
- **Indian Financial Formatting**:
  - Currency: `₹12,50,000`, `₹12.5 L`, `₹1.2 Cr` (`en-IN` locale).
  - Credit score: CIBIL 300–900 with `-1` representing "New to credit".
  - Model outputs labelled as estimates ("Estimated default risk", "Indicative rate").
- **Motion System**:
  - Driven by `lib/motion.ts` with `useMotionPreset()`.
  - Full respect for `prefers-reduced-motion: reduce` (opacity fades only).

---

## The 100-Run Testing Rule (SPEC §T)
- Every function must be tested with **≥ 100 executions and 0 failures**.
- Python: `pytest` + `Hypothesis` with `@counts("Fxx")` fixture in `tests/conftest.py` asserting ≥ 100 executions at teardown.
- TypeScript / Web: `Vitest` + `fast-check` with `{ numRuns: 100 }` and `countRuns("Fxx")`.
- E2E: `Playwright` flows E1–E9 with `--repeat-each=100`.
- Ledger: `python scripts/test_ledger.py` aggregates JUnit XML and counts into `tests/ledger/LEDGER.md`.

---

## Standard Commands
```bash
pnpm dev                      # Starts API on :8000 and Next.js web on :3000
pnpm test:all                 # Runs pytest + vitest + emoji check + ledger generation
pnpm e2e:100                  # Runs Playwright E2E suites with 100 repeats
uv run python -m ml.data      # Generates synthetic 5,000 applicant dataset
uv run python -m ml.model     # Trains XGBoost model and produces artifacts
python scripts/test_ledger.py # Rebuilds tests/ledger/LEDGER.md
node scripts/check_no_emoji.mjs # Verifies 0 emoji across all sources
```
