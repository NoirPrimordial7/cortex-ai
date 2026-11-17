from conftest import ask, client_for
from app.security import execute


def test_broad_search_returns_all_four_current_leave_passages(system):
    client = client_for(system)
    broad = ask(client, "show everything relevant to leave")
    assert broad["status"] == "abstained"
    passages = broad["related_results"]
    assert {p["clause_id"] for p in passages} == {
        "L26-C1", "SICK-C1", "MATERNITY-C1", "CARRY-C1", "LN-C1",
    }
    assert all(p["locator"] == "TXT line 2" for p in passages)
    assert all(any(part["matched"] for part in p["excerpt"]) for p in passages)
    strict = ask(client)
    assert strict["status"] == "answered"
    assert strict["citations"][0]["clause_id"] == "L26-C1"
    assert "L26-C1" not in {p["clause_id"] for p in strict["related_results"]}
    assert {p["clause_id"] for p in ask(client, "sick leave")["related_results"]} >= {"SICK-C1"}
    assert {p["clause_id"] for p in ask(client, "show leave", as_of="2025-08-01")["related_results"]} == {
        "L25-C1"
    }
    assert ask(client_for(system, "orbit"), "leave")["related_results"] == []


def test_related_snippets_follow_acl_revocation_and_source_verification(system):
    employee = client_for(system)
    manager = client_for(system, "ravi")
    result = ask(employee, "Find sick leave")
    assert "SICK-C1" in {item["clause_id"] for item in result["related_results"]}
    acl = manager.get("/api/v1/admin/documents/HR-SICK/acl").json()
    changed = manager.put(
        "/api/v1/admin/documents/HR-SICK/acl",
        json={"expected_policy_revision": acl["policy_revision"], "grants": [{"user_id": "ravi"}]},
    )
    assert changed.status_code == 200
    assert employee.get(f"/api/v1/queries/{result['query_id']}").status_code == 404
    assert "SICK-C1" not in {
        p["clause_id"] for p in ask(employee, "Find sick leave")["related_results"]
    }
    with system[0].state.engine.begin() as db:
        execute(db, "UPDATE document_versions SET extracted_text='bad' WHERE id='LEAVE-MATERNITY'")
    assert "MATERNITY-C1" not in {p["clause_id"] for p in ask(employee, "maternity")["related_results"]}


def test_ledger_chat_reuses_authorization_and_never_creates_citations(system):
    manager = client_for(system, "ravi")
    employee = client_for(system)
    own = ask(employee, "my leave")
    report = ask(manager, "How many leave days does Arya Dhumal have?")
    for result in (own, report):
        assert result["source"] == "leave_ledger"
        assert result["balances"][0]["balance_days"] == 17
        assert result["citations"] == [] and result["claims"] == []
    assert report["display_name"] == "Arya Dhumal"
    saved = manager.get(f"/api/v1/queries/{report['query_id']}").json()
    assert "balances" not in saved and "display_name" not in saved
    for client, text in (
        (employee, "How many leave days does Aditya have?"),
        (manager, "How many leave days does Ashwin have?"),
        (manager, "How many leave days does Missing Person have?"),
        (manager, "How many leave days does Yashraj have?"),
    ):
        denied = ask(client, text)
        assert denied["status"] == "abstained"
        assert denied["answer"] == "I can’t find information for that."
        assert "balances" not in denied and "display_name" not in denied


def test_suggestions_are_scoped_ranked_and_audited(system):
    manager = client_for(system, "ravi")
    employee = client_for(system)
    endpoint = "/api/v1/queries/suggestions"
    assert manager.get(endpoint, params={"q": "arya"}).json()["items"] == [
        "How many leave days does Arya Dhumal have?"
    ]
    assert employee.get(endpoint, params={"q": "arya"}).json()["items"] == []
    assert manager.get(endpoint, params={"q": "ashwin"}).json()["items"] == []
    assert "Sick leave policy" in employee.get(endpoint, params={"q": "sick"}).json()["items"]
    params = {"q": "sick", "as_of": "2025-08-01"}
    assert "Sick leave policy" not in employee.get(endpoint, params=params).json()["items"]
    assert len(manager.get(endpoint, params={"q": "leave"}).json()["items"]) <= 8
    assert manager.get(endpoint, params={"q": ""}).json()["items"] == []
    with system[0].state.engine.connect() as db:
        from app.security import one
        assert one(
            db, "SELECT target_id FROM audit_events WHERE action='leave.suggestion.read'"
        ) == {"target_id": "maya"}
