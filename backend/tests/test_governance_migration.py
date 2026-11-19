"""Upgrade real pre-governance schema without privilege promotion or identity churn."""

from alembic import command
import hashlib
from alembic.config import Config
from app import db as models
from app.cli import migrate
from app.db import engine_for
from app.security import one, rows
from app.settings import ROOT, Settings
from app import integrity


def test_legacy_role_migration_preserves_identity_access_and_ledger(tmp_path):
    settings = Settings(tmp_path)
    payload = b"Historical source text.\n"
    uploads = tmp_path / "uploads"
    uploads.mkdir()
    (uploads / "legacy.txt").write_bytes(payload)
    engine = engine_for(tmp_path / "upgrade.sqlite3")
    cfg = Config(str(ROOT / "backend" / "alembic.ini"))
    cfg.set_main_option("script_location", str(ROOT / "backend" / "migrations"))
    with engine.begin() as db:
        cfg.attributes["connection"] = db
        command.upgrade(cfg, "0004")
        db.execute(
            models.tenants.insert().values(
                id="NORTHSTAR", name="Existing tenant", policy_timezone="UTC"
            )
        )
        for ident, name in [
            ("employee", "employee"),
            ("manager", "manager"),
            ("knowledge_manager", "knowledge_manager"),
            ("admin", "admin"),
            ("auditor", "auditor"),
        ]:
            db.execute(models.roles.insert().values(id=ident, tenant_id="NORTHSTAR", name=name))
        for ident, email, roles in [
            ("maya", "maya@example.test", ["employee"]),
            ("ravi", "ravi@example.test", ["admin", "employee", "knowledge_manager"]),
            ("old-manager", "unchanged@example.test", ["manager"]),
            ("old-reviewer", "reviewer@example.test", ["knowledge_manager"]),
        ]:
            db.execute(
                models.users.insert().values(
                    id=ident,
                    tenant_id="NORTHSTAR",
                    email_normalized=email,
                    display_name=ident,
                    password_hash="preserved password hash",
                    active=True,
                    created_at="2026-01-01",
                )
            )
            for role in roles:
                db.execute(
                    models.user_roles.insert().values(
                        id=ident + "-" + role, tenant_id="NORTHSTAR", user_id=ident, role_id=role
                    )
                )
        for ident, role in [
            ("legacy-private", "knowledge_manager"),
            ("legacy-employee", "employee"),
        ]:
            db.execute(
                models.documents.insert().values(
                    id=ident,
                    tenant_id="NORTHSTAR",
                    title=ident,
                    owner_user_id="ravi",
                    category="HR",
                )
            )
            db.execute(
                models.document_acl.insert().values(
                    id=ident + "-acl", tenant_id="NORTHSTAR", document_id=ident, role_id=role
                )
            )
        db.execute(
            models.leave_types.insert().values(
                id="annual",
                tenant_id="NORTHSTAR",
                code="annual",
                name="Annual",
                annual_entitlement_days=20,
                active=True,
            )
        )
        db.execute(
            models.leave_ledger_entries.insert().values(
                id="old-credit",
                tenant_id="NORTHSTAR",
                user_id="maya",
                leave_type_id="annual",
                entry_type="grant",
                days=20,
                effective_date="2026-01-01",
                created_by="ravi",
                created_at="2026-01-01",
            )
        )
        db.execute(
            models.document_versions.insert().values(
                id="historical-version",
                tenant_id="NORTHSTAR",
                document_id="legacy-private",
                version_label="historical-v1",
                object_key="legacy.txt",
                sha256=hashlib.sha256(payload).hexdigest(),
                extracted_text=payload.decode(),
                extracted_sha256=hashlib.sha256(payload).hexdigest(),
                segments_json="[]",
                ingested_at="2026-01-01",
                extraction_state="indexed",
                parser_version="historical",
            )
        )
        db.execute(
            models.metadata_revisions.insert().values(
                id="historical-review",
                tenant_id="NORTHSTAR",
                version_id="historical-version",
                revision_no=1,
                approval_state="approved",
                valid_from="2026-01-01",
                open_ended=True,
                population="india_full_time",
                jurisdiction="IN",
                topic="leave",
                source_kind="hr_policy",
                reviewer_id="old-reviewer",
                reviewed_at="2026-01-01",
                reason="Original historical reviewer reason",
            )
        )
        db.execute(
            models.document_versions.update()
            .where(models.document_versions.c.id == "historical-version")
            .values(current_metadata_revision_id="historical-review", metadata_revision=1)
        )
    migrate(engine)
    migrate(engine)
    with engine.begin() as db:
        integrity.backfill(db, settings)
        integrity.backfill(db, settings)
        v = one(db, "SELECT * FROM document_versions WHERE id='historical-version'")
        status, record = integrity.inspect_record(db, settings, v)
        assert status == "Verified" and record["uploaded_by"] is None
        assert record["origin"] == "verified_legacy_backfill"
        assert (
            one(db, "SELECT COUNT(*) n FROM audit_events WHERE action='policy.integrity.backfill'")[
                "n"
            ]
            == 1
        )
        w = one(db, "SELECT * FROM policy_workflows WHERE version_id='historical-version'")
        assert w["reviewer_id"] == "old-reviewer" and w["status"] == "approved" and w["heading_id"]
        assert (
            one(db, "SELECT reason FROM metadata_revisions WHERE id='historical-review'")["reason"]
            == "Original historical reviewer reason"
        )
    with engine.connect() as db:
        assert {r["name"] for r in rows(db, "SELECT name FROM roles")} == {
            "employee",
            "auditor",
            "admin",
        }
        memberships = {
            r["user_id"]: r["name"]
            for r in rows(
                db, "SELECT ur.user_id,r.name FROM user_roles ur JOIN roles r ON r.id=ur.role_id"
            )
        }
        assert memberships == {
            "maya": "employee",
            "ravi": "admin",
            "old-manager": "employee",
            "old-reviewer": "employee",
        }
        assert (
            one(db, "SELECT email_normalized FROM users WHERE id='maya'")["email_normalized"]
            == "arya@example.test"
        )
        assert (
            one(db, "SELECT email_normalized FROM users WHERE id='old-manager'")["email_normalized"]
            == "unchanged@example.test"
        )
        assert (
            one(db, "SELECT password_hash FROM users WHERE id='ravi'")["password_hash"]
            == "preserved password hash"
        )
        assert one(db, "SELECT COUNT(*) n FROM users")["n"] == 4
        assert one(db, "SELECT days FROM leave_ledger_entries WHERE id='old-credit'")["days"] == 20
        private_readers = {
            r["user_id"]
            for r in rows(db, "SELECT user_id FROM document_acl WHERE document_id='legacy-private'")
        }
        assert private_readers == {"ravi", "old-reviewer"}
        assert one(
            db, "SELECT id FROM document_acl WHERE document_id='legacy-employee' AND user_id='ravi'"
        )
        assert (
            one(
                db,
                "SELECT id FROM document_acl WHERE document_id='legacy-private' AND role_id='employee'",
            )
            is None
        )
        assert rows(db, "PRAGMA foreign_key_check") == []
    engine.dispose()
