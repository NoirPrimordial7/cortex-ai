import json
import base64
import subprocess
import sys
from pathlib import Path
import secrets
import threading
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from typing import Annotated
from argon2 import PasswordHasher
from argon2.exceptions import VerificationError
from fastapi import Depends, FastAPI, File, Form, HTTPException, Request, Response, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.exc import IntegrityError
from starlette.middleware.trustedhost import TrustedHostMiddleware
from . import db as models
from .db import engine_for
from .documents import Review, ingest, library, review
from .pipeline import Question, answer, saved
from .security import (
    Context,
    audit,
    csrf_for,
    digest,
    document,
    execute,
    now,
    one,
    revisions,
    rows,
    uid,
    version,
)
from .settings import ROOT, Settings
from .demo import accounts as demo_accounts, display_name as demo_display_name

hasher = PasswordHasher()
dummy_hash = hasher.hash(secrets.token_urlsafe(32))
COOKIE = "cortex_session"


class Login(BaseModel):
    model_config = ConfigDict(extra="forbid")
    workspace: str = Field(min_length=1, max_length=80)
    email: str = Field(min_length=3, max_length=200)
    password: str = Field(min_length=1, max_length=200)


class Grant(BaseModel):
    model_config = ConfigDict(extra="forbid")
    user_id: str | None = None
    role_id: str | None = None


class ACLUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    expected_policy_revision: int
    grants: list[Grant] = Field(max_length=100)


class UserUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    active: bool
    role_ids: list[str] = Field(max_length=10)
    expected_policy_revision: int


def create_app(settings=None):
    settings = settings or Settings.from_env()
    app = FastAPI(title="Cortex AI", version="0.1.0", docs_url=None, redoc_url=None)
    app.state.settings = settings
    app.state.engine = engine_for(settings.db_path)
    # A conservative exclusive gate serializes the entire local evidence/transaction path.
    # One worker only. No permission mutation can commit during an evidence-consuming stage.
    app.state.gate = threading.Lock()
    app.state.failures = defaultdict(deque)
    app.state.observe = None
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=list(settings.allowed_hosts))

    @app.middleware("http")
    async def boundary(request, call_next):
        request.state.request_id = uid()
        if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
            if request.headers.get("origin") not in settings.origins:
                return JSONResponse(
                    {"error": {"code": "FORBIDDEN", "message": "Origin not permitted"}},
                    status_code=403,
                )
            if settings.shared_demo_read_only and request.url.path not in {
                "/api/v1/auth/login",
                "/api/v1/auth/logout",
                "/api/v1/queries",
            }:
                return JSONResponse(
                    {
                        "error": {
                            "code": "DEMO_READ_ONLY",
                            "message": "Shared demo: uploads and governance changes are disabled",
                        }
                    },
                    status_code=403,
                    headers={"Cache-Control": "no-store"},
                )
            try:
                length = int(request.headers.get("content-length", "-1"))
            except ValueError:
                length = -1
            limit = (
                11 * 1024 * 1024
                if request.headers.get("content-type", "").startswith("multipart/")
                else 65536
            )
            if length < 0 or length > limit:
                return JSONResponse(
                    {"error": {"code": "BODY_LIMIT", "message": "Bounded Content-Length required"}},
                    status_code=413,
                )
        result = await call_next(request)
        result.headers["Cache-Control"] = "no-store"
        result.headers["X-Content-Type-Options"] = "nosniff"
        result.headers["Referrer-Policy"] = "no-referrer"
        result.headers["Content-Security-Policy"] = (
            "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
        )
        result.headers["X-Request-ID"] = request.state.request_id
        return result

    @app.exception_handler(HTTPException)
    async def errors(request, exc):
        return JSONResponse(
            {
                "error": {
                    "code": str(exc.status_code),
                    "message": exc.detail,
                    "request_id": getattr(request.state, "request_id", ""),
                }
            },
            status_code=exc.status_code,
        )

    @app.exception_handler(RequestValidationError)
    async def validation(request, _):
        return JSONResponse(
            {
                "error": {
                    "code": "VALIDATION",
                    "message": "Invalid or unsupported input fields",
                    "request_id": getattr(request.state, "request_id", ""),
                }
            },
            status_code=422,
        )

    @app.exception_handler(IntegrityError)
    async def constraint_error(request, _):
        return JSONResponse(
            {
                "error": {
                    "code": "CONSTRAINT",
                    "message": "Update violates a data constraint; reload and check the input",
                    "request_id": getattr(request.state, "request_id", ""),
                }
            },
            status_code=409,
        )

    async def bounded_upload_form(request: Request):
        allowed = (
            {"file", "version_label"}
            if request.url.path.endswith("/versions")
            else {"file", "title", "category"}
        )
        form = await request.form(max_files=1, max_fields=4)
        if any(key not in allowed for key in form) or any(
            len(form.getlist(key)) != 1 for key in form
        ):
            raise HTTPException(422, "Invalid or unsupported upload fields")

    def origin(request):
        if request.headers.get("origin") not in settings.origins:
            raise HTTPException(403, "Origin not permitted")

    def context(request: Request):
        with app.state.gate, app.state.engine.begin() as conn:
            raw = request.cookies.get(COOKIE, "")
            session = one(
                conn,
                """SELECT s.*,u.email_normalized,u.display_name,u.active
              FROM sessions s JOIN users u ON u.id=s.user_id AND u.tenant_id=s.tenant_id
              WHERE s.token_digest=:digest AND s.revoked_at IS NULL AND s.expires_at>:at""",
                digest=digest(raw),
                at=now(),
            )
            if (
                not session
                or not session["active"]
                or datetime.fromisoformat(session["last_seen_at"])
                < datetime.now(timezone.utc) - timedelta(minutes=30)
            ):
                raise HTTPException(401, "Sign in required")
            if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
                origin(request)
                supplied = request.headers.get("x-csrf-token", "")
                if not secrets.compare_digest(digest(supplied), session["csrf_digest"]):
                    raise HTTPException(403, "Request verification failed")
            user = one(
                conn,
                "SELECT * FROM users WHERE id=:id AND tenant_id=:tenant",
                id=session["user_id"],
                tenant=session["tenant_id"],
            )
            role = rows(
                conn,
                """SELECT r.id,r.name FROM roles r JOIN user_roles ur ON ur.role_id=r.id
               AND ur.tenant_id=r.tenant_id WHERE ur.user_id=:user AND ur.tenant_id=:tenant""",
                user=user["id"],
                tenant=user["tenant_id"],
            )
            actions = rows(
                conn,
                """SELECT rp.permission_key FROM role_permissions rp
               JOIN user_roles ur ON ur.role_id=rp.role_id AND ur.tenant_id=rp.tenant_id
               WHERE ur.user_id=:user AND ur.tenant_id=:tenant""",
                user=user["id"],
                tenant=user["tenant_id"],
            )
            execute(
                conn,
                "UPDATE sessions SET last_seen_at=:at WHERE id=:id",
                at=now(),
                id=session["id"],
            )
            ctx = Context(
                conn, user, role, {a["permission_key"] for a in actions}, request.state.request_id
            )
            request.state.csrf = csrf_for(raw)
            request.state.session_id = session["id"]
            yield ctx

    Ctx = Annotated[Context, Depends(context)]

    def public_user(ctx):
        return {
            "id": ctx.user["id"],
            "display_name": demo_display_name(ctx.user)
            if settings.demo_accounts_enabled
            else ctx.user["display_name"],
            "workspace": ctx.tenant,
            "roles": ctx.roles,
            "actions": sorted(ctx.actions),
            "read_only_demo": settings.shared_demo_read_only,
        }

    @app.get("/api/v1/health")
    def health():
        return {"status": "ok", "mode": "offline_evidence"}

    @app.get("/api/v1/demo/accounts")
    def demo_profiles():
        with app.state.gate, app.state.engine.begin() as conn:
            return {
                "items": demo_accounts(conn, settings),
                "read_only": settings.shared_demo_read_only,
            }

    @app.post("/api/v1/auth/login")
    def login(body: Login, request: Request, response: Response):
        origin(request)
        keys = [
            ("account", body.workspace.upper(), body.email.strip().lower()),
            ("ip", request.client.host),
        ]
        with app.state.gate, app.state.engine.begin() as conn:
            cutoff = time.monotonic() - 900
            buckets = [app.state.failures[k] for k in keys]
            for attempts, limit in zip(buckets, [5, 20]):
                while attempts and attempts[0] < cutoff:
                    attempts.popleft()
                if len(attempts) >= limit:
                    raise HTTPException(429, "Please wait before trying again")
            user = one(
                conn,
                "SELECT * FROM users WHERE tenant_id=:tenant AND email_normalized=:email",
                tenant=body.workspace.upper(),
                email=body.email.strip().lower(),
            )
            valid = False
            try:
                valid = hasher.verify(user["password_hash"] if user else dummy_hash, body.password)
            except VerificationError:
                pass
            if not user or not user["active"] or not valid:
                for attempts in buckets:
                    attempts.append(time.monotonic())
                raise HTTPException(401, "Invalid sign-in details")
            buckets[0].clear()
            raw = secrets.token_urlsafe(32)
            old = request.cookies.get(COOKIE)
            if old:
                execute(
                    conn,
                    "UPDATE sessions SET revoked_at=:at WHERE token_digest=:digest",
                    at=now(),
                    digest=digest(old),
                )
            conn.execute(
                models.sessions.insert().values(
                    id=uid(),
                    tenant_id=user["tenant_id"],
                    user_id=user["id"],
                    token_digest=digest(raw),
                    csrf_digest=digest(csrf_for(raw)),
                    created_at=now(),
                    last_seen_at=now(),
                    expires_at=(datetime.now(timezone.utc) + timedelta(hours=8)).isoformat(),
                    revoked_at=None,
                )
            )
            response.set_cookie(
                COOKIE,
                raw,
                httponly=True,
                secure=settings.secure_cookie,
                samesite="lax",
                max_age=28800,
                path="/",
            )
            return {"status": "signed_in"}

    @app.get("/api/v1/auth/session")
    def session(request: Request, ctx: Ctx):
        return {"user": public_user(ctx), "csrf_token": request.state.csrf, **revisions(ctx)}

    @app.post("/api/v1/auth/logout", status_code=204)
    def logout(request: Request, response: Response, ctx: Ctx):
        execute(
            ctx.db,
            "UPDATE sessions SET revoked_at=:at WHERE id=:id",
            at=now(),
            id=request.state.session_id,
        )
        response.delete_cookie(COOKIE, path="/")

    @app.get("/api/v1/documents")
    def list_documents(ctx: Ctx, q: str = ""):
        return {"items": library(ctx, q[:200])}

    @app.get("/api/v1/documents/{did}")
    def detail(did: str, ctx: Ctx):
        d = document(ctx, did)
        versions = rows(
            ctx.db,
            """SELECT v.id,v.version_label,v.sha256,v.ingested_at,v.published_at,
            v.extraction_state,v.metadata_revision,m.approval_state,m.valid_from,m.valid_to,m.population,
            m.source_kind,m.topic FROM document_versions v LEFT JOIN metadata_revisions m
            ON m.id=v.current_metadata_revision_id AND m.tenant_id=v.tenant_id
            WHERE v.tenant_id=:tenant AND v.document_id=:did ORDER BY v.ingested_at DESC,v.version_label DESC""",
            tenant=ctx.tenant,
            did=did,
        )
        return {"document": d, "versions": versions}

    @app.post("/api/v1/documents", status_code=202, dependencies=[Depends(bounded_upload_form)])
    def upload(
        ctx: Ctx,
        file: Annotated[UploadFile, File()],
        title: Annotated[str, Form()],
        category: Annotated[str, Form()] = "policy",
    ):
        ctx.require("document.upload")
        payload = file.file.read(10 * 1024 * 1024 + 1)
        return ingest(ctx, settings, payload, file.filename or "", title, category[:80])

    @app.post(
        "/api/v1/documents/{did}/versions",
        status_code=202,
        dependencies=[Depends(bounded_upload_form)],
    )
    def upload_version(
        did: str,
        ctx: Ctx,
        file: Annotated[UploadFile, File()],
        version_label: Annotated[str, Form()],
    ):
        d = document(ctx, did)
        if not version_label.strip() or len(version_label) > 80:
            raise HTTPException(422, "Invalid version label")
        if one(
            ctx.db,
            "SELECT id FROM document_versions WHERE tenant_id=:tenant AND document_id=:did AND version_label=:label",
            tenant=ctx.tenant,
            did=did,
            label=version_label,
        ):
            raise HTTPException(409, "Version label already exists")
        return ingest(
            ctx,
            settings,
            file.file.read(10 * 1024 * 1024 + 1),
            file.filename or "",
            d["title"],
            d["category"],
            document_id=did,
            version_label=version_label,
        )

    @app.get("/api/v1/versions/{vid}/content")
    def content(vid: str, ctx: Ctx):
        v = version(ctx, vid)
        metadata = one(
            ctx.db,
            """SELECT m.approval_state,m.valid_from,m.valid_to,m.population,
          m.source_kind,m.reviewed_at,u.display_name reviewer_name,a.rank authority_rank
          FROM metadata_revisions m JOIN users u ON u.id=m.reviewer_id AND u.tenant_id=m.tenant_id
          LEFT JOIN authority_rules a ON a.tenant_id=m.tenant_id AND a.topic=m.topic
          AND a.jurisdiction=m.jurisdiction AND a.source_kind=m.source_kind AND a.active=1
          WHERE m.tenant_id=:tenant AND m.id=:mid""",
            tenant=ctx.tenant,
            mid=v["current_metadata_revision_id"],
        )
        return {
            "version_id": vid,
            "document_id": v["document_id"],
            "title": v["title"],
            "text": v["extracted_text"],
            "source_hash": v["extracted_sha256"],
            "segments": json.loads(v["segments_json"]),
            "metadata_revision": v["metadata_revision"],
            "review": metadata,
            "original_format": Path(v["object_key"]).suffix.lstrip("."),
            "original_preview_available": bool(
                Path(v["object_key"]).suffix == ".pdf"
                and settings.pdf_renderer
                and Path(settings.pdf_renderer).is_absolute()
                and Path(settings.pdf_renderer).is_file()
            ),
        }

    @app.get("/api/v1/versions/{vid}/pages/{page}")
    def original_page(vid: str, page: int, ctx: Ctx):
        v = version(ctx, vid)  # READ/tenant rechecked before format or renderer metadata.
        private = (settings.data_dir / "uploads").resolve()
        target = (private / v["object_key"]).resolve()
        if (
            target.parent != private
            or target.suffix != ".pdf"
            or not target.is_file()
            or not 1 <= page <= 200
        ):
            raise HTTPException(404, "Resource unavailable")
        renderer = settings.pdf_renderer
        if not renderer or not Path(renderer).is_absolute() or not Path(renderer).is_file():
            raise HTTPException(
                501, "Original PDF preview is unavailable; use extracted text or download"
            )
        try:
            output = subprocess.run(
                [
                    sys.executable,
                    "-I",
                    str(Path(__file__).with_name("pdf_worker.py")),
                    str(target),
                    renderer,
                    str(page),
                ],
                capture_output=True,
                timeout=15,
                check=True,
            )
            result = json.loads(output.stdout)
            if "error" in result:
                raise ValueError("Unavailable")
            image = base64.b64decode(result["image"], validate=True)
            if len(image) > 4 * 1024 * 1024 or not image.startswith(b"\x89PNG\r\n\x1a\n"):
                raise ValueError("Invalid raster")
        except (subprocess.SubprocessError, ValueError, KeyError):
            raise HTTPException(422, "Original PDF page could not be rendered") from None
        return Response(
            image, media_type="image/png", headers={"X-PDF-Page-Count": str(result["page_count"])}
        )

    @app.get("/api/v1/versions/{vid}/download")
    def download(vid: str, ctx: Ctx):
        v = version(ctx, vid)
        private = (settings.data_dir / "uploads").resolve()
        target = (private / v["object_key"]).resolve()
        if target.parent != private or not target.is_file():
            raise HTTPException(404, "Resource unavailable")
        # Load within the gate; FileResponse would lazily read after authorization releases.
        return Response(
            target.read_bytes(),
            media_type="application/octet-stream",
            headers={"Content-Disposition": 'attachment; filename="policy' + target.suffix + '"'},
        )

    @app.get("/api/v1/ingestion-jobs/{jid}")
    def job(jid: str, ctx: Ctx):
        j = one(
            ctx.db,
            "SELECT * FROM ingestion_jobs WHERE id=:id AND tenant_id=:tenant",
            id=jid,
            tenant=ctx.tenant,
        )
        if not j:
            raise HTTPException(404, "Resource unavailable")
        version(ctx, j["version_id"])
        return {k: j[k] for k in ["id", "version_id", "state", "safe_error_code"]}

    @app.post("/api/v1/versions/{vid}/review")
    def review_version(vid: str, body: Review, ctx: Ctx):
        return review(ctx, vid, body)

    @app.post("/api/v1/queries")
    def query(body: Question, ctx: Ctx):
        return answer(ctx, body, app.state.observe)

    @app.get("/api/v1/queries/{qid}")
    def query_detail(qid: str, ctx: Ctx):
        return saved(ctx, qid)

    @app.get("/api/v1/queries/{qid}/citations/{cid}")
    def citation(qid: str, cid: str, ctx: Ctx, view: str = "full"):
        q = saved(ctx, qid)
        c = next((c for c in q["citations"] if c["id"] == cid), None)
        if not c:
            raise HTTPException(404, "Resource unavailable")
        v = version(ctx, c["version_id"])
        if v["extracted_text"][c["start_char"] : c["end_char"]] != c["quote"]:
            raise HTTPException(409, "Evidence changed; ask again")
        text = v["extracted_text"]
        if view == "passage":
            # Exact unchanged source slice; all offsets/hash still refer to the full canonical text.
            start, end = c["start_char"], c["end_char"]
            start = text.rfind("\n", 0, start) + 1
            line_end = text.find("\n", end)
            end = len(text) if line_end < 0 else line_end
            left, right = start, end
            for _ in range(3):
                if left == 0:
                    break
                prior = text.rfind("\n", 0, left - 1) + 1
                if start - prior > 700:
                    break
                left = prior
            for _ in range(3):
                if right == len(text):
                    break
                following = text.find("\n", right + 1)
                following = len(text) if following < 0 else following
                if following - end > 700:
                    break
                right = following
            return {
                **c,
                "text": text[left:right],
                "text_start_char": left,
                "text_total_chars": len(text),
                "query_id": qid,
            }
        if view != "full":
            raise HTTPException(422, "Unsupported source view")
        return {**c, "text": text, "query_id": qid}

    def history(ctx):
        result = []
        qs = rows(
            ctx.db,
            "SELECT id,created_at FROM queries WHERE tenant_id=:tenant AND user_id=:user ORDER BY created_at DESC LIMIT 30",
            **ctx.parameters(),
        )
        for q in qs:
            try:
                item = saved(ctx, q["id"])
                result.append({**item, "created_at": q["created_at"]})
            except HTTPException:
                continue
        return result

    @app.get("/api/v1/queries")
    def queries(ctx: Ctx):
        return {"items": history(ctx)}

    @app.get("/api/v1/conflicts")
    def conflict_list(ctx: Ctx):
        return {"items": [q for q in history(ctx) if q["reason_code"] == "UNRESOLVED_CONFLICT"]}

    @app.get("/api/v1/dashboard")
    def dashboard(ctx: Ctx):
        items = library(ctx)
        recent = history(ctx)[:5]
        return {
            "readable_documents": len(items),
            "recent": recent,
            "unresolved_queries": sum(
                q["reason_code"] == "UNRESOLVED_CONFLICT" for q in history(ctx)
            ),
            "documents": items[:5],
        }

    @app.get("/api/v1/admin/users")
    def users(ctx: Ctx):
        ctx.require("user.manage")
        people = rows(
            ctx.db,
            "SELECT id,tenant_id,display_name,email_normalized,active FROM users WHERE tenant_id=:tenant ORDER BY display_name",
            tenant=ctx.tenant,
        )
        for u in people:
            if settings.demo_accounts_enabled:
                u["display_name"] = demo_display_name(u)
            u.pop("tenant_id")
            u["role_ids"] = [
                r["role_id"]
                for r in rows(
                    ctx.db,
                    "SELECT role_id FROM user_roles WHERE user_id=:id AND tenant_id=:tenant",
                    id=u["id"],
                    tenant=ctx.tenant,
                )
            ]
        return {
            "items": people,
            "roles": rows(
                ctx.db, "SELECT id,name FROM roles WHERE tenant_id=:tenant", tenant=ctx.tenant
            ),
            **revisions(ctx),
        }

    @app.patch("/api/v1/admin/users/{user_id}")
    def update_user(user_id: str, body: UserUpdate, ctx: Ctx):
        ctx.require("user.manage")
        target = one(
            ctx.db,
            "SELECT id FROM users WHERE id=:id AND tenant_id=:tenant",
            id=user_id,
            tenant=ctx.tenant,
        )
        if not target:
            raise HTTPException(404, "Resource unavailable")
        if user_id == ctx.user["id"]:
            raise HTTPException(409, "Self-modification is unavailable in this local admin flow")
        if body.expected_policy_revision != revisions(ctx)["policy_revision"]:
            raise HTTPException(409, "Permissions changed; reload")
        known = {
            r["id"]
            for r in rows(ctx.db, "SELECT id FROM roles WHERE tenant_id=:tenant", tenant=ctx.tenant)
        }
        if any(r not in known for r in body.role_ids):
            raise HTTPException(422, "Invalid role")
        execute(
            ctx.db,
            "UPDATE users SET active=:active WHERE id=:id AND tenant_id=:tenant",
            active=body.active,
            id=user_id,
            tenant=ctx.tenant,
        )
        execute(
            ctx.db,
            "DELETE FROM user_roles WHERE user_id=:id AND tenant_id=:tenant",
            id=user_id,
            tenant=ctx.tenant,
        )
        for rid in set(body.role_ids):
            ctx.db.execute(
                models.user_roles.insert().values(
                    id=uid(), tenant_id=ctx.tenant, user_id=user_id, role_id=rid
                )
            )
        execute(
            ctx.db,
            "UPDATE tenants SET policy_revision=policy_revision+1 WHERE id=:tenant",
            tenant=ctx.tenant,
        )
        audit(ctx, "user.update")
        return {"status": "updated", **revisions(ctx)}

    @app.get("/api/v1/admin/documents/{did}/acl")
    def acl(did: str, ctx: Ctx):
        ctx.require("acl.manage")
        document(ctx, did)
        return {
            "grants": rows(
                ctx.db,
                "SELECT user_id,role_id FROM document_acl WHERE tenant_id=:tenant AND document_id=:did",
                tenant=ctx.tenant,
                did=did,
            ),
            **revisions(ctx),
        }

    @app.put("/api/v1/admin/documents/{did}/acl")
    def replace_acl(did: str, body: ACLUpdate, ctx: Ctx):
        ctx.require("acl.manage")
        document(ctx, did)
        if body.expected_policy_revision != revisions(ctx)["policy_revision"]:
            raise HTTPException(409, "Permissions changed; reload")
        own_roles = {r["id"] for r in ctx.roles}
        if not any(g.user_id == ctx.user["id"] or g.role_id in own_roles for g in body.grants):
            raise HTTPException(409, "Retain your explicit governance access")
        for g in body.grants:
            if (g.user_id is None) == (g.role_id is None):
                raise HTTPException(422, "Each grant needs exactly one subject")
            table, ident = ("users", g.user_id) if g.user_id else ("roles", g.role_id)
            if not one(
                ctx.db,
                f"SELECT id FROM {table} WHERE id=:id AND tenant_id=:tenant",
                id=ident,
                tenant=ctx.tenant,
            ):
                raise HTTPException(422, "Invalid grant subject")
        execute(
            ctx.db,
            "DELETE FROM document_acl WHERE tenant_id=:tenant AND document_id=:did",
            tenant=ctx.tenant,
            did=did,
        )
        for g in body.grants:
            ctx.db.execute(
                models.document_acl.insert().values(
                    id=uid(), tenant_id=ctx.tenant, document_id=did, action="READ", **g.model_dump()
                )
            )
        execute(
            ctx.db,
            "UPDATE documents SET acl_revision=acl_revision+1 WHERE tenant_id=:tenant AND id=:did",
            tenant=ctx.tenant,
            did=did,
        )
        execute(
            ctx.db,
            "UPDATE tenants SET policy_revision=policy_revision+1 WHERE id=:tenant",
            tenant=ctx.tenant,
        )
        audit(ctx, "acl.replace", target=did)
        return {"status": "updated", **revisions(ctx)}

    @app.get("/api/v1/audit-events")
    def events(ctx: Ctx):
        ctx.require("audit.read")
        return {
            "items": rows(
                ctx.db,
                "SELECT created_at,action,outcome,request_id FROM audit_events WHERE tenant_id=:tenant ORDER BY created_at DESC LIMIT 100",
                tenant=ctx.tenant,
            )
        }

    build = ROOT / "frontend" / "dist"

    @app.get("/{path:path}")
    def frontend(path: str):
        if path.startswith("api/"):
            raise HTTPException(404, "Resource unavailable")
        target = (build / path).resolve()
        if target.is_relative_to(build.resolve()) and target.is_file():
            return FileResponse(target)
        if (build / "index.html").is_file():
            return FileResponse(build / "index.html")
        raise HTTPException(404, "Build the frontend before opening the application")

    return app


app = create_app()
