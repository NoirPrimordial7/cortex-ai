"""Real query evidence → shared Auditor review → primary answer → undo/reselect."""

from concurrent.futures import ThreadPoolExecutor
from app.security import execute, one, rows
from conftest import ask, client_for


QUESTION = "How many remote days per week?"


def send(employee, q=None):
    q = q or ask(employee, QUESTION)
    assert q["reason_code"] == "UNRESOLVED_CONFLICT", q
    r = employee.post("/api/v1/policy-tickets", json={"query_id": q["query_id"]})
    assert r.status_code == 201, r.text
    return r.json(), q


def choose(auditor, ident, clause="RW-A-C1", revision=0):
    return auditor.post(
        f"/api/v1/policy-tickets/{ident}/resolve",
        json={
            "expected_revision": revision,
            "clause_id": clause,
            "reason": "This policy is primary for the reviewed conflict.",
        },
    )


def undo(auditor, ident, revision=1):
    return auditor.post(
        f"/api/v1/policy-tickets/{ident}/rollback",
        json={
            "expected_revision": revision,
            "reason": "Incorrect primary choice; reopen for another decision.",
        },
    )


def test_detected_conflict_primary_undo_and_reselect(system):
    employee, auditor = client_for(system), client_for(system, "isha")
    with system[0].state.engine.connect() as db:
        original_versions = rows(
            db,
            "SELECT id,sha256,extracted_sha256,current_metadata_revision_id FROM document_versions ORDER BY id",
        )
    t, q = send(employee)
    ident = t["id"]
    details = auditor.get(f"/api/v1/policy-tickets/{ident}").json()
    sources = details["conflict_sources"]
    assert {s["clause_id"] for s in sources} == {c["clause_id"] for c in q["citations"]}
    assert len(sources) == 2 and all(s["available"] and s["verified"] for s in sources)
    a, b = [s["clause_id"] for s in sources]
    assert choose(auditor, ident, a).status_code == 200
    resolved = ask(employee, QUESTION)
    assert resolved["status"] == "answered" and resolved["citations"][0]["clause_id"] == a
    assert resolved["explanation"][0]["code"] == "AUDITOR_PRIMARY_POLICY"
    assert resolved["re_audit"]["status"] == "resolved"
    assert choose(auditor, ident, b).status_code == 409
    reopened = undo(auditor, ident)
    assert reopened.status_code == 200, reopened.text
    assert (
        reopened.json()["status"] == "pending"
        and reopened.json()["conflict_context"]["selected_clause_id"] is None
    )
    assert employee.get(f"/api/v1/queries/{resolved['query_id']}").status_code == 409
    again = ask(employee, QUESTION)
    assert again["reason_code"] == "UNRESOLVED_CONFLICT" and len(again["citations"]) == 2
    assert again["re_audit"]["subscribed"]
    assert choose(auditor, ident, b, 2).status_code == 200
    assert ask(employee, QUESTION)["citations"][0]["clause_id"] == b
    history = auditor.get(f"/api/v1/policy-tickets/{ident}").json()["history"]
    assert [h["operation"] for h in history] == ["submitted", "resolved", "rollback", "resolved"]
    assert "Primary:" in history[1]["reason"] and "Undid primary:" in history[2]["reason"]
    assert len(employee.get("/api/v1/notifications").json()["items"]) == 3
    with system[0].state.engine.connect() as db:
        assert (
            rows(
                db,
                "SELECT id,sha256,extracted_sha256,current_metadata_revision_id FROM document_versions ORDER BY id",
            )
            == original_versions
        )


def test_submission_grants_explicit_review_access_and_is_idempotent(system):
    admin, employee, auditor = (client_for(system, u) for u in ("ravi", "maya", "isha"))
    for did in ("OPS-REMOTE-A", "OPS-REMOTE-B"):
        acl = admin.get(f"/api/v1/admin/documents/{did}/acl").json()
        assert (
            admin.put(
                f"/api/v1/admin/documents/{did}/acl",
                json={
                    "expected_policy_revision": acl["policy_revision"],
                    "grants": [{"user_id": "ravi"}, {"role_id": "employee"}],
                },
            ).status_code
            == 200
        )
        assert auditor.get(f"/api/v1/documents/{did}").status_code == 404
    t, q = send(employee)
    assert send(employee, q)[0]["id"] == t["id"]
    d = auditor.get(f"/api/v1/policy-tickets/{t['id']}").json()
    assert len(d["conflict_sources"]) == 2 and all(s["available"] for s in d["conflict_sources"])
    with system[0].state.engine.connect() as db:
        assert one(db, "SELECT COUNT(*) n FROM ticket_conflict_contexts")["n"] == 1
        assert one(db, "SELECT COUNT(*) n FROM ticket_subscribers")["n"] == 1
        assert (
            one(
                db, "SELECT COUNT(*) n FROM audit_events WHERE action='ticket.review_access.grant'"
            )["n"]
            == 2
        )


def test_manual_forms_foreign_queries_non_conflicts_and_employee_ticket_pages_denied(system):
    employee, auditor, admin, orbit = (
        client_for(system, u) for u in ("maya", "isha", "ravi", "orbit")
    )
    assert (
        employee.post(
            "/api/v1/policy-tickets",
            json={
                "document_ids": ["OPS-REMOTE-A", "OPS-REMOTE-B"],
                "description": "Old arbitrary manual form",
            },
        ).status_code
        == 422
    )
    q = ask(employee, QUESTION)
    for user in (auditor, admin):
        assert (
            user.post("/api/v1/policy-tickets", json={"query_id": q["query_id"]}).status_code == 403
        )
    assert orbit.post("/api/v1/policy-tickets", json={"query_id": q["query_id"]}).status_code == 404
    answered = ask(employee)
    assert (
        employee.post("/api/v1/policy-tickets", json={"query_id": answered["query_id"]}).status_code
        == 409
    )
    assert employee.get("/api/v1/policy-tickets").status_code == 403
    t, _ = send(employee, q)
    for user in (employee, admin, orbit):
        assert user.get(f"/api/v1/policy-tickets/{t['id']}").status_code == 403
        assert choose(user, t["id"], q["citations"][0]["clause_id"]).status_code == 403
        assert undo(user, t["id"]).status_code == 403
    assert choose(auditor, t["id"], "L26-C1").status_code == 422
    assert (
        employee.post(
            f"/api/v1/policy-tickets/{t['id']}/attachments",
            files={"file": ("old.txt", b"Retired flow")},
        ).status_code
        == 410
    )


def test_stale_evidence_read_revocation_and_future_scope_fail_closed(system):
    employee, auditor, admin = (client_for(system, u) for u in ("maya", "isha", "ravi"))
    t, q = send(employee)
    chosen = q["citations"][0]["clause_id"]
    assert choose(auditor, t["id"], chosen).status_code == 200
    historical = ask(employee, QUESTION, as_of="2025-01-01")
    assert historical.get("re_audit") is None
    contractor = ask(employee, QUESTION, population="india_contractor")
    assert contractor.get("re_audit") is None
    for did in ("OPS-REMOTE-A", "OPS-REMOTE-B"):
        acl = admin.get(f"/api/v1/admin/documents/{did}/acl").json()
        admin.put(
            f"/api/v1/admin/documents/{did}/acl",
            json={
                "expected_policy_revision": acl["policy_revision"],
                "grants": [{"user_id": "ravi"}, {"role_id": "auditor"}],
            },
        )
    assert ask(employee, QUESTION).get("re_audit") is None
    assert (
        employee.post("/api/v1/policy-tickets", json={"query_id": q["query_id"]}).status_code == 409
    )


def test_concurrent_resolutions_only_one_wins_and_decisions_survive_restart(system):
    from app.main import create_app

    employee = client_for(system)
    t, q = send(employee)
    reviewers = [client_for(system, "isha"), client_for(system, "isha")]
    with ThreadPoolExecutor(max_workers=2) as pool:
        results = list(
            pool.map(
                lambda item: choose(item[0], t["id"], item[1]).status_code,
                zip(reviewers, [c["clause_id"] for c in q["citations"]]),
            )
        )
    assert sorted(results) == [200, 409]
    app = create_app(system[0].state.settings)
    try:
        restarted = client_for((app, system[1]))
        assert ask(restarted, QUESTION)["re_audit"]["status"] == "resolved"
    finally:
        app.state.engine.dispose()


def test_changed_peer_set_cannot_reuse_a_primary_decision(system):
    employee, auditor = (client_for(system, u) for u in ("maya", "isha"))
    t, q = send(employee)
    chosen = q["citations"][0]["clause_id"]
    assert choose(auditor, t["id"], chosen).status_code == 200
    # A newly authorized peer changes the exact conflict set, never silently inherits the choice.
    with system[0].state.engine.begin() as db:
        execute(
            db,
            "UPDATE authority_rules SET rank=101 WHERE tenant_id='NORTHSTAR' AND topic='remote_work'",
        )
    current = ask(employee, QUESTION)
    assert current["reason_code"] == "UNRESOLVED_CONFLICT" and current.get("re_audit") is None


def test_same_document_versions_are_distinct_choices_and_auditor_extra_access_is_irrelevant(system):
    admin, employee, auditor = (client_for(system, u) for u in ("ravi", "maya", "isha"))
    did = "OPS-REMOTE-B"
    acl = admin.get(f"/api/v1/admin/documents/{did}/acl").json()
    admin.put(
        f"/api/v1/admin/documents/{did}/acl",
        json={
            "expected_policy_revision": acl["policy_revision"],
            "grants": [{"user_id": "ravi"}, {"role_id": "auditor"}],
        },
    )
    text = "India full-time employees receive 3 days per week of remote work."
    uploaded = admin.post(
        "/api/v1/documents/OPS-REMOTE-A/versions",
        data={"version_label": "conflicting-v2"},
        files={"file": ("remote.txt", text.encode())},
    ).json()
    vid = uploaded["version_id"]
    assert (
        admin.post(f"/api/v1/versions/{vid}/submit", json={"expected_revision": 0}).status_code
        == 200
    )
    heading = auditor.get("/api/v1/policy-headings").json()["items"][0]["id"]
    body = {
        "expected_metadata_revision": 0,
        "approval_state": "approved",
        "heading_id": heading,
        "valid_from": "2026-01-01",
        "valid_to": None,
        "open_ended": True,
        "population": "india_full_time",
        "jurisdiction": "IN",
        "topic": "remote_work",
        "source_kind": "operations_policy",
        "published_at": "2026-01-01",
        "start_char": 0,
        "end_char": len(text),
        "claim": {
            "subject": "india_full_time",
            "predicate": "remote_days_per_week",
            "unit": "days_per_week",
            "value": 3,
        },
        "access_scope": "uniform",
        "reason": "Reviewed exact remote-work source version.",
    }
    reviewed = auditor.post(f"/api/v1/versions/{vid}/review", json=body)
    assert reviewed.status_code == 200, reviewed.text
    t, q = send(employee)
    assert len(q["citations"]) == 2 and len({c["document_id"] for c in q["citations"]}) == 1
    d = auditor.get(f"/api/v1/policy-tickets/{t['id']}").json()
    assert len({s["version_id"] for s in d["conflict_sources"]}) == 2
    chosen = next(c["clause_id"] for c in q["citations"] if c["version_id"] == vid)
    r = choose(auditor, t["id"], chosen)
    assert r.status_code == 200, r.text
    assert ask(employee, QUESTION)["citations"][0]["version_id"] == vid


def test_multiple_employees_share_one_case_and_receive_undo_notifications(system):
    from fastapi.testclient import TestClient
    from conftest import ORIGIN

    admin, employee, auditor = (client_for(system, u) for u in ("ravi", "maya", "isha"))
    account = {
        "display_name": "Another Employee",
        "email": "another.employee@example.test",
        "password": "Fictional conflict test only",
        "role_id": "employee",
    }
    assert admin.post("/api/v1/admin/users", json=account).status_code == 201
    other = TestClient(system[0], base_url=ORIGIN)
    assert (
        other.post(
            "/api/v1/auth/login",
            headers={"Origin": ORIGIN},
            json={
                "workspace": "NORTHSTAR",
                "email": account["email"],
                "password": account["password"],
            },
        ).status_code
        == 200
    )
    session = other.get("/api/v1/auth/session").json()
    other.headers.update({"Origin": ORIGIN, "X-CSRF-Token": session["csrf_token"]})
    t, q = send(employee)
    assert send(other)[0]["id"] == t["id"]
    assert choose(auditor, t["id"], q["citations"][0]["clause_id"]).status_code == 200
    assert ask(other, QUESTION)["status"] == "answered"
    admin_answer = ask(admin, QUESTION)
    assert admin_answer["status"] == "answered" and admin_answer["re_audit"]["resolution"] is None
    assert undo(auditor, t["id"]).status_code == 200
    assert ask(other, QUESTION)["reason_code"] == "UNRESOLVED_CONFLICT"
    for user in (employee, other):
        assert len(user.get("/api/v1/notifications").json()["items"]) == 2


def test_corrupted_source_blocks_primary_and_is_not_shown_as_verified(system):
    employee, auditor = (client_for(system, u) for u in ("maya", "isha"))
    t, q = send(employee)
    with system[0].state.engine.connect() as db:
        v = one(
            db,
            "SELECT object_key FROM document_versions WHERE id=:id",
            id=q["citations"][0]["version_id"],
        )
    raw = system[0].state.settings.data_dir / "uploads" / v["object_key"]
    raw.write_bytes(b"Tampered original source")
    d = auditor.get(f"/api/v1/policy-tickets/{t['id']}").json()
    assert any(
        s.get("integrity_status") == "Integrity Mismatch" and not s["verified"]
        for s in d["conflict_sources"]
    )
    assert choose(auditor, t["id"], q["citations"][0]["clause_id"]).status_code == 409
    assert ask(employee, QUESTION)["reason_code"] == "UNRESOLVED_CONFLICT"
