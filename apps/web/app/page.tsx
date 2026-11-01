"use client";

import React from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { SentenceDemo } from "@/components/landing/SentenceDemo";
import {
  FileCheck,
  Brain,
  SlidersHorizontal,
  Users,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AnimatedIcon } from "@/components/icons/AnimatedIcon";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)] flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 sm:px-12 bg-[var(--sheet)] border-b border-[var(--rule)]">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-baseline gap-1.5 outline-none">
            <span className="font-display font-semibold text-2xl tracking-tight text-[var(--ink)]">
              Saakh
            </span>
            <span className="text-sm font-serif text-[var(--ink-3)]">
              साख
            </span>
          </Link>
          <span className="hidden sm:inline text-xs font-mono text-[var(--ink-3)] px-2 py-0.5 border border-[var(--rule)] rounded-[2px] bg-[var(--sheet-2)]">
            RISK ASSESSMENT ENGINE
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <Link
            href="/assess"
            className="text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors hidden md:inline"
          >
            Assess
          </Link>
          <Link
            href="/portfolio"
            className="text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors hidden md:inline"
          >
            Portfolio
          </Link>
          <Link
            href="/model"
            className="text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors hidden md:inline"
          >
            Model Transparency
          </Link>
          <Link
            href="/about"
            className="text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
          >
            About Project
          </Link>
          <div className="h-4 w-[1px] bg-[var(--rule)] mx-1" />
          <ThemeToggle />
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 sm:px-12 py-12 sm:py-20 flex flex-col gap-12">
        <div className="flex flex-col gap-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--haldi-wash)] border border-[var(--haldi)] rounded-[2px] text-xs font-semibold text-[var(--ink)] w-fit">
            <AnimatedIcon icon={ShieldCheck} preset="pop" size={14} />
            <span>Calibrated Retail Credit Risk Assessment</span>
          </div>

          <h1 className="font-display font-semibold text-5xl sm:text-7xl lg:text-8xl tracking-tight text-[var(--ink)] leading-[0.96]">
            Know the risk
            <br />
            before you lend.
          </h1>

          <p className="text-base sm:text-lg text-[var(--ink-2)] max-w-2xl font-normal leading-relaxed mt-2">
            Saakh evaluates loan applications through calibrated XGBoost machine learning,
            rigorous RBI & underwriting policy rules, transparent SHAP feature attributions,
            and prescriptive counterfactual guidance.
          </p>
        </div>

        {/* Live Sentence Mad-Lib Demo */}
        <SentenceDemo />
      </main>

      {/* Inverted Ink Band: How a Decision is Made */}
      <section className="w-full bg-[var(--ink)] text-[var(--on-ink)] py-16 px-6 sm:px-12 mt-12">
        <div className="max-w-[1280px] mx-auto flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[rgba(255,255,255,0.15)] pb-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[var(--haldi)]">
                UNDERWRITING ARCHITECTURE
              </span>
              <h2 className="font-display font-semibold text-3xl sm:text-4xl text-white mt-1">
                How a credit decision is made
              </h2>
            </div>
            <p className="text-xs text-[rgba(255,255,255,0.7)] max-w-md font-sans">
              Five transparent, sequential stages turn raw applicant profile data into a binding, auditable loan sanction note.
            </p>
          </div>

          {/* 5 Stages Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 pt-2">
            <div className="flex flex-col gap-2 p-4 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[2px]">
              <span className="font-mono text-sm text-[var(--haldi)] font-bold">01</span>
              <h3 className="font-ui font-semibold text-white text-base">Policy Rules</h3>
              <p className="text-xs text-[rgba(255,255,255,0.7)] leading-relaxed">
                Deterministic knock-out checks (age 21–65, min CIBIL 600, FOIR ≤65%) and soft referral flags.
              </p>
            </div>

            <div className="flex flex-col gap-2 p-4 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[2px]">
              <span className="font-mono text-sm text-[var(--haldi)] font-bold">02</span>
              <h3 className="font-ui font-semibold text-white text-base">Feature Engine</h3>
              <p className="text-xs text-[rgba(255,255,255,0.7)] leading-relaxed">
                28 structured features with monotone constraints: debt-to-income, card utilisation, tenure elasticity.
              </p>
            </div>

            <div className="flex flex-col gap-2 p-4 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[2px]">
              <span className="font-mono text-sm text-[var(--haldi)] font-bold">03</span>
              <h3 className="font-ui font-semibold text-white text-base">Risk Model</h3>
              <p className="text-xs text-[rgba(255,255,255,0.7)] leading-relaxed">
                Calibrated XGBoost classifier with Platt scaling producing empirical default probabilities and grades A–E.
              </p>
            </div>

            <div className="flex flex-col gap-2 p-4 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[2px]">
              <span className="font-mono text-sm text-[var(--haldi)] font-bold">04</span>
              <h3 className="font-ui font-semibold text-white text-base">SHAP Explanation</h3>
              <p className="text-xs text-[rgba(255,255,255,0.7)] leading-relaxed">
                Local feature attribution translating tree margins into plain-language risk driver sentences.
              </p>
            </div>

            <div className="flex flex-col gap-2 p-4 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[2px]">
              <span className="font-mono text-sm text-[var(--haldi)] font-bold">05</span>
              <h3 className="font-ui font-semibold text-white text-base">Decision & Advice</h3>
              <p className="text-xs text-[rgba(255,255,255,0.7)] leading-relaxed">
                Automated sanctioning, risk-adjusted pricing, max eligible amount, and actionable counterfactual levers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Global Academic Footer */}
      <footer className="w-full bg-[var(--sheet)] border-t border-[var(--rule)] py-8 px-6 sm:px-12 text-xs text-[var(--ink-3)]">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5 text-center md:text-left">
            <span className="font-semibold text-[var(--ink)]">
              Saakh (साख) — AI-Based Loan Eligibility & Risk Assessment System
            </span>
            <span className="font-mono text-[11px]">
              Course: AI for Finance — CIA-2 · Topic 4
            </span>
          </div>

          <div className="flex items-center gap-6 text-[11px] font-mono">
            <span>Student: <strong className="text-[var(--ink)] font-semibold">NITHIN KUMAR U</strong></span>
            <span>USN: <strong className="text-[var(--ink)] font-semibold">2102508611</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
