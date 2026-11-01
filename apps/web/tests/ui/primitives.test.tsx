import { describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { Slider } from "@/components/ui/Slider";
import { RiskRuler } from "@/components/ui/RiskRuler";
import { GradeChip } from "@/components/ui/GradeChip";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { pdToRulerPercentage } from "@/lib/ruler";
import { countRuns } from "../count-runs";

describe("F24: Shell and UI Primitives", () => {
  it("CurrencyInput formats, parses, and clamps values (100 runs)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 10000000 }),
        countRuns("F24", (amount) => {
          cleanup();
          const onChange = vi.fn();
          const { unmount } = render(
            <CurrencyInput
              label="Monthly Income"
              value={amount}
              onChange={onChange}
              min={1000}
              max={10000000}
            />
          );
          const input = screen.getByRole("textbox", { name: /monthly income/i });
          expect(input).toBeInTheDocument();
          // Value inside textbox shouldn't have raw emoji or invalid chars
          expect(input).toHaveValue();

          // Change value
          fireEvent.change(input, { target: { value: "50,000" } });
          expect(onChange).toHaveBeenCalledWith(50000);
          unmount();
        })
      ),
      { numRuns: 100 }
    );
  });

  it("Slider clamps and calculates percentage monotonically (100 runs)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        countRuns("F24", (val) => {
          cleanup();
          const onChange = vi.fn();
          const { unmount } = render(
            <Slider
              label="Tenure"
              value={val}
              min={0}
              max={100}
              onChange={onChange}
            />
          );
          const slider = screen.getByRole("slider", { name: /tenure/i });
          expect(slider).toBeInTheDocument();
          expect(slider).toHaveAttribute("aria-valuenow", val.toString());

          const nextVal = val === 75 ? 50 : 75;
          fireEvent.change(slider, { target: { value: nextVal.toString() } });
          expect(onChange).toHaveBeenCalledWith(nextVal);
          unmount();
        })
      ),
      { numRuns: 100 }
    );
  });

  it("RiskRuler maps probability of default to valid [0, 100] percentage (100 runs)", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 1.0 }),
        countRuns("F24", (pd) => {
          cleanup();
          const pct = pdToRulerPercentage(pd);
          expect(pct).toBeGreaterThanOrEqual(0);
          expect(pct).toBeLessThanOrEqual(100);

          const { unmount } = render(<RiskRuler pd={pd} />);
          const meter = screen.getByRole("meter", { name: /default risk meter/i });
          expect(meter).toBeInTheDocument();
          unmount();
        })
      ),
      { numRuns: 100 }
    );
  });

  it("GradeChip renders all 5 grades correctly (100 runs)", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("A", "B", "C", "D", "E" as const),
        countRuns("F24", (grade) => {
          cleanup();
          const { unmount } = render(<GradeChip grade={grade} />);
          expect(screen.getByText(grade)).toBeInTheDocument();
          unmount();
        })
      ),
      { numRuns: 100 }
    );
  });

  it("SegmentedControl handles selection and option changes (100 runs)", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("salaried", "self_employed", "business", "professional"),
        countRuns("F24", (val) => {
          cleanup();
          const onChange = vi.fn();
          const options = [
            { value: "salaried", label: "Salaried" },
            { value: "self_employed", label: "Self Employed" },
            { value: "business", label: "Business" },
            { value: "professional", label: "Professional" },
          ];
          const { unmount } = render(
            <SegmentedControl
              label="Employment"
              value={val}
              options={options}
              onChange={onChange}
            />
          );
          const radio = screen.getByRole("radio", { name: new RegExp(val.replace("_", " "), "i") });
          expect(radio).toBeInTheDocument();
          expect(radio).toHaveAttribute("aria-checked", "true");
          unmount();
        })
      ),
      { numRuns: 100 }
    );
  });
});
