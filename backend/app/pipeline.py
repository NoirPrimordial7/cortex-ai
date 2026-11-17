"""Bounded fixed workflow. Only scoped AuthorizedEvidence enters reasoning/answering."""

import hashlib
import json
import re
import math
from collections import Counter
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from fastapi import HTTPException
from pydantic import UUID4, BaseModel, ConfigDict, Field
from . import db as models, leave
from .conversations import FOLLOW_UP, previous_turn, remember
from .embeddings import MODEL, cosine_rank, fuse_rankings
from .query_routing import (
    SELF, TOPICS, classify_query, employee_mention, intent, resolve_employee_mention,
)
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
    conversation_id: UUID4 | None = None


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


PASSAGE_JOIN = """FROM clauses c
 JOIN document_versions v ON v.id=c.version_id AND v.tenant_id=c.tenant_id
 JOIN documents d ON d.id=v.document_id AND d.tenant_id=v.tenant_id
 JOIN metadata_revisions m ON m.id=v.current_metadata_revision_id AND m.tenant_id=v.tenant_id
 JOIN authority_rules a ON a.id=c.authority_rule_id AND a.tenant_id=c.tenant_id"""
JOIN = PASSAGE_JOIN + """ JOIN policy_claims p ON p.clause_id=c.id AND p.tenant_id=c.tenant_id
 AND p.metadata_revision=v.metadata_revision"""
ELIGIBLE = f"""{READ} AND v.extraction_state='indexed' AND m.approval_state='approved'
 AND c.metadata_reviewed=1 AND a.active=1 AND c.valid_from<=:asof
 AND (c.valid_to IS NULL OR :asof<c.valid_to) AND c.population=:population
 AND c.jurisdiction=:jurisdiction"""
STRICT_ELIGIBLE = ELIGIBLE + """ AND c.topic=:topic AND p.condition_key=:condition
 AND p.subject=c.population AND p.modality='entitlement'"""

STOP_WORDS = set(
    "a an and apply are can does do everything find for have how i in is it list many me "
    "my of on relevant search show tell that the this to what which who with you".split()
)


def search_tokens(text):
    return list(dict.fromkeys(
        word for word in re.findall(r"[^\W_]+", text.lower())
        if len(word) >= 2 and word not in STOP_WORDS
    ))[:32]


def search_parameters(ctx, question, asof):
    return dict(
        **ctx.parameters(), asof=asof, population=question.population,
        jurisdiction=question.jurisdiction,
    )


def lexical_candidates(ctx, params, tokens):
    if not tokens:
        return []
    return rows(
        ctx.db,
        f"""SELECT c.id,c.text {PASSAGE_JOIN} WHERE {ELIGIBLE}
        AND c.id IN (SELECT clause_id FROM clause_fts WHERE clause_fts MATCH :match)
        ORDER BY c.id""",
        **params,
        match=" OR ".join(f'"{token}"' for token in tokens),
    )


def bm25(candidates, tokens):
    # Compute term statistics only from eligible matches, never restricted FTS rows.
    documents = {
        item["id"]: Counter(re.findall(r"[^\W_]+", item["text"].lower()))
        for item in candidates
    }
    if not documents:
        return []
    lengths = {ident: sum(terms.values()) for ident, terms in documents.items()}
    average = max(1, sum(lengths.values()) / len(lengths))
    weights = {
        token: math.log1p((len(documents) - frequency + 0.5) / (frequency + 0.5))
        for token in tokens
        if (frequency := sum(token in terms for terms in documents.values()))
    }
    scores = {
        ident: sum(
            weight * terms[token] * 2.2
            / (terms[token] + 1.2 * (0.25 + 0.75 * lengths[ident] / average))
            for token, weight in weights.items() if terms[token]
        )
        for ident, terms in documents.items()
    }
    return sorted((ident for ident, score in scores.items() if score > 0),
                  key=lambda ident: (-scores[ident], ident))


def highlighted_excerpt(text, tokens):
    pattern = re.compile(r"\b(?:" + "|".join(map(re.escape, tokens)) + r")\b", re.I) if tokens else None
    first = pattern.search(text) if pattern else None
    start = max(0, first.start() - 80) if first else 0
    excerpt = text[start:start + 240]
    pieces = [{"text": "…", "matched": False}] if start else []
    offset = 0
    for match in pattern.finditer(excerpt) if pattern else ():
        if offset < match.start():
            pieces.append({"text": excerpt[offset:match.start()], "matched": False})
        pieces.append({"text": match[0], "matched": True})
        offset = match.end()
    tail = excerpt[offset:] + ("…" if start + len(excerpt) < len(text) else "")
    if tail:
        pieces.append({"text": tail, "matched": False})
    return pieces


def search_relevant(ctx, question, asof, search_text, exclude=(), encoder=None):
    if question.condition_key != "default":
        return []
    params = search_parameters(ctx, question, asof)
    tokens = search_tokens(search_text)
    ranked = bm25(lexical_candidates(ctx, params, tokens), tokens)
    if encoder is not None and tokens:
        vectors = rows(
            ctx.db,
            f"""SELECT c.id,e.vector_json {PASSAGE_JOIN}
            JOIN clause_embeddings e ON e.tenant_id=c.tenant_id AND e.clause_id=c.id
            AND e.model_name=:model WHERE {ELIGIBLE} ORDER BY c.id""",
            **params,
            model=MODEL,
        )
        if vectors:
            ranked = fuse_rankings(ranked, cosine_rank(vectors, encoder.encode(search_text)))
    result, sources = [], {}
    for ident in ranked:
        if ident in exclude:
            continue
        passage = one(
            ctx.db,
            f"""SELECT c.id AS clause_id,c.text,c.locator,c.start_char,c.end_char,
            d.id AS document_id,d.title,v.id AS version_id,v.extracted_sha256 AS source_hash
            {PASSAGE_JOIN} WHERE {ELIGIBLE} AND c.id=:id""",
            **params,
            id=ident,
        )
        if not passage:
            continue
        vid = passage["version_id"]
        if vid not in sources:
            source = version(ctx, vid)["extracted_text"]
            sources[vid] = (source, hashlib.sha256(source.encode()).hexdigest())
        source, digest = sources[vid]
        quote = passage.pop("text")
        start, end = passage.pop("start_char"), passage.pop("end_char")
        if digest == passage["source_hash"] and source[start:end] == quote:
            result.append({**passage, "excerpt": highlighted_excerpt(quote, tokens)})
    return result


SUGGESTED_QUESTIONS = (
    "What is the annual leave entitlement?",
    "What is my leave balance?",
    "Show the sick leave policy",
    "Find maternity leave policies",
    "Show leave carry-forward rules",
    "How many remote days per week?",
    "What is the remote work allowance?",
    "Show work from home policies",
    "What is my notice period?",
    "What is the standard resignation notice?",
    "Show notice period policies",
    "What is the executive bonus?",
    "Show executive bonus policies",
)


def suggestions(ctx, partial, question):
    ctx.require("query.execute")
    q = partial.strip().casefold()
    if not q:
        return []
    asof = (question.as_of or leave.today(ctx)).isoformat()
    params = search_parameters(ctx, question, asof)
    titles = rows(
        ctx.db,
        f"""SELECT DISTINCT d.title,c.topic {PASSAGE_JOIN} WHERE {ELIGIBLE}
        AND (instr(lower(d.title),:q)>0 OR instr(replace(c.topic,'_',' '),:q)>0)
        ORDER BY d.title LIMIT 8""",
        **params,
        q=q,
    )
    options = {
        phrase: (0 if phrase.casefold().startswith(q) else 2, None)
        for phrase in SUGGESTED_QUESTIONS if q in phrase.casefold()
    }
    for item in titles:
        options.setdefault(item["title"], (1, None))
    if "leave.view_reports" in ctx.actions:
        _, people = leave.current_reports(ctx)
        for person in people:
            name = person["display_name"]
            phrase = f"How many leave days does {name} have?"
            if q in name.casefold() or phrase.casefold().startswith(q):
                options[phrase] = (0, person["id"])
    selected = sorted(options, key=lambda text: (options[text][0], text.casefold()))[:8]
    for option in selected:
        if user_id := options[option][1]:
            leave.record(ctx, "leave.suggestion.read", user_id)
    return selected


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
        f"""SELECT c.id {JOIN} WHERE {STRICT_ELIGIBLE}
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
      p.unit,p.modality,p.condition_key,a.rank {JOIN} WHERE {STRICT_ELIGIBLE} ORDER BY c.id LIMIT 101""",
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


PERSONAL_ABSTENTION = "I can’t find information for that."


def personal_leave(ctx, question, as_of, target=None):
    mention = employee_mention(question.query)
    if target is None:
        target = (
            resolve_employee_mention(ctx, mention) if mention
            else ctx.user["id"] if SELF.search(question.query) else None
        )
    if not isinstance(target, str):
        return None
    try:
        result = (
            leave.own_balance(ctx, as_of) if target == ctx.user["id"]
            else leave.employee_balance(ctx, target, as_of)
        )
    except HTTPException as error:
        if error.status_code != 404:
            raise
        return None
    return {**result, "as_of": result["as_of"].isoformat()}


def answer(ctx, question: Question, observe=None, *, encoder=None):
    ctx.require("query.execute")
    captured = revisions(ctx)
    kind = classify_query(question.query)
    topic = intent(question.query)
    search_text = question.query
    target = None
    follow_up = False
    if question.conversation_id and kind != "employee_leave" and not topic and FOLLOW_UP.match(search_text):
        previous = previous_turn(ctx, question.conversation_id)
        if previous and (previous["topic"] or previous["resolved_entity"]):
            kind, topic, target = previous["kind"], previous["topic"], previous["resolved_entity"]
            follow_up = True
            if kind != "employee_leave":
                search_text = f"{TOPICS[topic][0]} {search_text}"
                updates = {"query": search_text}
                if re.search(r"\bcontractors?\b", search_text, re.I):
                    updates["population"] = "india_contractor"
                elif re.search(r"\bfull[- ]time\b", search_text, re.I):
                    updates["population"] = "india_full_time"
                elif re.search(r"\b(?:apply|applies) to (?!me\b|those\b|everyone\b)", search_text, re.I):
                    updates["condition_key"] = "unreviewed_population"
                retrieval_question = question.model_copy(update=updates)
            else:
                retrieval_question = question
        else:
            retrieval_question = question
    else:
        retrieval_question = question
    personal = kind == "employee_leave"
    date_of_answer = question.as_of or (
        leave.today(ctx) if personal else datetime.now(ZoneInfo("Asia/Kolkata")).date()
    )
    asof = date_of_answer.isoformat()
    ledger = personal_leave(ctx, question, date_of_answer, target) if personal else None
    evidence = []
    if personal:
        status, reason, selected = (
            ("answered", None, []) if ledger else ("abstained", "NO_ELIGIBLE_EVIDENCE", [])
        )
    elif retrieval_question.condition_key != "default":
        status, reason, selected = "clarification_required", "UNCERTAIN_METADATA", []
    elif kind != "policy_fact" or topic is None:
        status, reason, selected = "abstained", "NO_ELIGIBLE_EVIDENCE", []
    else:
        try:
            evidence = retrieve(ctx, retrieval_question, topic, asof)
            if observe:
                observe("reasoning", evidence)
            status, reason, selected = decide(evidence, topic)
        except OverflowError:
            status, reason, selected = "abstained", "EVIDENCE_LIMIT", []
    if observe:
        observe("answerer", selected)
    if revisions(ctx) != captured:
        status, reason, selected = "abstained", "CONTEXT_CHANGED", []
        ledger = None
    elif not personal and not verify(ctx, selected):
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
            "authority_rank": e.rank,
            "reviewed_value": e.value,
        }
        for e in selected
    ]
    sentence = "I cannot answer from the available approved evidence for this date and scope."
    if personal:
        sentence = "Personal leave balance" if ledger else PERSONAL_ABSTENTION
    elif status == "answered":
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
    related = [] if reason == "CONTEXT_CHANGED" else search_relevant(
        ctx, retrieval_question, asof, "leave" if personal else search_text,
        {e.clause_id for e in selected}, encoder,
    )
    payload = {
        "query_id": qid,
        "status": status,
        "reason_code": reason,
        "mode": "evidence",
        "as_of": asof,
        "scope": {"population": retrieval_question.population, "jurisdiction": question.jurisdiction},
        "answer": sentence,
        "citations": cite,
        "related_results": related,
        "claims": [{"text": sentence, "citation_ids": [c["id"] for c in cite]}]
        if status == "answered" and not personal
        else [],
        "explanation": [{"code": explanation, "citation_ids": [c["id"] for c in cite]}]
        if cite
        else [],
    }
    if follow_up:
        payload["follow_up"] = True
    ctx.db.execute(
        models.queries.insert().values(
            id=qid,
            tenant_id=ctx.tenant,
            user_id=ctx.user["id"],
            prompt="Personal leave lookup" if personal else question.query,
            as_of=asof,
            requested_scope=json.dumps(payload["scope"]),
            status=status,
            reason_code=reason,
            answer_json=json.dumps(payload),
            dependency_ids=json.dumps(sorted(
                {e.document_id for e in selected} | {r["document_id"] for r in related}
            )),
            **captured,
            created_at=now(),
            expires_at=(datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        )
    )
    if question.conversation_id:
        remember(
            ctx, question.conversation_id, qid, kind, None if personal else topic,
            ledger["user_id"] if ledger else None,
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
    if ledger:
        return {
            **payload, "source": "leave_ledger", "balances": ledger["balances"],
            "display_name": ledger.get("display_name"),
        }
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
    for c in [*payload["citations"], *payload.get("related_results", [])]:
        v = version(ctx, c["version_id"])
        if hashlib.sha256(v["extracted_text"].encode()).hexdigest() != c["source_hash"]:
            raise HTTPException(409, "Evidence changed; ask again")
    return payload
