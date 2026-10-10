import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

// Explicit owner-authorized verification of the disposable public demo.
// Uses normal authentication, without governance writes or access bypasses.
test.skip(
  !process.env.CORTEX_HOSTED_RELEASE,
  "Production verification opt-in.",
);
test.use({
  baseURL:
    process.env.CORTEX_RELEASE_URL ||
    "https://cortex-ai-three-kappa.vercel.app",
  trace: "off",
  video: "off",
});

test("production conflict groups preserve occurrences and exact authorized evidence", async ({
  page,
}) => {
  test.setTimeout(180000);
  const folder = process.env.CORTEX_RELEASE_OUTPUT || "../outputs/pr8-release";
  mkdirSync(`${folder}/comparison`, { recursive: true });
  await page.goto("/");
  await page.getByTestId("demo-profile-ravi").click();
  await page
    .getByRole("button", { name: "Enter your workspace", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Skip to workspace" }),
  ).toBeVisible();
  const session = await (await page.request.get("/api/v1/auth/session")).json();
  for (let i = 0; i < 2; i++) {
    const response = await page.request.post("/api/v1/queries", {
      headers: {
        Origin: new URL(page.url()).origin,
        "X-CSRF-Token": session.csrf_token,
      },
      data: { query: "How many remote days per week?", as_of: "2026-10-10" },
    });
    expect(response.status()).toBe(200);
    const answer = await response.json();
    expect(answer.reason_code).toBe("UNRESOLVED_CONFLICT");
    expect(answer.citations).toHaveLength(2);
  }
  const items = (await (await page.request.get("/api/v1/conflicts")).json())
    .items;
  const occurrences = items.filter(
    (q: { as_of: string }) => q.as_of === "2026-10-10",
  );
  expect(occurrences.length).toBeGreaterThanOrEqual(2);
  const sources = [];
  for (const c of occurrences[0].citations) {
    const response = await page.request.get(
      `/api/v1/queries/${occurrences[0].query_id}/citations/${c.id}`,
    );
    expect(response.status()).toBe(200);
    const source = await response.json();
    expect(
      Array.from(source.text)
        .slice(source.start_char, source.end_char)
        .join(""),
    ).toBe(source.quote);
    expect(createHash("sha256").update(source.text).digest("hex")).toBe(
      source.source_hash,
    );
    sources.push(source);
  }
  const observations = [];
  for (const theme of ["light", "dark"]) {
    for (const width of [1440, 1280, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/conflicts");
      const group = page
        .locator(".conflict-record")
        .filter({ hasText: "As of 2026-10-10" });
      await expect(group).toHaveCount(1);
      const toggle = page.getByRole("button", {
        name: `Switch to ${theme} theme`,
      });
      if (await toggle.count()) await toggle.click();
      await expect(
        page.getByRole("button", {
          name: `Switch to ${theme === "dark" ? "light" : "dark"} theme`,
        }),
      ).toBeVisible();
      expect(await group.innerText()).not.toMatch(/[ÂÃ]/);
      const compare = group.getByRole("button", {
        name: "Compare policy evidence",
        exact: true,
      });
      await compare.click();
      await expect(group.locator(".conflict-evidence")).toHaveCount(2);
      for (const source of sources)
        await expect(
          group.locator("blockquote").filter({ hasText: source.quote }),
        ).toBeVisible();
      await group.getByText(/Recorded occurrences/).click();
      await expect(group.locator(".conflict-occurrences li")).toHaveCount(
        occurrences.length,
      );
      for (const occurrence of occurrences)
        await expect(
          group
            .locator(".conflict-occurrences code")
            .filter({ hasText: occurrence.query_id }),
        ).toBeVisible();
      await group.getByText(/Recorded occurrences/).click();
      await page.evaluate(async () => {
        await document.fonts.ready;
        window.scrollTo(0, 0);
      });
      const geometry = await page.evaluate(() => ({
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        height: document.documentElement.scrollHeight,
      }));
      expect(geometry.scrollWidth).toBeLessThanOrEqual(width);
      observations.push({
        theme,
        ...geometry,
        preservedOccurrences: occurrences.length,
        sourceHashesVerified: 2,
      });
      await page.screenshot({
        path: `${folder}/comparison/conflicts-${theme}-${width}.png`,
        fullPage: true,
      });
      await group.getByRole("link", { name: "Jump to source 2" }).click();
      await expect(group.locator(".conflict-evidence").nth(1)).toBeFocused();
      await group
        .getByRole("button", { name: "Return to list", exact: true })
        .click();
      await expect(compare).toBeFocused();
    }
  }
  writeFileSync(
    `${folder}/comparison/observations.json`,
    JSON.stringify(observations, null, 2),
  );
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Enter your workspace" }),
  ).toBeVisible();
});
