# Cortex visual redesign — research and selection brief

Recorded 2026-10-09T22:35:00+05:30. Baseline application commit: `c1fa59e0e75f66994fbd363695554a92a027c0f6`.

Status: visual exploration; no redesigned application implementation or deployment claimed. The owner requested a substantial improvement in appearance, interaction speed and responsiveness, with current Awwwards references. The existing backend, permission checks, exact citations and actual workflows remain constraints.

## Verified visual references

| Reference | Evidence observed on October 9, 2026 | Useful design lesson for Cortex |
| --- | --- | --- |
| [Maria Vasilyeva Portfolio](https://www.awwwards.com/sites/maria-vasilyeva-portfolio), [actual site](https://www.mariavasilyeva.com/) | Official Awwwards homepage shows Site of the Day **Oct 9, 2026**, score 7.28. Actual site captured and visually inspected: editorial rules, edge navigation, whitespace and project imagery. | Strong typographic hierarchy, lightweight separation and deliberate composition. Keep policy content readable; do not reproduce portfolio imagery or immersive navigation. |
| [Why Zero](https://www.awwwards.com/sites/why-zero), [monthly index](https://www.awwwards.com/websites/sites_of_the_month/), [actual site](https://why.zero.university/) | Latest completed month listed is **September 2026**. Official detail shows SOTD Sep 7 and a green/white palette. Actual entry screen captured: terrain/water imagery and “Draw a zero” interaction. The entire interactive experience was not audited. | Restrained vivid green, a clear focal point and cohesive identity. An enterprise policy question should not require a drawing gate or 3D assets. October is incomplete; no October monthly winner claimed. |
| [Lando Norris](https://www.awwwards.com/sites/lando-norris), [annual winners](https://www.awwwards.com/annual-awards/winners), [actual site](https://landonorris.com/) | Annual winner index selected Site of the Year and linked this project; detail lists SOTD Nov 17, 2025. Actual homepage captured and inspected, including lime accents and strong identity. This is a completed annual reference, not a claim of a 2026 annual winner. | Confident scale and a memorable lime/ink palette. Transfer visual principles rather than racing photography, cursor effects or marketing content. |

Source facts come from official pages and browser observations. Design lessons are our interpretations. Some official detail pages timed out through the text web tool; the in-app browser resolved them. Award status is not evidence of accessibility, enterprise suitability or runtime performance. Local research captures are retained outside tracked artifacts; links provide attribution.

## Bounded audit of the current interface

The public demo was inspected through its actual login → Maya fictional account autofill → normal sign-in → annual leave question → cited source flow. All screenshots below are genuine captures from this redesign session, not generated concepts.

- [Login](01-login-before.jpg): the demo picker is discoverable and retains normal sign-in. The large split hero occupies half the desktop width without helping the evidence task.
- [Assistant empty state](02-assistant-empty-before.jpg): a top bar, full-width notice, eyebrow, page heading, subtitle, scope toolbar and empty-state heading accumulate before the composer. At the captured width the full page is taller than the browser viewport; initiating a custom question requires reaching the bottom of this hierarchy.
- [Supported answer](03-assistant-answer-before.jpg): the answer and exact source are genuine and correctly aligned to the selected date. The compact source column wraps the passage heavily, metadata labels are small, and the oversized reserved conversation area separates the answer from follow-up input.

These are layout judgments from the captured desktop flow, not a complete accessibility audit. No current mobile usability or contrast certification is asserted. Preserve the useful existing features: explicit scope/date, citation selection, source inspection, current-user display, normal authentication and honest demo limits.

## Preserved three-direction exploration

Three separate ImageGen concepts are prepared from actual Cortex and reference captures. They are **visual proposals**, not working pages. Visible selection numbers follow the order of displayed generated images.

- **Displayed 1 — [Atlas Editorial](concepts/atlas-editorial.png):** luminous paper surface, forest accents, editorial typography, compact light navigation and a source annotation column.
- **Displayed 2 — [Night Signal](concepts/night-signal.png):** charcoal workspace, electric lime accent, minimal navigation rail, focused conversation and a distinct evidence reading area.
- **Displayed 3 — [Cobalt Workspace](concepts/cobalt-workspace.png):** white/cobalt system, horizontal navigation, integrated answer/document reading split and crisp compact controls.

Each image is a separate generated result, shown once in the main chat in this order and copied here without altering its original. The prompt requested 1440×1024; the tool returned approximately 1487×1058 artwork. These image dimensions are not browser viewport measurements. Generated typography/content and unsupported visual affordances are to be reconciled with real contracts when implementing the selected direction. Existing disclosures, exact citations and permission boundaries take precedence over artwork details.

All concepts use the same real demonstration: Northstar Works, Maya employee, India full-time, as-of 2026-10-09, annual leave 20 working days/year, LEAVE-2026, HR policy, TXT line 2, effective interval 2026-01-01 to 2027-01-01 and reviewed authority rank 100. No invented confidence percentage, agent activity or semantic capability is allowed. Two fonts maximum; body and passages stay readable. The Product Design ideation workflow requires selection before implementation; the owner subsequently selected displayed option 1 and requested a more professional, premium refinement.

## Performance baseline and implementation checks

[Measured samples](performance-baseline.json) contain four serial GETs per route, including unsuccessful initial probes with a documented path correction. Correct API routes were confirmed in `backend/app/main.py`.

| Measurement | Observed baseline | Interpretation |
| --- | --- | --- |
| Public root document | Median 28.39 ms | HTTP response time from this machine, not page-load/LCP. |
| `/api/v1/health` | Median 267.08 ms | Proxy/network/backend wall time; four successful requests. |
| `/api/v1/demo/accounts` | Median 270.57 ms | Four successful requests; bodies/credentials excluded from report. |
| Existing local JS build | 373,780 bytes raw; 109,217 gzip | Offline gzip measurement of existing `frontend/dist`; not proof of remote content encoding. |
| Existing local CSS build | 29,050 bytes raw; 6,799 gzip | Same scope limitation. |

This small unthrottled sample is not a controlled benchmark. Cold starts, query latency, LCP, INP and CLS were not measured. Render Free sleeping/restart latency cannot be removed by a visual redesign.

Code inspection identifies two candidates to verify experimentally: eager imports of every page in `frontend/src/App.tsx`, and the session check before Login mounts and fetches public demo profiles. Consider route-level lazy loading and a carefully bounded public-profile load path. Do not persist demo passwords or private evidence, weaken revocation checks, or remove session polling to improve a number.

After selection, implement the chosen visual system across login, shell, dashboard, assistant, documents/upload/detail, conflicts, history, administration and audit. Test actual behavior at 1440, 1024, 768, 390 and 320px; inspect wrapping/overflow, touch targets, keyboard navigation/focus, reduced motion and both themes. Source evidence must reflow below the answer on small screens without being discarded. Keep dates and policy scope visible and usable.

Run existing meaningful frontend/backend regression checks and a production build. Compare actual same-viewport captures against the selected concept. Repeat the baseline with the same method, separately report route chunks and browser measurements when the in-app browser supports them. Publish only after integration checks; report exact commit, remote equality and live deployment verification. No headless browser fallback, paid upgrade, speculative performance claims or backend capability expansion is authorized by this redesign.

## Owner selection and implemented refinement — 2026-10-09T23:17:29+05:30

Displayed option 1 was selected. [Atlas Professional](concepts/atlas-professional.png) is the single revised concept generated from that feedback before build. Its restrained warm-white/forest treatment is now implemented across the real app. Native typography, readable exact evidence, real scope/date controls and truthful capability/demo disclosures take precedence over literal generated typography.

[Actual capture gallery and validation](implemented/README.md), [final build sizes](performance-build-final.json), [root design QA](../../../design-qa.md) and [ADR0007](../../decisions/0007-atlas-professional.md) distinguish reference artwork, working screenshots and diagnostic comparison sheets. Public deployment verification will be recorded after the implementation commit reaches the existing main branch.
