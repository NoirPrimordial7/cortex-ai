import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { test, expect, vi } from "vitest";
import { api } from "../api";
import History from "./History";
vi.mock("../api", () => ({ api: vi.fn() }));
const citation = {
  id: "cite",
  title: "Leave policy",
  document_id: "doc",
  version_id: "v",
  clause_id: "c",
  quote: "Stored quotation must not be rendered.",
  locator: "TXT line 2",
  start_char: 0,
  end_char: 24,
  source_hash: "hash",
  valid_from: "2026-01-01",
  valid_to: null,
  source_kind: "hr_policy",
  authority_rank: 100,
  reviewed_value: 20,
};
const query = {
  query_id: "q",
  status: "answered",
  reason_code: null,
  mode: "evidence",
  as_of: "2026-10-10",
  scope: { population: "india_full_time", jurisdiction: "IN" },
  answer: "Your entitlement is 20 days.",
  citations: [citation],
};
test("history fetches the current authorized source before showing any passage", async () => {
  vi.mocked(api).mockImplementation(async (path) =>
    path === "/queries"
      ? { items: [query] }
      : {
          ...citation,
          text: "Fresh authorized passage",
          end_char: 24,
          query_id: "q",
        },
  );
  render(
    <MemoryRouter>
      <History />
    </MemoryRouter>,
  );
  await userEvent.click(
    await screen.findByText(query.answer, { selector: "strong" }),
  );
  expect(screen.queryByText(citation.quote)).toBeNull();
  await userEvent.click(
    screen.getByRole("button", { name: "View evidence: Leave policy" }),
  );
  expect(await screen.findByText("Fresh authorized passage")).toBeVisible();
  expect(api).toHaveBeenCalledWith("/queries/q/citations/cite?view=passage");
});
test("a denied history citation closes its source view and refreshes the permitted history", async () => {
  let reads = 0;
  vi.mocked(api).mockImplementation(async (path) => {
    if (path === "/queries") return { items: reads++ ? [] : [query] };
    throw new Error("Resource unavailable");
  });
  render(
    <MemoryRouter>
      <History />
    </MemoryRouter>,
  );
  await userEvent.click(
    await screen.findByText(query.answer, { selector: "strong" }),
  );
  await userEvent.click(
    screen.getByRole("button", { name: "View evidence: Leave policy" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Resource unavailable",
  );
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(screen.queryByText(citation.quote)).toBeNull();
  expect(
    await screen.findByText("Your evidence record starts here"),
  ).toBeVisible();
});
