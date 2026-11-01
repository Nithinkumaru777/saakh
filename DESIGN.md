# DESIGN.md — Saakh: AI Loan Eligibility & Risk Assessment

> AI for Finance · CIA-2 · Topic 4 — *AI-Based Loan Eligibility and Risk Assessment System*
> Student: **NITHIN KUMAR U** · USN **2102508611**
>
> "Saakh" means creditworthiness / financial standing. The product decides whether an applicant
> should get a loan, how risky they are, and — most importantly — *explains why* in plain language.

**Read `design-spec.md` first.** It sets the visual direction ("Ink & Haldi") and names the three references every decision must trace back to: **Ramp** (layout and restraint), **Mercury** (type split and colour discipline), **CRED NeoPOP** (buttons and motion personality). This file turns that direction into exact tokens, components and motion. A working visual reference of everything below lives in `docs/prototype/index.html` — open it in a browser and match it.

---

## 0. Hard rules (read first)

1. **No generic AI UI.** No purple/blue gradients, no glassmorphism, no Inter/Roboto, no rounded cards with soft grey shadows, no centered hero + 3-icon feature grid, no logo strip, no fade-up on every section. Every layout and colour choice must trace back to `design-spec.md` or one of its references.
2. **No emoji anywhere.** Not in JSX, strings, toasts, seed data, README, or the PDF report. Every place an emoji would go gets an **animated icon** from §6. A test (`tests/quality/no-emoji.test.ts`) scans `apps/**` and `services/**` for `\p{Extended_Pictographic}` and fails the build.
3. **Haldi is rationed.** The yellow accent `#F2C12E` does one job per screen region: primary button face, the highlighter mark, the active nav marker, or one chart series. Nothing else is yellow.
4. **Red means decline or error.** Nothing decorative is red (Mercury's colour discipline).
5. **Indian money format everywhere.** `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })` → `₹12,50,000`. Short form in charts: `₹12.5 L`, `₹1.2 Cr`.
6. **Credit score = CIBIL range 300–900.** "No credit history" is a valid state (value `-1`, label "New to credit").
7. **Every model number is labelled as an estimate** ("Estimated chance of default", "Indicative rate").
8. **Motion answers something** — a user action, a state change, or one of the two signature moments (§7.2). With `prefers-reduced-motion: reduce`, keep opacity fades only.
9. **Accessibility floor:** text contrast ≥ 4.5:1 (all tokens below are pre-checked), visible keyboard focus, `aria-label` on icon-only buttons, targets ≥ 44 px, works at 360 px wide.

---

## 1. Design type

**Data-dense product app in a Swiss-editorial style with Indian pop-art buttons.** It reads like a printed credit report that a loan officer has marked up with a highlighter and stamped.

| Real-world object | Where it shows up in the UI | Reference |
|---|---|---|
| The highlighter on a printed report | Haldi accent, rationed; swipes behind the decision headline and the biggest risk factor | Ramp |
| A financial review's headline | Source Serif 4 for page titles and the decision; Geist for everything else | Mercury |
| The sanction rubber stamp | SANCTIONED / REFER / DECLINED lands on the sheet | NeoPOP pop-art punch |
| A ruler on graph paper | Dot-grid canvas; the risk ruler (A–E bands with a marker) instead of a speedometer gauge | Ramp |
| A tactile button | Extruded 4 px ink edge that collapses when pressed | CRED NeoPOP |

**Signature element (spend boldness here only):** the **Assessment Sheet** — the only elevated object in the app (1.5 px ink border + 6 px solid ink offset). It updates live while the user types and receives the highlighter swipe and the stamp when the assessment runs. Everything around it is flat and quiet.

---

## 2. Stack & component libraries

| Layer | Choice | Why / how it's used |
|---|---|---|
| Framework | **Next.js (latest, App Router) + React 19 + TypeScript (strict)** | `apps/web` |
| Styling | **Tailwind CSS v4** with the CSS variables from §3 in `app/globals.css` (`@theme` block) | Tokens are variables; components never use raw hex |
| Fonts | **Source Serif 4** + **Geist** via `next/font/google` | §4 |
| Primitives | **shadcn/ui** (Radix) — Button, Input, Label, Select, Slider, Tabs, Dialog, Sheet, Drawer, Tooltip, Popover, Table, Switch, Progress, Skeleton, Sonner, Command, Chart | Restyle every one: radius 2 px (buttons 0), hairline borders, no blurred shadows, NeoPOP button edges. Never ship shadcn defaults |
| Animation | **Motion for React** (`motion` package, `import { motion, AnimatePresence, LayoutGroup, useSpring, useAnimate } from "motion/react"`) | Springs, layout animations, shared elements, the run sequence |
| Animated icons | **lucide-animated** (`npx shadcn@latest add "https://lucide-animated.com/r/<name>.json"`), static fallback **lucide-react** wrapped in `<AnimatedIcon>` | Replaces every emoji; mapping in §6 |
| Animated numbers | **@number-flow/react** | Default-risk %, EMI, amounts, KPIs |
| Charts | **Recharts** via shadcn `Chart` | Flat bars (radius 0–1), chart tokens §3.3 |
| Forms | **react-hook-form + zod** | Shared schema with the API |
| Tables | **@tanstack/react-table** | Applicants, batch results |
| Server state | **@tanstack/react-query** | API calls |
| Theme | **next-themes** | Light "Ink & Haldi" + Dark "Night ledger" |
| Command palette | **cmdk** via shadcn `Command` | `Ctrl/⌘ K`, opens with **no** animation |
| Mobile drawer | **vaul** via shadcn `Drawer` | Assessment sheet on phones |
| Toasts | **sonner** | Bottom-right, ink background, 4 px haldi left rule |
| PDF | **@react-pdf/renderer** | Sanction-note report |
| Backend | **FastAPI + Pydantic v2 + SQLModel (SQLite)** | `services/api` |
| ML | **scikit-learn, XGBoost, SHAP, pandas, numpy, joblib** | `services/api/ml` |
| Tests | **pytest + Hypothesis**, **Vitest + Testing Library + fast-check**, **Playwright** | 100 runs per function (see prompts) |

---

## 3. Color — "Ink & Haldi"

### 3.1 Light (default)

| Token | Hex | Use | Contrast on sheet |
|---|---|---|---|
| `--canvas` | `#F6F6F3` | Page ground + 1 px dot grid `--dot #DEDDD6` every 20 px | — |
| `--sheet` | `#FFFFFF` | Panels, tables, inputs | — |
| `--sheet-2` | `#FAFAF8` | Row hover inside panels, disabled inputs | — |
| `--rule` | `#E1E0DA` | Hairlines | — |
| `--rule-strong` | `#C9C8C0` | Input and segmented-control borders | — |
| `--ink` | `#17171A` | Text, button borders and edges, the sheet's border and offset | 17.9:1 |
| `--ink-2` | `#4D4E55` | Secondary text | 8.3:1 |
| `--ink-3` | `#6B6C73` | Help text, axis labels (never lighter) | 5.2:1 |
| `--haldi` | `#F2C12E` | The one accent (rule 3) | ink on haldi 10.6:1 |
| `--haldi-hover` | `#F7CD45` | Primary button hover | — |
| `--haldi-wash` | `#FFF0BF` | Highlighter band, hovered table row, active nav background | — |
| `--haldi-edge` | `#8C6B00` | Primary button edge in dark mode | — |

### 3.2 Decision & grade colours

Decision colours always appear **with a word and an icon**.

| Token | Light | Dark | Meaning |
|---|---|---|---|
| `--sanction` / `-wash` | `#0B7A4B` / `#DDF2E6` | `#43D196` / `#123526` | SANCTIONED |
| `--refer` / `-wash` | `#A04A00` / `#FCE8D4` | `#F5A35C` / `#3A2614` | REFER FOR REVIEW |
| `--decline` / `-wash` | `#C42B3B` / `#FBE1E3` | `#FF7F8C` / `#3D1A1F` | DECLINED, errors |

Grade ramp (filled square block, white letter at 14–22 px bold): A `#0B7A4B` · B `#5D8F12` · C `#B56A00` · D `#D24E1C` · E `#C42B3B` (dark: `#2FA36E` `#7FAE2E` `#D08A1E` `#E0693A` `#E04B5A`). The grade label next to the block is set in ink, not in the grade colour.

### 3.3 Chart tokens
`--chart-1` ink (main series) · `--chart-2` haldi (one highlighted series only) · `--chart-3 #13807A` teal · `--chart-4 #A9AAA2` stone. Gridlines `--rule`, axis text `--ink-3`. Bars are flat (radius 0–1 px).

### 3.4 Dark — "Night ledger"
`--canvas #141416` · `--sheet #1C1C1F` · `--sheet-2 #202024` · `--rule #2E2E33` · `--rule-strong #45454C` · `--dot #26262B` · `--ink #F3F2EC` · `--ink-2 #B9B9B2` · `--ink-3 #8E8E88` · `--haldi-wash #3B3216` · `--edge #000000` (button and sheet offsets stay black). The highlighter band behind light text drops to 50 % opacity.

Theme switch: `sun-moon` animated icon; colours cross-fade 200 ms. No flash on load.

---

## 4. Typography

| Role | Family | Settings |
|---|---|---|
| Display: landing headline, page titles, decision headline, applicant name on detail | **Source Serif 4** (Google Fonts, variable, optical sizing on) | 600, tracking −0.02 to −0.03em |
| Everything else, **including every number** | **Geist** (Google Fonts, variable) | 400 body, 500 labels, 600 buttons and figures; `font-variant-numeric: tabular-nums` on all figures |
| The stamp only | Geist 800, uppercase, +0.12em | The only uppercase in the product |

| Token | Size / line-height | Family | Use |
|---|---|---|---|
| `display-xl` | clamp(46 → 92) / 0.98 | Serif 600 | Landing headline |
| `display-m` | 44 / 48 | Serif 600 | Page titles |
| `display-l` | 36 / 42 | Serif 600 | Decision headline on the sheet |
| `figure-xl` | 64 / 64, −0.04em | Geist 600 | The default-risk % on the sheet; KPI figures (48) |
| `figure-l` | 36 / 40 | Geist 600 | Big money figures |
| `title` | 28 / 34 | Geist 600 | Section titles |
| `subtitle` | 20 / 28 | Geist 600 | Panel titles |
| `body` | 16 / 26 | Geist 400 | Paragraphs, max 68 ch |
| `ui` | 14 / 20 | Geist 500 | Labels, buttons, table cells |
| `small` | 13 / 18 | Geist 500 | Help text, axis labels |

Hierarchy comes from **size and weight**, not colour (Ramp). Sentence case everywhere except the stamp. No ALL-CAPS eyebrows, no monospace labels, no single recoloured word in a headline (the highlighter covers the whole decision phrase, and only after the user runs the assessment).

---

## 5. Layout

### 5.1 Grid, spacing, shape
- Spacing scale (px): `2 4 8 12 14 16 20 24 28 40 56 72 96`.
- Content max width `1400px`; 12-column grid; left-aligned. Page header ends with a 1 px ink rule under the title (report style).
- **Radius:** panels, inputs, chips, grade blocks 2 px · buttons 0 px · the stamp 4 px. Nothing else rounded.
- **Elevation:** flat panels with a 1 px `--rule` border, no shadow. Elevated (pop) objects — the Assessment Sheet, dialogs, the tour card, the active pipeline node — get a 1.5 px ink border and a solid 4–6 px ink offset. **No blurred shadows anywhere.**
- Background: `--canvas` with a 1 px dot grid every 20 px.

### 5.2 App shell
```
Desktop ≥1180px                                   Tablet 768–1179         Phone <768
┌──────────┬───────────────────────────────────┐  ┌──┬─────────────────┐  ┌──────────────────┐
│ Saakh    │ Crumb      Guided demo [Search]◐  │  │S │ Crumb  ▷ ⌕ ◐    │  │ Crumb     ▷ ⌕ ◐  │
│──────────│───────────────────────────────────│  │  │─────────────────│  │──────────────────│
│▌Assess   │ Page title (serif)                │  │▣ │                 │  │ content          │
│ What-if  │ ───────────────────────────────── │  │▣ │   content       │  │ (single column)  │
│ Applic.  │ content                           │  │▣ │                 │  ├──────────────────┤
│ ...      │                                   │  │  │                 │  │ ▣  ▣  ▣  ▣  ▣    │
│ About    │                                   │  └──┴─────────────────┘  └──────────────────┘
└──────────┴───────────────────────────────────┘  64px icon rail           bottom tabs, ink top rule
 232px rail, hairline right border
```
Active nav item: `--haldi-wash` band with a 3 px haldi bar on the left, sliding between items (Motion `layoutId="nav-marker"`, spring `snappy`).

### 5.3 Landing (no hero image, no icon grid)
```
Saakh                                                   About the project  ◐
──────────────────────────────────────────────────────────────────────────
Know the risk                                   (serif, 92px, left-aligned)
before you lend.
Saakh reads a loan application, estimates ...

■ Change any underlined value
A [salaried] applicant earning ₹[85,000] a month, with a CIBIL score
of [760], asks for ₹[8,00,000] over [48] months.         (serif sentence, sans inputs)
──────────────────────────────────────────── 1.5px ink rule
2.3%  estimated chance of default   [A] Low risk   (Sanctioned chip)
[A▮▮▮▮|B▮▮▮▮|C▮▮▮▮|D▮▮▮▮|E▮▮▮▮]  marker springs to the new position
0%   3%    7%    15%    30%   60%+
[Assess a full application]  [See how the AI decides]       (NeoPOP buttons)
██████████████████ ink band ██████████████████
How a decision is made
1 Policy rules | 2 Features | 3 Risk model | 4 Explanation | 5 Decision   (real sequence)
```

### 5.4 Assess (result first — Mercury)
```
┌──────────── cols 1–7 ────────────────────┐ ┌──────── cols 8–12 ─────────┐
│ ASSESSMENT SHEET (pop: ink border+offset)│ │ Load sample applicant [▾]  │
│ Assessment sheet            ■ Live est.  │ │ ① ── ② ── ③ ── ④  Applicant│
│ Sanctioned at grade A   [STAMP]          │ │ Full name   [          ]   │
│ 0.8%            [A] Low risk             │ │ Age [  ]   Years in job [ ]│
│ [A▮▮|B▮▮|C▮▮|D▮▮|E▮▮] ruler              │ │ Employment [Salaried|...]  │
│ EMI | Indicative rate | EMI/income | Max │ │ ...                        │
│ What moved the score  ■lowers ■raises    │ │ [Back]          [Continue] │
│ CIBIL score 791        ███|      −1.0    │ └────────────────────────────┘
│ ...                                      │
│ [Try changes]           [Run assessment] │
└──────────────────────────────────────────┘
Phone: the sheet is a bottom drawer (vaul) with a 64 px peek bar: [A] Low risk  Risk 0.8%, EMI ₹19,786
```
The stepper sits inside the form panel; only the current step shows its label.

### 5.5 Other pages
- **What-if** — sliders panel (cols 1–5) and a flat result panel (cols 6–12): risk %, grade, outcome, ruler, EMI. Below: "Paths to a better grade" as a ruled list, each with an Apply button.
- **Applicants** — Swiss table: 1.5 px ink header rule, hairline rows, haldi-wash on hover. Row → detail with shared-element transition.
- **Batch** — dashed drop zone → progress bar (ink) → grade strip → rows to fix → results table.
- **Portfolio** — KPI row of four big Geist figures separated by hairlines (no cards), then four flat chart panels.
- **Model** — tabs with a haldi underline; pipeline of seven numbered nodes; ROC, confusion matrix, importance, model card.
- **About** — project, topic, **NITHIN KUMAR U**, USN **2102508611**, tools, practical uses, "Start guided demo".

---

## 6. Icons (emoji replacement system)

- Library: **lucide-animated** (Motion-powered; animates on hover of the icon *or its parent button* — pass the parent's hover state through the icon's ref: `iconRef.current?.startAnimation()` on `onMouseEnter`, `stopAnimation()` on `onMouseLeave`; on touch, trigger on `onPointerDown`).
- Size tokens: 16 (inline in text), 20 (buttons, nav), 24 (section headers), 40 (empty states), 56 (stamp-adjacent result icon).
- Stroke width 1.75 at 20 px and above, 2 at 16 px. Color = `currentColor`.
- Icons that are not in lucide-animated use `lucide-react` wrapped in `components/icons/AnimatedIcon.tsx`, which applies one of 5 shared Motion presets: `nudge-x` (translateX 0→3→0), `nudge-y` (translateY 0→-3→0), `spin` (rotate 0→180), `pop` (scale 1→1.15→1), `draw` (pathLength 0→1).

### Mapping (use exactly these; install each with `npx shadcn@latest add "https://lucide-animated.com/r/<name>.json"`)

| Where / meaning | Icon (lucide-animated name) | Animation on trigger |
|---|---|---|
| Nav: Assess | `file-check` | check draws |
| Nav: What-if | `sliders-horizontal` | knobs slide |
| Nav: Applicants | `users` | figures shift |
| Nav: Batch | `cloud-upload` | arrow lifts |
| Nav: Portfolio | `chart-column-increasing` | bars grow |
| Nav: Model | `brain` | pulse |
| Nav: About | `circle-help` | wiggle |
| Risk / PD anywhere | `gauge` | needle sweeps |
| Run assessment button | `stamp` | stamp presses down |
| Sanctioned | `circle-check` | ring + check draw |
| Refer for review | `badge-alert` | shake |
| Declined | `ban` | strike draws |
| Policy knock-out reason | `gavel` | strike |
| Money / income | `indian-rupee` | nudge-y |
| EMI | `receipt-indian-rupee` | nudge-y |
| Existing debts | `hand-coins` | coins drop |
| Credit card utilisation | `credit-card` | slide |
| Employment | `briefcase-business` | lift |
| Applicant / identity | `id-card` | pop |
| Loan type: home / auto / education / personal / business | `home` / `car` / `graduation-cap` / `wallet` / `briefcase-business` | type-specific |
| Improvement suggestion | `trending-up` | line draws |
| Risk increase factor | `trending-down` | line draws |
| AI explanation / model insight | `sparkles` | twinkle |
| History | `history` | hands rewind |
| Download CSV / PDF | `download` | arrow drops |
| Upload | `upload` | arrow lifts |
| Search | `search` | lens scan |
| Theme toggle | `sun-moon` | swap |
| Command palette | `keyboard` | key press |
| Copy | `copy` | layer slide |
| Retry / re-run | `refresh-cw` | spin |
| Guided demo | `play` | pop |
| Loading | `loader-circle` | continuous spin (the only looping animation) |
| Success toast | `check` | draw |
| Error toast | `x` | draw |
| Pipeline diagram | `workflow` | flow |
| Scatter / charts | `chart-scatter`, `chart-pie`, `chart-line` | draw |

Anything you were about to write as an emoji → find its row above. If no row fits, pick the closest lucide icon and add a row to this table in the same PR.

---

## 7. Motion system

Grounded in Emil Kowalski's interface-motion rules (ease-out by default; routine UI under 300 ms; press feedback 100–160 ms; never animate from scale 0; don't animate frequent keyboard actions) and CRED NeoPOP's press mechanics (edge collapses in ~50–100 ms).

### 7.1 Tokens (`lib/motion.ts`)

```ts
export const ease = {
  out:    [0.23, 1, 0.32, 1],    // default: anything entering or responding
  inOut:  [0.77, 0, 0.175, 1],   // things moving on screen, highlighter swipe
  drawer: [0.32, 0.72, 0, 1],    // phone drawer (500 ms)
};
export const dur = { press: 0.09, release: 0.16, micro: 0.12, std: 0.2, max: 0.3, drawer: 0.5 };
export const spring = {
  snappy: { type: "spring", stiffness: 420, damping: 32 },          // nav marker, segmented control, tab underline
  marker: { type: "spring", stiffness: 260, damping: 20 },          // risk-ruler marker: small visible overshoot
  stamp:  { type: "spring", stiffness: 650, damping: 20, mass: 1.3 } // decision stamp only
} as const;
```
Components never read these directly: use `useMotionPreset()`, which returns instant transitions (opacity only) when `useReducedMotion()` is true.

### 7.2 The two signature moments — running an assessment (≈1.5 s)

Triggered only by **Run assessment**:

| t (ms) | What happens |
|---|---|
| 0 | NeoPOP press: face moves (4 px, 4 px) onto its edge in 90 ms. Label cross-fades to `loader-circle`; width locked. |
| 0–650 | A 2 px ink **scan line** with a haldi-wash trail sweeps down the sheet (`ease.inOut`). |
| 450 | Result in. **Ruler marker** springs to the new position (`spring.marker`, slight overshoot). Default-risk % and money figures roll with NumberFlow (300 ms). Grade block letter flips (old exits up, new enters from below, 200 ms). |
| 600–900 | Factor bars grow from the centre axis, 40 ms stagger, biggest first. |
| 1000 | **Stamp** lands: `scale 2.2 → 1`, `rotate −16° → −8°`, blur 6 → 0 px, `spring.stamp`; the sheet nudges 2 px; an ink ring expands and fades. |
| 1300 | **Highlighter swipe:** a haldi band wipes left → right behind the decision headline (`clip-path` inset 100% → 0, 380 ms, `ease.inOut`, skewed −10°). 420 ms later the label of the factor that raised risk most gets a haldi-wash band (background-size 0 → 100 %, 380 ms). |
| 1350 | Button: spinner → `check` draws (240 ms) → "Assessment saved"; returns to "Run again" after 1.6 s. Toast "Assessment saved to history". |

Re-running or editing a field: the stamp lifts off (`y −12`, fade, 180 ms), the headline highlight and factor mark clear, the "Live estimate" marker returns.

### 7.3 Live updates while typing
Inputs debounce 250 ms → `POST /api/score` → marker springs, numbers roll. Nothing else moves. "Live estimate" shows a 6 px haldi square with a slow opacity pulse (state, not decoration) until the assessment is run.

### 7.4 Page & layout transitions
- **Route change:** 200 ms opacity fade only (no slide). The shell never animates.
- **Applicant row → detail:** shared elements `layoutId={`applicant-${id}-name`}` and `-grade` move with `ease.inOut` 300 ms (View Transitions API as progressive enhancement).
- **Wizard steps:** direction-aware: old pane exits `x ∓24px` + fade in 160 ms, new enters `x ±24px → 0` in 300 ms (`ease.out`). Stepper connector fills with ink (`scaleX 0 → 1`, 300 ms); completed numbers become ink squares with a drawn check.
- **Tabs:** 3 px haldi underline slides (`spring.snappy`), panel fades 200 ms.
- **Segmented controls:** the ink selection block slides (`spring.snappy`); text inverts to white.
- **Command palette:** opens and closes **instantly** (used dozens of times a day). Scrim fades 200 ms.
- **Dialogs / tour card:** fade 200 ms; pop objects keep their ink offset.
- **Phone drawer:** vaul, 500 ms `ease.drawer`.
- **Charts:** draw once on first view (bars grow from baseline 400–600 ms, ROC line draws 1.1 s); never re-animate on hover.
- **No** scroll-triggered reveals, parallax, hover lifts on panels, or looping decoration.

### 7.5 Buttons (CRED NeoPOP)

| Variant | Rest | Hover | Press | Focus (keyboard) | Loading | Disabled |
|---|---|---|---|---|---|---|
| **Primary** | haldi face, 1.5 px ink border, 4 px solid ink edge (right + bottom) | face `--haldi-hover`; icon plays | face translates (4, 4), edge collapses — 90 ms down, 160 ms back | 2 px ink outline, 3 px offset | label → spinner, width locked, `aria-busy` | 40 % opacity, no edge, face sits flat |
| **Secondary** | sheet face, ink border, ink edge | face `--haldi-wash` | same collapse | same | same | same |
| **Ghost** | no border, no edge | `--haldi-wash` | `scale .97` | same | same | 40 % |
| **Hold to decline** (officer override) | sheet face, decline border and edge | — | red fill sweeps left → right over 800 ms while held; release early → drains in 200 ms; on complete: 3 × 3 px shake + toast | same | — | — |
| **Icon button** (40 × 40) | transparent, 2 px radius | `--haldi-wash` | `scale .94` | same | spinner | 40 % |
| **Small** | edge 3 px, height 36 | | | | | |

Dark mode: primary keeps its haldi face with a haldi border and `--haldi-edge` edge; secondary uses the light ink border with a black edge.
Button text is an action that matches its result: "Run assessment" → "Assessment saved"; "Download report" → "Report downloaded".

### 7.6 Inputs
- Label above (`ui`, `--ink-2`), help below (`small`, `--ink-3`).
- Field: white, 1 px `--rule-strong`, radius 2, height 44; hover border `--ink-3`.
- Focus: border ink + 1 px ink inset ring (crisp, no glow).
- **Currency inputs:** Indian grouping as you type with the caret kept in place, `₹` prefix, amount in words below ("Twelve lakh fifty thousand rupees").
- **Error:** decline border + ring, one shake (`x: 0 −4 4 −3 3 0`, 240 ms), message expands below with an `x` icon and says how to fix it.
- **Slider:** 4 px track (ink fill, `--rule-strong` rest); thumb is a 14 × 24 haldi rectangle with an ink border that stretches 12 % vertically while dragged; value tag (ink, white text) rides above the thumb.
- **Switch:** square track with ink border; checked = haldi track, ink knob slides 18 px.
- **Segmented control:** sliding ink block (§7.4).
- **Landing sentence inputs:** inline, no box: Geist 600 with a 2 px ink underline; hover and focus get a haldi-wash background, focus turns the underline haldi.

### 7.7 Feedback states
- **Skeletons:** `--sheet-2` → `--rule` shimmer, 1.4 s linear (off with reduced motion).
- **Empty states:** 40 px icon, one sentence on what to do, one primary button.
- **Errors:** inline banner with a 3 px left rule in `--decline`, the reason and the fix, plus "Try again".
- **Toasts:** ink background, white text, 4 px haldi left rule (decline rule for errors), slide up 10 px, 4 s.

---

## 8. Component specs

| Component | File | Behaviour |
|---|---|---|
| `RiskRuler` | `components/risk/RiskRuler.tsx` | Horizontal 5-band bar (A–E, equal widths, 2 px gaps, letter inside each band) with tick labels 0%, 3%, 7%, 15%, 30%, 60%+. An ink marker (triangle + 3 px line with a sheet-coloured halo) sits at the default-risk position, piecewise-linear inside its band. Moves with `spring.marker`. `role="img"`, `aria-label="Estimated chance of default 4.1 percent, grade B"`. Replaces any gauge or dial. |
| `GradeChip` | `components/risk/GradeChip.tsx` | Square grade block (24 or 40 px) in the grade colour with a white letter, followed by the label in ink ("Low risk", "Moderate", "Elevated", "High"). The letter flips on change. |
| `DecisionStamp` | `components/risk/DecisionStamp.tsx` | Upper-right of the sheet; `outcome`, `date`; ink-texture SVG filter; §7.2 landing; reduced motion = appears. |
| `Highlight` | `components/risk/Highlight.tsx` | Wraps text; when `active`, a haldi band swipes in behind it (§7.2). Used on the decision headline and the top risk-raising factor label. |
| `FactorBars` | `components/risk/FactorBars.tsx` | Ruled rows: icon, plain-language label, diverging bar around a centre axis (ink = lowers risk, haldi with ink outline = raises risk), value in percentage points. Top 6 by absolute SHAP. Hover or focus shows the explanation sentence in an ink tooltip. |
| `AssessmentSheet` | `components/risk/AssessmentSheet.tsx` | The only elevated object. Header + live marker, decision headline (serif, highlighter), default-risk % (64 px Geist) + grade block, `RiskRuler`, a 4-cell ruled row (EMI, indicative rate, EMI to income, max eligible), policy reasons banner, `FactorBars`, footer (Try changes, Run assessment). Sticky at `top: 96px` on desktop; vaul drawer with peek bar on phones. |
| `ApplicationWizard` | `components/apply/ApplicationWizard.tsx` | 4 steps inside the right-hand panel; persona loader on top; stepper shows numbers, only the current step labelled; react-hook-form + zod per step; draft in `sessionStorage`. |
| `CurrencyInput` | `components/form/CurrencyInput.tsx` | §7.6. |
| `SentenceDemo` | `components/landing/SentenceDemo.tsx` | Landing mad-lib: employment select + income, CIBIL, amount, tenure inline inputs; re-scores a personal loan through `/api/score` (debounce 120 ms) and drives a `RiskRuler`, the % figure, grade block and outcome chip. |
| `WhatIfPanel` / `CounterfactualList` | `components/whatif/*` | 7 sliders, live re-score (150 ms); up to 3 single-change paths as a ruled list; Apply animates the slider to its new value (600 ms ease-out) then re-scores. |
| `ApplicantsTable` | `components/applicants/ApplicantsTable.tsx` | Swiss table, search, outcome filter (segmented), 12 per page, shared-element row → detail. |
| `BatchUploader` | `components/batch/BatchUploader.tsx` | Dashed drop zone (hover: ink border + haldi-wash), CSV header check, ink progress bar, grade strip, rows to fix, results table, download. |
| `KpiFigure` | `components/portfolio/KpiFigure.tsx` | 48 px Geist figure + label, hairline separators, NumberFlow on first view. |
| `ModelPipeline` | `components/model/ModelPipeline.tsx` | Seven numbered nodes joined by rules; "Trace an application" lights each node in turn (haldi-wash + ink pop offset) and sends a small haldi square along each edge. User-triggered only. |
| `CommandPalette` | `components/shell/CommandPalette.tsx` | `⌘/Ctrl K`, instant open; pages, demo personas, theme, guided demo. Pop dialog style. |
| `GuidedDemo` | `components/shell/GuidedDemo.tsx` | 8-step tour; spotlight cut-out with a 3 px haldi ring; pop tour card. |
| `ReportPdf` | `components/report/ReportPdf.tsx` | Sanction-note layout: serif title, ink rules, ruler snapshot, factors, stamp, footer "Generated by Saakh, AI for Finance CIA-2 project by NITHIN KUMAR U (USN 2102508611)". |

---

## 9. Copy voice
- Plain, specific, active: "Run assessment", "Download report", "Load sample applicant".
- Explanations name the number: "Your EMIs would take 48% of your monthly income. Lenders prefer under 40%."
- Errors name the problem and the fix; never apologise.
- Landing headline: **"Know the risk before you lend."** Sub: "Saakh reads a loan application, estimates the chance of default, and shows exactly which factors moved the decision."

---

## 10. Definition of done for design
- [ ] Every screen matches `docs/prototype/index.html` in layout, tokens and motion.
- [ ] `design-spec.md` §8 checklist passes on every screen (haldi rationed, no blurred shadows, red only for declines/errors, no centered hero or icon grid, correct fonts).
- [ ] `no-emoji` test passes.
- [ ] Lighthouse accessibility ≥ 95 on Assess, Applicants, Portfolio.
- [ ] Playwright suite passes with `reducedMotion: 'reduce'` and at 390 × 844.
- [ ] Both themes screenshotted for every page in `docs/screenshots/` (used in the report).
