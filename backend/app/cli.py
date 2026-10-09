"""Non-destructive local initialization and fictional seed; credentials stay outside Git."""

import argparse
import hashlib
import json
import secrets
from alembic import command
from alembic.config import Config
from argon2 import PasswordHasher
from . import db as models
from .documents import Review, ingest, review
from .security import Context, execute, now, one, uid
from .settings import ROOT, Settings
from .demo import TEAM_NAMES

ACTIONS = {
    "employee": ["query.execute"],
    "knowledge_manager": ["query.execute", "document.upload", "document.review"],
    "admin": ["user.manage", "acl.manage", "authority.manage"],
    "auditor": ["audit.read"],
}


def migrate(engine):
    cfg = Config(str(ROOT / "backend" / "alembic.ini"))
    cfg.set_main_option("script_location", str(ROOT / "backend" / "migrations"))
    with engine.begin() as conn:
        cfg.attributes["connection"] = conn
        command.upgrade(cfg, "head")


def seed(engine, settings):
    fixture_root = ROOT / "docs" / "planning" / "demo"
    fixture = json.loads((fixture_root / "fixture-spec.json").read_text(encoding="utf-8"))
    credentials = {}
    with engine.begin() as conn:
        if one(conn, "SELECT id FROM tenants LIMIT 1"):
            raise RuntimeError("Database is not empty; seed refuses to overwrite existing work")
        for tid in ["NORTHSTAR", "ORBIT"]:
            conn.execute(
                models.tenants.insert().values(
                    id=tid,
                    name="Northstar Works" if tid == "NORTHSTAR" else "Orbit",
                    policy_timezone="Asia/Kolkata",
                )
            )
        hasher = PasswordHasher()
        for key, tid, role_names, active in [
            ("maya", "NORTHSTAR", ["employee"], True),
            ("ravi", "NORTHSTAR", ["employee", "knowledge_manager", "admin"], True),
            ("isha", "NORTHSTAR", ["auditor"], True),
            ("noor", "NORTHSTAR", ["employee"], False),
            ("orbit", "ORBIT", ["employee"], True),
        ]:
            password = secrets.token_urlsafe(18)
            userid = key if tid == "NORTHSTAR" else "orbit-user"
            conn.execute(
                models.users.insert().values(
                    id=userid,
                    tenant_id=tid,
                    email_normalized=f"{key}@example.test",
                    display_name=TEAM_NAMES[key],
                    password_hash=hasher.hash(password),
                    active=active,
                    created_at=now(),
                )
            )
            credentials[key] = {
                "workspace": tid,
                "email": f"{key}@example.test",
                "password": password,
            }
        for action in {a for values in ACTIONS.values() for a in values}:
            conn.execute(models.permissions.insert().values(action_key=action))
        for tid in ["NORTHSTAR", "ORBIT"]:
            for name, actions in ACTIONS.items():
                rid = name if tid == "NORTHSTAR" else "orbit-" + name
                conn.execute(models.roles.insert().values(id=rid, tenant_id=tid, name=name))
                for action in actions:
                    conn.execute(
                        models.role_permissions.insert().values(
                            id=uid(), tenant_id=tid, role_id=rid, permission_key=action
                        )
                    )
        for who, names in [
            ("maya", ["employee"]),
            ("ravi", ["employee", "knowledge_manager", "admin"]),
            ("isha", ["auditor"]),
            ("noor", ["employee"]),
        ]:
            for name in names:
                conn.execute(
                    models.user_roles.insert().values(
                        id=uid(), tenant_id="NORTHSTAR", user_id=who, role_id=name
                    )
                )
        conn.execute(
            models.user_roles.insert().values(
                id=uid(), tenant_id="ORBIT", user_id="orbit-user", role_id="orbit-employee"
            )
        )
        reviewer = one(conn, "SELECT * FROM users WHERE id='ravi'")
        ctx = Context(
            conn, reviewer, [], set(a for values in ACTIONS.values() for a in values), uid()
        )
        for r in fixture["authority_rules"]:
            conn.execute(
                models.authority_rules.insert().values(
                    id=uid(),
                    tenant_id="NORTHSTAR",
                    topic=r["topic"],
                    jurisdiction=r["jurisdiction"],
                    source_kind=r["source_kind"],
                    rank=r["rank"],
                    reviewed_by="ravi",
                    active=True,
                )
            )
        # Executive example has no public entitlement intent beyond its own approved source.
        if not one(conn, "SELECT id FROM authority_rules WHERE topic='bonus'"):
            conn.execute(
                models.authority_rules.insert().values(
                    id=uid(),
                    tenant_id="NORTHSTAR",
                    topic="bonus",
                    jurisdiction="IN",
                    source_kind="hr_policy",
                    rank=100,
                    reviewed_by="ravi",
                    active=True,
                )
            )
        seen = set()
        for d in fixture["documents"]:
            payload = (fixture_root / d["file"]).read_bytes()
            if hashlib.sha256(payload).hexdigest() != d["sha256"]:
                raise RuntimeError("Fictional fixture hash mismatch")
            ingest(
                ctx,
                settings,
                payload,
                d["file"],
                d["title"],
                ids=d,
                document_id=d["document_id"] if d["document_id"] in seen else None,
                version_label=d["version_id"],
                ingested_at=d["ingested_at"],
            )
            seen.add(d["document_id"])
            body = Review(
                expected_metadata_revision=0,
                approval_state=d["approval_state"],
                valid_from=d["valid_from"],
                valid_to=d["valid_to"],
                open_ended=d["open_ended"],
                population=d["population"],
                jurisdiction=d["jurisdiction"],
                topic=d["topic"],
                source_kind=d["source_kind"],
                published_at=d["published_at"][:10],
                start_char=d["start_char"],
                end_char=d["end_char"],
                claim=d["claim"],
                access_scope="uniform",
                reason="Fictional reviewed fixture",
            )
            review(ctx, d["version_id"], body, clause_id=d["clause_id"])
            execute(
                conn,
                "DELETE FROM document_acl WHERE tenant_id=:tenant AND document_id=:did",
                tenant="NORTHSTAR",
                did=d["document_id"],
            )
            for g in d["read_grants"]:
                conn.execute(
                    models.document_acl.insert().values(
                        id=uid(),
                        tenant_id="NORTHSTAR",
                        document_id=d["document_id"],
                        action="READ",
                        **g,
                    )
                )
        for edge in fixture["supersession"]:
            # Fixture intervals are already reviewed and closed at these exact boundaries.
            conn.execute(
                models.supersession_edges.insert().values(
                    id=uid(),
                    tenant_id="NORTHSTAR",
                    predecessor_clause_id=edge["from"],
                    successor_clause_id=edge["to"],
                    effective_from=edge["effective_from"],
                    scope_key="india_full_time:IN:leave",
                    reviewed_by="ravi",
                )
            )
        execute(conn, "UPDATE tenants SET policy_revision=policy_revision+1 WHERE id='NORTHSTAR'")
    return credentials


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["migrate", "seed-demo"])
    args = parser.parse_args()
    settings = Settings.from_env()
    engine = models.engine_for(settings.db_path)
    migrate(engine)
    if args.command == "seed-demo":
        credentials = seed(engine, settings)
        target = settings.data_dir / "credentials.json"
        target.write_text(json.dumps(credentials, indent=2), encoding="utf-8")
        print(
            "Fictional demo seeded. Runtime credentials are in the ignored local-data/credentials.json file."
        )
    else:
        print("Migrations applied.")


if __name__ == "__main__":
    main()
