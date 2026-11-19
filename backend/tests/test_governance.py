"""Integrated governance transitions against real migrated SQLite and uploaded files."""

import hashlib
from datetime import date
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError
from app import leave
from app.main import create_app
from app.security import execute, one
from conftest import ORIGIN, ask, client_for
from test_ingestion import payload_for, review_body


def upload(admin):
    r = admin.post(
        "/api/v1/documents",
        data={"title": "Governance notice"},
        files={"file": ("notice.txt", payload_for("txt"))},
    )
    assert r.status_code == 202, r.text
    return r.json()


def publish(admin, auditor, u):
    vid = u["version_id"]
    assert (
        admin.post(f"/api/v1/versions/{vid}/submit", json={"expected_revision": 0}).status_code
        == 200
    )
    h = auditor.post("/api/v1/policy-headings", json={"name": "Employment terms"}).json()
    b = review_body(auditor.get(f"/api/v1/versions/{vid}/content").json())
    b["heading_id"] = h["id"]
    r = auditor.post(f"/api/v1/versions/{vid}/review", json=b)
    assert r.status_code == 200, r.text
    return b


def grant(admin, did):
    acl = admin.get(f"/api/v1/admin/documents/{did}/acl").json()
    r = admin.put(
        f"/api/v1/admin/documents/{did}/acl",
        json={
            "expected_policy_revision": acl["policy_revision"],
            "grants": [{"user_id": "ravi"}, {"role_id": "employee"}, {"role_id": "auditor"}],
        },
    )
    assert r.status_code == 200, r.text


def test_policy_separation_headings_distribution_versions(system):
    admin, auditor, employee = (client_for(system, u) for u in ("ravi", "isha", "maya"))
    u = upload(admin)
    vid, did = u["version_id"], u["document_id"]
    b = review_body(admin.get(f"/api/v1/versions/{vid}/content").json())
    assert admin.post(f"/api/v1/versions/{vid}/review", json=b).status_code == 403
    acl = admin.get(f"/api/v1/admin/documents/{did}/acl").json()
    assert (
        admin.put(
            f"/api/v1/admin/documents/{did}/acl",
            json={
                "expected_policy_revision": acl["policy_revision"],
                "grants": [{"role_id": "employee"}],
            },
        ).status_code
        == 409
    )
    assert employee.get(f"/api/v1/documents/{did}").status_code == 404
    b = publish(admin, auditor, u)
    h = auditor.post("/api/v1/policy-headings", json={"name": "  EMPLOYMENT   terms  "}).json()
    assert h["id"] == b["heading_id"]
    assert admin.post("/api/v1/policy-headings", json={"name": "Cannot create"}).status_code == 403
    assert auditor.get(f"/api/v1/admin/documents/{did}/acl").status_code == 403
    assert employee.get(f"/api/v1/versions/{vid}/content").status_code == 404
    grant(admin, did)
    assert employee.get(f"/api/v1/versions/{vid}/content").status_code == 200
    newer = admin.post(
        f"/api/v1/documents/{did}/versions",
        data={"version_label": "v2"},
        files={"file": ("revised.txt", payload_for("txt") + b"Additional explanatory line.\n")},
    ).json()
    assert employee.get(f"/api/v1/versions/{newer['version_id']}/content").status_code == 404
    assert (
        employee.post(
            f"/api/v1/documents/{did}/versions",
            data={"version_label": "v2"},
            files={"file": ("probe.txt", payload_for("txt"))},
        ).status_code
        == 403
    )
    versions = employee.get(f"/api/v1/documents/{did}").json()["versions"]
    assert [v["id"] for v in versions] == [vid]
    history = admin.get(f"/api/v1/versions/{vid}/workflow").json()["history"]
    assert {h["status"] for h in history} == {"draft", "submitted", "approved"}
    assert "Employment terms" in employee.get("/api/v1/documents").text


def test_policy_rejection_resubmission_and_no_self_review(system):
    admin, auditor = client_for(system, "ravi"), client_for(system, "isha")
    u = upload(admin)
    vid = u["version_id"]
    admin.post(f"/api/v1/versions/{vid}/submit", json={"expected_revision": 0})
    b = review_body(auditor.get(f"/api/v1/versions/{vid}/content").json())
    b.update(
        approval_state="rejected", claim=None, reason="Source needs a corrected policy statement"
    )
    assert auditor.post(f"/api/v1/versions/{vid}/review", json=b).status_code == 200
    assert admin.get(f"/api/v1/versions/{vid}/workflow").json()["status"] == "rejected"
    assert (
        admin.post(f"/api/v1/versions/{vid}/submit", json={"expected_revision": 2}).status_code
        == 200
    )
    # A former uploader promoted to Auditor still cannot approve their own source.
    with system[0].state.engine.begin() as db:
        execute(
            db,
            "UPDATE user_roles SET role_id='auditor' WHERE tenant_id='NORTHSTAR' AND user_id='ravi'",
        )
    assert (
        admin.post(
            f"/api/v1/versions/{vid}/review", json={**b, "expected_metadata_revision": 1}
        ).status_code
        == 403
    )


@pytest.fixture
def leave_clock(monkeypatch):
    monkeypatch.setattr(leave, "today", lambda ctx: date(2026, 11, 19))


def days(employee):
    return employee.get("/api/v1/leave/balance").json()["balances"][0]["balance_days"]


def application(employee, start="2026-12-01", end="2026-12-03"):
    r = employee.post(
        "/api/v1/leave/requests",
        json={
            "leave_type_id": "annual-leave",
            "start_date": start,
            "end_date": end,
            "reason": "Family travel plans",
        },
    )
    assert r.status_code == 201, r.text
    return r.json()


def decide(auditor, r, decision="approved"):
    return auditor.post(
        f"/api/v1/leave/requests/{r['id']}/decision",
        json={
            "expected_revision": r["revision"],
            "decision": decision,
            "comment": "Auditor reviewed this request",
        },
    )


def test_leave_deduction_cancellation_exactly_once_and_history(system, leave_clock):
    employee, auditor, admin = (client_for(system, u) for u in ("maya", "isha", "ravi"))
    before = days(employee)
    r = application(employee)
    assert r["days"] == 3 and days(employee) == before
    assert len(auditor.get("/api/v1/leave/requests").json()["items"]) == 1
    assert decide(admin, r).status_code == 403
    assert decide(employee, r).status_code == 403
    approved = decide(auditor, r)
    assert approved.status_code == 200, approved.text
    assert days(employee) == before - 3
    assert decide(auditor, r).status_code == 409
    cancel = employee.post(
        f"/api/v1/leave/requests/{r['id']}/withdraw",
        json={"expected_revision": 1, "reason": "Travel plans have changed"},
    )
    assert cancel.json()["status"] == "cancellation_pending"
    assert days(employee) == before - 3
    restored = decide(auditor, cancel.json())
    assert restored.status_code == 200, restored.text
    assert restored.json()["status"] == "cancelled" and days(employee) == before
    assert decide(auditor, cancel.json()).status_code == 409
    ledger = employee.get("/api/v1/leave/ledger").json()["items"]
    assert sum(e["days"] for e in ledger) == before
    with system[0].state.engine.begin() as db:
        assert one(db, "SELECT COUNT(*) n FROM leave_request_transactions")["n"] == 2
    assert len(restored.json()["history"]) == 4
    for c in (admin, auditor):
        assert c.get("/api/v1/leave/balance").status_code == 403
        assert c.get("/api/v1/leave/team").json()["items"][0]["user_id"] == "maya"
    assert employee.get("/api/v1/leave/ledger", params={"user_id": "ravi"}).status_code == 403


def test_leave_withdraw_reject_insufficient_invalid_private(system, leave_clock):
    employee, auditor, orbit = (client_for(system, u) for u in ("maya", "isha", "orbit"))
    before = days(employee)
    r = application(employee)
    assert orbit.get(f"/api/v1/leave/requests/{r['id']}").status_code == 404
    w = employee.post(
        f"/api/v1/leave/requests/{r['id']}/withdraw",
        json={"expected_revision": 0, "reason": "No longer needed"},
    )
    assert w.json()["status"] == "withdrawn" and days(employee) == before
    assert decide(auditor, r).status_code == 409
    rejected = application(employee)
    assert decide(auditor, rejected, "rejected").json()["status"] == "rejected"
    assert days(employee) == before
    large = application(employee, "2027-01-01", "2027-03-01")
    assert decide(auditor, large).status_code == 409 and days(employee) == before
    for start, end in [("2026-12-05", "2026-12-06"), ("2026-12-10", "2026-12-01")]:
        assert (
            employee.post(
                "/api/v1/leave/requests",
                json={
                    "leave_type_id": "annual-leave",
                    "start_date": start,
                    "end_date": end,
                    "reason": "Weekend or reversed range",
                },
            ).status_code
            == 422
        )


def test_conflict_request_history_and_notifications_persist(system):
    employee, auditor, admin, orbit = (
        client_for(system, u) for u in ("maya", "isha", "ravi", "orbit")
    )
    q = ask(employee, "How many remote days per week?")
    r = employee.post("/api/v1/policy-tickets", json={"query_id": q["query_id"]})
    assert r.status_code == 201, r.text
    path = "/api/v1/policy-tickets/" + r.json()["id"]
    for user in (employee, admin, orbit):
        assert user.get(path).status_code == 403
    body = {
        "expected_revision": 0,
        "clause_id": q["citations"][0]["clause_id"],
        "reason": "Use this policy for the exact reviewed conflict.",
    }
    assert auditor.post(path + "/resolve", json=body).status_code == 200
    assert (
        auditor.post(
            path + "/rollback",
            json={"expected_revision": 1, "reason": "Review the competing source again."},
        ).status_code
        == 200
    )
    history = auditor.get(path).json()["history"]
    assert [h["operation"] for h in history] == ["submitted", "resolved", "rollback"]
    notices = employee.get("/api/v1/notifications").json()["items"]
    assert len(notices) == 2
    assert employee.post(f"/api/v1/notifications/{notices[0]['id']}/read").status_code == 200
    restarted = create_app(system[0].state.settings)
    try:
        c = client_for((restarted, system[1]), "isha")
        assert c.get(path).json()["history"] == history
    finally:
        restarted.state.engine.dispose()


def test_reject_requires_only_comment_and_cannot_be_replayed_after_resubmission(system):
    admin, auditor = client_for(system, "ravi"), client_for(system, "isha")
    u = upload(admin)
    vid = u["version_id"]
    admin.post(f"/api/v1/versions/{vid}/submit", json={"expected_revision": 0})
    body = {"expected_revision": 1, "reason": "Source is incomplete and must be corrected."}
    assert admin.post(f"/api/v1/versions/{vid}/reject", json=body).status_code == 403
    assert auditor.post(f"/api/v1/versions/{vid}/reject", json=body).json()["status"] == "rejected"
    assert (
        admin.post(f"/api/v1/versions/{vid}/submit", json={"expected_revision": 2}).status_code
        == 200
    )
    assert auditor.post(f"/api/v1/versions/{vid}/reject", json=body).status_code == 409
    assert (
        auditor.post(
            f"/api/v1/versions/{vid}/reject", json={"expected_revision": 3, "reason": "   "}
        ).status_code
        == 422
    )


def test_integrity_bytes_text_trust_and_private_key(system):
    admin = client_for(system, "ravi")
    u = upload(admin)
    vid = u["version_id"]
    path = f"/api/v1/versions/{vid}/integrity"
    r = admin.get(path)
    assert r.json()["status"] == "Verified", r.text
    assert r.json()["sha256"] == hashlib.sha256(payload_for("txt")).hexdigest()
    assert "PRIVATE KEY" not in r.text and "private_key" not in r.text
    settings = system[0].state.settings
    with system[0].state.engine.begin() as db:
        v = one(db, "SELECT object_key FROM document_versions WHERE id=:id", id=vid)
    raw = settings.data_dir / "uploads" / v["object_key"]
    original = raw.read_bytes()
    raw.write_bytes(b"Altered document bytes")
    assert admin.get(path).json()["status"] == "Integrity Mismatch"
    admin.post(f"/api/v1/versions/{vid}/submit", json={"expected_revision": 0})
    auditor = client_for(system, "isha")
    heading = auditor.post("/api/v1/policy-headings", json={"name": "Integrity review"}).json()
    body = review_body(auditor.get(f"/api/v1/versions/{vid}/content").json())
    response = auditor.post(
        f"/api/v1/versions/{vid}/review", json={**body, "heading_id": heading["id"]}
    )
    assert response.status_code == 409
    with system[0].state.engine.connect() as db:
        assert one(
            db,
            """SELECT id FROM integrity_verifications WHERE version_id=:id
            AND actor_id='isha' AND status='Integrity Mismatch'""",
            id=vid,
        )
        assert (
            one(db, "SELECT metadata_revision FROM document_versions WHERE id=:id", id=vid)[
                "metadata_revision"
            ]
            == 0
        )
    raw.write_bytes(original)
    saved = settings.signing_key_path.read_bytes()
    settings.signing_key_path.unlink()
    assert admin.get(path).json()["status"] == "Unable to Verify"
    assert not settings.signing_key_path.exists()
    settings.signing_key_path.write_bytes(saved)
    assert admin.get(path).json()["status"] == "Verified"


@pytest.mark.parametrize("who", ["maya", "isha", "ravi"])
def test_role_matrix_and_tenant_isolation(system, who):
    c = client_for(system, who)
    expected = {
        "/admin/users": who == "ravi",
        "/policy-reviews": who == "isha",
        "/leave/balance": who == "maya",
        "/leave/team": who != "maya",
        "/policy-tickets": who == "isha",
    }
    for path, allowed in expected.items():
        assert c.get("/api/v1" + path).status_code == (200 if allowed else 403), path
    assert c.get("/api/v1/versions/ORBIT-LEAVE-2026/integrity").status_code == 404
    session = c.get("/api/v1/auth/session").json()
    assert len(session["user"]["roles"]) == 1
    assert session["user"]["roles"][0]["name"] in ("employee", "auditor", "admin")


def test_user_create_no_duplicate_role_and_employee_only_allocations(system):
    admin = client_for(system, "ravi")
    body = {
        "display_name": "New Employee",
        "email": "new.employee@example.test",
        "password": "Strong local test password!",
        "role_id": "employee",
    }
    r = admin.post("/api/v1/admin/users", json=body)
    assert r.status_code == 201, r.text
    assert admin.post("/api/v1/admin/users", json=body).status_code == 409
    assert (
        admin.post(
            "/api/v1/admin/users",
            json={**body, "email": "manager@example.test", "role_id": "manager"},
        ).status_code
        == 422
    )
    assert client_for(system, "isha").post("/api/v1/admin/users", json=body).status_code == 403
    allocation = {
        "user_id": "isha",
        "leave_type_id": "annual-leave",
        "entry_type": "grant",
        "days": 10,
        "effective_date": "2026-11-19",
    }
    assert admin.post("/api/v1/leave/ledger-entries", json=allocation).status_code == 404
    with system[0].state.engine.begin() as db:
        with pytest.raises(IntegrityError):
            execute(
                db,
                "INSERT INTO user_roles(id,tenant_id,user_id,role_id) VALUES ('duplicate','NORTHSTAR','maya','admin')",
            )


def test_new_surfaces_auth_csrf_and_immutable_provenance(system):
    anonymous = TestClient(system[0], base_url=ORIGIN)
    for path in [
        "/policy-headings",
        "/policy-reviews",
        "/leave/requests",
        "/policy-tickets",
        "/notifications",
        "/versions/LEAVE-2026/integrity",
        "/leave/ledger",
    ]:
        assert anonymous.get("/api/v1" + path).status_code == 401
    c = client_for(system)
    c.headers.pop("X-CSRF-Token")
    assert (
        c.post(
            "/api/v1/policy-tickets",
            json={
                "document_ids": ["HR-LEAVE"],
                "description": "Please review these conflicting dates.",
            },
        ).status_code
        == 403
    )
    with system[0].state.engine.begin() as db:
        with pytest.raises(IntegrityError):
            execute(
                db, "UPDATE policy_integrity SET signature='tampered' WHERE version_id='LEAVE-2026'"
            )
        with pytest.raises(IntegrityError):
            execute(
                db,
                "INSERT OR REPLACE INTO policy_integrity SELECT * FROM policy_integrity WHERE version_id='LEAVE-2026'",
            )


def test_concurrent_approval_and_same_tenant_employee_privacy(system, leave_clock):
    from concurrent.futures import ThreadPoolExecutor

    admin, employee = client_for(system, "ravi"), client_for(system)
    body = {
        "display_name": "Second Employee",
        "email": "second.employee@example.test",
        "password": "Fictional test password only",
        "role_id": "employee",
    }
    created = admin.post("/api/v1/admin/users", json=body)
    assert created.status_code == 201
    other = TestClient(system[0], base_url=ORIGIN)
    assert (
        other.post(
            "/api/v1/auth/login",
            headers={"Origin": ORIGIN},
            json={"workspace": "NORTHSTAR", "email": body["email"], "password": body["password"]},
        ).status_code
        == 200
    )
    session = other.get("/api/v1/auth/session").json()
    other.headers.update({"Origin": ORIGIN, "X-CSRF-Token": session["csrf_token"]})
    r = application(employee)
    assert other.get(f"/api/v1/leave/requests/{r['id']}").status_code == 404
    assert other.get("/api/v1/leave/requests").json()["items"] == []
    assert other.get("/api/v1/leave/employees/maya/balance").status_code == 404
    reviewers = [client_for(system, "isha"), client_for(system, "isha")]
    before = days(employee)
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(pool.map(lambda c: decide(c, r).status_code, reviewers))
    assert sorted(results) == [200, 409]
    assert days(employee) == before - 3


def test_manual_ticket_inputs_retired_and_unrelated_primary_rejected(system):
    employee, auditor = client_for(system), client_for(system, "isha")
    assert (
        employee.post(
            "/api/v1/policy-tickets",
            json={"document_ids": ["EXEC-BONUS"], "description": "Retired manual form"},
        ).status_code
        == 422
    )
    q = ask(employee, "How many remote days per week?")
    t = employee.post("/api/v1/policy-tickets", json={"query_id": q["query_id"]}).json()
    path = "/api/v1/policy-tickets/" + t["id"]
    assert (
        auditor.post(
            path + "/resolve",
            json={
                "expected_revision": 0,
                "clause_id": "L26-C1",
                "reason": "Unrelated policy cannot be selected.",
            },
        ).status_code
        == 422
    )
    assert (
        employee.post(
            path + "/attachments", files={"file": ("evidence.txt", b"Retired form")}
        ).status_code
        == 410
    )
