# Overhaul review and delivery sequence

Assessment: 2026-10-29, Asia/Calcutta. Reference: the owner's October 10 overhaul
brief. Scope of this increment is CI and a source-backed reconciliation of the
remaining work. The brief is a requirements reference; its historical claims
are checked against this snapshot rather than assumed current.

## Findings from the implementation

`backend/app/main.py` holds a global process lock and database transaction across
protected requests. `security.py` uses current tenant membership, action
permissions and explicit document READ grants without an administrator shortcut.
`pipeline.py` applies `ELIGIBLE` before hydrating evidence, expands eligible peers
for conflicts, and produces finite numeric template answers. `saved()` checks
owner, access, expiry and revisions. The backend remains single-process SQLite.

`documents.py` invokes a parser child with a 30-second timeout synchronously;
the recorded ingestion job is not an asynchronous queue. Review currently
publishes one numeric span per version. `db.py` has supersession/exception
fields, but the review API and query logic do not implement general partial
amendments or exception inheritance. Schema fields alone are not a feature.

The current source verifier checks exact span, extracted-text hash and numeric
presence. It does not establish entailment of arbitrary model-generated prose.
Before adding generation, a dedicated output-support contract must constrain
every emitted claim; simply calling today's verifier on selected evidence would
leave a model draft unchecked.

The brief understates existing frontend work: `Conflicts.tsx` already groups
conflicts and opens authorized source occurrences; `Permissions.tsx` already
manages existing users and grants, and Activity/Audit have dedicated views.
These need targeted gap tests and accessibility work, not an automatic rewrite.
User creation and reviewer/approver separation remain absent.

## Workstream disposition

These are deferrals for this first increment, not completion claims. The brief
requests a checkpoint before step 2; it prioritizes CI before evidence changes.
Each later item requires its own small change, tests and updated record.

| Workstream | Current disposition | Reason and next acceptance gate |
|---|---|---|
| F: CI | Workflow prepared locally | First hosted run and branch rules still unverified; see [CI contract](CI.md) |
| D: clause lineage | Deferred to next increment | Define multi-clause publication, partial supersession and exception precedence together; reject ambiguous/cyclic lineage and test unchanged siblings/retroactive dates |
| E: benchmark | Deferred pending independent labels | Existing `evaluate.py` uses the development fixture. Agent-authored expected answers cannot be represented as independent adjudication; freeze policy-family splits and obtain independent review |
| A: semantic/hybrid retrieval | Deferred pending D/E and model/store ADR | No embeddings/vector path exists. Choose a local model/store with measured RAM/latency and eligible-only indexing; default-off flag, RRF and restricted paraphrase canaries required |
| B: grounded generation | Deferred pending support contract and E | No generator/model path exists. Define local adapter, bounded calls, explicit hosted opt-in and claim-level validation/injection tests before any model output can be shown |
| C: LangGraph orchestration | Deferred until A/B evaluations | Read-only roles must share eligibility/decide/verify, with enforced call/time budgets and fixed-pipeline fallback; requires ADR and ablation |
| F: persistent throttling | Deferred to independent security increment | In-memory counters remain. Define atomic persistence, expiry and restart/multiworker tests without implying the whole service supports multiple workers |
| F: parser queue/isolation | Deferred to execution-boundary ADR | A background queue changes transaction/revocation assumptions. Test publication, cancellation/recovery, bounded parsing and concurrent revocation before replacing the global lock |
| F: denial audit/retention | Deferred to independent maintenance increment | Rejected transactions roll back; denial events need a durable sanitized path. Cleanup must preserve FK ordering and seven-day owner-history behavior |
| F: PostgreSQL | Deferred, highest execution risk | Dedicated migration ADR, tenant constraints, restore rehearsal and cross-worker revocation tests required before any scale-out claim |
| G: frontend/accessibility | Existing secondary screens partially satisfy brief; further work deferred | Audit real browser states and keyboard/source focus across widths/themes; new runtime indicators depend on actual backend modes. No new visual direction selected here |
| H: invitation/approval separation | Deferred to governance increment | Design tenant-scoped invitation tokens and separate reviewer/approver permissions, with self-approval denial and revocation tests |
| H: backup/restore | Deferred to recovery increment | Must coordinate SQLite plus immutable uploads, manifest/hash checks and restore testing without resetting existing data |
| H: Docker | Deferred to packaging increment | Requires tested runtime isolation, private bindings and secret-free image checks; does not imply production readiness |
| External connectors | Deferred as brief specifies | A–C must be stable first; no source identity/ACL sync implemented |

Default execution remains deterministic offline evidence mode. No semantic,
LLM or agent flag is advertised as implemented; no paid API is required. No
production deployment, database migration, model installation or broad visual
redesign is part of this increment.

## Review and verification limits

This folder is a downloaded source snapshot with no Git metadata or installed
dependencies at assessment start. Project-local dependencies were installed
from the existing locks for checks. There is no branch or remote diff to review;
the new workflow and documentation are the complete intended source changes.
Historical release records remain historical, not fresh deployment evidence.

Local check results are recorded in [CI verification](CI.md#local-verification)
and the dated changelog/development log. No held-out accuracy, WCAG conformance,
multiworker consistency or GitHub execution result is inferred from those checks.
