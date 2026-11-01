"use client";

import { useRef, useState, type ButtonHTMLAttributes, type KeyboardEvent, type TransitionEvent } from "react";
import { Check, LoaderCircle, type LucideIcon } from "lucide-react";
import { AnimatedIcon, type AnimatedIconHandle, type IconPreset } from "@/components/icons/AnimatedIcon";
import { cn } from "@/lib/cn";

// CRED NeoPOP tactile button, DESIGN.md §7.5. Press mechanics live in globals.css (.btn*): 90 ms down, 160 ms up.
export type ButtonVariant = "primary" | "secondary" | "ghost" | "hold" | "icon";

type Base = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  size?: "md" | "sm";
  icon?: LucideIcon;
  iconPreset?: IconPreset;
  loading?: boolean;
  /** Shows a check in place of the label (e.g. "Assessment saved"). */
  success?: boolean;
};

export type ButtonProps =
  | (Base & { variant?: "primary" | "secondary" | "ghost"; children: React.ReactNode })
  | (Base & { variant: "hold"; children: React.ReactNode; onHoldComplete: () => void })
  | (Base & { variant: "icon"; icon: LucideIcon; "aria-label": string; children?: never });

export function Button(props: ButtonProps) {
  const {
    variant = "primary", size = "md", icon, iconPreset = "pop", loading = false, success = false,
    className, disabled, children, onHoldComplete, ...dom
  } = props as Base & { variant?: ButtonVariant; children?: React.ReactNode; onHoldComplete?: () => void };

  const iconRef = useRef<AnimatedIconHandle>(null);
  const [holding, setHolding] = useState(false);
  const [done, setDone] = useState(false);
  const isHold = variant === "hold";
  const busy = loading || success;

  const holdStart = () => !disabled && setHolding(true);
  const holdEnd = () => setHolding(false);
  const onFillEnd = (e: TransitionEvent<HTMLSpanElement>) => {
    if (!holding || e.propertyName !== "transform") return;
    setHolding(false);
    setDone(true);
    onHoldComplete?.();
  };
  const holdKey = (e: KeyboardEvent<HTMLButtonElement>, down: boolean) => {
    if (e.key !== " " && e.key !== "Enter") return;
    e.preventDefault();
    if (down && !e.repeat) holdStart();
    if (!down) holdEnd();
  };

  return (
    <button
      type="button"
      {...dom}
      disabled={disabled}
      aria-busy={loading || undefined}
      data-variant={variant}
      data-holding={isHold ? String(holding) : undefined}
      data-done={isHold && done ? "true" : undefined}
      className={cn("btn", `btn-${variant}`, size === "sm" && "btn-sm", className)}
      onMouseEnter={(e) => { iconRef.current?.startAnimation(); dom.onMouseEnter?.(e); }}
      onMouseLeave={(e) => { iconRef.current?.stopAnimation(); if (isHold) holdEnd(); dom.onMouseLeave?.(e); }}
      onPointerDown={(e) => { if (e.pointerType === "touch") iconRef.current?.startAnimation(); if (isHold) holdStart(); dom.onPointerDown?.(e); }}
      onPointerUp={(e) => { if (isHold) holdEnd(); dom.onPointerUp?.(e); }}
      onPointerCancel={(e) => { if (isHold) holdEnd(); dom.onPointerCancel?.(e); }}
      onKeyDown={(e) => { if (isHold) holdKey(e, true); dom.onKeyDown?.(e); }}
      onKeyUp={(e) => { if (isHold) holdKey(e, false); dom.onKeyUp?.(e); }}
      onAnimationEnd={(e) => { setDone(false); dom.onAnimationEnd?.(e); }}
    >
      {isHold && <span className="hold-fill" aria-hidden onTransitionEnd={onFillEnd} />}
      <span className="btn-label" style={busy ? { opacity: 0 } : undefined}>
        {icon && <AnimatedIcon ref={iconRef} icon={icon} preset={iconPreset} size={20} hover={false} />}
        {children}
      </span>
      {loading && (
        <span className="btn-state" aria-hidden>
          <LoaderCircle size={20} strokeWidth={1.75} className="spin" />
        </span>
      )}
      {success && !loading && (
        <span className="btn-state" aria-hidden>
          <Check size={20} strokeWidth={1.75} />
        </span>
      )}
    </button>
  );
}
