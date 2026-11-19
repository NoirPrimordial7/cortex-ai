import { expect, test, type Page } from "@playwright/test";
test.skip(
  process.env.CORTEX_TEST_REAUDIT !== "1",
  "Requires the isolated writable demo on port 8009",
);
const question = "How many remote days per week?";
async function signIn(page: Page, profile: string) {
  await page.goto("/");
  await page.getByTestId("demo-profile-" + profile).click();
  await page.getByRole("button", { name: "Enter your workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Knowledge overview" }),
  ).toBeVisible();
}
async function ask(page: Page, prompt = question) {
  await page.goto("/assistant");
  await page.getByLabel("As of", { exact: true }).fill("2026-10-09");
  await page
    .getByRole("combobox", { name: "Ask about a company policy" })
    .fill(prompt);
  await page.getByRole("button", { name: "Ask Cortex", exact: true }).click();
}
async function confirm(page: Page) {
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Confirm", exact: true }),
  ).toHaveCount(0);
}
test("real conflict sends both sources, primary changes Cortex, undo restores and permits reselection", async ({
  browser,
}, info) => {
  const ec = await browser.newContext(),
    ac = await browser.newContext(),
    mc = await browser.newContext();
  const employee = await ec.newPage(),
    auditor = await ac.newPage(),
    admin = await mc.newPage();
  try {
    await signIn(admin, "ravi");
    await signIn(employee, "maya");
    await signIn(auditor, "isha");
    const session = await (
      await admin.request.get("/api/v1/auth/session")
    ).json();
    for (const did of ["OPS-REMOTE-A", "OPS-REMOTE-B"]) {
      const acl = await (
        await admin.request.get(`/api/v1/admin/documents/${did}/acl`)
      ).json();
      const r = await admin.request.put(`/api/v1/admin/documents/${did}/acl`, {
        headers: {
          Origin: "http://127.0.0.1:8009",
          "X-CSRF-Token": session.csrf_token,
        },
        data: {
          expected_policy_revision: acl.policy_revision,
          grants: [{ user_id: "ravi" }, { role_id: "employee" }],
        },
      });
      expect(r.status()).toBe(200);
      expect(
        (await auditor.request.get(`/api/v1/documents/${did}`)).status(),
      ).toBe(404);
    }
    await expect(
      employee.getByRole("link", { name: /re-audit tickets/i }),
    ).toHaveCount(0);
    await employee.goto("/tickets");
    await expect(employee).toHaveURL(/\/assistant$/);
    await ask(employee);
    const send = employee.getByRole("button", {
      name: "Send conflict for re-audit",
      exact: true,
    });
    await expect(send).toBeEnabled();
    await employee.screenshot({
      path: info.outputPath("employee-conflict-button.png"),
      fullPage: true,
    });
    await send.click();
    await expect(
      employee.getByRole("button", {
        name: "Already sent to Auditor",
        exact: true,
      }),
    ).toBeDisabled();
    await expect(
      employee.getByRole("heading", { name: "Raise policy conflict" }),
    ).toHaveCount(0);
    await auditor.goto("/tickets");
    await auditor
      .getByRole("button", { name: "Open conflict", exact: true })
      .first()
      .click();
    const select = auditor.getByRole("combobox", {
      name: "Primary policy",
      exact: true,
    });
    await expect(select.locator("option")).toHaveCount(3);
    await expect(
      auditor.getByRole("heading", { name: /Remote work policy A/ }),
    ).toBeVisible();
    await expect(
      auditor.getByRole("heading", { name: /Remote work policy B/ }),
    ).toBeVisible();
    const values = await select
      .locator("option")
      .evaluateAll((options) =>
        options.slice(1).map((o) => (o as HTMLOptionElement).value),
      );
    await auditor.screenshot({
      path: info.outputPath("auditor-both-policies.png"),
      fullPage: true,
    });
    await select.selectOption(values[0]);
    await auditor
      .getByLabel("Decision explanation")
      .fill("Use the first source for this exact policy conflict.");
    await auditor
      .getByRole("button", {
        name: "Review primary policy choice",
        exact: true,
      })
      .click();
    await confirm(auditor);
    await ask(employee);
    await expect(
      employee.getByRole("region", { name: "Auditor primary policy decision" }),
    ).toBeVisible();
    await expect(
      employee.getByText(
        "Use the first source for this exact policy conflict.",
        { exact: true },
      ),
    ).toBeVisible();
    await employee.screenshot({
      path: info.outputPath("employee-primary-answer.png"),
      fullPage: true,
    });
    await auditor
      .getByLabel("Undo reason")
      .fill(
        "Wrong selection; restore the conflict so another source can be chosen.",
      );
    await auditor
      .getByRole("button", { name: "Undo / Reopen conflict", exact: true })
      .click();
    await confirm(auditor);
    await expect(
      auditor.getByRole("combobox", { name: "Primary policy", exact: true }),
    ).toBeVisible();
    await ask(employee);
    await expect(
      employee.getByRole("heading", { name: "Compare the policy claims" }),
    ).toBeVisible();
    await expect(
      employee.getByRole("region", { name: "Auditor primary policy decision" }),
    ).toHaveCount(0);
    await auditor
      .getByRole("combobox", { name: "Primary policy", exact: true })
      .selectOption(values[1]);
    await auditor
      .getByLabel("Decision explanation")
      .fill("Choose the other source after reopening the review.");
    await auditor
      .getByRole("button", {
        name: "Review primary policy choice",
        exact: true,
      })
      .click();
    await confirm(auditor);
    await ask(employee);
    await expect(
      employee.getByText(
        "Choose the other source after reopening the review.",
        { exact: true },
      ),
    ).toBeVisible();
    await auditor
      .getByLabel("Undo reason")
      .fill("Reopen for final pending-state verification.");
    await auditor
      .getByRole("button", { name: "Undo / Reopen conflict", exact: true })
      .click();
    await confirm(auditor);
    await expect(auditor.getByText(/Undid primary:/)).toHaveCount(2);
    await auditor.screenshot({
      path: info.outputPath("auditor-undo-history.png"),
      fullPage: true,
    });
  } finally {
    await Promise.all([ec.close(), ac.close(), mc.close()]);
  }
});

for (const width of [320, 390, 768, 1280, 1440]) {
  test(`conflict flow reflows at ${width}px, both roles/themes with source and focus access`, async ({
    browser,
  }, info) => {
    const ec = await browser.newContext({ viewport: { width, height: 900 } }),
      ac = await browser.newContext({ viewport: { width, height: 900 } });
    const employee = await ec.newPage(),
      auditor = await ac.newPage();
    const errors: string[] = [];
    employee.on("pageerror", (e) => errors.push(e.message));
    auditor.on("pageerror", (e) => errors.push(e.message));
    try {
      await signIn(employee, "maya");
      await signIn(auditor, "isha");
      for (const theme of ["light", "dark"]) {
        await ask(employee);
        await expect(
          employee.getByRole("heading", { name: "Compare the policy claims" }),
        ).toBeVisible();
        let toggle = employee.getByRole("button", {
          name: `Switch to ${theme} theme`,
        });
        if (await toggle.count()) await toggle.click();
        expect(
          await employee.evaluate(() => document.documentElement.scrollWidth),
        ).toBeLessThanOrEqual(width + 1);
        await employee.screenshot({
          path: info.outputPath(`employee-${theme}-${width}.png`),
          fullPage: true,
        });
        await auditor.goto("/tickets");
        toggle = auditor.getByRole("button", {
          name: `Switch to ${theme} theme`,
        });
        if (await toggle.count()) await toggle.click();
        await auditor
          .getByRole("button", { name: "Open conflict", exact: true })
          .first()
          .click();
        const primary = auditor.getByRole("combobox", {
          name: "Primary policy",
          exact: true,
        });
        await expect(primary.locator("option")).toHaveCount(3);
        await primary.focus();
        await expect(primary).toBeFocused();
        expect(
          await auditor.evaluate(() => document.documentElement.scrollWidth),
        ).toBeLessThanOrEqual(width + 1);
        await auditor.screenshot({
          path: info.outputPath(`auditor-${theme}-${width}.png`),
          fullPage: true,
        });
        await auditor
          .getByRole("link", {
            name: "Open this exact source version",
            exact: true,
          })
          .first()
          .click();
        await expect(
          auditor.getByText("Verified", { exact: true }),
        ).toBeVisible();
        if (width === 320) {
          await employee
            .getByRole("button", {
              name: /View evidence: Remote work policy A/,
            })
            .click();
          await expect(
            employee.getByRole("dialog", {
              name: "Source evidence",
              exact: true,
            }),
          ).toBeVisible();
          await employee
            .getByRole("button", { name: "Back to answer", exact: true })
            .click();
          await expect(
            employee.getByRole("dialog", {
              name: "Source evidence",
              exact: true,
            }),
          ).toHaveCount(0);
        }
      }
      expect(errors).toEqual([]);
    } finally {
      await Promise.all([ec.close(), ac.close()]);
    }
  });
}
