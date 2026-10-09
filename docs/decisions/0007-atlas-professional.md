# ADR0007: Atlas Professional workspace

- Recorded: 2026-10-09T23:17:29+05:30
- Status: accepted implementation of owner-selected first concept, with requested professional/premium refinement.
- Phase/module: Phase3 frontend. Supersedes the visual treatment in ADR0004; its history and evidence contracts remain preserved.

The owner selected Atlas Editorial after three distinct concepts, then requested a more professional appearance. A single revised [Atlas Professional concept](../design/redesign/concepts/atlas-professional.png) was generated before implementation. [Reference research](../design/redesign/REDESIGN_BRIEF.md) informed hierarchy and restrained composition; it does not prove product usability or awards eligibility.

Use warm white, forest accents, a light navigation rail, smaller sans-serif headings, quote-first evidence and consistent controls across existing routes. Retain Segoe UI/system body and Georgia wordmark: no remote font dependency. Reuse Phosphor icons; the design requires no decorative raster assets. Avoid animation and preserve reduced-motion handling. Keep dark theme and mobile navigation.

Move the question composer above the answer; retain the actual submitted-question label separately so typing a follow-up cannot relabel previous evidence. Authorized exact source excerpt appears first; expandable context uses the same escaped authorized source text. Dates, scope, authority, actual citations and conditional shared-demo disclosures remain present. No confidence scores or unsupported AI capabilities are introduced.

Use React lazy imports for authenticated route code and Suspense with a recoverable error boundary. The boundary gives a generic reload action without raw error details; shell navigation and sign-out remain outside it. Cache only JavaScript modules normally in the browser; no private evidence, passwords or authorization response cache is added. Current session polling, revision invalidation, source epoch guards and backend checks remain intact.

Trade-offs: one new CSS theme layer preserves the previous component behavior; a later cleanup can consolidate tokens after owner review. Initial JavaScript shrinks, CSS grows, and total route bytes are not claimed to shrink. Native date formatting follows browser locale. Narrow audit tables retain all columns in an explicitly labelled keyboard-focusable scroll region; a mobile hint makes scrolling discoverable.

Files: frontend/src/atlas.css, App.tsx, main.tsx, RouteBoundary.tsx/tests, SourcePassage.tsx, Assistant.tsx/tests, Login.tsx and Activity.tsx; design captures, QA and logs. Verification: 38 backend tests and frontend regression/build checkpoint, real local browser flows and bounded same-viewport comparison. See [current QA](../../design-qa.md) for final counts/limits and publication records. Commit reference: resolve subject `feat: refine Cortex into the Atlas Professional workspace`; actual hash follows successful publication.

Outstanding: held-out usability, full assistive-technology/browser matrix, controlled web-vitals testing, Render cold-start constraints. No security or hosting-plan change.
