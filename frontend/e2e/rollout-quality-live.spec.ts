import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
test.skip(
  !process.env.CORTEX_ROLLOUT,
  "Opt-in actual source edition and contrast verification.",
);
test.use({ trace: "off", video: "off" });
test("authorized conflict source jumps and context dialog restore focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/");
  await page.getByTestId("demo-profile-ravi").click();
  await page
    .getByRole("button", { name: "Enter your workspace", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Skip to workspace" }),
  ).toBeVisible();
  await page.goto("/conflicts");
  await page
    .getByRole("button", { name: "Compare policy evidence", exact: true })
    .first()
    .click();
  await expect(page.locator(".conflict-comparison")).toBeVisible();
  await page
    .getByRole("link", { name: "Jump to source 2", exact: true })
    .click();
  await expect(page.locator(".conflict-evidence").nth(1)).toBeFocused();
  const inspect = page
    .getByRole("button", { name: "Inspect source context", exact: true })
    .nth(1);
  await inspect.click();
  await expect(
    page.getByRole("dialog").getByRole("button", { name: "Back to conflicts" }),
  ).toBeFocused();
  await expect(page.getByText("Checking source access…")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(inspect).toBeFocused();
});
test("mobile edition control reads every authorized immutable version", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/");
  await page.getByTestId("demo-profile-ravi").click();
  await page
    .getByRole("button", { name: "Enter your workspace", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Skip to workspace" }),
  ).toBeVisible();
  const docs = await (await page.request.get("/api/v1/documents")).json();
  const doc = docs.items.find(
    (d: { title: string }) => d.title === "Annual leave policy",
  );
  const detail = await (
    await page.request.get(`/api/v1/documents/${doc.id}`)
  ).json();
  await page.goto(`/documents/${doc.id}`);
  for (const version of detail.versions) {
    const response = await page.request.get(
      `/api/v1/versions/${version.id}/content`,
    );
    expect(response.status()).toBe(200);
    const source = await response.json();
    await page.getByLabel("Source edition").selectOption(version.id);
    await expect(page.locator(".reader-body")).toHaveText(source.text);
    await expect(page.locator(".document-reading h2")).toHaveText(
      version.version_label,
    );
    await page.getByText("Source integrity", { exact: true }).click();
    await expect(page.locator(".hash-details code")).toHaveText(
      source.source_hash,
    );
    await page.getByText("Source integrity", { exact: true }).click();
  }
});

test("both themes keep readable text, enabled primary actions and mobile fields", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByTestId("demo-profile-ravi").click();
  await page
    .getByRole("button", { name: "Enter your workspace", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Skip to workspace" }),
  ).toBeVisible();
  const docs = await (await page.request.get("/api/v1/documents")).json();
  const results: unknown[] = [];
  for (const theme of ["light", "dark"]) {
    if (theme === "dark")
      await page.getByRole("button", { name: "Switch to dark theme" }).click();
    for (const route of [
      "/documents",
      `/documents/${docs.items[0].id}`,
      "/history",
      "/conflicts",
      "/permissions",
      `/permissions?document=${docs.items[0].id}`,
      "/upload",
      "/",
    ]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator(".state .spin")).toHaveCount(0);
      const sample = await page.evaluate(() => {
        const luminance = (color: string) => {
          const rgb = color
            .match(/[\d.]+/g)!
            .slice(0, 3)
            .map(Number)
            .map((v) => {
              const s = v / 255;
              return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
            });
          return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
        };
        const background = (el: Element) => {
          let current: Element | null = el;
          while (current) {
            const bg = getComputedStyle(current).backgroundColor;
            if (bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return bg;
            current = current.parentElement;
          }
          return "rgb(255,255,255)";
        };
        const text = Array.from(
          document.querySelectorAll(
            ".workspace h1,.workspace h2,.workspace p,.workspace .badge,.workspace .button,.workspace .reading-label",
          ),
        )
          .filter((el) => (el as HTMLElement).offsetHeight > 0)
          .map((el) => {
            const x = luminance(getComputedStyle(el).color),
              y = luminance(background(el));
            return {
              text: el.textContent?.slice(0, 50),
              ratio: (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05),
            };
          });
        const fields = Array.from(
          document.querySelectorAll(
            ".workspace input:not([type=checkbox]):not([type=file]),.workspace select,.workspace textarea",
          ),
        )
          .filter((el) => (el as HTMLElement).offsetHeight > 0)
          .map((el) => ({
            fontSize: parseFloat(getComputedStyle(el).fontSize),
          }));
        return {
          text,
          fields,
          width: innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
        };
      });
      for (const item of sample.text)
        expect(item.ratio, `${route}: ${item.text}`).toBeGreaterThanOrEqual(
          4.5,
        );
      for (const field of sample.fields)
        expect(field.fontSize, route).toBeGreaterThanOrEqual(16);
      expect(sample.scrollWidth).toBeLessThanOrEqual(320);
      results.push({ theme, route, ...sample });
    }
    await page.goto(`/permissions?document=${docs.items[0].id}`);
    const disabled = page.getByRole("button", {
      name: "Review grant changes",
      exact: true,
    });
    await expect(disabled).toBeDisabled();
    const disabledColor = await disabled.evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
    await page.goto("/upload");
    const enabled = page.getByRole("button", {
      name: "Upload for review",
      exact: true,
    });
    await expect(enabled).toBeEnabled();
    expect(
      await enabled.evaluate((el) => getComputedStyle(el).backgroundColor),
    ).not.toBe(disabledColor);
  }
  mkdirSync("../outputs/rollout-quality", { recursive: true });
  writeFileSync(
    "../outputs/rollout-quality/contrast.json",
    JSON.stringify(results, null, 2),
  );
});
