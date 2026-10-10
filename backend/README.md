# Cortex backend — implemented local evidence core

Python 3.12, FastAPI, SQLite/FTS5, SQLAlchemy Core and Alembic. This is an offline **reviewed-policy evidence answerer**, not a general-purpose LLM chatbot. It recognizes leave, remote work, notice and executive bonus questions using finite keywords and reviewer-labelled numeric claims. Mixed or unknown topics abstain. No model download, API key or paid provider is needed.

Shared demonstration extension: [ADR0006](../docs/decisions/0006-disposable-shared-demo.md) and [hosting guide](../docs/implementation/SHARED_DEMO.md) add a disposable HTTPS Render deployment and explicit fictional picker. The local instructions below still apply. Hosted uploads/governance are read-only.

Draft PR #8 adds [authorized document reading and the opt-in enterprise corpus](../docs/design/premium-refinement/reader/README.md). Its final backend regression is42tests; production has not adopted these draft changes. `seed-enterprise-demo` is an alternative seed for an empty disposable data directory, not an update to an existing database. The default hosted seed remains unchanged.

## First-time setup (PowerShell, repository root)

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.lock
Set-Location backend
..\.venv\Scripts\python.exe -m app.cli migrate
..\.venv\Scripts\python.exe -m app.cli seed-demo
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --no-proxy-headers
```

Seeding is only for an empty database: it refuses to overwrite an existing tenant. For an already seeded checkout, run migrations and start the server; do not repeat seeding. Local database, private upload bytes and generated credentials live in ignored `local-data/`. Passwords are read from its `credentials.json`; never publish it. Example identities are Maya (employee), Ravi (manager/admin), Isha (auditor), Noor (disabled) and a separate ORBIT tenant. These are fictional accounts.

Use **one backend worker/process only**. Development reload may be added with `--reload --reload-dir app`; its supervisor runs one application worker. Reload resets the in-memory failed-login counters and may interrupt an in-flight request. Do not expose these local HTTP servers to a LAN or the internet. Hosted HTTPS configuration, robust parser isolation, shared rate limits and multiworker consistency are unimplemented.

## Verification

```powershell
# From backend/; pytest owns this named disposable test directory, not local-data/.
..\.venv\Scripts\python.exe -m pytest -q --basetemp ../outputs/pytest-phase3
..\.venv\Scripts\ruff.exe check app tests
..\.venv\Scripts\python.exe -m pip check
```

Tests migrate and seed isolated databases, generate temporary credentials, and cover the Phase 2 fictional scenarios, private TXT/PDF/DOCX ingestion, metadata approval, direct-resource denial, tenant isolation, exact source spans/hashes, historical dates, equal-authority conflicts, logout/idle/disabled sessions, CSRF/Origin, stale revisions and concurrent revocation. Initial verified checkpoint: **29 tests pass**; Starlette warns that its HTTPX TestClient adapter is deprecated. This is compatibility debt, not a suppressed failure.

## Real boundaries and limitations

- Authentication derives identity from an opaque HTTP-only cookie; the database stores session/CSRF digests and Argon2id password hashes. Current roles permit actions; explicit user-or-role document grants separately permit reading. Administration never bypasses READ.
- Every protected request uses a coarse exclusive process lock and one database transaction. Authorization, retrieval, peer expansion, reasoning and dependency verification stay inside that boundary. This reduces throughput: ingestion can hold it for up to the 30-second parser timeout. See [ADR 0005](../docs/decisions/0005-local-execution-boundary.md).
- Uploads remain private and unsearchable until an authorized reviewer verifies uniform document access, source kind, interval, population, jurisdiction, topic and one source-span numeric claim. Uploaded metadata fields cannot set approval or grants. Approval/authority, ingestion/publication/effective dates are distinct.
- Current ACL checks precede clause text hydration. FTS5 returns eligible IDs; authorized token coverage is the initial reranker. All eligible topic peers are expanded before conflict selection, capped at 100, with at most eight citations. Exceeding bounds abstains.
- Intervals are `[valid_from, valid_to)` and current grants apply to historical questions. Governing source kind is required, then strongest authority wins; equal-strength disagreement abstains with both citations. Lower-ranked disagreement is not yet explained in the UI.
- New queries validate exact source span and extracted-text hash. Saved answers/citations are owner-only and reauthorized; any tenant policy/knowledge revision change conservatively withholds the whole saved answer. Seven-day retention is enforced on reads, without an implemented deletion scheduler.
- Only uniform document ACLs and one immutable reviewed evidence span per version are implemented. Chunk ACLs, partial amendments, exception resolution, authority-rule editing, user creation and learned NLI are later work. Supersession edges are seeded provenance; current selection relies on reviewed validity intervals, not a generalized amendment engine.
- The parser runs in a bounded child process, with format, byte/text/page/archive limits; it is **not an OS security sandbox**. Scanned/encrypted PDFs fail safely; there is no OCR. Audit API returns sanitized successful workflow events; complete denied-attempt auditing is future work.

## Implemented API summary

All routes use `/api/v1`. Mutation requests require an allowed Origin; authenticated mutations also require the current `X-CSRF-Token`. Session returns current policy/knowledge revisions for UI invalidation. Unknown input fields fail validation.

| Routes | Contract |
|---|---|
| `GET /health`; `POST /auth/login`; `GET /auth/session`; `POST /auth/logout` | Health, opaque-session lifecycle, 8h absolute/30m idle lifetime |
| `GET /documents`; `GET /documents/{id}` | Current READ-filtered list/detail/version metadata |
| `POST /documents`; `POST /documents/{id}/versions` | Bounded multipart upload; upload action and explicit document access for a new version |
| `GET /versions/{id}/content`; `GET /versions/{id}/download`; `GET /ingestion-jobs/{id}` | Current READ and tenant enforcement, including failed/pending input |
| `GET /versions/{id}/pages/{page}` (draft reader) | Fresh version READ; optional original PDF PNG with actual `X-PDF-Page-Count`, no-store;501 when no renderer configured |
| `POST /versions/{id}/review` | Reviewer action + READ; atomic approval/metadata/claim/FTS update with expected revision |
| `POST /queries`; `GET /queries`; `GET /queries/{id}`; `GET /queries/{id}/citations/{id}` | Grounded answer/abstention, own current history, exact authorized source |
| `GET /dashboard`; `GET /conflicts` | Visible document counts and current owner-derived activity |
| `GET /admin/users`; `PATCH /admin/users/{id}` | Action-controlled existing users/roles/enable-disable; own admin modification blocked |
| `GET/PUT /admin/documents/{id}/acl` | ACL action + READ, same-tenant subjects and optimistic revision |
| `GET /audit-events` | Auditor action; event identifiers/outcomes without document text or raw prompts |

`401` requires sign-in; `403` denies an action or CSRF/Origin; `404` conceals an inaccessible resource; `409` signals stale revision/constraint; `413/415/422` reject bounded/unsupported input. API errors exclude parser content, filesystem paths and supplied credentials. Upload returns `202` with a completed bounded extraction job state; it is synchronous, not a background queue.

Draft citation reads support optional `?view=passage`, returning an unchanged nearby source slice plus `text_start_char`/`text_total_chars`. Citation offsets stay global Unicode code points and `source_hash` refers to full canonical text. Default `view=full` preserves the existing contract. Content responses additionally expose authorized current review metadata and original-format/preview capability; prose approval is never authoritative.

Optional PDF raster rendering requires an operator-configured absolute `CORTEX_PDF_RENDERER` path to `pdftoppm`. It is disabled by default. Bounds:200pages,1400px raster dimension,4MiBPNG,10-second renderer/15-second parent timeout. This child is not an OS sandbox or hard memory quota; isolate/resource-limit it before enabling untrusted enterprise PDFs. Rendering occupies the existing single-process gate. Exact citation highlights remain in extracted text; no PDF coordinate overlay or inferred original pagination is produced.

## Integrated frontend and fixture evaluation

The React interface is now implemented. [Live startup instructions](../docs/implementation/RUN_LOCAL.md), [actual verification](../docs/implementation/TEST_RESULTS.md) and [running screenshots](../docs/design/README.md) describe the current checkpoint. Run `..\.venv\Scripts\python.exe evaluate.py` from backend/ to produce the separate crafted-fixture report; it never resets local-data/. Current citations include reviewed source kind and numeric authority rank.
