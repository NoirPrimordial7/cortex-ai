import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, test, expect } from "vitest";
import Assistant, { HighlightedSource } from "./Assistant";
import { ApiError, api } from "../api";
import type { Answer, Source } from "../types";
vi.mock("../api", async () => {
  const actual = await vi.importActual<typeof import("../api")>("../api");
  return { ...actual, api: vi.fn() };
});
const quote = "Employees receive 20 working days.";
const source: Source = {
  id: "cite",
  query_id: "query",
  document_id: "doc",
  version_id: "v",
  clause_id: "c",
  title: "Approved policy",
  quote,
  locator: "TXT line 2",
  start_char: 7,
  end_char: 7 + quote.length,
  source_hash: "hash",
  valid_from: "2026-01-01",
  valid_to: "2027-01-01",
  source_kind: "hr_policy",
  reviewed_value: 20,
  text: "Title\n\n" + quote + "\n",
};
const result: Answer = {
  query_id: "query",
  status: "answered",
  reason_code: null,
  mode: "evidence",
  as_of: "2026-10-09",
  scope: { population: "india_full_time", jurisdiction: "IN" },
  answer: "The entitlement is 20 working days per year.",
  citations: [source],
};
test("question uses backend result and opens the authorized exact source", async () => {
  vi.mocked(api).mockResolvedValueOnce(result).mockResolvedValueOnce(source);
  render(<Assistant />);
  await userEvent.type(
    screen.getByLabelText("Ask about a company policy"),
    "How many leave days?",
  );
  await userEvent.click(screen.getByRole("button", { name: "Ask Cortex" }));
  expect(await screen.findByText(result.answer)).toBeInTheDocument();
  expect(await screen.findByText(quote)).toBeInTheDocument();
  expect(api).toHaveBeenNthCalledWith(2, "/queries/query/citations/cite");
  expect(document.querySelector("mark")?.textContent).toBe(quote);
});
test("changing the as-of date removes stale answer and source", async () => {
  vi.mocked(api).mockResolvedValueOnce(result).mockResolvedValueOnce(source);
  render(<Assistant />);
  await userEvent.click(
    screen.getByText("How many annual leave days do I have?"),
  );
  await screen.findByText(result.answer);
  await userEvent.clear(screen.getByLabelText("As of"));
  await waitFor(() =>
    expect(screen.queryByText(result.answer)).not.toBeInTheDocument(),
  );
  expect(document.querySelector("mark")).toBeNull();
});
test("permission change notification clears all visible derived evidence", async () => {
  vi.mocked(api).mockResolvedValueOnce(result).mockResolvedValueOnce(source);
  render(<Assistant />);
  await userEvent.click(
    screen.getByText("How many annual leave days do I have?"),
  );
  await screen.findByText(quote);
  window.dispatchEvent(new Event("cortex:evidence-changed"));
  await waitFor(() =>
    expect(screen.queryByText(quote)).not.toBeInTheDocument(),
  );
});
test("denied citation hides existing answer rather than keeping an unsupported source", async () => {
  vi.mocked(api)
    .mockResolvedValueOnce(result)
    .mockRejectedValueOnce(new ApiError(404, "Resource unavailable"));
  render(<Assistant />);
  await userEvent.click(
    screen.getByText("How many annual leave days do I have?"),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Resource unavailable",
  );
  expect(screen.queryByText(result.answer)).not.toBeInTheDocument();
});
test("source text is escaped rather than rendered as HTML", () => {
  render(
    <HighlightedSource
      source={{
        ...source,
        text: "<img src=x onerror=alert(1)>",
        start_char: 0,
        end_char: 27,
      }}
    />,
  );
  expect(document.querySelector("img")).toBeNull();
  expect(document.querySelector("pre")?.textContent).toBe(
    "<img src=x onerror=alert(1)>",
  );
});

test("editing a new question does not relabel the previous answer", async () => {
  vi.mocked(api).mockResolvedValueOnce(result).mockResolvedValueOnce(source);
  render(<Assistant />);
  await userEvent.click(
    screen.getByText("How many annual leave days do I have?"),
  );
  await screen.findByText(result.answer);
  await userEvent.clear(screen.getByLabelText("Ask about a company policy"));
  await userEvent.type(
    screen.getByLabelText("Ask about a company policy"),
    "What is my notice period?",
  );
  expect(document.querySelector(".question-bubble")?.textContent).toBe(
    "How many annual leave days do I have?",
  );
});

test("a slow previous citation cannot overwrite the currently selected source", async () => {
  let release: (source: Source) => void = () => {};
  const second = {
    ...source,
    id: "cite-b",
    title: "Second source",
    text: "A different approved source.",
    quote: "different",
    start_char: 2,
    end_char: 11,
  };
  vi.mocked(api)
    .mockResolvedValueOnce({ ...result, citations: [source, second] })
    .mockImplementationOnce(
      () =>
        new Promise<Source>((r) => {
          release = r;
        }),
    )
    .mockResolvedValueOnce(second);
  render(<Assistant />);
  await userEvent.click(
    screen.getByText("How many annual leave days do I have?"),
  );
  await screen.findByText(result.answer);
  await userEvent.click(screen.getByRole("button", { name: /Second source/ }));
  await screen.findByRole("heading", { name: "Second source" });
  release(source);
  await waitFor(() =>
    expect(document.querySelector("pre")?.textContent).toBe(second.text),
  );
  expect(
    screen.queryByRole("heading", { name: source.title }),
  ).not.toBeInTheDocument();
});
