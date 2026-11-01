# Saakh — 5-Minute Live Presentation & Demonstration Script
## Course: AI for Finance — CIA-2 · Topic 4
### Student: NITHIN KUMAR U · USN: 2102508611

---

## Presentation Overview & Timing Breakdown

| Timestamp | Phase | Screen / Feature | Key Talking Points |
|---|---|---|---|
| **0:00 – 0:45** | Opening & Problem Context | Landing Page (`/`) | Retail credit friction in India, opaque CIBIL scoring, and the regulatory mandate for calibrated default risk and explainability. Introduce Saakh. |
| **0:45 – 1:30** | Interactive Mad-Lib Demo | Hero Sentence Demo | Demonstrate real-time 150ms re-scoring by clicking underlined parameters (income, CIBIL, tenure). Highlight the animated Risk Ruler needle and decision chips. |
| **1:30 – 2:45** | Underwriting Worksheet | Assess Page (`/assess`) | Load persona "Priya Sharma" (Prime Home Loan) vs "Rajesh Patel" (Thin-File Merchant). Execute the 1.5s Signature Run Sequence: scan line, flipping 3D grade chip, and CRED NeoPOP tactile rubber stamp impact. |
| **2:45 – 3:30** | Explainability & Counterfactuals | SHAP Bars & Paths | Show diverging factor bars (ink lowers risk, haldi raises risk) with narrative sentences. Click "Apply" on a counterfactual lever (e.g. reduce loan amount) to show how an applicant moves to Grade A. |
| **3:30 – 4:15** | Portfolio & Batch Underwriting | Portfolio (`/portfolio`) & Batch (`/batch`) | Review macro-prudential KPIs (Total Sanctioned, FOIR vs PD scatter). Drag and drop a sample 100-row CSV file and review the stacked grade distribution strip. |
| **4:15 – 5:00** | Model Transparency & Quality Gate | Model Page (`/model`) & Ledger | Walk through the 7-stage ML pipeline, Platt calibration curve, and ROC curve (AUC 0.8074). Present the 100-Run Test Ledger (all 26 cards PASS) and Zero Emoji quality gate. Conclude with student credentials. |

---

## Detailed Minute-by-Minute Script

### Minute 0:00 – 0:45: Introduction & Problem Context
*"Respected evaluator and colleagues, good morning. My name is NITHIN KUMAR U, USN 2102508611, presenting my CIA-2 project for AI for Finance on Topic 4: AI-Based Loan Eligibility and Risk Assessment System.*

*In Indian retail lending, financial institutions process millions of loan applications each month across personal loans, affordable housing, and MSME credit. Today, loan officers face two extremes: rigid knockout rules that turn away creditworthy thin-file applicants, and opaque scalar bureau scores that cannot explain why a loan was rejected or how an applicant can qualify.*

*To solve this, I built **Saakh** — an enterprise-grade AI credit underwriting platform that combines regulatory policy filters, a calibrated monotone XGBoost risk engine, exact SHAP explainability, and actionable counterfactual advice."*

---

### Minute 0:45 – 1:30: Landing Page & Mad-Lib Live Scoring
*(Navigate to `http://localhost:3000`)*

*"Notice the landing page design. Following our 'Ink & Haldi' design system, we adhere to strict editorial typography using Source Serif 4 and Geist, with zero emoji across the entire application.*

*Right here in the hero, we have an interactive mad-lib sentence. As I click any underlined financial variable—for example, switching from a salaried employee earning ₹85,000 to a self-employed business owner with a 680 CIBIL score—the backend risk engine re-scores the application in 150 milliseconds. The needle on our 5-tier Risk Ruler dynamically springs with visible overshoot to the new probability of default, demonstrating straight-through risk estimation."*

---

### Minute 1:30 – 2:45: The Underwriting Sheet & Signature Run Sequence
*(Navigate to `/assess`)*

*"Let's move into the full underwriting worksheet. Notice our Mercury-inspired result-first layout: the elevated Assessment Sheet sits on the left with a 1.5px solid ink border and a 6px drop shadow offset, while the 4-step wizard sits on the right.*

*I will load our demo persona, 'Priya Sharma'—a prime home loan applicant earning ₹1,40,000 monthly with a 790 CIBIL score. When I click 'Run Assessment', observe the signature run sequence:*
1. *A scan line sweeps the sheet.*
2. *The Risk Ruler marker snaps to 2.3% default risk.*
3. *The Grade Chip flips in 3D to Grade A.*
4. *And the CRED NeoPOP rubber stamp slams down with a 2px recoil nudge, formally certifying the sanction.*

*The applicant is sanctioned at an indicative rate of 10.50% with an EMI of ₹20,499 and a healthy 24% FOIR."*

---

### Minute 2:45 – 3:30: Transparent SHAP Explanations & Counterfactuals
*(Scroll down on `/assess`)*

*"Crucially, RBI regulations and fair lending practices require institutions to explain adverse actions. Here, we decompose the prediction using TreeSHAP:*
- *Dark ink bars extend to the left, showing that Priya's 790 CIBIL score lowers default risk by 1.45 percentage points.*
- *Haldi yellow bars indicate factors that elevate risk, such as requested loan tenure.*

*If we inspect a marginal candidate in Grade C or D, Saakh doesn't just decline them—it provides 'Paths to a better grade'. With a single click on 'Apply', our single-lever search optimizes the loan amount or tenure to lift the applicant into a lower-rate sanctionable tier."*

---

### Minute 3:30 – 4:15: Applicants Ledger & Batch Underwriting
*(Navigate to `/applicants` and `/batch`)*

*"In the Applicants Ledger, underwriters have a Swiss-style table with real-time outcome filtering (Sanctioned, Refer, Declined) and search. Clicking any row opens the full audit memorandum.*

*For institutional bulk processing, our Batch Underwriting tool allows banks to drag-and-drop CSV portfolios with up to 1,000 records. Within seconds, it generates a stacked grade distribution strip and allows exporting the fully scored portfolio back to CSV."*

---

### Minute 4:15 – 5:00: Model Governance, Test Ledger & Conclusion
*(Navigate to `/model`)*

*"Finally, let's examine model governance. In the Model page, we trace all seven sequential stages from Pydantic schema validation to Platt logistic scaling. On our independent test split of 1,000 applicants, Saakh achieves an AUC of 0.8074, outperforming the linear baseline of 0.7810 with an outstanding Brier calibration score of 0.0899.*

*Every single function card—from F01 to F26—has been validated under our 100-Run Testing Rule with zero failures recorded in our test ledger. Zero emoji exist anywhere in the code or UI, and underwriters can export formal PDF Sanction Notes at any time.*

*Thank you. I am NITHIN KUMAR U, USN 2102508611, and I am now ready for questions."*
