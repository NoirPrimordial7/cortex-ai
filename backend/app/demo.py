"""Explicitly enabled fictional account picker; never a general credential directory."""

import json
from .security import one

PROFILES = {
    "maya": ("Maya · Employee", "NORTHSTAR", "maya@example.test", "maya"),
    "ravi": ("Ravi · Reviewer & admin", "NORTHSTAR", "ravi@example.test", "ravi"),
    "isha": ("Isha · Auditor", "NORTHSTAR", "isha@example.test", "isha"),
    "noor": ("Noor · Disabled account", "NORTHSTAR", "noor@example.test", "noor"),
    "orbit": ("Orbit · Other tenant", "ORBIT", "orbit@example.test", "orbit-user"),
}


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
        if entry.get("workspace") != workspace or entry.get("email") != email:
            continue
        password = entry.get("password")
        if not isinstance(password, str) or not 1 <= len(password) <= 200:
            continue
        user = one(
            conn,
            "SELECT active FROM users WHERE id=:id AND tenant_id=:tenant AND email_normalized=:email",
            id=user_id,
            tenant=workspace,
            email=email,
        )
        if not user:
            continue
        result.append(
            {
                "key": key,
                "label": label,
                "workspace": workspace,
                "email": email,
                "password": password,
                "active": bool(user["active"]),
            }
        )
    return result
