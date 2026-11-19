# Selected before-and-after edits

The baseline is the Markdown at `5564e75`. The full Markdown diff is available in [draft PR #10](https://github.com/NoirPrimordial7/cortex-ai/pull/10/files).

| Location | Before | After and reason |
|---|---|---|
| Abstract | “The system emits a templated answer only when its selected evidence supports it or when a current, verified Auditor decision resolves the exact conflict.” | “The strict path verifies cited text before returning a value,” including the Auditor route. This removes the suggestion that a human choice bypasses support verification. |
| Introduction | “The drafting workflow constructed and evaluated this corpus.” | “The study defined the applicability and disagreement labels before execution with Codex assistance.” The new labels still await independent adjudication. |
| RQ1 | “How do reviewed approval, scope and effective-date filtering affect policy selection…” | “How does effective-date filtering change selection relative to publication recency when approval and scope are held fixed?” This matches the comparator script. |
| Eligibility | “approved current metadata with an active authority rule” | Defines indexed status, reviewed clause, active rule and matching claim revision. The displayed predicate and missing-end convention are retained. |
| Peer expansion | “sorts authorized text by token occurrence” | “orders them by the number of distinct query tokens found as substrings and breaks ties by clause ID.” States limits and the evidence boundary at the application level. |
| Citation verification | “the reviewed integer appears as a whole numeric match” | “The reviewed integer must appear without an adjacent digit.” Also specifies character offsets and the hexadecimal digest encoding used by the code. |
| New results | “2/2 precision and 2/2 recall” | “Both positive questions were detected and none of the 14 negative questions was flagged.” The next sentence names the one dispute. Counts and denominators are preserved without presenting a broad performance estimate. |
| Passage comparison | “a low designated-source count can reflect output deduplication as well as retrieval” | “the observed count combines retrieval and deduplication.” The two modes retain their original sample counts and latency measurements. |

The corresponding author, exact authorship order, affiliation wording, disclosure language, and novelty framing remain for all four authors to approve. The source record of Codex assistance was preserved.
