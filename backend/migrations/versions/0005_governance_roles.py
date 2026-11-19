"""Safely consolidate roles, rename known demo emails and add policy review state."""

from uuid import uuid4
from alembic import op
from app.db import policy_headings, policy_workflows, policy_workflow_events
from app.rbac import ACTIONS
from app.security import execute, now, one, rows

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade():
    db = op.get_bind()
    for table in (policy_headings, policy_workflows, policy_workflow_events):
        table.create(db)
    for action in {a for actions in ACTIONS.values() for a in actions}:
        execute(db, "INSERT OR IGNORE INTO permissions VALUES (:action)", action=action)
    for tenant in rows(db, "SELECT id FROM tenants"):
        tid = tenant["id"]
        for name in ACTIONS:
            if not one(db, "SELECT id FROM roles WHERE tenant_id=:t AND name=:n", t=tid, n=name):
                execute(db, "INSERT INTO roles VALUES (:id,:t,:n)", id=str(uuid4()), t=tid, n=name)
        # Preserve explicit legacy role access for its original members, not all employees.
        grants = rows(
            db,
            """SELECT DISTINCT a.document_id,u.user_id FROM document_acl a
            JOIN roles r ON r.tenant_id=a.tenant_id AND r.id=a.role_id
            JOIN user_roles u ON u.tenant_id=r.tenant_id AND u.role_id=r.id
            WHERE a.tenant_id=:t AND r.name NOT IN ('employee','auditor','admin')""",
            t=tid,
        )
        for grant in grants:
            if not one(
                db,
                """SELECT id FROM document_acl WHERE tenant_id=:t
                       AND document_id=:d AND user_id=:u""",
                t=tid,
                d=grant["document_id"],
                u=grant["user_id"],
            ):
                execute(
                    db,
                    """INSERT INTO document_acl(id,tenant_id,document_id,user_id,action)
                    VALUES (:id,:t,:d,:u,'READ')""",
                    id=str(uuid4()),
                    t=tid,
                    d=grant["document_id"],
                    u=grant["user_id"],
                )
        for user in rows(db, "SELECT id FROM users WHERE tenant_id=:t", t=tid):
            names = {
                r["name"]
                for r in rows(
                    db,
                    """SELECT r.name FROM user_roles ur
                JOIN roles r ON r.tenant_id=ur.tenant_id AND r.id=ur.role_id
                WHERE ur.tenant_id=:t AND ur.user_id=:u""",
                    t=tid,
                    u=user["id"],
                )
            }
            name = "admin" if "admin" in names else "auditor" if "auditor" in names else "employee"
            # Consolidation can remove an Employee membership from an existing Admin.
            # Preserve only that user's former READ, without widening another role.
            removed_grants = rows(
                db,
                """SELECT DISTINCT a.document_id FROM document_acl a
                JOIN roles r ON r.tenant_id=a.tenant_id AND r.id=a.role_id
                JOIN user_roles ur ON ur.tenant_id=r.tenant_id AND ur.role_id=r.id
                WHERE ur.tenant_id=:t AND ur.user_id=:u AND r.name<>:kept""",
                t=tid,
                u=user["id"],
                kept=name,
            )
            for grant in removed_grants:
                if not one(
                    db,
                    "SELECT id FROM document_acl WHERE tenant_id=:t AND document_id=:d AND user_id=:u",
                    t=tid,
                    d=grant["document_id"],
                    u=user["id"],
                ):
                    execute(
                        db,
                        """INSERT INTO document_acl(id,tenant_id,document_id,user_id,action)
                        VALUES (:id,:t,:d,:u,'READ')""",
                        id=str(uuid4()),
                        t=tid,
                        d=grant["document_id"],
                        u=user["id"],
                    )
            role = one(db, "SELECT id FROM roles WHERE tenant_id=:t AND name=:n", t=tid, n=name)
            execute(
                db, "DELETE FROM user_roles WHERE tenant_id=:t AND user_id=:u", t=tid, u=user["id"]
            )
            execute(
                db,
                "INSERT INTO user_roles VALUES (:id,:t,:u,:r)",
                id=str(uuid4()),
                t=tid,
                u=user["id"],
                r=role["id"],
            )
        execute(
            db,
            """DELETE FROM document_acl WHERE tenant_id=:t AND role_id IN
            (SELECT id FROM roles WHERE tenant_id=:t AND name NOT IN ('employee','auditor','admin'))""",
            t=tid,
        )
        execute(db, "DELETE FROM role_permissions WHERE tenant_id=:t", t=tid)
        execute(
            db,
            "DELETE FROM roles WHERE tenant_id=:t AND name NOT IN ('employee','auditor','admin')",
            t=tid,
        )
        for name, actions in ACTIONS.items():
            role = one(db, "SELECT id FROM roles WHERE tenant_id=:t AND name=:n", t=tid, n=name)
            for action in actions:
                execute(
                    db,
                    "INSERT INTO role_permissions VALUES (:id,:t,:r,:a)",
                    id=str(uuid4()),
                    t=tid,
                    r=role["id"],
                    a=action,
                )
        execute(db, "UPDATE tenants SET policy_revision=policy_revision+1 WHERE id=:t", t=tid)
    for tid, ident, old, new in [
        ("NORTHSTAR", "maya", "maya", "arya"),
        ("NORTHSTAR", "ravi", "ravi", "aditya"),
        ("NORTHSTAR", "isha", "isha", "ashwin"),
        ("ORBIT", "orbit-user", "orbit", "yashraj"),
        ("NORTHSTAR", "noor", "noor", "arya.disabled"),
    ]:
        if not one(
            db,
            "SELECT id FROM users WHERE tenant_id=:t AND email_normalized=:e",
            t=tid,
            e=new + "@example.test",
        ):
            execute(
                db,
                """UPDATE users SET email_normalized=:e WHERE tenant_id=:t
                AND id=:id AND email_normalized=:old""",
                t=tid,
                id=ident,
                old=old + "@example.test",
                e=new + "@example.test",
            )
    for version in rows(
        db,
        """SELECT v.id,v.tenant_id,d.category,m.approval_state,m.reviewer_id,m.reviewed_at,m.reason
        FROM document_versions v JOIN documents d ON d.id=v.document_id AND d.tenant_id=v.tenant_id
        LEFT JOIN metadata_revisions m
          ON m.tenant_id=v.tenant_id AND m.id=v.current_metadata_revision_id""",
    ):
        status = (
            version["approval_state"]
            if version["approval_state"] in ("approved", "rejected")
            else "draft"
        )
        heading_id = None
        if status == "approved":
            category = " ".join(version["category"].split()) or "Historical policies"
            heading = one(
                db,
                "SELECT id FROM policy_headings WHERE tenant_id=:t AND normalized_name=:n",
                t=version["tenant_id"],
                n=category.casefold(),
            )
            heading_id = heading["id"] if heading else str(uuid4())
            if not heading:
                execute(
                    db,
                    """INSERT INTO policy_headings(id,tenant_id,name,normalized_name,created_at)
                    VALUES (:id,:t,:n,:normalized,:at)""",
                    id=heading_id,
                    t=version["tenant_id"],
                    n=category,
                    normalized=category.casefold(),
                    at=now(),
                )
        wid = str(uuid4())
        execute(
            db,
            """INSERT INTO policy_workflows(id,tenant_id,version_id,status,heading_id,reviewer_id,reviewed_at,review_comment,revision)
            VALUES (:id,:t,:v,:s,:h,:u,:at,:comment,0)""",
            id=wid,
            t=version["tenant_id"],
            v=version["id"],
            s=status,
            h=heading_id,
            u=version["reviewer_id"],
            at=version["reviewed_at"],
            comment=version["reason"],
        )
        execute(
            db,
            """INSERT INTO policy_workflow_events(id,tenant_id,workflow_id,status,comment,created_at)
            VALUES (:id,:t,:w,:s,'Imported historical review without changing its authorship',:at)""",
            id=str(uuid4()),
            t=version["tenant_id"],
            w=wid,
            s=status,
            at=now(),
        )
    op.execute("""CREATE TRIGGER active_role_names_insert BEFORE INSERT ON roles
        WHEN NEW.name NOT IN ('employee','auditor','admin')
        BEGIN SELECT RAISE(ABORT,'Unknown application role'); END""")
    op.execute("""CREATE TRIGGER active_role_names_update BEFORE UPDATE OF name ON roles
        WHEN NEW.name NOT IN ('employee','auditor','admin')
        BEGIN SELECT RAISE(ABORT,'Unknown application role'); END""")
    op.execute("""CREATE UNIQUE INDEX one_application_role ON user_roles(tenant_id,user_id)""")


def downgrade():
    raise RuntimeError("Use a reviewed forward migration.")
