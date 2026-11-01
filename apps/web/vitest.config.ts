import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const ledger = fileURLToPath(new URL("../../tests/ledger/", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
  test: {
    environment: "jsdom",
    env: { SAAKH_LEDGER_DIR: ledger },
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/setup.ts"],
    globalSetup: ["tests/global-setup.ts"],
    reporters: ["default", "junit"],
    outputFile: { junit: `${ledger}junit-web.xml` },
  },
});
