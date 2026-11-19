import json
import secrets
import threading
import time
from collections import defaultdict, deque
from datetime import date, datetime, timedelta, timezone
from typing import Annotated
from argon2 import PasswordHasher
from argon2.exceptions import VerificationError
from fastapi import (
    Depends,
    FastAPI,
    File,
    Form,
    HTTPException,
    Query,
    Request,
    Response,
    UploadFile,
)
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, ConfigDict, Field, field_validator
from sqlalchemy.exc import IntegrityError
from starlette.middleware.trustedhost import TrustedHostMiddleware
from . import db as models
from . import leave, policy_workflow, leave_applications, tickets, integrity
from .rbac import ACTIONS
from .db import engine_for
from .documents import Review, ingest, library, review
from .embeddings import load_encoder
from .pipeline import Question, answer, saved, suggestions
from .security import (
    Context,
    EMPLOYEE_VERSION,
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
    role_ids: list[str] = Field(min_length=1, max_length=1)
    expected_policy_revision: int


class UserCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    display_name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=3, max_length=200, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(min_length=12, max_length=200)
    role_id: str = Field(min_length=1, max_length=100)

    @field_validator("display_name")
    @classmethod
    def meaningful_name(cls, value):
        value = value.strip()
        if len(value) < 2:
            raise ValueError("Provide a name of at least two characters")
        return value


class LeaveTypeCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    code: str = Field(pattern=r"^[a-z][a-z0-9_]{1,29}$")
    name: str = Field(min_length=2, max_length=100)
    annual_entitlement_days: int = Field(strict=True, ge=0, le=366)


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
    app.state.encoder = load_encoder(settings)
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
            "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
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
            {"file"}
            if request.url.path.endswith("/attachments")
            else {"file", "version_label"}
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
            active_actions = {a for r in role for a in ACTIONS.get(r["name"], [])}
            ctx = Context(
                conn,
                user,
                role,
                {a["permission_key"] for a in actions} & active_actions,
                request.state.request_id,
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
        return {
            "status": "ok",
            "mode": "offline_evidence",
            "semantic_search": app.state.encoder is not None,
        }

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
            f"""SELECT v.id,v.version_label,v.sha256,v.ingested_at,v.published_at,
            v.extraction_state,v.metadata_revision,m.approval_state,m.valid_from,m.valid_to,m.population,
            m.source_kind,m.topic,w.status AS workflow_status,w.revision AS workflow_revision,
            h.name AS heading_name,h.id AS heading_id,w.review_comment
            FROM document_versions v LEFT JOIN metadata_revisions m
            ON m.id=v.current_metadata_revision_id AND m.tenant_id=v.tenant_id
            LEFT JOIN policy_workflows w ON w.tenant_id=v.tenant_id AND w.version_id=v.id
            LEFT JOIN policy_headings h ON h.tenant_id=w.tenant_id AND h.id=w.heading_id
            WHERE v.tenant_id=:tenant AND v.document_id=:did AND {EMPLOYEE_VERSION}
            ORDER BY v.ingested_at DESC,v.version_label DESC""",
            **ctx.parameters(),
            did=did,
        )
        audit(ctx, "document.detail.read", target=did)
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
        ctx.require("document.upload")
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
        return {
            "version_id": vid,
            "document_id": v["document_id"],
            "title": v["title"],
            "text": v["extracted_text"],
            "source_hash": v["extracted_sha256"],
            "segments": json.loads(v["segments_json"]),
            "metadata_revision": v["metadata_revision"],
        }

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
        ctx.require("document.review")
        result = integrity.verify(ctx, settings, vid)
        if result["status"] != "Verified":
            # Keep the verification/audit observation while withholding publication.
            # Raising here would roll that observation back with the request transaction.
            return JSONResponse(
                {
                    "error": {
                        "code": "409",
                        "message": "Verify the original document before review",
                        "request_id": ctx.request_id,
                    }
                },
                status_code=409,
            )
        return review(ctx, vid, body, encoder=app.state.encoder)

    @app.post("/api/v1/queries")
    def query(body: Question, ctx: Ctx):
        return answer(ctx, body, app.state.observe, encoder=app.state.encoder)

    @app.get("/api/v1/queries/suggestions")
    def query_suggestions(
        ctx: Ctx,
        q: Annotated[str, Query(max_length=160)] = "",
        as_of: date | None = None,
        population: Annotated[
            str, Query(pattern="^(india_full_time|india_contractor)$")
        ] = "india_full_time",
    ):
        question = Question(query="suggestions", as_of=as_of, population=population)
        return {"items": suggestions(ctx, q, question)}

    @app.get("/api/v1/queries/{qid}")
    def query_detail(qid: str, ctx: Ctx):
        return saved(ctx, qid)

    @app.get("/api/v1/queries/{qid}/citations/{cid}")
    def citation(qid: str, cid: str, ctx: Ctx):
        q = saved(ctx, qid)
        c = next((c for c in q["citations"] if c["id"] == cid), None)
        if not c:
            raise HTTPException(404, "Resource unavailable")
        v = version(ctx, c["version_id"])
        if v["extracted_text"][c["start_char"] : c["end_char"]] != c["quote"]:
            raise HTTPException(409, "Evidence changed; ask again")
        return {**c, "text": v["extracted_text"], "query_id": qid}

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

    @app.get("/api/v1/leave/balance")
    def own_leave(ctx: Ctx, as_of: date | None = None):
        return leave.own_balance(ctx, as_of)

    @app.get("/api/v1/leave/employees/{user_id}/balance")
    def employee_leave(user_id: str, ctx: Ctx, as_of: date | None = None):
        return leave.employee_balance(ctx, user_id, as_of)

    @app.get("/api/v1/leave/team")
    def leave_team(ctx: Ctx):
        return leave.team(ctx)

    @app.post("/api/v1/leave/ledger-entries", status_code=201)
    def create_leave_entry(body: leave.LedgerEntry, ctx: Ctx):
        return leave.append_entry(ctx, body)

    @app.get("/api/v1/leave/ledger")
    def leave_ledger(ctx: Ctx, user_id: str | None = None):
        target = user_id or ctx.user["id"]
        if target == ctx.user["id"]:
            ctx.require("leave.apply")
        else:
            ctx.require("leave.read_all")
        leave.employee(ctx, target)
        audit(ctx, "leave.ledger.read", target=target, target_type="user")
        return {
            "items": rows(
                ctx.db,
                """SELECT e.id,e.entry_type,e.days,e.effective_date,e.reference,
            e.created_at,t.name AS leave_type_name FROM leave_ledger_entries e JOIN leave_types t
            ON t.tenant_id=e.tenant_id AND t.id=e.leave_type_id
            WHERE e.tenant_id=:tenant AND e.user_id=:id ORDER BY e.created_at,e.id""",
                **ctx.parameters(),
                id=target,
            )
        }

    @app.put("/api/v1/admin/users/{user_id}/manager")
    def change_manager(user_id: str, body: leave.ManagerUpdate, ctx: Ctx):
        return leave.set_manager(ctx, user_id, body)

    @app.get("/api/v1/admin/users")
    def users(ctx: Ctx):
        ctx.require("user.manage")
        audit(ctx, "user.directory.read")
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
        policy_workflow.require_distributable(ctx, did)
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

    @app.post("/api/v1/admin/users", status_code=201)
    def create_user(body: UserCreate, ctx: Ctx):
        ctx.require("user.manage")
        role = one(
            ctx.db,
            "SELECT id,name FROM roles WHERE tenant_id=:tenant AND id=:id",
            **ctx.parameters(),
            id=body.role_id,
        )
        if not role or role["name"] not in ACTIONS:
            raise HTTPException(422, "Choose a supported role")
        ident = uid()
        ctx.db.execute(
            models.users.insert().values(
                id=ident,
                tenant_id=ctx.tenant,
                display_name=body.display_name.strip(),
                email_normalized=body.email.strip().lower(),
                password_hash=hasher.hash(body.password),
                active=True,
                created_at=now(),
            )
        )
        ctx.db.execute(
            models.user_roles.insert().values(
                id=uid(), tenant_id=ctx.tenant, user_id=ident, role_id=role["id"]
            )
        )
        audit(ctx, "user.create", target=ident, target_type="user")
        return {"id": ident, "display_name": body.display_name.strip(), "role": role["name"]}

    @app.get("/api/v1/policy-headings")
    def headings(ctx: Ctx):
        return policy_workflow.heading_list(ctx)

    @app.post("/api/v1/policy-headings", status_code=201)
    def add_heading(body: policy_workflow.HeadingInput, ctx: Ctx):
        return policy_workflow.create_heading(ctx, body)

    @app.get("/api/v1/policy-reviews")
    def review_queue(ctx: Ctx):
        return policy_workflow.queue(ctx)

    @app.post("/api/v1/versions/{vid}/reject")
    def reject_policy(vid: str, body: policy_workflow.Rejection, ctx: Ctx):
        return policy_workflow.reject(ctx, vid, body)

    @app.post("/api/v1/versions/{vid}/submit")
    def submit_policy(vid: str, body: policy_workflow.Revision, ctx: Ctx):
        return policy_workflow.submit(ctx, vid, body)

    @app.get("/api/v1/versions/{vid}/workflow")
    def policy_status(vid: str, ctx: Ctx):
        version(ctx, vid)
        result = policy_workflow.workflow(ctx, vid)
        result["history"] = rows(
            ctx.db,
            """SELECT e.status,e.comment,e.created_at,u.display_name AS actor FROM policy_workflow_events e
            LEFT JOIN users u ON u.tenant_id=e.tenant_id AND u.id=e.actor_id
            WHERE e.tenant_id=:tenant AND e.workflow_id=:id ORDER BY e.created_at,e.id""",
            **ctx.parameters(),
            id=result["id"],
        )
        audit(ctx, "policy.workflow.read", target=vid, target_type="version")
        return result

    @app.get("/api/v1/versions/{vid}/integrity")
    def verify_policy(vid: str, ctx: Ctx):
        return integrity.verify(ctx, settings, vid)

    @app.get("/api/v1/leave/types")
    def leave_types(ctx: Ctx):
        if not ({"leave.apply", "leave.read_all"} & ctx.actions):
            raise HTTPException(403, "Operation not permitted")
        return {
            "items": rows(
                ctx.db,
                "SELECT id,code,name,annual_entitlement_days,active FROM leave_types WHERE tenant_id=:tenant ORDER BY name",
                **ctx.parameters(),
            )
        }

    @app.post("/api/v1/leave/types", status_code=201)
    def create_leave_type(body: LeaveTypeCreate, ctx: Ctx):
        ctx.require("leave.manage")
        ident = uid()
        ctx.db.execute(
            models.leave_types.insert().values(
                id=ident, tenant_id=ctx.tenant, active=True, **body.model_dump()
            )
        )
        audit(ctx, "leave.type.create", target=ident, target_type="leave_type")
        return {"id": ident, **body.model_dump()}

    @app.get("/api/v1/leave/requests")
    def leave_requests(ctx: Ctx):
        return leave_applications.listing(ctx)

    @app.get("/api/v1/leave/requests/{ident}")
    def leave_request(ident: str, ctx: Ctx):
        return leave_applications.detail(ctx, ident)

    @app.post("/api/v1/leave/requests", status_code=201)
    def apply_leave(body: leave_applications.Application, ctx: Ctx):
        return leave_applications.apply(ctx, body)

    @app.post("/api/v1/leave/requests/{ident}/withdraw")
    def withdraw_leave(ident: str, body: leave_applications.Change, ctx: Ctx):
        return leave_applications.withdraw(ctx, ident, body)

    @app.post("/api/v1/leave/requests/{ident}/decision")
    def decide_leave(ident: str, body: leave_applications.Decision, ctx: Ctx):
        return leave_applications.decide(ctx, ident, body)

    @app.get("/api/v1/policy-tickets")
    def ticket_list(ctx: Ctx):
        return tickets.listing(ctx)

    @app.post("/api/v1/policy-tickets", status_code=201)
    def create_ticket(body: tickets.TicketInput, ctx: Ctx):
        return tickets.create(ctx, body)

    @app.get("/api/v1/policy-tickets/{ident}")
    def ticket_detail(ident: str, ctx: Ctx):
        return tickets.detail(ctx, ident)

    @app.post("/api/v1/policy-tickets/{ident}/resolve")
    def resolve_ticket(ident: str, body: tickets.Resolution, ctx: Ctx):
        return tickets.resolve(ctx, ident, body)

    @app.post("/api/v1/policy-tickets/{ident}/rollback")
    def rollback_ticket(ident: str, body: tickets.Rollback, ctx: Ctx):
        return tickets.rollback(ctx, ident, body)

    @app.post(
        "/api/v1/policy-tickets/{ident}/attachments",
        status_code=201,
        dependencies=[Depends(bounded_upload_form)],
    )
    def attach_ticket(ident: str, file: Annotated[UploadFile, File()], ctx: Ctx):
        return tickets.attach(ctx, ident, file.filename or "", file.file.read(2 * 1024 * 1024 + 1))

    @app.get("/api/v1/policy-tickets/{ident}/attachments/{aid}")
    def ticket_attachment(ident: str, aid: str, ctx: Ctx):
        tickets.ticket(ctx, ident)
        record = one(
            ctx.db,
            "SELECT content FROM ticket_attachments WHERE tenant_id=:tenant AND ticket_id=:t AND id=:id",
            **ctx.parameters(),
            t=ident,
            id=aid,
        )
        if not record:
            raise HTTPException(404, "Resource unavailable")
        audit(ctx, "ticket.attachment.read", target=ident, target_type="ticket")
        return Response(
            record["content"],
            media_type="application/octet-stream",
            headers={"Content-Disposition": 'attachment; filename="ticket-evidence"'},
        )

    @app.get("/api/v1/notifications")
    def notifications(ctx: Ctx):
        return {
            "items": rows(
                ctx.db,
                "SELECT id,ticket_id,message,created_at,read_at FROM notifications WHERE tenant_id=:tenant AND user_id=:user ORDER BY created_at DESC",
                **ctx.parameters(),
            )
        }

    @app.post("/api/v1/notifications/{ident}/read")
    def mark_notification(ident: str, ctx: Ctx):
        result = execute(
            ctx.db,
            "UPDATE notifications SET read_at=COALESCE(read_at,:at) WHERE tenant_id=:tenant AND user_id=:user AND id=:id",
            **ctx.parameters(),
            id=ident,
            at=now(),
        )
        if not result.rowcount:
            raise HTTPException(404, "Resource unavailable")
        audit(ctx, "notification.read", target=ident, target_type="notification")
        return {"status": "read"}

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
