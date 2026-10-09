# Phase 1 research summary

As of **2026-10-09** (Asia/Calcutta). Phase 1 research deliverables are prepared for owner review; Phase 2 has not started. No application, dataset, agent, model deployment or measured experiment exists. Repository: https://github.com/NoirPrimordial7/cortex-ai, private, main. Git status/push verification is recorded in logs and the final research briefing; current exact HEAD is available via Git.

## Main finding

Recommend a **bounded strong final-year project**: evaluate an auditable policy-answering workflow combining authorized evidence, explicit as-of validity, topic-specific approved authority, conflict handling, citations and selective abstention. The defensible contribution would be the reproducible integration/evaluation and failure analysis, not inventing RAG, temporal retrieval or enterprise authorization.

## Competitive findings

All 13 requested candidate families are covered in [COMPETITOR_ANALYSIS.md](COMPETITOR_ANALYSIS.md), with 15 fields per family, and the cited [FEATURE_COMPARISON.md](FEATURE_COMPARISON.md).

1. Permission-aware search/citations already exist in enterprise products. Framework metadata filters alone do not constitute user authorization; chunk, derived-data, tool and cache policy must be composed correctly. [G2](https://docs.glean.com/connectors/native/gdrive/security/permissions) [M1](https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-privacy) [Q1](https://docs.aws.amazon.com/amazonq/latest/qbusiness-ug/how-it-works.html)
2. Some free/self-hosted permission models are coarser than enterprise source ACLs: AnythingLLM shares embedded docs with all workspace users; Onyx connector permission preservation is Enterprise Edition; RAGFlow documentation requires version/edition/query-path qualification. [T2](https://docs.anythingllm.com/chatting-with-documents/introduction) [N2](https://docs.onyx.app/overview/core_features/connectors) [R2](https://ragflow.io/docs/v1.0.0-rc1/guides/team/sharing_scope_configuration/open_source_edition_sharing_scope_configuration) [R3](https://github.com/infiniflow/ragflow/blob/main/docs/guides/team/permission_system_overview/permission_effective_rules.md)
3. Knowledge verification/deprecation already exists in Glean. We cannot claim competitors ignore outdatedness or authority merely because formal as-of supersession is unverified. [G3](https://docs.glean.com/user-guide/knowledge/verification/how-verification-works)
4. Temporal/conflict-aware retrieval is established prior work: Re³ combines time-aware relevance and conflict/recency filtering; TimelyRAG handles clause validity across amendments. Re³'s newest-credible-fact assumption and TimelyRAG's extraction/candidate/synthetic-data limitations help define useful test cases. [P12](https://aclanthology.org/2026.acl-long.1180/) [P14](https://arxiv.org/abs/2609.11572)
5. Citation presence and grounding are not proof of reliable support. ALCE measures citation quality; RAGAs supports separate assessment dimensions; automated judges require calibration. [P08](https://arxiv.org/abs/2305.14627) [P09](https://aclanthology.org/2024.eacl-demo.16/)
6. Orchestration has real trade-offs. Q Business hallucination mitigation is unsupported with chat orchestration/plugin workflows; RAGFlow advises simpler flows for routine QA. Agent stages need a matched fixed-pipeline comparison. [Q3](https://docs.aws.amazon.com/amazonq/latest/qbusiness-ug/hallucination-reduction.html) [R4](https://ragflow.io/docs/v1.0.0-rc1/basic_component)
7. Engine access controls have detailed limits. Elastic documents possible aggregate information disclosure about inaccessible documents and permissive multi-role interactions; OpenSearch read restrictions do not constrain write rights. Pre-generation context safety is necessary but narrower than complete enterprise non-disclosure. [E4](https://www.elastic.co/docs/deploy-manage/users-roles/cluster-or-deployment-auth/controlling-access-at-document-field-level) [O2](https://docs.opensearch.org/latest/security/access-control/document-level-security/)

## Literature and evidence quality

Fifteen verified academic records include RAG, RRF, BEIR, MultiNLI, temporal language models, ReAct, Self-RAG, ALCE, RAGAs, PoisonedRAG, HoH, Re³, Ragability, TimelyRAG and an enterprise KMS study. Full structured records and review depth are in [LITERATURE_REVIEW.md](LITERATURE_REVIEW.md). The closest recent temporal/conflict methods and limitations were inspected in full-text sections. TimelyRAG is a September 2026 preprint; peer review is NOT VERIFIED.

76 primary references are registered. After the stale Elastic link repair, the independent check recorded 75 reachable and one publisher automation restriction; exact results are in [SOURCE_CHECKS.json](../research/SOURCE_CHECKS.json). Link reachability, bibliographic existence, documented feature presence and measured efficacy are separate confidence levels. No paid product was tested and no claimed benchmark gain was reproduced.

## Gap classification

**Confirmed in specific published sources:** stale evidence can degrade RAG; citation support can be incomplete; Re³'s recency assumptions limit certain historical/credibility cases; TimelyRAG depends on candidate recall and temporal signals; certain product security/guardrail combinations have constraints.

**Plausible and unvalidated for Cortex:** value of integrating scoped authority, explicit approved validity, permission-consistent conflict reasoning and selective abstention in one small reproducible testbed. Whether this exceeds configured competitor behavior is NOT VERIFIED. Full A–H gap evidence, feasibility, difficulty, trade-offs and measurements are in [RESEARCH_GAPS.md](RESEARCH_GAPS.md).

## Top five proposed actions

1. Make authorized evidence a hard pre-model boundary, including traces, follow-ups and derived artifacts.
2. Model approved valid-time and clause/version lineage separately from upload/publication time.
3. Resolve source authority by topic/scope and surface simultaneous permitted conflicts.
4. Measure claim support and abstention at useful coverage, with authorized explanations.
5. Build a curated benchmark and run matched retrieval/stage ablations before adding optional agent autonomy.

These remain proposals in [PROPOSED_IMPROVEMENTS.md](PROPOSED_IMPROVEMENTS.md); none has been implemented.

## Three project directions

| Scope | Estimated effort assumption | Core outcome | Suitability |
|---|---|---|---|
| MVP | 2–4 weeks after planning | Curated ACL/validity/authority rules and cited evidence demo | Fast proof of behavior; limited academic generalization |
| Strong final-year — recommended conditionally | 8–12 weeks after planning | Clause lineage, scoped conflicts, abstention and reproducible ablation/security report | Best balance of measurable depth and controlled scope |
| Advanced research | Additional 4–6+ months | Automatic extraction, real evolving corpora, richer policies and adaptive retrieval | Higher uncertainty, data/compute and evaluation burden |

These estimates depend on unknown deadline, team/hardware and annotation effort. [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md) remains **DRAFT / PENDING REVIEW**, and [ARCHITECTURE_NOTES.md](ARCHITECTURE_NOTES.md) separates observed patterns from proposed stages. No stack is selected.

## Risks and next planning inputs

Temporal/approval metadata can be wrong; missing candidates hide conflicts; NLI/judges can fail on domain exceptions; authority governance may be unclear; stale permissions/caches/history and restricted traces can leak information; synthetic data may flatter the design; local model resources and licenses are unknown. Zero leakage in a finite fixture is not a universal security guarantee.

After explicit Phase 2 approval, confirm deadline/team/hardware and domain, choose bounded scope and threat model, pilot dataset annotation, review licenses/resource budget, specify measurable acceptance gates and compare technical alternatives. Stop here for project-owner review.
