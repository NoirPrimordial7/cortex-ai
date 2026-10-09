import { test, expect } from "@playwright/test";
test.use({ trace: "off", video: "off" });
test.skip(
  !process.env.CORTEX_LIVE_LOGIN,
  "Explicit real-backend sign-in verification.",
);
for (const profile of ["maya", "ravi", "isha", "orbit", "noor"])
  test(`actual preview sign-in ${profile}`, async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("demo-profile-" + profile).click();
    await page
      .getByRole("button", { name: "Enter your workspace", exact: true })
      .click();
    if (profile === "noor") {
      await expect(page.getByRole("alert")).toHaveText(
        "Invalid sign-in details",
      );
      return;
    }
    await expect(
      page.getByRole("link", { name: "Skip to workspace" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Enter your workspace" }),
    ).toBeVisible();
  });
