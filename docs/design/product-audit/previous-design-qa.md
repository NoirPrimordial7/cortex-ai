# Fieldbook Ask Cortex design QA

final result: passed

2026-10-10, Asia/Calcutta. Bounded local implementation gate; no identified remaining P0/P1/P2 blocker in the inspected flow. This is not a production, pixel-identity or comprehensive accessibility certification. [Previous Atlas QA](docs/design/evidence-desk/selected/previous-design-qa.md) is preserved.

The owner selected the exact attached Fieldbook image plus Reference House editorial refinement, then explicitly locked identity and requested compact citations, a smaller answer, persistent follow-up composer, collapsible inspector and independently tested mobile views. Those requested UX changes supersede duplicated quote blocks and oversized type in the generated reference. No further variation was generated after that instruction.

## Visual comparison

[Combined reference and actual implementation](docs/design/evidence-desk/selected/implemented/comparison-final.jpg) was opened and inspected as one input. Both frames1536×1024; same annual-leave question, India full-time, date2026-10-10, approved20-day answer and LEAVE-2026 source. The generated frame includes a companion mobile strip; the actual desktop has a working inspector. Separate actual mobile frames establish responsive behavior. Local mode omits the hosted-only notice; deterministic UI captures include the complete conditional shared-demo disclosure.

| Surface | Result |
|---|---|
| Fonts/type | Loaded self-hosted Fraunces500/600 and DM Sans400–700 confirmed in the real DOM. Answer36px desktop,26–28px mobile; long answer24/21px with1.55/1.6 line height. Wordmark38/29–32px, source27/30px, passage20/21px. Character is retained with more comfortable reading density. |
| Spacing/layout | Forty-pixel desktop and16–20px mobile gutters;8/16/24/32px rhythm. Controls precede original question/answer/citations. One compact source row per citation; detailed metadata appears only in inspector. Composer has reserved space, avoiding overlap. Independent reading/source scroll areas have visible native scrollbars. |
| Color/tokens | Paper#fbfaf5, forest#153b2e, sage#edf0e5, limited lime#dce8b4. Dark forest variant and amber conflict states. [Sixteen sampled text ratios](docs/design/evidence-desk/selected/implemented/contrast.json) pass4.5:1, minimum5.38; control border samples pass3:1, minimum3.17. Sampling is not whole-app WCAG certification. |
| Assets/icons | Editable text wordmark and existing Phosphor icons; decorative assistant icons hidden from accessibility tree. No raster hero, logo illustration or generated art ships in the app. OFL font licenses bundled. |
| Content | Real API answer, exact authorized passage, version, exclusive-end validity, locator, source type and authority rank. No invented reviewer identities. Conflicts say Unresolved conflict; unsupported/clarification states do not fabricate citations. Full hosted history/reset/read-only disclosure retained. |

## Resolved findings

| Finding | Priority | Fix/recheck |
|---|---|---|
| Native dialog allowed Tab to reach browser chrome | P2 | Explicit Tab/Shift+Tab boundary wrapping alongside native modal inertness;320/390/768 keyboard tests pass. Escape/Back restore selected citation focus. |
| Sticky mobile composer covered citation row | P2 | Reserve separate scrolling reading area; compact horizontal mobile composer. Final320/390 real captures and focused-citation bounds show no overlap. Keyboard-like360px height uses natural page scrolling. |
| Legacy label margin inflated gaps; legacy surface overrode warm paper | P2 | Reset control-label margin; explicitly apply selected paper to assistant body. Recaptured and compared final screenshots. |
| Form boundaries too subtle | P2 | Distinct light/dark control-border tokens. Measured3.17/4.67:1 boundaries. |
| Asynchronous answer could erase a typed follow-up draft | P2 | Clear submitted draft at request start and preserve subsequent input; regression verifies it survives response. |
| Closing desktop inspector could lose keyboard position | P2 | Inspector close returns focus to persistent show/hide control. |
| Earlier tablet navigation CSS hid expanded menu text | P2 | Assistant menu explicitly retains14px link labels and13px actions at all widths; browser matrix checks readable label size. |
| Contrast measurement raced source loading | QA test | Wait for exact passage before reading styles; final complete13-scenario run passes. |

## Verification

13 frontend regressions across4 suites;13 Playwright scenarios;38 backend authorization/evidence regressions; Ruff; strict TypeScript/Vite production build; npm audit0 vulnerabilities. Backend has one existing Starlette/httpx deprecation warning. No backend source or production state was changed.

Automated Chromium320/390/768/1280/1440 in both themes: no page-level horizontal overflow; citations/context, desktop collapse/reopen, mobile focus trap/return, long-answer reading and follow-up submission, stale original-question labeling, source denial/revocation, clarification, abstention, conflicts, reduced motion, targeted200% text scaling and keyboard-like viewport reduction. Deterministic API fixtures isolate UI cases. Backend tests verify security independently.

Real in-app-browser local session: allowed20-day annual-leave response and exact source; remote-work conflict abstains, second REMOTE-B source exposes3-day passage with Unresolved conflict. Actual320/390 answer/evidence captures,1536 desktop, loaded font check and console with no warning/error entries inspected. No real credentials were read or recorded.

React review: unconditional hooks, listener/modal cleanup, lazy assistant stylesheet/fonts, separate inspector component, request epochs on source/query responses, current backend/session authorization gates preserved. No HTML injection, new source prefetch, client evidence persistence, animation dependency or production API added. [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) used as an additional review reference; names/autocomplete, labels, focus, semantic actions, overflow and reduced motion checked.

Build: initial JS327.82kB raw/100.19kB gzip versus327.14/100.01 before this change. Assistant route CSS15.40/3.77kB gzip; route JS13.90/4.61kB gzip, shared chunks separate. Two self-hosted Latin WOFF2 files73,552bytes, font-display swap. Build sizes do not measure query/API/CDN latency, cold start or Core Web Vitals.

P3/follow-up limits: physical phone keyboards, Safari/other engines, screen-reader validation, full browser zoom, controlled slow-network/vitals and broader usability remain unverified. Some earlier CSS layers remain on other routes; this change is scoped to Ask. Public deployment is pending owner authorization; no main merge or deployment performed.
