"""The three active application roles and their action permissions."""

ACTIONS = {
    "employee": ["query.execute", "leave.apply", "ticket.create"],
    "auditor": [
        "query.execute",
        "audit.read",
        "document.review",
        "heading.manage",
        "leave.read_all",
        "leave.review",
        "ticket.review",
    ],
    "admin": [
        "query.execute",
        "user.manage",
        "acl.manage",
        "authority.manage",
        "document.upload",
        "policy.submit",
        "leave.read_all",
        "leave.manage",
    ],
}
