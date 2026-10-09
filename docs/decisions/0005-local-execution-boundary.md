# ADR 0005 — implement a conservative local transaction boundary

- Timestamp: 2026-10-09T20:30:00+05:30 (Asia/Calcutta)
- Status: accepted implementation decision within owner-approved Phase 3
- Scope: backend execution, ingestion and reviewed evidence
- Supersedes the finer tenant reader/writer-gate implementation detail of ADR 0002 for Milestone A; its authorization/revocation guarantees remain required. Phase 2 documents stay preserved as the approved planning baseline.

## Decision and reason

Use one `threading.Lock` shared by a **single backend application process**, holding one SQLAlchemy transaction from trusted session lookup through evidence handling and response construction. ACL/role/metadata mutations take the same gate. A queued revocation cannot commit while an evidence-consuming request holds it. A subsequent read checks new grants and withholds revoked dependencies. This is simpler to inspect and test for the local deadline than a tenant-specific reader/writer implementation, at the cost of serializing tenants and ingestion.

SQLite uses its default rollback-journal mode, foreign keys enabled on every connection and a finite busy timeout. There is no independent SQL reader, cache, vector index, reranker service or model consuming protected content. Running two workers defeats the process-gate contract and is unsupported. The development reload supervisor has one application worker; reload is for development, not availability testing.

Keep extraction synchronous in a 30-second bounded child and persist safe `pending_review`/`failed` states before publication. This means an upload can delay all protected requests. An asynchronous queue and OS sandbox require a separate design/test gate, not silent additions. Upload `202` is a recorded job identifier, not a claim of background execution.

For this milestone, one reviewed numeric evidence span (maximum 8,000 characters) per version enters retrieval. Text/span are immutable once published; metadata/claims are revisioned. Multi-clause policies and partial supersession need subsequent work. Stored version text/segments are private additions to the planned relational schema. SQLAlchemy Core is used rather than a declarative ORM; it preserves parameterized queries and database constraints with fewer abstraction layers.

## Alternatives and consequences

Tenant reader/writer gates improve throughput but add coordination states and writer starvation concerns; deferred. Multiple processes require a shared consistency mechanism and new concurrent tests; deferred. PostgreSQL and remote retrieval are unjustified for the fictional local fixture and deadline. No model or learned contradiction detector is required: finite reviewed claim keys/value disagreement are the inspectable initial baseline.

Revocation cannot erase previously viewed/downloaded information. Browser session polling clears visible evidence on a changed policy/knowledge revision (up to 15 seconds, or on focus); every server request enforces current permissions immediately. Global revision invalidation is conservative and can hide an otherwise still-valid answer after an unrelated change. In-memory rate limiting is local-only and resets on reload.

## Files, evidence and verification

Implemented in `backend/app/{main,security,documents,pipeline,db,parser_worker}.py` and initial Alembic migration. Current primary security/retrieval justification remains the preserved [Phase 2 contract](../planning/SECURITY_MODEL.md) and [pipeline](../planning/RAG_PIPELINE.md); no claim of proprietary competitor internals is added.

`backend/tests/test_revocation.py` pauses an evidence stage, queues an ACL mutation, then checks its serialization and the denial of subsequent source/history/query reads. Other tests cover same-tenant foreign keys, ACL XOR subjects, current access before stage hydration and span/hash checking. Initial checkpoint: 29 backend tests pass; hardware/production security and held-out corpus quality remain unvalidated. Commit subject: `feat: implement permission-safe offline evidence core`; exact hash is recorded after verified publication.
