import React from "react";

export default function BatchPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 border-b border-[var(--ink)] pb-4">
        <h1 className="font-display font-semibold text-3xl sm:text-4xl text-[var(--ink)]">
          Batch Underwriting
        </h1>
        <p className="text-sm text-[var(--ink-2)]">
          Drag and drop portfolio CSV files to score bulk loan applications with policy audit.
        </p>
      </div>
      <div className="p-8 bg-[var(--sheet)] border border-[var(--rule)] rounded-[2px] text-center text-sm text-[var(--ink-3)]">
        Batch CSV processing workbench. (Phase 07)
      </div>
    </div>
  );
}
