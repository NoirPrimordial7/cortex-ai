"""Server identity, explicit document grants, and serialized local transactions."""

import hashlib
import secrets
from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import uuid4
from fastapi import HTTPException
from sqlalchemy import text


def now():
    return datetime.now(timezone.utc).isoformat()


def uid():
    return str(uuid4())


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


def csrf_for(token):
    return digest("cortex-csrf:" + token)


def rows(db, sql, **params):
    return [dict(r) for r in db.execute(text(sql), params).mappings()]


def one(db, sql, **params):
    result = rows(db, sql, **params)
    return result[0] if result else None


def execute(db, sql, **params):
    return db.execute(text(sql), params)


@dataclass
class Context:
    db: object
    user: dict
    roles: list[dict]
    actions: set[str]
    request_id: str

    @property
    def tenant(self):
        return self.user["tenant_id"]

    def require(self, action):
        if action not in self.actions:
            raise HTTPException(403, "Operation not permitted")

    def parameters(self):
        return {"tenant": self.tenant, "user": self.user["id"]}


# Reused by list, retrieval, detail, history and governance. No owner/admin shortcut.
READ = """d.tenant_id=:tenant AND d.archived_at IS NULL AND EXISTS (
 SELECT 1 FROM document_acl a WHERE a.tenant_id=d.tenant_id AND a.document_id=d.id
 AND a.action='READ' AND (a.user_id=:user OR a.role_id IN
 (SELECT role_id FROM user_roles WHERE tenant_id=:tenant AND user_id=:user)))"""


def readable(ctx, document_id):
    return one(
        ctx.db,
        f"SELECT d.* FROM documents d WHERE d.id=:id AND {READ}",
        **ctx.parameters(),
        id=document_id,
    )


def document(ctx, document_id):
    result = readable(ctx, document_id)
    if not result:
        raise HTTPException(404, "Resource unavailable")
    return result


def version(ctx, version_id):
    result = one(
        ctx.db,
        f"""SELECT v.*, d.title, d.category FROM document_versions v
      JOIN documents d ON d.id=v.document_id AND d.tenant_id=v.tenant_id
      WHERE v.id=:id AND {READ}""",
        **ctx.parameters(),
        id=version_id,
    )
    if not result:
        raise HTTPException(404, "Resource unavailable")
    return result


def revisions(ctx):
    return one(
        ctx.db,
        "SELECT policy_revision, knowledge_revision FROM tenants WHERE id=:tenant",
        tenant=ctx.tenant,
    )


def audit(ctx, action, outcome="success", target=None):
    execute(
        ctx.db,
        """INSERT INTO audit_events
      (id,tenant_id,actor_user_id,action,outcome,request_id,target_type,target_id,policy_revision,created_at)
      VALUES (:id,:tenant,:user,:action,:outcome,:request_id,:target_type,:target,:revision,:at)""",
        id=uid(),
        **ctx.parameters(),
        action=action,
        outcome=outcome,
        request_id=ctx.request_id,
        target_type="document" if target else None,
        target=target,
        revision=revisions(ctx)["policy_revision"],
        at=now(),
    )


def token():
    return secrets.token_urlsafe(32)
