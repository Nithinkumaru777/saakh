# Phase 07 Result: What-If, Applicants Table & Batch Processing

- **Status:** Complete (PASS)
- **Built:**
  - `apps/web/app/(shell)/what-if/page.tsx`:
    - 7 sensitivity sliders (monthly income, loan amount, tenure, CIBIL score, existing EMI, CC utilisation, co-applicant toggle).
    - Debounced 150ms live re-scoring.
    - Live result card with default probability %, GradeChip, DecisionStamp, RiskRuler, and financial indicators.
    - Counterfactual recommendations with "Apply" button to animate sliders to recommended values.
  - `apps/web/app/(shell)/applicants/page.tsx`:
    - Swiss-style data table with hairline rows and `--haldi-wash` hover states.
    - Search by applicant name and outcome filtering tabs (All, Sanctioned, Refer, Declined).
    - Pagination (12 records per page) and record deletion.
    - Detail modal overlay with full `AssessmentSheet`.
  - `apps/web/app/(shell)/batch/page.tsx`:
    - Drag-and-drop CSV upload zone with dashed border.
    - CSV template download link.
    - High-throughput processing with stacked grade distribution bar (A–E).
    - Summary figures (total rows, sanctioned, refer, declined) and CSV result export.

- **Ledger Verification:**
  - 24 of 26 cards PASS.
  - Vitest: 5 test files, 25 tests passed.
  - Emoji scan: 0 emoji detected across all 53 scanned files.
