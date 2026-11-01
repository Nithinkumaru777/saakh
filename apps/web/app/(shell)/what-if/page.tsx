import React from "react";

export default function WhatIfPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 border-b border-[var(--ink)] pb-4">
        <h1 className="font-display font-semibold text-3xl sm:text-4xl text-[var(--ink)]">
          What-If Sensitivity Simulator
        </h1>
        <p className="text-sm text-[var(--ink-2)]">
          Interact with single-lever loan and credit adjustments to explore counterfactual grade transitions.
        </p>
      </div>
      <div className="p-8 bg-[var(--sheet)] border border-[var(--rule)] rounded-[2px] text-center text-sm text-[var(--ink-3)]">
        What-If sensitivity slider workbench. (Phase 07)
      </div>
    </div>
  );
}
