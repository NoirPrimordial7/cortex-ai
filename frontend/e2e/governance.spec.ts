import { test, expect, type Page } from "@playwright/test";
const person = {
  id: "maya",
  display_name: "Maya Shah",
  email_normalized: "maya@example.test",
  active: true,
  role_ids: ["employee"],
};
async function admin(page: Page, readOnly = false) {
  const writes: { method: string; body: unknown }[] = [];
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (["PATCH", "PUT", "POST"].includes(route.request().method())) {
      writes.push({
        method: route.request().method(),
        body: route.request().postDataJSON(),
      });
      return route.fulfill({ json: {} });
    }
    const data = path.endsWith("/auth/session")
      ? {
          user: {
            id: "ravi",
            display_name: "Ravi Mehta",
            workspace: "NORTHSTAR",
            roles: [{ id: "admin", name: "Admin" }],
            actions: [
              "query.execute",
              "document.upload",
              "document.review",
              "acl.manage",
              "user.manage",
              "audit.read",
            ],
            read_only_demo: readOnly,
          },
          csrf_token: "test",
          policy_revision: 7,
          knowledge_revision: 1,
        }
      : path.endsWith("/admin/users")
        ? {
            items: [person],
            roles: [
              { id: "employee", name: "Employee" },
              { id: "admin", name: "Admin" },
            ],
            policy_revision: 7,
          }
        : path.endsWith("/acl")
          ? { grants: [{ role_id: "employee" }], policy_revision: 7 }
          : {
              items: [
                {
                  id: "doc",
                  title: "Leave policy",
                  category: "policy",
                  version_count: 1,
                  latest_ingested_at: "2026-10-09",
                },
              ],
            };
    return route.fulfill({ json: data });
  });
  return writes;
}
for (const width of [320, 390, 768, 1024, 1280, 1440])
  test(`access editor review and cancel at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const writes = await admin(page);
    await page.goto("/permissions");
    await page.getByRole("button", { name: "Edit Maya Shah" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.getByLabel("Account is active").uncheck();
    await page.getByRole("button", { name: "Review account changes" }).click();
    await expect(page.getByRole("dialog")).toHaveText(/Active → Disabled/);
    expect(writes).toHaveLength(0);
    await page.getByRole("button", { name: "Cancel changes" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page
      .getByRole("button", { name: "Document access", exact: true })
      .click();
    await page.getByLabel("Readable document").selectOption("doc");
    await page.getByLabel("Employee", { exact: true }).uncheck();
    await page.getByRole("button", { name: "Review grant changes" }).click();
    await expect(page.getByRole("dialog")).toHaveText(/Access removedEmployee/);
    await page.keyboard.press("Escape");
    expect(writes).toHaveLength(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  });
test("shared demo shows view-only permissions and disallows uploads", async ({
  page,
}) => {
  await admin(page, true);
  await page.goto("/permissions");
  await page.getByRole("button", { name: "View roles for Maya Shah" }).click();
  await expect(page.getByLabel("Account is active")).toBeDisabled();
  await page.keyboard.press("Escape");
  await page.goto("/upload");
  await expect(page.getByLabel("Source file")).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Upload for review" }),
  ).toBeDisabled();
});
test("upload rejects unsupported files and displays the selected valid source", async ({
  page,
}) => {
  await admin(page);
  await page.goto("/upload");
  await page
    .getByLabel("Source file")
    .setInputFiles({
      name: "unsafe.exe",
      mimeType: "application/octet-stream",
      buffer: Buffer.from("fixture"),
    });
  await expect(page.getByText("Choose a TXT, PDF or DOCX file.")).toBeVisible();
  await page
    .getByLabel("Source file")
    .setInputFiles({
      name: "policy.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Policy\nFictional fixture."),
    });
  await expect(page.getByText("policy.txt", { exact: true })).toBeVisible();
  expect(
    await page
      .getByLabel("Source file")
      .evaluate((el: HTMLInputElement) => el.validity.valid),
  ).toBe(true);
});
