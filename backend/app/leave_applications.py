"""Employee requests and auditor transitions append to the existing leave ledger."""

from datetime import date, timedelta
from typing import Literal
from fastapi import HTTPException
from pydantic import BaseModel, ConfigDict, Field, model_validator
from . import leave
from .security import audit, execute, now, one, rows, uid


class Application(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    leave_type_id: str = Field(min_length=1, max_length=100)
    start_date: date
    end_date: date
    reason: str = Field(min_length=3, max_length=2000)

    @model_validator(mode="after")
    def dates(self):
        if not 0 <= (self.end_date - self.start_date).days <= 366:
            raise ValueError("Choose an ordered date range of at most one year")
        if not self.reason.strip():
            raise ValueError("Provide a reason")
        return self


class Decision(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    expected_revision: int = Field(ge=0)
    decision: Literal["approved", "rejected"]
    comment: str = Field(min_length=3, max_length=2000)


class Change(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    expected_revision: int = Field(ge=0)
    reason: str = Field(min_length=3, max_length=2000)


def event(ctx, request_id, status, comment):
    execute(
        ctx.db,
        """INSERT INTO leave_request_events(id,tenant_id,request_id,actor_id,status,comment,created_at)
        VALUES (:id,:tenant,:r,:user,:s,:comment,:at)""",
        **ctx.parameters(),
        id=uid(),
        r=request_id,
        s=status,
        comment=comment.strip(),
        at=now(),
    )
    audit(ctx, "leave.application." + status, target=request_id, target_type="leave_request")


def item(ctx, ident):
    record = one(
        ctx.db,
        """SELECT a.*,u.display_name,t.name AS leave_type_name
        FROM leave_requests a JOIN users u ON u.tenant_id=a.tenant_id AND u.id=a.user_id
        JOIN leave_types t ON t.tenant_id=a.tenant_id AND t.id=a.leave_type_id
        WHERE a.tenant_id=:tenant AND a.id=:id""",
        **ctx.parameters(),
        id=ident,
    )
    if not record or (record["user_id"] != ctx.user["id"] and "leave.read_all" not in ctx.actions):
        raise HTTPException(404, "Resource unavailable")
    return record


def detail(ctx, ident):
    record = item(ctx, ident)
    audit(ctx, "leave.application.read", target=ident, target_type="leave_request")
    record["history"] = rows(
        ctx.db,
        """SELECT e.status,e.comment,e.created_at,u.display_name AS actor
        FROM leave_request_events e JOIN users u ON u.tenant_id=e.tenant_id AND u.id=e.actor_id
        WHERE e.tenant_id=:tenant AND e.request_id=:id ORDER BY e.created_at,e.id""",
        **ctx.parameters(),
        id=ident,
    )
    return record


def listing(ctx):
    if "leave.read_all" not in ctx.actions:
        ctx.require("leave.apply")
    records = rows(
        ctx.db,
        """SELECT a.*,u.display_name,t.name AS leave_type_name FROM leave_requests a
        JOIN users u ON u.tenant_id=a.tenant_id AND u.id=a.user_id
        JOIN leave_types t ON t.tenant_id=a.tenant_id AND t.id=a.leave_type_id
        WHERE a.tenant_id=:tenant AND (:all=1 OR a.user_id=:user)
        ORDER BY a.created_at DESC,a.id""",
        **ctx.parameters(),
        all=int("leave.read_all" in ctx.actions),
    )
    audit(ctx, "leave.applications.read")
    return {"items": records}


def apply(ctx, body):
    ctx.require("leave.apply")
    leave.employee(ctx, ctx.user["id"])
    if not one(
        ctx.db,
        "SELECT id FROM leave_types WHERE tenant_id=:tenant AND id=:id AND active=1",
        **ctx.parameters(),
        id=body.leave_type_id,
    ):
        raise HTTPException(404, "Resource unavailable")
    days = sum(
        (body.start_date + timedelta(days=i)).weekday() < 5
        for i in range((body.end_date - body.start_date).days + 1)
    )
    if days == 0:
        raise HTTPException(422, "The range must contain at least one weekday")
    if one(
        ctx.db,
        """SELECT id FROM leave_requests WHERE tenant_id=:tenant AND user_id=:user
        AND status IN ('pending','approved','cancellation_pending')
        AND start_date<=:end AND end_date>=:start""",
        **ctx.parameters(),
        start=body.start_date.isoformat(),
        end=body.end_date.isoformat(),
    ):
        raise HTTPException(409, "An active leave request already overlaps these dates")
    ident, at = uid(), now()
    execute(
        ctx.db,
        """INSERT INTO leave_requests
        (id,tenant_id,user_id,leave_type_id,start_date,end_date,days,reason,status,created_at,updated_at,revision)
        VALUES (:id,:tenant,:user,:type,:start,:end,:days,:reason,'pending',:at,:at,0)""",
        **ctx.parameters(),
        id=ident,
        type=body.leave_type_id,
        start=body.start_date.isoformat(),
        end=body.end_date.isoformat(),
        days=days,
        reason=body.reason.strip(),
        at=at,
    )
    event(ctx, ident, "pending", body.reason)
    return detail(ctx, ident)


def withdraw(ctx, ident, body):
    ctx.require("leave.apply")
    record = item(ctx, ident)
    if record["user_id"] != ctx.user["id"]:
        raise HTTPException(404, "Resource unavailable")
    if record["revision"] != body.expected_revision or record["status"] not in (
        "pending",
        "approved",
    ):
        raise HTTPException(409, "Leave state changed; reload")
    status = "withdrawn" if record["status"] == "pending" else "cancellation_pending"
    execute(
        ctx.db,
        """UPDATE leave_requests SET status=:s,updated_at=:at,revision=revision+1
        WHERE tenant_id=:tenant AND id=:id""",
        **ctx.parameters(),
        id=ident,
        s=status,
        at=now(),
    )
    event(ctx, ident, status, body.reason)
    return detail(ctx, ident)


def transact(ctx, record, restoration=False):
    ident = uid()
    execute(
        ctx.db,
        """INSERT INTO leave_ledger_entries
        (id,tenant_id,user_id,leave_type_id,entry_type,days,effective_date,reference,created_by,created_at)
        VALUES (:id,:tenant,:employee,:type,:entry,:days,:effective,:reference,:user,:at)""",
        **ctx.parameters(),
        id=ident,
        employee=record["user_id"],
        type=record["leave_type_id"],
        entry="adjustment" if restoration else "usage",
        days=record["days"] if restoration else -record["days"],
        effective=leave.today(ctx).isoformat(),
        reference="Leave request " + record["id"],
        at=now(),
    )
    execute(
        ctx.db,
        """INSERT INTO leave_request_transactions
        (id,tenant_id,request_id,ledger_entry_id,operation) VALUES (:id,:tenant,:request,:ledger,:operation)""",
        **ctx.parameters(),
        id=uid(),
        request=record["id"],
        ledger=ident,
        operation="restoration" if restoration else "deduction",
    )


def decide(ctx, ident, body):
    ctx.require("leave.review")
    record = item(ctx, ident)
    if record["user_id"] == ctx.user["id"]:
        raise HTTPException(403, "Independent Auditor review is required")
    if record["revision"] != body.expected_revision or record["status"] not in (
        "pending",
        "cancellation_pending",
    ):
        raise HTTPException(409, "Leave state changed; reload")
    cancelling = record["status"] == "cancellation_pending"
    status = body.decision
    if cancelling:
        status = "cancelled" if body.decision == "approved" else "approved"
        if status == "cancelled":
            transact(ctx, record, restoration=True)
    elif status == "approved":
        leave.employee(ctx, record["user_id"])
        balances = leave.balance(ctx, record["user_id"], leave.today(ctx))["balances"]
        available = next(
            (b["balance_days"] for b in balances if b["leave_type_id"] == record["leave_type_id"]),
            0,
        )
        if available < record["days"]:
            raise HTTPException(409, "Insufficient available leave balance")
        transact(ctx, record)
    execute(
        ctx.db,
        """UPDATE leave_requests SET status=:s,reviewer_id=:user,review_comment=:comment,
        updated_at=:at,revision=revision+1 WHERE tenant_id=:tenant AND id=:id""",
        **ctx.parameters(),
        id=ident,
        s=status,
        comment=body.comment.strip(),
        at=now(),
    )
    event(ctx, ident, status, body.comment)
    return detail(ctx, ident)
