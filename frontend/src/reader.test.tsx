import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { readingPages, sourceSlice, contextRange } from "./sourceText";
import { MarkedText } from "./SourceMarkup";
import DocumentReader from "./DocumentReader";
import { groupConflicts } from "./conflictGroups";
import type { Answer, Citation } from "./types";

test("API code-point offsets preserve astral characters and escaped source", () => {
  const text = "Header 🚀\n\nClause 2.1: 20 days <script>\nEnd",
    quote = "20 days <script>",
    start = Array.from(text.slice(0, text.indexOf(quote))).length;
  expect(sourceSlice(text, start, start + Array.from(quote).length)).toBe(
    quote,
  );
  const { container } = render(
    <MarkedText text={text} evidence={{ start, end: start + quote.length }} />,
  );
  expect(container.querySelector("mark")?.textContent).toBe(quote);
  expect(container.querySelector("script")).toBeNull();
  expect(container.textContent).toBe(text);
});
test("reading pages retain every character through long paragraphs, CRLF and tables", () => {
  const text =
    "Title\r\n" +
    "A 🚀".repeat(1800) +
    "\n\nField | Value\nOwner | Fictional council\nLast line";
  const pages = readingPages(text);
  expect(pages.length).toBeGreaterThan(1);
  expect(
    pages
      .flat()
      .map((b) => b.text)
      .join(""),
  ).toBe(text);
  const tail = Array.from(text).length - 9,
    range = contextRange(text, { start: tail, end: tail + 9 });
  expect(range.end).toBe(Array.from(text).length);
  expect(range.start).toBeLessThan(tail);
});
test("reader opens the cited reading page and exact match navigation preserves text", async () => {
  const before = "1. Context\n" + "Useful context paragraph.\n".repeat(240),
    quote = "Unique entitlement 20 days.",
    text = before + quote + "\n" + "Other section\n".repeat(160) + quote;
  const start = Array.from(before).length;
  const { container } = render(
    <DocumentReader
      text={text}
      title="Long source"
      evidence={{ start, end: start + quote.length }}
    />,
  );
  expect(
    container.querySelector('mark[data-highlight="evidence"]')?.textContent,
  ).toBe(quote);
  const selected = screen.getByLabelText("Reading page") as HTMLSelectElement;
  expect(Number(selected.value)).toBeGreaterThan(0);
  await userEvent.click(screen.getByText("Sections & text search"));
  await userEvent.type(screen.getByLabelText("Find exact text"), quote);
  await userEvent.click(screen.getByRole("button", { name: "Next match" }));
  expect(screen.getByText("2 of 2")).toBeInTheDocument();
  await waitFor(() =>
    expect(
      container.querySelector('mark[data-highlight="match"]')?.textContent,
    ).toBe(quote),
  );
  expect(container.querySelectorAll(".reader-paper")).toHaveLength(1);
});
const claim = {
  document_id: "doc",
  version_id: "v",
  clause_id: "clause",
  source_hash: "hash",
  start_char: 50,
  end_char: 70,
  reviewed_value: 2,
  valid_from: "2026-01-01",
  valid_to: null,
  source_kind: "operations_policy",
  authority_rank: 100,
} as Citation;
const q = {
  query_id: "q1",
  as_of: "2026-10-10",
  scope: { population: "india_full_time", jurisdiction: "IN" },
  reason_code: "UNRESOLVED_CONFLICT",
  citations: [
    { ...claim, id: "a" },
    {
      ...claim,
      id: "b",
      document_id: "doc-b",
      clause_id: "other",
      reviewed_value: 3,
    },
  ],
} as Answer;
test("conflicts group stable authorized claims, preserve occurrences and split changed scope/hash", () => {
  const another = {
    ...q,
    query_id: "q2",
    created_at: "2026-10-10T01:00:00Z",
    citations: q.citations.map((c) => ({ ...c, id: c.id + "-new" })).reverse(),
  };
  const changed = {
    ...q,
    query_id: "q3",
    citations: q.citations.map((c) => ({ ...c, source_hash: "changed" })),
  };
  const otherDate = { ...q, query_id: "q4", as_of: "2026-10-09" };
  const groups = groupConflicts([q, another, changed, otherDate]);
  expect(groups).toHaveLength(3);
  expect(groups[0].occurrences.map((r) => r.query_id)).toEqual(["q1", "q2"]);
  expect(groups.flatMap((g) => g.occurrences)).toHaveLength(4);
  const incomplete = {
    ...q,
    query_id: "q5",
    citations: q.citations.map((c) => ({ ...c, clause_id: "" })),
  };
  expect(
    groupConflicts([incomplete, { ...incomplete, query_id: "q6" }]),
  ).toHaveLength(2);
});
