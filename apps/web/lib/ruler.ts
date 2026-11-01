/**
 * Risk Ruler mapping: converts Probability of Default (PD) to 0-100% position on the 5-grade ruler.
 * Grade bands:
 * A: 0% - 3%
 * B: 3% - 7%
 * C: 7% - 15%
 * D: 15% - 30%
 * E: 30% - 60%+
 */

export interface GradeSegment {
  grade: "A" | "B" | "C" | "D" | "E";
  label: string;
  minPd: number;
  maxPd: number;
  colorVar: string;
}

export const GRADE_SEGMENTS: GradeSegment[] = [
  { grade: "A", label: "Low risk", minPd: 0.0, maxPd: 0.03, colorVar: "var(--grade-a)" },
  { grade: "B", label: "Moderate low", minPd: 0.03, maxPd: 0.07, colorVar: "var(--grade-b)" },
  { grade: "C", label: "Medium risk", minPd: 0.07, maxPd: 0.15, colorVar: "var(--grade-c)" },
  { grade: "D", label: "High risk", minPd: 0.15, maxPd: 0.30, colorVar: "var(--grade-d)" },
  { grade: "E", label: "Very high", minPd: 0.30, maxPd: 0.60, colorVar: "var(--grade-e)" },
];

export function pdToRulerPercentage(pd: number): number {
  const clampedPd = Math.max(0, Math.min(pd, 0.60));

  if (clampedPd <= 0.03) {
    return (clampedPd / 0.03) * 20;
  }
  if (clampedPd <= 0.07) {
    return 20 + ((clampedPd - 0.03) / (0.07 - 0.03)) * 20;
  }
  if (clampedPd <= 0.15) {
    return 40 + ((clampedPd - 0.07) / (0.15 - 0.07)) * 20;
  }
  if (clampedPd <= 0.30) {
    return 60 + ((clampedPd - 0.15) / (0.30 - 0.15)) * 20;
  }
  return 80 + ((clampedPd - 0.30) / (0.60 - 0.30)) * 20;
}
