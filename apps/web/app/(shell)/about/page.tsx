"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Sparkles, BookOpen, User, Award } from "lucide-react";
import { AnimatedIcon } from "@/components/icons/AnimatedIcon";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-10 max-w-4xl">
      {/* Title */}
      <div className="flex flex-col gap-2 border-b border-[var(--ink)] pb-6">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 bg-[var(--haldi-wash)] border border-[var(--haldi)] rounded-[2px] text-xs font-mono text-[var(--ink)] w-fit">
          <AnimatedIcon icon={Award} preset="pop" size={14} />
          <span>CIA-2 ACADEMIC SUBMISSION</span>
        </div>
        <h1 className="font-display font-semibold text-4xl sm:text-5xl text-[var(--ink)]">
          About Saakh (साख)
        </h1>
        <p className="text-base text-[var(--ink-2)] leading-relaxed">
          An AI-Based Loan Eligibility and Risk Assessment System built for retail banking and NBFCs in India.
        </p>
      </div>

      {/* Student & Course Credentials */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-[var(--sheet)] border border-[var(--rule-strong)] rounded-[2px] flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--ink-3)]">
            <AnimatedIcon icon={User} preset="pop" size={16} />
            <span>Student Information</span>
          </div>
          <div className="text-2xl font-bold font-display text-[var(--ink)]">
            NITHIN KUMAR U
          </div>
          <div className="font-mono text-sm text-[var(--ink-2)]">
            USN: <strong className="text-[var(--ink)] font-semibold">2102508611</strong>
          </div>
        </div>

        <div className="p-6 bg-[var(--sheet)] border border-[var(--rule-strong)] rounded-[2px] flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--ink-3)]">
            <AnimatedIcon icon={BookOpen} preset="draw" size={16} />
            <span>Course & Topic</span>
          </div>
          <div className="text-xl font-bold font-display text-[var(--ink)]">
            AI for Finance — CIA-2
          </div>
          <div className="text-sm text-[var(--ink-2)]">
            Topic 4: AI-Based Loan Eligibility and Risk Assessment System
          </div>
        </div>
      </div>

      {/* Guided Tour Banner */}
      <div id="guided-demo" className="p-6 bg-[var(--sheet)] border-2 border-[var(--ink)] shadow-[6px_6px_0_0_var(--edge)] rounded-[2px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex flex-col gap-1 max-w-lg">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--ink)]">
            <AnimatedIcon icon={Sparkles} preset="pop" size={16} />
            <span>Interactive 8-Step System Walkthrough</span>
          </div>
          <h2 className="font-display font-semibold text-2xl text-[var(--ink)]">
            Experience the Guided Tour
          </h2>
          <p className="text-xs text-[var(--ink-2)]">
            Follow an end-to-end evaluation: load a persona, inspect calibrated PD, review SHAP risk explanations, test counterfactuals, and generate sanction notes.
          </p>
        </div>
        <Link href="/assess?demo=true">
          <Button variant="primary" size="lg" className="whitespace-nowrap">
            Start Guided Tour
          </Button>
        </Link>
      </div>

      {/* System Architecture & Principles */}
      <div className="flex flex-col gap-4">
        <h2 className="font-display font-semibold text-2xl text-[var(--ink)]">
          Core Engineering Principles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
          <div className="p-4 bg-[var(--sheet)] border border-[var(--rule)] rounded-[2px] flex flex-col gap-2">
            <h3 className="font-semibold text-sm text-[var(--ink)]">100-Run Reliability Rule</h3>
            <p className="text-[var(--ink-2)]">
              Every backend, financial, and UI function card is subjected to at least 100 property-based executions with 0 failures tracked in the test ledger.
            </p>
          </div>
          <div className="p-4 bg-[var(--sheet)] border border-[var(--rule)] rounded-[2px] flex flex-col gap-2">
            <h3 className="font-semibold text-sm text-[var(--ink)]">Ink & Haldi Design</h3>
            <p className="text-[var(--ink-2)]">
              Restrained editorial typography (Source Serif 4 + Geist), zero emoji discipline, and tactile CRED NeoPOP extruded interactions.
            </p>
          </div>
          <div className="p-4 bg-[var(--sheet)] border border-[var(--rule)] rounded-[2px] flex flex-col gap-2">
            <h3 className="font-semibold text-sm text-[var(--ink)]">Transparent Governance</h3>
            <p className="text-[var(--ink-2)]">
              Every loan outcome is backed by TreeSHAP marginal percentage point feature attributions and actionable single-lever counterfactual guidance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
