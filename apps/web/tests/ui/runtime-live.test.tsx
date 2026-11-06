// Regression: the live feed toasted "New assessment from another desk" for this browser's own save.
// The server broadcasts the change as soon as /api/assess saves, but the local row reaches HISTORY only
// after the stamp animation (~1 s), so the 250 ms live check saw an unknown id. Own saved ids are skipped.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import fc from "fast-check";
import { render } from "@testing-library/react";
import { SaakhApp } from "@/components/SaakhApp";
import { countRuns } from "../count-runs";

// Assess requires an account: start these tests signed in (token + a mocked /api/auth/me).
const TEST_USER = { id: 1, email: "tester@example.com", full_name: "Test User", phone: "", city: "", employment_type: "", monthly_income: 0, created_at: "2026-01-01T00:00:00+00:00" };

const apiResult = (id: string) => ({
  id, created_at: new Date().toISOString(), pd: 0.012, grade: "A", outcome: "SANCTIONED", headline: "Sanctioned at grade A",
  indicative_rate: 11.5, emi: 19786, max_eligible_amount: 2420000,
  features: { foir: 0.14, lti: 0.34, ltv: null, dti: 0.34, total_income: 145000, reference_rate: 12.5, new_emi_ref: 20072, age_at_maturity: 32, no_credit_history: false },
  factors: [{ feature: "foir", label: "EMIs take 14 % of income", direction: "lowers", contribution_pp: -2.1, sentence: "Comfortable." }],
  knockouts: [], flags: [], counterfactuals: [],
});
let emit: (ids: string[]) => void = () => {};
let saveN = 0;
let remoteIds: string[] = [];

beforeAll(() => {
  vi.useFakeTimers();
  // The runtime schedules the live check with window.setTimeout; make sure that is the faked clock too,
  // or the 250 ms check would run on real time after the whole (fake-time) Run has finished.
  window.setTimeout = globalThis.setTimeout;
  window.clearTimeout = globalThis.clearTimeout;
  const g = globalThis as Record<string, unknown>;
  // Full motion (not reduced): the Run's stamp sequence takes ~1 s, which is when the bug showed.
  g.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  localStorage.setItem("saakh-token", "test-token");
  g.fetch = async (url: string) => {
    const u = String(url);
    if (u.includes("/api/auth/me")) return { ok: true, status: 200, json: async () => TEST_USER } as Response;
    if (u.includes("/api/assessments")) return { ok: true, json: async () => ({ items: [], total: 0 }) } as Response;
    if (u.includes("/api/assess")) {
      // Like the real API: the change is broadcast to every browser, including this one, as the save lands.
      const id = `own-${++saveN}`;
      const ids = [id, ...remoteIds];
      setTimeout(() => emit(ids), 0);
      return { ok: true, json: async () => apiResult(id) } as Response;
    }
    return { ok: true, json: async () => apiResult("score") } as Response;
  };
  g.EventSource = class {
    static CLOSED = 2;
    readyState = 1;
    onerror: unknown = null;
    private l: Record<string, (m: { data: string }) => void> = {};
    constructor() { emit = (ids) => this.l.change?.({ data: JSON.stringify({ kind: "assessment.created", ids }) }); setTimeout(() => this.l.ready?.({ data: "" }), 0); }
    addEventListener(t: string, f: (m: { data: string }) => void) { this.l[t] = f; }
    close() {}
  };
  Element.prototype.animate = function () {
    return { finished: Promise.resolve(), onfinish: null, cancel() {}, finish() {} } as unknown as Animation;
  };
  Element.prototype.scrollIntoView = () => {};
  window.scrollTo = () => {};
});
afterAll(() => vi.useRealTimers());

const toasts = () => [...document.querySelectorAll("#toasts > *")].map((t) => t.textContent?.trim() ?? "");

describe("F24 live feed only announces other desks", () => {
  it("an own Run never toasts as another desk; concurrent remote saves are counted (100 runs)", async () => {
    render(<SaakhApp initialView="assess" />);
    await vi.advanceTimersByTimeAsync(100);
    let r = 0;
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 0, max: 3 }), countRuns("F24", async (remote) => {
        document.getElementById("toasts")!.replaceChildren();
        remoteIds = Array.from({ length: remote }, () => `desk-${r++}`);
        (document.getElementById("runBtn") as HTMLButtonElement).click();
        await vi.advanceTimersByTimeAsync(3000);
        const t = toasts();
        expect(t).toContain("Assessment saved to database");
        if (remote === 0) expect(t.filter((x) => /desk/.test(x))).toEqual([]);
        else expect(t).toContain(remote === 1 ? "New assessment from another desk" : `${remote} new assessments from other desks`);
      })),
      { numRuns: 100 }
    );
  }, 120_000);
});
