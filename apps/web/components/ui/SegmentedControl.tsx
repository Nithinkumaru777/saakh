"use client";

import React, { useId } from "react";
import { motion } from "motion/react";
import { spring, useMotionPreset } from "@/lib/motion";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  label?: string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  label,
  className = "",
}: SegmentedControlProps<T>) {
  const groupId = useId();
  const { reduced } = useMotionPreset();

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {label && (
        <span className="text-xs font-medium text-[var(--ink-2)]">{label}</span>
      )}
      <div
        role="radiogroup"
        aria-label={label || "Segmented options"}
        className="relative inline-flex p-0.5 bg-[var(--sheet-2)] border border-[var(--rule-strong)] rounded-[2px] select-none"
      >
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(opt.value)}
              className={`relative z-10 flex-1 px-3 py-1.5 text-xs font-medium text-center transition-colors rounded-[1px] outline-none cursor-pointer focus-visible:ring-1 focus-visible:ring-[var(--ink)] ${
                isSelected
                  ? "text-[var(--on-ink)]"
                  : "text-[var(--ink-2)] hover:text-[var(--ink)]"
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId={reduced ? undefined : `segment-active-${groupId}`}
                  transition={spring.snappy}
                  className="absolute inset-0 bg-[var(--ink)] -z-10 rounded-[1px]"
                />
              )}
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
