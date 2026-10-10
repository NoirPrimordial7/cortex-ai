import { test, expect, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

// Normal authentication against the owner's disposable, read-only public demo.
// Opt-in only; no traces, credential exports, uploads or governance mutations.
test.use({
  baseURL:
    process.env.CORTEX_RELEASE_URL ||
    "https://cortex-ai-three-kappa.vercel.app",
  trace: "off",
  video: "off",
});
test.skip(
  !process.env.CORTEX_HOSTED_RELEASE,
  "Explicit production release verification.",
);
const widths = [320, 390, 768, 1024, 1280, 1440];
const folder =
  process.env.CORTEX_RELEASE_OUTPUT || "../outputs/production-release";
const names: Record<string, string> = {
  maya: "Arya Dhumal",
  ravi: "Aditya Gholar",
  isha: "Ashwin Gudur",
  orbit: "Yashraj Bansal",
};

async function capture(
  page: Page,
  profile: string,
  state: string,
  measurements: unknown[],
) {
  mkdirSync(`${folder}/${profile}`, { recursive: true });
  for (const theme of ["light", "dark"]) {
    const themeButton = page.getByRole("button", {
      name: `Switch to ${theme} theme`,
    });
    if (await themeButton.count()) await themeButton.click();
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => document.fonts.ready);
      if (state.startsWith("ask-") && state !== "ask-empty")
        await page.evaluate(() =>
          window.scrollTo(0, document.documentElement.scrollHeight),
        );
      await page.screenshot({
        path: `${folder}/${profile}/${state}-${theme}-${width}.png`,
        fullPage: true,
      });
      const geometry = await page.evaluate(() => ({
        width: innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        clipped: Array.from(
          document.querySelectorAll("a,button,input,select,textarea,summary"),
        )
          .filter((element) => {
            const r = element.getBoundingClientRect();
            return (
              r.width > 0 &&
              r.height > 0 &&
              r.y >= 0 &&
              r.y < innerHeight &&
              getComputedStyle(element).visibility !== "hidden" &&
              getComputedStyle(element).clipPath === "none" &&
              (r.x < -0.5 || r.right > innerWidth + 0.5)
            );
          })
          .map(
            (element) =>
              element.getAttribute("aria-label") || element.textContent?.trim(),
          ),
      }));
      measurements.push({ profile, state, theme, ...geometry });
      expect(
        geometry.scrollWidth,
        `${profile} ${state} ${theme} ${width}`,
      ).toBeLessThanOrEqual(width);
      expect(geometry.clipped, `${profile} ${state} ${theme} ${width}`).toEqual(
        [],
      );
    }
  }
}

for (const profile of ["maya", "ravi", "isha", "orbit", "noor"]) {
  test(`production UI and role boundaries ${profile}`, async ({ page }) => {
    test.setTimeout(240000);
    mkdirSync(`${folder}/${profile}`, { recursive: true });
    const measurements: unknown[] = [];
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/");
    const picker = page.getByTestId(`demo-profile-${profile}`);
    await expect(picker).toBeVisible({ timeout: 90000 });
    if (profile !== "noor") await expect(picker).toContainText(names[profile]);
    if (profile === "maya") await capture(page, profile, "login", measurements);
    await picker.click();
    await page
      .getByRole("button", { name: "Enter your workspace", exact: true })
      .click();
    if (profile === "noor") {
      await expect(page.getByRole("alert")).toHaveText(
        "Invalid sign-in details",
      );
      expect((await page.request.get("/api/v1/auth/session")).status()).toBe(
        401,
      );
      return;
    }
    await expect(
      page.getByRole("link", { name: "Skip to workspace" }),
    ).toBeVisible({ timeout: 60000 });
    const session = await (
      await page.request.get("/api/v1/auth/session")
    ).json();
    expect(session.user.display_name).toBe(names[profile]);
    expect(session.user.read_only_demo).toBe(true);
    for (const [path, action, state] of [
      ["/", "", "overview"],
      ["/documents", "", "library"],
      ["/assistant", "query.execute", "ask-empty"],
      ["/history", "query.execute", "history"],
      ["/conflicts", "query.execute", "conflicts"],
      ["/upload", "document.upload", "upload"],
      ["/permissions", "user.manage", "people"],
      ["/audit", "audit.read", "audit"],
    ]) {
      const allowed = !action || session.user.actions.includes(action);
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(
        page.getByText("Loading your workspace…", { exact: true }),
      ).toHaveCount(0);
      expect(new URL(page.url()).pathname).toBe(
        allowed ? path : path === "/upload" ? "/documents" : "/",
      );
      if (
        allowed &&
        (profile === "ravi" || (profile === "isha" && path === "/audit"))
      )
        await capture(page, profile, state, measurements);
    }
    for (const [path, action] of [
      ["/api/v1/audit-events", "audit.read"],
      ["/api/v1/admin/users", "user.manage"],
    ])
      expect((await page.request.get(path)).status()).toBe(
        session.user.actions.includes(action) ? 200 : 403,
      );
    if (profile === "ravi") {
      const docs = await (await page.request.get("/api/v1/documents")).json();
      await page.goto(`/documents/${docs.items[0].id}`);
      await expect(page.locator(".reader-body")).toBeVisible();
      await capture(page, profile, "document", measurements);
    }
    if (profile === "maya") {
      await page.goto("/assistant");
      await page.getByLabel("As of", { exact: true }).fill("2026-10-10");
      await page
        .getByLabel("Ask about a company policy")
        .fill("How many annual leave days do I have?");
      await page
        .getByRole("button", { name: "Ask Cortex", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: /20 working days/ }),
      ).toBeVisible();
      await capture(page, profile, "ask-answer", measurements);
      await page.setViewportSize({ width: 390, height: 900 });
      await page
        .getByRole("button", { name: "View evidence: Annual leave policy" })
        .click();
      await expect(
        page.getByRole("dialog", { name: "Source evidence" }),
      ).toBeVisible();
      await expect(
        page.getByRole("dialog").getByText(/receive 20 working days/),
      ).toBeVisible();
      await page.screenshot({ path: `${folder}/${profile}/evidence-390.png` });
      await page.getByRole("button", { name: "Back to answer" }).click();
      await page
        .getByLabel("Ask about a company policy")
        .fill("How many remote days per week?");
      await page
        .getByRole("button", { name: "Ask Cortex", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: /View evidence:/ }),
      ).toHaveCount(2);
      await capture(page, profile, "ask-conflict", measurements);
    }
    expect(errors).toEqual([]);
    writeFileSync(
      `${folder}/${profile}/observations.json`,
      JSON.stringify(measurements, null, 2),
    );
    await page.getByRole("button", { name: "Sign out", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Enter your workspace" }),
    ).toBeVisible();
  });
}
