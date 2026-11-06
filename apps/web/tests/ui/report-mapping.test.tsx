// Regression: Download PDF / Download report passed the runtime's result ({K, R, factors, rate, maxAmt})
// to a handler that read API-style fields (knockout_reasons.length) and threw. toReportAssessment maps
// the runtime shape; every field the report reads must be defined and of the right type.
import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { toReportAssessment, type RuntimeAppInput, type RuntimeScoreResult } from "@/components/SaakhApp";
import { countRuns } from "../count-runs";

const app: fc.Arbitrary<RuntimeAppInput> = fc.record({
  full_name: fc.constantFrom("Rajesh Kulkarni", "Meera Iyer", "Ananya Rao"),
  age: fc.integer({ min: 18, max: 75 }),
  monthly_income: fc.integer({ min: 10_000, max: 50_00_000 }),
  employment_type: fc.constantFrom("salaried", "self_employed", "business_owner"),
  years_in_job: fc.integer({ min: 0, max: 30 }),
  residence: fc.constantFrom("owned", "rented", "family"),
  cibil_score: fc.oneof(fc.constant(-1), fc.integer({ min: 300, max: 900 })),
  existing_emi: fc.integer({ min: 0, max: 2_00_000 }),
  credit_utilisation_pct: fc.integer({ min: 0, max: 100 }),
  loan_amount: fc.integer({ min: 10_000, max: 1_00_00_000 }),
  tenure_months: fc.integer({ min: 6, max: 360 }),
  loan_type: fc.constantFrom("personal", "home", "auto", "education", "business"),
});
const rule = fc.tuple(fc.constantFrom("K1", "K4", "R2", "R3"), fc.string({ minLength: 1, maxLength: 40 }));
const res: fc.Arbitrary<RuntimeScoreResult> = fc.record({
  pd: fc.double({ min: 0, max: 1, noNaN: true }),
  grade: fc.constantFrom("A", "B", "C", "D", "E"),
  outcome: fc.constantFrom("SANCTIONED", "REFER", "DECLINED"),
  rate: fc.option(fc.double({ min: 8, max: 24, noNaN: true }), { nil: null }),
  emi: fc.integer({ min: 0, max: 5_00_000 }),
  foir: fc.double({ min: 0, max: 2, noNaN: true }),
  maxAmt: fc.integer({ min: 0, max: 1_00_00_000 }),
  K: fc.array(rule, { maxLength: 3 }),
  R: fc.array(rule, { maxLength: 3 }),
  factors: fc.array(fc.record({ k: fc.constantFrom("foir", "cibil_score"), label: fc.string({ minLength: 1 }),
    pp: fc.double({ min: -40, max: 40, noNaN: true }), dir: fc.constantFrom("raises", "lowers"), sentence: fc.string() }), { maxLength: 6 }),
});

describe("F20 report payload from the runtime result", () => {
  it("maps every field the PDF reads, for 100 runtime results", () => {
    fc.assert(
      fc.property(app, res, countRuns("F20", (a, r) => {
        const p = toReportAssessment(a, r, "abc-123", "04 Nov 2026");
        expect(["sanctioned", "refer", "declined"]).toContain(p.decision);
        expect(p.decision).toBe(r.outcome.toLowerCase());
        expect(typeof p.indicative_rate).toBe("number");
        expect(p.indicative_rate.toFixed(2)).toMatch(/^\d+\.\d\d$/);
        expect(p.monthly_emi).toBe(r.emi);
        expect(p.max_eligible_amount).toBe(r.maxAmt);
        expect(p.knockout_rules).toEqual((r.K ?? []).map(([c, m]) => `${c}: ${m}`));
        expect(p.passed_policy).toBe((r.K ?? []).length === 0);
        expect(p.referral_reasons).toHaveLength((r.R ?? []).length);
        expect(p.shap_explanations).toHaveLength((r.factors ?? []).length);
        p.shap_explanations.forEach((s, i) => {
          expect(s.contribution_pp.toFixed(2)).toBeTypeOf("string");
          expect(s.direction).toBe(r.factors![i].dir === "raises" ? "increases_risk" : "decreases_risk");
        });
        expect(p.application.monthly_income).toBe(a.monthly_income);
        expect(p.application.loan_tenure_months).toBe(a.tenure_months);
        expect(p.application.credit_card_utilisation).toBe(a.credit_utilisation_pct);
      })),
      { numRuns: 100 }
    );
  });
});
