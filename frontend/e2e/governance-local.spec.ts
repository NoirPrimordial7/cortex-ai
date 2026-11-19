import { expect, test, type Page } from "@playwright/test";

test.skip(
  process.env.CORTEX_TEST_GOVERNANCE !== "1",
  "Requires isolated local governance fixture on port 8008",
);

async function signIn(page: Page, role: string) {
  await page.goto("/");
  await page.getByTestId("demo-profile-" + role).click();
  await page.getByRole("button", { name: "Enter your workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Knowledge overview" }),
  ).toBeVisible();
}
async function confirm(page: Page) {
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Confirm", exact: true }),
  ).toHaveCount(0);
}

test("policy upload, independent review, headings, access and signed provenance", async ({
  browser,
}, info) => {
  const adminContext = await browser.newContext();
  const auditorContext = await browser.newContext();
  const employeeContext = await browser.newContext();
  const admin = await adminContext.newPage(),
    auditor = await auditorContext.newPage(),
    employee = await employeeContext.newPage();
  try {
    await signIn(admin, "ravi");
    await signIn(auditor, "isha");
    await signIn(employee, "maya");
    await expect(
      admin.getByRole("heading", { name: "My leave", exact: true }),
    ).toHaveCount(0);
    await expect(
      auditor.getByRole("heading", { name: "My leave", exact: true }),
    ).toHaveCount(0);
    const title = "Browser governance notice " + Date.now();
    await admin.goto("/upload");
    await admin.locator('input[type="file"]').setInputFiles({
      name: "notice.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(
        "Notice policy\nIndia full-time employees receive 90 calendar days of notice.\n",
      ),
    });
    await admin.getByLabel("Document title").fill(title);
    await admin
      .getByRole("button", { name: "Upload for review", exact: true })
      .click();
    await expect(
      admin.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    const documentUrl = admin.url();
    await admin.locator(".version-row").first().click();
    await expect(admin.getByText("Verified", { exact: true })).toBeVisible();
    await expect(admin.getByText("notice.txt", { exact: true })).toBeVisible();
    await admin
      .getByRole("button", { name: "Submit to Auditor", exact: true })
      .click();
    await confirm(admin);
    await auditor.goto("/policy-reviews");
    await auditor
      .locator(".collection-row")
      .filter({ hasText: title })
      .getByRole("link", { name: "Review policy" })
      .click();
    await auditor.locator(".version-row").first().click();
    await auditor.getByText("Reject this version", { exact: true }).click();
    await auditor
      .getByLabel("Rejection reason")
      .fill("Please correct the submission context before publication.");
    await auditor
      .getByRole("button", { name: "Review rejection", exact: true })
      .click();
    await confirm(auditor);
    await admin.goto(documentUrl);
    await admin
      .getByRole("button", { name: "Submit to Auditor", exact: true })
      .click();
    await confirm(admin);
    await auditor.goto(documentUrl);
    await auditor
      .getByRole("button", { name: "Review metadata", exact: true })
      .click();
    await auditor
      .getByLabel("New policy heading")
      .fill("Browser employment terms");
    await auditor
      .getByRole("button", { name: "Create heading", exact: true })
      .click();
    await confirm(auditor);
    await auditor
      .getByLabel("Policy heading", { exact: true })
      .selectOption({ label: "Browser employment terms" });
    await auditor
      .getByLabel("Policy topic", { exact: true })
      .selectOption("notice");
    await auditor.getByLabel("Reviewed numeric value").fill("90");
    await auditor
      .getByLabel("Published on", { exact: true })
      .fill("2026-01-01");
    await auditor
      .getByLabel("Effective from", { exact: true })
      .fill("2026-01-01");
    await auditor.getByLabel("Explicitly open-ended").check();
    await auditor
      .getByLabel("Review reason", { exact: true })
      .fill("Verified source text, numeric value and applicable scope.");
    await auditor
      .getByRole("checkbox", { name: /I verified that all sections/ })
      .check();
    await auditor
      .getByRole("button", { name: "Review policy decision", exact: true })
      .click();
    await confirm(auditor);
    await admin.goto(documentUrl);
    await admin.locator(".version-row").first().click();
    await admin
      .getByRole("link", { name: "Distribute approved policy", exact: true })
      .click();
    await admin
      .getByRole("checkbox", { name: "Arya Dhumal", exact: true })
      .check();
    await admin
      .getByRole("button", { name: "Review grant changes", exact: true })
      .click();
    await admin
      .getByRole("button", { name: "Confirm access changes", exact: true })
      .click();
    await employee.goto(documentUrl);
    await employee.locator(".version-row").first().click();
    await expect(employee.getByText("Verified", { exact: true })).toBeVisible();
    await expect(
      employee.getByText("Heading: Browser employment terms", { exact: true }),
    ).toBeVisible();
    await employee.screenshot({
      path: info.outputPath("employee-policy-provenance.png"),
      fullPage: true,
    });
  } finally {
    await adminContext.close();
    await auditorContext.close();
    await employeeContext.close();
  }
});

test("employee leave approval and approved cancellation restore the original balance", async ({
  browser,
}, info) => {
  const employeeContext = await browser.newContext(),
    auditorContext = await browser.newContext();
  const employee = await employeeContext.newPage(),
    auditor = await auditorContext.newPage();
  try {
    await signIn(employee, "maya");
    await signIn(auditor, "isha");
    await employee.goto("/leave");
    await expect(employee.getByText("17 days", { exact: true })).toBeVisible();
    await employee
      .getByLabel("Leave type", { exact: true })
      .selectOption({ label: "Annual leave" });
    await employee.getByLabel("Start date", { exact: true }).fill("2026-12-01");
    await employee.getByLabel("End date", { exact: true }).fill("2026-12-03");
    await employee
      .getByLabel("Reason", { exact: true })
      .fill("Browser verified family travel");
    await employee
      .getByRole("button", { name: "Review application", exact: true })
      .click();
    await confirm(employee);
    await expect(employee.getByText("17 days", { exact: true })).toBeVisible();
    await auditor.goto("/leave");
    await auditor
      .getByRole("button", { name: "Open application" })
      .first()
      .click();
    await auditor
      .getByLabel("Review comment", { exact: true })
      .fill("Dates and balance checked by independent Auditor");
    await auditor
      .getByRole("button", { name: "Review decision", exact: true })
      .click();
    await confirm(auditor);
    await employee.reload();
    await expect(employee.getByText("14 days", { exact: true })).toBeVisible();
    await employee
      .getByRole("button", { name: "Open application" })
      .first()
      .click();
    await employee
      .getByLabel("Withdrawal reason", { exact: true })
      .fill("Travel cancelled after approval");
    await employee
      .getByRole("button", { name: "Request cancellation", exact: true })
      .click();
    await confirm(employee);
    await expect(employee.getByText("14 days", { exact: true })).toBeVisible();
    await auditor.reload();
    await auditor
      .getByRole("button", { name: "Open application" })
      .first()
      .click();
    await auditor
      .getByLabel("Review comment", { exact: true })
      .fill("Cancellation checked and days can be restored");
    await auditor
      .getByRole("button", { name: "Review decision", exact: true })
      .click();
    await confirm(auditor);
    await employee.reload();
    await expect(employee.getByText("17 days", { exact: true })).toBeVisible();
    await employee.screenshot({
      path: info.outputPath("leave-cancelled-history.png"),
      fullPage: true,
    });
  } finally {
    await employeeContext.close();
    await auditorContext.close();
  }
});

test("conflict evidence, resolution and rollback notify the employee and preserve history", async ({
  browser,
}, info) => {
  const employeeContext = await browser.newContext(),
    auditorContext = await browser.newContext();
  const employee = await employeeContext.newPage(),
    auditor = await auditorContext.newPage();
  try {
    await signIn(employee, "maya");
    await signIn(auditor, "isha");
    await employee.goto("/tickets");
    await employee
      .getByRole("checkbox", { name: "Annual leave policy", exact: true })
      .check();
    const description =
      "Browser ticket " +
      Date.now() +
      ": clarify the effective dates of this leave policy.";
    await employee.getByLabel("Conflict or confusion").fill(description);
    await employee
      .getByRole("button", { name: "Review ticket submission", exact: true })
      .click();
    await confirm(employee);
    await employee
      .locator(".collection-row")
      .filter({ hasText: description })
      .getByRole("button", { name: "Open ticket", exact: true })
      .click();
    await employee.getByLabel("Evidence file").setInputFiles({
      name: "evidence.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Browser evidence for re-audit."),
    });
    await employee
      .getByRole("button", { name: "Review attachment", exact: true })
      .click();
    await confirm(employee);
    await auditor.goto("/tickets");
    await auditor
      .locator(".collection-row")
      .filter({ hasText: description })
      .getByRole("button", { name: "Open ticket", exact: true })
      .click();
    await expect(
      auditor.getByRole("link", { name: "evidence.txt", exact: true }),
    ).toBeVisible();
    await auditor
      .getByLabel("Resolution policy")
      .selectOption({ label: "Annual leave policy" });
    await auditor
      .getByLabel("Decision explanation")
      .fill("The 2026 policy governs the requested period and employee scope.");
    await auditor
      .getByRole("button", { name: "Review resolution", exact: true })
      .click();
    await confirm(auditor);
    await employee.reload();
    await employee
      .locator(".collection-row")
      .filter({ hasText: description })
      .getByRole("button", { name: "Open ticket", exact: true })
      .click();
    await expect(
      employee.getByText("Auditor resolution", { exact: true }),
    ).toBeVisible();
    await auditor
      .getByLabel("Rollback reason")
      .fill("Reopen to check the historical date stated in the ticket.");
    await auditor
      .getByRole("button", { name: "Review rollback", exact: true })
      .click();
    await confirm(auditor);
    await employee.reload();
    await expect(
      employee
        .getByText(
          "The Auditor rolled back your ticket resolution. It is pending review again.",
          { exact: true },
        )
        .first(),
    ).toBeVisible();
    await employee
      .locator(".collection-row")
      .filter({ hasText: description })
      .getByRole("button", { name: "Open ticket", exact: true })
      .click();
    await expect(employee.getByText("rollback", { exact: true })).toBeVisible();
    await expect(
      employee.getByText(
        "The 2026 policy governs the requested period and employee scope.",
        { exact: true },
      ),
    ).toBeVisible();
    await employee.screenshot({
      path: info.outputPath("ticket-rollback-history.png"),
      fullPage: true,
    });
  } finally {
    await employeeContext.close();
    await auditorContext.close();
  }
});

for (const width of [320, 390, 768, 1280, 1440]) {
  test(`new modules reflow and retain keyboard access at ${width}px in both themes`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await signIn(page, "isha");
    for (const theme of ["light", "dark"]) {
      for (const path of [
        "/leave",
        "/tickets",
        "/policy-reviews",
        "/documents/HR-LEAVE",
      ]) {
        await page.goto(path);
        const toggle = page.getByRole("button", {
          name: `Switch to ${theme} theme`,
        });
        if (await toggle.count()) await toggle.click();
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expect(
          page.getByText("Loading your workspace…", { exact: true }),
        ).toHaveCount(0);
        if (path.includes("/documents/")) {
          // The accepted mobile layout uses Source edition; it auto-opens a version.
          await expect(
            page.getByText("Verified", { exact: true }),
          ).toBeVisible();
        }
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBeLessThanOrEqual(width + 1);
        await page.screenshot({
          path: info.outputPath(`${path.split("/")[1]}-${theme}-${width}.png`),
          fullPage: true,
        });
      }
    }
    if (width === 320) {
      const opener = page.getByRole("button", {
        name: "Open navigation",
        exact: true,
      });
      await opener.focus();
      await page.keyboard.press("Enter");
      const dialog = page.getByRole("dialog", {
        name: "Workspace navigation",
        exact: true,
      });
      await expect(dialog).toBeVisible();
      await page.keyboard.press("Tab");
      expect(
        await dialog.evaluate((d) => d.contains(document.activeElement)),
      ).toBe(true);
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(opener).toBeFocused();
    }
    expect(errors).toEqual([]);
  });
}

for (const width of [320, 390, 768, 1280, 1440]) {
  test(`employee and admin forms reflow at ${width}px in both themes`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    for (const who of ["maya", "ravi"]) {
      await signIn(page, who);
      const paths =
        who === "maya"
          ? ["/leave", "/tickets", "/documents/HR-LEAVE"]
          : ["/leave", "/permissions", "/upload"];
      for (const theme of ["light", "dark"]) {
        for (const path of paths) {
          await page.goto(path);
          const toggle = page.getByRole("button", {
            name: `Switch to ${theme} theme`,
          });
          if (await toggle.count()) await toggle.click();
          await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
          await expect(
            page.getByText("Loading your workspace…", { exact: true }),
          ).toHaveCount(0);
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth),
          ).toBeLessThanOrEqual(width + 1);
          await page.screenshot({
            path: info.outputPath(
              `${who}-${path.split("/")[1]}-${theme}-${width}.png`,
            ),
            fullPage: true,
          });
        }
      }
      await page.getByRole("button", { name: "Sign out", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "Enter your workspace" }),
      ).toBeVisible();
    }
  });
}
