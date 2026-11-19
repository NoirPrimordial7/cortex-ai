"""Submission, auditor decisions and persistent policy headings."""

import unicodedata
from fastapi import HTTPException
from pydantic import BaseModel, ConfigDict, Field
from .security import audit, document, execute, now, one, rows, uid, version


class Revision(BaseModel):
    model_config = ConfigDict(extra="forbid")
    expected_revision: int = Field(ge=0)


class HeadingInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=2, max_length=100)


class Rejection(Revision):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    reason: str = Field(min_length=3, max_length=500)


def reject(ctx, vid, body):
    from types import SimpleNamespace

    ctx.require("document.review")
    v = version(ctx, vid)
    decision = SimpleNamespace(approval_state="rejected", heading_id=None, reason=body.reason)
    w = check_review(ctx, v, decision)
    if w["revision"] != body.expected_revision:
        raise HTTPException(409, "Policy state changed; reload")
    # Rejection needs no invented applicability dates or numeric claim.
    complete_review(ctx, w, decision)
    return workflow(ctx, vid)


def heading_list(ctx):
    return {
        "items": rows(
            ctx.db,
            """SELECT id,name FROM policy_headings
        WHERE tenant_id=:tenant ORDER BY normalized_name""",
            **ctx.parameters(),
        )
    }


def create_heading(ctx, body):
    ctx.require("heading.manage")
    name = " ".join(unicodedata.normalize("NFKC", body.name).split())
    if len(name) < 2:
        raise HTTPException(422, "Provide a heading of at least two characters")
    normalized = name.casefold()
    found = one(
        ctx.db,
        """SELECT id,name FROM policy_headings
        WHERE tenant_id=:tenant AND normalized_name=:name""",
        **ctx.parameters(),
        name=normalized,
    )
    if found:
        return found
    ident = uid()
    execute(
        ctx.db,
        """INSERT INTO policy_headings
        (id,tenant_id,name,normalized_name,created_by,created_at) VALUES (:id,:tenant,:name,:key,:user,:at)""",
        **ctx.parameters(),
        id=ident,
        name=name,
        key=normalized,
        at=now(),
    )
    audit(ctx, "policy.heading.create", target=ident, target_type="heading")
    return {"id": ident, "name": name}


def workflow(ctx, vid):
    result = one(
        ctx.db,
        """SELECT w.*,h.name AS heading_name FROM policy_workflows w
        LEFT JOIN policy_headings h ON h.tenant_id=w.tenant_id AND h.id=w.heading_id
        WHERE w.tenant_id=:tenant AND w.version_id=:id""",
        **ctx.parameters(),
        id=vid,
    )
    if not result:
        raise HTTPException(404, "Resource unavailable")
    return result


def event(ctx, wid, status, comment, heading_id=None):
    execute(
        ctx.db,
        """INSERT INTO policy_workflow_events
        (id,tenant_id,workflow_id,actor_id,status,heading_id,comment,created_at)
        VALUES (:id,:tenant,:w,:user,:status,:heading,:comment,:at)""",
        **ctx.parameters(),
        id=uid(),
        w=wid,
        status=status,
        heading=heading_id,
        comment=comment,
        at=now(),
    )


def create_draft(ctx, vid):
    wid = uid()
    execute(
        ctx.db,
        """INSERT INTO policy_workflows(id,tenant_id,version_id,status,revision)
        VALUES (:id,:tenant,:v,'draft',0)""",
        **ctx.parameters(),
        id=wid,
        v=vid,
    )
    event(ctx, wid, "draft", "Policy version created")


def submit(ctx, vid, body):
    ctx.require("policy.submit")
    v = version(ctx, vid)
    w = workflow(ctx, vid)
    if body.expected_revision != w["revision"] or w["status"] not in ("draft", "rejected"):
        raise HTTPException(409, "Policy state changed; reload before submission")
    if v["extraction_state"] == "failed":
        raise HTTPException(409, "Extraction must succeed before submission")
    # Auditor membership provides review action and this explicit document READ grant.
    role = one(
        ctx.db,
        "SELECT id FROM roles WHERE tenant_id=:tenant AND name='auditor'",
        **ctx.parameters(),
    )
    if not role:
        raise HTTPException(409, "Create an Auditor role before submitting")
    if not one(
        ctx.db,
        """SELECT id FROM document_acl
        WHERE tenant_id=:tenant AND document_id=:d AND role_id=:r""",
        **ctx.parameters(),
        d=v["document_id"],
        r=role["id"],
    ):
        execute(
            ctx.db,
            """INSERT INTO document_acl(id,tenant_id,document_id,role_id,action)
            VALUES (:id,:tenant,:d,:r,'READ')""",
            **ctx.parameters(),
            id=uid(),
            d=v["document_id"],
            r=role["id"],
        )
        execute(
            ctx.db,
            "UPDATE documents SET acl_revision=acl_revision+1 WHERE tenant_id=:tenant AND id=:id",
            **ctx.parameters(),
            id=v["document_id"],
        )
        execute(
            ctx.db,
            "UPDATE tenants SET policy_revision=policy_revision+1 WHERE id=:tenant",
            **ctx.parameters(),
        )
    execute(
        ctx.db,
        """UPDATE policy_workflows SET status='submitted',submitted_by=:user,
        submitted_at=:at,revision=revision+1 WHERE tenant_id=:tenant AND id=:id""",
        **ctx.parameters(),
        id=w["id"],
        at=now(),
    )
    event(ctx, w["id"], "submitted", "Submitted for independent Auditor review")
    audit(ctx, "policy.submit", target=v["document_id"])
    return workflow(ctx, vid)


def check_review(ctx, v, body):
    ctx.require("document.review")
    w = workflow(ctx, v["id"])
    if w["status"] != "submitted":
        raise HTTPException(409, "Submit this version before review")
    owner = document(ctx, v["document_id"])
    if ctx.user["id"] in (owner["owner_user_id"], w["submitted_by"]):
        raise HTTPException(403, "Independent Auditor review is required")
    if body.approval_state not in ("approved", "rejected"):
        raise HTTPException(422, "Choose approve or reject")
    if body.approval_state == "approved" and not one(
        ctx.db,
        """SELECT id FROM policy_headings
        WHERE tenant_id=:tenant AND id=:id""",
        **ctx.parameters(),
        id=body.heading_id,
    ):
        raise HTTPException(422, "Select an existing policy heading")
    return w


def complete_review(ctx, w, body):
    execute(
        ctx.db,
        """UPDATE policy_workflows SET status=:status,heading_id=:heading,
        reviewer_id=:user,review_comment=:comment,reviewed_at=:at,revision=revision+1
        WHERE tenant_id=:tenant AND id=:id""",
        **ctx.parameters(),
        id=w["id"],
        status=body.approval_state,
        heading=body.heading_id,
        comment=body.reason,
        at=now(),
    )
    event(ctx, w["id"], body.approval_state, body.reason, body.heading_id)
    audit(ctx, "policy." + body.approval_state, target=w["version_id"], target_type="version")


def queue(ctx):
    ctx.require("document.review")
    # READ is still checked by the source/detail routes on every inspection.
    items = rows(
        ctx.db,
        """SELECT w.*,d.title,v.version_label,d.id AS document_id
        FROM policy_workflows w JOIN document_versions v
          ON v.tenant_id=w.tenant_id AND v.id=w.version_id
        JOIN documents d ON d.tenant_id=v.tenant_id AND d.id=v.document_id
        WHERE w.tenant_id=:tenant AND w.status='submitted' AND d.archived_at IS NULL
          AND EXISTS (SELECT 1 FROM document_acl a WHERE a.tenant_id=d.tenant_id
          AND a.document_id=d.id AND (a.user_id=:user OR a.role_id IN
          (SELECT role_id FROM user_roles WHERE tenant_id=:tenant AND user_id=:user)))
        ORDER BY w.submitted_at,w.id""",
        **ctx.parameters(),
    )
    audit(ctx, "policy.review_queue.read")
    return {"items": items}


def require_distributable(ctx, did):
    if not one(
        ctx.db,
        """SELECT v.id FROM document_versions v JOIN metadata_revisions m
        ON m.tenant_id=v.tenant_id AND m.id=v.current_metadata_revision_id
        JOIN policy_workflows w ON w.tenant_id=v.tenant_id AND w.version_id=v.id
        WHERE v.tenant_id=:tenant AND v.document_id=:id AND m.approval_state='approved'
          AND w.status='approved' AND v.extraction_state='indexed'""",
        **ctx.parameters(),
        id=did,
    ):
        raise HTTPException(409, "Auditor approval is required before distributing access")
