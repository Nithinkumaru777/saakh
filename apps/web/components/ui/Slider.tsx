"use client";

import React, { useId, useState } from "react";

export interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label?: string;
  formatValue?: (val: number) => string;
  className?: string;
  id?: string;
}

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  formatValue = (v) => v.toString(),
  className = "",
  id: explicitId,
}: SliderProps) {
  const generatedId = useId();
  const id = explicitId || generatedId;
  const [isDragging, setIsDragging] = useState(false);

  const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      <div className="flex items-center justify-between text-xs">
        {label && (
          <label htmlFor={id} className="font-medium text-[var(--ink-2)]">
            {label}
          </label>
        )}
        <span className="font-medium text-[var(--ink)] tabular-nums">
          {formatValue(value)}
        </span>
      </div>

      <div className="relative flex items-center h-6 select-none">
        {/* Track */}
        <div className="relative w-full h-1 bg-[var(--rule)] rounded-[1px] overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-[var(--ink)] transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Input */}
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-label={label || "Slider"}
        />

        {/* Visual Thumb: 14x24 haldi thumb, 12% vertical stretch on drag */}
        <div
          className="pointer-events-none absolute top-1/2 -translate-y-1/2 w-3.5 h-6 bg-[var(--haldi)] border-[1.5px] border-[var(--ink)] rounded-[1px] transition-transform shadow-[1px_1px_0_0_var(--edge)]"
          style={{
            left: `calc(${percentage}% - 7px)`,
            transform: `translateY(-50%) ${isDragging ? "scaleY(1.12)" : "scaleY(1.0)"}`,
          }}
        />
      </div>
    </div>
  );
}
