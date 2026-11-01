# Phase 05: App Shell & Design System in Code

## Scope & Deliverables
1. **API Client (`apps/web/lib/api.ts`):**
   - Type-safe fetch wrappers for `/api/score`, `/api/assess`, `/api/personas`, `/api/portfolio`, `/api/model`, `/api/batch`, `/api/assessments`.
2. **Shared UI Primitives (`apps/web/components/ui/`):**
   - `CurrencyInput.tsx`: Indian formatting as you type, `₹` prefix, amount in words below via `inrToWords`.
   - `Slider.tsx`: 4px track, 14x24 haldi thumb with 12% vertical stretch on drag, value tag riding above.
   - `SegmentedControl.tsx`: Sliding ink block (`spring.snappy`), white text inversion.
   - `RiskRuler.tsx`: 5 grade segments (A 0-3%, B 3-7%, C 7-15%, D 15-30%, E 30%+), animated marker (`spring.marker`).
   - `GradeChip.tsx`: 3D flipping grade letter block (A–E) in decision colors.
   - `CommandPalette.tsx`: `cmdk` modal dialog, instant open (no animation), navigation and persona switcher.
3. **App Shell (`apps/web/components/shell/` and `apps/web/app/(shell)/layout.tsx`):**
   - Responsive sidebar rail (232px desktop, 64px tablet, mobile bottom bar) with sliding haldi marker (`layoutId="nav-marker"`).
   - Header with student details ("NITHIN KUMAR U · 2102508611"), academic course badge, theme toggle, search trigger.
   - Route transition template (`apps/web/app/template.tsx`).
4. **Landing Page (`apps/web/app/page.tsx`):**
   - Headline: *"Know the risk before you lend."* (Source Serif 4).
   - `SentenceDemo.tsx`: Mad-lib sentence driving live `/api/score` and `RiskRuler`.
   - Inverted ink band explaining 5 decision stages.
   - NeoPOP primary and secondary buttons.
5. **Testing:**
   - 100 fast-check runs on CurrencyInput and UI primitives.
   - Verify zero-emoji rule across all newly created components.
