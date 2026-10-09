import { test, expect } from "@playwright/test";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";

test.use({
  baseURL: process.env.CORTEX_WORKFLOW_URL || "http://127.0.0.1:8004",
  trace: "off",
  video: "off",
});
test.skip(
  !process.env.CORTEX_LIVE_WORKFLOW,
  "Explicit isolated disposable backend workflow.",
);

test("real private upload, review, download integrity and denied employee read", async ({
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
  await page.goto("/upload");
  const title = "Audit workflow private policy";
  const passage =
    "India full-time employees receive 22 working days of annual leave per year.\n";
  await page.getByLabel("Source file").setInputFiles({
    name: "audit-workflow.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(passage),
  });
  await page.getByLabel("Document title").fill(title);
  await page
    .getByRole("button", { name: "Upload for review", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
  await expect(page.locator("pre.source-text")).toHaveText(passage);
  const documentPath = new URL(page.url()).pathname;
  await page
    .getByRole("button", { name: "Review metadata", exact: true })
    .click();
  await page.getByLabel("Reviewed numeric value").fill("22");
  await page.getByLabel("Published on").fill("2026-10-10");
  await page.getByLabel("Effective from").fill("2028-01-01");
  await page.getByLabel("Effective until (exclusive)").fill("2029-01-01");
  await page
    .getByLabel("Review reason")
    .fill("Disposable audit workflow verification of future policy.");
  await page.getByLabel("I verified that all sections share").check();
  await page
    .getByRole("button", { name: "Approve and publish", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".document-validity")).toContainText(
    "Future effective",
  );
  await expect(page.locator("pre.source-text")).toHaveText(passage);
  const detail = await (
    await page.request.get("/api/v1" + documentPath)
  ).json();
  const version = detail.versions[0];
  expect(version.approval_state).toBe("approved");
  expect(version.valid_to).toBe("2029-01-01");
  const source = await (
    await page.request.get(`/api/v1/versions/${version.id}/content`)
  ).json();
  expect(createHash("sha256").update(source.text).digest("hex")).toBe(
    source.source_hash,
  );
  const download = await page.request.get(
    `/api/v1/versions/${version.id}/download`,
  );
  expect(download.status()).toBe(200);
  expect((await download.body()).toString()).toBe(passage);
  mkdirSync("../outputs/product-audit/workflow", { recursive: true });
  await page.screenshot({
    path: "../outputs/product-audit/workflow/approved-future-policy-390.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.getByTestId("demo-profile-maya").click();
  await page
    .getByRole("button", { name: "Enter your workspace", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Skip to workspace" }),
  ).toBeVisible();
  expect((await page.request.get("/api/v1" + documentPath)).status()).toBe(404);
  await page.goto(documentPath);
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByText(title, { exact: true })).toHaveCount(0);
  await expect(page.locator("pre.source-text")).toHaveCount(0);
  await page.screenshot({
    path: "../outputs/product-audit/workflow/denied-private-policy-390.png",
    fullPage: true,
  });
  writeFileSync(
    "../outputs/product-audit/workflow/result.json",
    JSON.stringify(
      {
        upload: "passed",
        review: "passed",
        futureValidity: "passed",
        immutableHash: "passed",
        authorizedDownload: "passed",
        privateEmployeeDenial: "passed",
        backend: "isolated disposable fixture; no production writes",
      },
      null,
      2,
    ),
  );
});
