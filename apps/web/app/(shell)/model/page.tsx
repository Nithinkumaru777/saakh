import React from "react";

export default function ModelPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 border-b border-[var(--ink)] pb-4">
        <h1 className="font-display font-semibold text-3xl sm:text-4xl text-[var(--ink)]">
          Model Transparency & Governance
        </h1>
        <p className="text-sm text-[var(--ink-2)]">
          Underwriting pipeline flow, feature importances, ROC calibration curves, and model card.
        </p>
      </div>
      <div className="p-8 bg-[var(--sheet)] border border-[var(--rule)] rounded-[2px] text-center text-sm text-[var(--ink-3)]">
        Interactive model architecture & governance workbench. (Phase 08)
      </div>
    </div>
  );
}
