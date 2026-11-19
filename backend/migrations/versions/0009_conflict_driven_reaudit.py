"""Bind re-audits to actual conflict sources and retain legacy manual history."""

from alembic import op
from app.db import ticket_conflict_contexts, ticket_conflict_sources, ticket_subscribers
from app.security import execute, rows, uid, now

revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None


def upgrade():
    db = op.get_bind()
    for table in (ticket_conflict_contexts, ticket_conflict_sources, ticket_subscribers):
        table.create(db)
    op.execute("""CREATE TRIGGER ticket_conflict_context_immutable BEFORE UPDATE OF
        id,tenant_id,ticket_id,query_id,fingerprint,topic,population,jurisdiction,as_of ON ticket_conflict_contexts
        BEGIN SELECT RAISE(ABORT,'Original conflict context is immutable'); END""")
    op.execute("""CREATE TRIGGER ticket_conflict_context_no_delete BEFORE DELETE ON ticket_conflict_contexts
        BEGIN SELECT RAISE(ABORT,'Original conflict context is immutable'); END""")
    op.execute("""CREATE TRIGGER ticket_conflict_context_no_replace BEFORE INSERT ON ticket_conflict_contexts
        WHEN EXISTS(SELECT 1 FROM ticket_conflict_contexts WHERE id=NEW.id OR
            (tenant_id=NEW.tenant_id AND (ticket_id=NEW.ticket_id OR fingerprint=NEW.fingerprint)))
        BEGIN SELECT RAISE(ABORT,'Original conflict context is immutable'); END""")
    # Legacy tickets must also allow the assigned Auditor to inspect their sources.
    # This is an explicit, tenant-local review grant, never an authorization bypass.
    for item in rows(
        db,
        """SELECT DISTINCT p.tenant_id,p.document_id,r.id AS role_id
        FROM ticket_policies p JOIN roles r ON r.tenant_id=p.tenant_id AND r.name='auditor'
        JOIN documents d ON d.tenant_id=p.tenant_id AND d.id=p.document_id
        WHERE d.archived_at IS NULL AND NOT EXISTS(SELECT 1 FROM document_acl a
          WHERE a.tenant_id=p.tenant_id AND a.document_id=p.document_id AND a.role_id=r.id)""",
    ):
        execute(
            db,
            """INSERT INTO document_acl(id,tenant_id,document_id,role_id,action)
            VALUES (:id,:tenant_id,:document_id,:role_id,'READ')""",
            id=uid(),
            **item,
        )
        execute(
            db,
            "UPDATE documents SET acl_revision=acl_revision+1 WHERE tenant_id=:tenant_id AND id=:document_id",
            **item,
        )
        execute(
            db, "UPDATE tenants SET policy_revision=policy_revision+1 WHERE id=:tenant_id", **item
        )
        execute(
            db,
            """INSERT INTO audit_events(id,tenant_id,action,outcome,request_id,target_type,target_id,policy_revision,created_at)
            VALUES (:id,:tenant_id,'ticket.review_access.migrate','success',:request,'document',:document_id,
            (SELECT policy_revision FROM tenants WHERE id=:tenant_id),:at)""",
            **item,
            id=uid(),
            request=uid(),
            at=now(),
        )
    for table in ("ticket_conflict_sources", "ticket_subscribers"):
        for operation in ("UPDATE", "DELETE"):
            op.execute(f"""CREATE TRIGGER {table}_no_{operation.lower()} BEFORE {operation} ON {table}
                BEGIN SELECT RAISE(ABORT,'Conflict evidence history is append-only'); END""")
        keys = "clause_id" if table == "ticket_conflict_sources" else "user_id"
        op.execute(f"""CREATE TRIGGER {table}_no_replace BEFORE INSERT ON {table}
            WHEN EXISTS(SELECT 1 FROM {table} WHERE id=NEW.id OR
              (tenant_id=NEW.tenant_id AND ticket_id=NEW.ticket_id AND {keys}=NEW.{keys}))
            BEGIN SELECT RAISE(ABORT,'Conflict evidence history is append-only'); END""")


def downgrade():
    raise RuntimeError("Use a reviewed forward migration.")
