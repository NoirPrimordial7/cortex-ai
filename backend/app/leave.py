"""Personal balances and current reporting access, independent of policy evidence."""

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


CURRENT_REPORT = """r.tenant_id=:tenant AND r.manager_user_id=:user
    AND r.valid_from<=:today AND (r.valid_to IS NULL OR :today<r.valid_to)"""


def today(ctx):
    tenant = one(
        ctx.db, "SELECT policy_timezone FROM tenants WHERE id=:tenant", **ctx.parameters()
    )
    return datetime.now(ZoneInfo(tenant["policy_timezone"])).date()


def employee(ctx, user_id):
    person = one(
        ctx.db,
        "SELECT id,display_name FROM users WHERE tenant_id=:tenant AND id=:id AND active=1",
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
    user_id = ctx.user["id"]
    result = balance(ctx, user_id, as_of or today(ctx))
    record(ctx, "leave.balance.read", user_id)
    return result


def employee_balance(ctx, user_id, as_of):
    current_date = today(ctx)
    if "leave.view_reports" in ctx.actions:
        ctx.require("leave.view_reports")
        if not one(
            ctx.db,
            f"""SELECT r.id FROM reporting_relationships r WHERE {CURRENT_REPORT}
            AND r.employee_user_id=:id""",
            **ctx.parameters(),
            today=current_date.isoformat(),
            id=user_id,
        ):
            raise HTTPException(404, "Resource unavailable")
    elif "leave.manage" in ctx.actions:
        ctx.require("leave.manage")
    else:
        raise HTTPException(404, "Resource unavailable")
    person = employee(ctx, user_id)
    result = balance(ctx, user_id, as_of or current_date)
    record(ctx, "leave.employee_balance.read", user_id)
    return {**result, "display_name": person["display_name"]}


def team(ctx):
    ctx.require("leave.view_reports")
    current_date = today(ctx)
    people = rows(
        ctx.db,
        f"""SELECT u.id,u.display_name FROM reporting_relationships r
        JOIN users u ON u.tenant_id=r.tenant_id AND u.id=r.employee_user_id
        WHERE {CURRENT_REPORT} AND u.active=1 ORDER BY u.display_name,u.id""",
        **ctx.parameters(),
        today=current_date.isoformat(),
    )
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
    employee(ctx, user_id)
    employee(ctx, body.manager_user_id)
    if user_id == body.manager_user_id:
        raise HTTPException(422, "An employee cannot manage their own account")
    params = dict(**ctx.parameters(), employee=user_id, today=today(ctx).isoformat())
    remaining = rows(
        ctx.db,
        """SELECT id,manager_user_id,valid_from FROM reporting_relationships
        WHERE tenant_id=:tenant AND employee_user_id=:employee
        AND (valid_to IS NULL OR :today<valid_to)""",
        **params,
    )
    if len(remaining) > 1 or (remaining and remaining[0]["valid_from"] > params["today"]):
        raise HTTPException(409, "Reporting intervals overlap this assignment")
    current = remaining[0] if remaining else None
    if not current or current["manager_user_id"] != body.manager_user_id:
        if current:
            execute(
                ctx.db,
                """UPDATE reporting_relationships SET valid_to=:today,open_ended=0
                WHERE tenant_id=:tenant AND id=:id""",
                **params,
                id=current["id"],
            )
        current = {"id": uid(), "manager_user_id": body.manager_user_id, "valid_from": params["today"]}
        execute(
            ctx.db,
            """INSERT INTO reporting_relationships
            (id,tenant_id,employee_user_id,manager_user_id,valid_from,valid_to,open_ended)
            VALUES (:id,:tenant,:employee,:manager_user_id,:valid_from,NULL,1)""",
            **params,
            **current,
        )
    record(ctx, "leave.manager.set", user_id)
    return {**current, "employee_user_id": user_id, "valid_to": None, "open_ended": True}
