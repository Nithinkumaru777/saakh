// Website 2: the static site, served at /saakh/ exactly as GitHub Pages serves it.
import { defineConfig } from "@playwright/test";
import { resolve } from "node:path";

process.env.SAAKH_SITE = "pages";
const root = resolve(__dirname, "..");
const PORT = 4174;

export default defineConfig({
  testDir: __dirname,
  testMatch: process.env.E2E_LIGHTHOUSE ? ["lighthouse.run.ts"] : ["shared/**/*.spec.ts", "pages/**/*.spec.ts"],
  outputDir: resolve(root, "e2e/.results/pages"),
  timeout: process.env.E2E_LIGHTHOUSE ? 900_000 : 45_000,
  expect: { timeout: 8_000 },
  workers: 4,
  fullyParallel: true,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: resolve(root, "e2e/.results/pages.json") }]],
  use: { baseURL: `http://localhost:${PORT}/saakh/`, trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: process.env.E2E_LIGHTHOUSE
    ? [{ name: "lighthouse" }]
    : [
        { name: "desktop-1440", use: { viewport: { width: 1440, height: 900 } } },
        { name: "tablet-768", use: { viewport: { width: 768, height: 1024 } } },
        { name: "mobile-375", use: { viewport: { width: 375, height: 667 } } },
      ],
  webServer: {
    command: `node e2e/static-server.mjs ${PORT}`,
    cwd: root,
    url: `http://localhost:${PORT}/saakh/`,
    reuseExistingServer: false,
  },
});
