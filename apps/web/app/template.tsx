"use client";

import React from "react";
import { motion } from "motion/react";
import { useMotionPreset } from "@/lib/motion";

export default function Template({ children }: { children: React.ReactNode }) {
  const { reduced } = useMotionPreset();

  return (
    <motion.div
      initial={reduced ? undefined : { opacity: 0 }}
      animate={reduced ? undefined : { opacity: 1 }}
      exit={reduced ? undefined : { opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="w-full flex-1"
    >
      {children}
    </motion.div>
  );
}
