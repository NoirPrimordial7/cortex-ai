# ADR0006 — Disposable shared demo and fictional account picker

Date:2026-10-09T21:49:43+05:30. Status: accepted within owner-authorized free demo hosting; not a production architecture. Phase3 demonstration delivery. Extends ADR0005's loopback-only boundary for this fictional demo; retains its one-process authorization transaction gate.

## Decision

Vercel hosts the React static build; Render's **$0 Free** instance hosts one FastAPI/SQLite process. Vercel Functions cannot preserve the current persistent single-process SQLite boundary. Use a same-origin `/api` external rewrite, exact approved HTTPS frontend Origins, exact Render Host, Secure HTTP-only SameSite=Lax cookies and existing CSRF/session/document checks. Preview/build URLs remain protected; project production aliases are public for fictional data. Never scale workers/instances.

Render free files are ephemeral: seed an empty database from tracked fictional fixtures on startup, generate disposable credentials on Render, refuse to overwrite a nonempty database missing its credential file. Pin Python3.12.10; use Render PORT. Hosted upload/review/ACL/user mutations return403 even for the admin. Authentication, authorized queries/citations/history and permitted administration inspection remain enabled. Local workflows remain editable.

The owner requested all fictional profiles for autofill. A default-disabled endpoint exposes only five exact seed identities when opted in; it cannot enumerate arbitrary credentials. Local opt-in is an ignored `local-data/demo-autofill.enabled` marker; hosted bootstrap explicitly enables it. Local credentials are never uploaded or bundled. Selecting a profile fills workspace/email/password; Sign in still invokes normal authentication. Disabled Noor demonstrates real denial. Public profiles share query history: never enter confidential questions or regard a profile as a private identity.

## Alternatives, risks and limits

- Vercel-only Python: requires replacing SQLite/process locking and concurrency assumptions.
- Paid disk/service: unauthorized and out of scope.
- Browser-only mock backend: would misrepresent actual retrieval/authorization.
- Local-only preview: insufficient for remote teammates.

The free backend may sleep after15 minutes and take about a minute to wake; SQLite/history/credentials can reset after sleep/restart/redeploy. Account loading offers retry. No durable hosting, private enterprise identity, general LLM, security assessment or production throughput is claimed. Existing body bounds/rate limits remain; globally serialized work and shared query storage are demo limitations.

## Evidence and traceability

[Vercel SQLite guidance](https://vercel.com/kb/guide/is-sqlite-supported-in-vercel), [Render free service limits](https://render.com/docs/free), [Vercel deployment protection](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication).

Files: backend settings/main/demo/hosted; frontend login/session types/read-only screen controls/CSS; .gitignore; backend and frontend regressions; shared-demo guide and logs. Local suites:38 backend/11 frontend tests and TypeScript/Vite build pass. Hosted connectivity/browser validation is required separately. Previous published HEAD6545b20; implementation commit subject `feat: add fictional demo account picker and hosted safety boundary`.
