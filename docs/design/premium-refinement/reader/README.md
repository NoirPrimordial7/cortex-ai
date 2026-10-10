# Authorized enterprise reader and focused conflict refinement

10 October 2026. The owner's full-workspace review on PR #8 (00:53:12 UTC, `2085747e4b846dd42a09ee69e48c2bc931d83ab2`) approves the complete forest/ivory direction and requests focused conflict polish and final release reconciliation. This implementation preserves that direction, adds the subsequently requested document-reading experience, and keeps the PR draft. Production/main remains `a3c3a314e4fe5f93813c85591108195acf197c21`.

The final application tree is **`f354ee76eb822cd1c2dea2859027b9bc6db08bf9`**. Implementation: `3271d9c` (reader, corpus, authorized APIs and conflict groups), `bbf6b19` (immutable original-byte Git attributes), `f354ee7` (compact optional reader tools). The subsequent evidence/documentation commit does not change application code; its exact GitHub head is verified after push, avoiding a recursive self-hash.

Open the [actual screenshot gallery](gallery.html), [original dimensions and hashes](captures.json), [bundle bytes](bundle.json), [artifact reconciliation](reconciliation.json), [corpus documentation](../../../demo-enterprise/README.md) or [authorized-reader sequence](../../../diagrams/12-authorized-document-reader.mmd). Local gallery: http://127.0.0.1:8007/reader/gallery.html. Live disposable reader: http://127.0.0.1:8008/documents/ENT-LEAVE. Sign in with an existing fictional profile; the legal PDF requires the admin/auditor grant.

## Conflict history and comparison

Grouping uses only the current server-authorized history response. The key includes sorted document/version/clause IDs, immutable hashes, exact source offsets, reviewed values, validity/authority, population, jurisdiction and as-of date. Per-query citation IDs do not identify an underlying policy claim. Incomplete identities stay separate. Changed scope, version or source hash cannot be merged into an existing group.

Every original query remains in the database and in the returned API records. Each group exposes count/last-seen time and all occurrence timestamps/query IDs. Inspecting an occurrence fetches that occurrence's sources again; any denied claim clears the whole comparison and refreshes permitted history. Group pagination affects presentation only; the existing latest-30 API limit and abstention contract remain.

Mobile hierarchy presents the comparison once, then exact source claims, locators and inspection controls. Detailed validity/authority stays available in disclosure controls. Source jump links focus the selected claim; Return to list restores the compare-button focus. Follow-up and context actions remain accessible.

| Same five records, same two policies | Before | After | Difference |
|---|---:|---:|---:|
| 390px, light/dark | 3,109px | 1,768px | −1,341px / 43.1% |
| 320px, light/dark | 3,348px | 1,919px | −1,429px / 42.7% |

These are **document heights**, not performance timings. The richer enterprise scenario has four authorized conflicting claims (the existing two and the new two); its different height is recorded separately in `observations.json` and is not a same-data before/after claim.

## Reading and exact evidence

Desktop uses an A4-style reading surface with a running title, meaningful numbered headings and preserved body/table-row text. Mobile uses natural-width 18px reading text and a full-screen dialog, rather than scaling a desktop sheet down. Page navigation remains visible; optional sections/search live in a native disclosure so the document starts sooner. Literal search offers previous/next matches and a bounded first-1,000-match result set. Section navigation indexes the first 200 recognized headings.

Citation opening fetches a focused unchanged source slice with surrounding complete paragraphs. The optional `view=passage` API response adds `text_start_char` and `text_total_chars`; all citation offsets remain global Unicode code-point offsets and the hash still belongs to the complete canonical text. The endpoint's default full-text response remains compatible. JavaScript slicing now correctly handles astral Unicode characters instead of treating Python offsets as UTF-16 indexes.

Complete reading is explicit and lazy: recheck the saved citation, document/version READ and content; compare hashes and exact text before rendering. Only the selected reflowed reading page enters the DOM. Clicking a citation opens its containing reading page and highlights the exact supporting source; Supporting passage restores that position/focus. Nearby paragraphs are unchanged source, not generated explanation. Back to answer closes the reader and restores the originating citation; activity/conflict routes keep their own return labels. Existing drafts, loading-state separation, source denial and session revision invalidation remain.

Version, effective interval (exclusive end), application approval, source kind, authority rank and real review metadata come from authorized APIs. A fictional approver printed in a synthetic document does not replace the application reviewer or promote pending text. Original file bytes are preserved and downloads recheck READ. Revocation clears rendered documents, evidence and derived answers on the existing focus/poll revision mechanism; every subsequent server read/download is immediately permission-checked. This is not instantaneous remote erasure of pixels already delivered to a browser.

## Corpus and format boundaries

The opt-in corpus contains six substantial fictional enterprise documents / seven editions / 5,743 words: HR leave and absence, two conflicting distributed-work standards, incident-response SOP, restricted legal/data handling and supplier onboarding. It includes decision tables, ownership, clauses, exceptions, controls and change history. Normal ingestion/review creates exact entitlement citations. Three reference documents remain pending evidence review because the existing answer engine supports four bounded entitlement topics; no general legal/SOP answering or fabricated citations are introduced.

TXT is faithful decoded text. DOCX body paragraph/table order is preserved; original typography, images, headers, footers and footnotes are not reproduced. Existing ingested versions are never reparsed. **Reflowed reading pages are not original file page numbers**, and the UI states this directly. Reading pagination uses a 3,200-code-point budget, not physical A4 pagination; very long source lines can split across reading pages without changing characters. A citation spanning reading pages remains highlighted as those pages are visited.

PDF original-page preview is optional and raster-only. Every page request rechecks tenant/READ before accessing a resolved private file. Actual page counts come from the PDF, with no guessed highlight coordinates. Poppler produces a bounded PNG (1400px maximum dimension, 4MiB output, ≤200 pages, 10-second child/15-second parent timeout); blob URLs are revoked on change/unmount, cache is no-store, and scripts/objects/frames remain blocked. The supplied legal PDF has **two actual A4 pages**. Extracted-text highlights and original-page rendering are separate views.

**Production renderer is unconfigured.** Its child process is time-bounded, not an OS sandbox or a hard memory quota. Isolate and resource-limit it before enabling it for untrusted enterprise PDFs; its synchronous rendering can occupy the existing single-process gate until completion. The local demonstration uses trusted synthetic files. Unconfigured deployments safely retain extracted text and original downloads. No renderer dependency, production environment setting or new application dependency was installed.

## Verification

| Check | Result |
|---|---|
| Frontend Vitest | 31 passed, including code-point highlights, source escaping, character-perfect pagination, match navigation and stable conflict grouping |
| Backend pytest | 42 passed, including configured PDF raster, exact offsets/hashes, both long editions, original bytes, conflicts and revoked source/download access |
| Ruff / TypeScript / Vite / changed-file Prettier | Passed |
| Final Chromium fixtures | 35 passed: Ask 17, governance 8, shell 6, record/filter behavior 3, grouped conflict inspection 1 |
| Chromium actual reader | 5 passed: 60-capture matrix, both complete immutable editions, restricted metadata/content/download/page denials, live ACL revocation, full-reader focus/viewport geometry |
| Actual baseline conflict matrix | 1 passed: ten fresh same-data captures, all five occurrences preserved |
| Review gallery | 1 passed: all 70 new images and ten preserved conflict baselines load; no overflow at 320px |
| Existing live roles / reflow / loading / drafts | 9 passed |
| Existing source jumps / mobile editions / both-theme controls | 3 passed |
| Disposable private upload / review / download hash / employee denial | 1 passed |
| Firefox / WebKit | 29 targeted fixtures per engine; 3 actual reader/edition/denial/focus checks per engine |
| Artifacts | 70 PNG dimensions/hashes verified; seven staged originals match manifest and working bytes; no macros/executables in DOCX, unintended runtime artifacts or high-confidence secret patterns found |

The final Chromium reader and fixture runs use the committed final application. Targeted fixture engine runs cover the reader implementation before the final native section/search disclosure; actual reader checks rerun in both engines after it. The disclosure and literal match behavior are additionally covered by final unit tests. No failures remain. One existing Starlette/httpx deprecation warning remains; dependency migration is outside this focused change.

70 untouched Chromium PNGs comprise six enterprise views × five widths × both themes (60), plus the same-data baseline comparison × five widths × both themes (10). Widths are 1440/1280/768/390/320. Complete-reader dialogs use genuine 900px-high viewport screenshots so native modal geometry is retained; ordinary routes use full-page screenshots. No horizontal page overflow is observed. Captures clear focus for visual review; focus/Escape/return are tested separately. Review directly inspected desktop/light/dark, 390px and 320px reading/context/conflict/PDF views; actual offsets, edition bytes and every reading page are verified programmatically.

Native Safari, physical phones, soft keyboards, safe-area/notch behavior and VoiceOver/TalkBack remain manual device QA. Existing 200% desktop reflow and text-scaling emulations are not physical-device certification. No field Core Web Vitals, API latency, CDN latency or cold-start measurements are claimed.

## Bundle and release gates

| Vite displayed gzip asset size (decimal kB) | Approved rollout | Final |
|---|---:|---:|
| Entry JS | 96.39 | 96.42 |
| Shared CSS | 9.94 | 10.82 |
| Ask | 5.17 | 5.25 |
| Source inspector | 1.10 | 2.51 |
| Document Details | 4.84 | 5.51 |
| Conflicts | 1.91 | 2.54 |
| Lazy complete reader | — | 1.64 |
| Lazy original PDF viewer | — | 0.95 |

`bundle.json` additionally records exact raw/gzip-level-9 bytes and SHA-256 for every final JS/CSS asset. Different compression methods can differ from Vite's displayed rounding. Asset sizes are not latency or Core Web Vitals. Complete-document data and PDF images are never loaded into the initial assistant view; route and reader imports stay lazy.

PR file/binary reconciliation is in `reconciliation.json`. Earlier approved-design captures remain intentionally reviewable; the new 70 screenshots and four DOCX/PDF originals are expected review/fixture binaries. Runtime credentials, databases, traces, videos, downloaded source caches, `dist` and test outputs are ignored and excluded. The lightweight gallery contains no source credentials.

The current premium-ask preview alias is **not included in the last owner-approved exact-Origin list** recorded in `docs/design/product-audit/preview-origin-change.md`; that record authorizes an earlier full-product branch/build. This task does not change the live allowlist or bypass Vercel protection. Current protected-preview authenticated flows are therefore **unverified**, regardless of build status. Hosted smoke is deferred until explicit release approval as requested. Release needs an exact-origin decision and normal protected-preview authentication, followed by verified backend/frontend deployment of this same application tree. The new backend reader endpoints and opt-in corpus are not available on the unchanged production backend merely because Vercel builds the draft frontend.

The corpus import is a separate deliberate local/demo action; no production data migration or replacement is automatic. Keep PR #8 draft until the owner approves release; do not merge, deploy production, alter Origins or enable the PDF renderer as part of this review.

## Reproduce

Use an empty ignored local data directory, seed with `seed-enterprise-demo`, then start the backend on 8008 with the built frontend and exact `http://127.0.0.1:8008` Origin. Set an absolute `CORTEX_PDF_RENDERER` only for the optional trusted-fixture PDF preview. Keep the original baseline backend on 8000/Vite 5173 for the same-data conflict comparisons.

```powershell
# From frontend
npm test
npm run build
$env:CORTEX_READER = '1'
npx playwright test e2e/enterprise-reader-live.spec.ts e2e/reader-layout-live.spec.ts e2e/conflict-refinement-live.spec.ts --workers=1 --output=../outputs/reader-review
npx playwright test e2e/assistant.spec.ts e2e/governance.spec.ts e2e/shell.spec.ts e2e/rollout-records.spec.ts e2e/conflict-refinement.spec.ts --output=../outputs/reader-regression

# From backend; optional renderer coverage
$env:CORTEX_TEST_PDF_RENDERER = 'absolute/path/to/pdftoppm.exe'
../.venv/Scripts/python.exe -m ruff check app tests
../.venv/Scripts/python.exe -m pytest -q

# From root, after staging review artifacts
.venv/Scripts/python.exe docs/design/premium-refinement/reader/build_gallery.py
.venv/Scripts/python.exe docs/design/premium-refinement/reader/verify_artifacts.py
```
