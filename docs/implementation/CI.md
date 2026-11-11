# Continuous integration

Recorded 2026-10-29, Asia/Calcutta. This is the first increment of the overhaul
brief: automated checks before changing the evidence core.

## Before and after

Before, tests, lint and build were operator-run commands with historical results
in the documentation. There was no tracked workflow. Now
`.github/workflows/ci.yml` defines three independent checks for every pull
request, pushes to `main`, and manual dispatch:

| Check name | Commands | Runtime |
|---|---|---|
| Backend checks | Locked pip install, `pip check`, Ruff, all pytest regressions | Python 3.12, Ubuntu 24.04 |
| Frontend checks | `npm ci`, all Vitest tests, TypeScript/Vite production build | Node 22.16.0, Ubuntu 24.04 |
| Frontend dependency audit | `npm audit --include=dev --audit-level=low` | Node 22.16.0, Ubuntu 24.04 |

Independent jobs keep audit service availability separate from test results.
No findings are waived and no failing command uses `continue-on-error`.
There are no path filters: documentation-only PRs also produce the check names
that a branch rule can require. Superseded runs on the same ref are cancelled;
each job has a finite timeout. Dependency caches are keyed through the existing
lockfiles; installed environments are recreated each run.

Actions are pinned to official release commit hashes. Checkout does not persist
credentials; the token has only `contents: read`. The workflow uses
`pull_request`, never `pull_request_target`, and requires no application secrets,
model keys, hosting credentials or live demo data. It does not publish or deploy.
The audit reads the committed frontend lockfile without installing packages or
running their lifecycle scripts. Normal builds still execute the reviewed
dependency install/build scripts on an ephemeral runner.

These choices follow the official [workflow permissions documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax),
[checkout](https://github.com/actions/checkout),
[setup-python](https://github.com/actions/setup-python) and
[setup-node](https://github.com/actions/setup-node) contracts.

## Activation and remaining limits

2026-11-12 GitHub check: `main` reported `protected: false`, no required
status checks, and an empty effective rules list. The workflow was absent on
`main`. The leave-ledger increment uses a feature-branch pull request to
exercise all three jobs before any merge. Branch settings were left as found.
See the [branch metadata](https://api.github.com/repos/NoirPrimordial7/cortex-ai/branches/main)
and [effective rules](https://api.github.com/repos/NoirPrimordial7/cortex-ai/rules/branches/main).

The first hosted run on [draft PR #9](https://github.com/NoirPrimordial7/cortex-ai/pull/9)
passed all three jobs on the CI-only commit.
[GitHub Actions run #1](https://github.com/NoirPrimordial7/cortex-ai/actions/runs/43086973036).

### Original October snapshot

This downloaded directory has no `.git` metadata. Files are prepared locally;
no branch, PR, push or hosted Actions run has been created or verified. Apply
this increment to a feature branch in the actual repository and review its first
GitHub run. In repository branch protection or a ruleset, require all three
check names above before merging. A workflow file alone does not enforce merge
protection, and this task has not changed repository settings.

Suggested review increments for the CI milestone are: backend test/lint gate;
frontend test/build and dependency audit gates; then documentation and first
remote-run evidence. They are prepared together in this local snapshot, not
represented as existing PRs. Clause-lineage work is the next separately reviewed
increment in the brief's sequence.

This gate does not yet run browser/physical-device accessibility tests, the
opt-in hosted tests, a held-out benchmark, a Python vulnerability audit, or
deployment verification. Existing Playwright tests include local-server and
hosted opt-in workflows; indiscriminately enabling them would not establish a
safe, reproducible CI fixture. Their CI isolation is separate follow-up work.

Authentication, READ grants, tenant separation, temporal eligibility, conflict
abstention, citation verification and the single-process revocation boundary
are unchanged. CI does not prove enterprise security, general answer accuracy,
or multiworker safety.

## Local verification

2026-10-29, Windows, Python 3.12.10 / Node 22.16.0 / npm 10.9.2:

| Check | Result |
|---|---|
| Locked backend/frontend dependency installation | Passed in ignored project-local `.venv` / `node_modules` |
| `python -m pip check` | No broken requirements |
| Ruff on backend app, tests and evaluation | Passed |
| Full pytest suite | 39 passed in 25.80 seconds; one existing Starlette/httpx deprecation warning |
| Full Vitest suite | 8 files, 28 tests passed |
| TypeScript/Vite production build | Passed |
| `npm audit --include=dev --audit-level=low` | Zero reported vulnerabilities |
| Workflow YAML | Parsed/formatted using the locked Prettier; official action tag hashes checked with `git ls-remote` |

The first pytest attempt began before dependency installation finished and could
not import FastAPI. The next attempt exposed a missing `outputs` parent directory
on a fresh checkout; the workflow now creates it before invoking pytest. A later
sandboxed fixture run stalled and was interrupted; the clean full run above used
a separate disposable output directory outside the sandbox. The first sandboxed
Vitest run failed reading worker temporary files; its full rerun outside the
sandbox passed. No application or test assertions were changed to obtain a pass.

These are local Windows results, not an Ubuntu/GitHub run. No browser tests or
fresh public-host verification were performed for this workflow-only increment.
No lockfile or application source change was needed.
