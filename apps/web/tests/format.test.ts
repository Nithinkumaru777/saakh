/**
 * Vitest + fast-check property tests for Indian currency formatting.
 * SPEC §F21: 100 runs per card.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { countRuns } from "./count-runs";
import {
  formatINR,
  formatINRShort,
  parseINR,
  inrToWords,
  formatPct,
} from "../lib/format";

describe("F21: Indian currency & financial formatting", () => {
  it("golden test cases match exact SPEC expectations", () => {
    expect(formatINR(1250000)).toBe("₹12,50,000");
    expect(formatINRShort(1250000)).toBe("₹12.5 L");
    expect(formatINRShort(12000000)).toBe("₹1.2 Cr");
    expect(formatINRShort(85000)).toBe("₹85,000");
    expect(parseINR("12,50,000")).toBe(1250000);
    expect(parseINR("₹12,50,000")).toBe(1250000);
    expect(inrToWords(1250000)).toBe("Twelve lakh fifty thousand rupees");
    expect(inrToWords(0)).toBe("Zero rupees");
    expect(formatPct(0.041)).toBe("4.1 %");
  });

  it("proves parseINR(formatINR(n)) === n across 100 runs", () => {
    const property = fc.property(
      fc.integer({ min: 0, max: 100_00_00_000 }),
      countRuns("F21", (n: number) => {
        const formatted = formatINR(n);
        const parsed = parseINR(formatted);
        expect(parsed).toBe(n);

        if (n >= 1000) {
          const inrRegex = /^₹\d{1,2}(,\d{2})*(,\d{3})?$/;
          expect(formatted).toMatch(inrRegex);
        }
      })
    );

    fc.assert(property, { numRuns: 100 });
  });

  it("proves inrToWords produces structured rupees sentences across 100 runs", () => {
    const property = fc.property(
      fc.integer({ min: 0, max: 50_00_00_000 }),
      countRuns("F21", (n: number) => {
        const words = inrToWords(n);
        expect(words).toBeTruthy();
        expect(words.endsWith("rupees")).toBe(true);
        expect(words[0]).toBe(words[0].toUpperCase());
      })
    );

    fc.assert(property, { numRuns: 100 });
  });

  it("proves formatPct formats correctly with space before % across 100 runs", () => {
    const property = fc.property(
      fc.float({ min: 0.0, max: 1.0, noNaN: true }),
      countRuns("F21", (p: number) => {
        const str = formatPct(p);
        expect(str.endsWith(" %")).toBe(true);
        const numPart = parseFloat(str.replace(" %", ""));
        expect(Math.abs(numPart - p * 100)).toBeLessThanOrEqual(0.15);
      })
    );

    fc.assert(property, { numRuns: 100 });
  });
});
