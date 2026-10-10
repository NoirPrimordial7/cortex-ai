# Cortex premium refinement: baseline audit

10 October 2026. Issue [#7](https://github.com/NoirPrimordial7/cortex-ai/issues/7), baseline `a3c3a314e4fe5f93813c85591108195acf197c21`, feature branch `codex/premium-ask-refinement`. Production remains on the approved release. This sprint's first review gate is an improved Ask Cortex experience; proposals for other screens await that review.

## Evidence and method

The existing application at `http://127.0.0.1:5173` and its backend were kept running. Real profile sign-in and actual API responses were used, with no fixture replacement in the route captures. All accessible routes, document/version/access dialogs, answered/conflict/evidence states and five account profiles were captured at **320, 390, 768, 1024, 1280 and 1440 pixels**, in light and dark themes. 448 PNGs and 432 geometry observations are retained locally under `outputs/product-audit/premium-before[-dark]`. Both five-profile capture runs passed. Observed page overflow, clipped visible controls and visible touch targets below 44px: zero in these runs. This is geometry coverage, not proof that every screen is aesthetically finished.

Local admin sees 10 documents because an existing fictional browser-verification notice remains in local data; production has 9. Query runs add ordinary shared-profile activity. Data was not reset, and screenshots are not altered to manufacture a comparison. Representative captures are in `before/`; full raw captures remain in the ignored outputs directory.

## Confirmed defects

| Priority | Finding and reproduction | Implementation location | First milestone |
|---|---|---|---|
| P1 | Completed annual-leave answer is simultaneously labelled “Checking policy access, dates and authority…” while its real citation request is delayed. Actual request was held and subsequently continued to the backend. | `frontend/src/pages/Assistant.tsx:202` awaits inspection before clearing question busy state. | Separate query processing from source inspection; preserve server validation and denied-source clearing. |
| P2 | An unfinished question, selected historical date and contractor scope are lost after Library → Ask navigation. | `frontend/src/pages/Assistant.tsx:94` stores the draft inside a route remounted by `frontend/src/App.tsx`. | Keep only unfinished input/context in memory for the current authenticated session; discard on sign-out/account change. |

Both reproduced with `frontend/e2e/refinement-live.spec.ts` at the baseline: **2 passed**. `before/loading-reproduction.json` records the controlled real-network scenario. A delayed source check itself is expected; the misleading policy-processing state is the defect.

## Design improvements, separately from defects

| Screen | Actual observation | Proposed refinement after review |
|---|---|---|
| Ask empty | At 1440px the examples precede the primary composer, pushing the task below a large introductory area. | Put the question composer before examples; keep a concise reading-oriented introduction. |
| Ask answer | Question and answer compete in large serif text; the citation preview only identifies a title/number. | Smaller plain-language question, moderated serif answer, source position and effective dates on compact previews. |
| Ask evidence | Authorized inspector and mobile Back action already work; desktop uses a 352px panel. | Quieter source folio, purposeful spacing, explicit keyboard focus and preserved exact text. |
| Ask conflicts | Both permitted sources are available and abstention is explicit. | Make the two choices easy to compare without implying a winner or duplicating full quotations in the workspace. |
| Login | At 390px the five-profile picker, guidance and three fields form a tall first step. Real local sign-in works. | Compact account selection with clearer selected profile/role. Keep disabled-account and other-tenant checks. |
| Overview | Greeting, introductory card and roomy library list compete; recent activity has little hierarchy. | Make the next useful action and real recent activity prominent. Do not add invented metrics. |
| Library | Mobile rows consume substantial vertical space; category/version strings feel crowded. | Tighter, readable list rhythm and explicit metadata separation; preserve upload-date versus policy-validity semantics. |
| Document detail | Source reading precedes version/access actions and permissions are correct. Nested source and administrative borders remain visually busy. | Simplify reading surface and group role-dependent actions. |
| Upload | Unsupported-PDF guidance appears in the introduction and file picker. Hosted view-only behavior must remain truthful. | State format limitations once and make selection/validation clear. |
| Conflicts | Empty state and actual two-source comparison both work. Comparison is long at 390px. | Focus scope/date first, then compact side-by-side comparison that becomes a clear phone sequence. |
| Activity | Real responses expand correctly. There is no original-question field in the history API. | Improve scan/read hierarchy using actual available data; do not fabricate question titles. |
| People & access | Four person cards are long at 320px, with repeated role/email patterns. Document grants and confirmations work. | Compact person rows with progressive role/access details and unchanged action permissions. |
| Audit | Actual auditor capture is 11,148px tall at 390px; timestamps and request identifiers dominate every row. | Group by day, prioritize action/actor, reveal identifiers on demand and add accessible pagination. |

## Mobile and performance boundaries

The current Ask scope selector computes to 13px on narrow screens, creating a potential iOS focus-zoom problem. This is a **code-level risk**, not a claim of physical iPhone reproduction. The pilot will use at least 16px for Ask inputs. Existing mobile navigation, zoom permission and modal safe-area behavior are retained and tested; a physical software keyboard/notch cannot be certified by desktop emulation.

Baseline build passed. Entry JavaScript: **309.16 kB / 96.24 kB gzip**; Ask chunk: **11.96 / 4.03 kB**; CSS: **33.49 / 7.06 kB**. Exact assets are in `before/performance.json`.

One unthrottled Chromium development-server sample: login LCP 704ms, CLS 0.02054; Ask navigation LCP 580ms, CLS 0.03413; query response 147ms. Event duration had no recorded nonzero observations and is **not an INP measurement**. Separately, hosted Render health was 4,243ms and production proxy health 753ms. These are request observations, not a cold-start duration. Cold start is unknown because the backend was not restarted or forced idle. The six-width login CLS check passed on retry after one browser-process crash; the timing scenario passed initially. No application restart was used to resolve the runner crash.

## Design plan for the Ask pilot

Keep existing forest `#173d30`, ivory `#f7f6ef`, warm-white `#fffef9`, sage `#edf0e5`, muted `#58675d`, and restrained accent `#d8e6ad`. Keep the bundled Fraunces and DM Sans fonts. Fraunces carries the answer; DM Sans carries the task, question and source metadata. Reduce short-answer type from 34 to 30px desktop and 29 to 26px phone. Long responses retain comfortable body type and natural page scrolling.

Layout: date/scope → concise introduction + composer → examples when empty; submitted question → answer/status → compact citations → follow-up composer when answered. At desktop widths, a collapsible authorized document inspector occupies its own column. On phones, evidence opens a dedicated view with a visible Back action. Full source quotations appear in the inspector only. A citation preview carries source identity and temporal context, not a second quotation.

This is a refinement of the owner-approved direction. The visual distinction comes from the source-reading workflow and meaningful hierarchy, not extra decorative cards, new imagery or another CSS override layer. Before building, the promotional empty-state emphasis was revised into a task-first composer. Reference observations and reviewed skills are recorded in [REFERENCES.md](REFERENCES.md).
