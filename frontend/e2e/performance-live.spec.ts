import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync, readFileSync, readdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
test.use({
  baseURL: process.env.CORTEX_WORKFLOW_URL || "http://127.0.0.1:8004",
  trace: "off",
  video: "off",
});
test.skip(
  !process.env.CORTEX_LIVE_WORKFLOW,
  "Explicit production-build local performance sample.",
);

test("real profile loading keeps layout shift below 0.1 at each requested width", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.assign(window, { loginLayoutShift: 0 });
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & {
          hadRecentInput: boolean;
          value: number;
        };
        if (!shift.hadRecentInput)
          (
            window as unknown as { loginLayoutShift: number }
          ).loginLayoutShift += shift.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  const samples = [];
  for (const width of [320, 390, 768, 1024, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByTestId("demo-profile-maya")).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(100);
    const cls = await page.evaluate(
      () =>
        (window as unknown as { loginLayoutShift: number }).loginLayoutShift,
    );
    samples.push({ width, cls });
    expect(cls, `Login loading at ${width}px`).toBeLessThan(0.1);
  }
  mkdirSync("../outputs/product-audit/performance", { recursive: true });
  writeFileSync(
    "../outputs/product-audit/performance/login-loading.json",
    JSON.stringify(samples, null, 2),
  );
});
test("local browser timing and separately sampled hosted health", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const metrics = { lcpMs: 0, cls: 0, maxEventDurationMs: 0 };
    Object.assign(window, { cortexAuditMetrics: metrics });
    for (const type of ["largest-contentful-paint", "layout-shift", "event"]) {
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === "largest-contentful-paint")
              metrics.lcpMs = entry.startTime;
            if (
              entry.entryType === "layout-shift" &&
              !(entry as PerformanceEntry & { hadRecentInput: boolean })
                .hadRecentInput
            )
              metrics.cls += (
                entry as PerformanceEntry & { value: number }
              ).value;
            if (entry.entryType === "event")
              metrics.maxEventDurationMs = Math.max(
                metrics.maxEventDurationMs,
                entry.duration,
              );
          }
        }).observe({
          type,
          buffered: true,
          ...(type === "event" ? { durationThreshold: 16 } : {}),
        });
      } catch {
        /* unsupported metric is reported as zero observations */
      }
    }
  });
  await page.goto("/");
  await expect(page.getByTestId("demo-profile-maya")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { cortexAuditMetrics: { lcpMs: number } })
            .cortexAuditMetrics.lcpMs,
      ),
    )
    .toBeGreaterThan(0);
  const snapshot = () =>
    page.evaluate(() => ({
      ...(window as unknown as { cortexAuditMetrics: Record<string, number> })
        .cortexAuditMetrics,
      navigationMs: performance.getEntriesByType("navigation")[0].duration,
      resourceCount: performance.getEntriesByType("resource").length,
    }));
  const firstBrowserLogin = await snapshot();
  expect(firstBrowserLogin.cls).toBeLessThan(0.1);
  await page.getByTestId("demo-profile-maya").click();
  await page
    .getByRole("button", { name: "Enter your workspace", exact: true })
    .click();
  await expect(
    page.getByRole("link", { name: "Skip to workspace" }),
  ).toBeVisible();
  await page.goto("/assistant");
  await expect(
    page.getByRole("button", {
      name: "How many annual leave days do I have?",
      exact: true,
    }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const assistantNavigation = await snapshot();
  const request = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname.endsWith("/queries") &&
      r.request().method() === "POST",
  );
  const start = Date.now();
  await page
    .getByRole("button", {
      name: "How many annual leave days do I have?",
      exact: true,
    })
    .click();
  const response = await request;
  const queryRoundTripMs = Date.now() - start;
  expect(response.status()).toBe(200);
  await expect(
    page.getByRole("heading", {
      name: "The approved annual leave entitlement is 20 working days per year.",
    }),
  ).toBeVisible();
  const afterInteraction = await snapshot();
  const hosted = [];
  for (const url of [
    "https://cortex-ai-demo.onrender.com/api/v1/health",
    "https://cortex-ai-three-kappa.vercel.app/api/v1/health",
  ]) {
    const started = Date.now();
    const result = await page.request.get(url, { timeout: 90000 });
    hosted.push({
      url,
      status: result.status(),
      elapsedMs: Date.now() - started,
      coldStart: "unknown; service not restarted or forced idle",
    });
  }
  const assets = readdirSync("dist/assets")
    .filter((name) => /\.(js|css)$/.test(name))
    .map((name) => {
      const data = readFileSync("dist/assets/" + name);
      return {
        file: name,
        bytes: data.length,
        gzipBytes: gzipSync(data).length,
      };
    });
  mkdirSync("../outputs/product-audit/performance", { recursive: true });
  writeFileSync(
    "../outputs/product-audit/performance/result.json",
    JSON.stringify(
      {
        sampledAt: new Date().toISOString(),
        viewport: page.viewportSize(),
        firstBrowserLogin,
        assistantNavigation,
        afterInteraction,
        queryRoundTripMs,
        hosted,
        assets,
        limitations:
          "Single unthrottled local Chromium sample. Browser login uses a fresh browser context; route navigation follows sign-in. Event duration is an observation, not certified INP or field CWV. Hosted health round trips differ from browser LCP and backend query time. Render cold start not observed.",
      },
      null,
      2,
    ),
  );
});
