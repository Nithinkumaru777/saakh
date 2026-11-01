"use client";

import React from "react";
import { motion } from "motion/react";
import type { ShapExplanation } from "@/lib/api";
import { useMotionPreset } from "@/lib/motion";

export interface FactorBarsProps {
  explanations: ShapExplanation[];
  className?: string;
}

export function FactorBars({ explanations, className = "" }: FactorBarsProps) {
  const { reduced } = useMotionPreset();

  if (!explanations || explanations.length === 0) {
    return (
      <div className="text-xs text-[var(--ink-3)] italic py-2">
        No factor explanations available.
      </div>
    );
  }

  // Find max absolute contribution for scale normalization
  const maxAbs = Math.max(...explanations.map((e) => Math.abs(e.contribution_pp)), 1.0);

  return (
    <div className={`flex flex-col gap-3 w-full ${className}`}>
      {/* Header and Legend */}
      <div className="flex items-center justify-between text-xs pb-1 border-b border-[var(--rule)]">
        <span className="font-semibold text-[var(--ink)]">
          What moved the credit score
        </span>
        <div className="flex items-center gap-3 text-[11px] text-[var(--ink-3)] font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-[var(--ink)] inline-block rounded-[1px]" />
            <span>Lowers risk</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-[var(--haldi)] inline-block rounded-[1px]" />
            <span>Raises risk</span>
          </span>
        </div>
      </div>

      {/* Factor Bars List */}
      <div className="flex flex-col gap-2.5">
        {explanations.slice(0, 5).map((exp, idx) => {
          const isNegative = exp.contribution_pp < 0; // Lowers risk
          const absVal = Math.abs(exp.contribution_pp);
          const barWidthPct = Math.min((absVal / maxAbs) * 100, 100);

          return (
            <div key={exp.feature + idx} className="flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-[var(--ink)]">
                  {exp.display_name}
                </span>
                <span
                  className={`font-mono font-semibold tabular-nums ${
                    isNegative ? "text-[var(--ink)]" : "text-[var(--haldi-edge)] dark:text-[var(--haldi)]"
                  }`}
                >
                  {isNegative ? "" : "+"}
                  {exp.contribution_pp.toFixed(2)} pp
                </span>
              </div>

              {/* Diverging Bar Track */}
              <div className="relative h-2 w-full bg-[var(--sheet-2)] border border-[var(--rule)] rounded-[1px] overflow-hidden">
                {/* Center Baseline */}
                <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-[var(--rule-strong)] z-10" />

                {isNegative ? (
                  // Extends left from center (ink)
                  <motion.div
                    initial={reduced ? undefined : { width: 0 }}
                    animate={{ width: `${barWidthPct / 2}%` }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    className="absolute right-1/2 top-0 bottom-0 bg-[var(--ink)] rounded-l-[1px]"
                  />
                ) : (
                  // Extends right from center (haldi)
                  <motion.div
                    initial={reduced ? undefined : { width: 0 }}
                    animate={{ width: `${barWidthPct / 2}%` }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    className="absolute left-1/2 top-0 bottom-0 bg-[var(--haldi)] rounded-r-[1px]"
                  />
                )}
              </div>

              {/* Plain-Language Narrative Sentence */}
              <p className="text-[11px] text-[var(--ink-2)] leading-tight">
                {exp.sentence}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
