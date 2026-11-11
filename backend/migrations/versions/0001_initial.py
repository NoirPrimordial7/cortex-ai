"""Local relational schema and FTS5 index."""

from alembic import op
from app.db import metadata

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    tables = (
        "tenants users roles permissions user_roles role_permissions sessions documents "
        "document_acl document_versions metadata_revisions authority_rules clauses policy_claims "
        "supersession_edges ingestion_jobs queries citations conflicts conflict_evidence audit_events"
    ).split()
    metadata.create_all(op.get_bind(), tables=[metadata.tables[name] for name in tables])
    op.execute("CREATE VIRTUAL TABLE clause_fts USING fts5(clause_id UNINDEXED, text)")


def downgrade():
    raise RuntimeError(
        "Destructive schema rollback is intentionally unsupported; use a reviewed migration."
    )
