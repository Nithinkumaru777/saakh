"use client";

import React from "react";
import { motion } from "motion/react";
import { useMotionPreset } from "@/lib/motion";

export interface GradeChipProps {
  grade: "A" | "B" | "C" | "D" | "E";
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const GRADE_DATA: Record<"A" | "B" | "C" | "D" | "E", { label: string; color: string }> = {
  A: { label: "Low risk", color: "var(--grade-a)" },
  B: { label: "Moderate low", color: "var(--grade-b)" },
  C: { label: "Medium risk", color: "var(--grade-c)" },
  D: { label: "High risk", color: "var(--grade-d)" },
  E: { label: "Very high risk", color: "var(--grade-e)" },
};

export function GradeChip({
  grade,
  showLabel = true,
  size = "md",
  className = "",
}: GradeChipProps) {
  const { reduced } = useMotionPreset();
  const info = GRADE_DATA[grade] || GRADE_DATA.C;

  const sizeStyles = {
    sm: "w-5 h-5 text-xs",
    md: "w-6 h-6 text-sm",
    lg: "w-8 h-8 text-base",
  }[size];

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <motion.div
        key={grade}
        initial={reduced ? undefined : { rotateX: 90, opacity: 0 }}
        animate={reduced ? undefined : { rotateX: 0, opacity: 1 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{ backgroundColor: info.color }}
        className={`flex items-center justify-center font-bold text-white rounded-[2px] shadow-sm ${sizeStyles}`}
      >
        {grade}
      </motion.div>
      {showLabel && (
        <span className="text-xs font-medium text-[var(--ink)]">
          {info.label}
        </span>
      )}
    </div>
  );
}
