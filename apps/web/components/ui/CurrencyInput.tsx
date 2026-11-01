"use client";

import React, { useId } from "react";
import { formatINR, inrToWords, parseINR } from "@/lib/format";

export interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  id?: string;
}

export function CurrencyInput({
  value,
  onChange,
  label,
  min = 0,
  max = 100000000,
  placeholder = "0",
  disabled = false,
  error,
  className = "",
  id: explicitId,
}: CurrencyInputProps) {
  const generatedId = useId();
  const id = explicitId || generatedId;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const num = parseINR(raw);
    const clamped = Math.min(Math.max(num, min), max);
    onChange(clamped);
  };

  const formattedDisplay = value > 0 ? formatINR(value).replace(/^₹\s*/, "") : "";
  const wordsDisplay = value > 0 ? inrToWords(value) : "";

  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-[var(--ink-2)]">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <span
          className="absolute left-3 text-sm font-semibold text-[var(--ink-3)] select-none pointer-events-none"
          aria-hidden="true"
        >
          ₹
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          disabled={disabled}
          value={formattedDisplay}
          placeholder={placeholder}
          onChange={handleChange}
          className={`w-full pl-8 pr-3 py-2 text-sm font-medium bg-[var(--sheet)] text-[var(--ink)] border rounded-[2px] tabular-nums transition-colors outline-none focus:border-[var(--ink)] focus:ring-1 focus:ring-[var(--ink)] disabled:bg-[var(--sheet-2)] disabled:text-[var(--ink-3)] ${
            error ? "border-[var(--decline)]" : "border-[var(--rule-strong)]"
          }`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : wordsDisplay ? `${id}-words` : undefined}
        />
      </div>
      {error ? (
        <span id={`${id}-error`} className="text-xs text-[var(--decline)] mt-0.5">
          {error}
        </span>
      ) : wordsDisplay ? (
        <span id={`${id}-words`} className="text-[11px] text-[var(--ink-3)] italic mt-0.5 capitalize">
          {wordsDisplay}
        </span>
      ) : null}
    </div>
  );
}
