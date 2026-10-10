import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
test.skip(!process.env.CORTEX_READER, "Opt-in modal reading geometry");
test.use({ baseURL: "http://127.0.0.1:8008", trace: "off", video: "off" });
test("reader remains in the viewport after exact evidence navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.getByTestId("demo-profile-ravi").click();
  await page
    .getByRole("button", { name: "Enter your workspace", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Skip to workspace" }),
  ).toBeVisible();
  await page.goto("/assistant");
  await page
    .getByRole("button", {
      name: "How many annual leave days do I have?",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: "View evidence: Annual Leave and Absence Standard",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "View source context", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Read complete document", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Complete authorized document",
  });
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("button", { name: "Supporting passage", exact: true })
    .click();
  await expect(dialog.locator("mark")).toBeFocused();
  const geometry = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll(
        "dialog[open],dialog[open]>.back-link,dialog[open] mark",
      ),
    ).map((el) => ({
      tag: el.tagName,
      rect: el.getBoundingClientRect().toJSON(),
      styles: {
        position: getComputedStyle(el).position,
        top: getComputedStyle(el).top,
        scrollY: scrollY,
      },
    })),
  );
  mkdirSync("../outputs/reader-layout", { recursive: true });
  writeFileSync(
    "../outputs/reader-layout/geometry.json",
    JSON.stringify(geometry, null, 2),
  );
  await page.screenshot({ path: "../outputs/reader-layout/viewport.png" });
  const box = await dialog.boundingBox();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(901);
  await dialog
    .getByRole("button", { name: "Back to answer", exact: true })
    .click();
  await expect(dialog).toHaveCount(0);
});
