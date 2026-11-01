import { describe, expect, it } from "vitest";
import fc from "fast-check";
import React from "react";
import { ReportPdfDocument } from "@/components/reports/ReportPdf";
import type { AssessmentResponse } from "@/lib/api";
import { countRuns } from "../count-runs";

const sampleAssessmentBase: AssessmentResponse = {
  id: "test-assessment-uuid-1234",
  created_at: new Date().toISOString(),
  application: {
    full_name: "Priya Sharma",
    age: 32,
    employment_type: "salaried",
    years_in_current_job: 5,
    residence_type: "owned",
    monthly_income: 140000,
    existing_emi: 12000,
    savings_balance: 850000,
    cibil_score: 790,
    credit_card_utilisation: 15,
    loan_amount: 2500000,
    loan_tenure_months: 60,
    loan_purpose: "home",
    co_applicant: true,
  },
  pd: 0.023,
  grade: "A",
  decision: "sanctioned",
  indicative_rate: 10.5,
  monthly_emi: 20499,
  foir: 0.24,
  max_eligible_amount: 1950000,
  passed_policy: true,
  knockout_rules: [],
  referral_reasons: [],
  shap_explanations: [
    {
      feature: "cibil_score",
      display_name: "CIBIL Score",
      contribution_pp: -1.45,
      direction: "decreases_risk",
      sentence: "High credit score lowers probability of default.",
    },
  ],
  counterfactuals: [],
  student: "NITHIN KUMAR U",
  usn: "2102508611",
};

describe("F20: ReportPdf Document Generation", () => {
  it("renders valid PDF document tree across 100 applications (100 runs)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 25000, max: 10000000 }),
        fc.constantFrom("A", "B", "C", "D", "E" as const),
        fc.constantFrom("sanctioned", "refer", "declined" as const),
        countRuns("F20", (amount, grade, decision) => {
          const assessment: AssessmentResponse = {
            ...sampleAssessmentBase,
            grade,
            decision,
            application: {
              ...sampleAssessmentBase.application,
              loan_amount: amount,
            },
          };

          const doc = <ReportPdfDocument assessment={assessment} />;
          expect(doc).toBeDefined();
          expect(doc.type).toBeDefined();
          expect(doc.props.assessment.student).toBe("NITHIN KUMAR U");
          expect(doc.props.assessment.usn).toBe("2102508611");
          expect(doc.props.assessment.application.loan_amount).toBe(amount);
          expect(doc.props.assessment.grade).toBe(grade);
          expect(doc.props.assessment.decision).toBe(decision);
        })
      ),
      { numRuns: 100 }
    );
  });
});
