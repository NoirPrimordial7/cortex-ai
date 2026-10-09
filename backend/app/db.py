"""SQLAlchemy models with same-tenant foreign keys and an explicit FTS migration."""

from pathlib import Path
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    ForeignKey,
    ForeignKeyConstraint,
    Integer,
    MetaData,
    String,
    Table,
    Text,
    UniqueConstraint,
    create_engine,
    event,
)

metadata = MetaData()


def col(name, kind=Text, *, nullable=False, default=None):
    return Column(name, kind, nullable=nullable, default=default)


tenants = Table(
    "tenants",
    metadata,
    Column("id", String, primary_key=True),
    col("name"),
    col("policy_timezone"),
    col("policy_revision", Integer, default=1),
    col("knowledge_revision", Integer, default=1),
    CheckConstraint("policy_revision >= 1 AND knowledge_revision >= 1"),
)


def model(name, columns, *constraints):
    return Table(
        name,
        metadata,
        Column("id", String, primary_key=True),
        Column("tenant_id", String, ForeignKey("tenants.id"), nullable=False),
        *columns,
        UniqueConstraint("tenant_id", "id"),
        *constraints,
    )


def same(parent, field):
    return ForeignKeyConstraint(["tenant_id", field], [f"{parent}.tenant_id", f"{parent}.id"])


users = model(
    "users",
    [
        col("email_normalized"),
        col("display_name"),
        col("password_hash"),
        col("active", Boolean, default=True),
        col("created_at"),
    ],
    UniqueConstraint("tenant_id", "email_normalized"),
)
roles = model("roles", [col("name")], UniqueConstraint("tenant_id", "name"))
permissions = Table("permissions", metadata, Column("action_key", Text, primary_key=True))
user_roles = model(
    "user_roles",
    [col("user_id"), col("role_id")],
    same("users", "user_id"),
    same("roles", "role_id"),
    UniqueConstraint("tenant_id", "user_id", "role_id"),
)
role_permissions = model(
    "role_permissions",
    [
        col("role_id"),
        Column("permission_key", Text, ForeignKey("permissions.action_key"), nullable=False),
    ],
    same("roles", "role_id"),
    UniqueConstraint("role_id", "permission_key"),
)
sessions = model(
    "sessions",
    [
        col("user_id"),
        col("token_digest"),
        col("csrf_digest"),
        col("created_at"),
        col("last_seen_at"),
        col("expires_at"),
        col("revoked_at", nullable=True),
    ],
    same("users", "user_id"),
    UniqueConstraint("token_digest"),
)
documents = model(
    "documents",
    [
        col("title"),
        col("owner_user_id"),
        col("category"),
        col("acl_revision", Integer, default=1),
        col("archived_at", nullable=True),
    ],
    same("users", "owner_user_id"),
)
document_acl = model(
    "document_acl",
    [
        col("document_id"),
        col("user_id", nullable=True),
        col("role_id", nullable=True),
        col("action", default="READ"),
    ],
    same("documents", "document_id"),
    same("users", "user_id"),
    same("roles", "role_id"),
    CheckConstraint("(user_id IS NULL) != (role_id IS NULL)"),
    CheckConstraint("action = 'READ'"),
)
document_versions = model(
    "document_versions",
    [
        col("document_id"),
        col("version_label"),
        col("object_key"),
        col("sha256"),
        col("extracted_sha256"),
        col("extracted_text"),
        col("segments_json"),
        col("ingested_at"),
        col("published_at", nullable=True),
        col("extraction_state"),
        col("parser_version"),
        col("index_generation", Integer, default=0),
        col("metadata_revision", Integer, default=0),
        col("current_metadata_revision_id", nullable=True),
    ],
    same("documents", "document_id"),
    UniqueConstraint("tenant_id", "document_id", "version_label"),
    ForeignKeyConstraint(
        ["tenant_id", "current_metadata_revision_id", "id"],
        ["metadata_revisions.tenant_id", "metadata_revisions.id", "metadata_revisions.version_id"],
    ),
)
metadata_revisions = model(
    "metadata_revisions",
    [
        col("version_id"),
        col("revision_no", Integer),
        col("approval_state"),
        col("valid_from"),
        col("valid_to", nullable=True),
        col("open_ended", Boolean),
        col("population"),
        col("jurisdiction"),
        col("topic"),
        col("source_kind"),
        col("reviewer_id"),
        col("reviewed_at"),
        col("reason"),
    ],
    same("document_versions", "version_id"),
    same("users", "reviewer_id"),
    UniqueConstraint("tenant_id", "id", "version_id"),
    UniqueConstraint("version_id", "revision_no"),
    CheckConstraint("valid_to IS NULL OR valid_to > valid_from"),
    CheckConstraint(
        "(valid_to IS NULL AND open_ended = 1) OR (valid_to IS NOT NULL AND open_ended = 0)"
    ),
    CheckConstraint("approval_state IN ('pending','approved','rejected')"),
)
authority_rules = model(
    "authority_rules",
    [
        col("topic"),
        col("jurisdiction"),
        col("source_kind"),
        col("rank", Integer),
        col("reviewed_by"),
        col("active", Boolean, default=True),
    ],
    same("users", "reviewed_by"),
    UniqueConstraint("tenant_id", "topic", "jurisdiction", "source_kind"),
    CheckConstraint("rank >= 0"),
)
clauses = model(
    "clauses",
    [
        col("version_id"),
        col("ordinal", Integer),
        col("text"),
        col("locator"),
        col("page", Integer, nullable=True),
        col("paragraph", Integer, nullable=True),
        col("start_char", Integer),
        col("end_char", Integer),
        col("topic"),
        col("population"),
        col("jurisdiction"),
        col("valid_from"),
        col("valid_to", nullable=True),
        col("open_ended", Boolean),
        col("authority_rule_id"),
        col("metadata_reviewed", Boolean),
    ],
    same("document_versions", "version_id"),
    same("authority_rules", "authority_rule_id"),
    UniqueConstraint("version_id", "ordinal"),
    CheckConstraint("start_char >= 0 AND end_char > start_char"),
    CheckConstraint("valid_to IS NULL OR valid_to > valid_from"),
    CheckConstraint(
        "(valid_to IS NULL AND open_ended = 1) OR (valid_to IS NOT NULL AND open_ended = 0)"
    ),
)
policy_claims = model(
    "policy_claims",
    [
        col("clause_id"),
        col("metadata_revision", Integer),
        col("subject"),
        col("predicate"),
        col("value_json"),
        col("unit"),
        col("modality"),
        col("condition_key"),
        col("exception_of_claim_id", nullable=True),
        col("reviewer_id"),
    ],
    same("clauses", "clause_id"),
    same("policy_claims", "exception_of_claim_id"),
    same("users", "reviewer_id"),
)
supersession_edges = model(
    "supersession_edges",
    [
        col("predecessor_clause_id"),
        col("successor_clause_id"),
        col("effective_from"),
        col("scope_key"),
        col("reviewed_by"),
    ],
    same("clauses", "predecessor_clause_id"),
    same("clauses", "successor_clause_id"),
    same("users", "reviewed_by"),
    CheckConstraint("predecessor_clause_id != successor_clause_id"),
)
ingestion_jobs = model(
    "ingestion_jobs",
    [
        col("version_id"),
        col("state"),
        col("attempt", Integer),
        col("started_at"),
        col("finished_at", nullable=True),
        col("safe_error_code", nullable=True),
    ],
    same("document_versions", "version_id"),
)
queries = model(
    "queries",
    [
        col("user_id"),
        col("prompt"),
        col("as_of"),
        col("requested_scope"),
        col("status"),
        col("reason_code", nullable=True),
        col("answer_json"),
        col("dependency_ids"),
        col("policy_revision", Integer),
        col("knowledge_revision", Integer),
        col("created_at"),
        col("expires_at"),
    ],
    same("users", "user_id"),
)
citations = model(
    "citations",
    [
        col("query_id"),
        col("clause_id"),
        col("claim_index", Integer),
        col("start_char", Integer),
        col("end_char", Integer),
        col("source_hash"),
    ],
    same("queries", "query_id"),
    same("clauses", "clause_id"),
)
conflicts = model(
    "conflicts",
    [col("query_id"), col("kind"), col("status"), col("detector_version")],
    same("queries", "query_id"),
)
conflict_evidence = model(
    "conflict_evidence",
    [col("conflict_id"), col("clause_id"), col("claim_id")],
    same("conflicts", "conflict_id"),
    same("clauses", "clause_id"),
    same("policy_claims", "claim_id"),
)
audit_events = model(
    "audit_events",
    [
        col("actor_user_id", nullable=True),
        col("action"),
        col("outcome"),
        col("request_id"),
        col("target_type", nullable=True),
        col("target_id", nullable=True),
        col("policy_revision", Integer),
        col("created_at"),
    ],
    same("users", "actor_user_id"),
)


def engine_for(path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    engine = create_engine(
        f"sqlite:///{path.as_posix()}", connect_args={"check_same_thread": False}
    )

    @event.listens_for(engine, "connect")
    def configure(connection, _):
        connection.execute("PRAGMA foreign_keys=ON")
        connection.execute("PRAGMA busy_timeout=5000")

    return engine
