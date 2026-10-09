import { test, expect } from "@playwright/test";
test.use({
  baseURL: process.env.CORTEX_WORKFLOW_URL || "http://127.0.0.1:8004",
  viewport: { width: 720, height: 450 },
  deviceScaleFactor: 2,
  trace: "off",
  video: "off",
});
test.skip(
  !process.env.CORTEX_LIVE_WORKFLOW,
  "Explicit real-data 1440px / 200% reflow emulation.",
);
for (const profile of ["ravi", "isha"])
  test(`200 percent desktop reflow and short viewport ${profile}`, async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByTestId("demo-profile-" + profile).click();
    await page
      .getByRole("button", { name: "Enter your workspace", exact: true })
      .click();
    await expect(
      page.getByRole("link", { name: "Skip to workspace" }),
    ).toBeVisible();
    const docs = await (await page.request.get("/api/v1/documents")).json();
    const routes =
      profile === "isha"
        ? ["/", "/documents", "/audit"]
        : [
            "/",
            "/assistant",
            "/documents",
            "/documents/" + docs.items[0].id,
            "/upload",
            "/history",
            "/conflicts",
            "/permissions",
          ];
    for (const route of routes) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(
        page.getByText("Loading your workspace…", { exact: true }),
      ).toHaveCount(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
        route,
      ).toBeLessThanOrEqual(720);
      const menu = page.getByRole("button", { name: "Open navigation" });
      await menu.click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(menu).toBeFocused();
    }
  });
