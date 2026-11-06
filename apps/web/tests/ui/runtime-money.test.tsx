// Regression: a rupee amount typed into the Assess wizard is formatted with Indian grouping
// ("78,000") by the money input, and must still pass step validation (readForm used to read the
// bare `data-money` attribute as falsy and turn "78,000" into NaN).
import { beforeAll, describe, expect, it } from "vitest";
import fc from "fast-check";
import { render } from "@testing-library/react";
import { SaakhApp } from "@/components/SaakhApp";
import { countRuns } from "../count-runs";

// Assess requires an account: start these tests signed in (token + a mocked /api/auth/me).
const TEST_USER = { id: 1, email: "tester@example.com", full_name: "Test User", phone: "", city: "", employment_type: "", monthly_income: 0, created_at: "2026-01-01T00:00:00+00:00" };

// The runtime drives real browser APIs that jsdom lacks; minimal stand-ins for this file only.
// fetch rejects, so scoring uses the runtime's in-browser fallback (no API needed).
beforeAll(() => {
  const g = globalThis as Record<string, unknown>;
  g.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
  localStorage.setItem("saakh-token", "test-token");
  g.fetch = (url: string) =>
    String(url).includes("/api/auth/me")
      ? Promise.resolve({ ok: true, status: 200, json: async () => TEST_USER } as Response)
      : Promise.reject(new Error("offline in test"));
  g.EventSource = class { addEventListener() {} close() {} onerror = null; onopen = null; onmessage = null; };
  Element.prototype.animate = function () {
    return { finished: Promise.resolve(), onfinish: null, cancel() {}, finish() {} } as unknown as Animation;
  };
  Element.prototype.scrollIntoView = () => {};
  window.scrollTo = () => {};
});

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;
const onStep = () => $(".pane.on")?.getAttribute("data-step");

describe("F01 Assess wizard accepts typed, formatted rupee amounts", () => {
  it("monthly income typed as digits passes step 2 for 100 values", async () => {
    render(<SaakhApp initialView="assess" />);
    await new Promise((r) => setTimeout(r, 50));
    fc.assert(
      fc.property(fc.integer({ min: 10_000, max: 50_00_000 }), countRuns("F01", (income) => {
        // Go to step 2 (Income), type the amount the way a user would, then press Continue.
        // The stepper only allows reached steps: from step 1 use Continue, from step 3 go back.
        if (onStep() === "0") $<HTMLButtonElement>("#nextBtn").click();
        else if (onStep() === "2") $<HTMLButtonElement>("#backBtn").click();
        expect(onStep()).toBe("1");
        const inc = $<HTMLInputElement>("#f_inc");
        inc.value = String(income);
        inc.dispatchEvent(new Event("input", { bubbles: true }));
        expect(inc.value).toBe(income.toLocaleString("en-IN"));
        const oth = $<HTMLInputElement>("#f_oth");
        oth.value = "0";
        oth.dispatchEvent(new Event("input", { bubbles: true }));
        $<HTMLButtonElement>("#nextBtn").click();
        expect(document.querySelector('.pane[data-step="1"] .field.err')).toBeNull();
        expect(onStep()).toBe("2");
      })),
      { numRuns: 100 }
    );
  }, 30_000);
});
