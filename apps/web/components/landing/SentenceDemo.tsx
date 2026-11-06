"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, CircleCheck, BadgeAlert, Ban, Play } from "lucide-react";
import { AnimatedIcon } from "@/components/icons/AnimatedIcon";
import { RiskRuler } from "@/components/ui/RiskRuler";
import { GradeChip } from "@/components/ui/GradeChip";
import { Button } from "@/components/ui/button";
import { formatINR, formatPct } from "@/lib/format";
import { scoreApplication, type EmploymentType, type ScoreResponse } from "@/lib/api";

const EMPLOYMENT_OPTIONS: EmploymentType[] = ["salaried", "self_employed", "business", "professional"];

export function SentenceDemo() {
  const [employment, setEmployment] = useState<EmploymentType>("salaried");
  const [income, setIncome] = useState<number>(85000);
  const [cibil, setCibil] = useState<number>(760);
  const [amount, setAmount] = useState<number>(800000);
  const [tenure, setTenure] = useState<number>(48);

  const [scoreResult, setScoreResult] = useState<ScoreResponse>({
    pd: 0.023,
    grade: "A",
    expected_loss_pct: 0.010,
    decision: "sanctioned",
    indicative_rate: 10.5,
    monthly_emi: 20499,
    foir: 0.24,
    max_eligible_amount: 1950000,
    is_eligible: true,
  });

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const handler = setTimeout(() => {
      startTransition(async () => {
        try {
          const res = await scoreApplication({
            monthly_income: income,
            loan_amount: amount,
            loan_tenure_months: tenure,
            cibil_score: cibil,
            employment_type: employment,
            existing_emi: 0,
            credit_card_utilisation: 18,
            age: 32,
            residence_type: "rented",
            loan_purpose: "personal",
            co_applicant: false,
            years_in_current_job: 4,
            savings_balance: income * 3,
          });
          setScoreResult(res);
        } catch {
          // Fallback approximate simulation if API backend is starting up
          const approxPd = Math.max(0.01, Math.min(0.55, 0.02 + (800 - cibil) * 0.0008 + (amount / (income * tenure)) * 0.05));
          const grade = approxPd <= 0.03 ? "A" : approxPd <= 0.07 ? "B" : approxPd <= 0.15 ? "C" : approxPd <= 0.30 ? "D" : "E";
          const decision = grade === "A" || grade === "B" ? "sanctioned" : grade === "C" ? "refer" : "declined";
          setScoreResult({
            pd: approxPd,
            grade,
            expected_loss_pct: approxPd * 0.45,
            decision,
            indicative_rate: 10.5 + (approxPd * 10),
            monthly_emi: Math.round((amount * 1.25) / tenure),
            foir: 0.3,
            max_eligible_amount: income * 24,
            is_eligible: decision !== "declined",
          });
        }
      });
    }, 150);

    return () => clearTimeout(handler);
  }, [employment, income, cibil, amount, tenure]);

  const cycleEmployment = () => {
    const nextIdx = (EMPLOYMENT_OPTIONS.indexOf(employment) + 1) % EMPLOYMENT_OPTIONS.length;
    setEmployment(EMPLOYMENT_OPTIONS[nextIdx]);
  };

  const cycleIncome = () => {
    const steps = [45000, 85000, 150000, 250000, 35000];
    const nextIdx = (steps.indexOf(income) + 1) % steps.length;
    setIncome(steps[nextIdx]);
  };

  const cycleCibil = () => {
    const steps = [760, 820, 680, 590, 710];
    const nextIdx = (steps.indexOf(cibil) + 1) % steps.length;
    setCibil(steps[nextIdx]);
  };

  const cycleAmount = () => {
    const steps = [800000, 1500000, 3000000, 400000, 5000000];
    const nextIdx = (steps.indexOf(amount) + 1) % steps.length;
    setAmount(steps[nextIdx]);
  };

  const cycleTenure = () => {
    const steps = [48, 60, 24, 84, 36];
    const nextIdx = (steps.indexOf(tenure) + 1) % steps.length;
    setTenure(steps[nextIdx]);
  };

  const decisionBadge = {
    sanctioned: {
      label: "Sanctioned",
      icon: CircleCheck,
      color: "bg-[var(--sanction-wash)] text-[var(--sanction)] border-[var(--sanction)]",
    },
    refer: {
      label: "Refer for Review",
      icon: BadgeAlert,
      color: "bg-[var(--refer-wash)] text-[var(--refer)] border-[var(--refer)]",
    },
    declined: {
      label: "Declined",
      icon: Ban,
      color: "bg-[var(--decline-wash)] text-[var(--decline)] border-[var(--decline)]",
    },
  }[scoreResult.decision];

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl">
      {/* Mad-Lib Sentence Box */}
      <div className="p-6 bg-[var(--sheet)] border border-[var(--rule-strong)] rounded-[2px] shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-xs font-mono text-[var(--ink-3)]">
          <span className="w-2 h-2 bg-[var(--haldi)] inline-block" />
          <span>Click any underlined value to change live parameters</span>
        </div>

        <p className="font-display text-xl sm:text-2xl leading-relaxed text-[var(--ink)]">
          A{" "}
          <button
            type="button"
            onClick={cycleEmployment}
            className="font-ui font-semibold text-[var(--ink)] underline decoration-[var(--haldi)] decoration-2 underline-offset-4 hover:bg-[var(--haldi-wash)] px-1 rounded-[1px] transition-colors cursor-pointer"
            title="Click to toggle employment type"
          >
            {employment}
          </button>{" "}
          applicant earning{" "}
          <button
            type="button"
            onClick={cycleIncome}
            className="font-ui font-semibold text-[var(--ink)] underline decoration-[var(--haldi)] decoration-2 underline-offset-4 hover:bg-[var(--haldi-wash)] px-1 rounded-[1px] transition-colors cursor-pointer tabular-nums"
            title="Click to cycle monthly income"
          >
            {formatINR(income)}
          </button>{" "}
          a month, with a CIBIL score of{" "}
          <button
            type="button"
            onClick={cycleCibil}
            className="font-ui font-semibold text-[var(--ink)] underline decoration-[var(--haldi)] decoration-2 underline-offset-4 hover:bg-[var(--haldi-wash)] px-1 rounded-[1px] transition-colors cursor-pointer tabular-nums"
            title="Click to cycle CIBIL credit score"
          >
            {cibil}
          </button>
          , asks for{" "}
          <button
            type="button"
            onClick={cycleAmount}
            className="font-ui font-semibold text-[var(--ink)] underline decoration-[var(--haldi)] decoration-2 underline-offset-4 hover:bg-[var(--haldi-wash)] px-1 rounded-[1px] transition-colors cursor-pointer tabular-nums"
            title="Click to cycle loan amount"
          >
            {formatINR(amount)}
          </button>{" "}
          over{" "}
          <button
            type="button"
            onClick={cycleTenure}
            className="font-ui font-semibold text-[var(--ink)] underline decoration-[var(--haldi)] decoration-2 underline-offset-4 hover:bg-[var(--haldi-wash)] px-1 rounded-[1px] transition-colors cursor-pointer tabular-nums"
            title="Click to cycle tenure"
          >
            {tenure} months
          </button>
          .
        </p>
      </div>

      {/* 1.5px ink rule divider */}
      <div className="h-[1.5px] bg-[var(--ink)] w-full" />

      {/* Live Result Band */}
      <div className="p-6 bg-[var(--sheet)] border border-[var(--rule-strong)] rounded-[2px] flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-3">
              <span className="font-ui font-semibold text-4xl sm:text-5xl text-[var(--ink)] tracking-tight tabular-nums">
                {formatPct(scoreResult.pd)}
              </span>
              <GradeChip grade={scoreResult.grade} size="md" />
            </div>
            <span className="text-xs font-medium text-[var(--ink-2)] mt-1">
              Estimated probability of default (PD)
            </span>
          </div>

          {/* Decision badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-[2px] text-xs font-semibold ${decisionBadge.color}`}>
            <AnimatedIcon icon={decisionBadge.icon} preset="pop" size={16} />
            <span className="uppercase tracking-wider">{decisionBadge.label}</span>
          </div>
        </div>

        {/* Risk Ruler Component */}
        <RiskRuler pd={scoreResult.pd} />

        {/* Quick finance summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[var(--rule)] text-xs">
          <div>
            <span className="text-[var(--ink-3)] block text-[11px]">Monthly EMI</span>
            <span className="font-semibold text-[var(--ink)] tabular-nums">
              {formatINR(scoreResult.monthly_emi)}
            </span>
          </div>
          <div>
            <span className="text-[var(--ink-3)] block text-[11px]">Indicative Rate</span>
            <span className="font-semibold text-[var(--ink)] tabular-nums">
              {scoreResult.indicative_rate.toFixed(2)}%
            </span>
          </div>
          <div>
            <span className="text-[var(--ink-3)] block text-[11px]">FOIR Ratio</span>
            <span className="font-semibold text-[var(--ink)] tabular-nums">
              {(scoreResult.foir * 100).toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-[var(--ink-3)] block text-[11px]">Max Eligible</span>
            <span className="font-semibold text-[var(--ink)] tabular-nums">
              {formatINR(scoreResult.max_eligible_amount)}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons (NeoPOP extruded style) */}
      <div className="flex flex-wrap items-center gap-4 pt-2">
        <Link href="/assess">
          <Button variant="primary" size="lg" className="flex items-center gap-2">
            <span>Assess a full application</span>
            <AnimatedIcon icon={ArrowRight} preset="nudge-x" size={18} />
          </Button>
        </Link>
        <Link href="/model">
          <Button variant="secondary" size="lg" className="flex items-center gap-2">
            <span>See how the AI decides</span>
            <AnimatedIcon icon={Sparkles} preset="pop" size={18} />
          </Button>
        </Link>
        <Link href="/tutorials">
          <Button variant="secondary" size="lg" className="flex items-center gap-2">
            <span>Watch tutorial video</span>
            <AnimatedIcon icon={Play} preset="pop" size={18} />
          </Button>
        </Link>
      </div>
    </div>
  );
}
