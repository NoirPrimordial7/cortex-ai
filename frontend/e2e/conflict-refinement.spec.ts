import { test, expect } from "@playwright/test";
import type { Answer, Citation } from "../src/types";
const first: Citation = {
  id: "a",
  document_id: "a-doc",
  version_id: "a-v",
  clause_id: "a-clause",
  title: "Remote work policy A",
  quote: "Employees may work remotely 2 days per week.",
  locator: "TXT line 12",
  start_char: 0,
  end_char: 43,
  source_hash: "a-hash",
  valid_from: "2026-01-01",
  valid_to: null,
  source_kind: "operations_policy",
  authority_rank: 100,
  reviewed_value: 2,
};
const second = {
  ...first,
  id: "b",
  document_id: "b-doc",
  version_id: "b-v",
  clause_id: "b-clause",
  title: "Remote work policy B",
  quote: "Employees may work remotely 3 days per week.",
  source_hash: "b-hash",
  reviewed_value: 3,
};
const records: Answer[] = Array.from({ length: 5 }, (_, i) => ({
  query_id: `q-${i}`,
  status: "abstained",
  reason_code: "UNRESOLVED_CONFLICT",
  mode: "evidence",
  as_of: "2026-10-10",
  scope: { population: "india_full_time", jurisdiction: "IN" },
  created_at: `2026-10-10T00:0${5 - i}:00Z`,
  answer:
    "Equally authoritative policies disagree. I cannot choose between them.",
  citations: [
    { ...first, id: `a-${i}` },
    { ...second, id: `b-${i}` },
  ],
}));
test("grouped history retains every occurrence and reauthorizes its own evidence", async ({
  page,
}) => {
  let denied = false;
  const reads: string[] = [];
  await page.route("**/api/v1/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/session"))
      return route.fulfill({
        json: {
          user: {
            id: "test",
            display_name: "Test",
            workspace: "NORTHSTAR",
            roles: [],
            actions: ["query.execute"],
          },
          csrf_token: "test",
          policy_revision: 1,
          knowledge_revision: 1,
        },
      });
    if (path.endsWith("/conflicts"))
      return route.fulfill({ json: { items: denied ? [] : records } });
    if (path.includes("/citations/")) {
      reads.push(path);
      const i = Number(path.split("/")[4].slice(2)),
        claim = path.includes("/b-")
          ? records[i].citations[1]
          : records[i].citations[0];
      return denied && path.includes("/b-")
        ? route.fulfill({
            status: 404,
            json: { error: { message: "Resource unavailable" } },
          })
        : route.fulfill({
            json: {
              ...claim,
              query_id: `q-${i}`,
              text: claim.quote,
              end_char: claim.quote.length,
            },
          });
    }
    return route.fulfill({ status: 404, json: {} });
  });
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/conflicts");
  await expect(page.locator(".conflict-record")).toHaveCount(1);
  await expect(page.getByText(/5 occurrences/)).toBeVisible();
  await page.getByText("Recorded occurrences (5)").click();
  for (const record of records) {
    await expect(
      page
        .locator(".conflict-occurrences time")
        .filter({ hasText: record.created_at! }),
    ).toBeVisible();
    await expect(
      page
        .locator(".conflict-occurrences code")
        .filter({ hasText: record.query_id }),
    ).toBeVisible();
  }
  await page
    .locator(".conflict-occurrences li")
    .last()
    .getByRole("button", { name: "Inspect this occurrence" })
    .click();
  await expect(page.locator(".conflict-evidence")).toHaveCount(2);
  expect(reads).toContain("/api/v1/queries/q-4/citations/a-4");
  expect(reads).toContain("/api/v1/queries/q-4/citations/b-4");
  await page.getByRole("link", { name: "Jump to source 2" }).click();
  await expect(page.locator(".conflict-evidence").nth(1)).toBeFocused();
  await page
    .getByRole("button", { name: "Return to list", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Compare policy evidence", exact: true }),
  ).toBeFocused();
  denied = true;
  await page
    .getByRole("button", { name: "Compare policy evidence", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Resource unavailable");
  await expect(page.locator(".conflict-evidence")).toHaveCount(0);
  await expect(page.locator(".conflict-record")).toHaveCount(0);
});
