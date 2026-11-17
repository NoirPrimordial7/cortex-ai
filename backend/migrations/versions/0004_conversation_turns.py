"""Store one-turn retrieval hints by tenant and user."""

from alembic import op
from app.db import conversation_turns

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade():
    conversation_turns.create(op.get_bind())


def downgrade():
    raise RuntimeError("Destructive schema rollback is intentionally unsupported.")
