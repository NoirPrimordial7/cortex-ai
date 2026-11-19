"""Add policy conflict tickets, decisions, attachments and notifications."""

from alembic import op
from app.db import (
    policy_tickets,
    ticket_policies,
    ticket_decisions,
    ticket_attachments,
    notifications,
)

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade():
    for table in (
        policy_tickets,
        ticket_policies,
        ticket_decisions,
        ticket_attachments,
        notifications,
    ):
        table.create(op.get_bind())


def downgrade():
    raise RuntimeError("Use a reviewed forward migration.")
