# Atlas Professional implementation design QA

Checked 2026-10-09T23:17:29+05:30, Asia/Calcutta. **Final result: passed for the bounded local implementation checkpoint**, with no remaining identified P0/P1/P2 visual blocker in inspected views. This is not a pixel-identity, full WCAG or usability certification. Public production deployment and browser smoke are now verified below. [Previous Evidence Studio QA](docs/design/redesign/previous-design-qa.md) is preserved.

The owner chose displayed option 1, Atlas Editorial, then requested a professional/premium refinement. A single revised [Atlas Professional source](docs/design/redesign/concepts/atlas-professional.png) was generated before implementation. The source and genuine employee assistant capture were reviewed together in [initial](docs/design/redesign/implemented/comparison-initial.jpg) and [final](docs/design/redesign/implemented/comparison-final.jpg) comparison inputs. Source and implementation each measure1487×1058px; same annual-leave question, identity, date, scope and authorized LEAVE-2026 evidence. Local deployment lacks the hosted-only disclosure; this is a documented state difference, not evidence of production notice removal.

| Fidelity surface | Finding and decision |
|---|---|
| Typography | Two native families: Segoe UI/system body and Georgia wordmark. Page32px and answer up to34px intentionally bound the generated larger display typography for professional density. Source20px desktop/16px narrow, metadata13px, navigation14px. No external font blocking. |
| Layout | Light224px rail, quiet white top bar, question above answer, date/scope before composer, quote-first right evidence column37%; tablet/mobile stack evidence below answer. Native multiline textarea and original question label are retained for real editing and honest provenance. |
| Color | Warm white, forest primary action and pale sage quote/active navigation; corresponding dark-forest mode. Eleven sampled computed text/background pairs pass4.5:1, minimum5.90. Transparent backgrounds resolved against the actual surface; this sample does not certify all states. |
| Assets | No hero raster or decorative art required. Existing Phosphor semantic icons and initial avatars reused. Generated logo glyphs are interpreted using the existing text wordmark/icon, without inventing a new downloadable asset. |
| Copy/content | Real approved claim, exact authorized source span, validity/version/location/authority; integrity notice only after source response. Dates follow native locale. Honest offline mode and full shared-demo history/reset/read-only disclosure retained conditionally. |

| Finding | Priority | Fix and recheck |
|---|---|---|
| Initial source/navigation were smaller than the selected refinement | P2 | Source18→20px desktop, navigation13→14px; final combined comparison inspected. |
| At320px the intrinsic date control cramped the half-width scope layout | P2 | Date/scope stack at360px and below; final controls269px wide and44px tall, no document overflow. |
| Mobile menu close control could overlap the wordmark | P2 | Expanded rail brand offset44px; menu Escape/focus return checked. |
| Native full-page upload capture reflowed into a narrow stale frame | QA capture | Rejected that frame; settled DOM upload intro227px, form269px; replaced using genuine viewport capture. No headless fallback. |
| Narrow audit time column wrapped excessively and remaining columns were hard to discover | P2 | Table min-width620px, named keyboard-focusable region and mobile scrolling hint; retains every field in an inner scroll area. |
| Failed deferred route code could blank the workspace | P1 reliability | Generic recoverable route error boundary; navigation/sign-out outside; test rejects raw private error details. |

28 saved DOM observations across desktop1487,1024,768 and mobile390,320 show zero page-level horizontal overflow. Desktop and small versions of login, dashboard, assistant, library, versions/review, uploads, conflicts, history, administration and audit were inspected; long pages require scrolling. Supported answer/source selection/context disclosure, Ctrl+K focus, mobile Escape, dark/light switching and normal fictional sign-in exercised. No ACL/review/upload mutation performed in this design session. Exact source escaping, date/scope clearing, revocation and stale citation rejection retain frontend regression tests. Backend source unchanged;38 backend tests pass, one existing adapter-deprecation warning. Final frontend12 tests and strict TypeScript/Vite build pass, including route failure recovery.

React review: hooks remain unconditional with explicit cleanup; route imports statically analyzable; shared source component prevents history importing assistant code; existing session polling/revision guards preserved; no evidence/credential persistence, dangerous HTML or authorization prefetch added. Visible labels, focus states, native disclosure and reduced-motion handling retained.

Performance: offline-gzip initial JS99536bytes versus baseline109217 (~8.86% smaller); raw327143 versus373780 (~12.48% smaller). CSS8650 versus6799 gzip grows (~27.23%). Route chunks load separately; total transferred bytes depend on routes visited. These are build measurements, not a claim of lower LCP/INP/query latency. Render Free cold starts remain. Full browser automation/headless/web-vitals tooling not used under the owner's constraint.

P3/outstanding: token-layer consolidation, additional assistive-technology/browsers, persistent theme preferences, held-out usability, controlled web-vitals/slow-network measurements and production hosting/pipeline limitations. Public smoke, commit/remote equality and deployment status must be recorded after push.

## Public release recheck — 2026-10-09T23:24:44+05:30

**Final result remains passed for the bounded implemented/released checkpoint.** Vercel READY and Render Live report implementation commit [6c68994](https://github.com/NoirPrimordial7/cortex-ai/commit/6c689949b79f3d08253ed145178a5ca9be23cc40). Exact frontend entry verified on the public alias. Normal profile autofill/sign-in and approved20-day answer with exact source verified in the released app. Full conditional hosted history/reset/read-only disclosure remains visible. Desktop1487 and mobile390 DOM have no horizontal page overflow; source stacks below the answer on mobile.

[Published comparison](docs/design/redesign/implemented/comparison-hosted.jpg) puts the generated reference and real public application together at matching1487×1058 dimensions and matching identity/date/scope/evidence. All five fidelity surfaces retain the local result; the full truthful demo notice appears as its own quiet line instead of shortening away limits. [Public desktop](docs/design/redesign/implemented/hosted-assistant-1487.jpg) and [mobile](docs/design/redesign/implemented/hosted-assistant-390.jpg) are actual browser captures. No remaining identified P0/P1/P2 blocker in these inspected views; no pixel identity or exhaustive accessibility assertion.

[52 HTTP smoke assertions](docs/design/redesign/hosted-smoke.json) pass on the fictional fixture; release/restart timing explicitly recorded separately from fresh post-release browser checks. [Repeated four-sample HTTP measurements](docs/design/redesign/performance-http-final.json) show no defensible API-latency improvement; cold starts and web vitals remain outside that measurement. Public screenshots may exclude scrollbar pixels or reflect full-page native framing; CSS widths and DOM bounds are recorded independently.
