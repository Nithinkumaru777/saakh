"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export interface PipelineNode {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  details: string[];
}

const NODES: PipelineNode[] = [
  {
    id: 1,
    title: "Application Input",
    subtitle: "Raw Profile Data",
    badge: "14 Fields",
    description: "Applicant profile including income, employment, CIBIL score, and requested loan terms.",
    details: ["Pydantic v2 validation", "Name regex & age constraints", "CIBIL range 300–900 or -1"],
  },
  {
    id: 2,
    title: "Policy Rules",
    subtitle: "Deterministic Gate",
    badge: "6 Knockouts",
    description: "Hard knockout checks (K1–K6) and referral guidelines (R1–R4) per banking regulations.",
    details: ["Age 21–65 boundary", "CIBIL ≥ 600 threshold", "FOIR ≤ 65% ceiling", "Min income ₹15,000"],
  },
  {
    id: 3,
    title: "Feature Engine",
    subtitle: "Monotone Transforms",
    badge: "28 Features",
    description: "Engineered financial ratios and one-hot encodings with verified monotone signs.",
    details: ["DTI & FOIR ratios", "Tenure elasticity", "Income-to-loan coverage", "Payment-to-income"],
  },
  {
    id: 4,
    title: "XGBoost Classifier",
    subtitle: "Ensemble Trees",
    badge: "100 Trees",
    description: "Gradient boosted decision trees trained with monotone constraints for credit stability.",
    details: ["Monotone constraints enforced", "Max depth 4, lr 0.05", "Cross-entropy loss"],
  },
  {
    id: 5,
    title: "Platt Calibrator",
    subtitle: "Probability Mapping",
    badge: "1D Logistic",
    description: "Post-hoc Platt scaling transforming log-odds margins into true empirical default probabilities.",
    details: ["Calibrated Brier score < 0.09", "Monotone probability output", "Empirical validation on 5k data"],
  },
  {
    id: 6,
    title: "TreeSHAP Explainer",
    subtitle: "Local Attribution",
    badge: "Exact Shapley",
    description: "Decomposes model predictions into exact marginal percentage point contributions per feature.",
    details: ["TreeExplainer exact margins", "Plain-language generation", "Top 5 risk drivers"],
  },
  {
    id: 7,
    title: "Decision & Advice",
    subtitle: "Binding Underwriting",
    badge: "Sanction / Refer / Decline",
    description: "Assigns risk grade A–E, determines risk-based pricing, and searches counterfactual levers.",
    details: ["Grades A (0-3%) to E (30%+)", "Indicative rate pricing", "Single-lever advice"],
  },
];

export function ModelPipeline() {
  const [activeNode, setActiveNode] = useState<number>(3);
  const selected = NODES.find((n) => n.id === activeNode) || NODES[0];

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 7-node pipeline horizontal track */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {NODES.map((node) => {
          const isActive = node.id === activeNode;
          return (
            <button
              key={node.id}
              type="button"
              onClick={() => setActiveNode(node.id)}
              className={`p-3 text-left border rounded-[2px] transition-all cursor-pointer select-none flex flex-col justify-between min-h-[92px] ${
                isActive
                  ? "bg-[var(--sheet)] border-[1.5px] border-[var(--ink)] shadow-[4px_4px_0_0_var(--edge)]"
                  : "bg-[var(--sheet-2)] border-[var(--rule)] hover:border-[var(--rule-strong)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[var(--ink)]">
                  0{node.id}
                </span>
                <span className="text-[9px] font-mono px-1 py-0.2 bg-[var(--canvas)] border border-[var(--rule)] rounded-[1px] text-[var(--ink-3)]">
                  {node.badge}
                </span>
              </div>
              <div className="mt-2">
                <span className="font-ui font-semibold text-xs text-[var(--ink)] block leading-tight">
                  {node.title}
                </span>
                <span className="text-[10px] text-[var(--ink-3)] block truncate mt-0.5">
                  {node.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Node Details Card */}
      <div className="p-6 bg-[var(--sheet)] border border-[var(--rule-strong)] rounded-[2px] flex flex-col sm:flex-row items-start justify-between gap-6">
        <div className="flex flex-col gap-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-1.5 py-0.5 bg-[var(--ink)] text-[var(--on-ink)] rounded-[1px]">
              Stage 0{selected.id}
            </span>
            <span className="font-display font-semibold text-xl text-[var(--ink)]">
              {selected.title} — {selected.subtitle}
            </span>
          </div>
          <p className="text-xs text-[var(--ink-2)] leading-relaxed mt-1">
            {selected.description}
          </p>
        </div>

        <div className="flex flex-col gap-1.5 min-w-[220px]">
          <span className="text-[11px] font-mono uppercase text-[var(--ink-3)]">
            Validation Criteria
          </span>
          {selected.details.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-xs text-[var(--ink)]">
              <CheckCircle2 size={13} className="text-[var(--sanction)] shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
