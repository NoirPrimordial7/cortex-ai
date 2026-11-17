import pytest

from app.query_routing import classify_query


@pytest.mark.parametrize(
    ("prompt", "kind"),
    [
        ("What is the annual leave entitlement?", "policy_fact"),
        ("How many remote days per week?", "policy_fact"),
        ("What is my notice period?", "policy_fact"),
        ("leave", "policy_fact"),
        ("Find sick leave and maternity policies", "policy_search"),
        ("carry-forward leave", "policy_search"),
        ("Show remote policies", "policy_search"),
        ("proof of employment", "policy_search"),
        ("What is my leave balance?", "employee_leave"),
        ("How many annual leave days do I have?", "employee_leave"),
        ("How many leave days does Arya have?", "employee_leave"),
        ("Leave remaining for Arya Dhumal", "employee_leave"),
        ("What is Arya's leave balance?", "employee_leave"),
        ("How many days left do I have?", "employee_leave"),
        ("Days left for Arya", "employee_leave"),
        ("???", "unknown"),
    ],
)
def test_classification(prompt, kind):
    assert classify_query(prompt) == kind
