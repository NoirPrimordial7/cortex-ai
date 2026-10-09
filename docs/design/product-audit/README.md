# Cortex full-product review — Issue #4

Reviewed 10 October 2026 on `codex/full-product-ux`. **The local implementation passes the checks below and is ready for owner visual review. Main and the published interface remain unchanged.** The owner explicitly approved the shared backend preview-origin update, which is now live and functionally verified; see [the applied change and limits](preview-origin-change.md).

[Interactive before/after gallery](gallery.html) · [running gallery](http://127.0.0.1:8003/gallery.html) · [running application](http://127.0.0.1:5173/assistant) · [implementation checkpoints](verification.md)

## Reconciliation and published source

PR #2 merged before the retained Fieldbook implementation. The review branch preserves the Fieldbook/toolkit head `a89ff66` and merges main `2919a6d` at `12ea705`; the tree was compared before editing. Main's PR #5 shared-shell proposal contained no file changes. No blind cherry-pick, checkout reset or replacement of working files was used.

An isolated build of main was compared to the public production alias: all ten served JavaScript chunks match after normalizing only the eight-character hashes in imported asset filenames. [Recorded deployment/chunk hashes and method](deployment-verification.json). This establishes the published JavaScript's match to current main; it does not establish that this review branch is deployed, or attest to backend configuration. The protected Vercel build URL was not treated as a public application test.

## Issue-by-issue result

“Pass” below means the bounded local Chromium implementation and functional checks passed, followed by inspection of genuine application screenshots. Owner approval and hosted release verification remain separate.

| Issue #4 finding | Result | Resulting behavior |
|---|---|---|
| P0: reconcile branch/main/production | Pass | Histories preserved; published main JavaScript independently compared. |
| P0: one shell and design system | Pass | All authenticated routes share masthead, navigation, theme and role guards. Login shares fonts, colors and controls. |
| P0: CSS overlays | Pass | Atlas/Fieldbook overlay files and imports removed; one semantic stylesheet and reusable components replace special route shells. No `!important` fixes. |
| 1. Ask empty/answer | Pass | Inspector starts closed; answer opens a source; compact citation previews and accessible follow-up composer. |
| 2. Ask mobile | Pass | Natural page flow; separate evidence dialog; date/scope remain available; short viewport and long follow-up scenarios checked. |
| 3. Evidence | Pass | One exact authorized passage; validity and context organized; secondary version/rank/integrity in disclosures. |
| 4. Login | Pass locally; approved preview origins pass backend checks | Clear profile selection, waiting/retry/session failure states, disabled test denial and specific origin-error guidance. Loading space reduces layout shift. |
| 5. Overview | Pass | Ask and permitted documents lead; real API counts and distinctive recent answers; full history retained separately. |
| 6. Library | Pass | Search/category/title sorting, touch-friendly phone rows. Summary API limitations respected; approval/effective fields shown in version details. |
| 7. Document/version detail | Pass | Current approved version and reading lead; history/uploads disclosed; exclusive end dates and protected download retained. |
| 8. Upload/review | Pass | Selected filename/type/size, TXT/PDF/DOCX validation, 10 MiB limit, focused reviewed-claims dialog. Real private upload/approval exercised. |
| 9. Conflicts | Pass | Dedicated route; fresh authorized two-source comparison; desktop columns/mobile sequence; abstention preserved. |
| 10. Activity | Pass | Compact expandable records; fresh access check before source disclosure; denied/revoked evidence cleared. |
| 11. People/permissions | Pass | People and document-grant views; focused editor; pending change summary; explicit confirmation, revision preconditions and truthful read-only mode. |
| 12. Audit | Pass | Redacted events, full wrapping request IDs and mobile cards instead of a horizontal table. |
| 13. Site-wide execution | Pass | Forest/ivory/sage, restrained lime, Fraunces headings/DM Sans body, consistent controls and spacing, visible focus, reduced motion. |

The spacing rhythm uses 4/8/12/16/24/32/48 px; type tokens separate captions, controls, reading, question, answer and titles. Answers use 34 px desktop/29 px mobile, with longer answers switching to reading sizes. Color and density are consistent across policy and governance screens. No generated artwork is shipped.

## Genuine screenshots and comparison limits

The gallery contains **652 actual captures: 198 retained before, 230 light after and 224 dark after**, across 320, 390, 768, 1024, 1280 and 1440 px. Its filters cover login, overview, library, document detail, upload/review, empty/answered/conflict Ask, focused evidence, history, conflicts/comparison, people/editor/change confirmation, document grants, audit and disabled sign-in. New dialogs/comparisons and the origin denial are explicitly marked when no retained baseline exists.

All canonical policy files, grants and versions derive from the same isolated database snapshot. Light and dark runs restore that snapshot independently. Real requests create history/events, so query IDs, timestamps and audit entries differ; this is not a pixel-identical synthetic fixture. The intentionally unapproved-origin captures use a separate local backend with the same fixture and normal authentication boundary. Before names remain historical; after names are the owner's Auronix team display names. The role keys in filenames remain stable for comparison.

| Demo profile | Existing identity / permission example | Representative after views |
|---|---|---|
| Arya Dhumal | `maya`, employee | [Ask 1440](screenshots/after/maya/ask-answer-1440.jpg), [Ask 390](screenshots/after/maya/ask-answer-390.jpg), [evidence 320](screenshots/after/maya/evidence-320.jpg) |
| Aditya Gholar | `ravi`, reviewer/admin | [people 1440](screenshots/after/ravi/people-1440.jpg), [people 320](screenshots/after/ravi/people-320.jpg), [review 390](screenshots/after/ravi/review-390.jpg) |
| Ashwin Gudur | `isha`, auditor | [audit 1440](screenshots/after/isha/audit-1440.jpg), [audit 320](screenshots/after/isha/audit-320.jpg) |
| Yashraj Bansal | `orbit-user`, other tenant | [empty library 390](screenshots/after/orbit/library-390.jpg) |
| Disabled test account | `noor`, disabled negative test | [actual denial 390](screenshots/after/noor/disabled-signin-390.jpg) |

The names change presentation and fresh fictional seeds only. Existing account IDs, tenant IDs, emails, passwords, roles, activity and database records are preserved. The demo adapter matches exact seed identities; it does not rename real users. Student IDs and the guide's phone number from the owner's screenshot are not copied.

Original PNGs remain in ignored `outputs/product-audit`; tracked JPEGs are quality-88 review copies without resizing. Full-page screenshots record natural document height; dialog screenshots use a 900 px viewport. Desktop answer captures scroll to the bottom so the sticky composer occupies its natural position without covering a citation. Screenshot files live in documentation and are excluded from the production bundle.

## Verification matrix

| Check | Result / scope |
|---|---|
| Backend | 39 pytest tests pass; Ruff passes. Existing Starlette/httpx deprecation warning remains. Auth/tenant/CSRF/temporal/conflict/citation invariants pass. |
| Frontend | 21 tests across seven suites pass; TypeScript/Vite production build passes; npm audit reports zero vulnerabilities. |
| UI browser regression | 29 tests pass: 15 answer/status/accessibility scenarios, six shell checks across eight routes × six widths × two themes, eight governance/validation checks. Deterministic API fixtures are labeled separately from real backend tests. |
| Actual sign-in/roles/workflows | 14 tests pass: four active/one disabled profile on the running preview; all eight routes and denied APIs for each profile; private upload/review/download/hash and employee denial; two real-data reflow checks; real origin denial at all six widths. |
| Real gallery capture | Ten profile/theme tests pass. Each theme has 216 recorded geometry observations: zero page overflow, zero clipped visible controls and zero sampled visible interactive targets below 44 × 44 px. Evidence/dialog screenshots and the extra origin state are additional captures. [Measurements](after-observations.json), [dark measurements](after-dark-observations.json). |
| Keyboard/accessibility | Native dialogs trap Tab/Shift+Tab, support Escape/Back and restore focus. Desktop citation focus remains above composer; 200% text scaling, 720 × 450 reflow emulation at DPR2, reduced motion and sampled contrast pass. |
| Contrast | Sixteen sampled text pairs across both themes: minimum 5.919:1; sampled control boundary minimum 3.569:1. [Ratios](contrast.json). These samples are not whole-app WCAG certification. |
| Performance/browser | Two tests pass: actual profile-loading CLS at all six widths and separate browser/API/hosted health sampling. [Measurements](performance-results.json), [six-width loading](login-loading.json). |
| Published production alias | After the approved restart,52 HTTP functional assertions and one fresh Chromium login test pass. Initial unauthenticated session401 is expected. [Results](post-origin-hosted-smoke.json). This tests the unchanged published frontend, not the review UI. |
| Current review branch/build | Original403 Origin mismatch resolved by the explicitly approved exact-origin configuration update. Both current origins pass backend login/session/query/citation200; wrong CSRF/unapproved Origin still403. [Results and protected-browser limitation](preview-origin-change.md). |

Total selected browser checks: **56 unique tests passed** across regression, real workflows, captures, performance and hosted login. Opt-in live tests are intentionally disabled in the default test run, preventing accidental public/demo mutations.

## Measured performance and limitations

Current production build: entry JavaScript approximately 96.24 kB gzip; CSS 7.09 kB gzip; Ask lazy chunk 4.03 kB gzip; largest individual route chunk, document detail, 4.72 kB gzip. Shared lazy chunks are additional transfers. Two self-hosted fonts total 73,552 bytes and use `font-display: swap`.

Unthrottled local Chromium sample at 1280 × 720: fresh login LCP92 ms/CLS0.0205; Ask navigation LCP44 ms/CLS0.0342; after answer interaction LCP372 ms; actual local query round-trip105 ms. The six-width login-loading sample has maximum CLS0.0169. An earlier sample exposed CLS0.1025 and prompted the loading-space fix. These local samples are not field web-vitals scores or mobile-network estimates.

No qualifying Event Timing entries were observed; the recorded zero event-duration observation is **not measured zero INP**. Hosted health independently returned200: Render835 ms and Vercel proxy337 ms in this sample. The service was neither restarted nor forced idle, so cold start remains unknown. Native Safari, physical mobile keyboards, assistive-technology testing and field INP remain release checks.

## Release status

Ready for local visual review in [existing PR #6](https://github.com/NoirPrimordial7/cortex-ai/pull/6). Its existing open/non-draft state is preserved; no duplicate PR was created. No code merge or production UI release has been performed. The separately approved Render configuration restart is complete; protected-preview browser/proxy verification remains pending in the owner's authenticated browser. Approve the visual gallery before release. After any authorized deployment, repeat hosted functional/visual checks against its exact source and public URL.
