import { test, expect, type Page } from "@playwright/test";
import type { Answer, Source } from "../src/types";
import { mkdirSync, writeFileSync } from "node:fs";
const quote =
  "India full-time employees receive 20 working days of annual leave per year.";
const source: Source = {
  id: "cite-a",
  query_id: "query-a",
  document_id: "doc-a",
  version_id: "LEAVE-2026",
  clause_id: "clause-a",
  title: "Annual leave policy",
  quote,
  locator: "TXT line 2",
  start_char: 7,
  end_char: 7 + quote.length,
  source_hash: "ui-test-only",
  valid_from: "2026-01-01",
  valid_to: "2027-01-01",
  source_kind: "hr_policy",
  authority_rank: 100,
  reviewed_value: 20,
  text: "Title\n\n" + quote,
};
const answer: Answer = {
  query_id: "query-a",
  status: "answered",
  reason_code: null,
  mode: "evidence",
  as_of: "2026-10-10",
  scope: { population: "india_full_time", jurisdiction: "IN" },
  answer: "The approved annual leave entitlement is 20 working days per year.",
  citations: [source],
};
// Deterministic UI scenarios. Real permission/evidence checks are also tested in the backend and local browser.
async function setup(page: Page, result: Answer = answer, denied = false) {
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/session"))
      return route.fulfill({
        json: {
          user: {
            id: "ui-test",
            display_name: "UI Test",
            workspace: "NORTHSTAR",
            roles: [{ id: "employee", name: "Employee" }],
            actions: ["query.execute"],
            read_only_demo: true,
          },
          csrf_token: "ui-test",
          policy_revision: 1,
          knowledge_revision: 1,
        },
      });
    if (path.endsWith("/queries") && route.request().method() === "POST")
      return route.fulfill({ json: result });
    if (path.includes("/citations/"))
      return denied
        ? route.fulfill({
            status: 404,
            json: { error: { message: "Resource unavailable" } },
          })
        : route.fulfill({
            json: {
              ...source,
              ...result.citations.find((c) => path.endsWith(c.id)),
            },
          });
    return route.fulfill({ status: 404, json: {} });
  });
  await page.goto("/assistant");
  await expect(
    page.getByRole("heading", { name: /A clear answer/ }),
  ).toBeVisible();
}
async function ask(page: Page) {
  await page
    .getByRole("button", { name: "How many annual leave days do I have?" })
    .click();
  await expect(
    page.getByRole("heading", { name: answer.answer }),
  ).toBeVisible();
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

test("desktop keyboard citation remains above the follow-up composer", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await setup(page, {
    ...answer,
    status: "abstained",
    reason_code: "UNRESOLVED_CONFLICT",
    answer:
      "Equally authoritative policies disagree for this date and scope. I cannot choose between them.",
    citations: [
      source,
      { ...source, id: "cite-b", title: "Alternative annual leave policy" },
    ],
  });
  await page.goto("/assistant");
  await page
    .getByRole("button", {
      name: "How many annual leave days do I have?",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("Policy conflict", { exact: true }),
  ).toBeVisible();
  const citation = page.getByRole("button", {
    name: "View evidence: Alternative annual leave policy",
    exact: true,
  });
  await citation.focus();
  await citation.scrollIntoViewIfNeeded();
  const bounds = await citation.boundingBox();
  const composer = await page.locator(".fb-composer").boundingBox();
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(composer!.y);
});
for (const width of [320, 390, 768, 1024, 1280, 1440]) {
  test(`layout, exact citation, focus return and both themes at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await setup(page);
    await noOverflow(page);
    if (width < 600) {
      for (const label of ["As of", "Policy scope"]) {
        expect(
          await page
            .getByLabel(label, { exact: true })
            .evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
        ).toBeGreaterThanOrEqual(16);
      }
    }
    if (width === 320) {
      expect(
        (await page.getByLabel("Policy scope").boundingBox())!.width,
      ).toBeGreaterThanOrEqual(190);
    }
    await ask(page);
    await noOverflow(page);
    const citation = page.getByRole("button", {
      name: "View evidence: Annual leave policy",
    });
    if (width < 1100) {
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(page.getByText(quote, { exact: true })).toHaveCount(0);
      await citation.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByRole("button", { name: "Back to answer" }),
      ).toBeFocused();
      await expect(dialog.getByText(quote, { exact: true })).toHaveCount(1);
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press("Tab");
        expect(
          await page.evaluate(
            () => !!document.activeElement?.closest("dialog"),
          ),
        ).toBe(true);
      }
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(citation).toBeFocused();
      await citation.click();
      await page.getByRole("button", { name: "Back to answer" }).click();
      await expect(citation).toBeFocused();
    } else {
      await expect(page.getByText(quote, { exact: true })).toHaveCount(1);
      await page
        .getByRole("button", { name: "Hide evidence", exact: true })
        .first()
        .click();
      await expect(
        page.getByRole("complementary", { name: "Source evidence" }),
      ).toHaveCount(0);
      await citation.click();
      await expect(
        page.getByRole("complementary", { name: "Source evidence" }),
      ).toBeVisible();
    }
    if (width < 900) {
      await page.getByRole("button", { name: "Open navigation" }).click();
      await expect(
        page.getByRole("dialog", { name: "Workspace navigation" }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
    }
    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    await expect(page.locator(".app")).toHaveClass(/dark/);
    await noOverflow(page);
    if (width < 1100) await citation.click();
    await page.screenshot({
      path: `../outputs/fieldbook/dark-${width}.png`,
      fullPage: true,
    });
    if (width < 1100)
      await page.getByRole("button", { name: "Back to answer" }).click();
    await page.getByRole("button", { name: "Switch to light theme" }).click();
    await page.screenshot({
      path: `../outputs/fieldbook/answer-${width}.png`,
      fullPage: true,
    });
    if (width < 1100) {
      await citation.click();
      await page.getByRole("button", { name: "View source context" }).click();
      await expect(page.locator("mark")).toHaveText(quote);
      await page.screenshot({
        path: `../outputs/fieldbook/evidence-${width}.png`,
        fullPage: true,
      });
    }
  });
}
test("long answers keep the follow-up composer reachable and preserve original question", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 640 });
  const long = {
    ...answer,
    answer: Array(12).fill(answer.answer).join("\n\n"),
  };
  await setup(page, long);
  await page
    .getByRole("button", { name: "How many annual leave days do I have?" })
    .click();
  await expect(page.getByText(long.answer)).toBeVisible();
  await noOverflow(page);
  expect(
    await page
      .locator(".fb-result")
      .evaluate((el) => getComputedStyle(el).overflowY),
  ).toBe("visible");
  await page
    .getByRole("button", { name: "View evidence: Annual leave policy" })
    .scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("button", { name: "View evidence: Annual leave policy" }),
  ).toBeInViewport();
  const composer = page.getByLabel("Ask about a company policy");
  await composer.scrollIntoViewIfNeeded();
  const bounds = await composer.boundingBox();
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(640);
  await composer.fill("What is my notice period?");
  await expect(page.locator(".question-bubble")).toHaveText(
    "How many annual leave days do I have?",
  );
  await page.getByRole("button", { name: "Ask Cortex", exact: true }).click();
  await expect(page.locator(".question-bubble")).toHaveText(
    "What is my notice period?",
  );
  await page.setViewportSize({ width: 320, height: 360 }); // keyboard-like viewport reduction
  await noOverflow(page);
  await composer.fill("How many remote days per week?");
  await page
    .getByRole("button", { name: "Ask Cortex", exact: true })
    .scrollIntoViewIfNeeded();
  await expect(
    page.getByRole("button", { name: "Ask Cortex", exact: true }),
  ).toBeInViewport();
  await page.screenshot({
    path: "../outputs/fieldbook/long-answer-320.png",
    fullPage: true,
  });
});
test("conflict sources remain distinct and do not claim approval", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const second = {
    ...source,
    id: "cite-b",
    title: "Alternative annual leave policy",
    text: "Other\n\nA different entitlement.",
    quote: "A different entitlement.",
    start_char: 7,
    end_char: 31,
  };
  await setup(page, {
    ...answer,
    status: "abstained",
    reason_code: "UNRESOLVED_CONFLICT",
    answer:
      "Two approved policies disagree on annual leave. I cannot select one.",
    citations: [source, second],
  });
  await page
    .getByRole("button", { name: "How many annual leave days do I have?" })
    .click();
  await expect(
    page.getByText("Policy conflict", { exact: true }),
  ).toBeVisible();
  const comparison = page.getByRole("region", {
    name: "Compare conflicting policy evidence",
  });
  await expect(comparison.locator("blockquote")).toHaveText([
    quote,
    second.quote,
  ]);
  const claims = comparison.locator(".fb-claim");
  const firstBox = await claims.nth(0).boundingBox();
  const secondBox = await claims.nth(1).boundingBox();
  expect(secondBox!.y).toBeGreaterThanOrEqual(firstBox!.y + firstBox!.height);
  await page
    .getByRole("button", {
      name: "View evidence: Alternative annual leave policy",
    })
    .click();
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: second.title }),
  ).toBeVisible();
  await expect(
    page.getByText("Unresolved conflict", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Approved · valid", { exact: true })).toHaveCount(
    0,
  );
  await page.screenshot({
    path: "../outputs/fieldbook/conflict-evidence-390.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Back to answer" }).click();
  await page.screenshot({
    path: "../outputs/fieldbook/conflict-390.png",
    fullPage: true,
  });
});

test("desktop conflict claims share a row, remain unobscured and reauthorize on inspection", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const second = {
    ...source,
    id: "cite-b",
    title: "Other policy",
    text: "Title\n\n25 working days.",
    quote: "25 working days.",
    start_char: 7,
    end_char: 23,
  };
  await setup(page, {
    ...answer,
    status: "abstained",
    reason_code: "UNRESOLVED_CONFLICT",
    answer: "Two policies disagree. I cannot choose between them.",
    citations: [source, second],
  });
  await page
    .getByRole("button", {
      name: "How many annual leave days do I have?",
      exact: true,
    })
    .click();
  await expect(page.locator(".fb-claim blockquote")).toHaveText([
    quote,
    second.quote,
  ]);
  const claims = page.locator(".fb-claim");
  expect((await claims.nth(0).boundingBox())!.y).toBe(
    (await claims.nth(1).boundingBox())!.y,
  );
  expect(
    await page
      .locator(".fb-composer")
      .evaluate((el) => getComputedStyle(el).position),
  ).toBe("static");
  await page.route("**/api/v1/queries/*/citations/cite-b", (route) =>
    route.fulfill({
      status: 404,
      json: { error: { message: "Resource unavailable" } },
    }),
  );
  await page
    .getByRole("button", { name: "View evidence: Other policy" })
    .click();
  await expect(page.getByRole("alert")).toHaveText("Resource unavailable");
  await expect(page.locator(".fb-claim")).toHaveCount(0);
  await expect(page.getByText(quote, { exact: true })).toHaveCount(0);
});

test("conflict comparison supports 200 percent text, both themes and evidence focus at 320", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  const second = {
    ...source,
    id: "cite-b",
    title: "Other policy",
    text: "Title\n\n25 working days.",
    quote: "25 working days.",
    start_char: 7,
    end_char: 23,
  };
  await setup(page, {
    ...answer,
    status: "abstained",
    reason_code: "UNRESOLVED_CONFLICT",
    answer: "Two policies disagree. I cannot choose between them.",
    citations: [source, second],
  });
  await page
    .getByRole("button", {
      name: "How many annual leave days do I have?",
      exact: true,
    })
    .click();
  await expect(page.locator(".fb-claim blockquote")).toHaveText([
    quote,
    second.quote,
  ]);
  await page.evaluate(() => {
    const nodes = document.querySelectorAll<HTMLElement>(
      ".fb-claim h3,.fb-claim blockquote,.fb-claim dt,.fb-claim dd,.fb-applies,.fb-abstention,.fb-comparison-note,.question-bubble",
    );
    const sizes = Array.from(nodes, (node) =>
      parseFloat(getComputedStyle(node).fontSize),
    );
    nodes.forEach((node, i) => {
      node.style.fontSize = `${sizes[i] * 2}px`;
    });
  });
  for (const dark of [false, true]) {
    if (dark)
      await page.getByRole("button", { name: "Switch to dark theme" }).click();
    await noOverflow(page);
    const citation = page.getByRole("button", {
      name: "View evidence: Other policy",
    });
    await citation.click();
    await expect(
      page.getByRole("button", { name: "Back to answer" }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(citation).toBeFocused();
  }
});
test("source denial clears the derived answer", async ({ page }) => {
  await setup(page, answer, true);
  await page
    .getByRole("button", { name: "How many annual leave days do I have?" })
    .click();
  await expect(page.getByRole("alert")).toHaveText("Resource unavailable");
  await expect(page.getByText(answer.answer)).toHaveCount(0);
  await page.screenshot({
    path: "../outputs/fieldbook/error-1440.png",
    fullPage: true,
  });
});
test("clarification works without citations and scope changes reset the answer", async ({
  page,
}) => {
  await setup(page, {
    ...answer,
    status: "clarification_required",
    answer: "Which leave policy do you mean?",
    citations: [],
  });
  await page
    .getByRole("button", { name: "How many annual leave days do I have?" })
    .click();
  await expect(
    page.getByText("More context needed", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".fb-citation")).toHaveCount(0);
  await page.getByLabel("Policy scope").selectOption("india_contractor");
  await expect(
    page.getByRole("heading", { name: /A clear answer/ }),
  ).toBeVisible();
});
test("unsupported answers do not fabricate citations", async ({ page }) => {
  await setup(page, {
    ...answer,
    status: "abstained",
    reason_code: "NO_ELIGIBLE_EVIDENCE",
    answer: "No permitted evidence supports this question.",
    citations: [],
  });
  await page
    .getByRole("button", { name: "How many annual leave days do I have?" })
    .click();
  await expect(
    page.getByText("Unable to answer", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".fb-citation")).toHaveCount(0);
  await page.screenshot({
    path: "../outputs/fieldbook/unsupported-1440.png",
    fullPage: true,
  });
});
test("reopening a revoked mobile citation clears the view and its answer", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);
  await ask(page);
  await page.route("**/api/v1/queries/*/citations/*", (route) =>
    route.fulfill({
      status: 404,
      json: { error: { message: "Resource unavailable" } },
    }),
  );
  await page
    .getByRole("button", { name: "View evidence: Annual leave policy" })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveText("Resource unavailable");
  await expect(page.getByText(answer.answer)).toHaveCount(0);
  await expect(page.getByText(quote, { exact: true })).toHaveCount(0);
});
test("200 percent text scaling and reduced motion remain usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await setup(page);
  await ask(page);
  await page.route("**/test-text-scale.css", (route) =>
    route.fulfill({
      contentType: "text/css",
      body: ".fieldbook { font-size:200% } .fieldbook p,.fieldbook label,.fieldbook strong {font-size: 1em} .fieldbook h2 {font-size:2em}",
    }),
  );
  await page.addStyleTag({ url: "/test-text-scale.css" });
  await noOverflow(page);
  await page
    .getByRole("button", { name: "View evidence: Annual leave policy" })
    .click();
  await expect(
    page.getByRole("button", { name: "Back to answer" }),
  ).toBeVisible();
  await noOverflow(page);
});

test("reading contrast, control boundaries and focused citations remain visible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);
  await ask(page);
  const measurements = [];
  for (const theme of ["light", "dark"]) {
    if (theme === "dark") {
      await page.getByRole("button", { name: "Switch to dark theme" }).click();
    }
    await page
      .getByRole("button", { name: "View evidence: Annual leave policy" })
      .click();
    await expect(
      page.getByRole("dialog").getByText(quote, { exact: true }),
    ).toBeVisible();
    const sample = await page.evaluate(() => {
      function luminance(color: string) {
        const rgb = color
          .match(/[\d.]+/g)!
          .slice(0, 3)
          .map(Number)
          .map((v) => {
            const s = v / 255;
            return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
          });
        return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
      }
      function ratio(a: string, b: string) {
        const x = luminance(a),
          y = luminance(b);
        return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
      }
      function background(el: Element) {
        let current: Element | null = el;
        while (current) {
          const bg = getComputedStyle(current).backgroundColor;
          if (bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return bg;
          current = current.parentElement;
        }
        return "rgb(255,255,255)";
      }
      const text = [
        ".fb-document .fb-label",
        ".fb-document h2",
        ".fb-status",
        ".fb-passage blockquote",
        ".source-summary",
        ".source-details summary",
        ".fb-context-toggle",
        ".fb-evidence-back button",
      ].map((selector) => {
        const el = document.querySelector(selector)!;
        return {
          selector,
          ratio: ratio(getComputedStyle(el).color, background(el)),
        };
      });
      const control = document.querySelector(".fb-control input")!;
      return {
        text,
        controlBoundary: ratio(
          getComputedStyle(control).borderTopColor,
          background(control),
        ),
      };
    });
    for (const entry of sample.text)
      expect(entry.ratio, entry.selector).toBeGreaterThanOrEqual(4.5);
    expect(sample.controlBoundary).toBeGreaterThanOrEqual(3);
    measurements.push({ theme, ...sample });
    await page.getByRole("button", { name: "Back to answer" }).click();
    const citation = page.getByRole("button", {
      name: "View evidence: Annual leave policy",
    });
    await expect(citation).toBeFocused();
    const bounds = await citation.boundingBox(),
      composer = await page.locator(".fb-composer").boundingBox();
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(composer!.y);
  }
  mkdirSync("../outputs/fieldbook", { recursive: true });
  writeFileSync(
    "../outputs/fieldbook/contrast.json",
    JSON.stringify(measurements, null, 2),
  );
});
