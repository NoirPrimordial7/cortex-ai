import { test, expect } from "@playwright/test";
for (const width of [320, 390, 768, 1024, 1280, 1440]) {
  test(`one shell, responsive navigation and themes at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route("**/api/v1/**", (route) => {
      const path = new URL(route.request().url()).pathname;
      const result = path.endsWith("/auth/session")
        ? {
            user: {
              id: "test-admin",
              display_name: "Ravi Mehta",
              workspace: "NORTHSTAR",
              roles: [{ id: "admin", name: "Admin" }],
              actions: [
                "query.execute",
                "document.upload",
                "document.review",
                "acl.manage",
                "user.manage",
                "audit.read",
              ],
            },
            csrf_token: "test",
            policy_revision: 1,
            knowledge_revision: 1,
          }
        : path.endsWith("/dashboard")
          ? {
              readable_documents: 0,
              unresolved_queries: 0,
              recent: [],
              documents: [],
            }
          : path.endsWith("/admin/users")
            ? { items: [], roles: [], policy_revision: 1 }
            : { items: [] };
      return route.fulfill({ json: result });
    });
    for (const route of [
      "/",
      "/assistant",
      "/documents",
      "/upload",
      "/history",
      "/conflicts",
      "/permissions",
      "/audit",
    ]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator(".app-masthead")).toHaveCount(1);
      await expect(page.locator(".wordmark")).toHaveText(
        "CortexThe Evidence Desk",
      );
      for (const dark of [false, true]) {
        if (dark)
          await page
            .getByRole("button", { name: "Switch to dark theme" })
            .click();
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBeLessThanOrEqual(width);
        if (dark)
          await page
            .getByRole("button", { name: "Switch to light theme" })
            .click();
      }
    }
    if (width < 900) {
      const menu = page.getByRole("button", { name: "Open navigation" });
      await menu.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await page.keyboard.press("Shift+Tab");
      expect(
        await page.evaluate(() => !!document.activeElement?.closest("dialog")),
      ).toBe(true);
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(menu).toBeFocused();
    }
  });
}
