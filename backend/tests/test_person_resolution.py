import pytest

from app.query_routing import AMBIGUOUS, resolve_employee_mention
from app.security import Context, execute, one
from conftest import ask, client_for


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("ARYA dhumal", "maya"),
        ("  Dhum  ", "maya"),
        ("Arya", "maya"),
        ("arya dhu", "maya"),
        ("Yashraj Bansal", None),
        ("Disabled test account", None),
        ("May", None),
        ("Missing Person", None),
        ("a", None),
    ],
)
def test_resolution(system, text, expected):
    with system[0].state.engine.connect() as db:
        ctx = Context(db, one(db, "SELECT * FROM users WHERE id='ravi'"), [], set(), "test")
        assert resolve_employee_mention(ctx, text) == expected


def test_ambiguous_employee_mention_has_same_public_outcome_as_missing(system):
    with system[0].state.engine.begin() as db:
        ctx = Context(db, one(db, "SELECT * FROM users WHERE id='ravi'"), [], set(), "test")
        execute(db, "UPDATE users SET display_name='Arya Example' WHERE id='isha'")
        assert resolve_employee_mention(ctx, "arya") is AMBIGUOUS
        assert resolve_employee_mention(ctx, "Arya Dhumal") == "maya"
    manager = client_for(system, "ravi")
    ambiguous = ask(manager, "How many leave days does Arya have?")
    missing = ask(manager, "How many leave days does Missing User have?")
    ambiguous.pop("query_id")
    missing.pop("query_id")
    assert ambiguous == missing
