# Exact Phase 3 sequence and timeboxing

**Start only after explicit Phase 2 approval.** Deadline2026-10-10; owner hardware/team/hours and academic40% rubric unknown. No progress percentage is asserted. A estimates13–26h; an8–12h single-developer window likely needs partial delivery.

1. A01: verify Python/Node/SQLite/FTS5; lock dependencies; create backend/frontend skeleton and relational migrations. Run schema smoke first.
2. A02: bootstrap local demo users; implement opaque sessions, CSRF/Origin and disabled-user/expiry tests. Frontend login then consumes actual session endpoint.
3. A03: define scoped repositories, explicit READ grants and revision/gate semantics. Run full unauthorized/cross-tenant direct-resource tests before indexing text.
4. A04–A05: ingest TXT, immutable clauses/hash/locators, reviewed metadata and atomic publication. Add text PDF and DOCX after TXT path proves stable.
5. A06: deterministic date/scope/approval eligibility and simple supersession; run future/historical/exact-boundary cases.
6. A07: permitted FTS IDs, authorized hydration and token scoring; verify hidden canary absent from every stage. UI library can now list real permitted data.
7. A08–A09: governing source-kind rules, authority, full permitted peer expansion, structured conflicts, evidence answer/abstention and validated citations. No model yet.
8. A10: connect assistant date/scope, states and exact source pane; test real browser query-source flow. Never hardcode fixture answers in functional UI.
9. A11–A12: minimal upload/review/detail/grants UI, dashboard and sanitized audit; run revocation/history/citation checks. Keep backend enforcement regardless of UI completeness.
10. A13: seed exact fictional corpus, run D01–D12 and MVP gate; measure latency and record hardware/commit; prepare honest live walkthrough and named remaining gaps.
11. After A: B01/B02 lineage and evaluation depth first, B03/B04/B05 only when needed and measurable; C capabilities require new evidence/ADR.

## Suggested checkpoints, not guaranteed timings

| Focused time after approval | Checkpoint | If behind |
|---|---|---|
| 0–3h | Schema, sessions and ACL contracts tested | Delay UI polish; do not skip auth tests |
| 3–6h | TXT→review→authorized valid retrieval | Defer optional formats briefly; report parser gaps |
| 6–9h | Authority/conflict/citations plus assistant | Use evidence mode; no embeddings/model |
| 9–12h | Revocation checks and essential live scenario set | Freeze scope; partial gate explicitly reported |
| Additional3–14h / team capacity | PDF/DOCX, review/admin UI, complete all gates | No claim of full A without passing evidence |

Independent frontend track: app shell/tokens/components using typed mock contract only until endpoints are ready; clearly distinguish mocks from live data. Independent testing track: fixture labels, route matrix and expected outputs. Shared integration contract: API_DESIGN, DATABASE_SCHEMA, RAG_PIPELINE. Implementation changes to any contract require ADR/log update rather than silent drift.

Stop rules: any access violation blocks release of that flow; ambiguous scope/interval/authority must abstain; no latest-upload fallback; model outage never blocks evidence mode; no cloud/API spend. Before demo, run appropriate checks after final changes, review staged files, commit/push without force and verify remote HEAD. Record exact outcomes, failures and uncommitted state.
