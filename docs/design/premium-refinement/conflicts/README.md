# Focused conflict refinement; previous documents restored

The owner approved the complete forest/ivory workspace and requested repeated-conflict/mobile polish. They subsequently rejected the new large enterprise documents and reader, requesting the previous document experience. The latest PR removes the new corpus, A4/full-screen reader, PDF renderer, ingestion/citation extensions and their review artifacts. Backend and Document Details/Source Inspector/Ask return to the approved `2085747` implementation. Existing authentication, permissions, citations, history, loading separation, drafts and keyboard behavior are preserved.

The local preview at http://127.0.0.1:8008 uses an isolated snapshot of the original ten-document dataset and historical records. The original local baseline database and production are unchanged. The catalogue and compact source/edition presentation are restored in the real in-app browser.

Conflicts retains presentation-only grouping by complete authorized document/version/clause identity, source hash, offsets, reviewed values, authority, scope and as-of date. Each group exposes occurrence count, last-seen time, all original query IDs/timestamps and fresh evidence inspection for any occurrence. Incomplete identities remain separate. A denied source clears the whole comparison. Database history and the latest-30 API contract are unchanged.

Mobile comparison puts the exact source policies first and keeps focusable source jumps, return-to-list, follow-up, validity/authority and source context accessible. The same five recorded occurrences become one group, with all five retained. Full-page heights in both themes:390px3109→1768;320px3348→1919. These are layout heights, not latency measurements.

[Genuine before/after gallery](gallery.html) · [Ten current image hashes/dimensions](captures.json) · [Measured geometry](observations.json). Capture widths1440/1280/768/390/320, light/dark. Before is the approved rollout's original capture, after uses the same records and policies on the restored local preview. No pixels are edited. Existing full-workspace review artifacts are preserved; the rejected reader/corpus artifacts are removed from the current tree.

Verification after rollback:28frontend tests;39backend tests;35Chromium fixture scenarios; actual source/focus, immutable editions, both-theme controls and the ten-capture conflict matrix. TypeScript/Vite and Ruff pass. Entry JS96.40kBgzip, sharedCSS10.13, Ask5.17, SourceInspector1.10, DocumentDetails4.84, Conflicts2.55; no reader/PDF chunks or new dependencies. Asset sizes are not API/CDN time or Core Web Vitals. The backend/document/source code is checked against the approved baseline.

Native Safari, physical phones, soft keyboard/safe areas and assistive technology remain manual QA limits. Existing desktop reflow/text scaling is emulation. The current premium-ask preview Origin is absent from the last owner-approved allowlist record; normal protected-preview authentication/hosted smoke remain a release gate after approval. No live Origin change, protection bypass, production seeding, merge or deployment occurs.

Run from `frontend` with the restored isolated preview on8008:

```powershell
npm test
npm run build
$env:CORTEX_TEST_URL = 'http://127.0.0.1:8008'
$env:CORTEX_ROLLOUT = 'after'
$env:CORTEX_CONFLICT_REFINEMENT = '1'
npx playwright test e2e/rollout-quality-live.spec.ts e2e/conflict-refinement-live.spec.ts --workers=1 --output=../outputs/conflict-review
```

Then from root: `.venv/Scripts/python.exe docs/design/premium-refinement/conflicts/build_gallery.py`. The rollback is committed normally on the same draft branch; no history rewrite or force push. Final SHA is confirmed on GitHub after push. Production/main remains `a3c3a314e4fe5f93813c85591108195acf197c21`.
