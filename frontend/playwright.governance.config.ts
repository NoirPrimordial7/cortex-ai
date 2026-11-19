import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "governance-local.spec.ts",
  workers: 1,
  timeout: 60000,
  outputDir: "../outputs/governance-browser",
  use: {
    baseURL: "http://127.0.0.1:8008",
    browserName: "chromium",
    channel: "chrome",
    trace: "retain-on-failure",
    actionTimeout: 10000,
  },
  reporter: [
    ["list"],
    [
      "html",
      { outputFolder: "../outputs/governance-browser-report", open: "never" },
    ],
  ],
});
