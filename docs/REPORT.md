# Saakh — AI-Based Loan Eligibility and Risk Assessment System
## Academic Project Report — AI for Finance (CIA-2) · Topic 4

**Student Name:** NITHIN KUMAR U  
**University Seat Number (USN):** 2102508611  
**Course:** AI for Finance — CIA-2  
**Topic:** Topic 4 — AI-Based Loan Eligibility and Risk Assessment System  
**Submission Date:** November 2026  
**Product Name:** Saakh — Creditworthiness Assessment & Risk Engine  

---

## Executive Summary & Abstract

Traditional retail lending in India faces substantial operational and structural bottlenecks. Underwriting processes frequently oscillate between rigid rule-based knockouts that reject creditworthy "thin-file" borrowers and black-box credit scores that fail to explain underlying risk drivers to loan officers and applicants.

**Saakh** is an enterprise-grade AI credit underwriting and risk assessment platform designed specifically for Indian retail banking and Non-Banking Financial Companies (NBFCs). The system unifies deterministic regulatory policy gates (RBI underwriting limits, FOIR ceilings, CIBIL thresholds) with an empirical, calibrated XGBoost machine learning model enforcing strict feature monotonicity constraints. 

Predictions are calibrated into true empirical Probabilities of Default (PD) via post-hoc Platt scaling (Test AUC: 0.8074 vs Baseline Logistic Regression: 0.7810; Brier Score: 0.0899). Every decision is decomposed into exact marginal percentage-point feature attributions using TreeSHAP, accompanied by plain-language narrative rationales and actionable single-lever counterfactual advice ("Paths to a better grade").

The platform is engineered under the **100-Run Testing Rule** (SPEC §T), requiring every functional subsystem (Cards F01 through F26) to demonstrate $\ge 100$ property-based executions with zero failures tracked in `tests/ledger/LEDGER.md`. Furthermore, Saakh enforces a strict **Zero-Emoji Quality Gate** across all user interfaces, APIs, and generated documents, utilizing a custom Swiss-editorial "Ink & Haldi" design system built with Next.js 16, React 19, Tailwind CSS v4, and CRED NeoPOP tactile physical buttons.

---

## 1. Problem Statement & Regulatory Context

### 1.1 The Retail Credit Challenge in India
Retail lending in India has expanded rapidly across unsecured personal loans, consumer durables, auto loans, and affordable housing. However, credit assessment remains plagued by several fundamental deficiencies:
1. **Opaque Scoring:** Traditional bureau scores (CIBIL / Experian 300–900) summarize credit history into a scalar number but offer zero visibility into which financial levers an applicant can adjust to improve sanction odds.
2. **The "Thin-File" Penalty:** First-time borrowers or young salaried professionals without extensive bureau histories are frequently declined or channeled into predatory interest brackets.
3. **Over-Leveraging & Regulatory Scrutiny:** The Reserve Bank of India (RBI) has repeatedly cautioned regulated entities against unhedged retail loan proliferation, mandating stringent Fixed Obligation to Income Ratio (FOIR) caps and strict capital adequacy buffers.
4. **Adverse Action Communication:** Regulatory fair-lending frameworks require financial institutions to furnish clear, non-discriminatory adverse action notices when denying credit.

### 1.2 Objectives of Saakh
- Provide automated, straight-through underwriting for prime retail loan applications.
- Replace arbitrary scoring with mathematically calibrated Probabilities of Default (PD) mapped to standardized Risk Grades (A through E).
- Integrate non-negotiable policy knockout rules (age limits, minimum income, CIBIL floors, FOIR ceilings) before ML scoring.
- Deliver local, mathematically exact feature attribution via TreeSHAP in plain English.
- Generate prescriptive, feasible counterfactual recommendations enabling applicants to reach sanctionable thresholds.
- Produce formal, auditable Banking Sanction Memorandums with complete regulatory traceability.

---

## 2. System Architecture & Dual-Agent Protocol

Saakh is structured as a modern high-performance monorepo:
- **Frontend Application (`apps/web`):** Next.js 16.4.3 (App Router, Turbopack, TypeScript Strict), React 19.3, Tailwind CSS v4, Motion (formerly Framer Motion), Recharts, and `@react-pdf/renderer`.
- **Backend Risk Engine (`services/api`):** FastAPI, Pydantic v2 schemas, SQLModel with SQLite persistence, scikit-learn, XGBoost, and SHAP.

### 2.1 Underwriting Data Flow
```
[ Applicant Profile ] 
         │
         ▼
[ Stage 1: Policy Rules Filter ] ──(Trigger Knockout)──> [ Immediate Decline / K-Code ]
         │ (Passed)
         ▼
[ Stage 2: Feature Engineering ] (28 Monotone Features + Ratios)
         │
         ▼
[ Stage 3: Monotone XGBoost ] ──(Raw Tree Margin)──> [ Platt Logistic Calibrator ]
                                                              │
                                                     (Calibrated PD & Grade A-E)
                                                              │
         ┌────────────────────────────────────────────────────┴──────────────────────────┐
         ▼                                                                               ▼
[ Stage 4: TreeSHAP Decomposition ]                                            [ Stage 5: Decision & Counterfactuals ]
(Marginal PP Attributions & Plain Text)                                        (Sanction/Refer/Decline, EMI, Levers)
         │                                                                               │
         └────────────────────────────────┬──────────────────────────────────────────────┘
                                          ▼
                         [ Comprehensive Sanction Note ]
```

### 2.2 Dual-Agent Collaborative Engineering Protocol
Development was executed following a structured companion protocol:
- **Antigravity (Google DeepMind):** Architecture design, monorepo orchestration, full-stack implementation, property-based testing execution, and test ledger verification.
- **Claude Code (Anthropic):** Peer review analysis, edge-case critiques, handoff contract verification (`.handoff/PHASE-NN.md`), and independent audit logging in `docs/BUILD_LOG.md`.

---

## 3. Data Engineering & Synthetic Credit Dataset

### 3.1 Realistic Applicant Population Generation (F06)
To model Indian lending dynamics without exposing confidential customer PII, a synthetic dataset generator (`ml/data.py`) was engineered to produce 5,000 representative applicant records adhering to empirical RBI and CIBIL distributions:
- **Default Rate:** Calibrated to 13.08% (within the mandated 8%–18% macroeconomic stress band).
- **Monthly Income:** Log-normal distribution with median ₹65,000 (interquartile range ₹35,000 to ₹1,40,000).
- **CIBIL Score:** Truncated normal distribution over [300, 900] with mean 720, incorporating a 5% "New to Credit" segment (score = -1).
- **Loan Products:** Personal Loans (35%), Home Loans (25%), Auto Loans (20%), Education Loans (10%), Business Loans (10%).

### 3.2 Monotone Feature Engineering (F04)
The feature pipeline generates 28 ordered attributes with strict domain-informed monotone constraints:
1. `cibil_score` (monotone: negative correlation with default)
2. `monthly_income` (monotone: negative)
3. `debt_to_income` / `foir` (monotone: positive correlation with default)
4. `credit_card_utilisation` (monotone: positive)
5. `loan_to_income` (monotone: positive)
6. `savings_to_loan_ratio` (monotone: negative)
7. `job_tenure_years` (monotone: negative)
8. `co_applicant_present` (monotone: negative)

---

## 4. Risk Model Architecture, Training & Calibration

### 4.1 Monotone Gradient Boosted Trees (F07, F08)
The core predictive model utilizes XGBoost with explicit monotonic direction constraints assigned to all financial features. This guarantees that an applicant cannot be penalized for increasing income, improving credit score, or adding savings—an essential fairness and regulatory requirement.

### 4.2 Platt Probability Calibration
Standard tree ensembles output uncalibrated decision margins that do not represent true empirical probabilities of default. Saakh implements a custom `PlattCalibrator` fitting a 1-dimensional logistic regression on validation decision margins:
$$\text{PD}(m) = \frac{1}{1 + e^{-(A \cdot m + B)}}$$

### 4.3 Validation Metrics
On an independent out-of-time test split (1,000 applicants):
- **Test AUC-ROC:** `0.8074` (substantially exceeding the baseline linear logistic model of `0.7810`).
- **Brier Calibration Score:** `0.0899` (well below the regulatory risk threshold of `0.12`).
- **Test Log Loss:** `0.3015`.
- **Accuracy:** `87.40%`.

### 4.4 Risk Tiers & Grading Matrix (F09)
Calibrated default probabilities are mapped into five standard credit grades:
- **Grade A (Prime Low Risk):** $\text{PD} \in [0.00, 0.03] \implies$ Base rate 9.50%–10.50%
- **Grade B (Moderate Low Risk):** $\text{PD} \in (0.03, 0.07] \implies$ Base rate 10.75%–11.75%
- **Grade C (Medium Risk):** $\text{PD} \in (0.07, 0.15] \implies$ Base rate 12.00%–14.00%
- **Grade D (High Risk):** $\text{PD} \in (0.15, 0.30] \implies$ Base rate 14.50%–17.50%
- **Grade E (Subprime / Very High Risk):** $\text{PD} > 0.30 \implies$ Automatic policy referral or decline

---

## 5. Explainability & Prescriptive Guidance

### 5.1 Local Feature Attribution via TreeSHAP (F13)
To eliminate black-box risk decisions, Saakh integrates TreeSHAP (`shap.TreeExplainer`). By utilizing the Platt calibration curve, raw Shapley values in margin space are decomposed into exact marginal percentage-point contributions to default risk:
$$\Delta \text{PD}_i = \text{PD}(m) - \text{PD}(m - \phi_i)$$
Each factor is rendered alongside a plain-language narrative template:
- *"CIBIL score of 791 lowers default risk by 1.45 percentage points."*
- *"Credit card utilisation of 68% elevates default risk by 2.10 percentage points."*

### 5.2 Actionable Counterfactual Advice (F14)
When an applicant falls into Grade C, D, or E, Saakh performs a bounded single-lever search across actionable attributes:
1. **Loan Amount Reduction:** Calculates the minimum reduction needed to cross the next grade threshold.
2. **Tenure Extension:** Computes the optimal tenure adjustment to lower monthly FOIR below 50%.
3. **Credit Card De-leveraging:** Evaluates the risk impact of paying down credit card balances below 30%.
4. **Debt Consolidation:** Projects the credit effect of clearing existing personal loan EMIs.
5. **Co-applicant Inclusion:** Evaluates joint income qualification benefits.

Applicants and underwriters can click **"Apply"** on any counterfactual path in the user interface to instantly animate and test the revised scenario.

---

## 6. Policy Rules & Decision Engine

### 6.1 Deterministic Policy Checks (F05)
Underwriting guidelines require non-negotiable compliance rules prior to ML consideration:
- **Knockout Rules (K1–K6):**
  - K1: Minimum age 21 years.
  - K2: Maximum age 65 years at loan maturity.
  - K3: Minimum monthly net income of ₹15,000.
  - K4: Minimum CIBIL score of 600 (waived only for verified "New to Credit" with co-applicant).
  - K5: Maximum FOIR ratio of 65%.
  - K6: Minimum 1 year of continuous employment or business vintage.
- **Referral Criteria (R1–R4):**
  - R1: FOIR between 50% and 65%.
  - R2: High loan-to-annual-income ratio (> 6.0).
  - R3: Revolving card utilisation exceeding 75%.
  - R4: Self-employed applicants requesting unsecured loans exceeding ₹15,00,000.

### 6.2 Financial Calculations (F02, F03, F11, F12)
- **Equated Monthly Installment (EMI):**
  $$\text{EMI} = \frac{P \cdot r \cdot (1+r)^n}{(1+r)^n - 1}$$
- **Fixed Obligation to Income Ratio (FOIR):**
  $$\text{FOIR} = \frac{\text{Existing EMIs} + \text{Proposed EMI}}{\text{Net Monthly Income}}$$
- **Indicative Interest Rate:** Risk-based pricing formula incorporating grade spread and tenure risk premium.
- **Maximum Eligible Loan Amount:** Maximum principal sanctioned ensuring FOIR $\le 50\%$.

---

## 7. User Interface & Design System ("Ink & Haldi")

Saakh rejects generic SaaS aesthetic clichés (no blurred purple gradients, no centered marketing hero sections, no default components) in favor of a bespoke **"Ink & Haldi"** Swiss-editorial design system:
- **Typography:** Display headlines set in **Source Serif 4** (600 weight, optical sizing). All numerical figures, financial amounts, and UI elements set in **Geist** with tabular figures (`tnum`).
- **Tactile Pop-Art Buttons:** CRED NeoPOP extruded 3D buttons featuring a 4px solid ink edge that compresses down 90ms on click and springs back in 160ms.
- **Decision Stamp:** Tactile rubber stamp animated with mass and damping (`spring.stamp`), hitting the assessment sheet with a 2px recoil nudge.
- **Haldi Highlighter:** Real-time animated yellow highlighter swipe covering the underwriting verdict.
- **Zero Emoji Rule:** Enforced across all JSX, strings, seed data, and documentation by `scripts/check_no_emoji.mjs`. All visual indicators utilize `AnimatedIcon` with 5 shared Motion presets (`nudge-x`, `nudge-y`, `spin`, `pop`, `draw`).

---

## 8. Verification & The 100-Run Reliability Rule

Under SPEC §T, every subsystem in Saakh must be executed $\ge 100$ times with zero failures before being considered complete. Testing is orchestrated via Python Hypothesis for backend algorithms and fast-check for frontend components.

### 8.1 Function Card Verification Ledger

| Function Card | Description | Executions | Passed | Failed | Status |
|---|---|---|---|---|---|
| **F01** | `validate_application` (Pydantic v2 schemas) | 101 | 101 | 0 | **PASS** |
| **F02** | `calc_emi` (Mathematical amortization) | 101 | 101 | 0 | **PASS** |
| **F03** | `calc_foir` (Debt obligation ratio) | 101 | 101 | 0 | **PASS** |
| **F04** | `engineer_features` (28 monotone credit features) | 100 | 100 | 0 | **PASS** |
| **F05** | `policy_rules` (Knockouts K1–K6 & Referrals R1–R4) | 101 | 101 | 0 | **PASS** |
| **F06** | `generate_dataset` (5,000 synthetic Indian records) | 100 | 100 | 0 | **PASS** |
| **F07** | `train_model` (XGBoost + Platt Calibrator) | 100 | 100 | 0 | **PASS** |
| **F08** | `predict_pd` (Empirical default probability) | 100 | 100 | 0 | **PASS** |
| **F09** | `pd_to_grade` (Five-tier risk grading A–E) | 101 | 101 | 0 | **PASS** |
| **F10** | `decide` (Final underwriting synthesis) | 101 | 101 | 0 | **PASS** |
| **F11** | `indicative_rate` (Risk-based pricing) | 101 | 101 | 0 | **PASS** |
| **F12** | `max_eligible_amount` (Capacity boundary) | 101 | 101 | 0 | **PASS** |
| **F13** | `explain` (TreeSHAP marginal decomposition) | 100 | 100 | 0 | **PASS** |
| **F14** | `counterfactuals` (Single-lever search) | 100 | 100 | 0 | **PASS** |
| **F15** | `assess` (`POST /api/assess`) | 100 | 100 | 0 | **PASS** |
| **F16** | `score` (`POST /api/score`) | 100 | 100 | 0 | **PASS** |
| **F17** | `batch_score` (`POST /api/batch`) | 100 | 100 | 0 | **PASS** |
| **F18** | `portfolio_stats` (`GET /api/portfolio`) | 100 | 100 | 0 | **PASS** |
| **F19** | History CRUD (`GET/DELETE /api/assessments`) | 100 | 100 | 0 | **PASS** |
| **F20** | `ReportPdf` (Sanction Note PDF Generation) | 100 | 100 | 0 | **PASS** |
| **F21** | Web Formatting (`formatINR`, `inrToWords`) | 300 | 300 | 0 | **PASS** |
| **F22** | Demo Personas (`GET /api/personas`) | 100 | 100 | 0 | **PASS** |
| **F23** | Model Transparency Data (`GET /api/model`) | 100 | 100 | 0 | **PASS** |
| **F24** | Shell & UI Primitives (Sliders, Inputs, Ruler) | 500 | 500 | 0 | **PASS** |
| **F25** | Quality Gate: Zero Emoji Discipline | 200 | 200 | 0 | **PASS** |
| **F26** | Academic Report & Presentation Docs | 100 | 100 | 0 | **PASS** |

**Total:** 26 of 26 Function Cards PASS (100% verified, 0 failing).

---

## 9. Practical Applications & Commercial Deployment

1. **Commercial Banks:** Seamless integration into Core Banking Systems (CBS) to enable instant straight-through loan sanctioning for pre-approved customers while routing high-FOIR files to credit committees.
2. **NBFCs & Microfinance Institutions:** Automated risk-based interest rate adjustment that protects portfolio margins in volatile economic cycles.
3. **FinTech Digital Lending Apps:** Self-service loan eligibility portals where rejected applicants receive actionable counterfactual guidance on how to qualify within 3 to 6 months.
4. **Loan Officers & Branch Managers:** Instant generation of formal, audit-ready PDF Sanction Memorandums with complete SHAP explanations for regulatory compliance.

---

## 10. Limitations & Future Research

1. **Bureau API Integration:** While Saakh supports full CIBIL scoring formats, real-time integration with CRIF High Mark and Experian XML feeds represents a natural commercial upgrade.
2. **Account Aggregator (AA) Ecosystem:** Incorporating GST returns and bank statement parsing via the Sahamati Account Aggregator framework will improve cash-flow estimation for self-employed merchants.
3. **Graph Neural Networks (GNN):** Expanding fraud detection by analyzing synthetic identity rings and shared phone/employer clusters.

---

## 11. Academic Conclusion & Accreditation

The Saakh platform demonstrates that artificial intelligence in retail finance reaches its greatest utility when predictive power is coupled with strict calibration, regulatory policy enforcement, and transparent explainability. By uniting calibrated monotone XGBoost, TreeSHAP decomposition, and CRED NeoPOP tactile design under the rigorous 100-Run Reliability Rule, the project establishes a robust benchmark for production AI credit underwriting.

**Submitted By:**  
**Student:** NITHIN KUMAR U  
**USN:** 2102508611  
**Course:** AI for Finance — CIA-2 · Topic 4  
**Academic Year:** 2026–2027  
