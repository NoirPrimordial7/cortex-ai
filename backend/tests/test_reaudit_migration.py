"""Existing manual records stay historical
missing Auditor grants are repaired."""

import hashlib
from alembic import command
from alembic.config import Config
from app.cli import migrate, seed
from app.db import engine_for
from app.main import create_app
from app.settings import Settings, ROOT
from app.security import execute, one, rows
from conftest import client_for, ask


def test_upgrade_keeps_manual_history_and_attachments_without_fabricating_a_conflict(tmp_path):
    settings = Settings(tmp_path)
    engine = engine_for(settings.db_path)
    cfg = Config(str(ROOT / "backend" / "alembic.ini"))
    cfg.set_main_option("script_location", str(ROOT / "backend" / "migrations"))
    with engine.begin() as db:
        cfg.attributes["connection"] = db
        command.upgrade(cfg, "0008")
    credentials = seed(engine, settings)
    evidence = b"Historical attachment"
    with engine.begin() as db:
        execute(
            db,
            "INSERT INTO policy_tickets(id,tenant_id,user_id,description,status,created_at,updated_at,revision) VALUES('legacy-case','NORTHSTAR','maya','Historical manual request','pending','2026-11-19','2026-11-19',0)",
        )
        for did in ("OPS-REMOTE-A", "OPS-REMOTE-B"):
            execute(
                db,
                "INSERT INTO ticket_policies(id,tenant_id,ticket_id,document_id) VALUES(:id,'NORTHSTAR','legacy-case',:d)",
                id="legacy-" + did,
                d=did,
            )
            execute(
                db,
                "DELETE FROM document_acl WHERE tenant_id='NORTHSTAR' AND document_id=:d AND role_id='auditor'",
                d=did,
            )
        execute(
            db,
            "INSERT INTO ticket_decisions(id,tenant_id,ticket_id,actor_id,operation,reason,created_at) VALUES('legacy-decision','NORTHSTAR','legacy-case','maya','submitted','Original explanation retained','2026-11-19')",
        )
        execute(
            db,
            "INSERT INTO ticket_attachments(id,tenant_id,ticket_id,uploaded_by,filename,content,sha256,created_at) VALUES('legacy-file','NORTHSTAR','legacy-case','maya','old.txt',:content,:hash,'2026-11-19')",
            content=evidence,
            hash=hashlib.sha256(evidence).hexdigest(),
        )
    migrate(engine)
    migrate(engine)
    app = create_app(settings)
    try:
        auditor = client_for((app, credentials), "isha")
        d = auditor.get("/api/v1/policy-tickets/legacy-case").json()
        assert len(d["policies"]) == 2 and all(p["available"] for p in d["policies"])
        assert d["conflict_context"] is None and d["conflict_sources"] == []
        assert d["history"][0]["reason"] == "Original explanation retained"
        assert (
            auditor.get("/api/v1/policy-tickets/legacy-case/attachments/legacy-file").content
            == evidence
        )
        assert (
            auditor.post(
                "/api/v1/policy-tickets/legacy-case/resolve",
                json={
                    "expected_revision": 0,
                    "clause_id": "RW-A-C1",
                    "reason": "Cannot invent a historical query conflict.",
                },
            ).status_code
            == 409
        )
        assert (
            ask(client_for((app, credentials)), "How many remote days per week?")["reason_code"]
            == "UNRESOLVED_CONFLICT"
        )
        with engine.connect() as db:
            assert one(db, "SELECT COUNT(*) n FROM ticket_conflict_contexts")["n"] == 0
            assert rows(db, "PRAGMA foreign_key_check") == []
    finally:
        app.state.engine.dispose()
        engine.dispose()
