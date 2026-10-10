import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
test.skip(
  !process.env.CORTEX_CONFLICT_REFINEMENT,
  "Opt-in same local baseline conflict data.",
);
test.use({ trace: "off", video: "off" });
test("same baseline conflicts are compact in light and dark at all required widths", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto("/");
  await page.getByTestId("demo-profile-ravi").click();
  await page
    .getByRole("button", { name: "Enter your workspace", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Skip to workspace" }),
  ).toBeVisible();
  const items = (await (await page.request.get("/api/v1/conflicts")).json())
    .items;
  expect(items.length).toBeGreaterThan(1);
  const root = "../docs/design/premium-refinement/conflicts";
  mkdirSync(root, { recursive: true });
  const observations: unknown[] = [];
  for (const theme of ["light", "dark"]) {
    await page.evaluate(
      (t) => localStorage.setItem("cortex:theme:v1", t),
      theme,
    );
    for (const width of [1440, 1280, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/conflicts");
      await expect(page.locator(".conflict-record")).toHaveCount(1);
      await page
        .getByRole("button", { name: "Compare policy evidence", exact: true })
        .click();
      await expect(page.locator(".conflict-evidence")).toHaveCount(2);
      await page.evaluate(async () => {
        await document.fonts.ready;
        (document.activeElement as HTMLElement)?.blur();
        scrollTo(0, 0);
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      observations.push({
        theme,
        width,
        originalRecords: items.length,
        groups: 1,
        height: await page.evaluate(
          () => document.documentElement.scrollHeight,
        ),
      });
      await page.screenshot({
        path: `${root}/${theme}-conflicts-${width}.png`,
        fullPage: true,
      });
      await page.getByText(/Recorded occurrences/).click();
      await expect(page.locator(".conflict-occurrences li")).toHaveCount(
        items.length,
      );
      for (const q of items)
        await expect(
          page
            .locator(".conflict-occurrences code")
            .filter({ hasText: q.query_id }),
        ).toBeVisible();
    }
  }
  writeFileSync(
    `${root}/observations.json`,
    JSON.stringify(observations, null, 2),
  );
});
