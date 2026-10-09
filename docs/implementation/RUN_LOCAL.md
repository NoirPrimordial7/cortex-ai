# Run Cortex AI locally

Phase 3 working checkpoint, 2026-10-09. No API key, model download, cloud account or paid service is required. Use Python 3.12 and a Node version compatible with the locked Vite 7 toolchain (Node 20.19+ or 22.12+).

## First checkout only — PowerShell

```powershell
Set-Location 'E:\Cortex AI'
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

Use **one application worker only**; do not add `--workers`. Loopback HTTP is the supported local boundary. LAN hosting, tunnels, hosted TLS and production deployment are outside this checkpoint.

## Fictional sign-in and demonstration

Workspace `NORTHSTAR`; employee `maya@example.test`, reviewer/admin `ravi@example.test`, auditor `isha@example.test`. Generated passwords are in the **ignored local** `local-data/credentials.json`. They are never included in Git, documentation, screenshots or a frontend bundle. Disabled Noor and separate ORBIT accounts support negative tests.

1. As Maya, ask “How many annual leave days do I have?” for `2026-10-09`: 20 days, LEAVE-2026 citation. The newer uploaded LEAVE-2027 applies only from 2027-01-01.
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
