"""Store signed policy provenance and append-only verification results."""

from alembic import op
from app.db import policy_integrity, integrity_verifications

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None


def upgrade():
    for table in (policy_integrity, integrity_verifications):
        table.create(op.get_bind())
    for table in (
        "policy_integrity",
        "integrity_verifications",
        "policy_workflow_events",
        "leave_request_events",
        "leave_request_transactions",
        "ticket_decisions",
    ):
        op.execute(f"""CREATE TRIGGER {table}_no_replace BEFORE INSERT ON {table}
            WHEN EXISTS(SELECT 1 FROM {table} WHERE id=NEW.id)
            BEGIN SELECT RAISE(ABORT,'History is append-only'); END""")
        for operation in ("UPDATE", "DELETE"):
            op.execute(f"""CREATE TRIGGER {table}_no_{operation.lower()} BEFORE {operation} ON {table}
                BEGIN SELECT RAISE(ABORT,'History is append-only'); END""")
    op.execute("""CREATE TRIGGER policy_integrity_no_version_replace BEFORE INSERT ON policy_integrity
        WHEN EXISTS(SELECT 1 FROM policy_integrity WHERE tenant_id=NEW.tenant_id AND version_id=NEW.version_id)
        BEGIN SELECT RAISE(ABORT,'Provenance is immutable'); END""")
    op.execute("""CREATE TRIGGER leave_request_transactions_no_operation_replace BEFORE INSERT ON leave_request_transactions
        WHEN EXISTS(SELECT 1 FROM leave_request_transactions WHERE tenant_id=NEW.tenant_id
            AND ((request_id=NEW.request_id AND operation=NEW.operation) OR ledger_entry_id=NEW.ledger_entry_id))
        BEGIN SELECT RAISE(ABORT,'Leave transaction is immutable'); END""")


def downgrade():
    raise RuntimeError("Use a reviewed forward migration.")
