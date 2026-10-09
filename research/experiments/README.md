# Proposed experiment registry — no experiments executed

Phase 1 produces experiment designs only. The following proposed protocol is for Phase 2 review, not implemented tooling, data or measured results.

## Research question and fixture design

Does explicit authorization, valid-time and authority-aware evidence selection improve reliable policy answering over matched retrieval/recency baselines? Start with invented HR/travel/SOP documents whose correct policies and user scopes are independently labeled. Add licensed public versioned policies to probe external validity; public text alone does not provide enterprise ACL ground truth.

Proposed strong-project corpus: 100–200 documents/clauses and 300–500 reviewed queries, adjusted after an annotation pilot. Include ordinary unambiguous answers; historical dates; future-effective/draft policies; expired reuploads; retroactive changes; partial amendments; authority disputes; simultaneous equal-authority contradictions; permitted/denied/mixed-access evidence; ACL revocation; empty evidence; injection instructions and subtly poisoned facts. Include non-conflict paraphrases, different populations and exceptions to measure false alarms.

Keep approved metadata as ground truth in the first study. A later extraction study perturbs missing/ambiguous/incorrect metadata separately; do not combine metadata errors with reasoning errors without decomposition. No authentic confidential content is required.

## Labeling and leakage prevention

Record allowed evidence IDs/spans per role and date, applicable policy value, conflict label, expected answer/abstention state and rationale. Two reviewers independently label a subset and adjudicate disagreements; report inter-annotator agreement and label changes. If a second reviewer is unavailable, disclose that limitation and audit a reserved subset.

Split by policy family/template lineage so paraphrases and near-identical versions do not leak across train/development/test. Freeze test data and hashes before tuning thresholds; preserve balanced hard negatives and multiple roles per question. Hold real public-policy subset out from synthetic template tuning. Version every corpus, query set and ACL matrix.

## Proposed comparisons

| Run | Change being isolated | Interpretation |
|---|---|---|
| B0 | BM25 + identical generator with mandatory ACL boundary | Keyword retrieval reference |
| B1 | Vector-only, same corpus/generator/budget and ACL | Semantic retrieval reference |
| B2 | Hybrid fusion, optional rerank measured separately, same ACL | Retrieval reference before reliability logic |
| B3 | B2 plus latest-upload/recency rule | Tests naïve temporal heuristic |
| C1 | B2 plus explicit validity/lineage | Isolates time-policy effect |
| C2 | C1 plus authority | Isolates approval/precedence effect |
| C3 | C2 plus scoped conflict checks | Measures conflict accuracy and answer impact |
| C4 | C3 plus support verification/abstention | Measures risk–coverage trade-off |
| C5 optional | C4 plus bounded retrieval planner | Measures benefit per added call/latency |

Authorization is mandatory for every exposed answering variant. To measure its contribution, an intentionally unfiltered **offline synthetic-only** diagnostic may inspect canary passage inclusion; it must never use real protected data or be presented as a deployable baseline. Ablate temporal/authority/conflict modules one at a time; matched cumulative runs alone cannot isolate interactions. Where resource/licensing allows, compare concepts from Re³/TimelyRAG with correct attribution; no reproduction is currently promised.

## Measurements and denominators

- Recall@k = gold permitted/applicable evidence recovered divided by gold evidence count; nDCG@k uses reviewed relevance/applicability judgments. Record candidate recall before reranking so filters cannot hide retrieval failures.
- As-of/authority answer accuracy = correct policy answers / answerable queries in each stratum; report answered-only and all-query results. Separate evidence selection correctness from generated correctness.
- Conflict precision/recall/F1 with matched non-conflict controls, plus false-positive rate. Unretrieved conflicting evidence is a candidate-recall failure, not a successful conflict resolution.
- Citation precision = supported cited claims / cited claims; coverage = supported factual claims with evidence / factual claims requiring evidence. Audit automatic entailment judgments with humans.
- Unauthorized-context rate = queries where any unauthorized content/ID reaches any model stage / permission test queries. Separately measure answer/trace canary disclosure. Report test count and conditions; zero observed leakage is not proof of universal safety.
- Revocation correctness and stale-hit rate after policy change; cross-user cache/chat-history tests; tool responses and explanation artifacts included.
- Selective accuracy versus coverage across thresholds; correct abstention and false abstention by reason; unsafe confident-answer rate. A system that always abstains cannot win by accuracy alone.
- End-to-end and stage p50/p95 latency, retrieval/model calls, tokens if available, peak RAM and local resource use. Include errors/timeouts in outcomes rather than silently dropping them.

## Reproducibility and analysis

Pin dependencies, model IDs/revisions, source commits, seeds, prompts, chunking, index/search parameters, datasets, hardware and inference settings. Use identical generator and evidence budget for matched comparisons; document nondeterminism and repeat suitable runs. Report paired differences and bootstrap confidence intervals clustered by policy family where possible; do not treat role variants as independent samples. Tune on development only; publish failure strata and negative outcomes. Calibrate any RAGAs/LLM judge against human labels and avoid an expensive proprietary judge as the sole evaluator.

Proposed acceptance gate: no unauthorized evidence in the defined controlled tests, trace/citation access consistency, and measurable reliability gains at useful coverage relative to B2/B3, with acceptable resources set during planning. Numeric quality/latency targets and sample sizes are pending review. No result, p-value, speedup or security proof exists yet.
