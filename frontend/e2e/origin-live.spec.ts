import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";

test.use({ baseURL: "http://127.0.0.1:8005", trace: "off", video: "off" });
test.skip(
  !process.env.CORTEX_LIVE_ORIGIN,
  "Isolated real backend intentionally excludes this exact origin.",
);
test("real origin denial remains clear and usable at all six widths", async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.getByTestId("demo-profile-maya").click();
    const response = page.waitForResponse((r) =>
      r.url().endsWith("/auth/login"),
    );
    await page.getByRole("button", { name: "Enter your workspace" }).click();
    expect((await response).status()).toBe(403);
    await expect(page.getByRole("alert")).toContainText(
      "This review address is not approved",
    );
    await expect(
      page.getByRole("link", { name: "Open approved published demo" }),
    ).toHaveAttribute("href", "https://cortex-ai-three-kappa.vercel.app/");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    mkdirSync("../outputs/product-audit/after/maya", { recursive: true });
    await page.screenshot({
      path: `../outputs/product-audit/after/maya/origin-denied-${width}.png`,
      fullPage: true,
    });
  }
});
