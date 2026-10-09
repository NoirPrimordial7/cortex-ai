# Shared fictional demonstration

Prepared2026-10-09. Owner authorized free Vercel frontend and free Render backend. Successful static build does not establish backend connectivity; publication verification follows service creation.

## Hosting contract

- Vercel project cortex-ai, NoirPrimordial7/cortex-ai, root frontend, npm ci/build, output dist, Node22. Same-origin API rewrite; API must not cache. Arbitrary preview Origins are denied.
- Render `$0 Free`, branch main, repository root. Build `pip install -r backend/requirements.lock`; start `cd backend && python -m app.hosted`; `PYTHON_VERSION=3.12.10`. One worker/instance, no paid disk/resource.
- `CORTEX_ORIGINS`: verified frontend HTTPS origins separated by commas. Render supplies RENDER_EXTERNAL_HOSTNAME/PORT; bootstrap enables exact Host, Secure cookies, fictional picker and read-only shared mode.
- Runtime data defaults to `/tmp/cortex-public-demo`; seed from tracked fictional fixtures, never copied from local-data. Sleep/restart/redeploy can reset everything and invalidate sessions; sign in again using current profile buttons.
- Public profiles share saved queries/history/audit. Upload/version review/user changes/ACL writes return403 even for admin. Local workflows remain editable.

## Account picker

Choose Maya employee, Ravi reviewer/admin, Isha auditor, Orbit other tenant or Noor disabled negative test. All three fields fill; click **Enter your workspace** for normal authentication. Noor must fail. If the backend is waking up, wait and click **Load demo accounts**. No LLM API/key is required.

Normal deployments expose no profiles by default. Enable local autofill by creating an empty ignored `local-data/demo-autofill.enabled` after fictional seeding and reloading the backend. Remove marker and reload to disable. Never enable it with real users/data.

## Required publication checks

Render health; Vercel READY/source SHA; production alias accessible without Vercel login; API rewrite; secure host-only cookie; real profile sign-in/query/history/conflict/citation; unauthorized/other-tenant evidence denial; disabled sign-in; hosted mutation403; unapproved Origin403; no-store responses. Provider build status alone is insufficient.

## Limits and sources

[Render free services](https://render.com/docs/free) sleep after inactivity, use ephemeral files, offer no persistent free disk and share monthly quotas. Cold start may take about a minute. [Vercel SQLite guidance](https://vercel.com/kb/guide/is-sqlite-supported-in-vercel) rules out moving this stateful database into functions. Free quotas/outages, single-process serialization, shared history growth and in-memory failure counters remain limitations. This is disposable demo infrastructure. Do not enter confidential data, personal information or real passwords.

Exact backend URL and live verification will be recorded after service creation.
