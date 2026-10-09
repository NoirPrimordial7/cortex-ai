# Cortex AI — mobile-first design direction and quality gate

**Latest status,10October2026:** The shared full-product design is owner-approved and published; [current production verification](production-release/README.md). Earlier implementation statements below are preserved history.

**Current update, 2026-10-10:** Ask Cortex now uses the selected Fieldbook identity, with an independent reading area, persistent composer and dedicated mobile evidence view. Verified at 320/390/768/1280/1440 in both themes. [Selected direction and checks](evidence-desk/selected/README.md). The owner explicitly prioritized Ask before extending the design to other routes; production deployment remains a separate step.

**Status: design brief and required tests, no application UI changes made in this branch.** Existing production baseline: Atlas Professional (`6c68994`) and later publication audit (`577ce5e`).

## Critique from real published screenshots
- Desktop answer and evidence are legible but the result looks like a conventional dashboard: thin muted branding, familiar sidebar, status strips and repeated separators. The unique concept—why the selected policy governs—needs more visual emphasis.
- On phone the full sequence is unusually long: demo disclosure, page title, scope controls, question input, answer, citation, then evidence. A tapped citation should reveal its passage promptly and make return to answer easy.
- The dashboard's repeated answers look like fixture activity rather than a useful working surface. Improve hierarchy without inventing analytics or concealing duplicate events.
- Restraint is useful, but muted color and tidy cards alone are not identity. Add a considered typographic system, distinctive document/edition treatments, source linking and compact interaction patterns.

## Design target: The Evidence Desk
Make Cortex look like a beautifully typeset working reference desk rather than a generic chatbot or fintech admin template. Calm warm off-white, deep mineral ink and one disciplined accent; expressive but extremely readable titles; editorial small labels and source folios; strong contrast; fine rules that organize evidence, not divide every card. No stock imagery, no AI gradients/glows, no oversized empty hero cards. Original mark and brand; no copying award-winning assets.

### Desktop / laptop
- Use a flexible working grid, with answer and evidence visible simultaneously at >=1100px where room permits.
- Make the policy citation a first-class element (source number, title, effective interval, position and approval), not a small anonymous footnote.
- Keep question composer in sight as content grows, without covering citations or trapping keyboard focus.
- Allow moderate density on 1280px laptops without forced horizontal scrolling.

### Phone 390/320px
- Prioritize task: contextual compact header → date/scope (foldable only with selected values visible) → question → answer and citation.
- On citation tap, open an accessible focused evidence sheet or linked view with explicit Back to answer; ensure screen-reader labels and focus restoration. Never show unauthorized names or metadata.
- One-column source reading at comfortable line lengths; visible contrast, tap targets >=44px; no sideways scrolling for policy content.
- Real mobile keyboard: composer and send action must remain reachable; test narrow viewport, 200% text zoom and safe-area spacing.
- Hide decorative navigation but never hide required trust metadata.

### Functional constraints
- Preserve offline evidence mode labeling (not 'general AI').
- Same backend endpoints, permission checks, current-user/tenant boundaries, date semantics, support hashes and abstention.
- Hosted shared demo retains its view-only notice and no production passwords, users or secrets in Git.
- No paid fonts/services and no material increase in initial JS without benchmark justification.

## Implementation order
1. Audit interaction screenshots and pick one of three distinct design directions (do not ship unapproved broad redesign).
2. Extract tokens/components: typography, layout, source folio, question composer, evidence card/sheet, controls, statuses.
3. Implement the assistant desktop/mobile and citation focus behavior; add tests.
4. Propagate same design language to login, dashboard, library, versions, conflicts and admin; remove old overlapping CSS overrides in reviewed stages.
5. Record Playwright screenshots at 1440/1280/768/390/320, light/dark, login/answer/abstention/conflict; verify actual DOM accessibility and no overflow.
6. Run 38+ backend security tests, 12+ frontend tests, TypeScript/Vite build and remote smoke (counts may grow; log actual outcomes).
7. Review measured bundle sizes and Core Web Vitals, compare identical-state screenshots, push branch and request review. Deploy only after verification.

## Useful tests
- Unauthorized document canary never enters stage inputs or shown titles/counts.
- Citation opens correct exact allowed span, without confusing page scroll/focus on mobile.
- Revoked source closes/clears derived evidence on next request.
- Dates and policy populations remain visible while scrolling or are recoverable via labeled control.
- Equal-authority conflict does not produce fabricated single answer; both permitted sources are inspectable.
- No horizontal page overflow at 320; keyboard navigation, focus trap/restoration, reduced motion and screen reader announcements checked.
- Distinguish Vercel CDN response from Render warm API and cold starts; compute median/p95 only from labeled series.

## Decision
Use Codex with focused frontend skill and Playwright; changing between Sol/other reasoning models will not solve design by itself. Require a visual direction choice, deliberate code review and measured QA. Preserve working production release until a better tested version is ready.
