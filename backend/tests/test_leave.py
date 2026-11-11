from datetime import date, datetime, timezone

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy.exc import IntegrityError

from app import leave
from app.cli import migrate
from app.db import engine_for
from app.security import execute, one, rows
from app.settings import ROOT
from conftest import ask, client_for


@pytest.fixture
def leave_date(monkeypatch):
    monkeypatch.setattr(leave, "today", lambda ctx: date(2026, 11, 12))


def balance_days(response):
    assert response.status_code in (200, 201), response.text
    return response.json()["balances"][0]["balance_days"]


def employee_balance(client, who, **params):
    return client.get(f"/api/v1/leave/employees/{who}/balance", params=params)


def test_own_balance_is_available_without_query_permission(system, leave_date):
    maya = client_for(system)
    assert balance_days(maya.get("/api/v1/leave/balance")) == 17
    assert balance_days(maya.get("/api/v1/leave/balance", params={"as_of": "2026-08-31"})) == 20
    assert balance_days(maya.get("/api/v1/leave/balance", params={"as_of": "2025-12-31"})) == 0
    assert employee_balance(maya, "ravi").status_code == 404
    assert employee_balance(maya, "missing").status_code == 404
    assert maya.get("/api/v1/leave/team").status_code == 403
    assert balance_days(client_for(system, "isha").get("/api/v1/leave/balance")) == 0


def test_current_report_access_is_scoped_even_with_admin_role(system, leave_date):
    ravi = client_for(system, "ravi")
    assert balance_days(employee_balance(ravi, "maya", as_of="2026-01-01")) == 20
    for user_id in ("isha", "noor", "orbit-user", "ravi", "missing"):
        assert employee_balance(ravi, user_id).status_code == 404
    team = ravi.get("/api/v1/leave/team").json()
    assert [p["user_id"] for p in team["items"]] == ["maya"]
    assert team["items"][0]["balances"][0]["balance_days"] == 17

    app, _ = system
    with app.state.engine.begin() as db:
        execute(db, "DELETE FROM user_roles WHERE user_id='ravi' AND role_id='manager'")
    assert ravi.get("/api/v1/leave/team").status_code == 403
    assert balance_days(employee_balance(ravi, "isha")) == 0
    assert employee_balance(ravi, "orbit-user").status_code == 404


def test_append_is_audited_isolated_and_excluded_from_evidence(system, leave_date):
    ravi = client_for(system, "ravi")
    maya = client_for(system)
    orbit = client_for(system, "orbit")
    endpoint = "/api/v1/leave/ledger-entries"
    entry = {
        "user_id": "maya",
        "leave_type_id": "annual-leave",
        "entry_type": "adjustment",
        "days": -4,
        "effective_date": "2026-11-12",
        "reference": "Private ledger canary",
    }
    assert maya.post(endpoint, json=entry).status_code == 403
    assert ravi.post(endpoint, json={**entry, "user_id": "orbit-user"}).status_code == 404
    assert ravi.post(endpoint, json={**entry, "leave_type_id": "missing"}).status_code == 404
    for invalid in ({"days": 0}, {"days": True}, {"entry_type": "unknown"}, {"tenant_id": "ORBIT"}):
        assert ravi.post(endpoint, json={**entry, **invalid}).status_code == 422
    created = ravi.post(endpoint, json=entry)
    assert created.status_code == 201
    assert balance_days(created) == 13
    assert balance_days(maya.get("/api/v1/leave/balance")) == 13
    assert balance_days(ravi.post(endpoint, json={**entry, "effective_date": "2026-11-13"})) == 13
    assert orbit.get("/api/v1/leave/balance").json()["balances"] == []
    assert employee_balance(orbit, "maya").status_code == 404

    answer = ask(maya)
    assert "20 working days per year" in answer["answer"]
    assert answer["citations"]
    assert "Private ledger canary" not in str(answer)
    app, _ = system
    with app.state.engine.connect() as db:
        event = one(
            db,
            """SELECT actor_user_id,target_type,target_id FROM audit_events
            WHERE tenant_id='NORTHSTAR' AND action='leave.ledger_entry.create'""",
        )
        assert event == {"actor_user_id": "ravi", "target_type": "user", "target_id": "maya"}
        for sql in (
            "UPDATE leave_ledger_entries SET days=1 WHERE id=:id",
            "DELETE FROM leave_ledger_entries WHERE id=:id",
        ):
            with pytest.raises(IntegrityError, match="append-only"):
                execute(db, sql, id=created.json()["entry_id"])


def test_relationship_switch_is_half_open_and_access_uses_today(system, leave_date, monkeypatch):
    ravi = client_for(system, "ravi")
    isha = client_for(system, "isha")
    app, _ = system
    with app.state.engine.begin() as db:
        execute(
            db,
            """INSERT INTO user_roles (id,tenant_id,user_id,role_id)
            VALUES ('isha-manager','NORTHSTAR','isha','manager')""",
        )
    endpoint = "/api/v1/admin/users/maya/manager"
    assert employee_balance(isha, "maya").status_code == 404
    assert isha.put(endpoint, json={"manager_user_id": "isha"}).status_code == 403
    assert ravi.put(endpoint, json={"manager_user_id": "orbit-user"}).status_code == 404
    assert ravi.put(endpoint, json={"manager_user_id": "maya"}).status_code == 422
    changed = ravi.put(endpoint, json={"manager_user_id": "isha"})
    assert changed.status_code == 200
    assert changed.json()["valid_from"] == "2026-11-12"
    assert ravi.put(endpoint, json={"manager_user_id": "isha"}).json() == changed.json()
    assert employee_balance(ravi, "maya", as_of="2026-11-11").status_code == 404
    assert ravi.get("/api/v1/leave/team").json()["items"] == []
    assert balance_days(employee_balance(isha, "maya", as_of="2026-11-11")) == 17

    monkeypatch.setattr(leave, "today", lambda ctx: date(2026, 11, 11))
    assert employee_balance(isha, "maya", as_of="2026-11-12").status_code == 404
    assert balance_days(employee_balance(ravi, "maya")) == 17
    assert ravi.put(endpoint, json={"manager_user_id": "isha"}).status_code == 409


def test_default_date_uses_tenant_timezone_across_utc_midnight(system, monkeypatch):
    class FixedDateTime(datetime):
        @classmethod
        def now(cls, tz):
            return datetime(2026, 11, 11, 19, tzinfo=timezone.utc).astimezone(tz)

    monkeypatch.setattr(leave, "datetime", FixedDateTime)
    response = client_for(system).get("/api/v1/leave/balance")
    assert balance_days(response) == 17
    assert response.json()["as_of"] == "2026-11-12"


def test_migration_adds_permissions_without_seeding_an_existing_database(tmp_path):
    engine = engine_for(tmp_path / "existing.sqlite3")
    cfg = Config(str(ROOT / "backend" / "alembic.ini"))
    cfg.set_main_option("script_location", str(ROOT / "backend" / "migrations"))
    with engine.begin() as db:
        cfg.attributes["connection"] = db
        command.upgrade(cfg, "0001")
        execute(db, "INSERT INTO tenants VALUES ('EXISTING','Existing','UTC',1,1)")
        execute(db, "INSERT INTO roles VALUES ('existing-admin','EXISTING','admin')")
    migrate(engine)
    with engine.connect() as db:
        grants = rows(
            db,
            """SELECT r.name,p.permission_key FROM roles r JOIN role_permissions p
              ON p.tenant_id=r.tenant_id AND p.role_id=r.id WHERE r.tenant_id='EXISTING'""",
        )
        assert {(r["name"], r["permission_key"]) for r in grants} == {
            ("admin", "leave.manage"),
            ("manager", "query.execute"),
            ("manager", "leave.view_reports"),
        }
        assert rows(db, "SELECT id FROM leave_types") == []
        assert rows(db, "SELECT id FROM reporting_relationships") == []
    engine.dispose()
