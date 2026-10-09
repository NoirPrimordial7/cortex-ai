import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
test.use({
  baseURL: process.env.CORTEX_WORKFLOW_URL || "http://127.0.0.1:8004",
  viewport: { width: 390, height: 900 },
  trace: "off",
  video: "off",
});
test.skip(
  !process.env.CORTEX_LIVE_WORKFLOW,
  "Explicit real backend role boundary verification.",
);
for (const profile of ["maya", "ravi", "isha", "orbit", "noor"])
  test(`real route and API boundaries ${profile}`, async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("demo-profile-" + profile).click();
    await page
      .getByRole("button", { name: "Enter your workspace", exact: true })
      .click();
    if (profile === "noor") {
      await expect(page.getByRole("alert")).toBeVisible();
      expect((await page.request.get("/api/v1/auth/session")).status()).toBe(
        401,
      );
      return;
    }
    await expect(
      page.getByRole("link", { name: "Skip to workspace" }),
    ).toBeVisible();
    const session = await (
      await page.request.get("/api/v1/auth/session")
    ).json();
    const results = [];
    for (const [path, action] of [
      ["/", ""],
      ["/documents", ""],
      ["/assistant", "query.execute"],
      ["/history", "query.execute"],
      ["/conflicts", "query.execute"],
      ["/upload", "document.upload"],
      ["/permissions", "user.manage"],
      ["/audit", "audit.read"],
    ]) {
      const allowed = !action || session.user.actions.includes(action);
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const expectedPath = allowed
        ? path
        : path === "/upload"
          ? "/documents"
          : "/";
      await expect(page).toHaveURL(new RegExp(expectedPath + "$"));
      results.push({ path, allowed, actualPath: new URL(page.url()).pathname });
    }
    for (const [path, action] of [
      ["/api/v1/audit-events", "audit.read"],
      ["/api/v1/admin/users", "user.manage"],
    ])
      expect((await page.request.get(path)).status()).toBe(
        session.user.actions.includes(action) ? 200 : 403,
      );
    mkdirSync("../outputs/product-audit/roles", { recursive: true });
    writeFileSync(
      `../outputs/product-audit/roles/${profile.toLowerCase()}.json`,
      JSON.stringify(results, null, 2),
    );
  });
