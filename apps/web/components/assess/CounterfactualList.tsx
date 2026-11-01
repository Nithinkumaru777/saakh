"use client";

import React from "react";
import { TrendingUp, ArrowRight } from "lucide-react";
import { AnimatedIcon } from "@/components/icons/AnimatedIcon";
import { GradeChip } from "@/components/ui/GradeChip";
import { Button } from "@/components/ui/button";
import type { CounterfactualAdvice, ApplicationInput } from "@/lib/api";
import { formatPct } from "@/lib/format";

export interface CounterfactualListProps {
  counterfactuals: CounterfactualAdvice[];
  onApplyPatch?: (patch: Partial<ApplicationInput>) => void;
  className?: string;
}

export function CounterfactualList({
  counterfactuals,
  onApplyPatch,
  className = "",
}: CounterfactualListProps) {
  if (!counterfactuals || counterfactuals.length === 0) {
    return (
      <div className="p-3 bg-[var(--sheet-2)] border border-[var(--rule)] rounded-[2px] text-xs text-[var(--ink-3)] italic">
        No counterfactual improvements found. Applicant is already at an optimal tier.
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2.5 w-full ${className}`}>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--ink)] pb-1 border-b border-[var(--rule)]">
        <AnimatedIcon icon={TrendingUp} preset="draw" size={14} />
        <span>Paths to a better grade & lower rate</span>
      </div>

      <div className="flex flex-col gap-2">
        {counterfactuals.map((cf, idx) => (
          <div
            key={cf.lever + idx}
            className="p-3 bg-[var(--sheet-2)] border border-[var(--rule)] rounded-[2px] flex items-center justify-between gap-3 text-xs hover:border-[var(--rule-strong)] transition-colors"
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-[var(--ink)]">
                {cf.change_description}
              </span>
              <div className="flex items-center gap-2 text-[11px] text-[var(--ink-2)]">
                <span>New Risk: <strong className="font-mono text-[var(--ink)]">{formatPct(cf.new_pd)}</strong></span>
                <span>·</span>
                <span>Rate: <strong className="font-mono text-[var(--ink)]">{cf.new_rate.toFixed(2)}%</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <GradeChip grade={cf.new_grade} size="sm" showLabel={false} />
              {onApplyPatch && cf.patch && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onApplyPatch(cf.patch!)}
                  className="text-[11px] px-2 py-1 flex items-center gap-1"
                >
                  <span>Apply</span>
                  <AnimatedIcon icon={ArrowRight} preset="nudge-x" size={12} />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
