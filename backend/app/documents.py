import hashlib
import json
import re
import subprocess
import sys
from datetime import date
from pathlib import Path
from fastapi import HTTPException
from pydantic import BaseModel, ConfigDict, Field, model_validator
from . import db as models
from .security import audit, document, execute, now, one, rows, uid, version


class Claim(BaseModel):
    model_config = ConfigDict(extra="forbid")
    subject: str = Field(min_length=1, max_length=80)
    predicate: str = Field(min_length=1, max_length=80)
    value: int = Field(ge=0, le=1000000)
    unit: str = Field(min_length=1, max_length=80)
    modality: str = "entitlement"
    condition_key: str = "default"


class Review(BaseModel):
    model_config = ConfigDict(extra="forbid")
    expected_metadata_revision: int = Field(ge=0)
    approval_state: str = Field(pattern="^(approved|pending|rejected)$")
    valid_from: date
    valid_to: date | None = None
    open_ended: bool
    population: str = Field(pattern="^(india_full_time|india_contractor)$")
    jurisdiction: str = Field(pattern="^IN$")
    topic: str = Field(pattern="^(leave|remote_work|notice|bonus)$")
    source_kind: str = Field(pattern="^(hr_policy|operations_policy|informal_note)$")
    published_at: date
    start_char: int = Field(ge=0)
    end_char: int = Field(gt=0)
    claim: Claim
    access_scope: str = Field(pattern="^uniform$")
    reason: str = Field(min_length=3, max_length=500)

    @model_validator(mode="after")
    def consistency(self):
        if self.open_ended != (self.valid_to is None):
            raise ValueError("Specify a finite end date or an explicitly open-ended interval")
        if self.valid_to and self.valid_to <= self.valid_from:
            raise ValueError("Validity end must follow start")
        if (
            self.start_char >= self.end_char
            or self.end_char - self.start_char > 8000
            or self.claim.subject != self.population
        ):
            raise ValueError("Invalid span or claim scope")
        return self


def ingest(
    ctx,
    settings,
    payload,
    filename,
    title,
    category="policy",
    *,
    document_id=None,
    ids=None,
    version_label=None,
    ingested_at=None,
):
    ctx.require("document.upload")
    suffix = Path(filename).suffix.lower()
    if suffix not in {".txt", ".pdf", ".docx"}:
        raise HTTPException(415, "Supported formats: UTF-8 TXT, text PDF, DOCX")
    if not payload or len(payload) > 10 * 1024 * 1024:
        raise HTTPException(413, "File must contain at most 10 MiB")
    if not title.strip() or len(title) > 200:
        raise HTTPException(422, "Provide a title of 1–200 characters")
    ids = ids or {}
    did = document_id or ids.get("document_id") or uid()
    if document_id:
        document(ctx, did)
    else:
        ctx.db.execute(
            models.documents.insert().values(
                id=did,
                tenant_id=ctx.tenant,
                title=title.strip(),
                owner_user_id=ctx.user["id"],
                category=category,
            )
        )
        ctx.db.execute(
            models.document_acl.insert().values(
                id=uid(),
                tenant_id=ctx.tenant,
                document_id=did,
                user_id=ctx.user["id"],
                role_id=None,
                action="READ",
            )
        )
    vid = ids.get("version_id") or uid()
    key = uid() + suffix
    private = settings.data_dir / "uploads"
    private.mkdir(parents=True, exist_ok=True)
    object_path = private / key
    object_path.write_bytes(payload)
    try:
        output = subprocess.run(
            [
                sys.executable,
                "-I",
                str(Path(__file__).with_name("parser_worker.py")),
                str(object_path),
            ],
            capture_output=True,
            timeout=30,
            check=True,
        )
        parsed = json.loads(output.stdout)
    except (subprocess.SubprocessError, ValueError):
        parsed = {"error": "EXTRACTION_FAILED_OR_UNSUPPORTED"}
    failed = "error" in parsed
    extracted = parsed.get("text", "")
    at = ingested_at or now()
    ctx.db.execute(
        models.document_versions.insert().values(
            id=vid,
            tenant_id=ctx.tenant,
            document_id=did,
            version_label=version_label or vid[:8],
            object_key=key,
            sha256=hashlib.sha256(payload).hexdigest(),
            extracted_text=extracted,
            extracted_sha256=hashlib.sha256(extracted.encode()).hexdigest(),
            segments_json=json.dumps(parsed.get("segments", [])),
            ingested_at=at,
            published_at=None,
            extraction_state="failed" if failed else "pending_review",
            parser_version="bounded-v2-document-order",
            metadata_revision=0,
            current_metadata_revision_id=None,
            index_generation=0,
        )
    )
    jid = uid()
    ctx.db.execute(
        models.ingestion_jobs.insert().values(
            id=jid,
            tenant_id=ctx.tenant,
            version_id=vid,
            state="failed" if failed else "pending_review",
            attempt=1,
            started_at=at,
            finished_at=now(),
            safe_error_code=parsed.get("error"),
        )
    )
    audit(ctx, "document.upload", "failed" if failed else "success", did)
    return {
        "document_id": did,
        "version_id": vid,
        "job_id": jid,
        "state": "failed" if failed else "pending_review",
    }


def review(ctx, vid, body: Review, *, clause_id=None):
    ctx.require("document.review")
    v = version(ctx, vid)
    if v["extraction_state"] == "failed":
        raise HTTPException(409, "Extraction must succeed before review")
    if body.expected_metadata_revision != v["metadata_revision"]:
        raise HTTPException(409, "Metadata changed; reload before review")
    value = v["extracted_text"]
    if body.end_char > len(value):
        raise HTTPException(422, "Evidence span exceeds source")
    quote = value[body.start_char : body.end_char]
    if not re.search(rf"(?<!\d){body.claim.value}(?!\d)", quote):
        raise HTTPException(422, "Reviewed numeric claim must occur in the selected source span")
    mapping = {
        "leave": ("annual_leave_days", "working_days_per_year"),
        "remote_work": ("remote_days_per_week", "days_per_week"),
        "notice": ("notice_period_days", "calendar_days"),
        "bonus": ("executive_bonus", "INR"),
    }
    if (
        (body.claim.predicate, body.claim.unit) != mapping[body.topic]
        or body.claim.modality != "entitlement"
        or body.claim.condition_key != "default"
    ):
        raise HTTPException(422, "This MVP supports reviewed standard entitlement claims only")
    rule = one(
        ctx.db,
        """SELECT * FROM authority_rules WHERE tenant_id=:tenant
        AND topic=:topic AND jurisdiction=:jurisdiction AND source_kind=:kind AND active=1""",
        tenant=ctx.tenant,
        topic=body.topic,
        jurisdiction=body.jurisdiction,
        kind=body.source_kind,
    )
    if not rule:
        raise HTTPException(422, "No reviewed authority rule for this source")
    old = one(
        ctx.db,
        "SELECT * FROM clauses WHERE tenant_id=:tenant AND version_id=:vid",
        tenant=ctx.tenant,
        vid=vid,
    )
    if old and (old["start_char"], old["end_char"]) != (body.start_char, body.end_char):
        raise HTTPException(409, "Evidence content is immutable; upload a new version")
    revision = v["metadata_revision"] + 1
    mid = uid()
    metadata = {
        k: getattr(body, k)
        for k in [
            "approval_state",
            "open_ended",
            "population",
            "jurisdiction",
            "topic",
            "source_kind",
            "reason",
        ]
    }
    metadata.update(
        valid_from=body.valid_from.isoformat(),
        valid_to=body.valid_to.isoformat() if body.valid_to else None,
    )
    ctx.db.execute(
        models.metadata_revisions.insert().values(
            id=mid,
            tenant_id=ctx.tenant,
            version_id=vid,
            revision_no=revision,
            reviewer_id=ctx.user["id"],
            reviewed_at=now(),
            **metadata,
        )
    )
    cid = old["id"] if old else clause_id or uid()
    segments = json.loads(v["segments_json"])
    containing = [s for s in segments if s["start"] <= body.start_char < s["end"]]
    locator = containing[0]["locator"] if containing else "Source character span"
    projection = {
        k: metadata[k]
        for k in ["valid_from", "valid_to", "open_ended", "population", "jurisdiction", "topic"]
    }
    projection.update(authority_rule_id=rule["id"], metadata_reviewed=True)
    if old:
        ctx.db.execute(
            models.clauses.update().where(models.clauses.c.id == cid).values(**projection)
        )
    else:
        ctx.db.execute(
            models.clauses.insert().values(
                id=cid,
                tenant_id=ctx.tenant,
                version_id=vid,
                ordinal=1,
                text=quote,
                locator=locator,
                page=None,
                paragraph=None,
                start_char=body.start_char,
                end_char=body.end_char,
                **projection,
            )
        )
    ctx.db.execute(
        models.policy_claims.insert().values(
            id=uid(),
            tenant_id=ctx.tenant,
            clause_id=cid,
            metadata_revision=revision,
            subject=body.claim.subject,
            predicate=body.claim.predicate,
            value_json=json.dumps(body.claim.value),
            unit=body.claim.unit,
            modality=body.claim.modality,
            condition_key=body.claim.condition_key,
            exception_of_claim_id=None,
            reviewer_id=ctx.user["id"],
        )
    )
    execute(ctx.db, "DELETE FROM clause_fts WHERE clause_id=:cid", cid=cid)
    approved = body.approval_state == "approved"
    if approved:
        execute(
            ctx.db,
            "INSERT INTO clause_fts(clause_id,text) VALUES (:cid,:text)",
            cid=cid,
            text=quote,
        )
    execute(
        ctx.db,
        """UPDATE document_versions SET current_metadata_revision_id=:mid,
        metadata_revision=:revision,published_at=:published,extraction_state=:state,
        index_generation=index_generation+1 WHERE tenant_id=:tenant AND id=:vid""",
        mid=mid,
        revision=revision,
        published=body.published_at.isoformat(),
        state="indexed" if approved else "pending_review",
        tenant=ctx.tenant,
        vid=vid,
    )
    execute(
        ctx.db,
        "UPDATE ingestion_jobs SET state=:state WHERE tenant_id=:tenant AND version_id=:vid",
        state="indexed" if approved else "pending_review",
        tenant=ctx.tenant,
        vid=vid,
    )
    execute(
        ctx.db,
        "UPDATE tenants SET knowledge_revision=knowledge_revision+1 WHERE id=:tenant",
        tenant=ctx.tenant,
    )
    audit(ctx, "document.review", target=v["document_id"])
    return {
        "version_id": vid,
        "metadata_revision": revision,
        "state": "indexed" if approved else "pending_review",
        "clause_id": cid,
    }


def library(ctx, q=""):
    from .security import READ

    return rows(
        ctx.db,
        f"""SELECT d.id,d.title,d.category,COUNT(v.id) version_count,
      MAX(v.ingested_at) latest_ingested_at FROM documents d
      LEFT JOIN document_versions v ON v.document_id=d.id AND v.tenant_id=d.tenant_id
      WHERE {READ} AND lower(d.title) LIKE :q GROUP BY d.id ORDER BY d.title LIMIT 50""",
        **ctx.parameters(),
        q="%" + q.lower() + "%",
    )
