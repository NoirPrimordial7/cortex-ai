import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  testMatch: "conflict-reaudit-local.spec.ts",
  workers: 1,
  timeout: 60000,
  outputDir: "../outputs/conflict-reaudit-browser",
  use: {
    baseURL: "http://127.0.0.1:8009",
    browserName: "chromium",
    channel: "chrome",
    trace: "retain-on-failure",
    actionTimeout: 10000,
  },
  reporter: [
    ["list"],
    [
      "html",
      {
        outputFolder: "../outputs/conflict-reaudit-browser-report",
        open: "never",
      },
    ],
  ],
});
