import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const phase = process.env.CORTEX_ASK_ITERATION;
test.skip(!phase, "Opt-in same-data actual backend visual capture.");
test.use({ trace: "off", video: "off" });
test("review gallery shows every required original screenshot", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:8007/iteration-2/gallery.html");
  for (const state of ["conflict", "answer", "empty"]) {
    await page.locator("#state").selectOption(state);
    await expect(page.locator("#pairs section")).toHaveCount(6);
    const images = page.locator("#pairs img");
    await expect(images).toHaveCount(12);
    for (const img of await images.all()) {
      await img.scrollIntoViewIfNeeded();
      await expect
        .poll(() => img.evaluate((el) => (el as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0);
    }
  }
});
test("Ask same-data visual matrix", async ({ page }) => {
  test.setTimeout(180000);
  const folder = `../docs/design/premium-refinement/iteration-2/${phase}`;
  mkdirSync(folder, { recursive: true });
  const observations: unknown[] = [];
  await page.goto("/");
  await page.getByTestId("demo-profile-maya").click();
  await page
    .getByRole("button", { name: "Enter your workspace", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Skip to workspace" }),
  ).toBeVisible();
  for (const theme of ["light", "dark"]) {
    if (theme === "dark")
      await page.getByRole("button", { name: "Switch to dark theme" }).click();
    for (const state of ["empty", "answer", "conflict"]) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto("/assistant");
      await expect(
        page.getByRole("heading", { name: /A clear answer/ }),
      ).toBeVisible();
      await page.getByLabel("As of", { exact: true }).fill("2026-10-10");
      if (state !== "empty") {
        await page
          .getByRole("button", {
            name:
              state === "answer"
                ? "How many annual leave days do I have?"
                : "How many remote days per week?",
            exact: true,
          })
          .click();
        await expect(page.locator(".fb-answer")).toBeVisible();
        await expect(
          page.getByText(/Checking policy|Checking source/),
        ).toHaveCount(0);
        if (state === "answer")
          await expect(page.locator(".fb-answer h2")).toContainText(
            "20 working days",
          );
        else
          await expect(
            page.getByText("Policy conflict", { exact: true }),
          ).toBeVisible();
      }
      for (const width of [1440, 1280, 768, 390, 320]) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({
          path: `${folder}/${theme}-${state}-${width}.png`,
          fullPage: true,
        });
        const geometry = await page.evaluate(() => ({
          width: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
        }));
        expect(geometry.scrollWidth).toBeLessThanOrEqual(width);
        observations.push({ theme, state, ...geometry });
        if (state === "answer" && width < 1100) {
          const citation = page
            .getByRole("button", { name: /View evidence:/ })
            .first();
          await citation.click();
          await expect(
            page.getByRole("button", { name: "Back to answer" }),
          ).toBeFocused();
          await expect(page.getByText("Checking source access…")).toHaveCount(
            0,
          );
          await page.screenshot({
            path: `${folder}/${theme}-evidence-${width}.png`,
            fullPage: true,
          });
          await page.getByRole("button", { name: "Back to answer" }).click();
          await expect(citation).toBeFocused();
        }
      }
    }
  }
  writeFileSync(
    `${folder}/observations.json`,
    JSON.stringify(
      {
        actualBackend: true,
        date: "2026-10-10",
        profile: "maya",
        observations,
      },
      null,
      2,
    ),
  );
});
