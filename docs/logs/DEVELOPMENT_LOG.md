# Development log

## 2026-10-10T00:44:00+05:30 — Selected Fieldbook Ask Cortex implementation

- Exact attached Fieldbook and Reference House images resolve the selection; owner locked identity and prioritized Ask UX over further variations or other-page redesign.
- Scoped lazy assistant CSS and self-hosted OFL Fraunces/DM Sans; top masthead retains full navigation in the menu. Other routes retain Atlas.
- Replaced duplicated evidence with compact citations and one detailed inspector. Desktop collapse restores focus; mobile native modal makes background inert, wraps Tab/Shift+Tab, supports Escape/Back and restores citation focus without moving scroll.
- Reserved a scrolling answer area above the persistent composer. Normal scrolling takes over in short keyboard-like viewports. Long answers use a smaller reading size; follow-up drafts survive in-flight responses. Original question remains bound to its response.
- Existing endpoints, ACLs, source hashes, tenant isolation, date/population semantics, conflict abstention, session revision invalidation and conditional full hosted disclosure preserved. No backend source changes or credential persistence.
- Checks: frontend13, Playwright13, backend38 pass; Ruff, strict build and npm audit pass. Chromium320/390/768/1280/1440 light/dark tested. Real local annual leave and remote-work conflict exercised through existing fictional session. QA comparison source/actual captured together at1536×1024; root design-qa.md passes the bounded local gate.
- Fixed focus escaping into browser chrome, composer covering citations, legacy label margins and paper background override, and source-loading synchronization in the contrast test. Sixteen sampled text pairs min5.38:1; control boundary min3.17:1.
- Initial JS100.19kB gzip versus100.01kB before; assistant CSS3.77kB gzip; self-hosted fonts73,552bytes. These are build sizes, not network, API or Core Web Vitals claims.
- Physical-device/Safari/assistive technology, measured web vitals and production deployment remain outstanding. Updated existing PR #2; remote reports it open and ready for review (not draft), and that existing state is preserved. No main merge or live deploy.

## 2026-10-10T00:11:00+05:30 — Evidence Desk second exploration

- Owner rejected the first set and requested five to six fresh concepts; generated exactly six independent built-in Image Gen results, displayed sequentially with desktop/mobile companion views.
- Added docs/design/evidence-desk/round-2/ with six concept PNGs, selection mapping, exact prompts and artwork-correction notes. Updated parent gallery, installation record, toolkit status and chronological logs. Earlier concepts preserved; no removals.
- All four installed project skills appear in the new turn's available-skills catalog, confirming discovery without reinstalling.
- Grounding: actual existing baseline browser captures attached to every generation; mock date anchored to 2026-10-10. No new browser audit, runtime change, dependency change or deployment. Artwork lacks some requested details, including offline label in Carbon Evidence; corrections explicitly recorded.
- Verification: six result files copied into workspace and visually inspected inline; staged filenames/whitespace/targeted secret scan before commit. Previous runtime 12-test/build pass is historical, not a new check. No repeat tests warranted for this artwork/documentation-only change.
- Pending: owner choice from this latest six-image set, refinement of generated deviations, implementation and full responsive/interaction/security/performance QA.
- Commit subject: design: explore six new Evidence Desk directions. Continue existing draft PR #2 on design/skill-toolkit-mobile-first; no main merge or live deployment.


## 2026-10-09T23:55:00+05:30 — Evidence Desk skills and visual exploration

- Branch: existing design/skill-toolkit-mobile-first, draft PR #2; starting HEAD c174003445791c7b2441bcbf6fcbb8c365ccb581. No application source, dependency manifest, backend behavior or deployment changed.
- Added docs/design/evidence-desk/ with three independent Image Gen concept PNGs, actual current-flow browser captures, shared prompt/direction record, selection gate and pinned installation record. Changed design gallery and toolkit status plus changelog/development log. No prior artifacts removed.
- Installed four selected pinned skills locally under ignored .agents/skills using the bundled skill-installer, after reading entries and inspecting source/license evidence. No executable scripts in the installed trees; no global install or third-party instruction execution. Fresh-turn/session discovery is pending; license/distribution gaps are recorded, and no skill files are vendored into Git.
- Browser: reused existing fictional profile in public shared demo, asked the annual-leave example, checked the exact allowed source at 1440 and 390. Mobile citation retains focus on the citation and leaves source below the answer; no Back to answer flow. One 390px document-width check found no overflow. Screenshot/DOM scope and intermediate loading capture are labeled.
- Outcome: three distinctly composed concepts displayed in chat, with desktop plus mobile source view, pending owner selection. Generated reviewer identities are unsupported by the API and explicitly excluded from later implementation. Artwork is not accessibility, performance or responsive proof.
- Verification: existing frontend 12 tests across 4 suites pass; TypeScript/Vite production build passes; documentation diff whitespace checked. First sandbox test run failed before tests started with file realpath EPERM; rerun outside sandbox passed. Backend tests and full browser matrix not rerun because no runtime change was made. No new performance claim or security certification.
- Outstanding: confirm skill discovery next turn/session, choose concept, implement exact source focus/return behavior, extend chosen design, then run both-theme 320/390/768/1280/1440, keyboard/zoom/revocation/conflict, regression and performance checks. Playwright tooling installation remains an implementation-stage setup task.
- Commit subject: design: install curated toolkit and prepare Evidence Desk choices. Exact publication result is recorded in PUBLICATION.md after commit/push verification.


## 2026-10-09T23:24:44+05:30 — Atlas Professional publication verified

- Published implementation [6c68994](https://github.com/NoirPrimordial7/cortex-ai/commit/6c689949b79f3d08253ed145178a5ca9be23cc40); local/remote main matched and working tree was clean.57 intended staged paths passed exact-runtime-credential/private-file/signature checks and whitespace review. Visibility/collaborators unchanged.
- Vercel production deployment dpl_27FzNbxq3vECikZdCAXQ8PzXb1mj READY, correct commit and existing public alias; Render dashboard reports last successful Live commit6c68994. Public HTML references the exact final build entry index-M8wdEcYr.js. No paid services or new project.
-52 fictional HTTP assertions passed, covering login, no-store/profile scope, secure host cookies, current/historical leave, conflict/missing/restricted evidence, spans/hash, Origin/CSRF, role/tenant/disabled-account boundaries and hosted read-only writes. These are repeated fixture smoke assertions, not52 independent accuracy scenarios. Fresh released browser autofill/sign-in and cited20-day source verified afterward.
- Actual public captures1487/390 and combined source/implementation comparison inspected; hosted read-only/shared-history/reset disclosure visible; mobile source remains below answer, no page-level horizontal overflow.28 local DOM observations and11 contrast pairs remain the bounded UI checkpoint.
- Four-sample repeat HTTP medians: root13.28ms, health269.28ms, public profiles272.44ms. Baselines28.39/267.08/270.57 respectively. Network noise and tiny warm samples preclude a latency improvement claim. Build entry shrank; free-backend cold starts remain.
- Files changed here: current QA, design gallery/brief, verification JSON/captures and these logs. No application source changed. Documentation publication subject `docs: verify Atlas Professional live release`; its hash follows successful push. Remaining work: owner feedback, held-out usability, web-vitals/platform coverage and documented prototype limits.


## 2026-10-09T23:17:29+05:30 — Phase3 Atlas Professional refinement

- Added frontend theme, shared authorized passage component, deferred route error boundary/test, revised concept, genuine captures/comparisons, build/contrast/layout reports and ADR0007. Changed shell, assistant, login, activity, source-test selectors, README/design index and QA; preserved previous QA and all Phase1 research/history.
- Reason: owner selected first concept and requested professional/premium refinement across the working app.
- Outcome: warm-white/forest system, restrained type, composer above answer, quote-first evidence, mobile date/scope stacking, selected autofill profile, labelled audit scroll region. Deferred route code reduces initial JS without private-data caching.
- Verification:38 backend tests pass (one existing warning),12 frontend tests and production build pass;28 DOM observations without page overflow;11 sampled contrast pairs≥4.5; same-size generated/real comparison and browser workflows checked. No passwords/real company data included.
- Build scope: raw initial JS373780→327143; offline gzip109217→99536; CSS6799→8650 gzip. No page-load/query-latency improvement claimed. Hosted deployment check pending commit/push; subject `feat: refine Cortex into the Atlas Professional workspace`.
- Outstanding: public smoke/remote verification, broader accessibility/usability/web-vitals and free-backend cold-start limitation. No paid resources, backend capability expansion or permissions changed.


## 2026-10-09T21:32:06+05:30 — Phase3 publication audit

- Published backend [03de2dc](https://github.com/NoirPrimordial7/cortex-ai/commit/03de2dcca937a1fa90fd8516f3d47b2d10b90500) and live UI/integration [a370378](https://github.com/NoirPrimordial7/cortex-ai/commit/a37037838f2eb0c13b5d5a01a598438a732e7bc4). Verified each successful push against remote main; working tree clean at the integration checkpoint.
- GitHub API confirms main/PUBLIC and the actual assistant screenshot at its committed path (62669bytes). Visibility/collaborators unchanged. Phase1 research and canonical Phase2 demo fixture compare unchanged to647e4af.
- Staged review passed99 intended paths: no exact local runtime passwords, credential signatures, private databases/uploads or generated dependency/build directories. Markdown targets, JSON syntax, JPEG integrity and whitespace checks passed.
- Files changed here: development log and changelog, to record actual publication hashes/outcomes. No application source changes. Local smoke check required the authorized shell network boundary after the sandbox blocked localhost sockets; backend/frontend remain running, with no LAN exposure.
- Next: reproduce the demonstration on target hardware, obtain the college rubric, then improve held-out evaluation and bounded clause/lineage/security limitations listed in implementation status. No general LLM or production completion claim. Audit commit subject `docs: record verified Phase 3 publication`.

## 2026-10-09T21:21:45+05:30 — Phase3 live Evidence Studio and integration verification

- Files added: frontend/ (real React screens, lockfile and tests), backend/evaluate.py, docs/implementation/, docs/design/screenshots/ and browser/contrast reports, diagram11 Mermaid/DOT/SVG/PNG and design-qa.md. Changed backend citation rank/assertion, README, roadmap/docs index, design/learning reports, diagram manifest, acceptance status and decision index; no Phase1 research or fixture bytes removed.
- Reason: implement owner-approved Evidence Studio, expose a watchable localhost server, connect all screens to the permission-safe core, and document actual boundaries instead of claiming planned features.
- Outcome: live5173 frontend/8000 backend with hot reload; nine main page families plus own history/audit; exact source/authority display, private upload/review/version UI, current grants/roles and fail-closed history. Browser TXT upload remains private pending review; no live grants changed.
- Verification: final backend29 tests pass (7.42s; one TestClient deprecation warning), frontend8 tests pass and strict TypeScript/Vite build passes; Ruff/pip checks pass, npm audit zero at checkpoint. Fixture12/12 outcomes,15/15 authorized peers,10/10 span/hash checks; one conflict positive only.50 warm in-process repeats median9.422ms/P9510.502ms, not browser latency.46 real layout observations have no horizontal overflow;12 sampled contrast pairs≥4.5; approved concepts compared against actual captures after corrections.
- Corrections: source passage16px/metadata12px; show actual source-kind/authority rank; distinguish open-ended/expired from missing approval; stable shared session context for hot reload; guard rapid source responses and asked-question labels. Browser selector/file-picker limitations disclosed; no headless fallback used.
- Final visual correction: immediate viewport resizing yielded stale/scaled native capture frames; affected tablet/mobile JPEGs were recaptured after a separate settled state observation. Filename widths are CSS viewport targets, not exact JPEG raster dimensions. No application source changed during this correction.
- Previous published backend: [03de2dc](https://github.com/NoirPrimordial7/cortex-ai/commit/03de2dcca937a1fa90fd8516f3d47b2d10b90500), verified local/remote main equality. Current milestone subject: `feat: deliver live Evidence Studio and verified local workflows`; actual hash/publication recorded after push.
- Outstanding: held-out independent labels, broader clauses/lineage/rejection explanations, robust parser sandbox, denial audit/retention, full-browser automation and production/multiworker safeguards. Core has no LLM/NLI/vector/agents; college percentage/rubric unresolved. Repository PUBLIC, unchanged; no paid/cloud services.


## 2026-10-09T20:30:22.0109156+05:30 — Phase 3 backend vertical slice

- Added backend/app/, backend/tests/, initial Alembic migration/config, exact requirements.lock, backend/README.md and ADR0005; changed .gitignore to exclude TypeScript build metadata. No research removed.
- Reason: owner approved Phase 3 and offline Evidence Studio implementation; build real authorization, ingestion, validity, authority, conflict/abstention and exact citation workflows before optional AI.
- Outcome: local fictional seed, opaque sessions, explicit ACLs, current owner/history checks, private TXT/PDF/DOCX review, offline finite claim answering, administration endpoints and redacted audit. One-process exclusive gate is a documented throughput trade-off.
- Verification: 29 backend tests passed in 6.71s, including concurrent revocation and protected endpoint matrix; one Starlette HTTPX adapter deprecation warning. pip check and Ruff check passed. Initial ingestion tests assumed no pre-existing notice policy and were corrected to isolate that test input; no fixture labels changed. No model, paid API or cloud used.
- Outstanding: frontend publication/visual QA, held-out retrieval/conflict evaluation, robust parser sandbox, chunk ACLs, multiworker deployment, general semantic reasoning and denial auditing. Frontend is still a separate uncommitted work unit.
- Publication: commit subject feat: implement permission-safe offline evidence core; hash and remote equality to be recorded after push. Current remote is PUBLIC; no visibility change.

## 2026-10-09T16:59:30+05:30 — Phase 2 publication audit

- Files changed: docs/planning/QUALITY_REVIEW.md, docs/logs/DEVELOPMENT_LOG.md and docs/changelog/CHANGELOG.md; no application files added or removed.
- Reason/outcome: record actual publication evidence and close planning quality review before requesting owner approval for Phase 3. All required planning contracts, backlog, diagrams, learning guides and static design artifacts are present; application implementation remains unstarted.
- Published units: [0dd651e0c329e612c73a3548c4a807b35b576973](https://github.com/NoirPrimordial7/cortex-ai/commit/0dd651e0c329e612c73a3548c4a807b35b576973) architecture/security; [9534cd3e393820dd9f20901c4266f00f277aefb8](https://github.com/NoirPrimordial7/cortex-ai/commit/9534cd3e393820dd9f20901c4266f00f277aefb8) delivery/design. Both pushes succeeded and local/remote main hashes matched; working tree clean after the second unit.
- Verification: complete local link/report/fixture/secret-pattern checks passed; staged diff and whitespace reviewed before publication. Visually inspected all ten diagram exports and seven concept boards. Live GitHub design gallery loaded its five embedded previews at expected dimensions; API Mermaid sequence and database ERD rendered and were visually inspected. These checks do not execute application acceptance tests.
- Cleanup/limitations: stopped the temporary local documentation preview server. No headless browser used after owner chose editable sources; local static HTML layout, responsive interaction, dependency locks and all functional/security/performance results remain unverified. No paid resources or model downloads.
- Outstanding: owner approval of Phase 2 and proposed Evidence Studio direction; confirm hardware/team/time and milestone rubric during implementation handoff. Full A estimate 13–26h; tomorrow completion at risk. GitHub reports PUBLIC; visibility was not modified.
- Audit commit: resolve `docs: verify Phase 2 planning publication`; its own hash and final remote equality are reported after successful push, avoiding a self-referential hash.

## 2026-10-09T16:54:00+05:30 — Phase2 delivery plan and visual experience

- Added: docs/README.md; docs/planning/{UI_UX_PLAN,IMPLEMENTATION_BACKLOG,DEVELOPMENT_SEQUENCE,PLANNING_SOURCES,QUALITY_REVIEW}.md; docs/design/{README,DESIGN_RESEARCH,DESIGN_SYSTEM,UI_COMPONENTS,USER_JOURNEYS,WIREFRAMES,UI_REVIEW}.md; seven SVG artwork sources/seven PNG previews, contrast-checks.json, four static HTML sources and responsive CSS; ADR0004. Changed README, roadmap, decision index, schema/API contracts, fixture publication timestamps, database/ingestion exports and tracking files; no deletions. Exact manifest in Git diff.
- Reason/outcome: complete implementation-ready priorities/dependencies/acceptance and original visual identity, maintaining clear distinction between planned screens and functional software. Full A estimate aligned to task ranges13–26h; tomorrow's delivery depends on unconfirmed capacity. Secondary/mock/static work is not application development.
- Corrections: source-kind requirement prevents informal policy answer after HR access revocation; separate fictional publication from effective/upload dates; idle-session last_seen_at included; API supports explicit version view; database export layout made vertical; source parser diagram says no remote fetch, without claiming a hardened network sandbox.
- Verification: all12required planning documents,6learning guides,6required design reports; local Markdown/HTML/image links;11fixture hashes/exact quote spans;SVG XML/PNG dimensions; desktop concepts1440×1000;6selected normal-text color pairs now meet4.5contrast; strict credential-pattern scan; Phase1 evidence/source files unchanged to06334ae. Initial PNG check wrongly required both dimensions>300 for a valid wide sequence overview; corrected shape-agnostic integrity threshold and exact desktop-frame checks, then passed.
- Visual inspection: desktop3concepts, moodboard/directions, mobile/wireframe boards and key diagram exports inspected. Only SVG→PNG concept artwork, not local browser screenshots. Owner declined headless fallback; sources preserved. Public source-access limits documented; no copyrighted source screens copied.
- GitHub: previous milestone [0dd651e0c329e612c73a3548c4a807b35b576973](https://github.com/NoirPrimordial7/cortex-ai/commit/0dd651e0c329e612c73a3548c4a807b35b576973) pushed; local/remote main matched. Live GitHub README architecture image loaded (naturalWidth1640) and visually inspected. Added .gitattributes in that milestone to keep fictional policy bytes LF-stable across checkouts.
- Outstanding: final gallery publication audit; owner plan/visual approval before Phase3; all functional tests/locks/hardware/resource behavior unimplemented. Current repository public; no visibility/access change.
- Commit: resolve `docs: plan delivery backlog and Cortex visual experience`; actual hash and remote verification recorded after successful push.

## 2026-10-09T16:37:31+05:30 — Phase 2 architecture and evidence contracts

- Authorization: owner approved Phase 1 and requested full Phase 2 planning; Phase 3 remains unapproved.
- Files added: docs/planning/{REQUIREMENTS,TECH_STACK,SYSTEM_ARCHITECTURE,DATABASE_SCHEMA,SECURITY_MODEL,RAG_PIPELINE,API_DESIGN,DEMO_SCENARIOS,TEST_STRATEGY,MVP_ACCEPTANCE_CRITERIA}.md; demo/fixture-spec.json and 11 fictional policy TXT files; docs/learning/ six explanation documents; docs/DIAGRAMS.md; docs/diagrams/ ten .mmd/.dot/.svg/.png export sets plus MANIFEST.json; three numbered ADRs. Changed README and tracking files; no deletions. UI/backlog/sequence drafts remain unstaged for the next complete unit.
- Reason/outcome: select an offline-capable local stack and define tenant/ACL, validity, authority/conflict, citation, API and test contracts before implementation. All behavior remains planned; fictional policy files are test specifications, not ingested application data.
- Environment: authenticated account NoirPrimordial7; main local/remote matched 06334ae on inspection. GitHub API now reports PUBLIC; previous Phase 1 records reported PRIVATE. No visibility mutation performed; owner informed. Only non-sensitive fictional documentation is published.
- Verification: local link checks, 11 policy hashes and exact quote offsets, 10 complete export sets, strict credential-pattern scan and Git whitespace passed; Phase 1 research/source artifacts compare byte-equivalent after newline normalization to 06334ae. Graphviz exports visually inspected; flow grouping adjusted for readability.
- Tooling limits: bundled Graphviz WASM/sharp exported real SVG/PNG from paired DOT source; Mermaid source preserved. In-app browser could not reach local static preview, Chrome control unavailable. Owner chose editable sources and reporting limitation instead of headless Playwright. No browser screenshot claim; no paid services.
- Outstanding: UI concepts/backlog integration and final planning audit; exact dependency locks, all application tests, hardware/team/40% rubric unknown; owner review before Phase 3.
- Commit: resolve `docs: define Cortex AI architecture and security contracts`; actual hash/push outcome recorded next once available.

Historical Phase 1 entries below concern repository and research maintenance. Phase 2 authorizes planning/static design artifacts only; functional application development remains pending approval.

## Initial repository inspection and setup — Phase 1A

- Date: 2026-10-09, Asia/Calcutta (UTC+05:30); exact ISO timestamp appended below before commit.
- Files: added README, ignore rules, changelog and this log; no files removed.
- Reason: establish a private, traceable research workspace without overwriting existing work.
- Outcome: `E:/Cortex AI` was empty; no Git history or local instructions found. Network-enabled `gh api user` and GitHub connector agreed on NoirPrimordial7. Repository lookup returned absent; `gh repo create --private` succeeded. Initialized `main`.
- Verification: no credentials printed or stored; configured Git identity inspected; staged files and private remote to be reviewed.
- Outstanding: research reports and citation verification; Phase 2 remains pending approval.
- Commit reference: [8107c1c0ca8b3d565a99867e1f847c577560406d](https://github.com/NoirPrimordial7/cortex-ai/commit/8107c1c0ca8b3d565a99867e1f847c577560406d); private origin/main push verified, local/remote hashes equal, working tree clean immediately afterward.

- Commit preparation timestamp: 2026-10-09T14:59:58+05:30

## 2026-10-09T15:26:04+05:30 — Phase 1B–1G: research documentation and quality review

- **Added:** docs/PROJECT_OVERVIEW.md, RESEARCH_SUMMARY.md, COMPETITOR_ANALYSIS.md, FEATURE_COMPARISON.md, LITERATURE_REVIEW.md, RESEARCH_GAPS.md, PROPOSED_IMPROVEMENTS.md, RESEARCH_SOURCES.md, PROJECT_ROADMAP.md, ARCHITECTURE_NOTES.md, QUALITY_REVIEW.md; docs/decisions/README.md; docs/logs/RESEARCH_LOG.md; research/papers/README.md, competitors/README.md, experiments/README.md; research/SOURCE_INVENTORY.json and SOURCE_CHECKS.json.
- **Changed:** README.md, .gitignore, docs/changelog/CHANGELOG.md and this log. No removals or prior work overwritten.
- **Reason/outcome:** produce a primary-source-backed research dossier, explicit unknowns and reproducible evaluation proposal while staying within research-only scope. All 13 candidate families and 15 academic works covered; 76 primary references registered.
- **Verification:** authenticated remote/visibility check from initialization; live technical/bibliographic review; targeted recent-paper full-text limitations; 75 reachable HTTP references with one DOI publisher 403 and author-hosted alternative; repaired canonical Elastic link; relative Markdown links pass; required-structure/count/ignore/secret-pattern/staged-diff checks before push.
- **Local tooling:** temporary read-only documentation/link verification scripts under ignored outputs/; no application code, dependencies, model downloads, dataset generation or paid resources. Machine-readable research verification outcomes intentionally versioned; temporary scripts/output are excluded.
- **Outstanding:** recommendations are unimplemented; deadline/hardware/team and dataset/license inputs unknown; Phase 2 approval pending. Product behavior not independently tested; paper results not reproduced.
- **Commit:** [b129223edd5730e101dbb877799ac1fa05d299e1](https://github.com/NoirPrimordial7/cortex-ai/commit/b129223edd5730e101dbb877799ac1fa05d299e1); origin/main push succeeded and remote hash matched.

## 2026-10-09T15:30:11+05:30 — Phase 1G: verified research publication

- **Files:** changed docs/changelog/CHANGELOG.md, this log, RESEARCH_LOG.md and QUALITY_REVIEW.md to record actual publication outcome; no removals.
- **Reason:** tie research and verification records to the immutable dossier commit once its hash exists.
- **Outcome:** b129223edd5730e101dbb877799ac1fa05d299e1 pushed successfully to https://github.com/NoirPrimordial7/cortex-ai on main. Authenticated repository metadata still reports private and default branch main. Local HEAD and remote refs/heads/main matched; Git status clean immediately afterward.
- **Checks:** all 19 requested files meaningful/present; 13 profiles × 15 fields; 15 paper records; 13 matrix rows; 76 inventory/check IDs and URLs aligned; 75 reachable primary references, one recorded publisher DOI restriction with author alternative; local links valid; no internal web citation tokens; no unexpected staged files or strict credential-pattern hits; ignore fixtures pass. First whitespace check found extra EOF blank lines; normalized and reran successfully before commit.
- **Outstanding:** research benefit not tested; deadlines/resources/domain/license inputs unknown; no Phase 2 approval. No app, actual experiment or paid service created.
- **Audit reference:** final verification commit identified by `docs: record Phase 1 verification and publication`; exact final hash and remote equality reported in user briefing, avoiding recursive self-hash updates.

## 2026-10-09T21:49:43+05:30 — Phase3 shared demo preparation

- Changed backend settings/main, frontend login/types/styles/read-only screen controls and .gitignore. Added backend demo/hosted adapters, regression tests, ADR0006 and docs/implementation/SHARED_DEMO.md; updated README/decision index. No research, fixtures, credentials or prior history removed.
- Reason: owner requested remote teammate demo and all fictional account autofill; explicitly authorized free Render backend. Outcome: opt-in finite fictional picker, normal authentication retained, exact Host/HTTPS Origin and Secure cookie settings, disposable single-worker seed and hosted mutation403. Local upload/governance remain interactive.
- Verification:38 backend tests and11 frontend tests pass; strict TypeScript/Vite build and Ruff pass. Rendering uses the in-app browser only; no headless fallback. Previous publication6545b20.
- Outstanding: create Render free service, wire verified backend URL, redeploy exact commit and check real HTTPS sign-in/citations/access denials before claiming live completion. Free service sleeps/resets; histories are shared per fictional profile. Commit subject: feat: add fictional demo account picker and hosted safety boundary.

## 2026-10-09T21:53:30+05:30 — Phase3 assigned hosting route

- Published5ec7ca8e2a53bd55ef3ae5081991ef4c0d2a77f5; origin/main confirmed identical. Render Free service cortex-ai-demo created from that exact commit, assigned https://cortex-ai-demo.onrender.com. No paid instance/disk or collaborator change.
- Added frontend/vercel.json; updated shared-demo guide. Reason: bind real assigned backend to same-origin API and SPA routes with explicit no-store. Vercel production project aliases are public; previews/build URLs retain standard protection. Backend allows only the two verified project HTTPS origins.
- Verification: Git/staged actual-credential scan passed before prior push; production frontend alias HTTP200 without account login. Service build and full hosted API/browser checks still pending; no functional deployment claim yet. Commit subject: deploy: connect Vercel frontend to free Render demo backend.

## 2026-10-09T21:58:11+05:30 — Phase3 shared deployment verified

- Added sanitized hosted-smoke JSON and genuine hosted picker/answer browser captures. Updated README, backend README, local run/status/test/hosting guides, changelog and development log. No application source changed in this audit update.
- Outcome: https://cortex-ai-three-kappa.vercel.app public without Vercel membership; Render Free backend live. Vercel READY deployment dpl_13t6423uXxh18PvhJsM2Af1zm5tX sourcec6ca3f6b27764ed4945012140067d8ced60ea4a0. Prior feature5ec7ca8/configurationc6ca3f6 pushes each verified against origin/main. Repository visibility unchanged, no collaborators/paid instances/disks/API services added.
- Verification:38 backend/11 frontend tests, build/Ruff pass.52 live Vercel-proxy assertions passed across five fictional profiles: Secure cookies, normal auth, disabled-user denial, current/historical policy, two-source conflict abstention, missing/restricted abstention, citation span/hash, cross-tenant denial, CSRF/Origin, shared upload/governance denial. Genuine browser account autofill/sign-in/20-day evidence/source verified. Local picker returns200/five profiles. Same crafted fixture; no held-out accuracy/security certification.
- Limits: free sleep/cold start and ephemeral resets; histories shared by profile; hosted uploads/governance read-only. Automatic deployments can invalidate sessions. Final provider source/HEAD status checked after this audit push. Commit subject: docs: record verified public demo and account picker.

## 2026-10-09T22:38:00+05:30 — Phase3 visual redesign research and concepts

- Added docs/design/redesign/ brief, performance JSON, genuine current login/assistant captures, original generated visual concepts and local reference-capture ignore rule. Updated docs/design/README.md, changelog, research log and this log. No application source or Phase1 research removed or overwritten.
- Reason: owner requested a substantial Awwwards-inspired redesign, speed improvements and all-screen responsiveness. Outcome: official daily/latest-completed-month/annual references inspected; actual current employee answer/citation flow audited; three separate design directions prepared for selection.
- Verification: normal fictional account autofill/sign-in and real annual-leave/source inspection in the in-app browser; small four-request HTTP baseline for root/verified API endpoints; existing build raw/gzip sizes. Initial API probes accidentally omitted /v1; 404s retained and excluded, canonical routes verified in main.py and successful samples recorded. Current desktop captures inspected. No headless browser, paid resource, new implementation or performance guarantee.
- Code-review findings: eager route imports and session-before-picker request sequence are candidates to measure after selection. Permission/revision checks and private-evidence invalidation must be preserved.
- Outstanding: choose one displayed concept; then implement all screens, responsive/keyboard/theme QA, actual build/regression checks and post-change performance comparison. Concepts are artwork, not application screenshots. User selection is required by the applied Product Design ideation skill; no new architecture decision made.
- Previous verified published commit: c1fa59e0e75f66994fbd363695554a92a027c0f6. This update subject: design: document Awwwards redesign concepts and measured baseline. Exact commit and remote equality are reported after publication; automatic hosted redeployment may reset fictional sessions.
