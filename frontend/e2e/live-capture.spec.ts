import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
const phase = process.env.CORTEX_CAPTURE_PHASE;
const widths = [320, 390, 768, 1024, 1280, 1440];
test.use({
  baseURL: process.env.CORTEX_AUDIT_URL || "http://127.0.0.1:8001",
  trace: "off",
  video: "off",
});
test.describe.configure({ mode: "serial" });
test.skip(!phase, "Explicitly enabled real-backend gallery; no API mocks.");
const observations: unknown[] = [];
async function capture(page: Page, role: string, name: string) {
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => document.fonts.ready);
    await expect(
      page.getByText("Loading your workspace…", { exact: true }),
    ).toHaveCount(0);
    const folder = `../outputs/product-audit/${phase}/${role}`;
    mkdirSync(folder, { recursive: true });
    await page.screenshot({
      path: `${folder}/${name}-${width}.png`,
      fullPage: true,
    });
    const measure = await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      internalScrollers: Array.from(document.querySelectorAll("*"))
        .filter(
          (e) =>
            getComputedStyle(e).overflowY === "auto" &&
            e.scrollHeight > e.clientHeight,
        )
        .map((e) => e.className),
    }));
    observations.push({ phase, role, name, ...measure });
    if (phase !== "before")
      expect(
        measure.scrollWidth,
        `${role}/${name}@${width}`,
      ).toBeLessThanOrEqual(width);
  }
}
async function signIn(page: Page, role: string) {
  await page.goto("/");
  await page
    .getByRole("button", {
      name: new RegExp(
        role === "orbit" ? "Orbit" : role[0].toUpperCase() + role.slice(1),
      ),
    })
    .click();
  await page
    .getByRole("button", { name: "Enter your workspace", exact: true })
    .click();
  if (role === "noor") {
    await expect(page.getByRole("alert")).toBeVisible();
    return;
  }
  await expect(
    page.getByRole("link", { name: "Skip to workspace" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}
for (const role of (
  process.env.CORTEX_CAPTURE_ROLES || "maya,ravi,isha,orbit,noor"
).split(",")) {
  test(`real ${role} routes: ${phase || "disabled"}`, async ({ page }) => {
    test.setTimeout(180000);
    await page.goto("/");
    await expect(page.getByRole("button", { name: /Maya/ })).toBeVisible();
    if (role === "maya") await capture(page, role, "login");
    await signIn(page, role);
    if (role === "noor") {
      await capture(page, role, "disabled-signin");
      return;
    }
    await capture(page, role, "overview");
    await page.goto("/documents");
    await expect(
      page.getByRole("heading", { name: "Document library", exact: true }),
    ).toBeVisible();
    const docs = await (await page.request.get("/api/v1/documents")).json();
    const doc =
      docs.items.find(
        (d: { title: string }) => d.title === "Annual leave policy",
      ) || docs.items[0];
    if (doc)
      await expect(
        page.getByRole("link", { name: new RegExp(doc.title) }).first(),
      ).toBeVisible();
    await capture(page, role, "library");
    if (doc) {
      await page.goto("/documents/" + doc.id);
      await expect(
        page.getByRole("heading", { name: doc.title, exact: true }),
      ).toBeVisible();
      const versions = await (
        await page.request.get("/api/v1/documents/" + doc.id)
      ).json();
      const v =
        versions.versions.find(
          (x: { version_label: string }) => x.version_label === "LEAVE-2026",
        ) || versions.versions[0];
      if (v)
        await page
          .getByRole("button", { name: new RegExp(v.version_label) })
          .click();
      await expect(page.locator("pre").first()).toBeVisible();
      await capture(page, role, "document");
      if (role === "ravi") {
        await page
          .getByRole("button", { name: "Review metadata", exact: true })
          .click();
        await expect(
          page.getByText("Review and approve this version", { exact: true }),
        ).toBeVisible();
        await capture(page, role, "review");
      }
    }
    if (role === "ravi") {
      await page.goto("/upload");
      await expect(
        page.getByRole("heading", { name: "Upload a document", exact: true }),
      ).toBeVisible();
      await capture(page, role, "upload");
      await page.goto("/permissions");
      await expect(
        page.getByRole("heading", {
          name: "Permissions & people",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByText("Maya Shah", { exact: true }).first(),
      ).toBeVisible();
      await capture(page, role, "people");
      const accessTab = page.getByRole("button", {
        name: "Document access",
        exact: true,
      });
      if (await accessTab.count()) await accessTab.click();
      await page.getByLabel("Readable document").selectOption(doc.id);
      await expect(
        page.getByRole("button", {
          name: /Save document grants|Review grant changes/,
        }),
      ).toBeVisible();
      await capture(page, role, "grants");
    }
    if (role === "isha") {
      await page.goto("/audit");
      await expect(
        page.getByRole("heading", { name: "Audit activity", exact: true }),
      ).toBeVisible();
      await capture(page, role, "audit");
    }
    if (role === "maya" || role === "ravi" || role === "orbit") {
      await page.goto("/assistant");
      await expect(
        page.getByRole("button", {
          name: "How many annual leave days do I have?",
          exact: true,
        }),
      ).toBeVisible();
      await capture(page, role, "ask-empty");
      await page
        .getByRole("button", {
          name: "How many annual leave days do I have?",
          exact: true,
        })
        .click();
      await expect(page.locator(".question-bubble")).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Ask Cortex", exact: true }),
      ).toBeDisabled();
      await expect(
        page.getByText(/Checking policy|Checking source/),
      ).toHaveCount(0);
      await capture(page, role, "ask-answer");
      const cite = page.getByRole("button", { name: /View evidence:/ }).first();
      if (await cite.count()) {
        for (const width of [320, 390, 768]) {
          await page.setViewportSize({ width, height: 900 });
          await cite.click();
          await expect(
            page.getByRole("button", { name: "Back to answer", exact: true }),
          ).toBeVisible();
          await expect(
            page.getByText("Checking source access…", { exact: true }),
          ).toHaveCount(0);
          await page.screenshot({
            path: `../outputs/product-audit/${phase}/${role}/evidence-${width}.png`,
            fullPage: true,
          });
          await page
            .getByRole("button", { name: "Back to answer", exact: true })
            .click();
        }
      }
      await page
        .getByLabel("Ask about a company policy", { exact: true })
        .fill("How many remote days per week?");
      await page
        .getByRole("button", { name: "Ask Cortex", exact: true })
        .click();
      await expect(page.locator(".question-bubble")).toHaveText(
        "How many remote days per week?",
      );
      await expect(
        page.getByText(/Checking policy|Checking source/),
      ).toHaveCount(0);
      await capture(page, role, "ask-conflict");
      await page.goto("/history");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(
        page.getByText("Loading your workspace…", { exact: true }),
      ).toHaveCount(0);
      await capture(page, role, "activity");
      await page.goto("/conflicts");
      await expect(
        page.getByRole("heading", {
          name: "Conflicts & validity",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByText("Loading your workspace…", { exact: true }),
      ).toHaveCount(0);
      await capture(page, role, "conflicts");
    }
  });
}
test.afterAll(() => {
  const folder = `../outputs/product-audit/${phase}`;
  mkdirSync(folder, { recursive: true });
  writeFileSync(
    folder + "/observations.json",
    JSON.stringify(observations, null, 2),
  );
});
