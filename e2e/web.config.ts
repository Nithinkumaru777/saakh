// Website 1. Builds and tests the production site by default; E2E_DEV=1 tests `next dev` instead.
// Uses its own ports and a throwaway database, so a running dev server and services/api/data/saakh.db are never touched.
import { defineConfig } from "@playwright/test";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

process.env.SAAKH_SITE = "web";
const root = resolve(__dirname, "..");
const db = join(tmpdir(), `saakh-e2e-${process.ppid}-${Date.now()}.db`);
const dev = !!process.env.E2E_DEV;
const WEB = 3100;
const API = 8100;

export default defineConfig({
  testDir: __dirname,
  // E2E_LIGHTHOUSE=<label> uses this same server stack to run Lighthouse instead of the browser tests.
  testMatch: process.env.E2E_LIGHTHOUSE ? ["lighthouse.run.ts"] : ["shared/**/*.spec.ts", "web/**/*.spec.ts"],
  outputDir: resolve(root, "e2e/.results/web"),
  timeout: process.env.E2E_LIGHTHOUSE ? 900_000 : 45_000,
  expect: { timeout: 8_000 },
  workers: 4,
  fullyParallel: true,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: resolve(root, "e2e/.results/web.json") }]],
  use: { baseURL: `http://localhost:${WEB}`, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: process.env.E2E_LIGHTHOUSE
    ? [{ name: "lighthouse" }]
    : [
        { name: "desktop-1440", use: { viewport: { width: 1440, height: 900 } } },
        { name: "tablet-768", use: { viewport: { width: 768, height: 1024 } } },
        { name: "mobile-375", use: { viewport: { width: 375, height: 667 } } },
      ],
  webServer: [
    {
      command: `uv run uvicorn app.main:app --host 127.0.0.1 --port ${API}`,
      cwd: join(root, "services/api"),
      url: `http://127.0.0.1:${API}/api/health`,
      env: { SAAKH_DB_PATH: db, SAAKH_CORS_ORIGINS: `http://localhost:${WEB}` },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: dev ? `pnpm exec next dev -p ${WEB}` : `pnpm build && pnpm start -p ${WEB}`,
      cwd: join(root, "apps/web"),
      url: `http://localhost:${WEB}`,
      env: { NEXT_PUBLIC_API_URL: `http://localhost:${API}` },
      reuseExistingServer: false,
      timeout: 300_000,
    },
  ],
});
