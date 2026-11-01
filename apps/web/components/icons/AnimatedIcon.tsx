"use client";

import { useImperativeHandle, type Ref } from "react";
import { useAnimate } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { dur, ease, useMotionPreset } from "@/lib/motion";

// DESIGN.md §6: fallback for icons not in lucide-animated. Five shared presets.
export type IconPreset = "nudge-x" | "nudge-y" | "spin" | "pop" | "draw";

export const ICON_PRESETS: Record<Exclude<IconPreset, "draw">, Record<string, number[]>> = {
  "nudge-x": { x: [0, 3, 0] },
  "nudge-y": { y: [0, -3, 0] },
  spin: { rotate: [0, 180] },
  pop: { scale: [1, 1.15, 1] },
};

export type AnimatedIconHandle = { startAnimation: () => void; stopAnimation: () => void };

type Props = {
  icon: LucideIcon;
  preset: IconPreset;
  /** 16 inline, 20 buttons/nav, 24 section headers, 40 empty states, 56 result icon. */
  size?: number;
  /** Accessible name. Omit for decorative icons next to visible text. */
  label?: string;
  /** Animate on own hover. Set false when a parent control drives it through `ref`. */
  hover?: boolean;
  className?: string;
  ref?: Ref<AnimatedIconHandle>;
};

const DRAW_TARGETS = "path, line, polyline, circle, rect";

export function AnimatedIcon({ icon: Icon, preset, size = 20, label, hover = true, className, ref }: Props) {
  const [scope, animate] = useAnimate<HTMLSpanElement>();
  const { reduced } = useMotionPreset();

  const start = () => {
    if (reduced || !scope.current) return; // reduced motion: icons stay still
    if (preset === "draw") {
      animate(DRAW_TARGETS, { pathLength: [0, 1] }, { duration: dur.max, ease: [...ease.out] });
    } else {
      animate(scope.current, ICON_PRESETS[preset], { duration: dur.max, ease: [...ease.out] });
    }
  };
  const stop = () => {
    if (!scope.current || preset !== "spin") return;
    animate(scope.current, { rotate: 0 }, { duration: dur.std, ease: [...ease.out] });
  };

  useImperativeHandle(ref, () => ({ startAnimation: start, stopAnimation: stop }));

  return (
    <span
      ref={scope}
      className={className}
      style={{ display: "inline-flex", lineHeight: 0 }}
      data-icon-preset={preset}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      onMouseEnter={hover ? start : undefined}
      onMouseLeave={hover ? stop : undefined}
    >
      <Icon size={size} strokeWidth={size <= 16 ? 2 : 1.75} aria-hidden />
    </span>
  );
}
