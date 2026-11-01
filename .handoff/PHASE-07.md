# Phase 07: What-If, Applicants Table & Batch Processing

## Scope & Deliverables
1. **What-If Sensitivity Simulator (`apps/web/app/(shell)/what-if/page.tsx`):**
   - 7 sensitivity sliders (income, loan amount, tenure, CIBIL, existing EMI, CC utilisation, co-applicant).
   - Debounced 150ms live re-scoring.
   - Interactive counterfactual recommendation list with "Apply" animation.
2. **Applicants Portfolio Ledger (`apps/web/app/(shell)/applicants/page.tsx`):**
   - Swiss data table with name search, outcome filter (Sanctioned, Refer, Declined), pagination.
   - Individual applicant detail modal/drawer.
   - Delete assessment functionality.
3. **Batch Processing (`apps/web/app/(shell)/batch/page.tsx`):**
   - Drag-and-drop CSV file uploader.
   - Sample template download.
   - Stacked grade distribution bar and portfolio summary.
   - Full batch result inspection table with CSV export.
4. **Testing:**
   - Vitest component tests verifying slider interaction, table filtering, and batch parsing.
