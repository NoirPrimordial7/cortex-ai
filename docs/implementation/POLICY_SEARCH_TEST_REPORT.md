# Cortex AI search and conversation test report

**Tested November 17, 2026 (Asia/Calcutta).** Local Windows verification used
Python 3.12.10, Node.js 22.16.0 and Chrome 157.0.8103.79. The built frontend
and one Uvicorn worker used a separate fictional SQLite database at
`outputs/policy-search-demo/cortex.sqlite3`. The development database and
deployed environments were outside this run.

## Results

| Check | Result |
|---|---|
| Backend pytest | **80 passed**, zero failures or skips, including real CPU MiniLM. One existing Starlette TestClient compatibility deprecation warning. |
| Frontend Vitest | **36 passed** across 11 test files, zero failures or skips. |
| Playwright in real Chrome | **41 passed** across six specifications. Six drove the live local server and the remaining 35 used controlled response fixtures. |
| Original strict evidence evaluation | **12/12** scenarios, **15/15** eligible peers, **5/5** temporal scenarios, **10/10** exact citation span/hash checks, **4/4** intended abstentions, zero restricted-canary violations in checked outputs and reasoning inputs. One equal-authority conflict fixture passed. |
| Static and build checks | Ruff and pip dependency consistency passed. TypeScript and Vite production build passed. npm audit reported zero known frontend dependency findings. |
| Existing database upgrade | A copy of the earlier fictional database moved from Alembic 0002 to 0004. Both leave ledger rows remained. Backfill embedded 10 approved passages, then added 0 on repeat. SQLite integrity check returned `ok` and the foreign-key check returned no rows. |
| Running service | Local health returned `status: ok`, `mode: offline_evidence`, `semantic_search: true`. |

## Module results

| Module | Result and what was exercised |
|---|---|
| Authentication, authorization and bootstrap | **Pass.** Seven security cases covered cookie/session lifecycle, logout, CSRF, Origin, disabled and idle users, role grants, mass assignment, throttled login and indistinguishable failure messages. Ten demo-hosting cases covered explicit profile opt-in, exact host/origin, secure cookies, restart preservation and read-only demo enforcement. Login UX also passed five frontend tests. |
| Tenant boundaries and live revocation | **Pass.** Cross-tenant foreign keys, explicit document READ, no administrator bypass, stale policy revisions, anonymous GET denial and revocation serialized by the existing transaction gate. Historical result and citation access expired or failed after dependency revocation. |
| Upload, parser and document review | **Pass.** Eight ingestion tests exercised actual TXT/PDF/DOCX and failed-parser cases, private-by-default upload, bounded archive and evidence spans, rejected metadata injection and approved review. The model integration test exercised a search-only review with no numeric claim, indexing on approval and removal on rejection. Browser governance fixtures verified upload form restrictions. |
| Library and document versions | **Pass for covered flows.** Catalog search, categories, links and empty state passed browser fixtures. API tests covered readable versions, approved/pending/failed source access and exact downloads. |
| Strict policy answers and conflict abstention | **Pass.** Twelve backend evidence cases plus the original authored evaluator exercised effective-window boundaries, population, authority, equal-authority disagreement, unsupported condition, restricted canaries, source tampering, hash and exact excerpt. The browser covered answered, abstained, clarification and conflict states plus citation focus return. |
| Broad related passages | **Pass.** A broad leave prompt found annual, sick, maternity and carry-forward passages. Browser and API checks confirmed titles, locator and highlighted text. Related passages exclude cited clauses and follow current tenant, READ, date, scope and approval. A revoked related document removes access to the saved result. Tampered sources did not appear. |
| Personal leave and manager access | **Pass.** Six existing leave cases covered balance dates, tenant isolation, append-only entries, audit, reporting changes and timezone rollover. Chat tests covered 17-day self and direct-report balances, generic abstention for non-reports and unresolved/ambiguous names, and redacted saved history. The manager browser rendered the dedicated ledger card without a document citation. |
| Classification and employee resolution | **Pass.** Fourteen classification cases covered all routing classes. Ten resolver cases covered exact, partial and multi-token prefix names, ambiguity, inactive users, missing names and the other tenant. Resolution still requires the ledger service to authorize any disclosure. |
| Autocomplete | **Pass.** Endpoint tests covered a maximum of eight items, empty input, scoped titles, permitted and unavailable report names, and sanitized access audit. UI tests covered active option, Up/Down, Enter to fill, Escape, focus retention and accessible list semantics. A real manager selected a direct-report suggestion in both themes at every required width. |
| Semantic retrieval | **Pass on the local model and the authored examples.** Verified 384-dimensional unit vectors, cosine ranking, reciprocal rank fusion, approval-only persistence and rejection cleanup. A real MiniLM test and a live employee browser recovered the sick-leave passage for “I am unwell and need some time away”. The lexical-only path did not retrieve that passage for the same wording. Stubbed vector results confirmed that unauthorized, wrong-tenant, and not-yet-effective vectors could not surface. |
| Conversation context | **Pass.** Four backend tests verified one-turn topic reuse, recognized contractor scope, unsupported HR scope, owner and tenant isolation, expiry, and reauthorization after a manager reassignment. The real browser showed 20 working days for the full-time annual policy, 8 for the contractor follow-up, and clarification for HR. |
| Dashboard, Team, activity, audit and permissions | **Pass for covered flows.** Team tests checked direct-report links, as-of detail, empty team and concealed 404s. Shell tests loaded the main routes including Dashboard and Team. Activity filters/pagination, current source inspection, audit action/outcome filtering and permissions review/cancel passed browser fixtures and component tests. |
| Responsive behavior and accessible interactions | **Pass in Chrome.** Live search and ledger states ran at 320, 390, 768, 1280 and 1440 px in light and dark. Browser fixtures add reflow at 1024 px, modal focus return, reduced motion and 200% text scaling for existing evidence views. Twenty live result screenshots and four before/after captures were saved locally. |

## Measurements and artifacts

- The original lexical-mode evaluator observed a median of **23.121 ms** and
  nearest-rank p95 of **26.844 ms** over 50 warm in-process HTTP requests.
  These figures describe the strict authored fixture run. They exclude
  browser rendering, cold starts, network transfer and semantic inference.
- The verified ONNX model file was **90,405,214 bytes**. The tokenizer file
  was **466,247 bytes**. Both matched the exact pinned SHA-256 hashes.
- The built Assistant JavaScript chunk was **18.46 kB**, **6.13 kB gzip**.
  The main JavaScript chunk was **310.18 kB**, **96.61 kB gzip**.
- Machine-readable local outputs are
  `outputs/cortex-policy-backend.xml`, `outputs/cortex-policy-frontend.xml`,
  `outputs/outputs/cortex-policy-browser.xml`, and
  [the checked-in evaluator results](fixture-results.json).
  Before/after screenshots are in `outputs/policy-search-captures/`.
  The previous Assistant showed static example buttons when typing. The new
  Assistant shows options tied to the input while preserving date and scope.

## Corrections and coverage limits

An intermediate classification change routed the original one-word `leave`
evaluation prompt away from the strict answer. Restoring that entry point
brought back 12/12 gold scenarios without changing any expected outcomes.
The browser rerun also corrected a focus matcher and supplied the existing
leave response shape in an outdated shell fixture.

Part C, the optional Ollama rephrasing and multi-agent orchestration, was
left out. Checking that a draft repeats allowed numbers and dates would
still permit unsupported statements about who a policy applies to or
whether it grants a benefit. The current results use deterministic templates.

This run used a small authored English fixture. It did not measure held-out
retrieval accuracy, multilingual recall, throughput, large-corpus scaling,
Firefox or Safari behavior, physical devices, assistive technology, or any
deployed environment. Previously approved versions still contain one
reviewed span per version. An existing workspace retains its policy data
and can backfill embeddings independently of the fictional demo seed.
