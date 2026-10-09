# Research sources and evidence policy

**Assessment:** 2026-10-09, Asia/Calcutta. Register prepared at 2026-10-09T15:22:58+05:30. 76 primary references support 13 competitor-family profiles, 15 paper records and the security/temporal engineering review. Sources include official technical docs/repositories, primary publisher/arXiv records, NIST, W3C, author-hosted academic material and OWASP.

## Confidence and verification method

- **H:** primary technical documentation, publication metadata or an explicit interface/source description supports the scoped claim. It is confidence in the evidence, not independent proof that a deployed product is secure/correct.
- **M:** official product/README statement, with marketing language excluded and undocumented mechanics/edition details qualified.
- **NOT VERIFIED:** no sufficient evidence in this review. Never interpreted as 'feature absent'.
- Paper findings are author-reported. Review depth is recorded in the literature review. No result was reproduced, product benchmarked or paid account opened.
- Live web access was available. Primary-source pages were reviewed using web search/open and targeted method/limitation reads. Search dates/crawl dates are not publication dates; product claims are assessed against the current client date.
- Independent bounded HTTP GET checks establish URL reachability only. Exact timestamps, redirects, failures and method are in [SOURCE_CHECKS.json](../research/SOURCE_CHECKS.json); bibliographic/claim scope is in [SOURCE_INVENTORY.json](../research/SOURCE_INVENTORY.json). A successful URL alone does not verify a claim.

## Primary-source register

| ID | Source | Confidence | Scope/evidence boundary |
|---|---|---|---|
| G1 | [Glean hybrid retrieval and languages](https://docs.glean.com/administration/management/features/glean-language-support) | H | Documents lexical and semantic retrieval; no independent quality validation. |
| G2 | [Glean Google Drive permissions](https://docs.glean.com/connectors/native/gdrive/security/permissions) | H | Connector-specific permission semantics and public/domain-sharing exception. |
| G3 | [Glean verification](https://docs.glean.com/user-guide/knowledge/verification/how-verification-works) | H | Verification badges, verifier/time, reminders, deprecated content. |
| G4 | [Glean platform APIs](https://developers.glean.com/) | H | Search, cited permission-aware chat and agent APIs. |
| G5 | [Glean actions](https://docs.glean.com/agents/actions/introduction-to-actions) | H | Search and external write actions under configured tool permissions. |
| M1 | [Microsoft Copilot privacy and security](https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-privacy) | H | Current naming transition, Graph permissions, citations and prompt-injection mitigations. |
| M2 | [Microsoft semantic indexing](https://learn.microsoft.com/en-us/microsoftsearch/semantic-index-for-copilot) | H | Semantic indexing alongside Microsoft Search; proprietary ranking details not exposed. |
| M3 | [Microsoft Search overview](https://learn.microsoft.com/en-us/microsoftsearch/overview-microsoft-search) | H | Personalized, permission-trimmed search and authoritative keyword answers. |
| Q1 | [Amazon Q Business workflow](https://docs.aws.amazon.com/amazonq/latest/qbusiness-ug/how-it-works.html) | H | Authorized retrieval followed by generation; identity federation trade-offs. |
| Q2 | [Amazon Q Business overview](https://docs.aws.amazon.com/amazonq/latest/qbusiness-ug/what-is.html) | H | Connected enterprise assistant, citations and access control. |
| Q3 | [Amazon Q hallucination mitigation](https://docs.aws.amazon.com/amazonq/latest/qbusiness-ug/hallucination-reduction.html) | H | Optional correction; unsupported with orchestration, plugins and some modalities. |
| Q4 | [Amazon Q guardrails](https://docs.aws.amazon.com/amazonq/latest/qbusiness-ug/guardrails.html) | H | Enterprise-only grounding, topic controls and plugin/data-source orchestration. |
| C1 | [Gemini Enterprise launch](https://cloud.google.com/blog/products/ai-machine-learning/introducing-gemini-enterprise/) | M | Official product announcement; qualitative claims treated as vendor assertions. |
| C2 | [Google Agent Search](https://cloud.google.com/products/gemini-enterprise-agent-platform/agent-search) | M | Current name formerly Vertex AI Search; product page not a disclosed implementation. |
| C3 | [Gemini custom-source ACLs](https://docs.cloud.google.com/agentspace/docs/identity) | H | Identity-provider mapping and document ACL metadata for Cloud Storage/BigQuery sources. |
| C4 | [Gemini granular access controls](https://docs.cloud.google.com/gemini/enterprise/docs/iam-policy-for-apps-and-data-stores) | H | App/store IAM and synced third-party document ACLs; broad-role caveat. |
| C5 | [Gemini ContentSearchSpec](https://docs.cloud.google.com/gemini/enterprise/docs/reference/rest/v1/ContentSearchSpec) | H | Optional citations and query handling; configuration defaults matter. |
| A1 | [Azure AI Search overview](https://learn.microsoft.com/en-us/azure/search/search-what-is-azure-search) | H | Classic and agentic search, full-text/vector/hybrid retrieval. |
| A2 | [Azure hybrid search](https://learn.microsoft.com/en-us/azure/search/hybrid-search-overview) | H | Parallel lexical/vector queries, RRF and optional semantic reranking. |
| A3 | [Azure document access control](https://learn.microsoft.com/en-us/azure/search/search-document-level-access-overview) | H | Application security filters versus native ACL ingestion/enforcement previews. |
| A4 | [Azure agentic retrieval requests](https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-how-to-retrieve) | H | Caller identity, retrieval output and permission propagation caveats. |
| A5 | [Azure security best practices](https://learn.microsoft.com/en-us/azure/search/search-security-best-practices) | H | Security controls and confidential-compute feature trade-offs. |
| E1 | [Elastic Enterprise Search migration](https://www.elastic.co/guide/en/enterprise-search/current/upgrading-to-9-x.html) | H | Standalone Enterprise Search unavailable in 9+; self-managed connector migration. |
| E2 | [Elasticsearch hybrid search](https://www.elastic.co/docs/solutions/search/hybrid-search) | H | Full-text/vector fusion; currently documented RRF recommendation. |
| E3 | [Elastic connector DLS](https://www.elastic.co/docs/reference/search-connectors/document-level-security) | H | Supported connector ACLs, beta status and subscription restrictions. |
| E4 | [Elasticsearch document and field security](https://www.elastic.co/docs/deploy-manage/users-roles/cluster-or-deployment-auth/controlling-access-at-document-field-level) | H | Read-only DLS/FLS semantics and permissive-role interactions. |
| O1 | [OpenSearch hybrid search](https://docs.opensearch.org/latest/vector-search/ai-search/hybrid-search/index/) | H | Keyword/semantic fusion with score normalization or RRF. |
| O2 | [OpenSearch document security](https://docs.opensearch.org/latest/security/access-control/document-level-security/) | H | Query-based read restrictions and multi-role/write caveats. |
| O3 | [OpenSearch field security](https://docs.opensearch.org/latest/security/access-control/field-level-security/) | H | Field exclusions, keyword subfields and DLS interaction. |
| O4 | [OpenSearch conversational RAG](https://docs.opensearch.org/latest/vector-search/ai-search/conversational-search/) | H | Conversation memory and retrieval-augmented-generation processor. |
| O5 | [OpenSearch conversational agent](https://docs.opensearch.org/latest/ml-commons-plugin/tutorials/rag-conversational-agent/) | H | Flow agent orchestrates retrieval and LLM calls. |
| N1 | [Onyx official repository](https://github.com/onyx-dot-app/onyx) | M | Current agentic hybrid-search claims and mixed community/enterprise licensing. |
| N2 | [Onyx connector documentation](https://docs.onyx.app/overview/core_features/connectors) | H | Permission preservation expressly scoped to Enterprise Edition. |
| N3 | [Onyx MIT-only distribution](https://github.com/onyx-dot-app/onyx-foss/blob/main/README.md) | M | MIT mirror and community capabilities; not proof of free ACL synchronization. |
| R1 | [RAGFlow official repository](https://github.com/infiniflow/ragflow) | M | Document parsing, citations, retrieval and Apache-2.0 repository. |
| R2 | [RAGFlow open-source sharing](https://ragflow.io/docs/v1.0.0-rc1/guides/team/sharing_scope_configuration/open_source_edition_sharing_scope_configuration) | H | Versioned release-candidate docs; Only me/Team scopes. |
| R3 | [RAGFlow permission rules](https://github.com/infiniflow/ragflow/blob/main/docs/guides/team/permission_system_overview/permission_effective_rules.md) | H | Document operation permissions described; edition/retrieval-path applicability needs validation. |
| R4 | [RAGFlow components](https://ragflow.io/docs/v1.0.0-rc1/basic_component) | H | Hybrid weights, optional reranking, citations, conditional/tool workflows and latency advice. |
| T1 | [AnythingLLM official repository](https://github.com/Mintplex-Labs/anything-llm) | M | MIT application, local-model support and agent capabilities. |
| T2 | [AnythingLLM document behavior](https://docs.anythingllm.com/chatting-with-documents/introduction) | H | Workspace-wide embedded documents, context pruning, vector retrieval and LanceDB reranking. |
| T3 | [AnythingLLM custom skills](https://docs.anythingllm.com/agent/custom/introduction) | H | Extensible agent skills; tool safety is application responsibility. |
| L1 | [LlamaIndex official repository](https://github.com/run-llama/llama_index) | M | MIT framework distinct from hosted commercial services. |
| L2 | [LlamaIndex retriever guides](https://developers.llamaindex.ai/python/framework/module_guides/querying/retriever/retrievers/) | H | BM25, hybrid, fusion, metadata-based and composed retrieval. |
| L3 | [LlamaIndex citations](https://developers.llamaindex.ai/python/framework-api-reference/query_engine/citation/) | H | CitationQueryEngine source nodes, chunking and synthesis. |
| L4 | [LlamaIndex rerankers](https://developers.llamaindex.ai/python/framework/module_guides/models/rerankers/) | H | Postprocessors between retrieval and synthesis; stronger scoring costs latency. |
| L5 | [LlamaIndex agents](https://developers.llamaindex.ai/python/framework/module_guides/deploying/agents/) | H | Framework agent deployment guides; not turnkey source authorization. |
| H1 | [Haystack official repository](https://github.com/deepset-ai/haystack) | M | Apache-2.0 framework and modular pipelines distinct from commercial deepset products. |
| H2 | [Haystack retrievers](https://docs.haystack.deepset.ai/docs/retriever) | H | Sparse, dense and hybrid composition; filters are not identity policy by themselves. |
| H3 | [Haystack AnswerBuilder](https://docs.haystack.deepset.ai/docs/answerbuilder) | H | Parses source references; defaults list all supplied documents, not proof of citation entailment. |
| H4 | [Haystack Agent](https://docs.haystack.deepset.ai/docs/agent) | H | Tool-using agent component with state and exit conditions. |
| V1 | [Vectara retrieval](https://docs.vectara.com/docs/search-and-retrieval) | H | Hybrid search, filters, reranking and citations. |
| V2 | [Vectara platform stack](https://docs.vectara.com/docs/platform-architecture/platform-stack) | H | Vendor-documented retrieval RBAC, agent steps, HHEM/correction and traces; not independently audited. |
| V3 | [Vectara agent retrieval tuning](https://docs.vectara.com/docs/agents/tune-retrieval-for-agents) | H | Session-bound ACL/tenant filters, metadata selection and time-decay reranking. |
| S1 | [NIST ABAC guide](https://csrc.nist.gov/pubs/sp/800/162/upd2/final) | H | Subject/object/action/environment attributes; technical standard guidance. |
| S2 | [NIST RBAC FAQ](https://csrc.nist.gov/Projects/role-based-access-control/faqs) | H | Roles, permissions, hierarchies and separation of duty. |
| S3 | [W3C PROV-DM](https://www.w3.org/TR/prov-dm/) | H | Entities, activities and agents for provenance; provenance does not establish truth. |
| S4 | [Jensen and Snodgrass temporal database definitions](https://www2.cs.arizona.edu/~rts/pubs/TRmerged.pdf) | H | Valid time versus transaction time; author-hosted academic reference. |
| S5 | [OWASP RAG Security](https://cheatsheetseries.owasp.org/cheatsheets/RAG_Security_Cheat_Sheet.html) | H | Ingestion, embeddings, retrieval, output and agent threat boundaries. |
| S6 | [OWASP prompt injection prevention](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html) | H | Indirect injection and exfiltration defenses; mitigation not a proof of immunity. |
| P01 | [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401) | H | 2020 (NeurIPS; arXiv revised 2021); arXiv:2005.11401. Primary abstract/metadata; reported findings not reproduced. |
| P02 | [Reciprocal rank fusion outperforms condorcet and individual rank learning methods](https://doi.org/10.1145/1571941.1572114) | H | 2009 (SIGIR); DOI:10.1145/1571941.1572114. Publisher abstract and bibliographic metadata; no experimental reproduction. |
| P03 | [BEIR: A Heterogenous Benchmark for Zero-shot Evaluation of Information Retrieval Models](https://arxiv.org/abs/2104.08663) | H | 2021 (NeurIPS Datasets and Benchmarks); arXiv:2104.08663. Primary abstract/metadata; author findings not reproduced. |
| P04 | [A Broad-Coverage Challenge Corpus for Sentence Understanding through Inference](https://arxiv.org/abs/1704.05426) | H | 2018 (NAACL; preprint 2017); arXiv:1704.05426. Primary abstract/metadata; policy transfer is our hypothesis. |
| P05 | [Time-Aware Language Models as Temporal Knowledge Bases](https://aclanthology.org/2022.tacl-1.15/) | H | 2022 (TACL; preprint 2021); DOI:10.1162/tacl_a_00459; arXiv:2106.15110. Publisher abstract/metadata verified; findings not reproduced. |
| P06 | [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629) | H | 2023 (ICLR; preprint 2022); arXiv:2210.03629. Primary abstract/metadata; author results not reproduced. |
| P07 | [Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection](https://arxiv.org/abs/2310.11511) | H | 2023 preprint (venue not required for this record); arXiv:2310.11511. Primary abstract/metadata; experiments not reproduced. |
| P08 | [Enabling Large Language Models to Generate Text with Citations](https://arxiv.org/abs/2305.14627) | H | 2023 (EMNLP); arXiv:2305.14627. Primary abstract/metadata; benchmark result is historical, not a universal current-model rate. |
| P09 | [RAGAs: Automated Evaluation of Retrieval Augmented Generation](https://aclanthology.org/2024.eacl-demo.16/) | H | 2024 (EACL demonstrations; preprint 2023); DOI:10.18653/v1/2024.eacl-demo.16; arXiv:2309.15217. Publisher abstract and arXiv metadata; no execution. |
| P10 | [PoisonedRAG: Knowledge Corruption Attacks to Retrieval-Augmented Generation of Large Language Models](https://www.usenix.org/conference/usenixsecurity25/presentation/zou-poisonedrag) | H | 2025 (USENIX Security; preprint 2024); arXiv:2402.07867. Official USENIX record and arXiv abstract verified; not reproduced. |
| P11 | [HoH: A Dynamic Benchmark for Evaluating the Impact of Outdated Information on Retrieval-Augmented Generation](https://aclanthology.org/2025.acl-long.301/) | H | 2025 (ACL); DOI:10.18653/v1/2025.acl-long.301. Full PDF methods/conclusion/limitations sections inspected; no reproduction. |
| P12 | [Re³: Relevance & Recency Retrieval for Mitigating Temporal Hallucination](https://aclanthology.org/2026.acl-long.1180/) | H | 2026 (ACL); DOI:10.18653/v1/2026.acl-long.1180. Full PDF methods and limitations inspected; latest-authoritative assumptions checked; not reproduced. |
| P13 | [Ragability Benchmark: A Dataset and Library to Test LLMs on Inter-context Conflicts](https://aclanthology.org/2026.lrec-1.182/) | H | 2026 (LREC); DOI:10.63317/2ty3hnn3bgb9. Full PDF limitations and primary abstract inspected; not reproduced. |
| P14 | [TimelyRAG: Semantic-Temporal Hybrid Retrieval for Time-Critical Question Answering in Overlapping-Evolving Documents](https://arxiv.org/abs/2609.11572) | H | 2026 (September arXiv preprint; peer review NOT VERIFIED); arXiv:2609.11572. Full HTML method and limitations inspected; preprint claims not independently reproduced. |
| P15 | [Knowledge Management Systems: Issues, Challenges, and Benefits](https://aisel.aisnet.org/cais/vol1/iss1/7/) | H | 1999 (Communications of the Association for Information Systems); DOI:10.17705/1CAIS.00107. Primary publisher abstract and bibliographic record; no raw study-data reanalysis. |
| P02A | [RRF author-hosted paper](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) | H | Primary author-hosted full text; alternative when DOI publisher blocks automated HTTP. |
| A6 | [Azure AI Search FAQ — conflicting DLS wording](https://learn.microsoft.com/en-us/azure/search/search-faq-frequently-asked-questions) | H | Reviewed FAQ still says no built-in document permissions; reconcile using dedicated current preview docs A3/A4, not a blanket absence claim. |

## Verification exceptions and source reconciliation

- RRF's DOI/publisher blocks the separate automated HTTP request with 403. Publisher metadata/abstract were available through the web research tool; title/authors/year/DOI also agree with the reachable primary author-hosted paper [P02A](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf). Preserve DOI [P02](https://doi.org/10.1145/1571941.1572114) as an identifier; do not claim unrestricted automated publisher access.
- The initial localized Elastic DLS URL returned HTTP 404 in the independent check despite appearing in indexed web results. It was replaced throughout the reports by the reachable current documentation [E4](https://www.elastic.co/docs/deploy-manage/users-roles/cluster-or-deployment-auth/controlling-access-at-document-field-level); no feature-absence inference was made.
- Azure documentation wording conflicts: [A6](https://learn.microsoft.com/en-us/azure/search/search-faq-frequently-asked-questions) says no built-in document permissions, whereas the dedicated current [A3](https://learn.microsoft.com/en-us/azure/search/search-document-level-access-overview) documents filters and native preview ACL/RBAC paths. Reports follow the dedicated source-specific API documentation with preview caveats, not a universal yes/no assertion.
- RAGFlow's reviewed permission/component docs are explicitly v1.0.0-rc1 or mutable main. Resource/document operation permission documentation is not independent evidence that every open-source retrieval path preserves connected ACLs.
- Product names are transitional: current Microsoft security docs rename Microsoft 365 Copilot to Microsoft Copilot; Google's developer page labels former Vertex AI Search as Agent Search. Legacy/API names remain in official paths. Elastic standalone Enterprise Search is absent from 9+ and should not be confused with current Elasticsearch search capabilities.
- Mutable `latest`/`main` URLs are suitable for a dated survey, not immutable experimental provenance. Pin versions/commits and archive permissible claim notes before reproduction. Exact private product internals remain NOT VERIFIED.

## Research refresh policy

For each material claim change record ISO timestamp/timezone, phase, affected files, old/new interpretation, exact source/edition/version, evidence confidence, verification, unresolved question and commit reference. Prefer direct authoritative links; distinguish vendor documentation from independent evaluation; keep contrary evidence and unsuccessful access attempts in the research log. Do not copy full papers or store credentials/real confidential source content in this repository.
