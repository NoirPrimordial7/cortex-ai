# Phase 3 implementation checkpoint

Assessment: 2026-10-09, Asia/Calcutta. Phase 2 and Evidence Studio were owner-approved; this is real local application code. Research/planning documents remain preserved baselines; [ADR 0005](../decisions/0005-local-execution-boundary.md) records implementation deviations. No project completion percentage is asserted: the college 40% rubric is still unknown.

| Module / actual source | Implemented behavior | Boundary or next work |
|---|---|---|
| `backend/app/security.py`, `main.py` | Argon2id; opaque cookie sessions; CSRF/Origin; current action roles and explicit user/role document READ | Local HTTP only; in-memory login throttling; complete denied-attempt audit not implemented |
| `backend/app/db.py`, migrations | 21 domain tables, tenant-safe references/checks, FTS5, policy/knowledge revisions | SQLite, one application worker; no PostgreSQL deployment |
| `documents.py`, `parser_worker.py` | Private immutable TXT/PDF/DOCX bytes/text/hash/locators; bounded child extraction; failed/pending state; trusted review | Synchronous extraction, no OCR, no OS sandbox, one reviewed numeric evidence span/version |
| `pipeline.py` | Authorized/date/scope/approval candidates before text; lexical retrieval/peer expansion; reviewed source authority; conflict/abstention; exact citations | Four finite topics; reviewer-labelled claims, not semantic/NLI detection or general-purpose LLM RAG |
| Query/history/source endpoints | Persist owner-only dependencies and reauthorize each read; whole-result withholding after tenant revision change | Seven-day read retention, no cleanup scheduler; conservative invalidation may hide otherwise safe history |
| Governance endpoints | Existing-user roles and enable/disable; document grants with expected revision; sanitized successful audit | No user creation, authority-rule editing or general supersession editing |
| React shell/login/dashboard | Real session, permission-dependent navigation, actual permitted counts/history, light/dark themes | Frontend hiding is only usability; backend is authoritative |
| React assistant/library/detail | Real query/source calls; as-of/scope; escaped exact passages; conflicts; version metadata/download; upload/review | Finite answer mode explicitly labelled; no fabricated confidence/analytics |
| React permissions/history/audit | API-backed grants/roles, own history/citation inspection, auditor event table | Permission mutations verified in API tests; browser QA inspected controls without altering grants |
| `session.tsx`, `components.tsx` | In-memory session/CSRF; abort/stale-response guards; revision checks every 15 seconds/on focus; visible evidence invalidation | Already seen information cannot be recalled; ongoing browser polling does not replace server checks |

## What changes from the plan

The initial implementation uses a **global exclusive process lock** and a transaction for every protected request, instead of the planned tenant reader/writer gate. Revocation mutations queue behind current evidence processing; later reads use new permissions. This makes the race boundary inspectable but serializes tenants and long uploads. Database access uses SQLAlchemy Core, not ORM models. Extraction is synchronous despite a recorded job and `202` response; there is no background queue.

Uniform document ACLs are required before review publication. The initial claim is one manually reviewed numeric span, checked against immutable extracted text. Seeded supersession relationships record provenance; selection relies on validity intervals. Partial amendments/exceptions, chunk ACLs and semantic conflicts remain unimplemented. A numeric occurrence verifies the span contains the number, not that a reviewer interpreted it correctly.

The UI groups documents in its library and exposes versions on detail. It labels the newest arrival **Latest upload**, rather than implying that version is effective. Dashboard counts come from current access and own history; the Phase 2 fictional analytics were not copied into live product claims. The initial assistant shows the winning source's actual authority rank; a detailed explanation for every lower-ranked rejected source remains future work.

## Current security contract

Authentication proves who is asking; roles permit actions; document grants permit evidence access. Admin/uploader status alone does not bypass READ. Current ACLs apply even to historical questions. Restricted clause text is not hydrated into retrieval reranking, peer comparison, answer construction or user-visible traces. Parser access is a separate authorized ingestion operation, not an answer context. Unknown metadata fields cannot self-approve a document or grant access. Uploaded HTML/script is rendered as text.

Protected operations, including changes to ACLs, roles and approved metadata, share the one-process gate. Exact spans/hashes and revisions are checked before output. History/citations fail closed on access/revision changes. These are bounded implemented controls and tests, **not a production security certification**.

## Next approved MVP priorities

1. Add a held-out fictional corpus and independently adjudicated expected results before accuracy claims; include more conflict negatives and positives, unsupported scopes and misleading numeric passages.
2. Expand reviewed clauses and explicit lineage without weakening access/validity gates; implement lower-authority rejection explanations using only readable sources.
3. Add repeatable full-browser regression automation only with an approved available browser route; current real browser checks are documented manual CUA verification.
4. Design OS parser isolation, denial auditing, retention cleanup and request concurrency improvements before network deployment.
5. Evaluate optional semantic retrieval/NLI/local generation against the offline baseline after core gates; no agent or paid-provider dependency is assumed.

[Run locally](RUN_LOCAL.md) · [test evidence](TEST_RESULTS.md) · [implemented diagram](../diagrams/11-implemented-core.svg) · [API summary](../../backend/README.md).
