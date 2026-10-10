"""Opt-in synthetic enterprise corpus. Uses normal ingestion/review and explicit READ.

Existing sources remain immutable. Non-entitlement references stay pending review;
prose approvals never promote a document into answer evidence.
"""

import hashlib
import json
from . import db as models
from .documents import Review, ingest, review
from .security import Context, execute, one, uid
from .settings import ROOT


def add_enterprise(engine, settings):
    root = ROOT / "docs/demo-enterprise"
    manifest = json.loads((root / "manifest.json").read_text())
    with engine.begin() as conn:
        if one(conn, "SELECT id FROM documents WHERE id LIKE 'ENT-%'"):
            raise RuntimeError("Enterprise corpus already present; refuses to overwrite")
        user = one(conn, "SELECT * FROM users WHERE id='ravi' AND tenant_id='NORTHSTAR'")
        if not user:
            raise RuntimeError("Seed the fictional base first")
        ctx = Context(conn, user, [], {"document.upload", "document.review"}, uid())
        seen = set()
        for d in manifest:
            raw = (root / d["file"]).read_bytes()
            if hashlib.sha256(raw).hexdigest() != d["sha256"]:
                raise RuntimeError("Synthetic original hash mismatch")
            result = ingest(
                ctx,
                settings,
                raw,
                d["file"],
                d["title"],
                d["category"],
                ids=d,
                document_id=d["document_id"] if d["document_id"] in seen else None,
                version_label=d["version_id"].removeprefix("ENT-"),
            )
            seen.add(d["document_id"])
            if result["state"] != "pending_review":
                raise RuntimeError("Synthetic extraction failed")
            if d["value"] is not None:
                v = one(
                    conn,
                    "SELECT extracted_text FROM document_versions WHERE id=:id",
                    id=d["version_id"],
                )
                text = v["extracted_text"]
                phrase = f"2.1 India full-time employees {'receive ' + str(d['value']) + ' working days of annual leave per year.' if d['topic'] == 'leave' else 'may work remotely ' + str(d['value']) + ' days per week.'}"
                start = text.index(phrase)
                review(
                    ctx,
                    d["version_id"],
                    Review(
                        expected_metadata_revision=0,
                        approval_state="approved",
                        valid_from=d["valid_from"],
                        valid_to=d["valid_to"],
                        open_ended=d["valid_to"] is None,
                        population="india_full_time",
                        jurisdiction="IN",
                        topic=d["topic"],
                        source_kind="hr_policy" if d["topic"] == "leave" else "operations_policy",
                        published_at="2024-12-15" if d["value"] == 18 else "2025-12-15",
                        start_char=start,
                        end_char=start + len(phrase),
                        claim={
                            "subject": "india_full_time",
                            "predicate": "annual_leave_days"
                            if d["topic"] == "leave"
                            else "remote_days_per_week",
                            "value": d["value"],
                            "unit": "working_days_per_year"
                            if d["topic"] == "leave"
                            else "days_per_week",
                        },
                        access_scope="uniform",
                        reason="Synthetic exact clause checked against complete original",
                    ),
                    clause_id=d["version_id"] + "-C1",
                )
            execute(
                conn,
                "DELETE FROM document_acl WHERE tenant_id='NORTHSTAR' AND document_id=:did",
                did=d["document_id"],
            )
            grants = (
                [{"user_id": "ravi"}, {"role_id": "auditor"}]
                if d["restricted"]
                else [{"user_id": "ravi"}, {"role_id": "employee"}]
            )
            for grant in grants:
                conn.execute(
                    models.document_acl.insert().values(
                        id=uid(),
                        tenant_id="NORTHSTAR",
                        document_id=d["document_id"],
                        action="READ",
                        **grant,
                    )
                )
        execute(
            conn,
            "UPDATE tenants SET policy_revision=policy_revision+1,knowledge_revision=knowledge_revision+1 WHERE id='NORTHSTAR'",
        )
