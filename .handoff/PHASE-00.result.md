# Phase 0 result: scaffold, tokens and tooling

Status: **all 4 pass criteria met** (outputs below). Date: 2026-11-01.

## Screens and which references shaped them

| Screen | Reference(s) | How |
|---|---|---|
| `/design-system` | **Ramp** (main), **Mercury**, **CRED NeoPOP** | Ramp: left-aligned, dot-grid canvas, hairline panels, hierarchy from size not colour, one ink rule under the page title. Mercury: Source Serif 4 page title over Geist body. NeoPOP: the button row (4 px ink edge that collapses on press, the hold-to-decline fill). Haldi is used only on the primary button face (plus the hover wash), as `design-spec.md` §3 requires. |
| `/` (placeholder) | **Mercury** | A left-aligned serif headline only. The real landing is a later phase. |

Screenshots: `docs/screenshots/phase-00-design-system-light.png`, `docs/screenshots/phase-00-design-system-dark.png`. I checked them in a live production build (`next start`). Computed styles: body font Geist, h1 Source Serif 4, canvas `rgb(246,246,243)` with a 1 px radial dot grid, primary button `#F2C12E` face, `4px 4px 0 0` ink edge, radius 0.

## Files created

- Root: `package.json` (scripts exactly as in the handoff), `pnpm-workspace.yaml`, `pytest.ini` (keeps `uv run --project services/api pytest` run from the root limited to the API tests), `.gitignore`
- `apps/web` (`@saakh/web`, Next 16.4.3, React 19.3, TS strict, Tailwind v4):
  - `app/globals.css`: every Ink & Haldi and Night ledger token from DESIGN §3 (copied from the prototype `:root`), plus grade and chart tokens. Tailwind's default colours, radii, shadows and fonts are wiped (`--color-*: initial` and so on), so only Saakh tokens exist as utilities. It also holds the type-scale utilities (§4), `pop`/`hairline` elevation, the NeoPOP `.btn*` rules (§7.5) and the reduced-motion overrides.
  - `app/layout.tsx`: `next/font/google` Geist (`--font-sans`) and Source Serif 4 with opsz axis (`--font-serif`), and next-themes with `data-theme` and no flash
  - `lib/motion.ts`: `ease`, `dur`, `spring` (exactly §7.1), pure `motionPreset(reduced)`, and the `useMotionPreset()` hook (under reduced motion every transition is `{duration: 0}` and only the opacity `fade` remains)
  - `components/icons/AnimatedIcon.tsx`: wraps lucide-react with the 5 presets `nudge-x`, `nudge-y`, `spin`, `pop`, `draw`. It exposes `startAnimation`/`stopAnimation` through a ref (the lucide-animated API, so a parent button can drive it). Stroke is 2 at 16 px and 1.75 above.
  - `components/ui/button.tsx`: NeoPOP variants primary, secondary, ghost, hold, icon, sizes md and sm, plus `loading` (`aria-busy`, spinner) and `success` (check). Hold to decline is an 800 ms CSS fill while held (pointer or Space/Enter); releasing early drains it in 200 ms; on completion it fires `onHoldComplete` and shakes. The TS union makes `aria-label` required on icon buttons.
  - `components/theme-toggle.tsx`, `lib/cn.ts`, `app/design-system/{page,button-states}.tsx`, `app/page.tsx`
  - Tests: `vitest.config.ts`, `tests/setup.ts`, `tests/count-runs.ts` (`countRuns(fid, body)`), `tests/global-setup.ts` (merges per-file fragments into `tests/ledger/counts.web.json`), `tests/quality/no-emoji.test.ts`, `tests/ui/foundation.test.tsx`
- `services/api` (`@saakh/api`, uv): `pyproject.toml`, `package.json` (`dev` = uvicorn :8000), `app/main.py` (`/api/health`, CORS for `http://localhost:3000` only), `tests/conftest.py` (`@counts`), `tests/test_health.py`, `tests/test_counts_fixture.py`, `tests/test_ledger_script.py`
- `scripts/check_no_emoji.mjs`, `scripts/test_ledger.py`

## Function ledger (Phase 0)

```
| F25 quality gate: no emoji | SPEC §F25 | 200 | 200 | 0 | PASS |
```
F01 to F24 and F26 are PENDING (not built yet). Suites: junit-api.xml 11 tests, 0 failed; junit-web.xml 12 tests, 0 failed.

Phase 0 also ran these 100-run property tests, which have no F id: button variants and states (100 generated prop sets), AnimatedIcon presets and sizes (100), motion presets (100), CORS rejecting 100 generated foreign origins, ledger status rule (100) and ledger merge and render (100).

How the 100-run guards work:
- **Python:** `@counts("Fxx")` replaces Hypothesis' `inner_test`, so every example is counted, not just every test. A Hypothesis test that ran fewer than 100 examples errors at teardown. `test_counts_fixture.py` proves this in a sandboxed pytest run: 100 examples pass, 5 examples error with "executed 5 examples, needs >= 100", and failing examples are tallied.
- **Web:** `countRuns` registers its `afterAll` when the module loads, through setupFiles. I proved the guard with a throwaway 5-run test: "F99 must execute at least 100 times: expected 5 to be greater than or equal to 100".

## Pass-criteria output (tail)

```
== 1  node scripts/check_no_emoji.mjs
check_no_emoji: 0 emoji in 12 files scanned.            exit=0
== 2  python scripts/test_ledger.py
test_ledger: wrote tests\ledger\LEDGER.md (0 failing)   exit=0
== 3  uv run --project services/api pytest
11 passed, 1 warning in 2.70s                           exit=0
== 4  pnpm --filter @saakh/web test
Test Files  2 passed (2)   Tests  12 passed (12)        exit=0
pnpm test:all                                           exit=0
pnpm lint / pnpm typecheck / pnpm build                 all exit=0
```

## Deviations and decisions

- **Emoji regex is wider than SPEC F25.** It covers `\p{Extended_Pictographic}` plus regional indicators (flags) and U+20E3 (keycaps), because those are emoji that the bare property misses. The allow-list is still exactly `₹` and `©`.
- **The ledger exits 1** if any function is FAIL (1 to 99 runs, or any failure) or any JUnit suite has failures. That way `pnpm test:all` gates on it. PENDING does not fail.
- **The counter files store `{executions, failed}`** per function, so the ledger's Passed and Failed columns come straight from the counters. JUnit files only add a per-suite totals table.
- **lucide-animated icons were not installed in Phase 0.** The handoff asks only for the lucide-react `AnimatedIcon` fallback. Per-icon `npx shadcn add` installs belong to the phases that use each icon.
- `apps/web/package.json` has `"type": "module"`, which silences Vite's CJS config warning. `typecheck` runs `next typegen` first because Next 16's `LayoutProps` is generated.
- uv resolved Python 3.13 for the API venv (`requires-python >=3.12`).
- I left the root copies of `DESIGN.md`, `SPEC.md`, `design-spec.md` and `prototype/` in place. The `docs/` copies already exist, and I did not delete source files the handoff doesn't mention.

## Open

- **gitleaks:** blocked by the local lean-ctx shell allowlist (`lean-ctx allow gitleaks` to enable). A fallback grep for keys, tokens and private keys over all new sources found nothing.
- **Licenses (web prod deps):** all are allow-listed except three. `caniuse-lite` is CC-BY-4.0 (browser data, a transitive dependency of Next.js itself, so it can't be avoided). `png-js` is listed as MIT* because its package has no license field; its repository says MIT (pulled in by `@react-pdf/renderer`). `@saakh/web` is our own private package. `pnpm audit --prod`: no known vulnerabilities.
- **Python licenses** were not machine-checked (no pip-licenses installed). The direct dependencies are all MIT, BSD or Apache, except hypothesis and pytest-repeat, which are MPL-2.0 and allow-listed.
- **Warning:** Starlette warns that `TestClient` over `httpx` is deprecated in favour of `httpx2`. It is harmless now; switch when it breaks.
- `test:e2e` (Playwright) is wired as a script only. `@playwright/test` and the E1 to E9 specs come with the phases that build those flows.
