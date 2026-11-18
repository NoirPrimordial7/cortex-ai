# Repository cleanup verification

Recorded November 18, 2026, Asia/Calcutta.

The cleanup groups research under planning and tracking under implementation.
It moves the QA log into design, keeps the approved PR #8 record and active
iteration-2 draft in place, and archives superseded visual rounds.

The [before inventory](CLEANUP_INVENTORY.txt) lists all original documentation
files and top-level items. [The change manifest](CLEANUP_CHANGES.json) lists
every moved document, archived original and generated deletion target.

## Verification

- Application source, database migrations, backend tests, frontend source,
  browser spec logic, workflow steps and AGENTS.md match their original
  SHA-256 hashes. The approved record and active draft also match byte for byte.
- Fourteen ZIP archives contain 1,172 original historical files. Each archive
  passed CRC and byte comparison before removing 1,155 uncompressed files.
  Readable Markdown notes remain beside the current design guidance.
- The restore command recreated every removed historical file under ignored
  outputs and verified all 1,155 hashes. Gallery readers use that restored tree.
  Capture specs and the gallery authoring tool keep their original write-only
  output destinations.
- Local documentation links and named ZIP members are checked by
  `python tools/check_documentation_links.py`.
- The former outputs/leave-review Git metadata was preserved at the workspace
  root before deleting generated output. Existing feature commits remain in
  history. The cleanup branch is `chore/repository-cleanup`.

The local environments were deleted before installing the existing locked
requirements and frontend dependencies. Generated files recreated for checks
are still ignored and excluded from repository-visible measurements.

The rebuilt environment passed all 82 backend tests, including the real CPU
MiniLM integration, and all 36 frontend tests. Ruff, dependency consistency,
TypeScript and Vite build passed. The existing Starlette TestClient deprecation
warning remains in the backend output. The local link check passed with no
missing targets.

A pristine export of the staged Git tree was created with no dependencies,
build or local data. Its own virtual environment and frontend dependencies were
installed from the existing locks. Migrations, fictional seeding and production
build succeeded. Temporary Uvicorn and Vite processes then verified the built
page, five demo profiles, login, session, the 20-day policy citation, the 17-day
ledger balance and the development API proxy. Both processes were stopped after
verification.

## CI audit finding

The current locked frontend tree reports five high-severity affected packages
through picomatch advisory GHSA-fc5q-39xc-vjpf. The unchanged workflow's
`npm audit --include=dev --audit-level=low` command exits with status 1.
Application and lockfile changes are outside this structure-only task.
The test/build results and the audit result must be read independently.

Automatic approval review rejected the feature-branch GitHub push because it
would publish repository contents without explicit push approval. The cleanup
is prepared locally. A fresh hosted Actions run is pending that approval; this
report makes no hosted green-run claim.

## File destinations

Research documents are in `docs/planning/research/`, with source registers and
the former research stub READMEs under its `sources/` directory.
Roadmap, project overview and diagram index are in
`docs/implementation/tracking/`. QA is in `docs/design/design-qa.md`.
Historical originals are in `docs/archive/design-history/`. No ADR was removed.

## Exact repository-visible size

| Measurement | Before | After |
|---|---:|---:|
| File payload bytes | 134,216,694 | 115,888,311 |
| Files | 1,555 | 422 |

Totals sum Git file payload sizes at the original parent 0db4703 and the
cleanup tree. They exclude Git metadata, dependencies, caches, databases,
restored gallery output and every other always-ignored file. The 14 newly
tracked ZIP files contribute 102,249,730 bytes to the after total. Net reduction
is 18,328,383 bytes. The full change manifest includes each
archived original and each move; generated deletion targets are listed as
complete subtrees with their file counts and original output-folder names.
