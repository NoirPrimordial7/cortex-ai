# ADR 0001 — Local relational baseline with an offline evidence answerer

- Timestamp: 2026-10-09T16:25:00+05:30; Phase 2 / architecture.
- Status: selected planning baseline; owner review pending before implementation.
- Context: approved research recommends bounded auditable policy QA; demo deadline 2026-10-10 and hardware/team unconfirmed.
- Options: managed search/RAG, turnkey OSS platform, framework orchestration, small local modules; SQLite/Postgres; keyword/hybrid; extractive/local/cloud generation.
- Decision: React/Vite/TS/Tailwind, FastAPI/Python, SQLite/SQLAlchemy/Alembic, FTS5 authorized matching, deterministic extractive/structured answers, local files, explicit sessions and pytest/Vitest. See [stack comparison](../planning/TECH_STACK.md).
- Rationale/evidence: [BEIR](https://arxiv.org/abs/2104.08663) supports a meaningful lexical baseline; [FTS5](https://sqlite.org/fts5.html) supports inspectable local retrieval. Phase 1 shows platform ACL/edition constraints and citation faithfulness limits. No paid model or vector service is required.
- Consequences: limited paraphrase/arbitrary prose coverage; SQLite write scalability bounded; optional semantic/generator adapters later. No claim of AI implementation yet.
- Security/evaluation: filters before text hydration; no shared BM25 score or cache A; measure recall and all safety gates before adding models.
- Files: requirements, stack, architecture, schema/security/pipeline/API and diagrams; no application files.
- Verification: current primary docs checked; exact dependency versions and runtime compatibility must be locked/tested Phase 3.
- Outstanding: owner plan review, hardware/time/rubric; future benchmark may change stack via superseding ADR.
- Commit: resolve `docs: define Cortex AI architecture and security contracts` in Git; immutable hash recorded in subsequent tracking entry.
