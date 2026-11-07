"use client";

import React, { useEffect } from "react";
import { SAAKH_MARKUP } from "./saakhMarkup";
import { initSaakhRuntime } from "./saakhRuntime";
import type { AssessmentResponse } from "@/lib/api";

export interface SaakhAppProps {
  initialView?: string;
}

/** Application object as the runtime holds it (readForm / personas / API history). */
export interface RuntimeAppInput {
  full_name: string;
  age: number;
  monthly_income: number;
  employment_type: string;
  years_in_job: number;
  residence: string;
  cibil_score: number;
  existing_emi: number;
  credit_utilisation_pct: number;
  loan_amount: number;
  tenure_months: number;
  loan_type: string;
  purpose?: string;
  savings_balance?: number;
  co_applicant?: boolean;
}

/** Result object as the runtime produces it (score() and mapApiAssessment() in saakhRuntime.ts). */
export interface RuntimeScoreResult {
  pd: number;
  grade: string;
  outcome: string; // "SANCTIONED" | "REFER" | "DECLINED"
  rate?: number | null;
  emi: number;
  foir: number;
  maxAmt: number;
  K?: Array<[string, string]>;
  R?: Array<[string, string]>;
  factors?: Array<{ k?: string; label: string; pp: number; dir: string; sentence: string }>;
}

const DECISION = (o: string) => (o || "").toLowerCase() as AssessmentResponse["decision"];

/** Map the runtime's application + result into the report's AssessmentResponse. Pure, so it is unit-tested. */
export function toReportAssessment(app: RuntimeAppInput, res: RuntimeScoreResult, id?: string, dateStr?: string): AssessmentResponse {
  const K = res.K || [];
  return {
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
      residence_type: (app.residence === "rented" ? "rented" : "owned") as AssessmentResponse["application"]["residence_type"],
      cibil_score: app.cibil_score,
      existing_emi: app.existing_emi,
      credit_card_utilisation: app.credit_utilisation_pct,
      savings_balance: app.savings_balance ?? 0,
      loan_amount: app.loan_amount,
      loan_tenure_months: app.tenure_months,
      loan_purpose: (["home", "personal", "auto", "education", "business"].includes(app.loan_type)
        ? app.loan_type
        : "personal") as AssessmentResponse["application"]["loan_purpose"],
      co_applicant: !!app.co_applicant,
    },
    pd: res.pd,
    grade: res.grade as AssessmentResponse["grade"],
    decision: DECISION(res.outcome),
    indicative_rate: res.rate ?? 0,
    monthly_emi: res.emi,
    foir: res.foir,
    max_eligible_amount: res.maxAmt,
    passed_policy: K.length === 0,
    knockout_rules: K.map(([code, msg]) => `${code}: ${msg}`),
    referral_reasons: (res.R || []).map(([code, msg]) => `${code}: ${msg}`),
    shap_explanations: (res.factors || []).map((f) => ({
      feature: f.k || f.label,
      display_name: f.label,
      contribution_pp: f.pp,
      direction: f.dir === "raises" ? "increases_risk" : "decreases_risk",
      sentence: f.sentence,
    })),
    // ponytail: ReportPdf does not render counterfactuals, and the runtime's paths carry no decision; map them when the report shows them.
    counterfactuals: [],
    student: "NITHIN KUMAR U",
    usn: "2102508611",
  };
}

/** Public pages arrive already visible, so their content paints without waiting for JavaScript. */
function markupFor(view: string) {
  if (!["home", "login", "about", "model"].includes(view)) return SAAKH_MARKUP;
  return SAAKH_MARKUP.replace(`class="view" data-view="${view}"`, `class="view on" data-view="${view}"`);
}

export function SaakhApp({ initialView = "home" }: SaakhAppProps) {
  useEffect(() => {
    const handleDownloadPdf = async (app: RuntimeAppInput, res: RuntimeScoreResult, id?: string, dateStr?: string) => {
      const [{ pdf }, { ReportPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./reports/ReportPdf"),
      ]);
      const assessmentPayload = toReportAssessment(app, res, id, dateStr);
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
      dangerouslySetInnerHTML={{ __html: markupFor(initialView) }}
      suppressHydrationWarning
    />
  );
}
