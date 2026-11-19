# Conflict-driven re-audit correction — verification

Date: 2026-11-20, Asia/Calcutta. Branch: `codex/conflict-driven-reaudit`. This corrects the re-audit behavior in the earlier governance release in response to the owner's screenshot and instructions.

## Result and user flow

The Employee ticket section and manual form are removed. Employee asks Cortex, receives a genuine policy conflict with its cited versions, and clicks **Send conflict for re-audit**. No policy picker, free-text description or attachment step is required. The server derives the case from the actual query, verifies that the same conflict is still current/accessible and explicitly grants Auditor review access to the involved documents.

Auditor opens **Re-audit tickets → Conflict re-audits**, compares both actual versions and selects one in **Primary policy**. The next matching Cortex answer uses that version's reviewed claim, cites it and identifies the human primary decision. **Undo / Reopen conflict** removes the choice, restores Cortex's conflict abstention, reopens the same case and retains the previous choice/reason in history. Auditor can select the other source afterward.

The user's screenshot showed two unavailable policies and an empty dropdown. Root cause was missing explicit Auditor READ after document distribution. The correction supplies audited, tenant-local grants on submission, repairs missing grants for historical records during migration, and never bypasses a later access revocation. The browser test deliberately removes both Auditor grants first, confirms both source requests return 404, clicks the Employee button, then verifies both exact versions become visible and the dropdown contains both choices.

## Checks

| Check | Result |
|---|---|
| Backend regressions | 107 passed, including real pinned CPU MiniLM integration; one inherited Starlette/httpx deprecation warning |
| Frontend regressions | 44 passed in 14 files, including an exact-version navigation test and four new no-form/single-click/action/error tests |
| Real Chrome scenarios | Six passed scenarios, 24 captures: complete send/choose/undo/rechoose flow, then 320/390/768/1280/1440px in both themes and roles |
| TypeScript/Vite | Production build passes |
| Ruff | Backend/app/tests/migrations pass |
| Python dependency consistency | No broken requirements |

The complete backend run includes nine dedicated conflict-flow tests plus one migration test. They verify:

- Only an owned, unexpired, currently unresolved Cortex query can be submitted. Arbitrary policy IDs/descriptions, another user's query, another tenant and a non-conflict answer are rejected.
- Employee has no standalone ticket list/detail access. Admin cannot resolve or undo; Auditor cannot submit as Employee. Direct requests remain protected by current session, Origin and CSRF.
- Missing Auditor source grants are created explicitly and audited. Both sources are visible; repeated submission creates one case/subscription.
- The primary changes the actual answerer's chosen citation and explanation. Undo restores two-source abstention and invalidates saved answers derived from the reversed decision. Reselection changes the source again.
- Original version hashes and metadata pointers remain unchanged across selection/undo. Prior decisions and version labels remain in history.
- Different population/date, changed authority/peer fingerprint and revoked Employee READ do not reuse the previous choice.
- Two conflicting versions of one document appear as distinct choices. Additional policies visible only to Auditor do not change the Employee's conflict set.
- Concurrent decisions produce one success and one stale-state rejection. A new app instance retains the selection/history.
- Multiple Employees can subscribe to one exact case and receive notifications. Private ticket explanations are withheld from Admin/nonparticipants even when they may read the selected policy.
- Tampered original bytes are reported as Integrity Mismatch; the source is not presented as verified and cannot be selected as a new primary.
- An upgrade from 0008 preserves manual descriptions, decisions and attachment bytes, repairs missing review grants, remains idempotent and passes foreign-key checks. It does not fabricate a query or primary decision for a historical manual ticket.

The browser flow tests actual React → API → SQLite → answer rendering. It removes Auditor grants, submits via the Employee button, verifies the two dropdown options, chooses source A, checks the Employee answer, undoes it, checks the restored conflict, chooses source B, checks that answer, then reopens the case again. Width/theme checks cover both policy cards, selectable sources, exact-version links, no horizontal page overflow, focusable controls and narrow-screen source evidence open/return. The tests use a fresh fictional fixture, not mocked application data.

## Schema/API and compatibility

Migration `0009_conflict_driven_reaudit` adds `ticket_conflict_contexts`, `ticket_conflict_sources` and `ticket_subscribers`, with same-tenant foreign keys, unique case/subscription keys and immutable context/source/subscriber guards. Only the selected-clause projection changes. Existing `policy_tickets`, decisions, attachments and notifications remain.

- `POST /api/v1/policy-tickets`: `{ "query_id": "<actual owned conflict query>" }` only.
- `GET /api/v1/policy-tickets` and `/{id}`: Auditor-only. Detail returns captured conflict context and exact current-access source versions.
- `POST /api/v1/policy-tickets/{id}/resolve`: `expected_revision`, `clause_id`, `reason`; Auditor-only, with current full-conflict and integrity checks.
- `POST /api/v1/policy-tickets/{id}/rollback`: `expected_revision`, `reason`; Auditor-only, restoring pending/conflict state.
- Employee attachment POST returns 410. Historical downloads remain authorized and retained.
- Query responses may include `re_audit` status and the selected clause. Matching resolved responses explicitly identify the Auditor primary; private notes are participant/Auditor-only.
- Exact-source links use `/documents/{id}?version={id}` so the inspected edition is the one actually reviewed.

Old manual cases are visible to Auditor under **Historical manual tickets**. They are read-only because their arbitrary input cannot safely become an automatic policy preference. Submit the actual disagreement from Ask Cortex to obtain a current actionable case. No historical data is deleted.

## Running and artifacts

Existing installations: stop the old backend, run `python -m app.cli migrate` from `backend/` using the project virtual environment, rebuild frontend, and restart the backend. See [RUN_LOCAL.md](RUN_LOCAL.md). Keep the database, uploads and signing key; do not reseed an existing database.

The corrected isolated demo runs at `http://127.0.0.1:8009`. Verification data is under ignored `outputs/conflict-reaudit-final/`; the original workspace data was not replaced. To reproduce, seed a new ignored data directory with `CORTEX_DEMO_ACCOUNTS=1`, allow `http://127.0.0.1:8009,http://localhost:8009`, build frontend and start one Uvicorn process on 8009. From frontend:

```powershell
$env:CORTEX_TEST_REAUDIT='1'
npx --no-install playwright test --config=playwright.reaudit.config.ts
```

This opt-in test mutates the isolated fixture and expects a fresh initial case. Never point it at working policy data. Reports/captures: `outputs/conflict-reaudit-browser-report/`, `outputs/conflict-reaudit-browser/`, `outputs/conflict-reaudit-backend.xml`, `outputs/conflict-reaudit-frontend.xml`. [Representative actual screens](../design/conflict-reaudit/README.md) are retained with this change.

No dependency or authentication framework was added. The existing one-process transaction gate, source hashes, signed provenance, date/scope, clause eligibility and default conflict abstention remain. The only tie-break is an explicit, current Auditor decision for an exact matching conflict. This is still bounded structured conflict handling, not semantic contradiction detection. Existing answers already seen cannot be recalled; the next request uses current state and the existing 15-second/focus session refresh clears stale visible evidence. Leave and unrelated policy workflows are unchanged.

Vite reports entry JS 311.07 kB / 96.88 kB gzip, CSS 55.28 kB / 10.65 kB gzip and the lazy Assistant route 20.73 kB / 6.85 kB gzip. These are build sizes, not network latency, cold start or Core Web Vitals.

Architecture rationale and alternatives: [ADR 0017](../decisions/0017-conflict-driven-reaudit.md).
