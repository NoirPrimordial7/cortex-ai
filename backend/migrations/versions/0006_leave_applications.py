"""Add leave requests, immutable events and exactly-once ledger links."""

from alembic import op
from app.db import leave_requests, leave_request_events, leave_request_transactions

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade():
    for table in (leave_requests, leave_request_events, leave_request_transactions):
        table.create(op.get_bind())


def downgrade():
    raise RuntimeError("Use a reviewed forward migration.")
