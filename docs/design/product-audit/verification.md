# Issue #4 implementation and verification log

Review branch: `codex/full-product-ux`. Main and production remain unchanged.

## Reconciliation

- Retained Fieldbook implementation: `422ed5769bb644edb99c000428131dfd8b8ad320` and toolkit checkpoint `a89ff66b513e5eb55afed3f4040c40e90331f4e1`.
- PR #2 merged at `aa3623ce2b1328d10a15c76aca647fd8acbce5eb` before those implementation commits.
- Latest main `2919a6dfe649db097d132a3e0dac1e9464cde304` includes PR #5, whose proposed shared-shell commit `624c70af004f03a133c4ec607c452a697d6b9cf6` contains no file changes.
- Merge checkpoint `12ea705` preserves both histories. Source tree compared equal before/after reconciliation.
- GitHub production deployment record references main `2919a6d`; this is a deployment record, not proof that its live assets match the proposed redesign.

## Current-run baseline

Real backend fixtures isolated in ignored `outputs/audit-live-before`, database snapshot retained for equivalent after fixtures. Original local-data and preview are preserved. Browser captures cover permitted routes for Maya, Ravi, Isha, Orbit and Noor at 320,390,768,1024,1280,1440. Captures are real screenshots, not generated images. Dynamic timestamps/request IDs can differ between runs; policy documents and grants remain identical.

Observed issues: different mastheads between Ask and other routes; empty desktop evidence pane; internal answer scrolling; mobile administration forms preceding document text; repeated source quotations in history; audit horizontal scrolling; excessive role checkboxes per person; oversized promotional whitespace.

## Verified group 1: shared shell and stylesheet

One masthead/navigation on every authenticated route and shared tokens for login. Conditional navigation and query route guards follow current session actions. Native modal for navigation and shared sources preserves focus and Escape. Removed Atlas and Fieldbook CSS overlay files/imports; one stylesheet owns typography, color, spacing, controls and responsive primitives. Mobile Ask follows the document scroll and evidence opens separately. Empty inspector is closed; desktop inspector opens with an answer source. Source quotation appears once, with secondary version/authority details disclosed on demand.

Validation: TypeScript/Vite build; 13 frontend tests; 6 Playwright shell tests across all eight routes, six widths, both themes, mobile navigation focus trap and return; actual local mobile preview inspected. This checkpoint is a foundation, not final visual approval of individual pages. Full route/state capture and functional review remain in progress.
## Verified group 2: sign-in clarity and session errors

Current published Maya sign-in was reproduced through the actual profile picker: profiles200, login200, session200. The intermittent owner-reported failure did not occur in that sample, so no hosted outage/root-cause claim is made. Frontend improvements preserve normal authentication and add visible service waiting, a90-second login timeout, explicit failed-session errors instead of silently swallowing them, and a profile reload action for disposable backend resets. Disabled Noor remains a real authentication denial with an explicit explanation. Local sign-in/sign-out for all four active profiles and disabled Noor passed. Regression checks include the post-login session failure.

The new error handling is on the review branch; published frontend is intentionally unchanged pending review.
## Verified group 3: all policy and governance routes

- Overview prioritizes Ask and document browsing; current API counts remain truthful and recent repeated answers are grouped only in the overview. History retains every query.
- Library adds category and title sorting/search using existing permitted summaries, removes dominating raw IDs, and uses accessible phone cards without inventing approval fields.
- Document details automatically open a current approved version (or the first available version), put reading first, collapse version history/add-version controls, show exclusive-end validity, and open review in a focus-managed dialog. Upload uses selected-filename feedback, supported-format/10MiB validation and clear review-before-publish instructions.
- Dedicated History, Conflicts and Audit routes replace the boolean Activity component. History disclosures show compact citations; exact passages require fresh authorized reads. Conflict comparison fetches both current authorized sources, compares them side by side on desktop and sequentially on mobile, and preserves abstention. Audit renders mobile event cards with sanitized fields and full request IDs.
- Permissions uses separate people/document views, compact people rows, focused editors, explicit pending-change summaries and confirmation. Shared demo controls remain view-only; own-account editing remains disabled; policy revision preconditions are preserved.
- Shared PageHeading, Badge, FormField, ResponsiveTable, PolicySource, SourceInspector and native SourceDialog support the same visual system. Theme preference alone can be saved; no credentials/evidence are stored by the new UI.

Validation:21 frontend tests,39 backend tests (one existing Starlette/httpx deprecation warning), Ruff pass, npm audit0 vulnerabilities. Browser coverage:15 answer/evidence/status/accessibility scenarios,6 all-route shell checks and8 governance/validation scenarios. Six widths include1024. Production-build browser tests avoid development hot-reload crashes encountered during an earlier run. A temporary enlarged-text test stylesheet is served from the same test origin so application CSP remains intact. Real before/after light captures and independently restored after dark captures are finalized; no general screen-reader/physical-phone certification is claimed.

## Verified group 4: team profiles and preview-origin diagnosis

Auronix demo display names now use Aditya Gholar, Arya Dhumal, Ashwin Gudur and Yashraj Bansal. The separate disabled test account remains. Exact seed-identity matching changes presentation without replacing existing database users, credentials or grants; a backend regression checks unchanged user records and credential bytes. Fresh fictional seeds use the new names. Original account keys and demo permission examples remain.

The owner supplied the failing preview URL. A real diagnostic request from its Origin returns403 “Origin not permitted” before credential verification. Published production alias login200/session200 still passes. The frontend now explains this specific configuration error and provides the approved published-demo link. Real isolated-backend denial at all six widths and the unit regression pass. The precise Render allowlist addition is [prepared but not applied](preview-origin-change.md), preserving the owner's production approval constraint.

## Completed visual and functional review

652 actual retained captures:198 before,230 light after,224 dark after. Each final theme has216 geometry observations with no page overflow and no sampled visible target below44px. New state baselines are explicitly absent. Screenshots were inspected across all six widths and both themes. Corrections included44px audit navigation, citation focus above the desktop composer, visually hidden skip-link artifacts in full-page captures, and mobile dialog-heading wrapping.

29 deterministic UI regressions,14 real sign-in/role/workflow/reflow/origin tests,10 capture tests,2 performance tests and1 published-alias login smoke pass (56 unique selected browser tests). Actual private upload/approved temporal claim/download integrity/employee denial passed on disposable local data. Backend39/frontend21/Ruff/build/npm audit pass.

Measured login loading exposed CLS0.1025; responsive loading space reduced the fresh local sample to0.0205. Six-width loading CLS stays below0.1. Entry JavaScript96.24kB gzip/CSS7.09kB. Local LCP/CLS/query and separately sampled hosted health are recorded; no field INP or forced Render cold-start claim. [Full issue-by-issue pass/pending report](README.md).

Main and production remain unchanged. Preview server5173 and gallery8003 remain available. No merge/deploy; owner visual review and the proposed shared-backend origin change remain pending.

## Final visual correction: mobile People controls

Direct screenshot review caught a legacy library column label leaking into the mobile People action cell. Its “Uploaded” pseudo-label clipped the full-width edit button even though document scrollWidth stayed within the viewport. Removed all obsolete unlabelled-column pseudo-label fallbacks and duplicate People width declarations. Existing explicit data-labels now provide each table's own semantics. Governance checks assert the edit button's complete viewport bounds and absence of the wrong label. Final capture measurements also reject clipped visible controls. All six widths and both themes recaptured and checked; the final gallery contains the corrected page.

## GitHub review handoff

Existing [PR #6](https://github.com/NoirPrimordial7/cortex-ai/pull/6) already tracked this branch. Updated its title/body with final behavior, validation, gallery and pending origin configuration; preserved its open/non-draft state and attached it to this task. Main remains2919a6d. Review commits are pushed; no merge or production deployment.
