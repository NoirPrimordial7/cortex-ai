import { test, expect } from "@playwright/test";

test("audit pagination retains every request and filters reset the page", async ({
  page,
}) => {
  const events = Array.from({ length: 25 }, (_, i) => ({
    created_at: `2026-10-10T10:${String(i).padStart(2, "0")}:00Z`,
    action: i % 2 ? "query.execute" : "source.read",
    outcome: i === 24 ? "denied" : "allowed",
    request_id: `request-${i}`,
  }));
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    return route.fulfill({
      json: path.endsWith("/auth/session")
        ? {
            user: {
              id: "audit-test",
              display_name: "Auditor",
              workspace: "TEST",
              roles: [{ id: "auditor", name: "Auditor" }],
              actions: ["audit.read"],
            },
            csrf_token: "fixture",
            policy_revision: 1,
            knowledge_revision: 1,
          }
        : { items: events },
    });
  });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/audit");
  await expect(page.locator(".journal-event")).toHaveCount(12);
  await expect(page.getByRole("status")).toHaveText("1–12 of 25 records");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("13–24 of 25 records");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.locator(".journal-event")).toHaveCount(1);
  await page.getByText("Request ID", { exact: true }).click();
  await expect(page.getByText("request-24", { exact: true })).toBeVisible();
  await page.getByLabel("Outcome", { exact: true }).selectOption("denied");
  await expect(page.getByRole("status")).toHaveText("1–1 of 1 records");
  await expect(
    page.getByRole("button", { name: "Next", exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel("Action", { exact: true })
    .selectOption("query.execute");
  await expect(
    page.getByRole("heading", { name: "No events to show" }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
});

test("history preserves all answers across pagination and status filtering without reading stored excerpts", async ({
  page,
}) => {
  const items = Array.from({ length: 13 }, (_, i) => ({
    query_id: `q-${i}`,
    status: i === 12 ? "abstained" : "answered",
    reason_code: null,
    mode: "evidence",
    as_of: "2026-10-10",
    scope: { population: "india_full_time", jurisdiction: "IN" },
    answer: `Saved answer ${i}`,
    citations: [],
  }));
  await page.route("**/api/v1/**", (route) =>
    route.fulfill({
      json: new URL(route.request().url()).pathname.endsWith("/auth/session")
        ? {
            user: {
              id: "history-test",
              display_name: "Reader",
              workspace: "TEST",
              roles: [{ id: "employee", name: "Employee" }],
              actions: ["query.execute"],
            },
            csrf_token: "fixture",
            policy_revision: 1,
            knowledge_revision: 1,
          }
        : { items },
    }),
  );
  await page.goto("/history");
  await expect(page.locator(".history-record")).toHaveCount(10);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.locator(".history-record")).toHaveCount(3);
  await page
    .locator("summary strong")
    .filter({ hasText: "Saved answer 12" })
    .click();
  await expect(page.locator(".history-expanded").last()).toBeVisible();
  await page.getByLabel("Answer status").selectOption("abstained");
  await expect(page.locator(".history-record")).toHaveCount(1);
  await expect(page.getByRole("status")).toHaveText("1–1 of 1 records");
  await page.getByLabel("Answer status").selectOption("all");
  await expect(page.locator(".history-record")).toHaveCount(10);
});

test("catalogue search and category selection preserve the permitted collection", async ({
  page,
}) => {
  const docs = [
    {
      id: "policy",
      title: "Annual leave policy",
      category: "policy",
      version_count: 3,
      latest_ingested_at: "2026-10-10",
    },
    {
      id: "project",
      title: "Project handbook",
      category: "project",
      version_count: 1,
      latest_ingested_at: "2026-10-09",
    },
  ];
  await page.route("**/api/v1/**", (route) =>
    route.fulfill({
      json: new URL(route.request().url()).pathname.endsWith("/auth/session")
        ? {
            user: {
              id: "reader",
              display_name: "Reader",
              workspace: "TEST",
              roles: [],
              actions: [],
            },
            csrf_token: "fixture",
            policy_revision: 1,
            knowledge_revision: 1,
          }
        : { items: docs },
    }),
  );
  await page.goto("/documents");
  await expect(page.locator(".catalogue-record")).toHaveCount(2);
  await page.getByLabel("Category", { exact: true }).selectOption("project");
  await expect(page.locator(".catalogue-record")).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: "Open Project handbook" }),
  ).toBeVisible();
  await page.getByLabel("Search documents").fill("missing");
  await expect(
    page.getByRole("heading", { name: "No matching documents" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator(".catalogue-record")).toHaveCount(2);
});
