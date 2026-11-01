import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
// Runs in the main Node process (no jsdom), so import.meta.url is a file URL here. Mirrors count-runs.ts FRAGMENT_DIR.
const FRAGMENT_DIR = fileURLToPath(new URL("../../../tests/ledger/.web-fragments/", import.meta.url));

const OUT = fileURLToPath(new URL("../../../tests/ledger/counts.web.json", import.meta.url));

type Tally = { executions: number; failed: number };

export function setup() {
  rmSync(FRAGMENT_DIR, { recursive: true, force: true });
}

export function teardown() {
  const merged: Record<string, Tally> = {};
  if (existsSync(FRAGMENT_DIR)) {
    for (const f of readdirSync(FRAGMENT_DIR)) {
      const part = JSON.parse(readFileSync(FRAGMENT_DIR + f, "utf8")) as Record<string, Tally>;
      for (const [fid, t] of Object.entries(part)) {
        const m = (merged[fid] ??= { executions: 0, failed: 0 });
        m.executions += t.executions;
        m.failed += t.failed;
      }
    }
    rmSync(FRAGMENT_DIR, { recursive: true, force: true });
  }
  mkdirSync(fileURLToPath(new URL("../../../tests/ledger/", import.meta.url)), { recursive: true });
  writeFileSync(OUT, JSON.stringify(merged, null, 2) + "\n");
}
