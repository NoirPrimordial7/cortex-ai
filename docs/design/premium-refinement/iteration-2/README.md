# Ask Cortex second visual iteration — approval checkpoint

10 October 2026. Responds to the owner's latest [PR #8 review](https://github.com/NoirPrimordial7/cortex-ai/pull/8). Before = `d0b4e0b`, the first PR pilot with its accepted functional fixes. After = this iteration, on the same `codex/premium-ask-refinement` draft branch. Main and the production application are untouched. No wider page redesign is included.

[Open the actual before/after gallery](gallery.html), or [all required same-data pairs in Markdown](SCREENSHOTS.md). The gallery initially shows 1440/390/320 in both themes; select empty, answer or conflict. Additional 1280/768 coverage and the narrow-screen evidence views are included. [Manifest](captures.json) records original dimensions and SHA-256 image hashes. All 72 PNGs are unmodified Chromium browser captures of actual local backend responses: the same Maya profile (current display name Arya Dhumal), 10 October 2026, India full-time scope, annual leave and remote-work questions. Backend data was not reset. New ordinary query history events are expected. Screenshots certify the captured state, not every future policy or device.

## Composition choices

Three layouts were considered inside the approved forest/ivory identity: (1) a joined answer/source folio with a full-width conflict comparison; (2) a dense reference ledger with a narrow evidence rail; (3) a centered conversation with evidence underneath. The first is implemented as the requested Ask-only second iteration. The ledger would constrain exact-source reading; the conversation repeats the detached composition rejected in review. This is not a new brand proposal or authorization to extend it to other pages.

Keep forest `#173d30`, ivory `#f7f6ef`, warm-white `#fffef9`, sage `#edf0e5` and the existing dark-theme tokens. Retain licensed bundled Fraunces for policy reading and DM Sans for questions/controls. No font, skill or dependency installation.

- **Answer and source form one object.** Previously a loose reading column sat beside a detached inspector. The new folio shares a boundary, with a generous answer column and a sage source page. Matching citation numbers connect the answer to the exact passage. Source validity, scope, original text, authority/version disclosure and hashes remain available. Date/scope controls govern the whole folio and stay outside it.
- **The empty state has a composition.** A forest introduction and a right-hand working area establish distinct reading/task roles. Topic-led example rows follow the composer. Phones remove nested framing and the supplementary proof block to give the task and policy text more width.
- **Conflicts show actual claims.** The full-width desktop spread puts the two permission-checked exact excerpts side by side, with parallel authority, effective interval and locator rows. Mobile presents those same source objects sequentially. The selected scope/date appears above the comparison; equal authority and overlapping validity are explained once. The server's abstention text remains visible; no winner is inferred. The footer gives a concrete next step: ask a policy owner to resolve the disagreement.
- **Compare only authorized data.** Independent citation reads start together. Neither excerpt renders until all reads succeed. Any denied/changed source clears the answer, comparison and inspector. Context changes, permission notifications, unmounts and newer requests invalidate old comparisons. Opening a full source rechecks permission rather than trusting the previously loaded comparison. Sources remain in route-local memory only.
- **Comfortable rhythm and states.** Ask labels use readable sentence case at 15px; fields stay at least 16px. Short answers and quotations have separate typographic roles; long answers use 18px body text. Query processing and source checking retain separate request states. Denied-source and connection errors now have a clear heading and recovery guidance; the original backend error stays in its alert.
- **Composer does not cover evidence.** The first screenshot pass exposed a desktop sticky-composer overlap in a long comparison even though interaction tests passed. The final follow-up form uses natural flow so the two claims and their metadata remain unobscured. Ctrl/⌘ K, draft preservation, mobile Back, modal keyboard handling and focus restoration are retained. The composer is reachable by shortcut/scroll rather than pinned over long content.

## Reference interpretation

The [Pangram Pangram reference](https://pangrampangram.com/) informed a strong primary content surface with a quieter adjacent working/catalog area, not just a changed heading size. The [Frans Hals reference](https://franshalsmuseum.nl/en) informed purposeful grouping and the relationship between selected content and its supporting collection. These are our design interpretations, not copied layouts or assets. Previously captured current-site reference screenshots were inspected alongside the actual Cortex baseline; current live text was rechecked. The Awwwards entry fetches timed out this turn, so the verified historical award details remain in [the original reference record](../REFERENCES.md).

## Short visual critique

The largest improvement is substantive: a conflict no longer requires opening one title, remembering its claim, returning and opening the other. Both actual excerpts and their authority are comparable immediately. Desktop source reading is part of the answer surface; mobile uses the full available content width rather than a second inset card. The empty state has stronger forest/ivory balance without introducing decorative imagery or gradients.

The phone conflict is longer than the first pilot because it now includes two actual excerpts and metadata, rather than just titles. It requires vertical scrolling, especially at 320px; neither evidence nor required dates are truncated. The desktop header is denser but remains familiar navigation. This iteration is not a new shell design for the whole application. Full source context can still be long. The owner must judge aesthetic quality from the actual images; test totals are bounded correctness evidence, not a quality score.

## Verification and limits

The real-capture matrix checks empty, answer, conflict, both themes and overflow at 320/390/768/1280/1440: **60 geometry observations across before/after, zero observed page overflow**. Evidence Back/focus return is exercised at 320/390/768. UI regressions additionally cover long answers, a keyboard-like short viewport, 200% text scaling (including both conflict claims in both themes), source denial/revocation, supported/clarification/abstention states, contrast, request separation and draft lifetime. New unit tests verify parallel authorized spans, partial loading, denial of one conflict source and invalidation by a scope change. A browser test verifies side-by-side claim geometry and denied-source clearing on reinspection.

| Check | Result |
|---|---|
| Backend tests / Ruff | 39 passed / passed; one pre-existing Starlette/httpx warning |
| Frontend unit tests | 27 passed |
| TypeScript + Vite production build | Passed |
| Changed-file Prettier formatting | Passed |
| Chromium Ask/capture/gallery/refinement/governance/shell | 35 unique scenarios passed across final runs |
| Firefox Ask/refinement | 18 passed, plus final conflict text-scaling scenario |
| WebKit Ask/refinement | 18 passed, plus final conflict text-scaling scenario |

One Chromium shell scenario initially failed at browser-context teardown because concurrent Playwright CLI invocations shared the output directory and removed a trace file (`ENOENT`). All application assertions completed. The isolated rerun passed. Final targeted checks and regenerated captures passed after the responsive metadata/heading refinements. This runner error is not hidden or counted as an initial passing run.

| Build asset, gzip kB (Vite display) | First pilot | Second iteration |
|---|---|---|
| Entry JavaScript | 96.37 | 96.39 |
| Ask route | 4.32 | 5.07 |
| Source inspector | 1.06 | 1.10 |
| Shared CSS | 7.29 | 7.93 |

No runtime dependency was added. The Ask increase implements comparison reads and states; CSS adds the composition and responsive comparison. This is a byte-size measurement, not an API/CDN timing, speedup, Core Web Vitals or cold-start claim. No new timing comparison is offered. The original sampled development-server timings remain historical and are not used to justify this iteration.

Physical phone software keyboards, pinch zoom, notches and assistive-technology speech are not certified by desktop emulation. Windows WebKit is not physical Safari. Preview sign-in still requires an approved exact origin; this task does not change origin checks or production configuration. Local review is available at `http://127.0.0.1:5173/assistant`.

## Reproduction

```powershell
# frontend/
$env:CORTEX_ASK_ITERATION = 'after'
$env:CORTEX_REFINEMENT_PHASE = 'after'
npx playwright test ask-iteration-live.spec.ts assistant.spec.ts refinement-live.spec.ts governance.spec.ts shell.spec.ts --workers=1
npm run build
npm test
# root; run after the before/after captures exist
.venv/Scripts/python.exe docs/design/premium-refinement/iteration-2/build_gallery.py
```

Run the before capture only at `d0b4e0b` with the capture test copied into that checkout. Do not start concurrent Playwright CLI invocations with the same output directory: one run can remove another's trace files. Use distinct `--output` directories for concurrent runs.

## Approval boundary

Approve or request changes to this Ask design using the same-data empty/answer/conflict screenshots at 1440, 390 and 320px in both themes. Library, Audit, People, Upload, Overview and the other routes await that owner signoff. Updating this draft is not approval to merge, change production configuration or publish a production release.
