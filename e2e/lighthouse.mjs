// Usage: node e2e/lighthouse.mjs <web|pages> <label>   (the site must already be running)
// Writes e2e/.results/lh-<site>-<label>.json with the four scores and every failing audit.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const [site, label] = process.argv.slice(2);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pw = join(homedir(), "AppData/Local/ms-playwright");
const chromeDir = existsSync(pw) ? readdirSync(pw).filter((d) => /^chromium-\d+$/.test(d)).sort().pop() : null;
const chrome = process.env.CHROME_PATH || (chromeDir && join(pw, chromeDir, "chrome-win64", "chrome.exe"));
const TARGETS = {
  web: { Home: "http://localhost:3100/", Model: "http://localhost:3100/model", About: "http://localhost:3100/about", "Sign in": "http://localhost:3100/login" },
  pages: { Home: "http://localhost:4174/saakh/", Model: "http://localhost:4174/saakh/#model", About: "http://localhost:4174/saakh/#about", "Sign in": "http://localhost:4174/saakh/#login" },
}[site];
if (!TARGETS) throw new Error("site must be web or pages");

const summary = {};
for (const [name, url] of Object.entries(TARGETS)) {
  const out = join(tmpdir(), `lh-${site}-${Date.now()}.json`);
  try {
    // The Chrome flags are quoted because this runs through a shell; unquoted they split into separate Lighthouse arguments.
    execFileSync("pnpm", ["dlx", "lighthouse@13.6.0", url, "--quiet", "--output=json", `--output-path=${out}`, '"--chrome-flags=--headless=new --no-sandbox"', "--only-categories=performance,accessibility,best-practices,seo", "--form-factor=mobile"], {
      env: { ...process.env, CHROME_PATH: chrome },
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
      timeout: 240000,
    });
  } catch (e) {
    // One page failing must not lose the others: record it and carry on.
    const reason = String(e.stderr || e.message).trim().split("\n").slice(-6).join(" | ");
    summary[name] = { url, error: reason };
    console.log(name, "LIGHTHOUSE FAILED:", reason);
    continue;
  }
  const r = JSON.parse(readFileSync(out, "utf8"));
  const scores = Object.fromEntries(Object.entries(r.categories).map(([k, c]) => [k, Math.round(c.score * 100)]));
  const failing = Object.values(r.audits)
    .filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== "informative" && a.scoreDisplayMode !== "manual" && a.scoreDisplayMode !== "notApplicable")
    .map((a) => `${a.id}: ${a.displayValue || a.title}`);
  summary[name] = { url, scores, failing };
  console.log(name, JSON.stringify(scores));
  failing.forEach((f) => console.log("   -", f));
}
mkdirSync(join(root, "e2e/.results"), { recursive: true });
writeFileSync(join(root, `e2e/.results/lh-${site}-${label}.json`), JSON.stringify(summary, null, 2));
