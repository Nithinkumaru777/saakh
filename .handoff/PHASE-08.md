# Phase 08: Portfolio, Model Transparency, About, PDF & Guided Demo

## Scope & Deliverables
1. **Portfolio Analytics (`apps/web/app/(shell)/portfolio/page.tsx`):**
   - 4 KPI figures separated by hairlines (no cards).
   - 4 Recharts visual panels: Grade Distribution, PD Histogram, Loan Purpose Volume, FOIR vs PD.
2. **Model Transparency (`apps/web/app/(shell)/model/page.tsx`):**
   - 7-node interactive pipeline tracer (`ModelPipeline.tsx`).
   - ROC Curve, Calibration Curve, Confusion Matrix, Feature Importance.
   - Full Model Card viewer.
3. **Sanction Report PDF (`apps/web/components/reports/ReportPdf.tsx`):**
   - Formal banking Sanction Note with student name and USN in footer (F20).
   - Fast-check 100-run test suite for F20.
4. **Interactive Guided Demo (`apps/web/components/demo/GuidedDemo.tsx`):**
   - 8-step guided interactive tour across the product.
