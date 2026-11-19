# Cortex AI governance enhancement — implementation and test report

Verified locally on 2026-11-19, Windows 11, Python 3.12.10, one FastAPI process, SQLite/SQLAlchemy Core, React 19/Vite 7/TypeScript. Branch: `codex/employee-governance`. This report covers all six enhancement phases and eight requested changes. It does not claim a new public deployment, a GitHub Actions result or general AI accuracy.

## Result

All requested modules are integrated with persistent backend records and API authorization. Final checks: **97 backend tests passed, 39 frontend tests passed, 13 real-browser scenarios passed**. No backend tests were skipped in the complete run: the real pinned MiniLM artifacts were downloaded, hash-checked and used. The existing crafted evidence evaluation retains 12/12 expected outcomes, 15/15 authorized peers and 10/10 exact citation spans/hashes. Ruff, dependency consistency, TypeScript/Vite build and npm audit pass. Npm audit reports zero findings at verification time.

An isolated fictional demo runs at `http://127.0.0.1:8008`, using `outputs/governance-verification/`. The pre-existing process on port 8000 and its database were not replaced. Existing installations must stop the old server, install the updated lock, run the migration CLI and rebuild/restart as described in [RUN_LOCAL.md](RUN_LOCAL.md).

## Implemented behavior and verification

| Module | Implemented behavior | Evidence and outcome |
|---|---|---|
| Architecture review | Reused FastAPI, SQLAlchemy Core, SQLite/FTS5, opaque sessions, CSRF/Origin, explicit READ and exclusive request gate | Existing evidence, security, query and concurrency regressions pass |
| Demo identities | Arya/Aditya/Ashwin/Yashraj emails match names, retain `@example.test`, original IDs and credentials | Migration test preserves IDs/password hashes and arbitrary non-demo emails; duplicate user creation is rejected |
| Three roles | Exactly one active Employee, Auditor or Admin role per account | API role matrix; DB uniqueness/name guards; legacy Manager/Knowledge Manager become Employee unless already privileged |
| Admin policy creation | Private immutable TXT/PDF/DOCX uploads, explicit submission, approved distribution | Real browser uploads, submits, returns from rejection, grants selected Employee and checks source access |
| Auditor review | Separate queue, independent reviewer, exact span/metadata checks, approval or comment-only rejection | Admin review/reject denied; self-review after role change denied; approval/rejection/resubmission verified |
| Policy headings | Tenant-persistent normalized names; create from queue or review; reuse existing headings | Case/spacing duplicate returns the existing ID; approved heading appears in library/detail |
| Employee policy visibility | READ plus approved version required on list/detail/content/download | Draft cannot be distributed; newer draft on an approved document remains concealed; older approved edition stays accessible |
| Employee leave | Own balance, type/dates/reason, history/status, pending withdrawal | Form confirmation + real API submission; pending/rejected/withdrawn requests leave balance unchanged |
| Auditor leave review | All active Employees' balances and requests, comments, approve/reject and cancellation review | Approval deducts exactly once; current insufficient balance denied; concurrent approvals yield one success and one 409 |
| Approved cancellation | Employee requests cancellation; Auditor approves or declines | Balance stays deducted until approval; approved cancellation restores once; previous events and ledger entries remain |
| Admin leave | Central monitoring, transaction history, allocations/corrections and type configuration | Admin cannot approve/reject; allocation to Admin/Auditor denied; configuration alone does not credit a balance |
| Non-employee dashboards | No personal balance cards, balance calls or application form | Frontend role tests and real browser checks for Admin/Auditor; personal balance API returns 403 |
| Re-audit tickets | Employee selects accessible approved policies, describes issue and attaches bounded evidence | Real browser creates ticket and attachment; inaccessible policy, unrelated resolution choice and private records denied |
| Resolution/rollback | Auditor chooses relevant policy and explanation; rollback appends reason and returns pending | Employee sees selected policy and explanation, notification, and prior resolution after rollback; stale decision replay rejected |
| Integrity/provenance | Ed25519 canonical manifest, SHA-256 original/extracted checks, original uploader/name/time, version and latest status | Actual tampered original bytes yield Integrity Mismatch; missing key yields Unable to Verify; restoring original key restores Verified |
| Historical upgrade | Forward migrations retain users, old reviewers, reporting and leave ledger; verified legacy signing is labelled | Pre-0005 schema upgrade is idempotent; no privileged promotion/widened Employee grants; historical reviewer retained; FK check clear |
| Persistence | Same central database contains workflow projections, history, attachments and notifications | Fresh application instance and new login retain the same ticket history; SQLite records survive refresh/logout |
| Existing knowledge modules | Dated policy answers, source citations, conflict abstention, lexical/semantic search, intent/person matching and one-turn context | All existing backend suites pass; real MiniLM test passes; crafted evaluator preserves every expected outcome |
| UI/design | Existing lazy routes, forest/ivory tokens, tables, source editions, feedback, confirmations and role navigation | All three roles at five widths/two themes, 103 browser captures, zero checked document overflow; keyboard navigation/focus restoration passes |

## Database and migration changes

No separate database or new authentication framework was introduced. New relationships use same-tenant foreign keys. Existing user IDs, policy versions, clauses, grants, ledger entries, sessions, citations and reporting records remain.

| Migration | Schema and data changes |
|---|---|
| `0005_governance_roles` | `policy_headings`, `policy_workflows`, `policy_workflow_events`; normalize active roles/permissions, preserve READ from removed memberships as direct grants, migrate exact fictional emails with collision checks, import historical policy state/reviewer, derive historical headings from existing category, one-role index and role-name guards |
| `0006_leave_applications` | `leave_requests`, `leave_request_events`, `leave_request_transactions`; dated requests, comments/reviewer/revisions and unique request-operation/ledger links |
| `0007_policy_tickets` | `policy_tickets`, `ticket_policies`, `ticket_decisions`, `ticket_attachments`, `notifications`; selected policy, current status, immutable decision history, bytes/hashes and per-user notices |
| `0008_policy_integrity` | `policy_integrity`, `integrity_verifications`; signed immutable manifests and verification events; UPDATE/DELETE/REPLACE guards for new history/provenance and posting links |

These are **13 additional domain tables**. The migration CLI also backfills signatures only for historical sources with matching original/extracted hashes, records an audit event and synchronizes fictional credential emails without resetting passwords. Backfill never invents an original uploader. It is idempotent. Missing or changed historical source files remain unverifiable. No fictional leave allocations are inserted into an existing tenant.

Legacy role consolidation retains existing Admin first, otherwise Auditor, otherwise Employee. The migration does not promote a former Manager or Knowledge Manager. Historical approval authorship remains historical, even if the original reviewer no longer has an approval action. Historical entries for someone now assigned a non-employee role remain records; they are not shown as that person's personal balance.

## API contracts

All paths below have `/api/v1` prefix. All require an active session. Mutations require the allowed Origin and current CSRF token. JSON input forbids unknown fields. Multipart attachment input permits only one file. Resource reads remain tenant/owner/READ scoped.

| Method/path | Action and behavior |
|---|---|
| `POST /admin/users` | Admin; create same-tenant user with exactly one supported role and Argon2 password hash; duplicate email returns 409 |
| `GET /policy-headings` | Authenticated; tenant heading IDs/names |
| `POST /policy-headings` | Auditor; normalize and create/reuse heading |
| `GET /policy-reviews` | Auditor; READ-filtered submitted version queue |
| `POST /versions/{id}/submit` | Admin + READ; `expected_revision`, draft/rejected → submitted, grants Auditor review READ |
| `POST /versions/{id}/review` | Updated: independent Auditor + READ; original strict metadata/span validation, heading required for approval, current integrity must verify |
| `POST /versions/{id}/reject` | Auditor + READ; `expected_revision`, meaningful reason; submitted → rejected without invented approval metadata |
| `GET /versions/{id}/workflow` | Current version access; status/heading/reviewer and complete status/comment/time/actor history |
| `GET /versions/{id}/integrity` | Current version access; real signature/hash verification and append-only result; no private signing material |
| `GET /leave/types` | Employee/Auditor/Admin; tenant leave configuration |
| `POST /leave/types` | Admin; code/name/configurable whole-day annual entitlement; no automatic balance credit |
| `GET /leave/requests` | Employee own requests, Auditor/Admin tenant requests |
| `POST /leave/requests` | Employee; type, inclusive dates, meaningful reason; pending, no posting |
| `GET /leave/requests/{id}` | Employee own or Auditor/Admin tenant request, review details and event history |
| `POST /leave/requests/{id}/withdraw` | Employee own; `expected_revision`, reason; pending → withdrawn, approved → cancellation_pending |
| `POST /leave/requests/{id}/decision` | Auditor; `expected_revision`, approved/rejected, comment; atomic ledger posting/status/history |
| `GET /leave/ledger?user_id=...` | Employee own history or Auditor/Admin selected active Employee history |
| `GET /policy-tickets` | Employee own or Auditor tenant tickets, including author name |
| `POST /policy-tickets` | Employee; one to five accessible approved policy IDs and description |
| `GET /policy-tickets/{id}` | Concerned Employee or Auditor; source links, resolution, evidence and actor/decision history |
| `POST /policy-tickets/{id}/resolve` | Auditor; `expected_revision`, relevant `document_id`, reason; rechecks Employee access and notifies |
| `POST /policy-tickets/{id}/rollback` | Auditor; `expected_revision`, reason; resolved → pending, append decision and notification |
| `POST /policy-tickets/{id}/attachments` | Concerned Employee while pending; TXT/PDF/DOCX, ≤2 MiB, max five, opaque stored evidence |
| `GET /policy-tickets/{id}/attachments/{id}` | Ticket access; audited download, octet-stream attachment, no inline execution/indexing |
| `GET /notifications` | Own persistent ticket notifications |
| `POST /notifications/{id}/read` | Own notice only; idempotent read timestamp |

Updated existing APIs: `PATCH /admin/users/{id}` requires exactly one role; `PUT /admin/documents/{id}/acl` requires an approved indexed version before distribution; `GET /leave/balance` is Employee-only; `/leave/team` and `/leave/employees/{id}/balance` are centralized Auditor/Admin employee reads. `/admin/users/{id}/manager` is a retired compatibility endpoint returning 410 to Admin, with historical reporting rows preserved. Old `/team` UI links redirect to `/leave`.

Errors: 401 sign-in, 403 action/CSRF/Origin, 404 inaccessible identity/resource, 409 stale state/constraint/insufficient balance, 413 oversized evidence, 415 unsupported attachment, 422 invalid fields/selection, 503 missing signing key on new signing. Failed transitions roll back the same request transaction. Current server action checks remain authoritative over hidden UI controls.

## Role permissions

| Function | Employee | Auditor | Admin |
|---|---|---|---|
| View explicitly assigned approved policies and integrity | Yes | Yes, current READ | Yes, current READ |
| Ask Cortex | Yes | Yes | Yes |
| Upload/create/submit policies | No | No | Yes |
| Review/approve/reject policies; create headings | No | Yes, independent | No |
| Grant policy access | No | No | Yes, approved only |
| Personal balance/apply/withdraw own leave | Yes | No | No |
| Central employee balances/requests/history | No | Yes | Yes |
| Approve/reject leave or cancellation | No | Yes | No |
| Configure leave types/allocate/correct ledger | No | No | Yes |
| Raise ticket/attach evidence | Yes | No | No |
| Review/resolve/rollback tickets | No | Yes | No |
| People/roles/account creation | No | No | Yes |
| Sanitized audit activity | No | Yes | No |

Admin has no document READ bypass. Auditor submission access is an explicit grant, not a general bypass. Employee may read only approved versions even when a broad historical grant exists. Direct same-tenant and cross-tenant private leave/ticket requests are denied. Personal leave chat also enforces the Employee-only distinction.

## Test execution and evidence

| Check | Final result and scope |
|---|---|
| Pytest | 97 passed, zero failed/skipped; one pre-existing Starlette/httpx deprecation warning; timings are recorded in the JUnit artifact |
| Migration follow-up | Historical-version/signing-backfill/audit/idempotence assertions pass, including a targeted run (1 test, 0.41s) and the final complete suite |
| Vitest | 39 tests in 12 files passed; final recorded run 38.51s |
| Real browser | 13 passed, approximately 2.8 minutes; installed Chrome, one Playwright worker, built frontend and actual isolated backend/database |
| Visual/keyboard | 103 PNGs, all three roles, 320/390/768/1280/1440px, light/dark; no checked page overflow; 320px navigation focus containment/Escape/restoration |
| Ruff | `ruff check backend/app backend/tests backend/migrations` passes |
| Python dependencies | `pip check`: no broken requirements |
| Frontend build | `npm run build`: TypeScript and Vite pass |
| Frontend dependency audit | `npm audit --include=dev --audit-level=low`: zero reported findings |
| Evidence fixture evaluator | 12/12 outcomes, 15/15 peers, 5/5 temporal cases, 10/10 exact citation spans/hashes, 4/4 abstentions, zero checked restricted-canary violations |

Backend modules: conversation 4, demo hosting 10, embeddings 3, evidence 12, governance 14, governance migration 1, ingestion 8, leave 6, person resolution 10, policy search 4, query routing 16, revocation 2, security 7. These sum to 97. New application tests cover replay, simultaneous approval, same-tenant privacy, tenant separation, meaningful input, inaccessible/unrelated ticket policies, bounded attachments, signatures, missing-key recovery and restart persistence. Existing ingestion tests still exercise actual TXT, PDF and DOCX extraction and exact cited source support.

Old tests intentionally changed where requirements superseded their behavior: Admin self-review → independent Auditor; Manager-only leave reads → central Auditor/Admin; Auditor personal zero balance → 403; manager reassignment → retired endpoint and retained history. They were not changed to bypass current READ, tenant checks, source hashes, CSRF or conflict abstention. The new version rejection test preserves older approved embeddings rather than retracting an immutable approved source through an unsupported review transition.

Final source review also added an early version-upload action check to prevent duplicate-label probing, and retained failed integrity observations without committing policy publication. Both have regression assertions.

Initial browser attempts exposed overly broad select accessible names and an outdated confirmation label; these were corrected and the flows rerun successfully. The narrow-screen test was corrected to use the existing mobile Source edition behavior. Initial Windows sandbox TestClient startup blocked its local socket pair; socket-enabled local execution completed the suite. The absent bundled Playwright Chromium executable was handled using installed Chrome. These initial failures are not counted as final passes.

Generated evidence: `outputs/governance-backend-tests.xml`, `outputs/governance-frontend-tests.xml`, `outputs/governance-browser-report/index.html`, `outputs/governance-browser/`, `outputs/governance-captures.json`, `outputs/governance-npm-audit.json`. Regenerate using [the run guide](RUN_LOCAL.md). [Six preserved screenshots and before/after context](../design/governance-enhancement/README.md) are tracked. The [crafted fixture result](fixture-results.json) remains a development fixture, not held-out accuracy or semantic entailment evidence.

Vite reports entry JS 311.21 kB / 96.93 kB gzip and CSS 54.84 kB / 10.58 kB gzip. New modules use lazy route chunks. These are build asset sizes, not API time, CDN time, cold start or Core Web Vitals. The crafted evaluator's in-process warm query series has n=50, median 13.600ms and nearest-rank p95 17.247ms. No network or end-user latency claim is made; LCP, CLS, INP and deployment cold starts were not measured here.

## Configuration and operating limits

- New dependency: pinned `cryptography==50.0.2`; existing lock already contains its CFFI dependency. No frontend production dependency was added.
- New optional `CORTEX_SIGNING_KEY_FILE`; default is ignored `<CORTEX_DATA_DIR>/integrity-signing-key.pem`. Preserve this key with the database/uploads, use owner-restricted filesystem permissions and the same setting for migration/server. No key is returned by the API except public verification material.
- Existing `CORTEX_DATA_DIR`, `CORTEX_DEMO_ACCOUNTS`, origins/hosts, secure-cookie and optional local embedding settings remain. `CORTEX_TEST_GOVERNANCE=1` enables only the isolated browser suite.
- Source files and database are not encrypted at rest. Signatures authenticate the manifest and bytes within the server trust boundary. A host attacker controlling both database and signing key can forge new provenance. No external timestamping, automated key rotation or HSM/KMS is claimed.
- Historical signatures prove the migration's matching-hash observation, not pre-migration origin authenticity. Historical uploader/filename may be unknown and are explicitly labelled.
- Leave uses whole weekdays, inclusive endpoints, maximum one-year request span, no holiday calendar or partial days. Credits are explicit ledger allocations, not an automatic annual scheduler. Pending requests do not reserve days; approval checks the then-current balance.
- Ticket notifications are in-app, not email/push. Attachments are opaque evidence, not parsed/indexed policies or malware-scanned files. They download as attachments. UI lists page records locally; large-scale server pagination/retention is future work.
- The one-process exclusive gate and synchronous bounded extraction are retained. Do not run multiple backend workers/processes against the database. This is a local application checkpoint, not a durable multiworker enterprise deployment.
- Existing evidence limits remain: one reviewed span/version, finite strict numeric topics, reviewer-supplied authority/metadata, optional English-oriented MiniLM, no OCR/general LLM/NLI/partial amendment engine. Complete denied-attempt auditing remains outside the inherited audit implementation.
- Public hosting remains view-only and unchanged. No force push, merge or live deployment was performed.

## Files and decisions

[GOVERNANCE_CHANGES.json](GOVERNANCE_CHANGES.json) is the complete repository-relative added/modified file inventory. Backend changes are the role matrix, schema/migrations, policy workflow, leave applications, tickets, integrity, route/auth integration, demo/CLI/hosted initialization and regression tests. Frontend changes are role navigation/dashboard, leave/ticket/review pages, provenance, shared confirmations/focus/statuses, account creation, document workflow/headings, compatible old Team redirects and responsive tests. Documentation includes updated startup/API/status/change logs, this report and original browser captures.

Architectural rationale: [ADR 0014](../decisions/0014-three-role-governance.md), [ADR 0015](../decisions/0015-leave-and-ticket-history.md), [ADR 0016](../decisions/0016-signed-policy-provenance.md). They explain the before/after behavior, alternatives and consequences. The React best-practices and full-story verification skills were used for component review and tracing UI → API → database → response. No new skill was installed.
