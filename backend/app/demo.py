"""Explicitly enabled fictional account picker; never a general credential directory."""

import json
from .security import one

PROFILES = {
    "maya": ("Arya · Employee", "NORTHSTAR", "arya@example.test", "maya"),
    "ravi": ("Aditya · Admin", "NORTHSTAR", "aditya@example.test", "ravi"),
    "isha": ("Ashwin · Auditor", "NORTHSTAR", "ashwin@example.test", "isha"),
    "noor": ("Disabled account", "NORTHSTAR", "arya.disabled@example.test", "noor"),
    "orbit": ("Yashraj · Other tenant", "ORBIT", "yashraj@example.test", "orbit-user"),
}

TEAM_NAMES = {
    "maya": "Arya Dhumal",
    "ravi": "Aditya Gholar",
    "isha": "Ashwin Gudur",
    "orbit": "Yashraj Bansal",
    "noor": "Disabled test account",
}
LEGACY_NAMES = {
    "maya": "Maya Shah",
    "ravi": "Ravi Mehta",
    "isha": "Isha Rao",
    "orbit": "Orbit Employee",
    "noor": "Noor Khan",
}


def display_name(user):
    """Presentation-only rename of exact seed identities; never rename real users."""
    for key, (_, tenant, email, user_id) in PROFILES.items():
        if (
            user["id"] == user_id
            and user["tenant_id"] == tenant
            and user["email_normalized"] == email
            and user["display_name"] in {LEGACY_NAMES[key], TEAM_NAMES[key]}
        ):
            return TEAM_NAMES[key]
    return user["display_name"]


def accounts(conn, settings):
    if not settings.demo_accounts_enabled:
        return []
    try:
        credentials = json.loads((settings.data_dir / "credentials.json").read_text())
    except (OSError, ValueError):
        return []
    if not isinstance(credentials, dict):
        return []
    result = []
    for key, (label, workspace, email, user_id) in PROFILES.items():
        entry = credentials.get(key, {})
        if not isinstance(entry, dict):
            continue
        legacy_email = {"maya":"maya","ravi":"ravi","isha":"isha","noor":"noor","orbit":"orbit"}[key] + "@example.test"
        if entry.get("workspace") != workspace or entry.get("email") not in {email, legacy_email}:
            continue
        password = entry.get("password")
        if not isinstance(password, str) or not 1 <= len(password) <= 200:
            continue
        user = one(
            conn,
            "SELECT * FROM users WHERE id=:id AND tenant_id=:tenant AND email_normalized=:email",
            id=user_id,
            tenant=workspace,
            email=email,
        )
        if not user:
            continue
        result.append(
            {
                "key": key,
                "label": display_name(user) + " · " + label.split(" · ", 1)[1]
                if key != "noor" else display_name(user),
                "workspace": workspace,
                "email": email,
                "password": password,
                "active": bool(user["active"]),
            }
        )
    return result
