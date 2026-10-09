import secrets
import pytest
from sqlalchemy.exc import IntegrityError
from conftest import ORIGIN, ask, client_for
from fastapi.testclient import TestClient
from app import db as models
from app.security import digest, execute, uid


def test_origin_csrf_logout_disable_and_cookie(system):
    client = client_for(system)
    assert (
        client.post(
            "/api/v1/queries", json={"query": "leave"}, headers={"Origin": "https://evil.example"}
        ).status_code
        == 403
    )
    assert (
        client.post(
            "/api/v1/queries", json={"query": "leave"}, headers={"X-CSRF-Token": "wrong"}
        ).status_code
        == 403
    )
    assert client.post("/api/v1/auth/logout").status_code == 204
    assert client.get("/api/v1/auth/session").status_code == 401
    disabled = TestClient(system[0], base_url=ORIGIN)
    assert (
        disabled.post(
            "/api/v1/auth/login", json=system[1]["noor"], headers={"Origin": ORIGIN}
        ).status_code
        == 401
    )
    response = disabled.post(
        "/api/v1/auth/login", json=system[1]["maya"], headers={"Origin": ORIGIN}
    )
    cookie = response.headers["set-cookie"].lower()
    assert "httponly" in cookie and "samesite=lax" in cookie
    raw = disabled.cookies.get("cortex_session")
    with system[0].state.engine.connect() as db:
        stored = (
            db.execute(
                models.sessions.select().where(models.sessions.c.token_digest == digest(raw))
            )
            .mappings()
            .one()
        )
        assert raw not in str(dict(stored))


def test_disabled_and_idle_session_fail_closed(system):
    client = client_for(system)
    with system[0].state.engine.begin() as db:
        execute(
            db, "UPDATE sessions SET last_seen_at='2000-01-01T00:00:00+00:00' WHERE user_id='maya'"
        )
    assert client.get("/api/v1/documents").status_code == 401
    client = client_for(system)
    with system[0].state.engine.begin() as db:
        execute(db, "UPDATE users SET active=0 WHERE id='maya'")
    assert client.get("/api/v1/documents").status_code == 401


def test_action_permissions_and_mass_assignment(system):
    employee = client_for(system)
    assert employee.get("/api/v1/admin/users").status_code == 403
    assert employee.get("/api/v1/audit-events").status_code == 403
    assert (
        employee.post(
            "/api/v1/documents",
            data={"title": "test"},
            files={"file": ("a.txt", b"text", "text/plain")},
        ).status_code
        == 403
    )
    assert (
        employee.post(
            "/api/v1/queries", json={"query": "leave", "tenant_id": "ORBIT", "role": "admin"}
        ).status_code
        == 422
    )
    assert (
        client_for(system, "isha").post("/api/v1/queries", json={"query": "leave"}).status_code
        == 403
    )


def test_database_tenant_fk_and_acl_xor(system):
    engine = system[0].state.engine
    for subject in [
        {"user_id": "orbit-user", "role_id": None},
        {"user_id": "maya", "role_id": "employee"},
        {"user_id": None, "role_id": None},
    ]:
        with pytest.raises(IntegrityError), engine.begin() as db:
            db.execute(
                models.document_acl.insert().values(
                    id=uid(),
                    tenant_id="NORTHSTAR",
                    document_id="HR-LEAVE",
                    action="READ",
                    **subject,
                )
            )


def test_rate_limit_and_generic_bad_account(system):
    client = TestClient(system[0], base_url=ORIGIN)
    bad = {
        "workspace": "NORTHSTAR",
        "email": "missing@example.test",
        "password": secrets.token_urlsafe(16),
    }
    for _ in range(5):
        assert (
            client.post("/api/v1/auth/login", json=bad, headers={"Origin": ORIGIN}).status_code
            == 401
        )
    assert (
        client.post("/api/v1/auth/login", json=bad, headers={"Origin": ORIGIN}).status_code == 429
    )


def test_admin_has_no_read_bypass_and_audit_is_redacted(system):
    manager = client_for(system, "ravi")
    with system[0].state.engine.begin() as db:
        execute(
            db,
            "DELETE FROM document_acl WHERE document_id=(SELECT document_id FROM document_versions WHERE id='EXEC-2026')",
        )
    assert manager.get("/api/v1/versions/EXEC-2026/content").status_code == 404
    ask(client_for(system))
    events = client_for(system, "isha").get("/api/v1/audit-events")
    assert events.status_code == 200
    assert (
        "CANARY_EXEC_75K" not in events.text
        and "prompt" not in events.text
        and "password" not in events.text
    )


def test_unsafe_acl_subject_and_stale_revision(system):
    manager = client_for(system, "ravi")
    acl = manager.get("/api/v1/admin/documents/HR-LEAVE/acl").json()
    body = {
        "expected_policy_revision": acl["policy_revision"],
        "grants": [{"user_id": "ravi"}, {"user_id": "orbit-user"}],
    }
    assert manager.put("/api/v1/admin/documents/HR-LEAVE/acl", json=body).status_code == 422
    body["grants"] = [{"user_id": "ravi"}]
    assert manager.put("/api/v1/admin/documents/HR-LEAVE/acl", json=body).status_code == 200
    assert manager.put("/api/v1/admin/documents/HR-LEAVE/acl", json=body).status_code == 409
