// Not a browser test: runs Lighthouse while Playwright keeps the site's servers up, then stops them cleanly.
// E2E_LIGHTHOUSE=after pnpm exec playwright test --config e2e/web.config.ts
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { test } from "@playwright/test";

test("lighthouse", () => {
  const out = execFileSync("node", [resolve(__dirname, "lighthouse.mjs"), process.env.SAAKH_SITE!, process.env.E2E_LIGHTHOUSE!], { encoding: "utf8", timeout: 880_000 });
  console.log(out);
});
