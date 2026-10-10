# Ask Cortex premium pilot — review checkpoint

**Released after owner approval,10October2026:** PR #8 merged; final application22cbeef is live on Vercel and Render. Previous documents and corpus remain restored. [Actual production verification and screenshots](../pr8-production-release/README.md). Statements below record the earlier review checkpoint.

**Latest, 10 October 2026:** The owner accepted the functional fixes and requested a stronger Ask-only visual iteration. [Second iteration, actual screenshots and approval checkpoint](iteration-2/README.md) · [new before/after gallery](iteration-2/gallery.html). The first-pilot report below remains historical. Production and main remain untouched.

10 October 2026. Dedicated Issue [#7](https://github.com/NoirPrimordial7/cortex-ai/issues/7) sprint, feature branch `codex/premium-ask-refinement`. Baseline/main: `a3c3a314`. **Production is unchanged.** Remaining page refinements require the owner's review of this Ask pilot, as requested in the sprint brief.

Open [the before/after gallery](gallery.html), [complete route audit](AUDIT.md), and [Awwwards research and reviewed skills](REFERENCES.md). The application continues running at `http://127.0.0.1:5173/assistant`. The gallery contains **44 comparison pairs / 88 unmodified actual screenshots**, across six widths, both themes, empty/answered/conflict states and the four narrow-screen evidence views.

## What changed and why

- **Question first:** the empty-state composer precedes example questions. It remains the same mounted input as requests complete, preserving input focus and follow-up drafts.
- **Reading hierarchy:** the submitted question uses a quieter sans-serif treatment; short answers reduce from 34→30px desktop and 29→26px phone. Long responses retain comfortable body text and natural page scrolling.
- **Compact evidence:** source previews add their actual locator and validity start date; full quotations and detailed authority stay in the authorized inspector. Conflicting sources pair on wider screens and stack on phones; the UI continues to abstain and never chooses a winner.
- **Honest request states:** a completed query no longer shows policy-processing skeletons while its source request is pending. Source checks have their own status and error handling; denied/revoked sources still remove the derived answer. Request epochs prevent invalidated responses from finishing a newer query's loading state.
- **Private draft lifetime:** unfinished input/date/scope survives route navigation in memory within the authenticated user's provider. Sign-out, expiry and account changes discard it. Answers and source data are not retained by this provider or written into browser storage.
- **Mobile and keyboard:** Ask fields use at least 16px type. At 320px the date/scope use dedicated full-width field rows after screenshot review exposed crowded text. The evidence view has explicit Back behavior, tap-origin focus restoration and notch-aware header spacing. Desktop citation activation moves focus into the inspector; its close action restores the citation. Inspector dates are formatted consistently without changing backend dates or exclusive interval semantics.
- **Existing CSS system:** the Ask section and responsive rules in the single stylesheet were edited in place. Citation refinements are scoped to Ask, and the optional date formatter preserves other inspectors' existing display behavior. No new CSS override file, font, motion library, dependency or backend change was introduced.

## Files updated

| File | Purpose |
|---|---|
| `frontend/src/pages/Assistant.tsx` | Composer order, request lifetimes, citation previews, status hierarchy and evidence focus. |
| `frontend/src/AskDraft.tsx` | Session-owned in-memory unfinished draft provider. |
| `frontend/src/App.tsx` | Own the provider above route boundaries, keyed to the authenticated user. |
| `frontend/src/SourceInspector.tsx` | Optional display date formatter; exact spans, hashes and access behavior preserved. |
| `frontend/src/styles.css` | Existing Ask typography, spacing, responsive fields and source-preview rules. |
| `frontend/src/pages/Assistant.test.tsx` | Completed-query/source separation and invalidated-request regression checks. |
| `frontend/e2e/assistant.spec.ts` | Mobile input-size and tiny-phone context-width assertions within existing scenarios. |
| `frontend/e2e/refinement-live.spec.ts` | Actual delayed citation request and navigation/sign-out draft isolation. |
| `docs/design/premium-refinement/` | Full audit, references, real comparison screenshots, observations and measurements. |

## Verification

| Check | Final result |
|---|---|
| Backend regression suite | **39 passed**, one pre-existing Starlette/httpx deprecation warning. Isolated test databases; no running-backend reset. |
| Frontend unit suite | **23 passed**. |
| TypeScript + Vite production build | Passed. |
| Chromium Ask, governance and real refinement scenarios | **25 passed**. |
| Chromium shared shell scenarios | **6 passed**. Together **31 unique scenarios**. |
| Firefox Ask + real refinement scenarios | **17 passed**. |
| WebKit Ask + real refinement scenarios | **17 passed**. Windows WebKit coverage is not certification of a physical iPhone. |
| Actual route capture: light / dark | **5 + 5 passed**; 448 final actual PNGs, 432 geometry observations locally. All six widths, five profiles, permitted routes, versions/access dialogs and evidence states. Zero observed page overflow, clipped visible controls or visible touch targets below 44px in the final captures. |
| Actual role/API boundary scenarios | **5 passed**, including disabled account and separate tenant. |
| Actual 200% desktop reflow / short viewport scenarios | **2 passed** across admin and auditor routes. |
| Browser timing and six-width login CLS checks | **2 passed**. |

The Ask scenarios include unsupported/clarification answers, exact authorized citations, revoked/denied-source clearing, equal-authority conflicts, long-answer reading, short-height composer reachability, keyboard focus, both themes, contrast, 200% text scaling and reduced motion. Artificial long responses and denied-source scenarios are explicitly UI fixtures; route capture, draft isolation and delayed-network reproduction use the actual local backend. Those categories are not presented as equivalent evidence.

Initial sandbox runs could not access Node realpaths or Python temporary directories; normal-access reruns passed. A new unit-test matcher type error was caught by TypeScript and corrected before the final build. The baseline login-layout probe had one browser-process crash and passed on retry. These runner/test issues are recorded rather than counted as application regressions or hidden as successful initial runs.

Reproduction commands from `frontend/`:

```powershell
npm run build
npm test
$env:CORTEX_REFINEMENT_PHASE = 'after'
npx playwright test assistant.spec.ts governance.spec.ts refinement-live.spec.ts shell.spec.ts --workers=1
npx playwright test assistant.spec.ts refinement-live.spec.ts --browser=firefox --workers=1
npx playwright test assistant.spec.ts refinement-live.spec.ts --browser=webkit --workers=1
$env:CORTEX_CAPTURE_PHASE = 'premium-after'
$env:CORTEX_AUDIT_URL = 'http://127.0.0.1:5173'
$env:CORTEX_CAPTURE_THEME = 'light' # repeat with dark
npx playwright test live-capture.spec.ts --workers=1
$env:CORTEX_LIVE_WORKFLOW = '1'
$env:CORTEX_WORKFLOW_URL = 'http://127.0.0.1:5173'
npx playwright test role-routes-live.spec.ts reflow-live.spec.ts performance-live.spec.ts --workers=1
```

Run historical `CORTEX_REFINEMENT_PHASE='before'` probes only at the baseline audit commit. Gallery generation is `python docs/design/premium-refinement/build_gallery.py` from the repository root after both capture phases exist locally.

## Performance, with limits

| Production build asset | Baseline raw / gzip kB | Pilot raw / gzip kB |
|---|---|---|
| Entry JavaScript | 309.16 / 96.24 | 309.57 / 96.37 |
| Ask chunk | 11.96 / 4.03 | 12.82 / 4.32 |
| Source inspector | 2.73 / 1.04 | 2.77 / 1.06 |
| Shared CSS | 33.49 / 7.06 | 34.89 / 7.29 |

The small increase supports a private draft provider and clearer interactions. No runtime dependency was added. Exact byte/gzip records: [baseline](before/performance.json), [pilot](after/performance.json).

| Single unthrottled Chromium development-server sample | Baseline | Pilot |
|---|---|---|
| First login LCP | 704ms | 828ms |
| First login CLS | 0.02054 | 0.02067 |
| Ask navigation LCP | 580ms | 668ms |
| Ask navigation CLS | 0.03413 | 0.03327 |
| Local query response observation | 147ms | 316ms |
| Largest observed event duration after interaction | No nonzero observation | 16ms |

These are lab samples of Vite's development server, with different background test activity, not production Core Web Vitals, an INP value, or a controlled performance improvement/regression experiment. The production build asset table measures bytes separately. The final six-width login CLS samples all remain below 0.1. No speedup is claimed.

Hosted health was sampled separately: Render 200 in **360ms**, production proxy 200 in **330ms** (baseline 4,243ms / 753ms). The difference is not attributed to UI work. **Backend cold-start duration remains unknown**: the user's running application was not restarted and Render was not forced idle.

## Review boundary and remaining work

The full audit is complete; the Ask pilot is the first implementation checkpoint. Library/Audit density, upload guidance, login selection, people rows, dashboard activity, document actions and standalone conflicts remain the documented next stages after visual review. They are not claimed as redesigned by this pilot.

The local preview supports actual sign-in and API workflows. A Git feature-branch push can create a protected Vercel code preview, but this new branch origin is not on the shared backend's exact sign-in allowlist. Hosted preview login must not be made to work by bypassing origins or weakening authentication. Production configuration is unchanged; enabling an additional hosted preview origin requires a separate owner-approved configuration step. The local pilot and actual screenshot gallery provide a working review surface now.

Physical phone keyboard, pinch zoom and notch checks remain a manual review limitation. Desktop viewport reduction, text scaling, native modal focus and safe-area CSS were checked, and Firefox/WebKit coverage was added; these do not substitute for a real device. No merge, production deployment or production-origin configuration change was performed.
