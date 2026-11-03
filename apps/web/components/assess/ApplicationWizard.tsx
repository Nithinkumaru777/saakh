"use client";

import React, { useState, useEffect } from "react";
import { User, IndianRupee, ShieldCheck, FileCheck, ArrowRight, ArrowLeft, Stamp } from "lucide-react";
import { AnimatedIcon } from "@/components/icons/AnimatedIcon";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Slider } from "@/components/ui/Slider";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Button } from "@/components/ui/button";
import {
  type ApplicationInput,
  type Persona,
  type EmploymentType,
  type ResidenceType,
  type LoanPurpose,
  fetchPersonas,
} from "@/lib/api";

export interface ApplicationWizardProps {
  initialData?: ApplicationInput;
  onSubmit: (data: ApplicationInput) => void;
  isLoading?: boolean;
  onLiveChange?: (data: ApplicationInput) => void;
  selectedPersonaId?: string;
  className?: string;
}

const DEFAULT_APPLICATION: ApplicationInput = {
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

export function ApplicationWizard({
  initialData,
  onSubmit,
  isLoading = false,
  onLiveChange,
  selectedPersonaId,
  className = "",
}: ApplicationWizardProps) {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<ApplicationInput>(initialData || DEFAULT_APPLICATION);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [appliedPersonaId, setAppliedPersonaId] = useState<string | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    fetchPersonas()
      .then((data) => {
        if (mounted) setPersonas(data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // Sync external persona if passed via URL or props
  const externalPersona = selectedPersonaId ? personas.find((p) => p.id === selectedPersonaId) : undefined;
  if (externalPersona && appliedPersonaId !== externalPersona.id) {
    setAppliedPersonaId(externalPersona.id);
    setFormData(externalPersona.application);
  }
  useEffect(() => {
    if (externalPersona) onLiveChange?.(externalPersona.application);
  }, [externalPersona, onLiveChange]);

  const updateField = <K extends keyof ApplicationInput>(key: K, value: ApplicationInput[K]) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      onLiveChange?.(next);
      return next;
    });
  };

  const handlePersonaSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const match = personas.find((p) => p.id === selectedId);
    if (match) {
      setFormData(match.application);
      onLiveChange?.(match.application);
    }
  };

  const canContinue = () => {
    if (step === 1) return formData.full_name.trim().length > 2 && formData.age >= 18;
    if (step === 2) return formData.monthly_income > 0;
    if (step === 3) return formData.cibil_score >= 300 || formData.cibil_score === -1;
    if (step === 4) return formData.loan_amount > 0 && formData.loan_tenure_months >= 6;
    return true;
  };

  const stepsInfo = [
    { num: 1, title: "Applicant Info", icon: User },
    { num: 2, title: "Financials", icon: IndianRupee },
    { num: 3, title: "Credit Profile", icon: ShieldCheck },
    { num: 4, title: "Loan Request", icon: FileCheck },
  ];

  return (
    <div className={`flex flex-col gap-6 bg-[var(--sheet)] border border-[var(--rule)] rounded-[2px] p-6 ${className}`}>
      {/* Persona preset selector header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--rule)]">
        <div>
          <span className="text-xs font-semibold text-[var(--ink)] block">
            Underwriting Form
          </span>
          <span className="text-[11px] text-[var(--ink-3)]">
            Step {step} of 4: {stepsInfo[step - 1].title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="persona-select" className="text-xs font-medium text-[var(--ink-2)] whitespace-nowrap">
            Load sample applicant:
          </label>
          <select
            id="persona-select"
            value={personas.find((p) => p.application.full_name === formData.full_name)?.id || ""}
            onChange={handlePersonaSelect}
            className="text-xs font-medium py-1 px-2.5 bg-[var(--sheet-2)] text-[var(--ink)] border border-[var(--rule-strong)] rounded-[2px] outline-none focus:border-[var(--ink)] cursor-pointer"
          >
            <option value="">Select persona...</option>
            {personas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.tag})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stepper indicator: only current step shows label */}
      <div className="flex items-center justify-between gap-2 px-1 select-none">
        {stepsInfo.map((s, idx) => {
          const isActive = s.num === step;
          const isDone = s.num < step;

          return (
            <React.Fragment key={s.num}>
              <button
                type="button"
                onClick={() => setStep(s.num)}
                className={`flex items-center gap-2 text-xs font-medium transition-colors cursor-pointer outline-none ${
                  isActive
                    ? "text-[var(--ink)] font-bold"
                    : isDone
                    ? "text-[var(--ink-2)] hover:text-[var(--ink)]"
                    : "text-[var(--ink-3)] opacity-60"
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[11px] border ${
                    isActive
                      ? "bg-[var(--ink)] text-[var(--on-ink)] border-[var(--ink)]"
                      : isDone
                      ? "bg-[var(--haldi-wash)] text-[var(--ink)] border-[var(--haldi)]"
                      : "bg-[var(--sheet-2)] text-[var(--ink-3)] border-[var(--rule-strong)]"
                  }`}
                >
                  {s.num}
                </span>
                {isActive && <span>{s.title}</span>}
              </button>
              {idx < stepsInfo.length - 1 && (
                <div className="flex-1 h-[1px] bg-[var(--rule)] mx-1" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Contents */}
      <div className="flex flex-col gap-5 py-2">
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="full_name" className="text-xs font-medium text-[var(--ink-2)]">
                Applicant Full Name
              </label>
              <input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => updateField("full_name", e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full px-3 py-2 text-sm bg-[var(--sheet)] text-[var(--ink)] border border-[var(--rule-strong)] rounded-[2px] outline-none focus:border-[var(--ink)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="age" className="text-xs font-medium text-[var(--ink-2)]">
                  Age (Years)
                </label>
                <input
                  id="age"
                  type="number"
                  min={18}
                  max={75}
                  value={formData.age}
                  onChange={(e) => updateField("age", Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-[var(--sheet)] text-[var(--ink)] border border-[var(--rule-strong)] rounded-[2px] outline-none focus:border-[var(--ink)]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="years_in_job" className="text-xs font-medium text-[var(--ink-2)]">
                  Years in Current Job / Business
                </label>
                <input
                  id="years_in_job"
                  type="number"
                  min={0}
                  max={45}
                  value={formData.years_in_current_job}
                  onChange={(e) => updateField("years_in_current_job", Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-[var(--sheet)] text-[var(--ink)] border border-[var(--rule-strong)] rounded-[2px] outline-none focus:border-[var(--ink)]"
                />
              </div>
            </div>

            <SegmentedControl<EmploymentType>
              label="Employment Type"
              value={formData.employment_type}
              onChange={(val) => updateField("employment_type", val)}
              options={[
                { value: "salaried", label: "Salaried" },
                { value: "self_employed", label: "Self Employed" },
                { value: "business", label: "Business" },
                { value: "professional", label: "Professional" },
              ]}
            />

            <SegmentedControl<ResidenceType>
              label="Residence Type"
              value={formData.residence_type}
              onChange={(val) => updateField("residence_type", val)}
              options={[
                { value: "owned", label: "Owned" },
                { value: "rented", label: "Rented" },
                { value: "mortgaged", label: "Mortgaged" },
              ]}
            />
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <CurrencyInput
              label="Monthly Income"
              value={formData.monthly_income}
              onChange={(val) => updateField("monthly_income", val)}
              min={10000}
              max={10000000}
            />

            <CurrencyInput
              label="Existing Monthly EMIs"
              value={formData.existing_emi}
              onChange={(val) => updateField("existing_emi", val)}
              min={0}
              max={5000000}
            />

            <CurrencyInput
              label="Current Savings & Bank Balance"
              value={formData.savings_balance}
              onChange={(val) => updateField("savings_balance", val)}
              min={0}
              max={50000000}
            />
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-5">
            <Slider
              label="CIBIL Credit Score (300–900)"
              value={formData.cibil_score}
              min={300}
              max={900}
              step={5}
              onChange={(val) => updateField("cibil_score", val)}
              formatValue={(v) => `${v}`}
            />

            <Slider
              label="Credit Card Limit Utilisation (%)"
              value={formData.credit_card_utilisation}
              min={0}
              max={100}
              step={1}
              onChange={(val) => updateField("credit_card_utilisation", val)}
              formatValue={(v) => `${v}%`}
            />

            <div className="p-3 bg-[var(--sheet-2)] border border-[var(--rule)] rounded-[2px] text-xs text-[var(--ink-2)] leading-relaxed">
              <strong>Underwriting Benchmark:</strong> CIBIL ≥ 750 receives prime grade A pricing. FOIR over 65% or CIBIL below 600 triggers policy knockouts.
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-4">
            <CurrencyInput
              label="Requested Loan Amount"
              value={formData.loan_amount}
              onChange={(val) => updateField("loan_amount", val)}
              min={50000}
              max={50000000}
            />

            <Slider
              label="Loan Tenure (Months)"
              value={formData.loan_tenure_months}
              min={6}
              max={240}
              step={6}
              onChange={(val) => updateField("loan_tenure_months", val)}
              formatValue={(v) => `${v} months (${(v / 12).toFixed(1)} yrs)`}
            />

            <SegmentedControl<LoanPurpose>
              label="Loan Purpose"
              value={formData.loan_purpose}
              onChange={(val) => updateField("loan_purpose", val)}
              options={[
                { value: "home", label: "Home" },
                { value: "personal", label: "Personal" },
                { value: "auto", label: "Auto" },
                { value: "education", label: "Education" },
                { value: "business", label: "Business" },
              ]}
            />

            <div className="flex items-center justify-between pt-1">
              <label htmlFor="co_applicant" className="text-xs font-medium text-[var(--ink)] cursor-pointer">
                Include Creditworthy Co-Applicant
              </label>
              <input
                id="co_applicant"
                type="checkbox"
                checked={formData.co_applicant}
                onChange={(e) => updateField("co_applicant", e.target.checked)}
                className="w-4 h-4 accent-[var(--ink)] cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--rule)]">
        {step > 1 ? (
          <Button
            variant="ghost"
            size="md"
            onClick={() => setStep((s) => s - 1)}
            className="flex items-center gap-1.5"
          >
            <AnimatedIcon icon={ArrowLeft} preset="nudge-x" size={14} />
            <span>Back</span>
          </Button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <Button
            variant="secondary"
            size="md"
            disabled={!canContinue()}
            onClick={() => setStep((s) => s + 1)}
            className="flex items-center gap-1.5"
          >
            <span>Continue</span>
            <AnimatedIcon icon={ArrowRight} preset="nudge-x" size={14} />
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            loading={isLoading}
            disabled={!canContinue()}
            onClick={() => onSubmit(formData)}
            className="flex items-center gap-2"
          >
            <AnimatedIcon icon={Stamp} preset="pop" size={16} />
            <span>Run Assessment</span>
          </Button>
        )}
      </div>
    </div>
  );
}
