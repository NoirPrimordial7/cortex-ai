import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { readingPages, sourceSlice } from "../src/sourceText";
test.skip(
  !process.env.CORTEX_READER,
  "Opt-in disposable enterprise corpus browser verification.",
);
test.use({ baseURL: "http://127.0.0.1:8008", trace: "off", video: "off" });
const output = "../docs/design/premium-refinement/reader";
async function signIn(page: Page, key = "ravi") {
  await page.goto("/");
  await page.getByTestId(`demo-profile-${key}`).click();
  await page
    .getByRole("button", { name: "Enter your workspace", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Skip to workspace" }),
  ).toBeVisible();
}
async function capture(page: Page, path: string) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    (document.activeElement as HTMLElement)?.blur();
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `${output}/${path}.png`,
    fullPage: !(await page.locator("dialog[open]").count()),
  });
}
test("real corpus full documents, focused evidence, comparison and originals in both themes", async ({
  page,
}) => {
  test.setTimeout(180000);
  mkdirSync(output, { recursive: true });
  await signIn(page);
  const session = await (await page.request.get("/api/v1/auth/session")).json();
  // Five distinct historical events are created only in this disposable database.
  const queryIds: string[] = [];
  for (let i = 0; i < 5; i++) {
    const result = await page.request.post("/api/v1/queries", {
      headers: {
        "X-CSRF-Token": session.csrf_token,
        Origin: "http://127.0.0.1:8008",
      },
      data: {
        query: "How many remote days per week?",
        as_of: "2026-10-10",
        population: "india_full_time",
        jurisdiction: "IN",
      },
    });
    expect(result.status()).toBe(200);
    queryIds.push((await result.json()).query_id);
  }
  const observations: unknown[] = [];
  for (const theme of ["light", "dark"]) {
    await page.evaluate(
      (t) => localStorage.setItem("cortex:theme:v1", t),
      theme,
    );
    for (const width of [1440, 1280, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/documents/ENT-LEAVE");
      await expect(page.locator(".reader-body")).toBeVisible();
      const source = await (
        await page.request.get("/api/v1/versions/ENT-LEAVE-2026/content")
      ).json();
      const pages = readingPages(source.text);
      expect(pages.length).toBeGreaterThan(2);
      await expect(
        page.getByLabel("Reading page", { exact: true }),
      ).toHaveValue("0");
      await expect(page.locator(".reader-body")).toHaveText(
        pages[0].map((b) => b.text).join(""),
      );
      await capture(page, `${theme}-document-${width}`);
      await page
        .getByRole("button", { name: "Next page", exact: true })
        .click();
      await expect(page.locator(".reader-paper")).toBeFocused();
      await expect(page.locator(".reader-body")).toHaveText(
        pages[1].map((b) => b.text).join(""),
      );
      await page
        .getByRole("button", { name: "Read full screen", exact: true })
        .click();
      await expect(
        page.getByRole("dialog", { name: "Complete authorized document" }),
      ).toBeVisible();
      await capture(page, `${theme}-fullscreen-${width}`);
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("button", { name: "Read full screen", exact: true }),
      ).toBeFocused();
      await page.goto("/assistant");
      await page
        .getByRole("button", {
          name: "How many annual leave days do I have?",
          exact: true,
        })
        .click();
      await expect(
        page.getByRole("heading", {
          name: /The approved annual leave entitlement is 20/,
        }),
      ).toBeVisible();
      const cite = page.getByRole("button", {
        name: "View evidence: Annual Leave and Absence Standard",
        exact: true,
      });
      await expect(cite).toBeVisible();
      await cite.click();
      const marked = page.locator(".focused-passage mark");
      await expect(marked).toHaveText(
        "2.1 India full-time employees receive 20 working days of annual leave per year.",
      );
      await capture(page, `${theme}-evidence-${width}`);
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
      const highlighted = dialog.locator('mark[data-highlight="evidence"]');
      await expect(highlighted).toHaveText(
        "2.1 India full-time employees receive 20 working days of annual leave per year.",
      );
      await dialog
        .getByRole("button", { name: "Supporting passage", exact: true })
        .click();
      await expect(highlighted).toBeFocused();
      await capture(page, `${theme}-full-evidence-${width}`);
      await dialog
        .getByRole("button", { name: "Back to answer", exact: true })
        .click();
      await expect(page.locator("dialog[open]")).toHaveCount(0);
      await expect(cite).toBeFocused();
      await page.goto("/conflicts");
      await expect(page.locator(".conflict-record")).toHaveCount(1);
      await page
        .getByRole("button", { name: "Compare policy evidence", exact: true })
        .click();
      await expect(page.locator(".conflict-evidence")).toHaveCount(4);
      await capture(page, `${theme}-conflicts-${width}`);
      observations.push({
        theme,
        width,
        conflictHeight: await page.evaluate(
          () => document.documentElement.scrollHeight,
        ),
        occurrences: queryIds.length,
        readingPages: pages.length,
      });
      await page.getByText(/Recorded occurrences/).click();
      for (const id of queryIds)
        await expect(
          page.locator(".conflict-occurrences code").filter({ hasText: id }),
        ).toBeVisible();
      await page
        .locator(".conflict-occurrences li")
        .last()
        .getByRole("button", { name: "Inspect this occurrence" })
        .click();
      await expect(page.locator(".conflict-evidence")).toHaveCount(4);
      await page.goto("/documents/ENT-LEGAL");
      await expect(
        page.getByRole("button", {
          name: "View original PDF pages",
          exact: true,
        }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "View original PDF pages", exact: true })
        .click();
      await expect(page.locator(".original-pdf img")).toBeVisible();
      await expect
        .poll(() =>
          page
            .locator(".original-pdf img")
            .evaluate((img: HTMLImageElement) => img.naturalWidth),
        )
        .toBeGreaterThan(0);
      await capture(page, `${theme}-original-pdf-${width}`);
      await page
        .getByRole("button", { name: "Next original page", exact: true })
        .click();
      await expect(page.getByAltText("Original PDF page 2")).toBeVisible();
    }
  }
  writeFileSync(
    `${output}/observations.json`,
    JSON.stringify(observations, null, 2),
  );
});
test("authorized full text retains every reading page and both immutable editions", async ({
  page,
}) => {
  await signIn(page);
  await page.goto("/documents/ENT-LEAVE");
  for (const vid of ["ENT-LEAVE-2026", "ENT-LEAVE-2025"]) {
    const source = await (
      await page.request.get(`/api/v1/versions/${vid}/content`)
    ).json();
    if (vid.endsWith("2025"))
      await page.getByRole("button", { name: /LEAVE-2025/ }).click();
    await expect(page.locator(".reader-body")).toBeVisible();
    const pages = readingPages(source.text),
      read: string[] = [];
    for (let i = 0; i < pages.length; i++) {
      await page
        .getByLabel("Reading page", { exact: true })
        .selectOption(String(i));
      await expect(page.locator(".reader-body")).toHaveText(
        pages[i].map((b) => b.text).join(""),
      );
      read.push((await page.locator(".reader-body").textContent()) || "");
    }
    expect(read.join("")).toBe(source.text);
    expect(sourceSlice(source.text, 0)).toBe(source.text);
  }
});
test("employee cannot reveal restricted titles, original pages or downloads", async ({
  page,
}) => {
  await signIn(page, "maya");
  await page.goto("/documents");
  await expect(
    page.getByRole("link", { name: /Information Handling/ }),
  ).toHaveCount(0);
  for (const path of [
    "/documents/ENT-LEGAL",
    "/versions/ENT-LEGAL-2.2/content",
    "/versions/ENT-LEGAL-2.2/download",
    "/versions/ENT-LEGAL-2.2/pages/1",
  ]) {
    const response = await page.request.get(`/api/v1${path}`);
    expect(response.status()).toBe(404);
    expect(await response.text()).not.toContain("Confidentiality");
  }
});
test("real ACL revocation clears an open full reader and its answer", async ({
  page,
  browser,
}) => {
  await signIn(page, "maya");
  await page.goto("/assistant");
  await page
    .getByRole("button", {
      name: "How many annual leave days do I have?",
      exact: true,
    })
    .click();
  const citation = page.getByRole("button", {
    name: "View evidence: Annual Leave and Absence Standard",
    exact: true,
  });
  await citation.click();
  await page
    .getByRole("button", { name: "View source context", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Read complete document", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Complete authorized document" }),
  ).toBeVisible();
  const context = await browser.newContext({
      baseURL: "http://127.0.0.1:8008",
    }),
    admin = await context.newPage();
  await signIn(admin);
  const session = await (
    await admin.request.get("/api/v1/auth/session")
  ).json();
  const acl = await (
    await admin.request.get("/api/v1/admin/documents/ENT-LEAVE/acl")
  ).json();
  const revoke = await admin.request.put(
    "/api/v1/admin/documents/ENT-LEAVE/acl",
    {
      headers: {
        Origin: "http://127.0.0.1:8008",
        "X-CSRF-Token": session.csrf_token,
      },
      data: {
        expected_policy_revision: acl.policy_revision,
        grants: [{ user_id: "ravi" }],
      },
    },
  );
  expect(revoke.status()).toBe(200);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await expect(page.locator(".focused-passage")).toHaveCount(0);
  await expect(citation).toHaveCount(0);
  expect(
    (
      await page.request.get("/api/v1/versions/ENT-LEAVE-2026/content")
    ).status(),
  ).toBe(404);
  expect(
    (
      await page.request.get("/api/v1/versions/ENT-LEAVE-2026/download")
    ).status(),
  ).toBe(404);
  // Restore the disposable corpus after proving revocation; production is never touched.
  const current = await (
    await admin.request.get("/api/v1/admin/documents/ENT-LEAVE/acl")
  ).json();
  expect(
    (
      await admin.request.put("/api/v1/admin/documents/ENT-LEAVE/acl", {
        headers: {
          Origin: "http://127.0.0.1:8008",
          "X-CSRF-Token": session.csrf_token,
        },
        data: {
          expected_policy_revision: current.policy_revision,
          grants: [{ user_id: "ravi" }, { role_id: "employee" }],
        },
      })
    ).status(),
  ).toBe(200);
  await context.close();
});
