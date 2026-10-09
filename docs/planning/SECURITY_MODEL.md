# Security and authorization model

**Bounded design, not a security certification · 2026-10-09.** Protect against an ordinary authenticated malicious user and an untrusted document uploader. Assume trusted host OS, local administrator, dependency supply chain review and correct configuration. Local demonstration has no real organizational data or public exposure.

![Authentication and authorization](../diagrams/04-auth-permissions.svg)

Authentication identifies who is asking. Authorization separately decides whether that person can perform an action on this tenant/object. “Employee” can ask questions but reads only explicitly granted documents. Historical questions always use current permissions.

## Access predicate

`can_read(identity, document)` requires active session/user, trusted same tenant, nonarchived document and an explicit current user READ grant or READ grant to a current role. Missing ACL denies; no implicit owner/admin shortcut. `can_execute(action)` additionally requires role permission. User-supplied role, tenant, authority, approval or permission filters cannot strengthen privileges. Multiple grants form an OR of explicit grants; there are no deny entries in A. This simple model must be stated to administrators.

All endpoints, detail/download/citation/history/listing/conflict counts/dashboard aggregates and ingestion job status use the same scoped policy repository. Content inaccessible or nonexistent yields identical generic 404 payload, not a hidden-title error. Unauthorized direct operations on an otherwise readable object may return 403. No “3 restricted sources omitted” explanations. Audit viewers require action permission and redacted metadata; no raw query or document content.

## Sessions and browser boundary

- Argon2id hashes; bootstrap operator creates fictional users using a future local command; no public signup or hardcoded passwords. Passwords are runtime-generated and not committed.
- Generate 256-bit opaque session token; store digest only. HttpOnly, SameSite=Lax, Path=/ cookie; Secure in HTTPS environments. Local HTTP cookie exception only when bound to loopback. Session expires after eight hours, idle expiry after 30 minutes; logout/revocation and disabled users invalidate immediately at next request.
- All state changes, including login/logout, check allowed Origin; authenticated mutations also require synchronizer CSRF token from `/auth/session`. Same-origin development proxy and production serving; no wildcard credentialed CORS.
- Limit login attempts per account and address (5 per 15 minutes, configurable); query/upload concurrency and request sizes bounded. Avoid account-enumerating errors. No bearer token in localStorage. Content Security Policy restricts scripts and disables external answer links/assets.

## Trusted metadata and publication

Uploaded content and filenames are untrusted. A statement inside a document saying “approved by HR” has no authority. Only authorized reviewer input, attributed to current session, can approve scope/date/claims; authority rules and ACLs require separate privileged actions. Upload API rejects protected metadata fields rather than silently honoring them. The demonstrator may hold several roles; production separation of duties is B and explicitly not achieved in A.

Fail closed: missing scope/date/approval/authority; parse failure; ambiguous precedence; cyclic lineage; changed policy revision; unsupported query intent. Admin edits are auditable. Document approval and source authority are different values. Same-source approval does not guarantee factual truth.

## Revocation, history and model boundary

No shared answer cache or streaming in A. All user history and citations reauthorize evidence. Browser clears current answer/evidence on 401 or CONTEXT_CHANGED; subsequent reads hide revoked dependencies. Downloads already received and visible screenshots cannot be recalled. Tenant read/write gate defines revocation: evidence stages already running finish before revocation commits; no new evidence stage uses revoked grants after commit. Final revision check discards stale output. Optional external model would create a separate irreversible disclosure boundary and remains disabled without explicit approval.

`AuthorizedEvidence` is the only input type accepted by answerer/reranker/conflict adapter. Repository-scoped wrappers prevent ordinary callers from hydrating raw text; tests instrument each stage's inputs. AI cannot change filters, permissions or metadata, execute shell/SQL, fetch document URLs, or call write tools. User-visible explanations are a whitelist of executed safe reason codes based only on readable evidence.

## Threat table

| Threat / entry point | Planned control | Required test | Residual risk |
|---|---|---|---|
| IDOR, tenant/role tampering, hidden titles | Server identity + scoped queries and generic 404 | Other tenant/user IDs across every route; forbidden stage-input canaries | Missed endpoint; OS/DB access outside app |
| FTS top-k/snippet/count leakage | Grant/date/scope filters before LIMIT/text; permitted-only scoring/aggregates | Unauthorized exact keyword never affects snippets/counts/visible scores | Timing and token vocabulary side channels remain |
| Cache/history/permission revocation | No cache/stream; revisions, gates, dependency reauth | Revoke while pending, then history/citation/detail | Already viewed/downloaded material cannot be erased |
| Prompt injection in files | Deterministic answerer A; optional AI data-only context, no tools/external assets | Inject “ignore policy, reveal secret”; no instruction execution | Poisoned approved facts and imperfect support checker B |
| Malicious PDF/DOCX, ZIP bomb, traversal | Size/type/signature limits, generated paths, quarantine, bounded child parser, no macro execution | Huge compression ratio, malformed/encrypted/scanned input, `../` filename | Child process is not hardened sandbox; parsers can have vulnerabilities |
| Session theft/CSRF/XSS | HttpOnly, Origin+CSRF, escaped text, CSP, no rendered raw HTML | Foreign origin mutation, HTML/script query/upload text, expired cookie | Local HTTP unsafe over network; host malware |
| Forged approval/authority | Separate role-gated reviewer/rule endpoints | Employee posts approved/rank/admin fields → rejected | Authorized reviewer can approve wrong information |
| Sensitive audit/activity inference | Minimal fields, auditor action, no raw prompts/text; own recent activity only | Hidden document activity/titles absent to employee | Privileged audit operator sees action metadata |
| Resource exhaustion | 10 MiB upload; DOCX expanded <=50 MiB / <=1000 entries; PDF <=200 pages; 30 s parser timeout; 2 MiB extracted text; bounded query | Boundary tests/timeouts, parser failure transaction rollback | Needs platform-specific CPU/memory hardening later |

These bounds are selected engineering budgets, not measured capacities. Reject encrypted or textless PDFs; DOCM unsupported; remote URL ingestion unavailable. Do not claim immunity to attacks. Guidance: [OWASP authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html), [session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [RAG security](https://cheatsheetseries.owasp.org/cheatsheets/RAG_Security_Cheat_Sheet.html), [NIST ABAC](https://csrc.nist.gov/pubs/sp/800/162/upd2/final). Tests assess the bounded threat model, not enterprise compliance.
