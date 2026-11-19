import {
  render as renderUI,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { AskDraftProvider } from "../AskDraft";
import userEvent from "@testing-library/user-event";
import { vi, test, expect } from "vitest";
import Assistant from "./Assistant";
import { HighlightedSource } from "../SourcePassage";
import { ApiError, api } from "../api";
import type { Answer, Source } from "../types";
const render = (element: ReactNode) =>
  renderUI(
    <MemoryRouter>
      <AskDraftProvider>{element}</AskDraftProvider>
    </MemoryRouter>,
  );
vi.mock("../session", () => ({ useSession: () => ({ user: { actions: ["ticket.create"], read_only_demo: false }, refresh: async () => {} }) }));
vi.mock("../api", async () => {
  const actual = await vi.importActual<typeof import("../api")>("../api");
  return { ...actual, api: vi.fn() };
});

test("autocomplete is empty at rest and supports keyboard selection and Escape", async () => {
  vi.mocked(api).mockResolvedValue({
    items: ["Show leave policies", "Show sick leave policy"],
  });
  render(<Assistant />);
  const input = screen.getByRole("combobox", {
    name: "Ask about a company policy",
  });
  expect(input).toHaveAttribute("aria-expanded", "false");
  await userEvent.type(input, "show");
  await screen.findByRole("listbox");
  await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowUp}{ArrowDown}");
  const option = within(screen.getByRole("listbox")).getByRole("option", {
    selected: true,
  });
  expect(option).toHaveTextContent("Show sick leave policy");
  expect(input).toHaveAttribute("aria-activedescendant", option.id);
  await userEvent.keyboard("{Enter}");
  expect(input).toHaveValue("Show sick leave policy");
  expect(screen.queryByRole("listbox")).toBeNull();
  await userEvent.clear(input);
  await userEvent.type(input, "show");
  await screen.findByRole("listbox");
  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("listbox")).toBeNull();
  expect(input).toHaveFocus();
  vi.mocked(api).mockReset();
});
async function submitQuestion() {
  await userEvent.type(
    screen.getByLabelText("Ask about a company policy"),
    "What is the annual leave entitlement?",
  );
  await userEvent.click(screen.getByRole("button", { name: /^Ask Cortex$/ }));
}
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

test("ledger results and related snippets render with distinct source treatment", async () => {
  vi.mocked(api).mockResolvedValueOnce({
    ...result,
    source: "leave_ledger",
    answer: "Personal leave balance",
    display_name: "Arya Dhumal",
    citations: [],
    balances: [
      { leave_type_id: "annual", name: "Annual leave", balance_days: 17 },
    ],
    related_results: [
      {
        clause_id: "sick",
        document_id: "sick-doc",
        title: "Sick leave policy",
        locator: "TXT line 2",
        excerpt: [
          { text: "leave", matched: true },
          { text: " <b>policy</b>", matched: false },
        ],
      },
    ],
  });
  render(<Assistant />);
  await submitQuestion();
  expect(
    await screen.findByRole("heading", {
      name: "Leave balance for Arya Dhumal",
    }),
  ).toBeVisible();
  expect(screen.getByText(/Source: Leave ledger/)).toBeVisible();
  expect(screen.getByText("17 days")).toBeVisible();
  expect(
    screen.getByRole("link", { name: "Sick leave policy" }),
  ).toHaveAttribute("href", "/documents/sick-doc");
  expect(document.querySelector(".fb-related mark")).toHaveTextContent("leave");
  expect(document.querySelector(".fb-related b")).toBeNull();
  expect(screen.queryByText("Supporting evidence")).toBeNull();
});
test("question uses backend result and opens the authorized exact source", async () => {
  vi.mocked(api).mockResolvedValueOnce(result).mockResolvedValueOnce(source);
  render(<Assistant />);
  await userEvent.type(
    screen.getByLabelText("Ask about a company policy"),
    "How many leave days?",
  );
  await userEvent.click(screen.getByRole("button", { name: "Ask Cortex" }));
  expect(await screen.findByText(result.answer)).toBeInTheDocument();
  expect((await screen.findAllByText(quote))[0]).toBeInTheDocument();
  expect(api).toHaveBeenNthCalledWith(2, "/queries/query/citations/cite");
  expect(screen.getAllByText(quote)).toHaveLength(1);
  await userEvent.click(
    screen.getByRole("button", { name: "View source context" }),
  );
  expect(document.querySelector("mark")?.textContent).toBe(quote);
});
test("changing the as-of date removes stale answer and source", async () => {
  vi.mocked(api).mockResolvedValueOnce(result).mockResolvedValueOnce(source);
  render(<Assistant />);
  await submitQuestion();
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
  await submitQuestion();
  await screen.findAllByText(quote);
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
  await submitQuestion();
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
  await submitQuestion();
  await screen.findByText(result.answer);
  await userEvent.clear(screen.getByLabelText("Ask about a company policy"));
  await userEvent.type(
    screen.getByLabelText("Ask about a company policy"),
    "What is my notice period?",
  );
  expect(document.querySelector(".question-bubble")?.textContent).toBe(
    "What is the annual leave entitlement?",
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
  await submitQuestion();
  await screen.findByText(result.answer);
  await userEvent.click(screen.getByRole("button", { name: /Second source/ }));
  await screen.findByRole("heading", { name: "Second source" });
  await userEvent.click(
    await screen.findByRole("button", { name: "View source context" }),
  );
  release(source);
  await waitFor(() =>
    expect(document.querySelector("pre")?.textContent).toBe(second.text),
  );
  expect(
    screen.queryByRole("heading", { name: source.title }),
  ).not.toBeInTheDocument();
});

test("a follow-up draft typed during loading survives the response", async () => {
  let release: (answer: Answer) => void = () => {};
  vi.mocked(api)
    .mockImplementationOnce(
      () =>
        new Promise<Answer>((resolve) => {
          release = resolve;
        }),
    )
    .mockResolvedValueOnce(source);
  render(<Assistant />);
  await submitQuestion();
  await userEvent.type(
    screen.getByLabelText("Ask about a company policy"),
    "What is my notice period?",
  );
  release(result);
  await screen.findByText(result.answer);
  expect(screen.getByLabelText("Ask about a company policy")).toHaveValue(
    "What is my notice period?",
  );
});

test("a completed query releases the composer while its source is still checking", async () => {
  let release: (value: Source) => void = () => {};
  vi.mocked(api)
    .mockResolvedValueOnce(result)
    .mockImplementationOnce(
      () =>
        new Promise<Source>((resolve) => {
          release = resolve;
        }),
    );
  render(<Assistant />);
  await submitQuestion();
  await screen.findByText(result.answer);
  expect(
    screen.queryByText("Checking policy access, dates and authority…"),
  ).not.toBeInTheDocument();
  expect(screen.getByText("Checking source access…")).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Policy answer" })).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await userEvent.type(
    screen.getByLabelText("Ask about a company policy"),
    "What is my notice period?",
  );
  expect(screen.getByRole("button", { name: /^Ask Cortex$/ })).toBeEnabled();
  release(source);
  await screen.findByText(quote);
});

test("an invalidated query cannot finish a newer query's processing state", async () => {
  let first: (value: Answer) => void = () => {};
  let second: (value: Answer) => void = () => {};
  vi.mocked(api)
    .mockImplementationOnce(
      () =>
        new Promise<Answer>((resolve) => {
          first = resolve;
        }),
    )
    .mockImplementationOnce(
      () =>
        new Promise<Answer>((resolve) => {
          second = resolve;
        }),
    );
  render(<Assistant />);
  await submitQuestion();
  await userEvent.selectOptions(
    screen.getByLabelText("Policy scope"),
    "india_contractor",
  );
  await userEvent.type(
    screen.getByLabelText("Ask about a company policy"),
    "What is my notice period?",
  );
  await userEvent.click(screen.getByRole("button", { name: /^Ask Cortex$/ }));
  first(result);
  await waitFor(() =>
    expect(
      screen.getByRole("region", { name: "Policy answer" }),
    ).toHaveAttribute("aria-busy", "true"),
  );
  expect(screen.queryByText(result.answer)).not.toBeInTheDocument();
  second({
    ...result,
    scope: { ...result.scope, population: "india_contractor" },
    answer: "No applicable evidence.",
    citations: [],
    status: "abstained",
  });
  await screen.findByText("No applicable evidence.");
  expect(screen.getByRole("region", { name: "Policy answer" })).toHaveAttribute(
    "aria-busy",
    "false",
  );
});

const alternative: Source = {
  ...source,
  id: "cite-b",
  title: "Alternative policy",
  quote: "Employees receive 25 working days.",
  text: "Title\n\nEmployees receive 25 working days.\n",
  end_char: 7 + "Employees receive 25 working days.".length,
  authority_rank: 100,
};
const conflicting: Answer = {
  ...result,
  status: "abstained",
  reason_code: "UNRESOLVED_CONFLICT",
  answer:
    "Equally authoritative policies disagree. I cannot choose between them.",
  citations: [{ ...source, authority_rank: 100 }, alternative],
};

test("conflict comparison reads every source and renders authorized exact spans", async () => {
  vi.mocked(api)
    .mockResolvedValueOnce(conflicting)
    .mockResolvedValueOnce(source)
    .mockResolvedValueOnce(alternative);
  render(<Assistant />);
  await submitQuestion();
  await screen.findByText(alternative.quote);
  expect(screen.getByText(quote)).toBeInTheDocument();
  expect(api).toHaveBeenNthCalledWith(2, "/queries/query/citations/cite");
  expect(api).toHaveBeenNthCalledWith(3, "/queries/query/citations/cite-b");
  expect(screen.getByText(conflicting.answer)).toBeInTheDocument();
  expect(screen.queryByText("Approved · valid")).not.toBeInTheDocument();
});

test("a pending conflict source keeps both excerpts hidden and releases query loading", async () => {
  let release: (value: Source) => void = () => {};
  vi.mocked(api)
    .mockResolvedValueOnce(conflicting)
    .mockResolvedValueOnce(source)
    .mockImplementationOnce(
      () =>
        new Promise<Source>((resolve) => {
          release = resolve;
        }),
    );
  render(<Assistant />);
  await submitQuestion();
  await screen.findByText("Checking source access for both policies…");
  expect(screen.queryByText(quote)).not.toBeInTheDocument();
  expect(screen.queryByText(alternative.quote)).not.toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Policy answer" })).toHaveAttribute(
    "aria-busy",
    "false",
  );
  release(alternative);
  await screen.findByText(alternative.quote);
});

test("one denied conflict source clears the whole comparison and abstention", async () => {
  vi.mocked(api)
    .mockResolvedValueOnce(conflicting)
    .mockResolvedValueOnce(source)
    .mockRejectedValueOnce(new ApiError(404, "Resource unavailable"));
  render(<Assistant />);
  await submitQuestion();
  await screen.findByRole("alert");
  expect(screen.queryByText(quote)).not.toBeInTheDocument();
  expect(screen.queryByText(alternative.quote)).not.toBeInTheDocument();
  expect(screen.queryByText(conflicting.answer)).not.toBeInTheDocument();
});

test("an invalidated comparison cannot restore excerpts after scope changes", async () => {
  let release: (value: Source) => void = () => {};
  vi.mocked(api)
    .mockResolvedValueOnce(conflicting)
    .mockResolvedValueOnce(source)
    .mockImplementationOnce(
      () =>
        new Promise<Source>((resolve) => {
          release = resolve;
        }),
    );
  render(<Assistant />);
  await submitQuestion();
  await screen.findByText("Checking source access for both policies…");
  await userEvent.selectOptions(
    screen.getByLabelText("Policy scope"),
    "india_contractor",
  );
  release(alternative);
  await waitFor(() =>
    expect(screen.queryByText(alternative.quote)).not.toBeInTheDocument(),
  );
  expect(screen.queryByText(conflicting.answer)).not.toBeInTheDocument();
});
