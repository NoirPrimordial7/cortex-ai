"""Add tenant-scoped approved-clause embeddings."""

from alembic import op
from app.db import clause_embeddings

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade():
    clause_embeddings.create(op.get_bind())


def downgrade():
    raise RuntimeError("Destructive schema rollback is intentionally unsupported.")
