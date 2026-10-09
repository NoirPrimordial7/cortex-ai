import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const phase = process.env.CORTEX_REFINEMENT_PHASE;
test.skip(!phase, "Opt-in real local-backend refinement probes.");
test.use({ trace: "off", video: "off" });
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("demo-profile-maya").click();
  await page.getByRole("button", { name: "Enter your workspace", exact: true }).click();
  await expect(page.getByRole("link", { name: "Skip to workspace" })).toBeVisible();
  await page.goto("/assistant");
  await expect(page.getByRole("heading", { name: /A clear answer/ })).toBeVisible();
});

test("slow real citation distinguishes answer processing from source checking", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let release = () => {};
  const held = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/queries/*/citations/*", async (route) => {
    await held;
    await route.continue(); // Actual backend response; delay only, no replacement data.
  });
  await page.getByLabel("As of", { exact: true }).fill("2026-10-10");
  await page.getByRole("button", { name: "How many annual leave days do I have?", exact: true }).click();
  await expect(page.getByRole("heading", { name: /20 working days/ })).toBeVisible();
  const processing = await page.getByText("Checking policy access, dates and authority…", { exact: true }).count();
  expect(processing).toBe(phase === "before" ? 1 : 0);
  const folder = `../outputs/premium-refinement/${phase}`;
  mkdirSync(folder, { recursive: true });
  await page.screenshot({ path: `${folder}/slow-source-390.png`, fullPage: true });
  writeFileSync(`${folder}/loading-reproduction.json`, JSON.stringify({ actualBackend: true, citationNetworkDelay: true, answeredWhilePolicyProcessing: processing === 1 }, null, 2));
  release();
  await expect(page.getByText(/Checking policy|Checking source/)).toHaveCount(0);
});

test("navigation restores only the current user's unfinished question and context", async ({ page }) => {
  await page.getByLabel("Ask about a company policy").fill("What is my notice period?");
  await page.getByLabel("As of", { exact: true }).fill("2025-10-10");
  await page.getByLabel("Policy scope").selectOption("india_contractor");
  await page.getByRole("link", { name: "Document library", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Document library" })).toBeVisible();
  await page.getByRole("link", { name: "Knowledge assistant", exact: true }).click();
  await expect(page.getByLabel("Ask about a company policy")).toHaveValue(phase === "before" ? "" : "What is my notice period?");
  if (phase !== "before") {
    await expect(page.getByLabel("As of", { exact: true })).toHaveValue("2025-10-10");
    await expect(page.getByLabel("Policy scope")).toHaveValue("india_contractor");
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.getByTestId("demo-profile-orbit").click();
    await page.getByRole("button", { name: "Enter your workspace", exact: true }).click();
    await expect(page.getByRole("link", { name: "Skip to workspace" })).toBeVisible();
    await page.goto("/assistant");
    await expect(page.getByLabel("Ask about a company policy")).toHaveValue("");
    await expect(page.getByLabel("Policy scope")).toHaveValue("india_full_time");
  }
});
