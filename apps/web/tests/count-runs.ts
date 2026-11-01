// SPEC §T: every web function runs >= 100 times with 0 failures. Each test file's counts are written
// as a fragment; tests/global-setup.ts merges fragments into tests/ledger/counts.web.json.
import { afterAll, expect } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";

export const MIN_RUNS = 100;
// Absolute path injected by vitest.config.ts (jsdom rewrites import.meta.url, so it cannot be derived here).
export const LEDGER_DIR = process.env.SAAKH_LEDGER_DIR ?? "";
export const FRAGMENT_DIR = `${LEDGER_DIR}.web-fragments/`;
if (!LEDGER_DIR) throw new Error("SAAKH_LEDGER_DIR is not set; run tests through vitest.config.ts");

type Tally = { executions: number; failed: number };
const tallies = new Map<string, Tally>();

// Registered at module load. tests/setup.ts imports this module, so the hook is attached to every test file
// at collection time (hooks registered from inside a running test are ignored by vitest).
afterAll(() => {
  if (tallies.size === 0) return;
  mkdirSync(FRAGMENT_DIR, { recursive: true });
  writeFileSync(`${FRAGMENT_DIR}${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.json`, JSON.stringify(Object.fromEntries(tallies)));
  for (const [fid, t] of tallies) {
    expect(t.executions, `${fid} must execute at least ${MIN_RUNS} times`).toBeGreaterThanOrEqual(MIN_RUNS);
  }
});

/**
 * Wrap a per-example body so every execution (and failure) is counted for `fid`, e.g.
 *   fc.assert(fc.property(arb, countRuns("F25", (s) => { ... })), { numRuns: 100 })
 * The test file fails at teardown if `fid` ran fewer than 100 times.
 */
export function countRuns<A extends unknown[], R>(fid: string, body: (...args: A) => R): (...args: A) => R {
  if (!/^F\d{2}$/.test(fid)) throw new Error(`countRuns: function id must look like F01, got "${fid}"`);
  if (!tallies.has(fid)) tallies.set(fid, { executions: 0, failed: 0 });
  const tally = tallies.get(fid)!;
  return (...args: A) => {
    tally.executions++;
    try {
      return body(...args);
    } catch (err) {
      tally.failed++;
      throw err;
    }
  };
}
