"use client";

import React, { useEffect } from "react";
import { SAAKH_MARKUP } from "./saakhMarkup";
import { initSaakhRuntime } from "./saakhRuntime";
import type { AssessmentResponse } from "@/lib/api";

export interface SaakhAppProps {
  initialView?: string;
}

interface RuntimeAppInput {
  full_name: string;
  age: number;
  monthly_income: number;
  employment_type: string;
  years_in_job: number;
  residence: string;
  cibil_score: number;
  existing_emi: number;
  credit_utilisation_pct: number;
  savings_balance: number;
  loan_amount: number;
  tenure_months: number;
  loan_type: string;
  co_applicant: boolean;
}

interface RuntimeScoreResult {
  pd: number;
  grade: string;
  outcome: "sanctioned" | "refer" | "declined";
  indicative_rate_pa: number;
  monthly_emi: number;
  foir: number;
  max_eligible_amount: number;
  knockout_reasons: Array<{ code: string; message: string }>;
  refer_reasons: string[];
  shap_top_factors: Array<{
    feature: string;
    contribution: number;
    direction: "up" | "down";
    sentence: string;
  }>;
  counterfactuals: Array<{
    title: string;
    change_summary: string;
    new_pd: number;
    new_grade: string;
    new_outcome: "sanctioned" | "refer" | "declined";
  }>;
}

export function SaakhApp({ initialView = "home" }: SaakhAppProps) {
  useEffect(() => {
    const handleDownloadPdf = async (
      app: RuntimeAppInput,
      res: RuntimeScoreResult,
      id?: string,
      dateStr?: string
    ) => {
      const [{ pdf }, { ReportPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./reports/ReportPdf"),
      ]);

      const assessmentPayload: AssessmentResponse = {
        id: id || "A-1042",
        created_at: dateStr || new Date().toISOString().slice(0, 10),
        application: {
          full_name: app.full_name,
          age: app.age,
          monthly_income: app.monthly_income,
          employment_type: (app.employment_type === "business_owner"
            ? "business"
            : app.employment_type === "self_employed"
              ? "self_employed"
              : "salaried") as AssessmentResponse["application"]["employment_type"],
          years_in_current_job: app.years_in_job,
          residence_type: (app.residence === "rented"
            ? "rented"
            : "owned") as AssessmentResponse["application"]["residence_type"],
          cibil_score: app.cibil_score,
          existing_emi: app.existing_emi,
          credit_card_utilisation: app.credit_utilisation_pct,
          savings_balance: app.savings_balance,
          loan_amount: app.loan_amount,
          loan_tenure_months: app.tenure_months,
          loan_purpose: (["home", "personal", "auto", "education", "business"].includes(app.loan_type)
            ? app.loan_type
            : "personal") as AssessmentResponse["application"]["loan_purpose"],
          co_applicant: app.co_applicant,
        },
        pd: res.pd,
        grade: res.grade as AssessmentResponse["grade"],
        decision: res.outcome,
        indicative_rate: res.indicative_rate_pa,
        monthly_emi: res.monthly_emi,
        foir: res.foir,
        max_eligible_amount: res.max_eligible_amount,
        passed_policy: res.knockout_reasons.length === 0,
        knockout_rules: res.knockout_reasons.map((r) => `${r.code}: ${r.message}`),
        referral_reasons: res.refer_reasons,
        shap_explanations: res.shap_top_factors.map((f) => ({
          feature: f.feature,
          display_name: f.feature,
          contribution_pp: f.contribution,
          direction: f.direction === "up" ? "increases_risk" : "decreases_risk",
          sentence: f.sentence,
        })),
        counterfactuals: (res.counterfactuals || []).map((cf) => ({
          lever: cf.title,
          change_description: cf.change_summary,
          new_pd: cf.new_pd,
          new_grade: cf.new_grade as AssessmentResponse["grade"],
          new_decision: cf.new_outcome,
          new_rate: res.indicative_rate_pa,
          feasible: true,
        })),
        student: "NITHIN KUMAR U",
        usn: "2102508611",
      };

      const blob = await pdf(<ReportPdfDocument assessment={assessmentPayload} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = (app.full_name || "Applicant").replace(/[^a-zA-Z0-9_-]+/g, "_");
      a.download = `Saakh_${safeName}_${id || "Sanction"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    };

    initSaakhRuntime(initialView, handleDownloadPdf);
  }, [initialView]);

  return (
    <div
      dangerouslySetInnerHTML={{ __html: SAAKH_MARKUP }}
      suppressHydrationWarning
    />
  );
}
