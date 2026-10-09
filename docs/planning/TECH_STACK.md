# Selected technology stack

**Selected for the Phase 2 baseline on 2026-10-09; implementation pending owner approval.** Versions are compatibility targets, not an installed or validated lockfile. Phase 3 must pin exact patches and inspect dependency licenses/advisories before use.

| Layer | Selection | Reason / boundary |
|---|---|---|
| Frontend | React + TypeScript + Vite; React Router; Tailwind CSS 4 | Small local build, typed API contracts, familiar reusable UI; Tailwind's Vite integration is documented |
| Backend | Python 3.12 + FastAPI + Pydantic + Uvicorn | Explicit request validation, OpenAPI contracts, straightforward pytest fixtures; framework does not enforce our ACL automatically |
| Persistence | SQLite on local disk; SQLAlchemy 2.0 maintenance series + Alembic migrations | Zero server setup, relational constraints; conservative supported series instead of newly released 2.1 migration |
| Retrieval | SQLite FTS5 token matching; authorized candidate text scored by deterministic token coverage | No vector server or model needed. Avoid shared-corpus BM25 score leakage in A; candidate IDs filtered before text hydration |
| Auth | Argon2id via argon2-cffi; opaque database sessions, HttpOnly cookie, CSRF token | Revocable server sessions; no JWT refresh/rotation machinery or localStorage secrets |
| Parsing | pypdf, python-docx, strict UTF-8 TXT | CPU-friendly text-bearing formats; scanned PDFs require OCR and are rejected as unsupported initially |
| Answering | Deterministic structured/extractive EvidenceAnswerer | Quotes and reviewed structured values with source locators; mandatory no-LLM path |
| Optional AI | Local HTTP adapter to an explicitly configured loopback model endpoint | No selected/downloaded model. API adapter disabled by default; external/paid provider requires separate permission |
| Testing | Pytest + HTTPX; Vitest + React Testing Library; Playwright E2E in Phase 3 | Rule, API, component and browser checks; no application tests have run yet |
| Operations | Local one backend process; Vite proxy in development; built assets served same-origin by backend for demo | No Redis, Celery, Kubernetes, vector service or Docker dependency; container packaging only after working baseline |

## Alternatives compared

| Choice | Speed / maintenance | Security / reproducibility | Hardware / cost | Decision |
|---|---|---|---|---|
| SQLite vs PostgreSQL | SQLite quickest; Postgres better concurrent writes and operational tooling | SQLite needs application tenant enforcement; Postgres RLS still requires careful identity/config | Both free; Postgres adds service and backups | SQLite A; migrate when multi-process writes or hosted tenants are required |
| FTS5 vs vectors/hybrid | FTS5 inspectable, weaker paraphrase recall; hybrid needs model/index tuning | Every retriever must carry identical policy filters; vectors are sensitive derived data | FTS5 CPU; embeddings add RAM/download/license | Lexical A, matched hybrid experiment B |
| Extractive vs local LLM vs hosted API | Extractive fastest/repeatable but limited language; local LLM adds inference and support verification | Extractive cannot obey injected model instructions; poisoned approved facts still matter | Extractive no inference cost; local hardware unknown; hosted payment/external disclosure | Mandatory extractive; optional local B; hosted off |
| FastAPI vs Django vs Node | Django strong admin/auth ecosystem but larger setup; Node viable but parsing/ML ecosystem split | All need object-level auth; no framework is a security guarantee | Free | FastAPI with small explicit session service |
| Plain modules vs Haystack/LlamaIndex | Plain typed stages easier to inspect for narrow scope; frameworks richer integrations | Research found filters are not complete identity policy | Framework dependencies add surface | Fixed modules A; framework adoption only with evidence of reduced maintenance |
| React/Vite vs Next.js | Vite avoids SSR/server split; Next valuable if SSR/public pages required | Same-origin API cookies simplify deployment | Both free locally | Vite; no SSR need |

## Runtime verification at Phase 3 start

Use Node 22.12+ compatibility target (verify exact Vite engine requirement), Python 3.12 and a SQLite build with FTS5. Detect FTS5 with an isolated temporary in-memory check. SQLite's current WAL docs describe a WAL-reset bug and patched version requirements: verify the linked guidance before enabling WAL; use default rollback journal with one process for A if build safety is uncertain. Never place database on a network share. Commit frontend/backend lockfiles and environment example containing no secret values. Do not use floating latest dependency specs.

## Primary technical references checked 2026-10-09

- [Vite guide and runtime compatibility](https://vite.dev/guide/), [Tailwind Vite integration](https://tailwindcss.com/docs/installation/using-vite).
- [FastAPI security primitives](https://fastapi.tiangolo.com/tutorial/security/), [SQLAlchemy release series](https://www.sqlalchemy.org/).
- [SQLite FTS5](https://sqlite.org/fts5.html), [SQLite WAL concurrency and current bug guidance](https://sqlite.org/wal.html).
- [pypdf extraction limits](https://pypdf.readthedocs.io/en/stable/user/extract-text.html), [python-docx](https://python-docx.readthedocs.io/en/latest/).
- [OWASP session guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [authorization guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).

Selection is engineering judgment based on the bounded deadline, not a benchmark proving these tools superior.
