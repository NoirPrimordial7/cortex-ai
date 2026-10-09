# Project roadmap — Phase2 DRAFT / PENDING OWNER REVIEW

Updated2026-10-09. Phase1 research is approved. Phase2 has selected a planning stack, contracts, visuals and task order. **Phase3 functional development requires explicit approval.** The historical Phase1 scope estimates below are retained for provenance, not the current deadline commitment.

| Phase / milestone | Purpose | Deliverables / gate | Status |
|---|---|---|---|
| Phase1 | Research and competitive analysis | 13 system families,15 papers,source evidence/gaps | Completed and owner-approved |
| Phase2 | Implementation-ready planning and visual design | Schema/security/API/pipeline,12 required planning docs,ADRs,diagrams,UI concepts,backlog,fixture expectations | Prepared for review; no app |
| Phase3 / A | Local working vertical slice for10Oct demonstration | Authentication,explicit grants,ingestion,validity,authority/conflicts,citations,assistant/library; [acceptance gates](planning/MVP_ACCEPTANCE_CRITERIA.md) | Not started;13–26h estimate, deadline at risk |
| B | Strong evaluated final-year core | Partial lineage,scope/exception accuracy,held-out benchmark,optional hybrid/NLI/local generation | After A; schedule after hardware/team review |
| C | Advanced extensions | Measured planner benefit,connectors/ACL sync,multiworker/tenant deployment,container packaging | Conditional; no autonomous-agent assumption |

Critical path and precise task order: [backlog](planning/IMPLEMENTATION_BACKLOG.md), [development sequence](planning/DEVELOPMENT_SEQUENCE.md). Core runs without a paid LLM. Architecture selection is documented; exact dependency locks and model hardware tests belong to Phase3. Do not equate static design concepts or documentation with implemented project percentage.

Budget assumption: one developer,8–12focused hours available before deadline; full A may need more time or team parallel work. Minimum partial fallback keeps backend auth/READ/date/citations and TXT evidence answering; missing formats/admin UI must be disclosed. College40%rubric remains unknown. No permissions weakened to meet deadline.

## Historical Phase1 draft scopes — preserved research context


Assessment: 2026-10-09. **Provisional phases only. No stack or implementation architecture is locked.** Work must stop after Phase 1 until explicit owner approval for Phase 2. Time estimates below are assumptions, not commitments; deadline, team and hardware are unknown.

## Three candidate scopes

| Dimension | Minimum viable demonstration | Strong final-year project — recommended conditionally | Advanced research version |
|---|---|---|---|
| Goal | Show why authorized, applicable evidence matters | Defensible integration and ablation study | Generalize reliability to messy evolving corpora |
| Core features | Curated document ACLs, explicit validity, approved-source priority, cited evidence, simple conflict/abstention rules | MVP plus clause lineage, scoped contradiction classifier/rules, trace explanations, revocation/cache tests and calibrated abstention | Automatic validity/authority extraction, partial amendments across sources, richer ABAC and optional adaptive retrieval |
| Complexity | Low/medium | Medium/high, bounded to synthetic policy domains | Very high |
| Provisional effort | 2–4 weeks after planning | 8–12 weeks after planning, assuming sustained student effort | Additional 4–6+ months; research uncertainty may dominate |
| Dependencies | Curated corpus/ACL labels, local lexical or vector retrieval; optional local generation | Frozen retrieval baselines, chosen local models/parser, policy fixtures, annotation/adjudication protocol | More authentic versioned corpora, extraction labels, computation and deeper evaluation expertise |
| Technical risk | Simplistic rules and unrepresentative data | Candidate recall, NLI domain shift, small-model quality, latency and test leakage | Ambiguous legal/policy semantics, multilingual extraction, drift and scaling |
| Security risk | Incorrect metadata or coarse document scopes | ACL omission, stale caches/history, mixed-access chunks and trace disclosure | Connector fidelity, derived artifacts, tool privileges and distributed revocation |
| Necessary data | Proposed 30–50 synthetic docs and 80–120 labeled queries with dated policies and role fixtures | Proposed 100–200 docs/clauses and 300–500 human-reviewed queries; real public versioned subset where licenses permit | Multiple organizations/domains and authentic clause histories, safely licensed/consented; scale determined by pilots |
| Evaluation | Correct selection, citations, basic access tests and a simple retrieval baseline | Baselines and stage ablations; temporal/authority accuracy, conflict F1, citation precision/coverage, risk–coverage, leakage tests and p50/p95 latency | Cross-domain transfer, extraction error decomposition, long histories, adversarial robustness, bounded-agent benefit and resource scaling |
| Deliverables | Small reproducible demo, fixture corpus, test report and limitations | Annotated benchmark, reproducible runs/configs, evaluated prototype, threat model, ablation report, dissertation and demo | Extended datasets/models, cross-domain experiments and publishable-quality negative/positive results if supported |

Suggested corpus/query counts are planning hypotheses, not existing datasets or statistically justified sample sizes. Phase 2 must pilot annotation effort and choose adequate strata/sample size. Use public benchmarks as reference tasks, not as evidence that enterprise permission handling is evaluated.

## Recommendation

Choose the **Strong Final-Year Project** if time/hardware permit. Bound the initial domain to HR/travel/SOP policies with curated approval, validity and ACL metadata. Establish simple fixed retrieval/eligibility stages, then evaluate one conflict/support improvement at a time. This has stronger academic depth than a chat-only demo and fewer unvalidated dependencies than automatic enterprise-wide ingestion and autonomous agents.

Its central question is: **Does explicit authorized, valid and authority-aware evidence selection improve policy answer reliability and selective coverage over matched basic RAG/recency baselines?** Demonstrate secure controlled behavior and report limitations; do not claim production readiness or new temporal-RAG theory.

Fallback to MVP if fewer than roughly four development weeks remain or local generation is infeasible. Prioritize evidence-selection evaluation even if generation must use a constrained extractive/template baseline. Leave automatic extraction, real-source connectors and complex agent autonomy for the advanced scope.

## Provisional development phases

| Phase | Proposed purpose | Exit/review gate |
|---|---|---|
| 1 — current | Research and competitive/literature analysis; repository and tracking | Primary sources, qualified comparisons and project-owner review; no experiments claimed |
| 2 — pending authorization | Full planning: requirements, dataset/threat model, acceptance metrics, resource pilot and alternatives | Owner approves scope, architecture candidates, licenses, budget and experiment protocol |
| 3 — provisional | Dataset/metadata fixtures and reproducible retrieval baselines | Frozen splits; identity/ACL and validity contracts; retrieval candidate coverage measured |
| 4 — provisional | Bounded evidence workflow and permitted cited answering | Eligibility/citation/abstention behavior tested, no unauthorized context in controlled cases |
| 5 — provisional | Conflict/authority refinements and optional bounded retrieval planning | Ablations justify each added component; remove ineffective complexity |
| 6 — provisional | Adversarial/revocation evaluation and academic write-up | Reproducible runs, confidence intervals, error analysis and honest security limits |
| 7 — optional | Advanced generalization research | New approval and feasibility/data review; not committed initial scope |

## Planning inputs still needed

Deadline and weekly effort; team size; RAM/GPU/CPU; dataset permissions and language/jurisdiction; academic novelty criteria; local-only requirements; acceptable response latency; whether any future paid access is acceptable. No expenditure is authorized by this roadmap.
