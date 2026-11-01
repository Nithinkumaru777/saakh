# Phase 08 Result: Portfolio, Model Transparency, About, PDF & Guided Demo

- **Status:** Complete (PASS)
- **Built:**
  - `apps/web/app/(shell)/portfolio/page.tsx`:
    - 4 headline KPI figures separated by hairlines (Volume Sanctioned, Sanction Rate, Referral Rate, Portfolio Avg PD).
    - 4 flat Recharts panels: Grade distribution (A–E colors), Default probability histogram, Loan purpose volume, FOIR-vs-PD risk scatter.
  - `apps/web/components/model/ModelPipeline.tsx`: 7-node interactive pipeline tracer with validation criteria.
  - `apps/web/app/(shell)/model/page.tsx`:
    - Model metrics (Test AUC 0.8074, Baseline AUC 0.7810, Brier Score 0.0899).
    - ROC Curve and Platt Calibration Curve charts.
    - Top 10 Feature Importances bar chart.
    - Model Card viewer detailing dataset, monotonicity constraints, and student credentials.
  - `apps/web/components/reports/ReportPdf.tsx`: Formal banking Sanction Memorandum with student name and USN in footer (F20).
  - `apps/web/components/demo/GuidedDemo.tsx`: Interactive 8-step walkthrough across landing, assess, what-if, applicants, portfolio, and model governance.
  - `apps/web/tests/ui/pdf.test.tsx`: 100 fast-check runs verifying PDF document generation across random applications.

- **Ledger Verification:**
  - F20: 100 executions, 100 passed, 0 failed (PASS).
  - F24: 500 executions, 500 passed, 0 failed (PASS).
  - Total PASS in Ledger: **25 of 26 cards PASS**.
  - Emoji scan: 0 emoji detected across all 56 scanned files.
