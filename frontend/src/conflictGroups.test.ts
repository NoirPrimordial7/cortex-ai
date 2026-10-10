import { expect, test } from "vitest";
import { groupConflicts } from "./conflictGroups";
import type { Answer, Citation } from "./types";
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
