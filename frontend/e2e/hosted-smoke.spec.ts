import { test, expect } from "@playwright/test";
test.use({
  baseURL: "https://cortex-ai-three-kappa.vercel.app",
  trace: "off",
  video: "off",
});
test.skip(
  !process.env.CORTEX_HOSTED_SMOKE,
  "Explicit read-only hosted verification.",
);
test("published demo normal login diagnosis", async ({ page }) => {
  test.setTimeout(150000);
  const calls: { path: string; status: number }[] = [];
  page.on("response", (r) => {
    if (r.url().includes("/api/"))
      calls.push({ path: new URL(r.url()).pathname, status: r.status() });
  });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: /Maya|Arya Dhumal/ }),
  ).toBeVisible({
    timeout: 90000,
  });
  await page.getByRole("button", { name: /Maya|Arya Dhumal/ }).click();
  await page
    .getByRole("button", { name: "Enter your workspace", exact: true })
    .click();
  const result = await Promise.race([
    page
      .getByRole("link", { name: "Skip to workspace" })
      .waitFor({ state: "visible", timeout: 60000 })
      .then(() => "signed-in"),
    page
      .getByRole("alert")
      .waitFor({ state: "visible", timeout: 60000 })
      .then(
        async () => "error: " + (await page.getByRole("alert").innerText()),
      ),
  ]);
  console.log(JSON.stringify({ result, calls }));
  await page.screenshot({
    path: "../outputs/product-audit/hosted-login-diagnosis.png",
    fullPage: true,
  });
  expect(result).toBe("signed-in");
});
