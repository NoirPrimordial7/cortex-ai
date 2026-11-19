"""Policy re-audit tickets with append-only decisions and explicit source access."""

import hashlib
from pathlib import Path
from fastapi import HTTPException
from pydantic import BaseModel, ConfigDict, Field
from .security import Context, audit, document, execute, now, one, readable, rows, uid
from .policy_workflow import require_distributable


class TicketInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    document_ids: list[str] = Field(min_length=1, max_length=5)
    description: str = Field(min_length=10, max_length=4000)


class Resolution(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    expected_revision: int = Field(ge=0)
    document_id: str = Field(min_length=1, max_length=100)
    reason: str = Field(min_length=5, max_length=4000)


class Rollback(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    expected_revision: int = Field(ge=0)
    reason: str = Field(min_length=5, max_length=4000)


def ticket(ctx, ident):
    record = one(
        ctx.db,
        """SELECT t.*,u.display_name FROM policy_tickets t JOIN users u
        ON u.tenant_id=t.tenant_id AND u.id=t.user_id WHERE t.tenant_id=:tenant AND t.id=:id""",
        **ctx.parameters(),
        id=ident,
    )
    if not record or (record["user_id"] != ctx.user["id"] and "ticket.review" not in ctx.actions):
        raise HTTPException(404, "Resource unavailable")
    return record


def decision_event(ctx, ident, operation, reason, did=None):
    execute(
        ctx.db,
        """INSERT INTO ticket_decisions
        (id,tenant_id,ticket_id,actor_id,operation,document_id,reason,created_at)
        VALUES (:id,:tenant,:t,:user,:op,:d,:reason,:at)""",
        **ctx.parameters(),
        id=uid(),
        t=ident,
        op=operation,
        d=did,
        reason=reason.strip(),
        at=now(),
    )
    audit(ctx, "ticket." + operation, target=ident, target_type="ticket")


def listing(ctx):
    if "ticket.review" not in ctx.actions:
        ctx.require("ticket.create")
    records = rows(
        ctx.db,
        """SELECT t.id,t.description,t.status,t.created_at,t.updated_at,t.revision,u.display_name
        FROM policy_tickets t JOIN users u ON u.tenant_id=t.tenant_id AND u.id=t.user_id
        WHERE t.tenant_id=:tenant AND (:all=1 OR t.user_id=:user)
        ORDER BY t.created_at DESC,t.id""",
        **ctx.parameters(),
        all=int("ticket.review" in ctx.actions),
    )
    audit(ctx, "ticket.list.read")
    return {"items": records}


def detail(ctx, ident):
    record = ticket(ctx, ident)
    policies = rows(
        ctx.db,
        """SELECT document_id FROM ticket_policies
        WHERE tenant_id=:tenant AND ticket_id=:id ORDER BY id""",
        **ctx.parameters(),
        id=ident,
    )
    record["policies"] = []
    for p in policies:
        d = readable(ctx, p["document_id"])
        record["policies"].append(
            {
                "document_id": p["document_id"],
                "title": d["title"] if d else "Policy unavailable",
                "available": bool(d),
            }
        )
    selected = record["selected_document_id"]
    if selected and not readable(ctx, selected):
        record["selected_document_id"] = None
    record["history"] = rows(
        ctx.db,
        """SELECT e.operation,e.document_id,e.reason,e.created_at,u.display_name AS actor
        FROM ticket_decisions e JOIN users u ON u.tenant_id=e.tenant_id AND u.id=e.actor_id
        WHERE e.tenant_id=:tenant AND e.ticket_id=:id ORDER BY e.created_at,e.id""",
        **ctx.parameters(),
        id=ident,
    )
    record["attachments"] = rows(
        ctx.db,
        """SELECT id,filename,sha256,created_at
        FROM ticket_attachments WHERE tenant_id=:tenant AND ticket_id=:id ORDER BY created_at,id""",
        **ctx.parameters(),
        id=ident,
    )
    audit(ctx, "ticket.read", target=ident, target_type="ticket")
    return record


def create(ctx, body):
    ctx.require("ticket.create")
    ids = list(dict.fromkeys(body.document_ids))
    for did in ids:
        document(ctx, did)
        require_distributable(ctx, did)
    ident, at = uid(), now()
    execute(
        ctx.db,
        """INSERT INTO policy_tickets
        (id,tenant_id,user_id,description,status,created_at,updated_at,revision)
        VALUES (:id,:tenant,:user,:description,'pending',:at,:at,0)""",
        **ctx.parameters(),
        id=ident,
        description=body.description.strip(),
        at=at,
    )
    for did in ids:
        execute(
            ctx.db,
            "INSERT INTO ticket_policies(id,tenant_id,ticket_id,document_id) VALUES (:id,:tenant,:t,:d)",
            **ctx.parameters(),
            id=uid(),
            t=ident,
            d=did,
        )
    decision_event(ctx, ident, "submitted", body.description)
    return detail(ctx, ident)


def notify(ctx, record, message):
    execute(
        ctx.db,
        """INSERT INTO notifications(id,tenant_id,user_id,ticket_id,message,created_at)
        VALUES (:id,:tenant,:employee,:ticket,:message,:at)""",
        **ctx.parameters(),
        id=uid(),
        employee=record["user_id"],
        ticket=record["id"],
        message=message,
        at=now(),
    )


def resolve(ctx, ident, body):
    ctx.require("ticket.review")
    record = ticket(ctx, ident)
    if record["status"] != "pending" or record["revision"] != body.expected_revision:
        raise HTTPException(409, "Ticket state changed; reload")
    if not one(
        ctx.db,
        """SELECT id FROM ticket_policies
        WHERE tenant_id=:tenant AND ticket_id=:id AND document_id=:d""",
        **ctx.parameters(),
        id=ident,
        d=body.document_id,
    ):
        raise HTTPException(422, "Select one of this ticket's policies")
    document(ctx, body.document_id)
    require_distributable(ctx, body.document_id)
    employee = one(
        ctx.db,
        "SELECT * FROM users WHERE tenant_id=:tenant AND id=:id AND active=1",
        **ctx.parameters(),
        id=record["user_id"],
    )
    if not employee or not readable(
        Context(ctx.db, employee, [], set(), ctx.request_id), body.document_id
    ):
        raise HTTPException(409, "Selected policy must remain accessible to the employee")
    execute(
        ctx.db,
        """UPDATE policy_tickets SET status='resolved',selected_document_id=:d,
        resolution=:reason,updated_at=:at,revision=revision+1 WHERE tenant_id=:tenant AND id=:id""",
        **ctx.parameters(),
        id=ident,
        d=body.document_id,
        reason=body.reason.strip(),
        at=now(),
    )
    decision_event(ctx, ident, "resolved", body.reason, body.document_id)
    notify(ctx, record, "Your policy conflict ticket has been resolved.")
    return detail(ctx, ident)


def rollback(ctx, ident, body):
    ctx.require("ticket.review")
    record = ticket(ctx, ident)
    if record["status"] != "resolved" or record["revision"] != body.expected_revision:
        raise HTTPException(409, "Ticket state changed; reload")
    execute(
        ctx.db,
        """UPDATE policy_tickets SET status='pending',selected_document_id=NULL,
        resolution=NULL,updated_at=:at,revision=revision+1 WHERE tenant_id=:tenant AND id=:id""",
        **ctx.parameters(),
        id=ident,
        at=now(),
    )
    decision_event(ctx, ident, "rollback", body.reason, record["selected_document_id"])
    notify(
        ctx, record, "The Auditor rolled back your ticket resolution. It is pending review again."
    )
    return detail(ctx, ident)


def attach(ctx, ident, filename, payload):
    ctx.require("ticket.create")
    record = ticket(ctx, ident)
    if record["user_id"] != ctx.user["id"]:
        raise HTTPException(404, "Resource unavailable")
    if record["status"] != "pending":
        raise HTTPException(409, "Evidence can be attached while the ticket is pending")
    name = Path(filename.replace("\\", "/")).name[:180]
    if Path(name).suffix.lower() not in {".txt", ".pdf", ".docx"}:
        raise HTTPException(415, "Attach TXT, PDF or DOCX")
    if not payload or len(payload) > 2 * 1024 * 1024:
        raise HTTPException(413, "Attachments must contain at most 2 MiB")
    count = one(
        ctx.db,
        "SELECT COUNT(*) AS n FROM ticket_attachments WHERE tenant_id=:tenant AND ticket_id=:id",
        **ctx.parameters(),
        id=ident,
    )["n"]
    if count >= 5:
        raise HTTPException(409, "A ticket can have at most five attachments")
    aid, digest = uid(), hashlib.sha256(payload).hexdigest()
    execute(
        ctx.db,
        """INSERT INTO ticket_attachments
        (id,tenant_id,ticket_id,uploaded_by,filename,content,sha256,created_at)
        VALUES (:id,:tenant,:t,:user,:name,:content,:hash,:at)""",
        **ctx.parameters(),
        id=aid,
        t=ident,
        name=name,
        content=payload,
        hash=digest,
        at=now(),
    )
    audit(ctx, "ticket.attachment.create", target=ident, target_type="ticket")
    return {"id": aid, "filename": name, "sha256": digest}
