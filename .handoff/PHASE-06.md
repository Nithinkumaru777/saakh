# Phase 06: Assess Signature Screen & Run Sequence

## Scope & Deliverables
1. **Components in `apps/web/components/assess/`:**
   - `ApplicationWizard.tsx`: 4-step underwriting form (Applicant Info, Financials, Credit Profile, Loan Request), persona dropdown preset loader.
   - `AssessmentSheet.tsx`: Pop elevated card (1.5px ink border, 6px solid offset).
   - `DecisionStamp.tsx`: Tactile rubber stamp landing with `spring.stamp`, ink ring, -3deg tilt.
   - `FactorBars.tsx`: Diverging SHAP feature contribution bar chart (ink lowers, haldi raises) with plain-language explanation sentences.
   - `CounterfactualList.tsx`: Actionable recommendations with "Apply" button.
   - `Highlight.tsx`: Haldi highlighter swipe animation.
   - `MobilePeekDrawer.tsx`: Mobile responsive bottom drawer with 64px peek bar.
2. **Page integration (`apps/web/app/(shell)/assess/page.tsx`):**
   - Columns 1–7: AssessmentSheet.
   - Columns 8–12: ApplicationWizard.
   - Signature run sequence orchestration (1.5s sequence).
   - Persona URL parameter auto-loading (`?persona=priya_sharma`).
3. **Tests:**
   - E2E and component tests verifying assessment workflow and persona loading.
