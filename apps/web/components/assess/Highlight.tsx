"use client";

import React from "react";
import { motion } from "motion/react";
import { ease, useMotionPreset } from "@/lib/motion";

export interface HighlightProps {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

export function Highlight({ children, active = true, className = "" }: HighlightProps) {
  const { reduced } = useMotionPreset();

  return (
    <span className={`relative inline-block ${className}`}>
      {active && (
        <motion.span
          initial={reduced ? { width: "100%" } : { width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 0.35, ease: ease.inOut }}
          className="absolute inset-y-0.5 -inset-x-1 bg-[var(--haldi-wash)] -z-10 rounded-[1px] pointer-events-none opacity-80 dark:opacity-40"
        />
      )}
      <span className="relative z-0">{children}</span>
    </span>
  );
}
