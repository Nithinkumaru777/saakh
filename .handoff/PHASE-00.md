# Phase 0: Scaffold, Tokens, and Tooling

## Goal
Initialize the Saakh monorepo (`apps/web` Next.js 15+ App Router TS strict, `services/api` FastAPI with `uv`), configure all "Ink & Haldi" and "Night ledger" design tokens, typography, motion primitives, and setup the 100-run test ledger and no-emoji quality infrastructure.

---

## Function Cards & Design Sections
- **SPEC §2**: Monorepo layout
- **SPEC §T**: The 100-run testing rule, `@counts` fixture, ledger generator
- **SPEC F25**: Quality gate — no emoji (`scripts/check_no_emoji.mjs`)
- **DESIGN §0**: Hard rules
- **DESIGN §2**: Stack & component libraries
- **DESIGN §3**: Color tokens ("Ink & Haldi" and "Night ledger")
- **DESIGN §4**: Typography (Source Serif 4 + Geist)
- **DESIGN §5.1**: Radius (panels 2px, buttons 0px), elevation (1px hairline `--rule`, 1.5px ink border + 6px solid ink offset for elevated objects)
- **DESIGN §6**: Icons (lucide-animated and AnimatedIcon with 5 presets)
- **DESIGN §7.1**: Motion tokens (`lib/motion.ts` and `useMotionPreset()`)
- **DESIGN §7.5**: NeoPOP buttons

---

## Step-by-Step Build Order

1. **Root Workspace & Config**:
   - `pnpm-workspace.yaml` containing:
     ```yaml
     packages:
       - 'apps/*'
       - 'services/*'
     ```
   - Root `package.json` with scripts:
     ```json
     {
       "name": "saakh-monorepo",
       "private": true,
       "scripts": {
         "dev": "concurrently -k -n \"api,web\" -c \"cyan,magenta\" \"pnpm --filter @saakh/api dev\" \"pnpm --filter @saakh/web dev\"",
         "test:all": "pnpm --filter @saakh/web test && uv run --project services/api pytest && python scripts/test_ledger.py && node scripts/check_no_emoji.mjs",
         "e2e:100": "pnpm --filter @saakh/web test:e2e"
       },
       "devDependencies": {
         "concurrently": "^9.1.2"
       }
     }
     ```

2. **Web Application (`apps/web`)**:
   - Next.js (App Router, React 19, TypeScript strict). Package name: `@saakh/web`.
   - Install dependencies:
     - `motion` (or `framer-motion`)
     - `@number-flow/react`
     - `@tanstack/react-table`
     - `@tanstack/react-query`
     - `react-hook-form`, `zod`, `@hookform/resolvers`
     - `next-themes`
     - `recharts`
     - `@react-pdf/renderer`
     - `lucide-react`
     - `clsx`, `tailwind-merge`
     - `fast-check` (for 100-run property testing in vitest)
     - `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
   - Setup `next/font/google` in `apps/web/app/layout.tsx` for `Source Serif 4` and `Geist` (with variable classes `--font-serif` and `--font-sans`).
   - Configure Tailwind v4 with all CSS variables in `apps/web/app/globals.css`:
     - Light: `--canvas: #F6F6F3`, `--sheet: #FFFFFF`, `--sheet-2: #FAFAF8`, `--rule: #E1E0DA`, `--rule-strong: #C9C8C0`, `--ink: #17171A`, `--ink-2: #4D4E55`, `--ink-3: #6B6C73`, `--haldi: #F2C12E`, `--haldi-hover: #F7CD45`, `--haldi-wash: #FFF0BF`, `--haldi-edge: #8C6B00`, `--sanction: #0B7A4B`, `--sanction-wash: #DDF2E6`, `--refer: #A04A00`, `--refer-wash: #FCE8D4`, `--decline: #C42B3B`, `--decline-wash: #FBE1E3`.
     - Dark: `--canvas: #141416`, `--sheet: #1C1C1F`, `--sheet-2: #202024`, `--rule: #2E2E33`, `--rule-strong: #45454C`, `--dot: #26262B`, `--ink: #F3F2EC`, `--ink-2: #B9B9B2`, `--ink-3: #8E8E88`, `--haldi-wash: #3B3216`, `--edge: #000000`, `--sanction: #43D196`, `--refer: #F5A35C`, `--decline: #FF7F8C`.
     - Dot-grid background pattern for `--canvas` using 20px spacing with 1px dot.
   - Create `apps/web/lib/motion.ts`:
     - Export `ease` (`out: [0.23, 1, 0.32, 1]`, `inOut: [0.77, 0, 0.175, 1]`, `drawer: [0.32, 0.72, 0, 1]`)
     - Export `dur` (`press: 0.09`, `release: 0.16`, `micro: 0.12`, `std: 0.2`, `max: 0.3`, `drawer: 0.5`)
     - Export `spring` (`snappy`, `marker`, `stamp`)
     - Export `useMotionPreset()` hook that respects `useReducedMotion()`.
   - Create `apps/web/components/icons/AnimatedIcon.tsx`:
     - Wraps `lucide-react` icons and supports the 5 presets from DESIGN §6: `nudge-x`, `nudge-y`, `spin`, `pop`, `draw`.
   - Create `apps/web/components/ui/button.tsx` (NeoPOP 3D tactile button):
     - Variants: primary, secondary, ghost, hold-to-decline, icon.
     - 0px border radius, 1.5px ink border, 4px solid ink edge that translates (4px, 4px) on press (90ms down, 160ms up).
   - Create preview page `apps/web/app/design-system/page.tsx` rendering all color tokens, typography scales, NeoPOP button states, dot grid, and theme toggle.

3. **Backend Service (`services/api`)**:
   - `pyproject.toml` with `fastapi`, `uvicorn[standard]`, `pydantic>=2.7`, `sqlmodel`, `pandas`, `numpy`, `scikit-learn`, `xgboost`, `shap`, `joblib`, `python-multipart`, `python-docx`, `pytest`, `hypothesis`, `pytest-repeat`, `httpx`.
   - `services/api/app/main.py`: FastAPI app with `/api/health` endpoint returning `{"status": "ok", "product": "Saakh", "student": "NITHIN KUMAR U", "usn": "2102508611"}`.
   - CORS middleware configured for `http://localhost:3000`.

4. **Testing & Ledger Infrastructure**:
   - `services/api/tests/conftest.py`:
     - `@counts(func_id)` pytest fixture that tracks executions and writes to `tests/ledger/counts.json`.
   - `apps/web/tests/setup.ts` and test helper `countRuns(func_id)` writing to `tests/ledger/counts.web.json`.
   - `scripts/check_no_emoji.mjs`:
     - Scans `apps/web/{app,components,lib}`, `services/api/{app,ml,data}`, and `docs/REPORT.md` for emoji regex `/\p{Extended_Pictographic}/u` (allowing `₹`, `©`). Exits with code 1 if any emoji found.
   - `apps/web/tests/quality/no-emoji.test.ts`: Vitest test running emoji check.
   - `scripts/test_ledger.py`:
     - Parses `tests/ledger/counts.json` and `tests/ledger/counts.web.json`, formats table in `tests/ledger/LEDGER.md` for all 26 function cards (F01–F26).

---

## Pass Criteria
1. `node scripts/check_no_emoji.mjs` exits with code 0.
2. `python scripts/test_ledger.py` runs and creates `tests/ledger/LEDGER.md`.
3. `services/api` boots or passes test: `uv run --project services/api pytest` exits 0.
4. `apps/web` builds or vitest passes: `pnpm --filter @saakh/web test` exits 0.
5. Write results to `.handoff/PHASE-00.result.md`.
