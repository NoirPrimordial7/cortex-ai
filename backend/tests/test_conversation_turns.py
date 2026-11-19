from uuid import uuid4

from app.security import execute
from conftest import ask, client_for


def test_policy_follow_up_rechecks_scope_and_history_is_one_turn(system):
    employee = client_for(system)
    thread = str(uuid4())
    assert ask(employee, conversation_id=thread)["citations"][0]["reviewed_value"] == 20
    follow = ask(employee, "What about contractors?", conversation_id=thread)
    assert follow["follow_up"] and follow["citations"][0]["reviewed_value"] == 8
    assert follow["scope"]["population"] == "india_contractor"
    unknown_scope = ask(employee, "Does that apply to HR too?", conversation_id=thread)
    assert unknown_scope["status"] == "clarification_required"
    assert unknown_scope["citations"] == []
    assert ask(employee, "Cafeteria menus", conversation_id=thread)["status"] == "abstained"
    assert "follow_up" not in ask(employee, "What about contractors?", conversation_id=thread)


def test_conversation_ids_cannot_cross_tenants_or_users(system):
    thread = str(uuid4())
    ask(client_for(system), conversation_id=thread)
    for who in ("ravi", "orbit"):
        result = ask(client_for(system, who), "What about contractors?", conversation_id=thread)
        assert "follow_up" not in result
        assert result["citations"] == []


def test_ledger_follow_up_is_reauthorized_after_employee_deactivation(system):
    manager = client_for(system, "ravi")
    thread = str(uuid4())
    first = ask(manager, "Leave balance for Arya", conversation_id=thread)
    assert first["source"] == "leave_ledger"
    follow = ask(manager, "How many days were left?", as_of="2026-08-30", conversation_id=thread)
    assert follow["follow_up"] and follow["balances"][0]["balance_days"] == 20
    revision = manager.get("/api/v1/admin/users").json()["policy_revision"]
    changed = manager.patch("/api/v1/admin/users/maya", json={
        "active": False, "role_ids": ["employee"], "expected_policy_revision": revision})
    assert changed.status_code == 200
    denied = ask(manager, "How many days were left?", conversation_id=thread)
    assert denied["status"] == "abstained" and "balances" not in denied
    assert denied["answer"] == "I can’t find information for that."


def test_expired_conversation_cannot_supply_a_topic(system):
    client = client_for(system)
    thread = str(uuid4())
    original = ask(client, conversation_id=thread)
    with system[0].state.engine.begin() as db:
        execute(db, "UPDATE queries SET expires_at='2000' WHERE id=:id", id=original["query_id"])
    assert "follow_up" not in ask(client, "What about contractors?", conversation_id=thread)
