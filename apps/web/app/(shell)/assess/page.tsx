"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ApplicationWizard } from "@/components/assess/ApplicationWizard";
import { AssessmentSheet } from "@/components/assess/AssessmentSheet";
import { GradeChip } from "@/components/ui/GradeChip";
import { Button } from "@/components/ui/button";
import {
  type ApplicationInput,
  type AssessmentResponse,
  assessApplication,
  scoreApplication,
} from "@/lib/api";
import { formatINR, formatPct } from "@/lib/format";
import { ChevronUp, ChevronDown } from "lucide-react";

function AssessContent() {
  const searchParams = useSearchParams();
  const personaParam = searchParams.get("persona") || undefined;

  const [assessment, setAssessment] = useState<AssessmentResponse | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [currentApp, setCurrentApp] = useState<ApplicationInput | null>(null);

  // Initial assessment load on mount with default application
  useEffect(() => {
    let mounted = true;
    const initialApp: ApplicationInput = {
      full_name: "Priya Sharma",
      age: 32,
      employment_type: "salaried",
      years_in_current_job: 5,
      residence_type: "owned",
      monthly_income: 140000,
      existing_emi: 12000,
      savings_balance: 850000,
      cibil_score: 790,
      credit_card_utilisation: 15,
      loan_amount: 2500000,
      loan_tenure_months: 60,
      loan_purpose: "home",
      co_applicant: true,
    };
    setCurrentApp(initialApp);

    assessApplication(initialApp)
      .then((res) => {
        if (mounted) setAssessment(res);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const handleRunAssessment = async (data: ApplicationInput) => {
    setIsLoading(true);
    setIsScanning(true);
    try {
      const res = await assessApplication(data);
      // Wait for scan animation to complete
      setTimeout(() => {
        setAssessment(res);
        setIsScanning(false);
        setIsLoading(false);
      }, 500);
    } catch (err) {
      console.error(err);
      setIsScanning(false);
      setIsLoading(false);
    }
  };

  const handleApplyPatch = (patch: Partial<ApplicationInput>) => {
    if (!currentApp) return;
    const updated = { ...currentApp, ...patch };
    setCurrentApp(updated);
    handleRunAssessment(updated);
  };

  const handleExportPdf = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Title */}
      <div className="flex flex-col gap-1 border-b border-[var(--ink)] pb-4">
        <h1 className="font-display font-semibold text-3xl sm:text-4xl text-[var(--ink)]">
          Assess Loan Application
        </h1>
        <p className="text-sm text-[var(--ink-2)]">
          Dual-column underwriting sheet with live ML estimation, policy verification, and explainability.
        </p>
      </div>

      {/* Main 12-Column Layout (Cols 1-7 = Sheet, Cols 8-12 = Wizard) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (Cols 1–7): Assessment Sheet */}
        <div className="hidden lg:block lg:col-span-7 sticky top-20">
          <AssessmentSheet
            assessment={assessment}
            isScanning={isScanning}
            onApplyPatch={handleApplyPatch}
            onExportPdf={handleExportPdf}
          />
        </div>

        {/* Right Column (Cols 8–12): Application Wizard */}
        <div className="lg:col-span-5">
          <ApplicationWizard
            initialData={currentApp || undefined}
            selectedPersonaId={personaParam}
            isLoading={isLoading}
            onSubmit={handleRunAssessment}
            onLiveChange={(app) => setCurrentApp(app)}
          />
        </div>
      </div>

      {/* Mobile Drawer Peek Bar (< 768px / lg) */}
      <div className="lg:hidden fixed bottom-14 left-0 right-0 z-30 bg-[var(--sheet)] border-t-2 border-[var(--ink)] p-3 shadow-[0_-4px_10px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between">
          {assessment ? (
            <div className="flex items-center gap-2 text-xs">
              <GradeChip grade={assessment.grade} size="sm" showLabel={false} />
              <span className="font-semibold text-[var(--ink)]">
                {formatPct(assessment.pd)} Risk
              </span>
              <span className="text-[var(--ink-3)]">·</span>
              <span className="text-[var(--ink-2)] font-mono">
                EMI {formatINR(assessment.monthly_emi)}
              </span>
            </div>
          ) : (
            <span className="text-xs text-[var(--ink-3)]">No assessment run yet</span>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setMobileDrawerOpen((prev) => !prev)}
            className="text-xs flex items-center gap-1 py-1 px-2.5"
          >
            <span>{mobileDrawerOpen ? "Hide Sheet" : "View Sheet"}</span>
            {mobileDrawerOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </Button>
        </div>

        {/* Mobile Expanded Sheet Drawer */}
        {mobileDrawerOpen && (
          <div className="mt-3 max-h-[75vh] overflow-y-auto pt-2 border-t border-[var(--rule)]">
            <AssessmentSheet
              assessment={assessment}
              isScanning={isScanning}
              onApplyPatch={handleApplyPatch}
              onExportPdf={handleExportPdf}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssessPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-[var(--ink-3)]">Loading assessment sheet...</div>}>
      <AssessContent />
    </Suspense>
  );
}
