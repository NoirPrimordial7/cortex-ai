import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
const phase = process.env.CORTEX_CAPTURE_PHASE;
const theme = process.env.CORTEX_CAPTURE_THEME || "light";
const capturePhase = phase + (theme === "dark" ? "-dark" : "");
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
    const folder = `../outputs/product-audit/${capturePhase}/${role}`;
    mkdirSync(folder, { recursive: true });
    // Bottom-sticky composer stays in its natural end position for full-page
    // answer captures, so the screenshot records all citations while scrolled.
    if (phase !== "before" && name.startsWith("ask-") && name !== "ask-empty")
      await page.evaluate(() =>
        window.scrollTo(0, document.documentElement.scrollHeight),
      );
    await page.screenshot({
      path: `${folder}/${name}-${width}.png`,
      fullPage: (await page.getByRole("dialog").count()) === 0,
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
      smallTargets: Array.from(
        document.querySelectorAll("a,button,input,select,textarea,summary"),
      )
        .map((e) =>
          e instanceof HTMLInputElement && ["checkbox", "file"].includes(e.type)
            ? e.closest("label") || e
            : e,
        )
        .filter((e) => {
          const r = e.getBoundingClientRect();
          return (
            r.width > 0 &&
            r.height > 0 &&
            r.x >= 0 &&
            r.y >= 0 &&
            r.y < innerHeight &&
            getComputedStyle(e).visibility !== "hidden" &&
            getComputedStyle(e).clipPath === "none"
          );
        })
        .filter((e) => {
          const r = e.getBoundingClientRect();
          return r.height < 43.9 || r.width < 43.9;
        })
        .map((e) => ({
          element: e.tagName,
          className: e.className,
          label:
            e.getAttribute("aria-label") || e.textContent?.trim().slice(0, 70),
          width: e.getBoundingClientRect().width,
          height: e.getBoundingClientRect().height,
        })),
    }));
    observations.push({ phase, theme, role, name, ...measure });
    if (phase !== "before")
      expect(
        measure.scrollWidth,
        `${role}/${name}@${width}`,
      ).toBeLessThanOrEqual(width);
    if (phase !== "before")
      expect(
        measure.smallTargets,
        `${role}/${name}@${width} touch targets`,
      ).toEqual([]);
  }
}
async function signIn(page: Page, role: string) {
  await page.goto("/");
  if (phase === "before")
    await page
      .getByRole("button", {
        name: new RegExp(
          role === "orbit" ? "Orbit" : role[0].toUpperCase() + role.slice(1),
        ),
      })
      .click();
  else await page.getByTestId("demo-profile-" + role).click();
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
    await expect(
      phase === "before"
        ? page.getByRole("button", { name: /Maya/ })
        : page.getByTestId("demo-profile-maya"),
    ).toBeVisible();
    if (theme === "dark")
      await page.getByRole("button", { name: "Switch to dark theme" }).click();
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
      if (v && phase !== "before")
        await page.getByText(/^Version history ·/).click();
      if (v)
        await page
          .getByRole("button", { name: new RegExp(v.version_label) })
          .click();
      await expect(page.locator("pre").first()).toBeVisible();
      if (v && phase !== "before")
        await page.getByText(/^Version history ·/).click();
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
        page
          .getByText(phase === "before" ? "Maya Shah" : "Arya Dhumal", {
            exact: true,
          })
          .first(),
      ).toBeVisible();
      await capture(page, role, "people");
      if (phase !== "before") {
        await page
          .getByRole("button", { name: "Edit Arya Dhumal", exact: true })
          .click();
        await capture(page, role, "person-edit");
        await page.getByLabel("Account is active").uncheck();
        await page
          .getByRole("button", { name: "Review account changes", exact: true })
          .click();
        await capture(page, role, "access-change-review");
        await page
          .getByRole("button", { name: "Cancel changes", exact: true })
          .click();
      }
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
        for (const width of phase === "before"
          ? [320, 390, 768]
          : [320, 390, 768, 1024]) {
          await page.setViewportSize({ width, height: 900 });
          await cite.click();
          await expect(
            page.getByRole("button", { name: "Back to answer", exact: true }),
          ).toBeVisible();
          await expect(
            page.getByText("Checking source access…", { exact: true }),
          ).toHaveCount(0);
          await page.screenshot({
            path: `../outputs/product-audit/${capturePhase}/${role}/evidence-${width}.png`,
            fullPage: false,
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
      if (phase !== "before") {
        const comparison = page
          .getByRole("button", { name: "Compare policy evidence", exact: true })
          .first();
        if (await comparison.count()) {
          await comparison.click();
          await expect(
            page.locator(".conflict-evidence").first(),
          ).toBeVisible();
          await capture(page, role, "conflict-comparison");
        }
      }
    }
  });
}
test.afterAll(() => {
  const folder = `../outputs/product-audit/${capturePhase}`;
  mkdirSync(folder, { recursive: true });
  writeFileSync(
    folder + "/observations.json",
    JSON.stringify(observations, null, 2),
  );
});
