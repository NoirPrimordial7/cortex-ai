"""Deterministic query routing and active, tenant-local employee name matching."""

import re
import unicodedata
from enum import StrEnum
from typing import Literal

from .security import rows

QueryKind = Literal["policy_fact", "policy_search", "employee_leave", "unknown"]


class MatchStatus(StrEnum):
    AMBIGUOUS = "ambiguous"


AMBIGUOUS = MatchStatus.AMBIGUOUS

TOPICS = {
    "leave": ("leave", "vacation", "time off", "pto"),
    "remote_work": ("remote", "work from home", "wfh"),
    "notice": ("notice", "resignation"),
    "bonus": ("executive", "bonus"),
}
BALANCE = re.compile(
    r"\bleave\s+(?:balances?|remaining|days?\s+(?:left|remaining|available))\b"
    r"|\b(?:remaining|unused|available)\s+(?:\w+\s+){0,2}leave\b|\bmy\s+(?:\w+\s+)?leave\b"
    r"|\b(?:how many|days left)\b.*\b(?:leave|pto|vacation)\b"
    r"|\bdays?\s+(?:left|remaining)\b|\bhow many days\b.*\bhave (?:left|remaining)\b",
    re.I,
)
SELF = re.compile(r"\b(?:i|my|me|mine)\b", re.I)
PERSON = (
    re.compile(r"\b(?:does|has)\s+(.+?)\s+(?:have|got)\b", re.I),
    re.compile(r"\b(?:leave(?: balance| remaining)?|days left)\s+(?:for|of)\s+(.+)$", re.I),
    re.compile(r"(.+?)[’']s\s+(?:(?:annual|sick|paid)\s+)?leave\b", re.I),
    re.compile(r"\b(?:does|has)\s+(.+?)\s+(?:(?:any|much)\s+)?leave\b", re.I),
)


def intent(prompt):
    p = prompt.lower()
    found = [topic for topic, terms in TOPICS.items() if any(term in p for term in terms)]
    return found[0] if len(found) == 1 else None


def employee_mention(text):
    cleaned = re.sub(r"^\s*(?:what is|show me|show|tell me|check)\s+", "", text, flags=re.I)
    for pattern in PERSON:
        match = pattern.search(cleaned.strip().rstrip("?.!"))
        if match:
            return match[1]
    return None


def classify_query(text: str) -> QueryKind:
    topic = intent(text)
    if topic in (None, "leave") and BALANCE.search(text) and (
        SELF.search(text) or employee_mention(text)
        or re.search(r"\bbalance\b|\bleave (?:remaining|days left)\b", text, re.I)
    ):
        return "employee_leave"
    if topic and not re.search(
        r"\b(?:sick|maternity|paternity|parental)\s+leave\b|\bcarry[ -]forward\b", text, re.I
    ) and not re.match(
        r"^\s*(?:show|find|list|search|all|everything)\b", text, re.I
    ):
        return "policy_fact"
    return "policy_search" if any(len(word) > 1 for word in name_tokens(text)) else "unknown"


def name_tokens(text):
    return re.findall(r"[^\W_]+", unicodedata.normalize("NFKC", text).casefold())


def resolve_employee_mention(ctx, text: str) -> str | None:
    """Return the unique exact or contiguous partial name, or an ambiguity marker."""
    wanted = name_tokens(text)
    if not wanted:
        return None
    people = rows(
        ctx.db,
        "SELECT id,display_name FROM users WHERE tenant_id=:tenant AND active=1",
        **ctx.parameters(),
    )
    exact, partial = [], []
    for person in people:
        tokens = name_tokens(person["display_name"])
        if wanted == tokens:
            exact.append(person["id"])
        elif any(
            all(token.startswith(prefix) for token, prefix in zip(tokens[i:], wanted))
            for i in range(len(tokens) - len(wanted) + 1)
        ) and all(len(part) >= 2 for part in wanted):
            partial.append(person["id"])
    matches = exact or partial
    return AMBIGUOUS if len(matches) > 1 else matches[0] if matches else None
