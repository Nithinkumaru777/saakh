import { useMemo } from "react";
import { useReducedMotion, type Transition } from "motion/react";

// DESIGN.md §7.1. Components never read these directly: use useMotionPreset().
export const ease = {
  out: [0.23, 1, 0.32, 1], // default: anything entering or responding
  inOut: [0.77, 0, 0.175, 1], // things moving on screen, highlighter swipe
  drawer: [0.32, 0.72, 0, 1], // phone drawer (500 ms)
} as const;

export const dur = { press: 0.09, release: 0.16, micro: 0.12, std: 0.2, max: 0.3, drawer: 0.5 } as const;

export const spring = {
  snappy: { type: "spring", stiffness: 420, damping: 32 }, // nav marker, segmented control, tab underline
  marker: { type: "spring", stiffness: 260, damping: 20 }, // risk-ruler marker: small visible overshoot
  stamp: { type: "spring", stiffness: 650, damping: 20, mass: 1.3 }, // decision stamp only
} as const;

export type TransitionName = keyof typeof spring | keyof typeof ease | Exclude<keyof typeof dur, "drawer">;

const instant: Transition = { duration: 0 };

/** Pure preset builder (testable without React). Reduced motion: every move is instant, only opacity may fade. */
export function motionPreset(reduced: boolean) {
  const transition = (name: TransitionName): Transition => {
    if (reduced) return instant;
    if (name in spring) return { ...spring[name as keyof typeof spring] };
    if (name in ease) return { duration: name === "drawer" ? dur.drawer : dur.std, ease: [...ease[name as keyof typeof ease]] };
    return { duration: dur[name as keyof typeof dur], ease: [...ease.out] };
  };
  return {
    reduced,
    transition,
    /** Opacity fade stays available under reduced motion (DESIGN.md §0.8). */
    fade: { duration: dur.std, ease: [...ease.out] } as Transition,
  };
}

export type MotionPreset = ReturnType<typeof motionPreset>;

export function useMotionPreset(): MotionPreset {
  const reduced = useReducedMotion() ?? false;
  return useMemo(() => motionPreset(reduced), [reduced]);
}
