# Paste this into Claude Code (first message in the repo root)

> Antigravity will run each phase for you with `claude -p ...`. Paste this once at the start so Claude Code knows the rules for the whole project — it also gets written into `CLAUDE.md` in Phase 0.

---

You are the **builder** for Saakh, an AI-Based Loan Eligibility and Risk Assessment System (AI for Finance CIA-2, Topic 4, by **NITHIN KUMAR U**, USN **2102508611**). **Antigravity is the architect.** It writes step-by-step phase instructions in `.handoff/PHASE-NN.md`. You implement exactly what each handoff says, test every function 100 times, and report back.

## Before every task

1. Read `docs/design-spec.md` before writing any code. It defines the exact palette, typography, and the three reference sites for Saakh's visual direction (Ramp, Mercury, CRED NeoPOP). Do not default to generic AI-generated UI patterns (purple/blue gradients, Inter font, generic rounded shadow cards, centered hero + 3-icon feature grid). Every layout and colour decision must trace back to the spec or the references.
2. Read `CLAUDE.md`, `docs/DESIGN.md` and `docs/SPEC.md` (until Phase 0 moves them, they are in the repo root, with the prototype in `prototype/index.html`).
3. Read the current handoff file completely.
4. Open `docs/prototype/index.html` (view its source) for any UI you build: copy its structure, tokens, spacing, timings and animation choreography into the React components. The prototype is the visual reference; the React app is the real product.

## How you work a handoff

1. Follow the handoff's numbered steps **in order**. Each step names a file or function, its inputs and outputs, the formula or rule, the edge cases and where it appears in the UI. Implement exactly that — same names, same field names as SPEC §3, same formulas, same messages.
2. After each function, immediately write its tests (below) and run them. Don't batch all tests to the end.
3. When the whole handoff is done, run the pass-criteria commands from the handoff. If anything fails, fix and re-run until every criterion passes. Don't mark anything skipped, `xfail`, `.only` or `.skip`.
4. Write `.handoff/PHASE-NN.result.md`: for every screen you built, first state briefly which reference(s) from design-spec.md influenced its layout; then files created/changed, each function ID with its ledger line, the command outputs (tail), and any deviation from SPEC/DESIGN with the reason.
5. Commit: `git add -A && git commit -m "Phase NN: <summary>"`.

## The 100-run rule (SPEC §T) — how to test every function

- **Python:** pytest + Hypothesis. Every property test uses
  ```python
  @counts("F02")
  @settings(max_examples=100, deadline=None, database=None, suppress_health_check=[HealthCheck.too_slow])
  @given(...)
  ```
  The `@counts` fixture in `services/api/tests/conftest.py` increments a per-function counter for each executed example, writes `tests/ledger/counts.json`, and **fails the test if fewer than 100 examples ran**. Use `st.builds`/composite strategies that generate valid data directly instead of `assume()`/`filter()` so all 100 run. Add golden cases from the SPEC card as plain tests.
- **API endpoints:** 100 generated payloads through FastAPI `TestClient`, plus golden endpoint tests marked to run with `pytest --count=100`.
- **TypeScript functions & components:** Vitest + fast-check with `{ numRuns: 100 }`; components rendered with Testing Library over 100 generated prop sets, asserting text, roles, `aria-label`, and that the right icon (not emoji) renders. Wrap with a `countRuns("F21")` helper that writes to `tests/ledger/counts.web.json`.
- **E2E:** Playwright specs E1–E9 from SPEC §T.4, run with `--repeat-each=100`. Use stable `data-testid`s. Configure projects: `desktop-1440`, `phone-390`, `reduced-motion`. Wait on UI state (stamp visible, `aria-busy=false`), never fixed timeouts.
- **Ledger:** `python scripts/test_ledger.py` merges JUnit XML + counters into `tests/ledger/LEDGER.md` (Function | Spec | Executions | Passed | Failed | Status). A function is done only at **≥ 100 executions, 0 failures**.

## Non-negotiable product rules

- **No emoji, anywhere** (code, strings, seed data, toasts, docs, PDF, commit messages shown in UI). Use the animated icon mapped in DESIGN §6. If a needed icon isn't in lucide-animated, use `lucide-react` through `components/icons/AnimatedIcon.tsx` with one of its five presets, and add the row to DESIGN §6. `node scripts/check_no_emoji.mjs` must pass.
- Indian formatting: `₹12,50,000`, `₹12.5 L`, `₹1.2 Cr`, `en-IN` locale; CIBIL 300–900 with "New to credit" for `-1`.
- Model outputs are labelled as estimates ("Estimated default risk", "Indicative rate").
- Tokens only: no raw hex in components (use the CSS variables / Tailwind theme from DESIGN §3), no default shadcn greys, radius hierarchy from DESIGN §5.1.
- Fonts: Source Serif 4 (landing headline, page titles, decision headline), Geist (everything else including every number, `tabular-nums`). Never Inter. Uppercase only inside the stamp.
- Shape and colour: radius 2 px (buttons 0), hairline borders, no blurred shadows; only the Assessment Sheet and dialogs get the ink border + solid ink offset; haldi does one job per region; red only for declines and errors.
- Motion: only through `lib/motion.ts` + `useMotionPreset()` so reduced motion works everywhere. Implement exactly the choreography in DESIGN §7: the assessment run sequence (NeoPOP press → scan line → ruler marker spring with overshoot → NumberFlow figures → grade flip → staggered factor bars → stamp landing with sheet nudge and ink ring → highlighter swipe on the headline and top risk factor → button success morph → toast), live-estimate marker updates, 200 ms route fades, direction-aware wizard slides, stepper fill + check morph, sliding nav pill / tab underline / segmented control (`layoutId`), shared-element applicant row → detail, drawer 500 ms, input error shake, slider thumb stretch + value tag, NeoPOP button press (90 ms down / 160 ms up)/hover/loading/success/hold-to-decline, chart draw-once, command palette with no animation. No other ambient animation; no scroll reveals.
- Accessibility: real `<button>`/`<a>`/`<label>`, visible focus ring (2 px ink outline + 3 px offset), `aria-label` on icon buttons, RiskRuler `role="img"` with a full sentence label, 44 px targets, works at 360 px.
- Copy: sentence case, action verbs that match their result ("Run assessment" → "Assessment saved"), errors that state the fix. Student name and USN appear on the About page, the PDF footer and the report cover.

## Commands you'll use

```bash
pnpm dev                      # API :8000 + web :3000
pnpm test:all                 # pytest + vitest + emoji check + ledger
pnpm e2e:100                  # playwright --repeat-each=100 (all projects)
uv run python -m ml.data      # regenerate dataset (services/api)
uv run python -m ml.model     # train + write artifacts
python scripts/test_ledger.py # rebuild tests/ledger/LEDGER.md
```

Now read the docs and start on the handoff Antigravity gives you (Phase 0 first). If no handoff exists yet, wait for `.handoff/PHASE-00.md`.
