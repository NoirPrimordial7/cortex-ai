import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const phase = process.env.CORTEX_ROLLOUT;
test.skip(!phase, "Opt-in real backend rollout evidence.");
test.use({ trace: "off", video: "off" });
test("rollout real browser matrix", async ({ page }) => {
  test.setTimeout(240000);
  const folder = `../docs/design/premium-refinement/rollout/${phase}`;
  mkdirSync(folder, { recursive: true });
  const observations: unknown[] = [];
  for (const theme of ["light", "dark"]) {
    await page.goto("/");
    await page.evaluate(
      (t) => localStorage.setItem("cortex:theme:v1", t),
      theme,
    );
    await page.reload();
    await expect(page.locator(".app")).toHaveClass(
      theme === "dark" ? /dark/ : /^app\s*$/,
    );
    await expect(page.getByTestId("demo-profile-ravi")).toBeVisible();
    {
      for (const width of [1440, 1280, 768, 390, 320]) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({
          path: `${folder}/${theme}-login-${width}.png`,
          fullPage: true,
        });
      }
      await page.getByTestId("demo-profile-ravi").click();
      await page
        .getByRole("button", { name: "Enter your workspace", exact: true })
        .click();
    }
    await expect(
      page.getByRole("link", { name: "Skip to workspace" }),
    ).toBeVisible();
    const docs = await (await page.request.get("/api/v1/documents")).json();
    const doc =
      docs.items.find((d: { title: string }) => /leave/i.test(d.title)) ||
      docs.items[0];
    for (const [name, route] of [
      ["library", "/documents"],
      ["document", `/documents/${doc.id}`],
      ["conflicts", "/conflicts"],
      ["activity", "/history"],
      ["permissions", "/permissions"],
      ["grants", `/permissions?document=${doc.id}`],
      ["upload", "/upload"],
      ["dashboard", "/"],
    ]) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator(".state .spin")).toHaveCount(0);
      if (name === "document")
        await expect(page.locator(".source-text")).toBeVisible();
      if (name === "conflicts") {
        const compare = page
          .getByRole("button", { name: "Compare policy evidence", exact: true })
          .first();
        if (await compare.isVisible()) {
          await compare.click();
          await expect(page.locator(".conflict-comparison")).toBeVisible();
        }
      }
      for (const width of [1440, 1280, 768, 390, 320]) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(async () => {
          await document.fonts.ready;
          (document.activeElement as HTMLElement)?.blur();
          window.scrollTo(0, 0);
        });
        await page.screenshot({
          path: `${folder}/${theme}-${name}-${width}.png`,
          fullPage: true,
        });
        const geometry = await page.evaluate(() => ({
          width: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          height: document.documentElement.scrollHeight,
        }));
        expect(geometry.scrollWidth).toBeLessThanOrEqual(width);
        observations.push({ theme, page: name, ...geometry });
      }
    }
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await page.getByTestId("demo-profile-isha").click();
    await page
      .getByRole("button", { name: "Enter your workspace", exact: true })
      .click();
    await expect(
      page.getByRole("link", { name: "Skip to workspace" }),
    ).toBeVisible();
    await page.goto("/audit");
    await expect(
      page.getByRole("heading", { name: "Audit activity" }),
    ).toBeVisible();
    await expect(page.locator(".state .spin")).toHaveCount(0);
    for (const width of [1440, 1280, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(async () => {
        await document.fonts.ready;
        (document.activeElement as HTMLElement)?.blur();
        window.scrollTo(0, 0);
      });
      await page.screenshot({
        path: `${folder}/${theme}-audit-${width}.png`,
        fullPage: true,
      });
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
    }
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
  }
  writeFileSync(
    `${folder}/observations.json`,
    JSON.stringify(
      { actualBackend: true, profiles: ["ravi", "isha"], observations },
      null,
      2,
    ),
  );
});

test("all rollout gallery pairs load their original screenshots", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("http://127.0.0.1:8007/rollout/gallery.html");
  for (const name of [
    "library",
    "document",
    "conflicts",
    "activity",
    "permissions",
    "grants",
    "audit",
    "upload",
    "dashboard",
    "login",
  ]) {
    await page.locator("#page").selectOption(name);
    await expect(page.locator("#pairs section")).toHaveCount(6);
    for (const img of await page.locator("#pairs img").all()) {
      await img.scrollIntoViewIfNeeded();
      await expect
        .poll(() => img.evaluate((el) => (el as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0);
    }
  }
});
