"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Search, Sparkles } from "lucide-react";
import { AnimatedIcon } from "@/components/icons/AnimatedIcon";
import { ThemeToggle } from "@/components/theme-toggle";

const ROUTE_NAMES: Record<string, string> = {
  "/assess": "Assess Application",
  "/what-if": "What-If Simulator",
  "/applicants": "Applicants Ledger",
  "/batch": "Batch Processing",
  "/portfolio": "Portfolio Analytics",
  "/model": "Model Transparency",
  "/about": "About & Accreditation",
};

export function Header() {
  const pathname = usePathname();
  const currentTitle = ROUTE_NAMES[pathname] || "Dashboard";

  const triggerCommandPalette = () => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
    );
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 sm:px-6 bg-[var(--sheet)] border-b border-[var(--rule)]">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs">
        <Link
          href="/"
          className="text-[var(--ink-3)] hover:text-[var(--ink)] font-medium transition-colors"
        >
          Saakh
        </Link>
        <span className="text-[var(--rule-strong)]">/</span>
        <span className="text-[var(--ink)] font-semibold">{currentTitle}</span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Academic Course Badge */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-[var(--sheet-2)] border border-[var(--rule)] rounded-[2px] text-[11px] font-mono text-[var(--ink-2)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--haldi)]" />
          <span>CIA-2 · Topic 4: Risk Engine</span>
        </div>

        {/* Guided Demo trigger */}
        <Link
          href="/about#guided-demo"
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[var(--ink)] border border-[var(--rule-strong)] rounded-[2px] bg-[var(--sheet)] hover:bg-[var(--sheet-2)] transition-colors"
        >
          <AnimatedIcon icon={Sparkles} preset="pop" size={14} />
          <span>Guided Demo</span>
        </Link>

        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={triggerCommandPalette}
          className="flex items-center gap-2 px-2.5 py-1 text-xs text-[var(--ink-3)] bg-[var(--sheet-2)] hover:bg-[var(--sheet)] border border-[var(--rule-strong)] rounded-[2px] transition-colors cursor-pointer"
          aria-label="Open command palette"
        >
          <AnimatedIcon icon={Search} preset="draw" size={14} />
          <span className="hidden md:inline font-sans">Search...</span>
          <kbd className="hidden md:inline text-[10px] font-mono px-1 py-0.2 border border-[var(--rule)] rounded-[2px] bg-[var(--sheet)]">
            ⌘K
          </kbd>
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />
      </div>
    </header>
  );
}
