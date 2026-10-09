"""Bounded fixed workflow. Only scoped AuthorizedEvidence enters reasoning/answering."""

import hashlib
import json
import re
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from fastapi import HTTPException
from pydantic import BaseModel, ConfigDict, Field
from . import db as models
from .security import READ, audit, now, one, readable, revisions, rows, uid, version


class Question(BaseModel):
    model_config = ConfigDict(extra="forbid")
    query: str = Field(min_length=2, max_length=1000)
    as_of: date | None = None
    population: str = Field(
        default="india_full_time", pattern="^(india_full_time|india_contractor)$"
    )
    jurisdiction: str = Field(default="IN", pattern="^IN$")
    condition_key: str = Field(default="default", max_length=80)


@dataclass(frozen=True)
class AuthorizedEvidence:
    clause_id: str
    document_id: str
    version_id: str
    title: str
    quote: str
    locator: str
    start: int
    end: int
    source_hash: str
    valid_from: str
    valid_to: str | None
    source_kind: str
    rank: int
    value: int
    claim_id: str
    claim_key: tuple


def intent(prompt):
    p = prompt.lower()
    choices = [
        ("leave", ("leave", "vacation", "time off", "pto")),
        ("remote_work", ("remote", "work from home", "wfh")),
        ("notice", ("notice", "resignation")),
        ("bonus", ("executive", "bonus")),
    ]
    found = [key for key, terms in choices if any(term in p for term in terms)]
    return found[0] if len(found) == 1 else None


JOIN = """FROM clauses c
 JOIN document_versions v ON v.id=c.version_id AND v.tenant_id=c.tenant_id
 JOIN documents d ON d.id=v.document_id AND d.tenant_id=v.tenant_id
 JOIN metadata_revisions m ON m.id=v.current_metadata_revision_id AND m.tenant_id=v.tenant_id
 JOIN policy_claims p ON p.clause_id=c.id AND p.tenant_id=c.tenant_id AND p.metadata_revision=v.metadata_revision
 JOIN authority_rules a ON a.id=c.authority_rule_id AND a.tenant_id=c.tenant_id"""
ELIGIBLE = f"""{READ} AND v.extraction_state='indexed' AND m.approval_state='approved'
 AND c.metadata_reviewed=1 AND a.active=1 AND c.valid_from<=:asof
 AND (c.valid_to IS NULL OR :asof<c.valid_to) AND c.population=:population
 AND c.jurisdiction=:jurisdiction AND c.topic=:topic AND p.condition_key=:condition
 AND p.subject=c.population AND p.modality='entitlement'"""


def retrieve(ctx, question, topic, asof):
    params = dict(
        **ctx.parameters(),
        asof=asof,
        population=question.population,
        jurisdiction=question.jurisdiction,
        topic=topic,
        condition=question.condition_key,
    )
    tokens = list(dict.fromkeys(re.findall(r"[a-zA-Z0-9]+", question.query.lower())))[:32]
    # Finite topic synonyms keep the diagnostic query reproducible; no raw MATCH syntax.
    synonyms = {
        "leave": ["leave", "vacation"],
        "remote_work": ["remote"],
        "notice": ["notice"],
        "bonus": ["bonus"],
    }
    match = " OR ".join('"' + t + '"' for t in tokens + synonyms[topic])
    candidates = rows(
        ctx.db,
        f"""SELECT c.id {JOIN} WHERE {ELIGIBLE}
      AND c.id IN (SELECT clause_id FROM clause_fts WHERE clause_fts MATCH :match)
      ORDER BY c.id LIMIT 20""",
        **params,
        match=match,
    )
    if not candidates:
        return []
    # Expand ALL eligible exact-key peers before conflict handling, independent of top-k.
    peers = rows(
        ctx.db,
        f"""SELECT c.*,d.id AS document_id,d.title,v.extracted_sha256,
      v.metadata_revision,m.source_kind,p.id AS claim_id,p.subject,p.predicate,p.value_json,
      p.unit,p.modality,p.condition_key,a.rank {JOIN} WHERE {ELIGIBLE} ORDER BY c.id LIMIT 101""",
        **params,
    )
    if len(peers) > 100:
        raise OverflowError("EVIDENCE_LIMIT")
    result = []
    expected = {
        "leave": ("annual_leave_days", "working_days_per_year"),
        "remote_work": ("remote_days_per_week", "days_per_week"),
        "notice": ("notice_period_days", "calendar_days"),
        "bonus": ("executive_bonus", "INR"),
    }
    for p in peers:
        if (p["predicate"], p["unit"]) != expected[topic]:
            continue
        result.append(
            AuthorizedEvidence(
                p["id"],
                p["document_id"],
                p["version_id"],
                p["title"],
                p["text"],
                p["locator"],
                p["start_char"],
                p["end_char"],
                p["extracted_sha256"],
                p["valid_from"],
                p["valid_to"],
                p["source_kind"],
                p["rank"],
                json.loads(p["value_json"]),
                p["claim_id"],
                (
                    topic,
                    p["subject"],
                    p["predicate"],
                    p["population"],
                    p["jurisdiction"],
                    p["unit"],
                    p["modality"],
                    p["condition_key"],
                ),
            )
        )
    # Scores use authorized text only; never global corpus BM25. Scores stay internal.
    return sorted(result, key=lambda e: (-sum(t in e.quote.lower() for t in tokens), e.clause_id))


def decide(evidence: list[AuthorizedEvidence], topic):
    governing = "operations_policy" if topic == "remote_work" else "hr_policy"
    if not any(e.source_kind == governing for e in evidence):
        return "abstained", "NO_ELIGIBLE_EVIDENCE", []
    if len({e.claim_key for e in evidence}) != 1:
        return "abstained", "UNCERTAIN_METADATA", []
    rank = max(e.rank for e in evidence)
    strongest = [e for e in evidence if e.rank == rank]
    if len({e.value for e in strongest}) > 1:
        if len(strongest) > 8:
            return "abstained", "EVIDENCE_LIMIT", []
        return "abstained", "UNRESOLVED_CONFLICT", strongest
    return "answered", None, strongest[:8]


def verify(ctx, evidence):
    for e in evidence:
        v = version(ctx, e.version_id)
        content = v["extracted_text"]
        if (
            content[e.start : e.end] != e.quote
            or hashlib.sha256(content.encode()).hexdigest() != e.source_hash
            or not re.search(rf"(?<!\d){e.value}(?!\d)", e.quote)
        ):
            return False
    return True


def answer(ctx, question: Question, observe=None):
    ctx.require("query.execute")
    captured = revisions(ctx)
    asof = (question.as_of or datetime.now(ZoneInfo("Asia/Kolkata")).date()).isoformat()
    topic = intent(question.query)
    evidence = []
    if question.condition_key != "default":
        status, reason, selected = "clarification_required", "UNCERTAIN_METADATA", []
    elif topic is None:
        status, reason, selected = "abstained", "NO_ELIGIBLE_EVIDENCE", []
    else:
        try:
            evidence = retrieve(ctx, question, topic, asof)
            if observe:
                observe("reasoning", evidence)
            status, reason, selected = decide(evidence, topic)
        except OverflowError:
            status, reason, selected = "abstained", "EVIDENCE_LIMIT", []
    if observe:
        observe("answerer", selected)
    if revisions(ctx) != captured:
        status, reason, selected = "abstained", "CONTEXT_CHANGED", []
    elif not verify(ctx, selected):
        status, reason, selected = "abstained", "SUPPORT_FAILED", []
    qid = uid()
    cite = [
        {
            "id": uid(),
            "document_id": e.document_id,
            "version_id": e.version_id,
            "clause_id": e.clause_id,
            "title": e.title,
            "quote": e.quote,
            "locator": e.locator,
            "start_char": e.start,
            "end_char": e.end,
            "source_hash": e.source_hash,
            "valid_from": e.valid_from,
            "valid_to": e.valid_to,
            "source_kind": e.source_kind,
            "reviewed_value": e.value,
        }
        for e in selected
    ]
    sentence = "I cannot answer from the available approved evidence for this date and scope."
    if status == "answered":
        descriptions = {
            "leave": "annual leave entitlement",
            "remote_work": "remote work allowance",
            "notice": "notice period",
            "bonus": "executive bonus",
        }
        units = {
            "leave": "working days per year",
            "remote_work": "days per week",
            "notice": "calendar days",
            "bonus": "INR",
        }
        sentence = f"The approved {descriptions[topic]} is {selected[0].value} {units[topic]}."
    elif reason == "UNRESOLVED_CONFLICT":
        sentence = "Equally authoritative policies disagree for this date and scope. I cannot choose between them."
    elif status == "clarification_required":
        sentence = "This condition needs a reviewed scope before I can answer."
    explanation = (
        "EQUAL_AUTHORITY_CONFLICT" if reason == "UNRESOLVED_CONFLICT" else "APPROVED_VALID_SOURCE"
    )
    payload = {
        "query_id": qid,
        "status": status,
        "reason_code": reason,
        "mode": "evidence",
        "as_of": asof,
        "scope": {"population": question.population, "jurisdiction": question.jurisdiction},
        "answer": sentence,
        "citations": cite,
        "claims": [{"text": sentence, "citation_ids": [c["id"] for c in cite]}]
        if status == "answered"
        else [],
        "explanation": [{"code": explanation, "citation_ids": [c["id"] for c in cite]}]
        if cite
        else [],
    }
    ctx.db.execute(
        models.queries.insert().values(
            id=qid,
            tenant_id=ctx.tenant,
            user_id=ctx.user["id"],
            prompt=question.query,
            as_of=asof,
            requested_scope=json.dumps(payload["scope"]),
            status=status,
            reason_code=reason,
            answer_json=json.dumps(payload),
            dependency_ids=json.dumps(sorted({e.document_id for e in selected})),
            **captured,
            created_at=now(),
            expires_at=(datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        )
    )
    for c in cite:
        ctx.db.execute(
            models.citations.insert().values(
                id=c["id"],
                tenant_id=ctx.tenant,
                query_id=qid,
                clause_id=c["clause_id"],
                claim_index=0,
                start_char=c["start_char"],
                end_char=c["end_char"],
                source_hash=c["source_hash"],
            )
        )
    if reason == "UNRESOLVED_CONFLICT":
        conflict_id = uid()
        ctx.db.execute(
            models.conflicts.insert().values(
                id=conflict_id,
                tenant_id=ctx.tenant,
                query_id=qid,
                kind="equal_authority",
                status="unresolved",
                detector_version="structured-v1",
            )
        )
        for e in selected:
            ctx.db.execute(
                models.conflict_evidence.insert().values(
                    id=uid(),
                    tenant_id=ctx.tenant,
                    conflict_id=conflict_id,
                    clause_id=e.clause_id,
                    claim_id=e.claim_id,
                )
            )
    audit(ctx, "query.execute", status)
    return payload


def saved(ctx, qid):
    q = one(
        ctx.db,
        "SELECT * FROM queries WHERE id=:id AND tenant_id=:tenant AND user_id=:user AND expires_at>:at",
        **ctx.parameters(),
        id=qid,
        at=now(),
    )
    if not q or any(not readable(ctx, did) for did in json.loads(q["dependency_ids"])):
        raise HTTPException(404, "Resource unavailable")
    if {k: q[k] for k in ["policy_revision", "knowledge_revision"]} != revisions(ctx):
        raise HTTPException(409, "Evidence changed; ask again")
    payload = json.loads(q["answer_json"])
    for c in payload["citations"]:
        v = version(ctx, c["version_id"])
        if hashlib.sha256(v["extracted_text"].encode()).hexdigest() != c["source_hash"]:
            raise HTTPException(409, "Evidence changed; ask again")
    return payload
