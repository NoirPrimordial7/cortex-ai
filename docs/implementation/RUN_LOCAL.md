# Run Cortex AI locally

Updated 2026-11-19 for the Employee/Auditor/Admin governance enhancement. Python 3.12 and Node compatible with Vite 7 (20.19+ or 22.12+) are required. No paid API or cloud account is required. Use one application worker.

## Existing checkout — update and run

Stop the previous backend with Ctrl+C before migrating. Preserve your existing `local-data/` database, uploads, credentials and signing key. Back up that directory to an owner-restricted location before an upgrade. Do not use `seed-demo` to update an existing database.

From PowerShell:

```powershell
Set-Location 'C:\Users\yashr\Downloads\cortex-ai-main\cortex-ai-main'
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.lock
npm.cmd --prefix frontend ci
npm.cmd --prefix frontend run build
Set-Location backend
..\.venv\Scripts\python.exe -m app.cli migrate
$env:CORTEX_DEMO_ACCOUNTS='1'
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --no-proxy-headers --no-access-log
```

Open [Cortex AI](http://127.0.0.1:8000). The backend serves the production frontend build. Keep that PowerShell running; Ctrl+C stops it. If port 8000 is occupied, stop the previous Cortex process in its terminal or select another port and include that exact origin in `CORTEX_ORIGINS`.

Migration upgrades through 0008, preserves identities/history, consolidates roles without promoting discontinued roles and updates known fictional emails. It also signs historical sources whose original/extracted hashes still match, labelling the origin as a historical backfill. A missing source stays unverifiable. The existing credential file's fictional emails are synchronized without changing passwords.

`CORTEX_DEMO_ACCOUNTS=1` explicitly enables fictional autofill. For a normal workspace without fictional credentials, omit it. An existing ignored `local-data/demo-autofill.enabled` marker also enables the picker.

## Fresh checkout only

From the repository root, first create the environment and dependencies:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.lock
npm.cmd --prefix frontend ci
npm.cmd --prefix frontend run build
Set-Location backend
..\.venv\Scripts\python.exe -m app.cli seed-demo
$env:CORTEX_DEMO_ACCOUNTS='1'
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --no-proxy-headers --no-access-log
```

`seed-demo` runs migrations and then refuses any nonempty tenant database. Generated passwords exist only in ignored `local-data/credentials.json`. Do not publish that file or upload real company information to the demo.

| Profile | Workspace | Email | Active role |
|---|---|---|---|
| Arya Dhumal | NORTHSTAR | arya@example.test | Employee |
| Aditya Gholar | NORTHSTAR | aditya@example.test | Admin |
| Ashwin Gudur | NORTHSTAR | ashwin@example.test | Auditor |
| Yashraj Bansal | ORBIT | yashraj@example.test | Employee, isolated tenant |
| Disabled negative test | NORTHSTAR | arya.disabled@example.test | Disabled Employee |

The internal fixture keys and user IDs remain unchanged to preserve references. Old emails are not active login aliases after migration.

## Try the integrated workflows

1. Admin: Upload a TXT/PDF/DOCX, inspect its immutable version and select **Submit to Auditor**.
2. Auditor: Open **Policy reviews**, inspect the source and integrity, select/create a heading, review metadata and approve. Alternatively reject with a reason, without inventing approval metadata.
3. Admin: Open **Distribute approved policy**, grant a selected Employee READ and confirm.
4. Employee: Open the assigned policy, its approved editions and **Policy Integrity & Provenance**. A newer unapproved edition stays hidden.
5. Employee: Open **Leave**, select type/dates/reason and confirm. Pending requests do not deduct days.
6. Auditor: Review the application in **Leave**, comment and approve/reject. Approval deducts once. Employee can withdraw pending leave or request cancellation of approved leave; Auditor-approved cancellation restores once.
7. Admin: Monitor employee balances/requests, view transaction history and allocate/configure leave. Admin and Auditor have no personal leave cards or application forms.
8. Employee: Raise a **Re-audit ticket** for assigned policies. Open the pending ticket to attach evidence. Auditor chooses a relevant policy and explains the decision; rollback requires a reason and preserves prior decisions. Employee sees notifications in the same module.
9. Ask Cortex: Check annual leave on `2026-10-09` (20 policy entitlement days), on `2025-06-01` (18), remote work disagreement, and absent/restricted evidence. Employee personal balance (17 in a fresh fixture) comes from the separate dated ledger.

## Live frontend development

Start the migrated backend above. In a second PowerShell:

```powershell
Set-Location 'C:\Users\yashr\Downloads\cortex-ai-main\cortex-ai-main\frontend'
npm.cmd run dev
```

Open [Vite development](http://127.0.0.1:5173). It proxies `/api` to port 8000. Rebuild the frontend when using the single-origin port-8000 demonstration. Do not add workers, a tunnel or a deployment as part of local startup.

## Signing key and optional semantic search

The signing key defaults to ignored `local-data/integrity-signing-key.pem`. Set `CORTEX_SIGNING_KEY_FILE` before migration and serving to use another protected location. Back up this key with the database/uploads and restrict its filesystem access (owner-restricted NTFS ACLs on Windows). Missing keys report Unable to Verify; signed databases refuse new signatures until the original key is restored. Files are not encrypted at rest. See [ADR 0016](../decisions/0016-signed-policy-provenance.md).

Optional semantic search uses the existing pinned local MiniLM model:

```powershell
# From repository root
powershell -NoProfile -File tools/setup-minilm.ps1
$env:CORTEX_EMBEDDING_MODEL_DIR=Join-Path (Get-Location) 'outputs\minilm'
Set-Location backend
..\.venv\Scripts\python.exe -m app.cli reindex-embeddings
# Start Uvicorn in this same terminal to keep the model setting.
```

Strict answers, lexical search and governance work without this optional model.

## Verification commands

```powershell
# From repository root
.\.venv\Scripts\ruff.exe check backend/app backend/tests backend/migrations
.\.venv\Scripts\python.exe -m pip check
$env:CORTEX_TEST_MINILM_DIR=Join-Path (Get-Location) 'outputs\minilm'
Set-Location backend
..\.venv\Scripts\python.exe -m pytest -q
..\.venv\Scripts\python.exe evaluate.py
Set-Location ../frontend
npm.cmd test
npm.cmd run build
npm.cmd audit --include=dev --audit-level=low
```

The dedicated real-browser suite uses an isolated fixture and installed Chrome. In a separate backend terminal, set `CORTEX_DATA_DIR` to a new ignored folder such as `outputs/governance-verification`, run `seed-demo` once, set `CORTEX_DEMO_ACCOUNTS=1`, set `CORTEX_ORIGINS=http://127.0.0.1:8008,http://localhost:8008`, and start Uvicorn on 8008. From `frontend/`:

```powershell
$env:CORTEX_TEST_GOVERNANCE='1'
npx --no-install playwright test --config=playwright.governance.config.ts
```

This suite writes fictional records. It must use the isolated demo, never your working database. Its HTML report is under ignored `outputs/governance-browser-report/`. General browser scripts use the separate existing Playwright config and opt-in flags.

[Detailed results and known limits](GOVERNANCE_TEST_REPORT.md). The public shared demo remains the earlier, view-only release; this increment was not deployed.
