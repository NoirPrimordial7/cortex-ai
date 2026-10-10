# Fictional enterprise document corpus

Six substantial documents, seven immutable editions and 5,743 words across editions. All company, approver and process details are synthetic teaching fixtures. The corpus contains an annual-leave standard (2025/2026 editions), two deliberately conflicting distributed-work standards, an incident-response SOP, a restricted legal/data-handling policy, and a supplier-onboarding procedure. Sections cover responsibilities, decisions, exceptions, practical workflows and review history; tables organize real procedural information.

`source/` contains curated source manuscripts. `originals/` contains actual TXT, DOCX and a two-page A4 PDF; `manifest.json` records their SHA-256 hashes. The generator uses the existing python-docx/pypdf dependencies. DOCX ZIP timestamps can change on regeneration; the manifest must be regenerated with the originals. Existing uploaded files and extracted text are never regenerated or migrated.

## Import into a disposable local demo

From `backend`, set `CORTEX_DATA_DIR` to a new, empty, ignored local directory and run:

```powershell
../.venv/Scripts/python.exe -m app.cli seed-enterprise-demo
```

This creates the ordinary fictional base accounts first, then ingests these files through the normal bounded parser and review workflow. It refuses a non-empty database or an existing enterprise corpus. No production import or permission change is automatic. Individual originals can also be uploaded through the normal authorized application workflow.

Four entitlement editions are independently reviewed as exact numbered clauses: leave 18/20 for exclusive 2025/2026 intervals, and remote work 2/3 for equal-authority conflict abstention. The existing four-topic answer contract remains. Incident, legal and procurement references stay **pending evidence review**; they can be read by authorized users but do not become fabricated answer citations. A fictional approval written inside a document is not application approval. Legal/data-handling is restricted to the fictional admin and auditor; employees and other tenants receive generic unavailable responses even for metadata.

TXT preserves the decoded source text. DOCX extraction preserves body paragraph/table order, including cell content, but does not reproduce original Word styling, headers, footnotes or images. PDF extracted text can differ from visual reading order; the optional original-page raster viewer displays the actual PDF layout without guessed citation coordinates. Downloads return the unchanged uploaded bytes after a fresh READ check.
