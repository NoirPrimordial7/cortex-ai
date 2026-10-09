"""Local relational schema and FTS5 index."""

from alembic import op
from app.db import metadata

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    metadata.create_all(op.get_bind())
    op.execute("CREATE VIRTUAL TABLE clause_fts USING fts5(clause_id UNINDEXED, text)")


def downgrade():
    raise RuntimeError(
        "Destructive schema rollback is intentionally unsupported; use a reviewed migration."
    )
