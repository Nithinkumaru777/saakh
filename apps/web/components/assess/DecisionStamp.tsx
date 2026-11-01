"use client";

import React from "react";
import { motion } from "motion/react";
import { spring, useMotionPreset } from "@/lib/motion";

export interface DecisionStampProps {
  decision: "sanctioned" | "refer" | "declined";
  animate?: boolean;
  className?: string;
}

const STAMP_CONFIG = {
  sanctioned: {
    text: "SANCTIONED",
    color: "var(--sanction)",
    borderColor: "var(--sanction)",
    bgColor: "var(--sanction-wash)",
  },
  refer: {
    text: "REFER FOR REVIEW",
    color: "var(--refer)",
    borderColor: "var(--refer)",
    bgColor: "var(--refer-wash)",
  },
  declined: {
    text: "DECLINED",
    color: "var(--decline)",
    borderColor: "var(--decline)",
    bgColor: "var(--decline-wash)",
  },
};

export function DecisionStamp({ decision, animate = true, className = "" }: DecisionStampProps) {
  const { reduced } = useMotionPreset();
  const config = STAMP_CONFIG[decision] || STAMP_CONFIG.sanctioned;

  return (
    <motion.div
      key={decision}
      initial={reduced || !animate ? { scale: 1, opacity: 1, rotate: -3 } : { scale: 2.2, opacity: 0, rotate: -12 }}
      animate={{ scale: 1, opacity: 1, rotate: -3 }}
      transition={spring.stamp}
      style={{
        color: config.color,
        borderColor: config.borderColor,
        backgroundColor: config.bgColor,
      }}
      className={`inline-flex items-center justify-center px-4 py-1.5 border-[2.5px] rounded-[4px] select-none shadow-xs ${className}`}
    >
      <div
        style={{ borderColor: config.borderColor }}
        className="px-2 py-0.5 border border-dashed rounded-[2px]"
      >
        <span className="font-ui font-extrabold text-sm sm:text-base tracking-[0.14em] uppercase">
          {config.text}
        </span>
      </div>
    </motion.div>
  );
}
