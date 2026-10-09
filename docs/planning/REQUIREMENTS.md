# Cortex AI requirements

**Phase 2 plan · 2026-10-09 · owner review required before Phase 3.** This document specifies intended behavior; no functional application exists. Deadline: a meaningful working demonstration on 2026-10-10, not a claim that the college's undefined 40% rubric is met.

## Scope and users

A local, single-company pilot answers bounded HR and operational policy questions using reviewed fictional documents. Schema and repository contracts include tenant isolation from day one; hosted multi-tenant service is outside Milestone A. Employee asks questions; knowledge manager uploads and reviews policies; tenant administrator manages identities and access; auditor reads sanitized security activity. One person may hold several roles, but roles never automatically grant document content access.

| ID | Requirement | Gate / backlog |
|---|---|---|
| R01 | Backend-authenticated sessions, logout, disabled-user rejection | A02 |
| R02 | Current tenant and role permissions plus explicit document READ grant on every content path | A03 |
| R03 | Bounded TXT, text PDF and DOCX ingestion; quarantined until extraction/metadata review succeeds | A04–A05 |
| R04 | Immutable version bytes/text, hashes and locators; separately reviewed approval, scope and date metadata | A05–A06 |
| R05 | Keyword retrieval over authorized clauses; no unrestricted snippets or totals | A07 |
| R06 | Explicit as-of date; approved applicable clauses satisfy half-open validity intervals | A06–A08 |
| R07 | Topic-specific authority preference; no authority override of access or validity | A08 |
| R08 | Structured equal-authority conflicts cause cited conflict abstention; exceptions/amendments are distinguished | A08 |
| R09 | Extractive answers and citations function offline with no LLM; missing/ambiguous evidence abstains | A09 |
| R10 | Citation/detail/history access rechecked; revocation invalidates pending and saved answers | A03, A09–A10 |
| R11 | Login, dashboard, assistant, library, upload, detail/history, conflicts, permissions and activity views | A10–A11, B06 |
| R12 | Redacted audit trail and deterministic fictional scenario suite | A12–A13 |
| R13 | Optional local generator, semantic retriever and NLI behind replaceable interfaces, disabled initially | B03–B05 |

## Nonfunctional contracts

- Fail closed on missing identity, tenant, grants, scope, approval, validity or authority review. Null valid_to means explicitly reviewed open-ended validity; null valid_from is invalid.
- Unauthorized content must not enter any model, reranker, conflict comparator, answer payload, browser trace or citation. Global ranking statistics can still create side channels; Milestone A avoids global FTS BM25 scores and ranks only authorized text.
- Same-origin cookie session; no browser-stored bearer token. Mutations require CSRF token and Origin validation. Localhost HTTP is an explicit local demonstration exception; non-loopback deployment requires HTTPS.
- No paid services, required cloud account or model download. Runtime/model downloads and dependency locks occur only in Phase 3. Target basic CPU/8 GB RAM feasibility; hardware and actual latency remain unverified.
- Accessibility target WCAG 2.2 AA, keyboard operation, visible focus and text status labels; no claim of certification before testing.
- Trace every meaningful update through ADRs, changelog, development log and verified commits. Only fictional data goes into public Git history.

## Tomorrow's bounded objective

Run a single browser-to-backend vertical slice with two users, explicit ACLs, 11 fictional versions, deterministic dates/conflicts, cited evidence and revocation checks. Prefer all nine essential scenarios over adding embeddings or a fluent model. PDF/DOCX acceptance is text-bearing input only; OCR, arbitrary legal interpretation, live connectors, SSO, enterprise certification and autonomous agents are excluded.

Budget assumption: one developer and roughly 8–12 focused hours after approval. Full A backlog is approximately 13–26 hours including integration; tomorrow delivery is at risk unless time/team permit. Cut polish and optional parsers first, never access checks. A minimum TXT-only slice must be labeled partial and cannot pass the full MVP gate.

## Research traceability

The [approved research summary](../RESEARCH_SUMMARY.md), [gaps](../RESEARCH_GAPS.md) and [architecture observations](../ARCHITECTURE_NOTES.md) justify this bounded integration. Permission-aware products already exist; temporal validity and conflict handling overlap [TimelyRAG](https://arxiv.org/abs/2609.11572) and [Re³](https://aclanthology.org/2026.acl-long.1180/). Our contribution is measurable engineering and evaluation, not novelty of the individual features.
