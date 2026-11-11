"""Add the leave ledger, reporting intervals and their action grants."""

from uuid import uuid4
from alembic import op
from app.db import leave_ledger_entries, leave_types, reporting_relationships
from app.security import execute, one, rows

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    for table in (leave_types, leave_ledger_entries, reporting_relationships):
        table.create(conn)
    for operation in ("UPDATE", "DELETE"):
        op.execute(
            f"""CREATE TRIGGER leave_ledger_no_{operation.lower()}
            BEFORE {operation} ON leave_ledger_entries
            BEGIN SELECT RAISE(ABORT, 'Leave ledger is append-only'); END"""
        )
    op.execute(
        """CREATE TRIGGER leave_ledger_no_replace
        BEFORE INSERT ON leave_ledger_entries
        WHEN EXISTS (SELECT 1 FROM leave_ledger_entries WHERE id=NEW.id)
        BEGIN SELECT RAISE(ABORT, 'Leave ledger is append-only'); END"""
    )

    for action in ("query.execute", "leave.view_reports", "leave.manage"):
        execute(conn, "INSERT OR IGNORE INTO permissions (action_key) VALUES (:action)", action=action)
    for tenant in rows(conn, "SELECT id FROM tenants"):
        tenant_id = tenant["id"]
        manager = one(
            conn, "SELECT id FROM roles WHERE tenant_id=:tenant AND name='manager'", tenant=tenant_id
        )
        if manager is None:
            role_id = str(uuid4())
            execute(
                conn,
                "INSERT INTO roles (id,tenant_id,name) VALUES (:id,:tenant,'manager')",
                id=role_id,
                tenant=tenant_id,
            )
        else:
            role_id = manager["id"]
        for action in ("query.execute", "leave.view_reports"):
            execute(
                conn,
                """INSERT OR IGNORE INTO role_permissions (id,tenant_id,role_id,permission_key)
                VALUES (:id,:tenant,:role,:action)""",
                id=str(uuid4()),
                tenant=tenant_id,
                role=role_id,
                action=action,
            )
        execute(
            conn,
            """INSERT OR IGNORE INTO role_permissions (id,tenant_id,role_id,permission_key)
            SELECT :id,tenant_id,id,'leave.manage' FROM roles WHERE tenant_id=:tenant AND name='admin'""",
            id=str(uuid4()),
            tenant=tenant_id,
        )


def downgrade():
    raise RuntimeError(
        "Destructive schema rollback is intentionally unsupported; use a reviewed migration."
    )
