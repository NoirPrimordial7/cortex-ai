# Shared fictional demonstration

**Latest release,10October2026:** Owner-approved PR #8 is merged and the restored-document/forest-ivory workspace is live on both providers at application22cbeef. Normal public authentication, API proxy, citations, tenant boundaries and hosted read-only behavior pass. [Current deployment proof and screenshots](../design/pr8-production-release/README.md). Exact Origins and this hosting contract remain unchanged; earlier release records below are historical.

Prepared2026-10-09. Owner authorized free Vercel frontend and free Render backend. Successful static build does not establish backend connectivity; publication verification follows service creation.

## Hosting contract

- Vercel project cortex-ai, NoirPrimordial7/cortex-ai, root frontend, npm ci/build, output dist, Node22. Same-origin API rewrite; API must not cache. Arbitrary preview Origins are denied.
- Render `$0 Free`, branch main, repository root. Build `pip install -r backend/requirements.lock`; start `cd backend && python -m app.hosted`; `PYTHON_VERSION=3.12.10`. One worker/instance, no paid disk/resource.
- `CORTEX_ORIGINS`: verified frontend HTTPS origins separated by commas. Render supplies RENDER_EXTERNAL_HOSTNAME/PORT; bootstrap enables exact Host, Secure cookies, fictional picker and read-only shared mode.
- Runtime data defaults to `/tmp/cortex-public-demo`; seed from tracked fictional fixtures, never copied from local-data. Sleep/restart/redeploy can reset everything and invalidate sessions; sign in again using current profile buttons.
- Public profiles share saved queries/history/audit. Upload/version review/user changes/ACL writes return403 even for admin. Local workflows remain editable.

## Account picker

The published application uses Arya Dhumal employee, Aditya Gholar reviewer/admin, Ashwin Gudur auditor and Yashraj Bansal other tenant, plus a separate disabled test account. [Production release verified10October2026](../design/production-release/README.md). Existing identity keys, fictional emails and roles are unchanged. Choose a profile. All three fields fill; click **Enter your workspace** for normal authentication. The disabled test account must fail. If the backend is waking up, wait and click **Load demo accounts**. No LLM API/key is required.

Normal deployments expose no profiles by default. Enable local autofill by creating an empty ignored `local-data/demo-autofill.enabled` after fictional seeding and reloading the backend. Remove marker and reload to disable. Never enable it with real users/data.

## Required publication checks

Render health; Vercel READY/source SHA; production alias accessible without Vercel login; API rewrite; secure host-only cookie; real profile sign-in/query/history/conflict/citation; unauthorized/other-tenant evidence denial; disabled sign-in; hosted mutation403; unapproved Origin403; no-store responses. Provider build status alone is insufficient.

## Limits and sources

[Render free services](https://render.com/docs/free) sleep after inactivity, use ephemeral files, offer no persistent free disk and share monthly quotas. Cold start may take about a minute. [Vercel SQLite guidance](https://vercel.com/kb/guide/is-sqlite-supported-in-vercel) rules out moving this stateful database into functions. Free quotas/outages, single-process serialization, shared history growth and in-memory failure counters remain limitations. This is disposable demo infrastructure. Do not enter confidential data, personal information or real passwords.

## Allocated services

- Frontend production alias: https://cortex-ai-three-kappa.vercel.app (also https://cortex-ai-noir-s-projects2.vercel.app).
- Backend: https://cortex-ai-demo.onrender.com. Render service srv-db4h9q1srm7s73b4b5g0, Free instance confirmed in dashboard, first deploy uses5ec7ca8e2a53bd55ef3ae5081991ef4c0d2a77f5.
- `frontend/vercel.json` sends /api to this actual assigned backend and falls back to index.html for SPA routes. Explicit API no-store headers; external rewrite caching disabled in the project.
- Vercel uses standard protection: previews/build URLs protected, production project domains public. Neither account collaborators nor repository visibility changed.

## Observed live verification

2026-10-09T21:57:13+05:30: public Vercel alias and API proxy passed52 functional assertions; [sanitized timestamp/check list](hosted-smoke.json). All five profiles returned; four active accounts authenticated normally with Secure HTTP-only host-only SameSite cookies, Noor denied. Current leave20/historical18/conflict two-citation abstention/missing and restricted abstention/exact citation span-hash passed. Cross-tenant/direct restricted reads404; wrong CSRF/Origin403; hosted admin writes/uploads403. Local picker also HTTP200 with five profiles.

Vercel deployment dpl_13t6423uXxh18PvhJsM2Af1zm5tX READY, sourcec6ca3f6b27764ed4945012140067d8ced60ea4a0; production alias accessible without Vercel account. Render first working source5ec7ca8, automatic configuration commitc6ca3f6 follows. Browser observed public profile picker, Maya authentication, actual20-day answer and authorized exact source. Genuine screenshots: [picker](../design/screenshots/shared-demo-login.jpg), [answer](../design/screenshots/shared-demo-answer.jpg).

These checks use the fictional development fixture and provide no general accuracy or production security certification. Subsequent documentation commits may trigger automatic redeploy and invalidate the disposable session; current source/status is verified after final push.

## Owner-reported preview login403

The original supplied preview returned403 “Origin not permitted” before credential checks. On10 October the owner explicitly approved adding the verified current review branch and build origins while preserving both production origins. Render reused the existing main build and reached Live; both preview origins now pass backend login/session/query/citation200. The public alias passed52 functional assertions and a fresh browser login after restart. [Applied configuration, exact origins and verification limits](../design/product-audit/preview-origin-change.md). The protected-preview browser limitation belongs to that earlier configuration check. Subsequently the owner approved the code release: main is merged, team names are live, and final public production passed62 API assertions and six normal-authentication browser tests. [Final verification](../design/production-release/README.md).
