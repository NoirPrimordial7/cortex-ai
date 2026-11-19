# Implementation evidence register

Implementation snapshot [dbbd2f293f312f3055db6beffc045e3e5b7ee62a](https://github.com/NoirPrimordial7/cortex-ai/commit/dbbd2f293f312f3055db6beffc045e3e5b7ee62a). Status I is implemented and rerun on this snapshot. II is implemented with source evidence and limited or historical tests only. III is proposed. IV is unsupported or contradicted. V needs author or organizer confirmation.

| ID | Claim | Source in pinned repo | Supporting verification | Status |
|---|---|---|---|---|
| C01 | Roles gate actions and tenant-local user/role READ gates document visibility without an Admin bypass | backend/app/main.py, security.py; 0005 governance migration | Latest backend regressions and denied corpus reads | I |
| C02 | Approval, effective interval, jurisdiction, population, topic, condition and typed claim gate strict evidence | backend/app/pipeline.py, documents.py, policy_workflow.py | Scope, pending, transition, future and old-edition cases | I |
| C03 | FTS5 scoped ID existence, bounded peer expansion and authorized lexical ordering precede authority | backend/app/pipeline.py retrieve() | Reproduced peer denominators and new corpus observations | I |
| C04 | Highest tier with differing values returns conflict unless a matching currently verified human choice exists | backend/app/pipeline.py decide()/answer(); conflict_reaudit.py | Conflict and negative controls, re-audit regressions | I |
| C05 | Current role checks and rechecks also govern follow-up source and saved-answer access | backend/app/pipeline.py saved(); main.py citation and context; test_revocation.py, test_security.py | Rerun regression tests and exact follow-up citation requests | I |
| C06 | Extraction/approval separates private ingest, independent review and distribution | backend/app/documents.py, parser_worker.py, policy_workflow.py | TXT/PDF/DOCX and review regressions; new corpus uses TXT | I |
| C07 | Citation verification uses string offsets, UTF-8 SHA-256 and reviewed numeric occurrence | backend/app/pipeline.py verify(); main.py citation route | Exact span and digest recomputation against citation endpoint | I |
| C08 | Ed25519 signs upload manifest; separate endpoint verifies stored key, signature and source hashes | backend/app/integrity.py and test_governance.py | Latest regression suite; ordinary answer does not require fresh signature | I |
| C09 | Optional MiniLM cosine and reciprocal rank fusion are related-passage retrieval only | backend/app/embeddings.py and pipeline.py search_relevant() | Pinned artifacts and CPU integration; see semantic comparison | I |
| C10 | Current context is serialized in a one-worker process | backend/app/main.py and ADR 0005 | Selected revocation behavior covered; distributed/multiworker consistency untested | II |
| C11 | Current automatic evidence uses four topics, reviewed numeric entitlement and fixed rendering | backend/app/pipeline.py, query_routing.py | Routing and evidence tests; no arbitrary language-model policy answer | I |
| C12 | Current direct READ and hashes protect data on every channel including side channels | None | Instrumentation observes selected application boundaries only | IV |
| C13 | Temporal novelty, general contradiction inference, chunk ACLs and multiagent generation | None in the evaluated strict path | Prior work and source constrain or contradict these generalizations | IV |
| C14 | Independent annotators, production-corpus benchmarks, memory/scale studies, and indirect exposure evaluation | This paper's future-work protocol | No corresponding execution claimed | III |
| C15 | Confirmed corresponding author, submission eligibility and conference-specific final package | Project report and organizer guidance | Names and affiliation checked; remaining details unresolved | V |

The checked test counts describe different commits. The older governance checkpoint is c8e5468, while the conflict-driven re-audit checkpoint and this paper's application snapshot are dbbd2f2. The earlier local checkout at 75fe777 was not substituted for either result.
