import { describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DecisionStamp } from "@/components/assess/DecisionStamp";
import { FactorBars } from "@/components/assess/FactorBars";
import { CounterfactualList } from "@/components/assess/CounterfactualList";
import { AssessmentSheet } from "@/components/assess/AssessmentSheet";
import type { AssessmentResponse, CounterfactualAdvice, ShapExplanation } from "@/lib/api";

const mockAssessment: AssessmentResponse = {
  id: "test-assessment-1234",
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
      sentence: "High CIBIL score lowers default risk by 1.45 percentage points.",
    },
    {
      feature: "debt_to_income",
      display_name: "Debt-to-Income",
      contribution_pp: 0.85,
      direction: "increases_risk",
      sentence: "Requested loan elevates debt ratio, adding 0.85 pp to default risk.",
    },
  ],
  counterfactuals: [
    {
      lever: "loan_amount",
      change_description: "Reduce loan amount by ₹2,00,000",
      new_pd: 0.019,
      new_grade: "A",
      new_decision: "sanctioned",
      new_rate: 10.25,
      feasible: true,
      patch: { loan_amount: 2300000 },
    },
  ],
  student: "NITHIN KUMAR U",
  usn: "2102508611",
};

describe("Assess Signature Components", () => {
  it("DecisionStamp renders all three verdict states (100 runs)", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("sanctioned", "refer", "declined" as const),
        (decision) => {
          cleanup();
          const { unmount } = render(<DecisionStamp decision={decision} animate={false} />);
          const expected = decision === "sanctioned" ? "SANCTIONED" : decision === "refer" ? "REFER FOR REVIEW" : "DECLINED";
          expect(screen.getByText(expected)).toBeInTheDocument();
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("FactorBars renders diverging SHAP features cleanly (100 runs)", () => {
    fc.assert(
      fc.property(
        fc.float({ min: -5.0, max: 5.0, noNaN: true }),
        (val) => {
          cleanup();
          const explanations: ShapExplanation[] = [
            {
              feature: "test_feat",
              display_name: "Test Feature",
              contribution_pp: val,
              direction: val < 0 ? "decreases_risk" : "increases_risk",
              sentence: "Test feature explanation sentence.",
            },
          ];
          const { unmount } = render(<FactorBars explanations={explanations} />);
          expect(screen.getByText("Test Feature")).toBeInTheDocument();
          expect(screen.getByText("Test feature explanation sentence.")).toBeInTheDocument();
          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("CounterfactualList handles patch application click", () => {
    const onApply = vi.fn();
    render(<CounterfactualList counterfactuals={mockAssessment.counterfactuals} onApplyPatch={onApply} />);
    const applyBtn = screen.getByRole("button", { name: /apply/i });
    expect(applyBtn).toBeInTheDocument();
    fireEvent.click(applyBtn);
    expect(onApply).toHaveBeenCalledWith({ loan_amount: 2300000 });
  });

  it("AssessmentSheet renders complete underwriting decision sheet", () => {
    render(<AssessmentSheet assessment={mockAssessment} />);
    expect(screen.getByText(/sanctioned at grade a/i)).toBeInTheDocument();
    expect(screen.getByText("SANCTIONED")).toBeInTheDocument();
    expect(screen.getByText("Priya Sharma")).toBeInTheDocument();
    expect(screen.getByText("All mandatory knock-out rules and referral criteria satisfied.")).toBeInTheDocument();
  });
});
