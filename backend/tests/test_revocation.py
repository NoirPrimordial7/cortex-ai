import threading
from concurrent.futures import ThreadPoolExecutor
from fastapi.testclient import TestClient
from conftest import ORIGIN, ask, client_for


def test_revocation_waits_for_evidence_transaction_then_denies_all_dependencies(system):
    app, _ = system
    employee, manager = client_for(system), client_for(system, "ravi")
    acl = manager.get("/api/v1/admin/documents/HR-LEAVE/acl").json()
    paused, release, mutation_started = threading.Event(), threading.Event(), threading.Event()

    def observe(stage, evidence):
        if stage == "answerer":
            assert all(e.document_id != "EXEC-POLICY" for e in evidence)
            paused.set()
            assert release.wait(5), "Test did not release evidence stage"

    def revoke():
        mutation_started.set()
        return manager.put(
            "/api/v1/admin/documents/HR-LEAVE/acl",
            json={
                "expected_policy_revision": acl["policy_revision"],
                "grants": [{"user_id": "ravi"}],
            },
        )

    app.state.observe = observe
    with ThreadPoolExecutor(max_workers=2) as executor:
        first = executor.submit(ask, employee)
        assert paused.wait(5)
        mutation = executor.submit(revoke)
        try:
            assert mutation_started.wait(5)
            assert not mutation.done(), "Revocation bypassed the evidence transaction gate"
        finally:
            release.set()
        q = first.result(timeout=5)
        assert q["status"] == "answered"
        assert mutation.result(timeout=5).status_code == 200
    app.state.observe = None
    assert employee.get(f"/api/v1/queries/{q['query_id']}").status_code == 404
    assert employee.get("/api/v1/versions/LEAVE-2026/content").status_code == 404
    assert ask(employee)["citations"] == []


def test_all_protected_get_surfaces_require_authentication(system):
    client = TestClient(system[0], base_url=ORIGIN)
    for path in [
        "/auth/session",
        "/documents",
        "/documents/HR-LEAVE",
        "/versions/LEAVE-2026/content",
        "/versions/LEAVE-2026/download",
        "/ingestion-jobs/nonexistent",
        "/queries",
        "/queries/nonexistent",
        "/queries/nonexistent/citations/nonexistent",
        "/dashboard",
        "/conflicts",
        "/admin/users",
        "/admin/documents/HR-LEAVE/acl",
        "/audit-events",
    ]:
        response = client.get("/api/v1" + path)
        assert response.status_code == 401, path
        assert "CANARY_EXEC_75K" not in response.text and "20 working days" not in response.text
