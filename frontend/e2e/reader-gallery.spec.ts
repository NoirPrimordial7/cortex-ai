import { test, expect } from "@playwright/test";

test.skip(!process.env.CORTEX_READER, "Opt-in static review gallery");
test.use({ baseURL: "http://127.0.0.1:8007", trace: "off", video: "off" });

test("gallery loads all 70 new captures and ten original conflict baselines", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto("/reader/gallery.html");
  const files = new Set<string>();
  for (const view of [
    "fullscreen",
    "full-evidence",
    "evidence",
    "document",
    "baseline-conflicts",
    "conflicts",
    "original-pdf",
  ]) {
    await page.locator("#view").selectOption(view);
    for (const width of ["1440", "1280", "768", "390", "320"]) {
      await page.locator("#width").selectOption(width);
      const images = page.locator("#captures img");
      await expect(images).toHaveCount(view === "baseline-conflicts" ? 4 : 2);
      for (const image of await images.all()) {
        await image.scrollIntoViewIfNeeded();
        await expect
          .poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth))
          .toBeGreaterThan(0);
        files.add((await image.getAttribute("src"))!);
      }
    }
  }
  expect(files.size).toBe(80);
  await page.setViewportSize({ width: 320, height: 900 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
