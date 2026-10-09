# Testing and evaluation strategy

**Tests specified before implementation; none of these application tests have run.** Separate tomorrow's pass/fail integration gate from later academic measurements.

## Test layers and ownership

| Layer | Planned tests | Future files |
|---|---|---|
| Unit | interval endpoints; source-kind eligibility; scoped authority; equal-rank conflict; exception negatives; token escaping; citation offsets/hash | backend/tests/unit/test_temporal.py, test_authority.py, test_conflicts.py, test_retrieval.py, test_citations.py |
| Database | same-tenant FKs; subject XOR; interval/open-ended checks; acyclic lineage; publication rollback/index consistency | backend/tests/integration/test_schema.py, test_publication.py |
| API security | every resource route tenant/owner/READ/action; list/count/title safety; CSRF/Origin; cookie expiry; user disable; grant revocation | backend/tests/integration/test_authorization.py, test_sessions.py, test_revocation.py |
| Model-stage instrumentation | intercept evidence passed to ranker, conflict and answerer; no forbidden IDs/text/canaries | backend/tests/integration/test_evidence_boundary.py |
| Ingestion | TXT/PDF/DOCX; scanned/encrypted unsupported; MIME mismatch; malformed/oversized/archive/path attacks; timeout | backend/tests/integration/test_ingestion.py |
| Frontend | screen states, as-of/scope display, citations, 401 handling, stale answer clearing, keyboard focus | frontend/src/**/__tests__/*.test.tsx |
| E2E | D01–D12 via two users/browser contexts, actual ACL update and source opening | frontend/e2e/demo.spec.ts |
| Documentation | links, source manifests, Mermaid syntax/render, image readability, fixture hashes | docs/planning/QUALITY_REVIEW.md and Git audit |

## Mandatory security matrix

Cross-test every content-bearing route in API_DESIGN with permitted same-user, denied same-tenant, different tenant, disabled user, expired session, revoked role/grant, guessed ID and omitted metadata. Both operation permission and READ must be checked. Forbidden canary must not appear in model inputs, answer, citation, browser-visible explanations/history, logs or aggregates. No finite suite proves universal non-disclosure; direct host/database compromise is outside this pilot boundary.

Revocation tests pause between hydration and response, mutate grants with write gate, then resume; check well-defined commit ordering, revision mismatch discard and saved-answer reauthorization. No test relies only on UI hiding. Never use a real confidential corpus in an unfiltered diagnostic.

## Metrics and definitions

| Metric | Formula / method | A gate / B target (provisional) |
|---|---|---|
| Retrieval recall@20 | relevant authorized applicable clauses in candidate pool / gold relevant authorized applicable clauses | All essential fixture evidence present; B >=0.90 on held-out labels |
| Temporal correctness | correct eligible clause sets / time-labeled queries; also count invalid included clauses | D03,D04,D11 exact pass; B >=0.95 with zero invalid context in labeled gate |
| Authority correctness | correct strongest source decision / labeled authority cases | D05 and note-only abstention pass; B >=0.95 |
| Conflict precision/recall/F1 | TP/(TP+FP), TP/(TP+FN), harmonic mean on independently labeled pairs and end-to-end queries | D06 positive + D10/date/exception negatives pass; B F1>=0.85, report retrieval misses separately |
| Citation support / coverage | supported cited claims / all cited claims; supported cited factual claims / all factual claims | A exact values/quotes and all factual claims cited; B human-scored >=0.95 support and coverage |
| Abstention accuracy | correct answer/abstain/clarify class / labeled queries; separate false-answer and false-abstention rates | D06,D07,D08 exact; B selective accuracy>=0.95 at >=0.70 coverage on answerable set |
| Access violations | unauthorized ID/text entering any protected stage or payload; report count/attempts per surface | Zero observed across bounded matrix; any violation blocks demo/release |
| Revocation correctness | stale dependency reads after committed revocation / attempts | Zero observed; browser already-viewed text cannot be recalled |
| Latency | end-to-end p50/p95, separately parse/model stages; 5 warmups +100 runs; record CPU/RAM/corpus/concurrency | Evidence-mode p95<2 s target on local 500-clause fixture, not measured; no local-model promise |
| Reproducibility | seed/data hashes, locked versions, environment, repeated-run decision equality | Exact A decisions repeat; record all conditions |

These are design acceptance targets, not reported findings. Full 12-case fixture is too small for academic claims or stable precision/recall confidence intervals. B expands to 100–200 policy clauses and 300–500 queries after pilot review, split by policy family to reduce leakage. Include paraphrases, missing candidates, scope negatives, partial amendments, forged metadata, absent evidence and prompt/fact poisoning. Independent label review with disagreements documented; thresholds tuned only on development split. Report bootstrap confidence intervals by policy family and all failure strata when sample size permits.

## Comparisons and ablations

Hold authorization constant for every end-user baseline. Compare keyword vs hybrid; newest-upload vs explicit validity on fictional diagnostic data; +authority; +conflict; +support/abstention; fixed workflow vs bounded optional planner. Use identical generator/config and candidate budgets. An unfiltered fictional diagnostic may measure failure modes offline only, never as an application mode. RAGAs/LLM judges optional and calibrated against human labels, never sole access/correctness evaluator. Prior basis: [BEIR](https://arxiv.org/abs/2104.08663), [ALCE](https://arxiv.org/abs/2305.14627), [RAGAs](https://aclanthology.org/2024.eacl-demo.16/), [HoH](https://aclanthology.org/2025.acl-long.301/).
