import type { Answer } from "./types";
/** Only group current, server-authorized history with complete stable identities. */
export function groupConflicts(items: Answer[]) {
  const groups = new Map<string, { key: string; occurrences: Answer[] }>();
  for (const q of items) {
    const complete =
      q.citations.length > 1 &&
      q.citations.every(
        (c) =>
          c.document_id &&
          c.version_id &&
          c.clause_id &&
          c.source_hash &&
          Number.isInteger(c.start_char) &&
          Number.isInteger(c.end_char),
      );
    const claims = q.citations
      .map((c) =>
        JSON.stringify([
          c.document_id,
          c.version_id,
          c.clause_id,
          c.source_hash,
          c.start_char,
          c.end_char,
          c.reviewed_value,
          c.valid_from,
          c.valid_to,
          c.source_kind,
          c.authority_rank,
        ]),
      )
      .sort();
    const key = complete
      ? JSON.stringify([
          q.reason_code,
          q.as_of,
          q.scope.population,
          q.scope.jurisdiction,
          claims,
        ])
      : q.query_id;
    const group = groups.get(key);
    if (group) group.occurrences.push(q);
    else groups.set(key, { key, occurrences: [q] });
  }
  return [...groups.values()];
}
