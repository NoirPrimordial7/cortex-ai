"""Policy re-audit tickets with append-only decisions and explicit source access."""

from fastapi import HTTPException
from pydantic import BaseModel, ConfigDict, Field
from .security import audit, execute, now, one, readable, rows, uid
from . import conflict_reaudit


class TicketInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    query_id: str = Field(min_length=1, max_length=100)


class Resolution(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    expected_revision: int = Field(ge=0)
    clause_id: str = Field(min_length=1, max_length=100)
    reason: str = Field(min_length=5, max_length=4000)


class Rollback(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    expected_revision: int = Field(ge=0)
    reason: str = Field(min_length=5, max_length=4000)


def ticket(ctx, ident):
    ctx.require("ticket.review")
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
    ctx.require("ticket.review")
    records = rows(
        ctx.db,
        """SELECT t.id,t.description,t.status,t.created_at,t.updated_at,t.revision,u.display_name,
        EXISTS(SELECT 1 FROM ticket_conflict_contexts c WHERE c.tenant_id=t.tenant_id AND c.ticket_id=t.id) AS from_cortex
        FROM policy_tickets t JOIN users u ON u.tenant_id=t.tenant_id AND u.id=t.user_id
        WHERE t.tenant_id=:tenant AND (:all=1 OR t.user_id=:user)
        ORDER BY t.created_at DESC,t.id""",
        **ctx.parameters(),
        all=int("ticket.review" in ctx.actions),
    )
    audit(ctx, "ticket.list.read")
    return {"items": records}


def detail(ctx, ident, settings):
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
    record["conflict_context"] = conflict_reaudit.context(ctx, ident)
    record["conflict_sources"] = conflict_reaudit.sources(ctx, ident, settings)
    audit(ctx, "ticket.read", target=ident, target_type="ticket")
    return record


def create(ctx, body):
    return conflict_reaudit.create(ctx, body.query_id)


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


def resolve(ctx, ident, body, settings):
    ctx.require("ticket.review")
    record = ticket(ctx, ident)
    conflict_reaudit.resolve(ctx, record, body, settings)
    return detail(ctx, ident, settings)


def rollback(ctx, ident, body, settings):
    ctx.require("ticket.review")
    record = ticket(ctx, ident)
    if not conflict_reaudit.context(ctx, ident):
        raise HTTPException(409, "Historical manual tickets are read-only")
    conflict_reaudit.rollback(ctx, record, body)
    return detail(ctx, ident, settings)


def attach(ctx, ident, filename, payload):
    ctx.require("ticket.create")
    raise HTTPException(
        410,
        "Re-audit now uses the actual Ask Cortex conflict; employee forms and attachments are retired",
    )
