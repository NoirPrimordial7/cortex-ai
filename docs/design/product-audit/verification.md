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
