import React from "react";

export default function AssessPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 border-b border-[var(--ink)] pb-4">
        <h1 className="font-display font-semibold text-3xl sm:text-4xl text-[var(--ink)]">
          Assess Loan Application
        </h1>
        <p className="text-sm text-[var(--ink-2)]">
          Dual-column underwriting sheet with live ML estimation, policy verification, and explainability.
        </p>
      </div>
      <div className="p-8 bg-[var(--sheet)] border border-[var(--rule)] rounded-[2px] text-center text-sm text-[var(--ink-3)]">
        Assessment Worksheet initialized. (Phase 06 signature layout)
      </div>
    </div>
  );
}
