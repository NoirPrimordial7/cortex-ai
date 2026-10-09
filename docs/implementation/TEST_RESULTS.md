# Current production verification

10 October2026: owner-approved main/application3834cda is published. Final public checks:62 API assertions, six Chromium browser tests,145 captures/144 geometry observations with zero overflow or clipped controls,18 exact JavaScript/CSS asset SHA256 matches. Four active team identities authenticate normally; the disabled profile fails. [Release evidence and bounded limitations](../design/production-release/README.md).

## Preserved pre-release full-product audit verification

10 October 2026 · review branch `codex/full-product-ux`

39 backend pytest tests and21 frontend tests pass. Ruff, strict TypeScript/Vite build and npm audit pass (zero vulnerabilities). 56 unique selected Chromium browser checks passed:29 deterministic UI regressions,14 actual role/login/workflow/reflow/origin checks,10 real capture runs,2 performance checks and1 unchanged published-alias login smoke. Opt-in live suites intentionally skip unless their environment flags are set.

[Full pass/pending matrix, commands and scope](../design/product-audit/README.md) · [actual gallery](../design/product-audit/gallery.html) · [measured performance](../design/product-audit/performance-results.json)

The approved Render origin update is live on unchanged main source. Both current review origins pass actual backend login/session/query/citation200; wrong CSRF/unapproved origins remain403. Post-restart production checks:52 HTTP assertions and one fresh browser login passed. [Configuration and protected-preview browser limitation](../design/product-audit/preview-origin-change.md). No review code was merged or released. Physical devices/Safari/assistive technology/field INP/cold starts are not certified by these local tests.

## Historical verification below

# Actual verification — Phase 3

## Hosted-demo extension —2026-10-09

Latest full local suites: **38 backend**, **11 frontend** tests pass; TypeScript/Vite build and Ruff pass. Live Vercel/Render smoke: **52 assertions** on the same fictional development seed, covering all five profiles, Secure host-only cookies, normal sign-in/session/logout, approved/current/historical answers, equal-authority conflict, missing/restricted evidence, exact citation span/hash, other-tenant404, CSRF/Origin403 and hosted upload/governance403. These are repeated functional assertions, not52 independent scenarios or a security assessment. [Exact timestamp/results](hosted-smoke.json). Real in-app browser verified picker → Maya sign-in → current leave answer/source; genuine captures are in docs/design/screenshots/shared-demo-*.jpg.

## Preserved original checkpoint

Date: 2026-10-09, Asia/Calcutta. These results apply to the bounded offline implementation and fictional fixture. The source report includes its exact timestamp, environment and fixture hash: [fixture-results.json](fixture-results.json). This is development sanity checking, not held-out research or a production certification.

| Check | Actual result / evidence | What it establishes |
|---|---|---|
| Backend Pytest | **29 passed**, 7.42s on final source run; one Starlette HTTPX TestClient deprecation warning | Fictional D01–D12 coverage, current auth/ACLs, tenant isolation, historical dates, revocation race, stale revisions, private TXT/PDF/DOCX/review, format/input limits, direct resource denial |
| Frontend Vitest / RTL | **8 passed**, two files | Query/source rendering, context invalidation, citation access loss, escaped malicious text, asked-question snapshot, stale source-response guard, dialog keyboard wrapping/dismissal |
| Build | TypeScript compilation + Vite production build passed | Frontend produces runnable assets; final JS371.91kB / gzip109.19kB, CSS28.36kB / gzip6.65kB |
| Dependency checks | `pip check` passed; `npm audit` reported zero vulnerabilities after compatible package updates | Lockfile dependency consistency and registry audit snapshot; not proof of zero vulnerabilities |
| Python static check | Ruff passed for application, tests and evaluation runner | Configured Python lint checks; no claim of an ESLint run |
| Live HTTP smoke | Frontend, proxied health, login and policy query returned200 | Both development servers communicate on loopback |
| Real browser | Screens/essential flows at1440×1000,1024×900,390×844;46 saved layout observations, zero measured horizontal overflow | Actual layout rendering; screenshots are browser captures, not Phase2 artwork |
| Selected contrast |12 computed light/dark text/background pairs, all≥4.5; minimum5.11 | These sampled pairs meet normal-text contrast target; not a full WCAG2.2 audit |

## Fixture evaluation

`backend/evaluate.py` migrates/seeds an isolated database and issues in-process HTTP queries. It uses the same crafted corpus used during implementation, with no held-out set or ablation.

| Metric | Result | Qualification |
|---|---|---|
| Expected scenario outcomes |12/12 |Includes a future-effective query and no-valid-interval query in addition to named scenarios; revocation/isolation are separate Pytest tests |
| Authorized topic-peer recall |15/15 |Tiny hand-labelled eligible peer set, not general retrieval recall on enterprise documents |
| Temporal outcomes |5/5 |Explicit reviewed intervals, boundaries and historical dates |
| Strongest-tier conflict |TP1, FP0, FN0 |Only **one positive** conflict case; precision/recall100% here is statistically weak and not a general accuracy estimate |
| Citation exact-span/hash checks |10/10 |Source integrity/support location, not independent semantic entailment assessment |
| Abstention outcomes |4/4 |Missing/restricted/conflicting/invalid-date cases in this fixture |
| Restricted canary violations |0 in checked stages/payloads |Instrumentation covers retrieval reasoning/response stages; does not prove absence of all side channels |
| Warm query latency |50 repeats; median9.422ms, P95 nearest-rank10.502ms |Windows/Python3.12, one worker, in-process TestClient; excludes browser, network, large corpus and concurrent load |

Re-running changes latency and timestamps; use the generated JSON as authoritative. Tests generate isolated disposable accounts and databases. The browser's additional private pending upload is not part of this canonical evaluation fixture.

## Browser checks actually performed

Maya signed in, submitted leave/current/historical and remote conflict questions, inspected exact passages, filtered/opened library/version detail, and inspected own conflicts/history. Current leave20 and historical leave18 were observed. Ravi signed in, inspected actual role/document grants, uploaded the provided fictional notice TXT through the browser, and opened its pending source/reviewer form. Isha could not open Ravi's private upload and could open redacted audit events. No live grants or user roles were changed during this browser walkthrough. Approval submission, PDF/DOCX upload, grants/revocation and concurrency are exercised by API tests, **not claimed as browser-submitted operations**.

Source modal Escape/close and mobile navigation were inspected; focused controls and keyboard behavior also have unit coverage. Live light/dark assistant and selected computed colors were inspected. Browser locator/file-picker control was occasionally unreliable/slow; native browser accessibility controls were used where available. An initial development hot-reload context mismatch was fixed by moving the shared context into a stable module; it is not hidden as an always-error-free session. Screenshots show actual state at their capture time, not an automated full-browser regression suite.

See [browser measurements](../design/browser-checks.json), [contrast pairs](../design/contrast-results.json), [design QA](../../design-qa.md), [screenshot gallery](../design/README.md). The selected sampled checks do not certify all pages/states for accessibility or security.

Immediate-resize screenshot frames initially retained the previous rendering. Those affected tablet/mobile files were replaced with settled captures before publication. Filenames denote requested CSS viewport widths; native screenshot framing/raster size can differ. This capture issue was not counted as a successful final visual check.

## Remaining experimental risks

Reviewer correctness and scoped semantic interpretation need independent labels. Mixed topics and unknown conditions abstain; arbitrary policy questions are unsupported. Topic-peer expansion caps at100 and citations at8. Synchronous parsing can block all protected requests for30seconds. No general prompt-injection-resistant LLM, NLI model, production deployment, cache invalidation benchmark or multiworker guarantee has been tested. Future changes should rerun affected checks and freeze a held-out protocol before broad performance claims.
