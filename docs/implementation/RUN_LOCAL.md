# Run Cortex AI locally

## Rebuild after cleanup

Start PowerShell in your checkout folder. These commands recreate the deleted
environment, dependency tree, build, local demo database, uploads and credentials.

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.lock
npm.cmd --prefix frontend ci
npm.cmd --prefix frontend run build
New-Item -ItemType Directory -Force outputs | Out-Null
Set-Location backend
..\.venv\Scripts\python.exe -m app.cli migrate
..\.venv\Scripts\python.exe -m app.cli seed-demo
New-Item -ItemType File -Force ..\local-data\demo-autofill.enabled | Out-Null
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --no-proxy-headers --no-access-log
```

Open [Cortex AI](http://127.0.0.1:8000) and select a fictional profile. Run
`seed-demo` once on an empty database. Later starts need migrations and Uvicorn.
The app uses one backend worker. Stop it with Ctrl+C.

Ruff checks below recreate `.ruff_cache/`. Pytest recreates its disposable
`outputs/pytest-phase3/` evidence. Vite and TypeScript regenerate
`frontend/dist/` and `frontend/tsconfig.tsbuildinfo`. Python recreates bytecode
caches. Other generated captures are produced by their opt-in browser scripts;
startup needs no previous `outputs/` contents.

For browser checks, install Chromium using
`node frontend/node_modules/@playwright/test/cli.js install chromium` and run
`npm.cmd --prefix frontend run test:e2e` with the local backend available.

Historical screenshots and galleries can be restored with
`python tools/restore_design_history.py`. Originals are extracted under
ignored `outputs/design-history/`. Serve its
`docs/design/premium-refinement/` on port 8007 for historical rollout gallery
tests. The active iteration-2 gallery remains available in the live
`docs/design/premium-refinement/` folder. The product-audit gallery builder
reads new captures from `outputs/product-audit/` and writes its documentation
destination. Its optional authoring dependency is Pillow.

Phase 3 working checkpoint, 2026-10-09. No API key, model download, cloud account or paid service is required. Use Python 3.12 and a Node version compatible with the locked Vite 7 toolchain (Node 20.19+ or 22.12+).

## First checkout only — PowerShell

```powershell
# Start in your actual checkout folder.
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.lock
Set-Location backend
..\.venv\Scripts\python.exe -m app.cli migrate
..\.venv\Scripts\python.exe -m app.cli seed-demo
Set-Location ../frontend
npm ci
```

Use your actual checkout path if different. Seeding refuses a nonempty demo database; it is not a reset command. Existing checkout: retain `local-data/`, run migrations if needed, and start the two terminals below. Never delete the database to solve a startup error without reviewing what it contains.

## Live development — two terminals

Backend:

```powershell
Set-Location 'E:\Cortex AI\backend'
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --no-proxy-headers --reload --reload-dir app
```

Frontend:

```powershell
Set-Location 'E:\Cortex AI\frontend'
npm run dev
```

Open **http://127.0.0.1:5173**. Vite updates React/CSS while you watch; Uvicorn reloads backend application changes. The frontend proxies `/api` to port 8000, keeping browser requests on one origin. Health: http://127.0.0.1:5173/api/v1/health. Both commands stay running until Ctrl+C. A backend reload may interrupt a request and resets the in-memory login failure counters.

Fictional autofill is enabled in this existing checkout with an ignored `local-data/demo-autofill.enabled` marker. On a fresh checkout, create that empty marker after fictional seeding and reload the backend to show all five profile buttons. Normal login still verifies the selected account; Noor is disabled. Shared hosting is described separately in [SHARED_DEMO.md](SHARED_DEMO.md).

Use **one application worker only**; do not add `--workers`. Loopback HTTP is the supported local boundary. LAN hosting, tunnels, hosted TLS and production deployment are outside this checkpoint.

## Fictional sign-in and demonstration

Workspace `NORTHSTAR`; employee `maya@example.test`, reviewer/admin `ravi@example.test`, auditor `isha@example.test`. Generated passwords are in the **ignored local** `local-data/credentials.json`. They are never included in Git, documentation, screenshots or a frontend bundle. Disabled Noor and separate ORBIT accounts support negative tests.

1. As Maya, ask “What is the annual leave entitlement?” for `2026-10-09`: 20 days, LEAVE-2026 citation. The newer uploaded LEAVE-2027 applies only from 2027-01-01.
2. Ask the same for `2025-06-01`: 18 days, LEAVE-2025. Date intervals are exclusive at the end.
3. Ask “How many remote days per week?”: no definitive answer; inspect both approved 2-day and 3-day sources.
4. Ask about executive bonus or missing transport allowance as Maya: no eligible evidence, without restricted source titles/text in the answer.
5. Open library/version history; effective, published and uploaded dates are distinct. Inspect or download the currently authorized source.
6. As Ravi, upload a fictional TXT/PDF/DOCX. It is private and not answer evidence until reviewed. Select one passage, validate its numeric value/topic/scope/dates/source kind, confirm uniform access, and approve. Grant other readers separately in Permissions; a role permitting upload does not imply document READ.
7. As Isha, inspect sanitized audit activity. Auditor action does not bypass document grants.

Do not use real company data. The browser verification upload named “Browser verification — fictional notice” is local, private and intentionally pending; it does not change the canonical evaluation fixture.

## Built demonstration and checks

```powershell
# From frontend/
npm run test
npm run build
npm audit
```

The backend serves the ignored `frontend/dist/` build at http://127.0.0.1:8000 when present. Stop the dev frontend if you prefer the single-origin built demonstration; backend reload is optional there. The SPA fallback excludes API paths and constrains static paths.

```powershell
# From backend/; outputs/pytest-phase3 is disposable test output, not live data.
..\.venv\Scripts\python.exe -m pytest -q --basetemp ../outputs/pytest-phase3
..\.venv\Scripts\ruff.exe check app tests evaluate.py
..\.venv\Scripts\python.exe -m pip check
..\.venv\Scripts\python.exe evaluate.py
```

Evaluation seeds its own database under ignored `outputs/`; it does not reset or modify the running demo. See [actual results](TEST_RESULTS.md), [backend contracts](../../backend/README.md) and [current limits](IMPLEMENTATION_STATUS.md).

## Run the search and leave demo with MiniLM

From the repository root in PowerShell, install the locked Python packages
and build the frontend. The model setup uses a one-time download and checks
the pinned artifact hashes. Inference runs locally on CPU once installed.

```powershell
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.lock -r backend\requirements-embeddings.lock
npm.cmd --prefix frontend ci
npm.cmd --prefix frontend run build
$env:CORTEX_EMBEDDING_MODEL_DIR = & .\tools\setup-minilm.ps1
$env:CORTEX_DATA_DIR = Join-Path (Get-Location) 'outputs\policy-search-demo'
$env:CORTEX_DEMO_ACCOUNTS = '1'
Set-Location backend
if (-not (Test-Path (Join-Path $env:CORTEX_DATA_DIR 'credentials.json'))) {
    ..\.venv\Scripts\python.exe -m app.cli seed-demo
}
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --no-proxy-headers --no-access-log
```

Open [Cortex AI](http://127.0.0.1:8000). Pick the employee profile
`maya@example.test` to try **My leave**, **Show everything relevant to leave**,
or **I am unwell and need some time away**. The manager profile
`ravi@example.test` can type **arya** to find the direct-report suggestion.
For a policy follow-up, ask **What is the annual leave entitlement?** then
**What about contractors?**.

To upgrade existing data, stop the server, point `CORTEX_DATA_DIR` at that
database, and run `python -m app.cli migrate` followed by
`python -m app.cli reindex-embeddings` from `backend/`. The backfill adds
vectors for already-approved passages. Fresh demo seeding adds the three
fictional search policies; migrations on existing workspaces preserve their data.
