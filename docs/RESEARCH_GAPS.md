# Research gaps and novelty assessment

As of 2026-10-09. **No world-first or verified competitive advantage is claimed.** A gap in reviewed public documentation is a verification gap, not an absent product feature. Existing approaches are attributed below; Cortex improvements are hypotheses. No experiment has been executed.

## A. Document conflict detection

- **Existing approaches:** NLI (P04), Ragability (P13), Re³ conflict-aware recency (P12); agent comparison is also possible.
- **Evidence of limitations:** P13 finds conflict detection versus content answering differ and prompts can increase false alarms; most reviewed products do not document a dedicated general policy detector. Product NV is not proof of absence. [P13](https://aclanthology.org/2026.lrec-1.182/) [P12](https://aclanthology.org/2026.acl-long.1180/)
- **Gap status:** Plausible integration gap; conflict detection itself already researched. Competitor superiority NOT VERIFIED.
- **Proposed Cortex improvement:** Align claims by subject, action, population, jurisdiction and overlapping validity; flag contradictory authorized clauses with supporting spans rather than silently averaging.
- **Feasibility/difficulty:** Medium feasibility; high difficulty for arbitrary prose, medium for controlled policy clauses.
- **Risks/trade-offs:** Exceptions and non-overlapping dates produce false conflicts; pairwise all-corpus comparison grows quadratically; restrict to authorized retrieved topic clusters but report missed-conflict recall.
- **Experimental measurement:** Human-labeled simultaneous conflict/non-conflict pairs; contradiction precision/recall/F1 and false-alarm rate; measure retrieval candidate coverage separately.

## B. Temporal validity

- **Existing approaches:** Date filters, connector sync, Glean verification/deprecation, Re³ recency, TimelyRAG clause intervals; valid-time databases predate RAG.
- **Evidence of limitations:** Re³ assumes latest credible conflicting fact supersedes earlier facts and is optimized for now-focused QA. TimelyRAG already models clause validity but notes extraction, missing candidates and synthetic-corpus limits. [P12](https://aclanthology.org/2026.acl-long.1180/) [P14](https://arxiv.org/abs/2609.11572) [S4](https://www2.cs.arizona.edu/~rts/pubs/TRmerged.pdf)
- **Gap status:** Confirmed limitation of a specific prior approach; plausible metadata/integration contribution, not temporal-RAG novelty.
- **Proposed Cortex improvement:** Explicit approved valid_from/valid_to, publication/ingestion times and clause supersedes links; query as_of semantics; uncertain metadata triggers clarification/abstention.
- **Feasibility/difficulty:** High feasibility for curated metadata; medium/high difficulty for partial amendments and automatic extraction.
- **Risks/trade-offs:** Newest upload can be draft/future-effective/backdated; null/ambiguous dates must not silently become valid; maintain historical evidence.
- **Experimental measurement:** As-of selection/answer accuracy; invalid-evidence inclusion; future-effective, expired, retroactive and partial-amendment test strata; compare latest-upload and recency baselines.

## C. Authority-aware ranking

- **Existing approaches:** Glean verification and curated authoritative Search answers; metadata/custom scoring in engines/Vectara.
- **Evidence of limitations:** Verification/provenance do not guarantee a universal precedence rule. Re³ explicitly excludes latest false/adversarial facts and treats source credibility as complementary. [G3](https://docs.glean.com/user-guide/knowledge/verification/how-verification-works) [M3](https://learn.microsoft.com/en-us/microsoftsearch/overview-microsoft-search) [P12](https://aclanthology.org/2026.acl-long.1180/) [S3](https://www.w3.org/TR/prov-dm/)
- **Gap status:** Plausible cross-layer engineering gap; authority signals and metadata ranking already exist.
- **Proposed Cortex improvement:** Organization-approved topic-scoped authority and approval state, applied after eligibility/validity; preserve unresolved same-authority disagreements instead of arbitrary tie breaking.
- **Feasibility/difficulty:** High feasibility with manually assigned authority; medium difficulty for governance and ambiguity.
- **Risks/trade-offs:** Global numeric trust scores can overrule relevance/jurisdiction; attackers can spoof labels without protected ingestion; approval owner may be unknown.
- **Experimental measurement:** Approved-policy-over-message accuracy, same-authority conflict recall and inappropriate-authority override rate; ablate authority while holding candidate pool fixed.

## D. Permission-safe reasoning

- **Existing approaches:** Glean, Microsoft, Q Business, Google and selected Azure/Elastic connectors preserve permissions; OpenSearch DLS; framework filters.
- **Evidence of limitations:** Existing source-sharing and refresh mistakes remain consequential; AnythingLLM's embedded docs are shared with all workspace users. Azure/Elastic paths have preview/beta/source conditions. [T2](https://docs.anythingllm.com/chatting-with-documents/introduction) [A3](https://learn.microsoft.com/en-us/azure/search/search-document-level-access-overview) [E3](https://www.elastic.co/docs/reference/search-connectors/document-level-security) [O2](https://docs.opensearch.org/latest/security/access-control/document-level-security/)
- **Gap status:** Established practice, not novelty; secure composition and revocation evaluation are realistic contributions.
- **Proposed Cortex improvement:** Trusted identity-derived policy before context, reranking/model analysis and tool calls; reauthorize evidence on use; chunk/derived data retain ACL/tenant; all follow-up stages use same authorization boundary.
- **Feasibility/difficulty:** High feasibility with simulated identities and curated ACLs; high difficulty for real connector parity and revocation.
- **Risks/trade-offs:** Filter omission/bypass, shared caches, summaries/embeddings, chat history, restricted titles/trace reasons and user-controlled filter injection; app roles are not document authorization.
- **Experimental measurement:** Unauthorized evidence in retrieved/model context must be zero in controlled tests; canary disclosure rate; cross-user cache/history and revocation tests; zero observations do not prove universal non-leakage.

## E. Explainable selection

- **Existing approaches:** Citations, Glean verifier badges, Vectara traces and pipeline component logs already exist.
- **Evidence of limitations:** ALCE documents citation support gaps; source links do not explain validity/authority decisions. Private ranking internals are not fully observable. [P08](https://arxiv.org/abs/2305.14627) [G3](https://docs.glean.com/user-guide/knowledge/verification/how-verification-works) [V2](https://docs.vectara.com/docs/platform-architecture/platform-stack)
- **Gap status:** Plausible integrated explanation gap; citations and traces are not new.
- **Proposed Cortex improvement:** Emit machine-readable permitted-source decisions: selected/rejected for temporal scope, approval, relevance, supersession or unresolved conflict; show only authorized explanation details.
- **Feasibility/difficulty:** High feasibility for rule decisions; medium difficulty for useful evidence presentation.
- **Risks/trade-offs:** Rejected restricted-document names can leak existence; LLM-generated rationale can disagree with executed policy; avoid exposing unrestricted traces.
- **Experimental measurement:** Trace consistency with executed rules, citation precision/claim coverage, authorized-only trace rate and small blinded reviewer task accuracy/time.

## F. Agentic stages versus fixed workflow

- **Existing approaches:** ReAct, framework agents, RAGFlow canvas and Vectara step graphs; Azure agentic query planning.
- **Evidence of limitations:** RAGFlow recommends simple flows for ordinary QA and notes tool/reflection latency; Q mitigation is incompatible with chat orchestration. Re³'s filter has inference overhead. [R4](https://ragflow.io/docs/v1.0.0-rc1/basic_component) [Q3](https://docs.aws.amazon.com/amazonq/latest/qbusiness-ug/hallucination-reduction.html) [P12](https://aclanthology.org/2026.acl-long.1180/)
- **Gap status:** Unvalidated design hypothesis; agents are not automatically beneficial or novel.
- **Proposed Cortex improvement:** Use explicit fixed authorization/validity stages as baseline; optionally let bounded retrieval planning retry insufficient evidence without changing policy.
- **Feasibility/difficulty:** Medium feasibility; higher difficulty and maintenance for autonomous planning.
- **Risks/trade-offs:** Latency, nondeterminism, model/tool failures and prompt injection amplify with calls. Multiple named agents may just duplicate deterministic functions.
- **Experimental measurement:** Same corpus/model/policy and call budget: fixed versus bounded planner answer accuracy, coverage, latency p50/p95, calls, failure/attack success; retain only measured benefit.

## G. Abstention and reliability

- **Existing approaches:** Enterprise-only grounding controls, similarity thresholds, Self-RAG critique and support scoring/metrics.
- **Evidence of limitations:** P08/P09 show or motivate support evaluation; empty retrieval, conflict and valid-looking unsupported answers remain different failures. No universal automatic judge was verified. [P07](https://arxiv.org/abs/2310.11511) [P08](https://arxiv.org/abs/2305.14627) [P09](https://aclanthology.org/2024.eacl-demo.16/) [Q4](https://docs.aws.amazon.com/amazonq/latest/qbusiness-ug/guardrails.html)
- **Gap status:** Established idea; combined authorized/valid/conflicting evidence abstention is a plausible evaluation contribution.
- **Proposed Cortex improvement:** Distinct states: answered with evidence, insufficient authorized evidence, unresolved authorized conflict, uncertain validity; no claim that hidden sources exist.
- **Feasibility/difficulty:** High feasibility for deterministic cases; medium/high difficulty for calibrated support thresholds.
- **Risks/trade-offs:** Too much abstention makes the system useless; confident wrong verification remains possible; withheld evidence can produce an incomplete permitted view.
- **Experimental measurement:** Selective accuracy versus coverage, unsafe-answer rate, correct-abstention rate by cause and false-abstention rate; thresholds tuned only on development split.

## H. Student deployment feasibility

- **Existing approaches:** Open frameworks, MIT/Apache apps, local model options and synthetic benchmark designs.
- **Evidence of limitations:** Open code does not imply free compute or enterprise ACL features; Onyx permission sync is edition-limited. TimelyQABench is synthetic and needs broader realism. [N2](https://docs.onyx.app/overview/core_features/connectors) [L1](https://github.com/run-llama/llama_index) [H1](https://github.com/deepset-ai/haystack) [P14](https://arxiv.org/abs/2609.11572)
- **Gap status:** Feasibility plausible, not yet budget/hardware validated.
- **Proposed Cortex improvement:** Small synthetic company policy corpus plus permitted public benchmark subsets; reproducible local retrieval and optional local generation; no paid dependencies required for the intended minimum study.
- **Feasibility/difficulty:** High feasibility for research/test dataset; model speed uncertain until hardware/deadline are known.
- **Risks/trade-offs:** GPU/RAM/disk limits, dependency/model licenses, synthetic artifacts and evaluation labor; public policies do not become real organizational authorization datasets.
- **Experimental measurement:** Record hardware/resources, data-license provenance, run time, memory and repeatability; reduce scope if deterministic evidence selection cannot meet an agreed local budget.

## Defensible contribution statement

Proposed: a reproducible policy-answering testbed and auditable workflow integrating authorization, topic-specific approval/authority, explicit as-of validity, conflict warnings and selective abstention. Its contribution would be measured evidence about **when those combinations help or fail**, plus a dataset and traceable implementation, if approved and built later.

Already established: RAG, citations, hybrid search, reranking, ACL-aware retrieval, NLI, provenance, agent orchestration, abstention and temporal/conflict-aware retrieval. TimelyRAG is direct prior art for clause-level amendment validity; Re³ is direct prior art for temporal and conflict-aware ranking. Our integration must be compared with these concepts before any novelty claim.

Unresolved: how much of the integrated behavior a configured enterprise product already supports, whether fixed stages outperform agents, whether automatically extracted policy metadata is reliable, and whether synthetic gains transfer to authentic company content. These are open questions, not conclusions.
