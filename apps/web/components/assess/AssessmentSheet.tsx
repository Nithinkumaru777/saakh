"use client";

import React from "react";
import { motion } from "motion/react";
import {
  FileCheck,
  CircleCheck,
  BadgeAlert,
  Gavel,
  Download,
  Share2,
} from "lucide-react";
import { AnimatedIcon } from "@/components/icons/AnimatedIcon";
import { GradeChip } from "@/components/ui/GradeChip";
import { RiskRuler } from "@/components/ui/RiskRuler";
import { DecisionStamp } from "@/components/assess/DecisionStamp";
import { Highlight } from "@/components/assess/Highlight";
import { FactorBars } from "@/components/assess/FactorBars";
import { CounterfactualList } from "@/components/assess/CounterfactualList";
import { Button } from "@/components/ui/button";
import { formatINR, formatPct } from "@/lib/format";
import type { AssessmentResponse, ApplicationInput } from "@/lib/api";
import { useMotionPreset } from "@/lib/motion";

export interface AssessmentSheetProps {
  assessment: AssessmentResponse | null;
  isScanning?: boolean;
  onApplyPatch?: (patch: Partial<ApplicationInput>) => void;
  onExportPdf?: () => void;
  className?: string;
}

export function AssessmentSheet({
  assessment,
  isScanning = false,
  onApplyPatch,
  onExportPdf,
  className = "",
}: AssessmentSheetProps) {
  const { reduced } = useMotionPreset();

  if (!assessment) {
    return (
      <div className={`p-8 bg-[var(--sheet)] border-[1.5px] border-[var(--ink)] shadow-[6px_6px_0_0_var(--edge)] rounded-[2px] flex flex-col items-center justify-center text-center min-h-[460px] ${className}`}>
        <div className="w-12 h-12 rounded-full bg-[var(--sheet-2)] border border-[var(--rule)] flex items-center justify-center text-[var(--ink-3)] mb-4">
          <AnimatedIcon icon={FileCheck} preset="draw" size={24} />
        </div>
        <h3 className="font-display font-semibold text-xl text-[var(--ink)] mb-1">
          No Assessment Run Yet
        </h3>
        <p className="text-xs text-[var(--ink-2)] max-w-sm leading-relaxed">
          Fill the underwriting application form on the right or select a sample persona to evaluate credit risk, policy rules, and rate pricing.
        </p>
      </div>
    );
  }

  const headline = {
    sanctioned: `Sanctioned at grade ${assessment.grade}`,
    refer: "Referred for Senior Credit Review",
    declined: "Declined under Underwriting Policy",
  }[assessment.decision];

  return (
    <div className={`relative p-6 sm:p-8 bg-[var(--sheet)] border-[1.5px] border-[var(--ink)] shadow-[6px_6px_0_0_var(--edge)] rounded-[2px] flex flex-col gap-6 overflow-hidden ${className}`}>
      {/* Scan line effect during run sequence */}
      {isScanning && !reduced && (
        <motion.div
          initial={{ top: "-10%" }}
          animate={{ top: "110%" }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute left-0 right-0 h-1 bg-gradient-to-b from-[var(--haldi)] to-transparent pointer-events-none z-30 opacity-80"
        />
      )}

      {/* Header Row */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--rule)] text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold uppercase tracking-wider text-[var(--ink)]">
            ASSESSMENT SHEET
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--sanction)]" />
          <span className="text-[11px] text-[var(--ink-3)] font-mono">
            {assessment.id ? `REF: ${assessment.id.slice(0, 8)}` : "LIVE ESTIMATE"}
          </span>
        </div>
        <div className="text-[11px] font-mono text-[var(--ink-3)]">
          {assessment.created_at ? new Date(assessment.created_at).toLocaleTimeString() : "Not saved"}
        </div>
      </div>

      {/* Decision Headline & Stamp Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1 max-w-md">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-3)]">
            Underwriting Verdict
          </span>
          <h2 className="font-display font-semibold text-2xl sm:text-3xl text-[var(--ink)] leading-snug">
            <Highlight active={true}>{headline}</Highlight>
          </h2>
          <span className="text-xs text-[var(--ink-2)]">
            Applicant: <strong className="text-[var(--ink)] font-semibold">{assessment.application.full_name}</strong>
          </span>
        </div>

        {/* Rubber Stamp */}
        <DecisionStamp decision={assessment.decision} />
      </div>

      {/* Probability of Default & Grade */}
      <div className="flex flex-col gap-2 pt-2">
        <div className="flex items-baseline gap-4">
          <span className="font-ui font-semibold text-5xl sm:text-6xl text-[var(--ink)] tracking-tight tabular-nums">
            {formatPct(assessment.pd)}
          </span>
          <GradeChip grade={assessment.grade} size="lg" />
        </div>
        <span className="text-xs text-[var(--ink-3)]">
          Estimated probability of default (PD) based on 28 calibrated credit features
        </span>
      </div>

      {/* Risk Ruler */}
      <RiskRuler pd={assessment.pd} />

      {/* 4-Item Financial Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[var(--sheet-2)] border border-[var(--rule)] rounded-[2px] text-xs">
        <div>
          <span className="text-[var(--ink-3)] block text-[11px]">Monthly EMI</span>
          <span className="font-semibold text-sm text-[var(--ink)] tabular-nums">
            {formatINR(assessment.monthly_emi)}
          </span>
        </div>
        <div>
          <span className="text-[var(--ink-3)] block text-[11px]">Indicative Rate</span>
          <span className="font-semibold text-sm text-[var(--ink)] tabular-nums">
            {assessment.indicative_rate.toFixed(2)}%
          </span>
        </div>
        <div>
          <span className="text-[var(--ink-3)] block text-[11px]">FOIR Ratio</span>
          <span className="font-semibold text-sm text-[var(--ink)] tabular-nums">
            {(assessment.foir * 100).toFixed(1)}%
          </span>
        </div>
        <div>
          <span className="text-[var(--ink-3)] block text-[11px]">Max Eligible</span>
          <span className="font-semibold text-sm text-[var(--ink)] tabular-nums">
            {formatINR(assessment.max_eligible_amount)}
          </span>
        </div>
      </div>

      {/* Policy Rules Status Box */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-[var(--ink)]">
          Policy Rules & Compliance
        </span>
        {assessment.passed_policy && assessment.referral_reasons.length === 0 ? (
          <div className="flex items-center gap-2 p-3 bg-[var(--sanction-wash)] border border-[var(--sanction)] rounded-[2px] text-xs text-[var(--sanction)] font-medium">
            <AnimatedIcon icon={CircleCheck} preset="draw" size={16} />
            <span>All mandatory knock-out rules and referral criteria satisfied.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {assessment.knockout_rules.map((rule, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-3 bg-[var(--decline-wash)] border border-[var(--decline)] rounded-[2px] text-xs text-[var(--decline)]"
              >
                <AnimatedIcon icon={Gavel} preset="pop" size={16} className="shrink-0 mt-0.5" />
                <span>
                  <strong>Knock-out Triggered:</strong> {rule}
                </span>
              </div>
            ))}
            {assessment.referral_reasons.map((reason, i) => (
              <div
                key={i}
                className="flex items-start gap-2 p-3 bg-[var(--refer-wash)] border border-[var(--refer)] rounded-[2px] text-xs text-[var(--refer)]"
              >
                <AnimatedIcon icon={BadgeAlert} preset="pop" size={16} className="shrink-0 mt-0.5" />
                <span>
                  <strong>Referral Flag:</strong> {reason}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SHAP Factor Bars */}
      <FactorBars explanations={assessment.shap_explanations} />

      {/* Counterfactual Guidance */}
      <CounterfactualList
        counterfactuals={assessment.counterfactuals}
        onApplyPatch={onApplyPatch}
      />

      {/* Footer Action Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[var(--rule)]">
        <div className="text-[11px] font-mono text-[var(--ink-3)]">
          Verified for: NITHIN KUMAR U (2102508611)
        </div>
        <div className="flex items-center gap-2">
          {onExportPdf && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onExportPdf}
              className="flex items-center gap-1.5"
            >
              <AnimatedIcon icon={Download} preset="nudge-y" size={14} />
              <span>Export PDF Note</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
