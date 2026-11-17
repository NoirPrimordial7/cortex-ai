import { expect, test, type Page } from "@playwright/test";

test.skip(
  process.env.CORTEX_TEST_LOCAL_SEARCH !== "1",
  "Requires the isolated fictional local demo with MiniLM enabled",
);

async function signIn(page: Page, profile: string) {
  await page.goto("/");
  expect(["127.0.0.1", "localhost"]).toContain(new URL(page.url()).hostname);
  await page.getByTestId(`demo-profile-${profile}`).click();
  await page.getByRole("button", { name: "Enter your workspace" }).click();
  await expect(
    page.getByRole("heading", { name: "Knowledge overview" }),
  ).toBeVisible();
  await page.goto("/assistant");
  await expect(page.getByLabel("As of", { exact: true })).toBeVisible();
  await page.getByLabel("As of", { exact: true }).fill("2026-10-09");
}

async function ask(page: Page, question: string) {
  await page
    .getByRole("combobox", { name: "Ask about a company policy" })
    .fill(question);
  await page.getByRole("button", { name: "Ask Cortex", exact: true }).click();
}

for (const width of [320, 390, 768, 1280, 1440]) {
  test(`live search and autocomplete at ${width}px in both themes`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await signIn(page, "ravi");
    for (const theme of ["light", "dark"]) {
      const toggle = page.getByRole("button", {
        name: `Switch to ${theme} theme`,
      });
      if (await toggle.count()) await toggle.click();
      await expect(page.locator("html")).toHaveCSS("color-scheme", theme);
      const composer = page.getByRole("combobox", {
        name: "Ask about a company policy",
      });
      await composer.fill("arya");
      const option = page.getByRole("option", {
        name: "How many leave days does Arya Dhumal have?",
      });
      await expect(option).toBeVisible();
      await composer.press("ArrowDown");
      await expect(option).toHaveAttribute("aria-selected", "true");
      await composer.press("Enter");
      await expect(composer).toBeFocused();
      await expect(composer).toHaveValue(
        "How many leave days does Arya Dhumal have?",
      );
      await page
        .getByRole("button", { name: "Ask Cortex", exact: true })
        .click();
      const ledger = page.getByRole("region", {
        name: "Personal leave ledger",
      });
      await expect(ledger.getByText("17 days", { exact: true })).toBeVisible();
      await page.screenshot({
        path: info.outputPath(`ledger-${width}-${theme}.png`),
      });
      await ask(page, "Show everything relevant to leave");
      const related = page.getByRole("region", {
        name: "Related policy passages",
      });
      for (const title of [
        "Annual leave policy",
        "Sick leave policy",
        "Maternity leave policy",
        "Leave carry-forward policy",
      ]) {
        await expect(
          related.getByRole("link", { name: title, exact: true }),
        ).toBeVisible();
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      await page.screenshot({
        path: info.outputPath(`search-${width}-${theme}.png`),
      });
    }
  });
}

test("real employee session supports semantic paraphrase, scoped follow-ups and citations", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await signIn(page, "maya");
  await ask(page, "I am unwell and need some time away");
  await expect(
    page.getByRole("link", { name: "Sick leave policy", exact: true }),
  ).toBeVisible();
  await ask(page, "What is the annual leave entitlement?");
  const citation = page.getByRole("button", {
    name: "View evidence: Annual leave policy",
  });
  await expect(citation).toBeVisible();
  await citation.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("dialog").getByText(/20 working days of annual leave/),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(citation).toBeFocused();
  await ask(page, "What about contractors?");
  await expect(
    page.getByText("Uses context from your previous question."),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /8 working days per year/ }),
  ).toBeVisible();
  await ask(page, "Does that apply to HR too?");
  await expect(
    page.getByText("More context needed", { exact: true }),
  ).toBeVisible();
  await ask(page, "How many leave days does Aditya Gholar have?");
  await expect(
    page.getByRole("heading", { name: "I can’t find information for that." }),
  ).toBeVisible();
});
