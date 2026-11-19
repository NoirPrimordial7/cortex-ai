"""Audited primary choices for exact, freshly authorized conflicting evidence sets."""

import hashlib
import json
from datetime import date
from fastapi import HTTPException
from .security import Context, audit, execute, now, one, rows, uid, version


def fingerprint(evidence):
    data = [
        {
            "clause": e.clause_id,
            "claim": e.claim_id,
            "key": e.claim_key,
            "version": e.version_id,
            "hash": e.source_hash,
            "rank": e.rank,
            "value": e.value,
            "valid_from": e.valid_from,
            "valid_to": e.valid_to,
            "source_kind": e.source_kind,
        }
        for e in sorted(evidence, key=lambda e: e.clause_id)
    ]
    return hashlib.sha256(
        json.dumps(data, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()


def matching(ctx, evidence):
    return one(
        ctx.db,
        """SELECT t.id,t.status,t.resolution,t.revision,c.selected_clause_id
        FROM ticket_conflict_contexts c JOIN policy_tickets t
        ON t.tenant_id=c.tenant_id AND t.id=c.ticket_id
        WHERE c.tenant_id=:tenant AND c.fingerprint=:key""",
        **ctx.parameters(),
        key=fingerprint(evidence),
    )


def summary(record):
    return {k: record[k] for k in ("id", "status", "resolution", "revision", "selected_clause_id")}


def grant_review_access(ctx, did):
    role = one(
        ctx.db,
        "SELECT id FROM roles WHERE tenant_id=:tenant AND name='auditor'",
        **ctx.parameters(),
    )
    if not role:
        raise HTTPException(409, "An Auditor role is required for re-audit")
    if not one(
        ctx.db,
        "SELECT id FROM document_acl WHERE tenant_id=:tenant AND document_id=:d AND role_id=:r",
        **ctx.parameters(),
        d=did,
        r=role["id"],
    ):
        execute(
            ctx.db,
            """INSERT INTO document_acl(id,tenant_id,document_id,role_id,action)
            VALUES (:id,:tenant,:d,:r,'READ')""",
            **ctx.parameters(),
            id=uid(),
            d=did,
            r=role["id"],
        )
        execute(
            ctx.db,
            "UPDATE documents SET acl_revision=acl_revision+1 WHERE tenant_id=:tenant AND id=:d",
            **ctx.parameters(),
            d=did,
        )
        execute(
            ctx.db,
            "UPDATE tenants SET policy_revision=policy_revision+1 WHERE id=:tenant",
            **ctx.parameters(),
        )
        audit(ctx, "ticket.review_access.grant", target=did)


def create(ctx, query_id):
    from .pipeline import Question, retrieve, decide, verify
    from .tickets import decision_event

    ctx.require("ticket.create")
    q = one(
        ctx.db,
        """SELECT * FROM queries WHERE tenant_id=:tenant AND id=:id
        AND user_id=:user AND expires_at>:at""",
        **ctx.parameters(),
        id=query_id,
        at=now(),
    )
    if not q:
        raise HTTPException(404, "Query unavailable")
    if q["reason_code"] != "UNRESOLVED_CONFLICT":
        raise HTTPException(409, "Only a detected policy conflict can be sent for re-audit")
    payload = json.loads(q["answer_json"])
    topics = rows(
        ctx.db,
        """SELECT DISTINCT c.topic FROM conflict_evidence e JOIN conflicts f
        ON f.tenant_id=e.tenant_id AND f.id=e.conflict_id JOIN clauses c
        ON c.tenant_id=e.tenant_id AND c.id=e.clause_id WHERE f.tenant_id=:tenant AND f.query_id=:id""",
        **ctx.parameters(),
        id=query_id,
    )
    if len(topics) != 1:
        raise HTTPException(409, "Ask Cortex again to obtain a current conflict")
    topic = topics[0]["topic"]
    scope = json.loads(q["requested_scope"])
    question = Question(
        query=topic.replace("_", " "), as_of=date.fromisoformat(q["as_of"]), **scope
    )
    evidence = retrieve(ctx, question, topic, q["as_of"])
    _, reason, selected = decide(evidence, topic)

    # Compare all original claims, not client-supplied policy IDs or a top-k subset.
    def snapshot(c):
        return (
            c["clause_id"],
            c["version_id"],
            c["source_hash"],
            c["quote"],
            c["reviewed_value"],
            c["authority_rank"],
            c["valid_from"],
            c["valid_to"],
            c["source_kind"],
        )

    current = {
        (
            e.clause_id,
            e.version_id,
            e.source_hash,
            e.quote,
            e.value,
            e.rank,
            e.valid_from,
            e.valid_to,
            e.source_kind,
        )
        for e in selected
    }
    if (
        reason != "UNRESOLVED_CONFLICT"
        or current != {snapshot(c) for c in payload["citations"]}
        or not verify(ctx, selected)
    ):
        raise HTTPException(
            409, "Conflict sources changed or are no longer accessible; ask Cortex again"
        )
    found = matching(ctx, selected)
    if found and found["status"] == "resolved":
        raise HTTPException(409, "An Auditor already resolved this conflict; ask Cortex again")
    ident = found["id"] if found else uid()
    if not found:
        at = now()
        execute(
            ctx.db,
            """INSERT INTO policy_tickets(id,tenant_id,user_id,description,status,created_at,updated_at,revision)
            VALUES (:id,:tenant,:user,:description,'pending',:at,:at,0)""",
            **ctx.parameters(),
            id=ident,
            description=q["prompt"],
            at=at,
        )
        execute(
            ctx.db,
            """INSERT INTO ticket_conflict_contexts
            (id,tenant_id,ticket_id,query_id,fingerprint,topic,population,jurisdiction,as_of)
            VALUES (:id,:tenant,:ticket,:query,:key,:topic,:population,:jurisdiction,:as_of)""",
            **ctx.parameters(),
            id=uid(),
            ticket=ident,
            query=query_id,
            key=fingerprint(selected),
            topic=topic,
            population=question.population,
            jurisdiction=question.jurisdiction,
            as_of=q["as_of"],
        )
        for e in selected:
            execute(
                ctx.db,
                "INSERT INTO ticket_conflict_sources(id,tenant_id,ticket_id,clause_id,source_hash) VALUES (:id,:tenant,:t,:c,:hash)",
                **ctx.parameters(),
                id=uid(),
                t=ident,
                c=e.clause_id,
                hash=e.source_hash,
            )
        for did in sorted({e.document_id for e in selected}):
            execute(
                ctx.db,
                "INSERT INTO ticket_policies(id,tenant_id,ticket_id,document_id) VALUES (:id,:tenant,:t,:d)",
                **ctx.parameters(),
                id=uid(),
                t=ident,
                d=did,
            )
        decision_event(
            ctx,
            ident,
            "submitted",
            "Detected Ask Cortex conflict submitted with its exact evidence",
        )
    if not one(
        ctx.db,
        "SELECT id FROM ticket_subscribers WHERE tenant_id=:tenant AND ticket_id=:t AND user_id=:user",
        **ctx.parameters(),
        t=ident,
    ):
        execute(
            ctx.db,
            "INSERT INTO ticket_subscribers(id,tenant_id,ticket_id,user_id,query_id,created_at) VALUES (:id,:tenant,:t,:user,:q,:at)",
            **ctx.parameters(),
            id=uid(),
            t=ident,
            q=query_id,
            at=now(),
        )
        audit(ctx, "ticket.conflict.subscribe", target=ident, target_type="ticket")
    for did in sorted({e.document_id for e in selected}):
        grant_review_access(ctx, did)
    return {"id": ident, "status": "pending", "message": "Conflicting policies sent to the Auditor"}


def context(ctx, ident):
    return one(
        ctx.db,
        "SELECT * FROM ticket_conflict_contexts WHERE tenant_id=:tenant AND ticket_id=:id",
        **ctx.parameters(),
        id=ident,
    )


def sources(ctx, ident, settings):
    from .integrity import verify as verify_integrity

    result = []
    for s in rows(
        ctx.db,
        """SELECT s.clause_id,s.source_hash,c.version_id FROM ticket_conflict_sources s JOIN clauses c
        ON c.tenant_id=s.tenant_id AND c.id=s.clause_id WHERE s.tenant_id=:tenant AND s.ticket_id=:id ORDER BY s.clause_id""",
        **ctx.parameters(),
        id=ident,
    ):
        try:
            v = version(ctx, s["version_id"])
        except HTTPException as exc:
            if exc.status_code != 404:
                raise
            result.append(
                {"clause_id": s["clause_id"], "available": False, "title": "Source access revoked"}
            )
            continue
        # Hydrate quotation/metadata only after current Auditor READ succeeds.
        clause = one(
            ctx.db,
            "SELECT text,locator,valid_from,valid_to,population,jurisdiction,start_char,end_char FROM clauses WHERE tenant_id=:tenant AND id=:id",
            **ctx.parameters(),
            id=s["clause_id"],
        )
        s.update(clause)
        s.update(
            {
                "document_id": v["document_id"],
                "title": v["title"],
                "version_label": v["version_label"],
                "available": True,
            }
        )
        s["verified"] = (
            hashlib.sha256(v["extracted_text"].encode()).hexdigest() == s["source_hash"]
            and v["extracted_text"][s["start_char"] : s["end_char"]] == s["text"]
        )
        observed = verify_integrity(ctx, settings, s["version_id"])
        s["integrity_status"] = observed["status"]
        s["verified"] = s["verified"] and observed["status"] == "Verified"
        result.append(s)
    return result


def notify_subscribers(ctx, record, message):
    from .tickets import notify

    people = rows(
        ctx.db,
        "SELECT user_id FROM ticket_subscribers WHERE tenant_id=:tenant AND ticket_id=:id",
        **ctx.parameters(),
        id=record["id"],
    )
    for person in people:
        notify(ctx, {**record, "user_id": person["user_id"]}, message)


def resolve(ctx, record, body, settings):
    from .pipeline import Question, retrieve, decide, verify, JOIN, STRICT_ELIGIBLE
    from .integrity import inspect_record
    from .tickets import decision_event

    c = context(ctx, record["id"])
    if not c:
        raise HTTPException(
            409, "Historical manual ticket: submit the detected conflict from Ask Cortex"
        )
    if record["status"] != "pending" or record["revision"] != body.expected_revision:
        raise HTTPException(409, "Ticket state changed; reload")
    question = Question(
        query=c["topic"].replace("_", " "),
        as_of=date.fromisoformat(c["as_of"]),
        population=c["population"],
        jurisdiction=c["jurisdiction"],
    )
    employee = one(
        ctx.db,
        "SELECT * FROM users WHERE tenant_id=:tenant AND id=:id AND active=1",
        **ctx.parameters(),
        id=record["user_id"],
    )
    if not employee:
        raise HTTPException(409, "The originating Employee is no longer active")
    employee_ctx = Context(ctx.db, employee, [], set(), ctx.request_id)
    expected = {
        "leave": ("annual_leave_days", "working_days_per_year"),
        "remote_work": ("remote_days_per_week", "days_per_week"),
        "notice": ("notice_period_days", "calendar_days"),
        "bonus": ("executive_bonus", "INR"),
    }
    predicate, unit = expected[c["topic"]]
    candidates = rows(
        ctx.db,
        f"""SELECT c.id,a.rank {JOIN} WHERE {STRICT_ELIGIBLE}
        AND p.predicate=:predicate AND p.unit=:unit ORDER BY c.id LIMIT 101""",
        **employee_ctx.parameters(),
        asof=c["as_of"],
        population=c["population"],
        jurisdiction=c["jurisdiction"],
        topic=c["topic"],
        condition="default",
        predicate=predicate,
        unit=unit,
    )
    highest = max((p["rank"] for p in candidates), default=None)
    strongest_ids = {p["id"] for p in candidates if p["rank"] == highest}
    pinned_ids = {
        s["clause_id"]
        for s in rows(
            ctx.db,
            "SELECT clause_id FROM ticket_conflict_sources WHERE tenant_id=:tenant AND ticket_id=:id",
            **ctx.parameters(),
            id=record["id"],
        )
    }
    if len(candidates) > 100 or strongest_ids != pinned_ids:
        raise HTTPException(409, "The Employee's eligible conflict changed; ask Cortex again")
    # Candidate IDs may be checked for the originator, but all text hydration uses
    # the actual Auditor's READ. Additional Auditor-only policies cannot change
    # the conflict set seen by the Employee.
    try:
        evidence = retrieve(ctx, question, c["topic"], c["as_of"])
    except OverflowError:
        raise HTTPException(409, "Review evidence exceeds the supported bound") from None
    _, reason, peers = decide([e for e in evidence if e.clause_id in pinned_ids], c["topic"])
    if (
        reason != "UNRESOLVED_CONFLICT"
        or fingerprint(peers) != c["fingerprint"]
        or not verify(employee_ctx, peers)
        or not verify(ctx, peers)
    ):
        raise HTTPException(
            409,
            "The full conflict must remain eligible and accessible; ask Cortex again if it changed",
        )
    chosen = next((e for e in peers if e.clause_id == body.clause_id), None)
    if not chosen:
        raise HTTPException(422, "Select one of the conflicting policy versions")
    if any(
        inspect_record(ctx.db, settings, version(ctx, e.version_id))[0] != "Verified" for e in peers
    ):
        raise HTTPException(409, "All conflicting sources must pass integrity verification")
    execute(
        ctx.db,
        "UPDATE ticket_conflict_contexts SET selected_clause_id=:c WHERE tenant_id=:tenant AND ticket_id=:id",
        **ctx.parameters(),
        id=record["id"],
        c=chosen.clause_id,
    )
    execute(
        ctx.db,
        """UPDATE policy_tickets SET status='resolved',selected_document_id=:d,resolution=:reason,
        updated_at=:at,revision=revision+1 WHERE tenant_id=:tenant AND id=:id""",
        **ctx.parameters(),
        id=record["id"],
        d=chosen.document_id,
        reason=body.reason,
        at=now(),
    )
    execute(
        ctx.db,
        "UPDATE tenants SET knowledge_revision=knowledge_revision+1 WHERE id=:tenant",
        **ctx.parameters(),
    )
    label = version(ctx, chosen.version_id)["version_label"]
    decision_event(
        ctx,
        record["id"],
        "resolved",
        f"Primary: {chosen.title} ({label}, {chosen.locator}). {body.reason}",
        chosen.document_id,
    )
    notify_subscribers(
        ctx, record, "The Auditor selected a primary policy for your Cortex conflict."
    )


def rollback(ctx, record, body):
    from .tickets import decision_event

    if record["status"] != "resolved" or record["revision"] != body.expected_revision:
        raise HTTPException(409, "Ticket state changed; reload")
    label = "Undid primary: previous recorded choice. "
    execute(
        ctx.db,
        "UPDATE ticket_conflict_contexts SET selected_clause_id=NULL WHERE tenant_id=:tenant AND ticket_id=:id",
        **ctx.parameters(),
        id=record["id"],
    )
    execute(
        ctx.db,
        """UPDATE policy_tickets SET status='pending',selected_document_id=NULL,resolution=NULL,
        updated_at=:at,revision=revision+1 WHERE tenant_id=:tenant AND id=:id""",
        **ctx.parameters(),
        id=record["id"],
        at=now(),
    )
    execute(
        ctx.db,
        "UPDATE tenants SET knowledge_revision=knowledge_revision+1 WHERE id=:tenant",
        **ctx.parameters(),
    )
    decision_event(
        ctx, record["id"], "rollback", label + body.reason, record["selected_document_id"]
    )
    notify_subscribers(
        ctx,
        record,
        "The Auditor undid the primary policy choice. The conflict is open for review again.",
    )
