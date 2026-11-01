"use client";

import React from "react";
import { motion } from "motion/react";
import { spring, useMotionPreset } from "@/lib/motion";
import { GRADE_SEGMENTS, pdToRulerPercentage } from "@/lib/ruler";
import { formatPct } from "@/lib/format";

export interface RiskRulerProps {
  pd: number;
  className?: string;
}

export function RiskRuler({ pd, className = "" }: RiskRulerProps) {
  const { reduced } = useMotionPreset();
  const percentage = pdToRulerPercentage(pd);
  const formattedPct = formatPct(pd);

  return (
    <div
      role="meter"
      aria-label="Default Risk Meter"
      aria-valuenow={Math.round(pd * 1000) / 10}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${formattedPct} estimated probability of default`}
      className={`flex flex-col gap-1 w-full select-none ${className}`}
    >
      {/* Needle / Marker row */}
      <div className="relative h-5 w-full">
        <motion.div
          animate={{ left: `${percentage}%` }}
          transition={reduced ? { duration: 0 } : spring.marker}
          className="absolute -translate-x-1/2 flex flex-col items-center"
        >
          <span className="text-[11px] font-semibold text-[var(--ink)] tabular-nums px-1 py-0.2 bg-[var(--haldi-wash)] border border-[var(--haldi)] rounded-[2px] leading-tight shadow-xs">
            {formattedPct}
          </span>
          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-[var(--ink)]" />
        </motion.div>
      </div>

      {/* 5-segment track */}
      <div className="flex h-3 w-full border border-[var(--rule-strong)] rounded-[2px] overflow-hidden bg-[var(--sheet-2)]">
        {GRADE_SEGMENTS.map((seg) => (
          <div
            key={seg.grade}
            style={{ backgroundColor: seg.colorVar }}
            className="flex-1 flex items-center justify-center border-r last:border-r-0 border-[var(--canvas)] opacity-90 transition-opacity hover:opacity-100"
            title={`${seg.grade}: ${seg.label} (${(seg.minPd * 100).toFixed(0)}% - ${(seg.maxPd * 100).toFixed(0)}%)`}
          >
            <span className="text-[9px] font-bold text-white tracking-wider">
              {seg.grade}
            </span>
          </div>
        ))}
      </div>

      {/* Boundary labels underneath */}
      <div className="flex justify-between text-[10px] text-[var(--ink-3)] font-mono px-0.5">
        <span>0%</span>
        <span>3%</span>
        <span>7%</span>
        <span>15%</span>
        <span>30%</span>
        <span>60%+</span>
      </div>
    </div>
  );
}
