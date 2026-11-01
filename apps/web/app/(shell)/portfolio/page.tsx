import React from "react";

export default function PortfolioPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 border-b border-[var(--ink)] pb-4">
        <h1 className="font-display font-semibold text-3xl sm:text-4xl text-[var(--ink)]">
          Portfolio Analytics
        </h1>
        <p className="text-sm text-[var(--ink-2)]">
          High-level executive metrics, default risk distribution, and risk-adjusted lending performance.
        </p>
      </div>
      <div className="p-8 bg-[var(--sheet)] border border-[var(--rule)] rounded-[2px] text-center text-sm text-[var(--ink-3)]">
        Portfolio analytics overview. (Phase 08)
      </div>
    </div>
  );
}
