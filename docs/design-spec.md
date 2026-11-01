# design-spec.md — Saakh visual direction ("Ink & Haldi")

> Client: Saakh, an AI loan eligibility and risk assessment system (AI for Finance CIA-2, Topic 4, NITHIN KUMAR U, USN 2102508611).
> Read this before writing any UI code. Every colour, font, layout and motion decision must trace back to this file or to one of the three references below. `DESIGN.md` has the full component spec; this file sets the direction it follows.

---

## 1. What we are designing against

Generic AI-generated fintech UI looks like this. None of it is allowed:

- Purple or blue gradients, glassmorphism, glow shadows
- Inter / Roboto / system font everywhere
- Rounded cards with the same soft grey shadow, one radius on everything
- Centered hero + 3-icon feature grid + "Trusted by" logo strip
- Corporate "trust blue" as the brand colour
- Emoji as icons
- Fade-and-slide-up on every section, hover lifts on every card

Research basis: the best fintech sites build trust "without resorting to the tired corporate blue template"; premium fintech is moving to **restraint, not colour, as the trust signal**; strong palettes are "neutral foundations, high-contrast data, accent colours used with precision".

---

## 2. The three references (and exactly what we take from each)

| # | Reference | What we take | Where it shows in Saakh |
|---|---|---|---|
| 1 | **Ramp** — ramp.com | Swiss-modernist restraint: near-black ink on white, **one** highlighter-yellow accent that appears once per section "like a highlighter pulled across a printed report", hierarchy from size not colour, dense tables, dot-grid canvas | App shell, tables, the haldi highlighter accent, dot-grid background, hairlines instead of shadows |
| 2 | **Mercury** — mercury.com | The **serif / sans split** ("a bank that reads like a financial review"); colour discipline — red appears only when something truly needs attention; "show the financial state first, then the controls" | Serif decision headline + page titles; red reserved for Declined and errors; Assess page puts the result sheet **first** (left) and the form second |
| 3 | **CRED NeoPOP** — CRED's open-source design system (github.com/CRED-CLUB/neopop-web) | Indian fintech personality: high contrast, sharp geometry, **3D extruded "pop" buttons** whose edge collapses when pressed (NeoPOP press ≈ 50–100 ms), serif headings | Every primary/secondary button, segmented controls, the elevated Assessment Sheet, the decision stamp's pop-art punch |

We borrow principles, never logos, names, wordmarks or exact brand colours.

---

## 3. Palette — "Ink & Haldi"

Haldi (turmeric) yellow is our single accent: Indian, warm, and unmistakably *not* trust-blue. Like Ramp's yellow, it is rationed: primary action, the highlighter mark on the decision, the active nav marker, and one chart series. Nothing else is yellow.

### Light (default)
| Token | Hex | Role | Contrast |
|---|---|---|---|
| `--canvas` | `#F6F6F3` | Page ground, with a 1 px dot grid `#DEDDD6` every 20 px | — |
| `--sheet` | `#FFFFFF` | Panels, tables, inputs | — |
| `--rule` | `#E1E0DA` | Hairlines | — |
| `--rule-strong` | `#C9C8C0` | Input borders, table header rule | — |
| `--ink` | `#17171A` | Text, button edges, borders of elevated elements | 17.9:1 on sheet |
| `--ink-2` | `#4D4E55` | Secondary text | 8.3:1 |
| `--ink-3` | `#6B6C73` | Help text, axis labels (never lighter) | 5.2:1 |
| `--haldi` | `#F2C12E` | The one accent: primary button face, highlighter, active marker | ink on haldi 10.6:1 |
| `--haldi-wash` | `#FFF0BF` | Highlighter band behind text, selected row | — |
| `--sanction` / wash | `#0B7A4B` / `#DDF2E6` | Sanctioned | 5.4:1 / 4.6:1 on wash |
| `--refer` / wash | `#A04A00` / `#FCE8D4` | Refer for review | 6.0:1 / 5.1:1 |
| `--decline` / wash | `#C42B3B` / `#FBE1E3` | Declined, errors — the only red | 5.6:1 / 4.5:1 |
| Grades A→E | `#0B7A4B` `#5D8F12` `#B56A00` `#D24E1C` `#C42B3B` | Grade blocks (white letter, 18 px bold = large text) | ≥ 3:1 |
| Charts | ink `#17171A`, haldi `#F2C12E`, stone `#A9AAA2`, teal `#13807A` | Series colours | — |

### Dark ("Night ledger")
`--canvas #141416` · `--sheet #1C1C1F` · `--rule #2E2E33` · `--ink #F3F2EC` · `--ink-2 #B9B9B2` · `--ink-3 #8E8E88` · haldi unchanged · `--sanction #43D196` · `--refer #F5A35C` · `--decline #FF7F8C`. Button edges stay pure black in dark mode so the pop depth still reads.

---

## 4. Typography

| Role | Font (Google Fonts) | Why |
|---|---|---|
| Display: page titles, decision headline, landing headline | **Source Serif 4** (optical size 60, weight 600, tracking −0.02em) | Mercury's serif/sans split; a financial-report serif, not a fashion serif |
| Everything else, including all numbers | **Geist** (400 / 500 / 600, `tabular-nums` for every figure) | Swiss neo-grotesk in the Ramp spirit; excellent tabular figures; not Inter |
| The stamp | Geist 800 uppercase, +0.12em | The only uppercase in the product |

Scale (px, line-height): display 64/64 · h1 44/48 · h2 28/34 · h3 20/28 · body 16/26 · ui 14/20 · small 13/18. Big money figures: Geist 600, 36/40, −0.02em. Hierarchy comes from **size and weight**, not colour (Ramp).

---

## 5. Layout rules

- **Dot-grid canvas** (Ramp). Content is left-aligned on a 12-column grid, max 1320 px.
- **Radius hierarchy:** panels and inputs 2 px; buttons 0 px (NeoPOP sharp); chips 2 px; only avatars/dots are round. No 12–16 px "SaaS card" radius.
- **No blurred shadows.** Flat panels have a 1 px `--rule` border. Exactly one thing is elevated: the **Assessment Sheet** — 1.5 px ink border + 6 px solid ink offset (pop-art depth, NeoPOP).
- **Landing:** left-aligned serif headline; under it a **sentence-form live demo** ("A salaried applicant earning ₹85,000 a month, CIBIL 760, asks for ₹8,00,000 over 48 months") whose inputs re-score the risk inline; then an inverted ink band with the five decision stages as a numbered ledger (it is a real sequence). No hero image, no icon grid, no logo strip.
- **Assess:** result first (Mercury): Assessment Sheet in columns 1–7, form in 8–12. Phone: sheet becomes a bottom drawer with a peek bar.
- **Risk instrument:** a horizontal **risk ruler** (A–E bands with a marker), not a speedometer gauge.
- **Tables:** Swiss: hairline rows, no zebra stripes, numbers right-aligned in tabular figures; the hovered row gets a haldi-wash band.

---

## 6. Motion

Grounded in Emil Kowalski's interface-motion rules (ease-out by default, UI animations under 300 ms, scale 0.97 on press, never animate from scale 0, don't animate frequent keyboard actions) and NeoPOP's press mechanics.

| Token | Value | Use |
|---|---|---|
| `ease-out` | `cubic-bezier(.23,1,.32,1)` | Anything entering or responding |
| `ease-in-out` | `cubic-bezier(.77,0,.175,1)` | Things moving on screen (marker slides, wizard panes) |
| `ease-drawer` | `cubic-bezier(.32,.72,0,1)`, 500 ms | Phone drawer |
| press | 90 ms down, 160 ms up (asymmetric) | Button edge collapses: face translates (4 px, 4 px), edge hides |
| micro | 120 ms | Hover colour, focus ring |
| standard | 200 ms | Tooltips, tabs, chips |
| max UI | 300 ms | Nothing routine is longer |
| spring `marker` | stiffness 260, damping 20 | Risk-ruler marker (small, visible overshoot) |
| spring `stamp` | stiffness 650, damping 20, mass 1.3 | Decision stamp only |

**Two signature moments only** (both triggered by Run assessment):
1. **Highlighter swipe:** a haldi band wipes left→right behind the decision headline (clip-path, 380 ms, ease-in-out), and the factor that raised risk most gets the same mark.
2. **The stamp** lands on the sheet with the stiff spring, and the sheet nudges 2 px.

Everything else is quiet: the command palette opens with no animation (it is used constantly), keyboard actions do not animate, no scroll-triggered reveals, no looping motion except the loader. With `prefers-reduced-motion`, keep opacity fades only.

---

## 7. Icons
Lucide-animated line icons, 1.75 px stroke, `currentColor` (mapping in DESIGN.md §6). No emoji anywhere. An icon animates only when its own control is hovered or pressed.

---

## 8. Checklist before showing any screen
- [ ] Is haldi used for more than one job on this screen? Remove the extras.
- [ ] Any blurred shadow, gradient, or radius above 2 px on a panel? Remove.
- [ ] Is any red used for something that isn't a decline or an error? Change it.
- [ ] Any centered hero, icon grid or logo strip? Replace.
- [ ] Inter, Roboto or a system font rendering anywhere? Fix the font stack.
- [ ] State which reference drove the layout of this screen.
