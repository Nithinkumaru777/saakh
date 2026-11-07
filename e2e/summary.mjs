// Usage: node e2e/summary.mjs <web|pages> [maxFailuresShown]   Condenses the Playwright JSON report.
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const [site, max = "400"] = process.argv.slice(2);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const r = JSON.parse(readFileSync(join(root, `e2e/.results/${site}.json`), "utf8"));
const failures = new Map();
const walk = (s, path = []) => {
  for (const c of s.suites || []) walk(c, [...path, c.title]);
  for (const spec of s.specs || []) {
    for (const t of spec.tests) {
      const res = t.results[t.results.length - 1];
      if (t.status === "expected" || t.status === "skipped") continue;
      const msg = (res?.error?.message || res?.status || "").replace(/\u001b\[[0-9;]*m/g, "").split("\n").filter((l) => l.trim()).slice(0, 9).join(" / ").slice(0, 420);
      const key = `${path.slice(1).join(" > ")} > ${spec.title}`;
      if (!failures.has(key)) failures.set(key, { projects: [], msg });
      failures.get(key).projects.push(t.projectName.split("-")[1]);
    }
  }
};
walk(r);
console.log(JSON.stringify(r.stats));
console.log(`distinct failing tests: ${failures.size}`);
[...failures].slice(0, +max).forEach(([k, v]) => console.log(`\n[${v.projects.join(",")}] ${k}\n   ${v.msg}`));
