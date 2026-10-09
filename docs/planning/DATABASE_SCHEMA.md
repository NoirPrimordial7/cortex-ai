# Relational schema and invariants

**Design contract, not executed DDL · 2026-10-09.** SQLite A, SQLAlchemy/Alembic; enforce `PRAGMA foreign_keys=ON` for every connection. IDs are opaque text UUIDs; dates are ISO YYYY-MM-DD in tenant policy timezone; timestamps are UTC ISO 8601. All tenant-owned rows carry `tenant_id NOT NULL` and composite foreign keys to the same tenant. No client-supplied tenant ID is trusted.

![Entity relationship diagram](../diagrams/05-database-erd.svg)

The diagram groups identity, document knowledge, and query provenance. The tables below are authoritative for fields/constraints; the diagram intentionally summarizes them.

## Identity and permission entities

| Entity | Fields beyond tenant/id | Constraints / purpose |
|---|---|---|
| tenants | name, policy_timezone, policy_revision, knowledge_revision | revisions >= 1; server-controlled |
| users | email_normalized, password_hash, active, created_at | unique(tenant,email); no plaintext password |
| roles | name | unique(tenant,name); employee, knowledge_manager, admin, auditor |
| permissions | action_key | global immutable action registry; no tenant data |
| user_roles | user_id, role_id | composite PK; same tenant FKs |
| role_permissions | role_id, permission_key | unique role/action mapping |
| sessions | user_id, token_digest, csrf_digest, created_at, expires_at, revoked_at | unique token digest; raw token never stored; active user/revision checked per request |
| document_acl | document_id, user_id nullable, role_id nullable, action=READ | exactly one subject (`user XOR role`); explicit grants only; no public/default allow |

Roles grant operations such as `query.execute`, `document.upload`, `document.review`, `acl.manage`, `user.manage`, `audit.read`. A READ grant determines which document text may be used. Admin does not bypass READ; assigning access is a privileged, auditable governance action. Knowledge manager reviews only documents they can READ. A uploader receives an explicit private READ grant created in the upload transaction; manager must grant additional reader roles before approval.

## Knowledge entities

| Entity | Fields beyond tenant/id | Constraints / behavior |
|---|---|---|
| documents | title, owner_user_id, category, acl_revision, archived_at | tenant-scoped; title hidden without READ; ACL applies to all versions |
| document_versions | document_id, version_label, object_key, sha256, extracted_sha256, ingested_at, published_at, extraction_state, parser_version, index_generation, metadata_revision | unique(tenant,document,version_label); immutable text/blob/hash; object_key server-generated |
| metadata_revisions | version_id, revision_no, approval_state, valid_from, valid_to, open_ended, population, jurisdiction, topic, source_kind, reviewer_id, reviewed_at, reason | unique(version,revision); states pending/approved/rejected; exactly one current revision selected on version; append-only revisions |
| clauses | version_id, ordinal, text, page nullable, paragraph nullable, start_char, end_char, topic, population, jurisdiction, valid_from, valid_to, open_ended, authority_rule_id, metadata_reviewed | unique(version,ordinal); offsets 0<=start<end<=version text length; tenant/version inherited; no independent ACL A |
| policy_claims | clause_id, subject, predicate, value_json, unit, modality, condition_key, exception_of_claim_id nullable, reviewer_id | manually reviewed typed value; unknown field prevents policy answer; not extracted truth from arbitrary prose |
| authority_rules | topic, jurisdiction, source_kind, rank, reviewed_by, active | unique applicable tuple; rank nonnegative, higher stronger; missing/ambiguous rule fails closed |
| supersession_edges | predecessor_clause_id, successor_clause_id, effective_from, scope_key, reviewed_by | no self/cross-tenant edge; acyclic; same claim scope; predecessor effective valid_to set to boundary in publication transaction |
| ingestion_jobs | version_id, state, attempt, started_at, finished_at, safe_error_code | idempotent; failed/staging versions excluded from retrieval |

Metadata revisions protect mutable governance history. Version `current_metadata_revision_id` points to a revision of that exact version with same tenant; enforce composite FK. Clause applicability is a materialized, reviewed projection of current metadata; every approval/edit rebuilds affected clause metadata and index generation atomically. Content stays immutable. Supersession links require approved boundaries, not a filename or upload date heuristic. Unchanged clauses retain their original interval during partial amendment B.

`valid_from` mandatory for answerable clauses. Require `valid_to > valid_from` when finite, `open_ended=true` iff valid_to is NULL. Half-open `[from,to)`: successor takes effect at boundary and predecessor no longer applies. Scope unknown is not wildcard. A supports exact population/jurisdiction/topic keys; inferred or overlapping scopes require review rather than guessing.

Mixed section access: A denies publication of mixed-access documents unless split into separate documents with reviewed ACLs. Clause text inherits document ACL; a version/history grant cannot expose a more restrictive section by accident. Chunk-specific ACL intersections are B work and require extra tests.

## Query, citation, conflict and audit entities

| Entity | Fields | Constraints / behavior |
|---|---|---|
| queries | tenant/id, user_id, prompt, as_of, requested_scope, status, reason_code, answer_json, policy_revision, knowledge_revision, created_at, expires_at | owner-only; bounded prompt and retention; saved output hidden if source access/revision changed |
| citations | tenant/id, query_id, clause_id, claim_index, start_char, end_char, source_hash | citation spans must refer to selected authorized clause and supported claim; no generated arbitrary URL |
| conflicts | tenant/id, query_id, kind, status, detector_version | per-query detection; not a global unrestricted conflict dashboard |
| conflict_evidence | conflict_id, clause_id, claim_id | both ends current authorized; unique edge; no pair shown if either end inaccessible |
| audit_events | tenant/id, actor_user_id nullable, action, outcome, request_id, target_type, target_id nullable, policy_revision, created_at | append-only application interface, no raw text/title/query/session secret; target IDs readable only to authorized audit operator |

Queries/citations/conflict artifacts are sensitive derived data. Retrieval of saved answer reauthorizes every dependency; if one loses access, hide the whole derived answer and recompute on request. No automatic partial redaction, which may retain leaked inference. Audit storage is not cryptographically tamper-proof; database administrator/host compromise is outside bounded assurance.

## Index and repository contracts

FTS5 virtual table: `clause_fts(clause_id UNINDEXED, text)`; joins map IDs through clauses/versions/documents to tenant and ACL. Only indexed extraction-success clauses enter the index. Approved validity/scope eligibility is added for answering; authorized detail/library may show drafts/future versions with labels.

Search joins tenant and current user/role grants before LIMIT and before selecting text. Repository never returns unauthorized text; avoid unrestricted FTS snippets, highlights, global BM25 scores and corpus totals. Initial rank = distinct matched query tokens / distinct query tokens computed only on permitted applicable text, then stable clause ID tie break. Authority handles policy precedence after topic matching, not global ranking. Shared index timing/statistical side channels are residual risk; stronger per-tenant/per-authorization indexes are C if justified.

Indexes: tenant/email, session digest/expiry, document tenant/archive, ACL tenant/document/subject, clauses tenant/topic/population/jurisdiction/interval/version, version extraction/index state, query tenant/user/time, audit tenant/time. Add unique(tenant,id) on FK parents. Foreign-key cascades restricted for immutable/provenance rows; deletion becomes controlled archival with retention B, not accidental cascade.

Publication/ACL edits execute in one transaction under tenant write gate; increment revisions. Validate tenant FKs, supersession cycles, interval endpoints and reviewed claims; update FTS/index_generation and audit event together. Database rollback must leave neither partially published evidence nor orphaned index entry. Fixture tests cover each constraint; schema file/migrations are Phase 3 tasks.
