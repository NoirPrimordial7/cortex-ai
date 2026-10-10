# Approved Ask direction — full workspace rollout

10 October 2026. PR #8 remains a draft on `codex/premium-ask-refinement`. The owner's latest review (00:12:32 UTC, baseline `316988c067dfc5976cbfb8c8553af57b0c2f4df9`) approves extension of the visual direction, while reserving merge and deployment for complete release review. Production main remains `a3c3a314e4fe5f93813c85591108195acf197c21`.

Open the [actual screenshot gallery](gallery.html), the [required before/after comparisons](SCREENSHOTS.md), or the [original dimensions and hashes](captures.json). Local browser review: http://127.0.0.1:8007/rollout/gallery.html. The live local application is http://127.0.0.1:5173.

## Design decisions

The existing forest `#173d30`, ivory `#f7f6ef`, warm white `#fffef9`, sage `#edf0e5`, and dark-theme tokens remain. Fraunces carries policy reading and headings; DM Sans carries controls and metadata. Bundled fonts and licenses remain intact. No skill, dependency, copied reference asset, or backend change was added.

Three complementary compositions were considered within the already-approved direction: catalogue and edition rail for browsing; full-width comparison and journal for records; a working form with secondary context for tasks. Each serves the actual page instead of applying the Ask folio everywhere.

| Requested group | Before | Implemented layout and purpose |
|---|---|---|
| Library | Uniform small-text table | Category index and linked source catalogue. Search, category and sort remain; document counts derive only from the permitted API response. Filters have an explicit reset and result total. |
| Document Details | Collapsed editions, boxed source within boxed panel; editions below reading on phone | Joined edition rail and reading room; native edition chooser comes before reading on phone. Full authorized immutable text, approval/validity/scope, published/uploaded dates, hashes, review and download remain accessible. |
| Conflicts | Repeated abstention paragraphs and nested tinted cards | Compact request records distinguish actual timestamps. Only the expanded record shows the complete abstention and permission-checked exact claims. Comparison has source jump links, locators, authority, exclusive validity, full-context inspection and a follow-up route. |
| Activity | Long sequence of large cards | Continuous answer register with actual timestamps, status filtering and ten-record pages. Expansion retains the complete answer; fresh citation authorization still gates passages. |
| Permissions | Repeated introductions and plain table | Searchable people directory with initials, clear roles/account states and mobile management rows. Document grants use a selection rail and separate role/individual grant columns. The existing revision checks, change review, cancellation, own-account protection and read-only guards remain. |
| Audit | Every event and UUID expanded into long phone tables | Journal grouped by UTC day, action/outcome filters, twelve-event pages and optional full request-ID disclosure. No actor, analytics or other unsupported data is invented. |
| Upload | Isolated centered form with repeated format/review instructions | Source preparation form beside a forest panel explaining the actual extraction → review → approval process. On phone the form comes first. Formats, size, unsupported-file errors and read-only/loading behavior remain. |
| Dashboard | Generic start card and boxed columns | Forest working desk with role-aware actions and real accessible-document/unresolved-query counts. Quiet collection and recent-answer registers follow. Existing repeated-answer grouping remains explicit. |
| Login | Disconnected story and framed form | Joined forest introduction and ivory sign-in surface; compact mobile brand and readable stacked profile controls. Normal login, demo autofill, disabled-account denial, Origin errors, retry, cold-service feedback and preserved inputs remain. |

The [previously researched Awwwards references](../REFERENCES.md) inform the catalogue's clear content roles, purposeful collection navigation and the task surface's primary action. These are interpretations of grouping, navigation and composition, not copied visuals or merely larger typography.

## Latest review polish

- Ask scope label is shorter while its accessible name remains “Policy scope”; 16px mobile fields are enforced throughout the workspace.
- Ask conflict shortcuts focus the comparison or follow-up field. Conflicts has authorized source jump links with accessible focus.
- Screenshot focus is cleared before each capture; keyboard focus is separately tested.
- Enabled dark primary actions use pale ivory-green. Disabled primary actions use subdued tint/muted text, with a regression assertion proving their background differs. This fixes a CSS-specificity issue found during visual review.
- Source dialogs return to the correct page: “Back to conflicts” or “Back to activity.”

## Evidence and critique

There are **200 unmodified actual Chromium screenshots / 100 before-after pairs**: ten views (nine requested pages plus document grants) × five widths (1440, 1280, 768, 390, 320) × both themes × both phases. Before is the approved Ask baseline; after is the completed rollout. Real fictional admin `ravi` is used for task/management views; auditor `isha` for Audit. Login captures are taken before credential autofill. Same documents and profiles are used across phases; local query/audit events evolve as verification runs, so those records are not claimed to be byte-identical datasets.

All required widths and themes are directly available in the gallery, including the full source claims in the expanded conflict. Original PNGs are untouched and the manifest records actual dimensions and SHA-256. Actual browser review led to shorter native select labels at 320px, denser catalogue rows, removal of repeated collapsed-conflict explanations, explicit mobile edition selection, and corrected dark disabled states. Full claims remain long where necessary; jumping and record pagination improve navigation without shortening evidence.

Existing backend response limits remain: Activity reads up to 30 permitted requests and Audit the latest 100 sanitized events. Pagination retains every returned item and filters reset the page. It does not implement historical server pagination or extend retention. Long version labels can still truncate within native selects; the full selected label and source metadata appear in the reading area. Phone edition metadata is available by selecting each edition; published/uploaded metadata and the hash are under Source integrity.

## Verification

| Check | Result |
|---|---|
| Frontend unit/component tests | 27 passed |
| Backend isolated pytest | 39 passed; one existing Starlette/httpx deprecation warning |
| Backend Ruff | Passed |
| TypeScript + Vite production build | Passed |
| Changed-file Prettier check | Passed |
| Chromium fixture regression | 34 scenarios: Ask 17, governance 8, shell 6, new record/filter behavior 3 |
| Real local browser checks | Five role-boundary flows, two short-viewport 200% reflow emulations, two loading/draft flows, authorized conflict jump/dialog focus, mobile immutable-edition check, both-theme contrast/mobile-field check |
| Disposable editable backend | Actual private upload → review → download hash → denied employee read passed on isolated port 8008 |
| Firefox / WebKit | 28 targeted scenarios per engine, covering evidence, governance and new record/filter behavior |
| Visual matrix | No horizontal page overflow across the captured five widths and both themes |
| Gallery | All 120 required original images load; 200 original files indexed |

Measured text samples in both themes meet 4.5:1 (lowest sampled ratio 5.18:1), including primary actions and disabled controls; source controls retain the prior boundary/focus checks. Keyboard focus return, modal Escape/trapping, exact quotations, denied reads, loading separation, session drafts, all Ask answer statuses and reduced motion remain covered. The 720×450 device-scale-factor-2 case is desktop 200% **reflow emulation**, not a physical-device or native zoom claim.

During setup, captures needed explicit waits for profile availability/sign-in completion and the correct theme key. New fixture tests needed exact accessible select labels and a summary-only answer selector. The field-size probe initially found inherited 14px search text; it was fixed and the probe passed. These intermediate failures are not counted as passing runs. Browser CLIs use separate output directories to avoid trace teardown collisions.

Vite reports entry JS **96.39 kB gzip**, Ask **5.17**, SourceInspector **1.10**, shared CSS **9.94** (approved Ask baseline CSS **7.93**). These are displayed compressed asset sizes, not API/CDN duration, cold start or Core Web Vitals. Routes remain lazy-loaded; no dependency was added. API authorization, evidence request cancellation, parallel all-or-nothing conflict reads, immutable source slices and session-only drafts are unchanged.

Physical phones, soft keyboards, notches, native Safari and screen-reader speech still need device review. No field INP, new API timing or cold-start claim is made. Review remains local and on the draft PR; no Origin configuration, merge, deployment or production data was changed.

## Reproduce

From `frontend`, run the existing frontend/backend dev servers first. Commands below use the already installed Playwright browsers and real fictional local data:

```powershell
npm test
npm run build
$env:CORTEX_ROLLOUT = 'after'
npx playwright test e2e/rollout-live.spec.ts e2e/rollout-quality-live.spec.ts --workers=1 --output=../outputs/rollout-review
npx playwright test e2e/assistant.spec.ts e2e/governance.spec.ts e2e/shell.spec.ts e2e/rollout-records.spec.ts --output=../outputs/rollout-regressions
$env:CORTEX_LIVE_WORKFLOW = '1'
$env:CORTEX_WORKFLOW_URL = 'http://127.0.0.1:5173'
$env:CORTEX_REFINEMENT_PHASE = 'after'
npx playwright test e2e/role-routes-live.spec.ts e2e/reflow-live.spec.ts e2e/refinement-live.spec.ts --workers=1 --output=../outputs/rollout-live
```

The editable workflow test must use an isolated seeded backend and its exact approved local Origin, not a production/shared deployment. Gallery indexing from repository root: `.venv/Scripts/python.exe docs/design/premium-refinement/rollout/build_gallery.py`.

Implementation commits are recorded in [COMMITS.md](COMMITS.md). The final request is a complete visual/release review, with merge and deployment still requiring the owner's approval.
