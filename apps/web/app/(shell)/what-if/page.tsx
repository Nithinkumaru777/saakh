"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Slider } from "@/components/ui/Slider";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { GradeChip } from "@/components/ui/GradeChip";
import { RiskRuler } from "@/components/ui/RiskRuler";
import { DecisionStamp } from "@/components/assess/DecisionStamp";
import { CounterfactualList } from "@/components/assess/CounterfactualList";
import { formatINR, formatPct } from "@/lib/format";
import {
  type ApplicationInput,
  type ScoreResponse,
  type CounterfactualAdvice,
  scoreApplication,
  assessApplication,
} from "@/lib/api";

export default function WhatIfPage() {
  const [income, setIncome] = useState<number>(85000);
  const [loanAmount, setLoanAmount] = useState<number>(1200000);
  const [tenure, setTenure] = useState<number>(48);
  const [cibil, setCibil] = useState<number>(740);
  const [existingEmi, setExistingEmi] = useState<number>(8000);
  const [cardUtil, setCardUtil] = useState<number>(25);
  const [coApplicant, setCoApplicant] = useState<boolean>(false);

  const [scoreResult, setScoreResult] = useState<ScoreResponse>({
    pd: 0.038,
    grade: "B",
    expected_loss_pct: 0.016,
    decision: "sanctioned",
    indicative_rate: 11.25,
    monthly_emi: 31149,
    foir: 0.46,
    max_eligible_amount: 1850000,
    is_eligible: true,
  });

  const [counterfactuals, setCounterfactuals] = useState<CounterfactualAdvice[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const handler = setTimeout(() => {
      startTransition(async () => {
        const appPayload: ApplicationInput = {
          full_name: "Sensitivity Applicant",
          age: 32,
          employment_type: "salaried",
          years_in_current_job: 4,
          residence_type: "rented",
          monthly_income: income,
          existing_emi: existingEmi,
          savings_balance: income * 3,
          cibil_score: cibil,
          credit_card_utilisation: cardUtil,
          loan_amount: loanAmount,
          loan_tenure_months: tenure,
          loan_purpose: "personal",
          co_applicant: coApplicant,
        };

        try {
          const res = await assessApplication(appPayload);
          setScoreResult({
            pd: res.pd,
            grade: res.grade,
            expected_loss_pct: res.pd * 0.45,
            decision: res.decision,
            indicative_rate: res.indicative_rate,
            monthly_emi: res.monthly_emi,
            foir: res.foir,
            max_eligible_amount: res.max_eligible_amount,
            is_eligible: res.decision !== "declined",
          });
          setCounterfactuals(res.counterfactuals);
        } catch {
          // Fallback scoring
          const res = await scoreApplication(appPayload).catch(() => null);
          if (res) setScoreResult(res);
        }
      });
    }, 150);

    return () => clearTimeout(handler);
  }, [income, loanAmount, tenure, cibil, existingEmi, cardUtil, coApplicant]);

  const handleApplyPatch = (patch: Partial<ApplicationInput>) => {
    if (patch.loan_amount !== undefined) setLoanAmount(patch.loan_amount);
    if (patch.loan_tenure_months !== undefined) setTenure(patch.loan_tenure_months);
    if (patch.existing_emi !== undefined) setExistingEmi(patch.existing_emi);
    if (patch.credit_card_utilisation !== undefined) setCardUtil(patch.credit_card_utilisation);
    if (patch.co_applicant !== undefined) setCoApplicant(patch.co_applicant);
    if (patch.monthly_income !== undefined) setIncome(patch.monthly_income);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1 border-b border-[var(--ink)] pb-4">
        <h1 className="font-display font-semibold text-3xl sm:text-4xl text-[var(--ink)]">
          What-If Sensitivity Simulator
        </h1>
        <p className="text-sm text-[var(--ink-2)]">
          Adjust underwriting parameters in real time (150ms re-scoring) to discover optimal loan structures and counterfactual grade shifts.
        </p>
      </div>

      {/* Grid: Cols 1–5 Sliders, Cols 6–12 Live Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: 7 Sliders */}
        <div className="lg:col-span-5 p-6 bg-[var(--sheet)] border border-[var(--rule)] rounded-[2px] flex flex-col gap-5">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--rule)]">
            <span className="text-xs font-semibold text-[var(--ink)] uppercase tracking-wider font-mono">
              Sensitivity Levers
            </span>
            <span className="text-[11px] text-[var(--ink-3)] font-mono">
              Live updates
            </span>
          </div>

          <CurrencyInput
            label="Monthly Income"
            value={income}
            onChange={setIncome}
            min={15000}
            max={1000000}
          />

          <CurrencyInput
            label="Requested Loan Amount"
            value={loanAmount}
            onChange={setLoanAmount}
            min={50000}
            max={10000000}
          />

          <Slider
            label="Loan Tenure (Months)"
            value={tenure}
            min={6}
            max={240}
            step={6}
            onChange={setTenure}
            formatValue={(v) => `${v} mos (${(v / 12).toFixed(1)} yrs)`}
          />

          <Slider
            label="CIBIL Credit Score"
            value={cibil}
            min={300}
            max={900}
            step={5}
            onChange={setCibil}
            formatValue={(v) => `${v}`}
          />

          <CurrencyInput
            label="Existing Monthly EMIs"
            value={existingEmi}
            onChange={setExistingEmi}
            min={0}
            max={500000}
          />

          <Slider
            label="Credit Card Utilisation (%)"
            value={cardUtil}
            min={0}
            max={100}
            step={1}
            onChange={setCardUtil}
            formatValue={(v) => `${v}%`}
          />

          <div className="flex items-center justify-between pt-2 border-t border-[var(--rule)]">
            <label htmlFor="co_app_whatif" className="text-xs font-medium text-[var(--ink)] cursor-pointer">
              Add Creditworthy Co-Applicant
            </label>
            <input
              id="co_app_whatif"
              type="checkbox"
              checked={coApplicant}
              onChange={(e) => setCoApplicant(e.target.checked)}
              className="w-4 h-4 accent-[var(--ink)] cursor-pointer"
            />
          </div>
        </div>

        {/* Right Column: Result Panel & Counterfactuals */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="p-6 bg-[var(--sheet)] border-[1.5px] border-[var(--ink)] shadow-[6px_6px_0_0_var(--edge)] rounded-[2px] flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-3)]">
                  Simulated Default Risk
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="font-ui font-semibold text-5xl text-[var(--ink)] tracking-tight tabular-nums">
                    {formatPct(scoreResult.pd)}
                  </span>
                  <GradeChip grade={scoreResult.grade} size="md" />
                </div>
              </div>

              <DecisionStamp decision={scoreResult.decision} animate={false} />
            </div>

            <RiskRuler pd={scoreResult.pd} />

            {/* 4-Item Financial Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[var(--sheet-2)] border border-[var(--rule)] rounded-[2px] text-xs">
              <div>
                <span className="text-[var(--ink-3)] block text-[11px]">Monthly EMI</span>
                <span className="font-semibold text-sm text-[var(--ink)] tabular-nums">
                  {formatINR(scoreResult.monthly_emi)}
                </span>
              </div>
              <div>
                <span className="text-[var(--ink-3)] block text-[11px]">Indicative Rate</span>
                <span className="font-semibold text-sm text-[var(--ink)] tabular-nums">
                  {scoreResult.indicative_rate.toFixed(2)}%
                </span>
              </div>
              <div>
                <span className="text-[var(--ink-3)] block text-[11px]">FOIR Ratio</span>
                <span className="font-semibold text-sm text-[var(--ink)] tabular-nums">
                  {(scoreResult.foir * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-[var(--ink-3)] block text-[11px]">Max Eligible</span>
                <span className="font-semibold text-sm text-[var(--ink)] tabular-nums">
                  {formatINR(scoreResult.max_eligible_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Actionable Counterfactual Paths */}
          <div className="p-6 bg-[var(--sheet)] border border-[var(--rule)] rounded-[2px]">
            <CounterfactualList
              counterfactuals={counterfactuals}
              onApplyPatch={handleApplyPatch}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
