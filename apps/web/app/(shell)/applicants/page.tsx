import React from "react";

export default function ApplicantsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 border-b border-[var(--ink)] pb-4">
        <h1 className="font-display font-semibold text-3xl sm:text-4xl text-[var(--ink)]">
          Applicants Ledger
        </h1>
        <p className="text-sm text-[var(--ink-2)]">
          Swiss-style data table with outcome filtering, search, and deep-link review.
        </p>
      </div>
      <div className="p-8 bg-[var(--sheet)] border border-[var(--rule)] rounded-[2px] text-center text-sm text-[var(--ink-3)]">
        Applicants portfolio ledger table. (Phase 07)
      </div>
    </div>
  );
}
