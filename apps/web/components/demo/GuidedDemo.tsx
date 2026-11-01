"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, ArrowLeft, X, Check } from "lucide-react";
import { AnimatedIcon } from "@/components/icons/AnimatedIcon";
import { Button } from "@/components/ui/button";

export interface DemoStep {
  step: number;
  title: string;
  description: string;
  targetRoute: string;
  highlightText: string;
}

const DEMO_STEPS: DemoStep[] = [
  {
    step: 1,
    title: "1. Underwriting Engine Landing",
    description: "Welcome to Saakh (साख). The platform provides calibrated credit risk assessment with Indian banking policy gates and zero emoji discipline.",
    targetRoute: "/",
    highlightText: "Explore the live mad-lib sentence at the hero.",
  },
  {
    step: 2,
    title: "2. Load Calibrated Persona",
    description: "Select an applicant profile like Priya Sharma (prime home loan candidate) or Rajesh Patel (thin-file merchant) to see differential underwriting.",
    targetRoute: "/assess?persona=priya_sharma",
    highlightText: "Persona presets fill all four steps of the underwriting wizard.",
  },
  {
    step: 3,
    title: "3. Run Assessment Sequence",
    description: "Click 'Run Assessment' to initiate the 1.5s scan sequence: risk ruler spring, 3D grade chip flip, factor bars, and tactile rubber stamp impact.",
    targetRoute: "/assess",
    highlightText: "Notice the 2px recoil and double-dashed rubber stamp.",
  },
  {
    step: 4,
    title: "4. Explainability via SHAP",
    description: "Inspect the diverging feature bars. Bars lowering risk are rendered in ink; bars elevating risk appear in haldi, with plain-language sentences.",
    targetRoute: "/assess",
    highlightText: "TreeSHAP decomposes the exact marginal percentage point impact.",
  },
  {
    step: 5,
    title: "5. What-If Sensitivity Simulator",
    description: "Adjust 7 sensitivity sliders with live 150ms re-scoring. Click 'Apply' on any counterfactual path to automatically animate sliders to target thresholds.",
    targetRoute: "/what-if",
    highlightText: "Discover single-lever pathways to improved grade tiers.",
  },
  {
    step: 6,
    title: "6. Applicants Ledger",
    description: "Browse the Swiss-style portfolio table with name search, outcome filter tabs, pagination, and full assessment detail drawer.",
    targetRoute: "/applicants",
    highlightText: "Audited institutional record-keeping for underwriting history.",
  },
  {
    step: 7,
    title: "7. Portfolio Risk Analytics",
    description: "Review executive KPIs, grade distribution bars, default risk density histograms, and FOIR-vs-PD risk scatter matrices.",
    targetRoute: "/portfolio",
    highlightText: "Macro-prudential portfolio oversight across all loan applicants.",
  },
  {
    step: 8,
    title: "8. Model Transparency & Governance",
    description: "Trace the 7-stage ML pipeline, inspect the ROC curve (AUC 0.8074), Platt calibration curve, and examine the Model Card.",
    targetRoute: "/model",
    highlightText: "Academic submission: NITHIN KUMAR U (2102508611).",
  },
];

export function GuidedDemo() {
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const router = useRouter();

  if (!isOpen) return null;

  const current = DEMO_STEPS[currentStepIdx];

  const handleNext = () => {
    if (currentStepIdx < DEMO_STEPS.length - 1) {
      const nextIdx = currentStepIdx + 1;
      setCurrentStepIdx(nextIdx);
      router.push(DEMO_STEPS[nextIdx].targetRoute);
    } else {
      setIsOpen(false);
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      const prevIdx = currentStepIdx - 1;
      setCurrentStepIdx(prevIdx);
      router.push(DEMO_STEPS[prevIdx].targetRoute);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm bg-[var(--sheet)] border-2 border-[var(--ink)] shadow-[6px_6px_0_0_var(--edge)] rounded-[2px] p-5 select-none">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--rule)]">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--ink)] uppercase font-mono">
          <AnimatedIcon icon={Sparkles} preset="pop" size={14} />
          <span>Guided Tour · Step {current.step} of 8</span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors p-0.5 cursor-pointer"
          title="Exit Tour"
        >
          <X size={15} />
        </button>
      </div>

      <div className="py-3 flex flex-col gap-1.5">
        <h4 className="font-display font-semibold text-base text-[var(--ink)]">
          {current.title}
        </h4>
        <p className="text-xs text-[var(--ink-2)] leading-relaxed">
          {current.description}
        </p>
        <div className="p-2 bg-[var(--haldi-wash)] border border-[var(--haldi)] rounded-[2px] text-[11px] text-[var(--ink)] font-medium mt-1">
          {current.highlightText}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between pt-3 border-t border-[var(--rule)]">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentStepIdx === 0}
          className="text-xs text-[var(--ink-3)] hover:text-[var(--ink)] disabled:opacity-30 cursor-pointer flex items-center gap-1 font-medium"
        >
          <ArrowLeft size={13} />
          <span>Back</span>
        </button>

        {/* Step dots */}
        <div className="flex items-center gap-1">
          {DEMO_STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${
                i === currentStepIdx ? "bg-[var(--haldi)]" : "bg-[var(--rule-strong)]"
              }`}
            />
          ))}
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleNext}
          className="text-xs px-2.5 py-1 flex items-center gap-1"
        >
          <span>{currentStepIdx === DEMO_STEPS.length - 1 ? "Finish" : "Next"}</span>
          {currentStepIdx === DEMO_STEPS.length - 1 ? <Check size={13} /> : <ArrowRight size={13} />}
        </Button>
      </div>
    </div>
  );
}
