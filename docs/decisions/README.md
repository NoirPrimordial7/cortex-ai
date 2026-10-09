# Decision records

[ADR0006](0006-disposable-shared-demo.md) accepts an isolated free hosted demo with explicitly gated fictional autofill and server-enforced read-only uploads/governance. Existing local behavior and Phase1/2 records remain preserved.

**Phase 2 / Evidence Studio owner-approved; Phase 3 authorized.** ADR0001–0004 now serve as the approved baseline; their original timestamps/status statements are preserved. [ADR0005](0005-local-execution-boundary.md) is an accepted implementation decision: one-process exclusive gate, synchronous bounded extraction, SQLAlchemy Core and one reviewed evidence span/version. It supersedes only the fine reader/writer implementation detail in ADR0002, retaining current authorization/revocation requirements.

---

## Preserved Phase 2 baseline

Phase1 research is approved; Phase2 was authorized2026-10-09. The following selections are planning baselines awaiting owner review before implementation. They do not mean Phase3 is authorized.

| ADR | Status / scope |
|---|---|
| [0001 local stack](0001-local-stack.md) | Selected planning baseline: local relational/lexical pipeline and offline evidence answerer |
| [0002 evidence boundary](0002-evidence-and-revocation.md) | Selected planning baseline: explicit current READ grants, revisions and reauthorization |
| [0003 temporal/conflict rules](0003-temporal-conflict-rules.md) | Selected planning baseline: reviewed intervals, structured claims and conflict abstention |
| [0004 visual identity](0004-evidence-studio-design.md) | Proposed Evidence Studio recommendation; visual direction pending owner review |

Repository was created private in Phase1; current GitHub metadata reports public. This task made no visibility change. Only explicit owner authorization may change visibility/collaborators.

Every record includes an ISO8601 timestamp/timezone, status, phase/module, context/options/evidence, rationale, consequences, security/evaluation effects, files, verification, outstanding questions and commit reference. Do not mark owner review complete before it occurs.

Preserve previous accepted records when a decision changes; add a superseding ADR and link both directions. Decision records explain why; Git records exactly what changed. Update the changelog and relevant activity/research logs for meaningful decisions.
