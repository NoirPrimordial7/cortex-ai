"""Employee balances and centralized leave access, independent of policy evidence."""

from datetime import date, datetime
from typing import Literal
from zoneinfo import ZoneInfo

from fastapi import HTTPException
from pydantic import BaseModel, ConfigDict, Field

from .security import audit, execute, now, one, rows, uid


class LedgerEntry(BaseModel):
    model_config = ConfigDict(extra="forbid")
    user_id: str = Field(min_length=1, max_length=100)
    leave_type_id: str = Field(min_length=1, max_length=100)
    entry_type: Literal["grant", "accrual", "usage", "adjustment", "carry_forward"]
    days: int = Field(strict=True, ge=-10000, le=10000)
    effective_date: date
    reference: str | None = Field(default=None, max_length=1000)


class ManagerUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    manager_user_id: str = Field(min_length=1, max_length=100)


def today(ctx):
    tenant = one(
        ctx.db, "SELECT policy_timezone FROM tenants WHERE id=:tenant", **ctx.parameters()
    )
    return datetime.now(ZoneInfo(tenant["policy_timezone"])).date()


def employee(ctx, user_id):
    person = one(
        ctx.db,
        """SELECT u.id,u.display_name FROM users u WHERE u.tenant_id=:tenant AND u.id=:id AND u.active=1
        AND EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON r.tenant_id=ur.tenant_id AND r.id=ur.role_id
          WHERE ur.tenant_id=u.tenant_id AND ur.user_id=u.id AND r.name='employee')""",
        **ctx.parameters(),
        id=user_id,
    )
    if not person:
        raise HTTPException(404, "Resource unavailable")
    return person


def balance(ctx, user_id, as_of):
    return {
        "user_id": user_id,
        "as_of": as_of,
        "balances": rows(
            ctx.db,
            """SELECT t.id AS leave_type_id,t.code,t.name,t.annual_entitlement_days,
                   COALESCE(SUM(e.days),0) AS balance_days
            FROM leave_types t LEFT JOIN leave_ledger_entries e
              ON e.tenant_id=t.tenant_id AND e.leave_type_id=t.id
              AND e.user_id=:id AND e.effective_date<=:as_of
            WHERE t.tenant_id=:tenant
            GROUP BY t.id
            HAVING t.active=1 OR COUNT(e.id)>0
            ORDER BY t.name,t.id""",
            **ctx.parameters(),
            id=user_id,
            as_of=as_of.isoformat(),
        ),
    }


def record(ctx, action, user_id):
    audit(ctx, action, target=user_id, target_type="user")


def own_balance(ctx, as_of):
    ctx.require("leave.apply")
    user_id = ctx.user["id"]
    result = balance(ctx, user_id, as_of or today(ctx))
    record(ctx, "leave.balance.read", user_id)
    return result


def employee_balance(ctx, user_id, as_of):
    current_date = today(ctx)
    if "leave.read_all" not in ctx.actions:
        raise HTTPException(404, "Resource unavailable")
    ctx.require("leave.read_all")
    person = employee(ctx, user_id)
    result = balance(ctx, user_id, as_of or current_date)
    record(ctx, "leave.employee_balance.read", user_id)
    return {**result, "display_name": person["display_name"]}


def current_reports(ctx):
    ctx.require("leave.read_all")
    current_date = today(ctx)
    return current_date, rows(
        ctx.db,
        """SELECT u.id,u.display_name FROM users u WHERE u.tenant_id=:tenant AND u.active=1
        AND EXISTS(SELECT 1 FROM user_roles ur JOIN roles r ON r.tenant_id=ur.tenant_id AND r.id=ur.role_id
          WHERE ur.tenant_id=u.tenant_id AND ur.user_id=u.id AND r.name='employee')
        ORDER BY u.display_name,u.id""",
        **ctx.parameters(),
        today=current_date.isoformat(),
    )


def team(ctx):
    current_date, people = current_reports(ctx)
    result = [
        {**balance(ctx, person["id"], current_date), "display_name": person["display_name"]}
        for person in people
    ]
    record(ctx, "leave.team.read", ctx.user["id"])
    return {"as_of": current_date, "items": result}


def append_entry(ctx, body):
    ctx.require("leave.manage")
    employee(ctx, body.user_id)
    if not one(
        ctx.db,
        "SELECT id FROM leave_types WHERE tenant_id=:tenant AND id=:id",
        **ctx.parameters(),
        id=body.leave_type_id,
    ):
        raise HTTPException(404, "Resource unavailable")
    if body.days == 0:
        raise HTTPException(422, "Ledger entries must change the balance")
    if body.entry_type in ("grant", "accrual", "carry_forward") and body.days < 0:
        raise HTTPException(422, "Allocations must be positive")
    if body.entry_type == "usage" and body.days > 0:
        raise HTTPException(422, "Usage must deduct days")
    entry_id = uid()
    execute(
        ctx.db,
        """INSERT INTO leave_ledger_entries
        (id,tenant_id,user_id,leave_type_id,entry_type,days,effective_date,reference,created_by,created_at)
        VALUES (:id,:tenant,:user_id,:leave_type_id,:entry_type,:days,:effective_date,:reference,:user,:at)""",
        **ctx.parameters(),
        **body.model_dump(mode="json"),
        id=entry_id,
        at=now(),
    )
    record(ctx, "leave.ledger_entry.create", body.user_id)
    return {**balance(ctx, body.user_id, today(ctx)), "entry_id": entry_id}


def set_manager(ctx, user_id, body):
    ctx.require("user.manage")
    raise HTTPException(410, "Reporting assignments are historical; use centralized Leave Management")
