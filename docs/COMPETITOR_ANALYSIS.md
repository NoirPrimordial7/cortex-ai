# Competitor analysis

Assessment date: **2026-10-09**, Asia/Calcutta. Research-only comparison of 13 systems/product families. Microsoft Search and enterprise Copilot are discussed separately inside one family; engines, frameworks and turnkey applications are not interchangeable baselines.

Evidence: **D** = documented by primary source, **P** = configurable building block or partial capability, **NV / NOT VERIFIED** = evidence insufficient; never an assertion of absence. **H** = direct technical documentation/code-level interface evidence; **M** = official product/README claim or incomplete edition detail. H describes evidence confidence, not independently proven security or answer quality. Target-user categories and Cortex lessons are our interpretations of documented use cases. No product was installed, benchmarked or purchased. Exact versions/editions must be pinned before experiments.

## 1. Glean

1. **Problem solved:** Fragmented workplace knowledge and repeated employee information seeking.
2. **Target users:** Enterprise employees, knowledge owners and administrators.
3. **Key features:** Cross-app search, cited assistant answers, knowledge verification and configured agents.
4. **Retrieval mechanism and evidence boundary:** Docs describe combined lexical and semantic search including domain-adapted vectors; proprietary weights and end-to-end algorithms are not disclosed. [G1: Glean hybrid retrieval and languages](https://docs.glean.com/administration/management/features/glean-language-support)
5. **Keyword/vector/hybrid/reranking/RAG:** Keyword, vector, hybrid and RAG documented; a separately configurable reranking stage is NOT VERIFIED here.
6. **Source citations:** Cited chat documented. [G4: Glean platform APIs](https://developers.glean.com/)
7. **Document/chunk access restrictions:** Document permission enforcement documented; independently configurable intra-document/chunk ACLs NOT VERIFIED.
8. **Inherited source permissions:** Source ACL preservation documented for Google Drive, with connector-specific exceptions. Do not generalize to every connector. [G2: Glean Google Drive permissions](https://docs.glean.com/connectors/native/gdrive/security/permissions)
9. **Conflict detection:** Explicit cross-document contradiction detection with measurable guarantees: NOT VERIFIED. Comparing text in chat is not an audited detector.
10. **Outdated/superseded/current validity:** Verified/deprecated document states and re-verification reminders exist. As-of validity windows and clause supersession NOT VERIFIED. [G3: Glean verification](https://docs.glean.com/user-guide/knowledge/verification/how-verification-works)
11. **Agentic workflow: actual work:** Agents can search indexed knowledge and invoke configured external actions; tool permissions apply. [G5: Glean actions](https://docs.glean.com/agents/actions/introduction-to-actions)
12. **Hallucination, injection and disclosure controls:** Permission-aware retrieval and tool policies reduce exposure; quantified hallucination or injection immunity NOT VERIFIED.
13. **Documented limitations and review trade-offs:** Source oversharing, indexing/permission changes, connector exceptions and vendor dependence require deployment review; no paid tenant tested.
14. **Openness and licensing:** Proprietary service; public API documentation does not make the product open source.
15. **Cortex learning — our interpretation:** Learn permission semantics and visible verifier/deprecation metadata; test whether explicit validity adds value beyond those existing controls.

Evidence set: [G1: Glean hybrid retrieval and languages](https://docs.glean.com/administration/management/features/glean-language-support); [G2: Glean Google Drive permissions](https://docs.glean.com/connectors/native/gdrive/security/permissions); [G3: Glean verification](https://docs.glean.com/user-guide/knowledge/verification/how-verification-works); [G4: Glean platform APIs](https://developers.glean.com/); [G5: Glean actions](https://docs.glean.com/agents/actions/introduction-to-actions). Confidence: H/M; unknowns explicitly marked above.

## 2. Microsoft Copilot (Microsoft 365 enterprise offering) and Microsoft Search

1. **Problem solved:** Find and use knowledge dispersed across Microsoft 365 productivity work.
2. **Target users:** Microsoft 365 employees and tenant administrators; developers extending enterprise experiences.
3. **Key features:** Graph-grounded assistance, semantic indexing, productivity orchestration and permission-trimmed Microsoft Search.
4. **Retrieval mechanism and evidence boundary:** Search uses Graph relevance signals; Copilot coordinates LLMs, permitted Graph context and apps. Current docs rename Microsoft 365 Copilot to Microsoft Copilot; licensing names remain transitional. [M1: Microsoft Copilot privacy and security](https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-privacy) [M2: Microsoft semantic indexing](https://learn.microsoft.com/en-us/microsoftsearch/semantic-index-for-copilot)
5. **Keyword/vector/hybrid/reranking/RAG:** Search keyword behavior and Copilot semantic retrieval/RAG documented. Exact vector engine, fusion weights and configurable reranker NOT VERIFIED; 'hybrid SharePoint' means on-prem/cloud federation, not necessarily lexical/vector fusion.
6. **Source citations:** Citations to grounding information documented for Copilot; Search returns source results rather than itself guaranteeing generated citation faithfulness.
7. **Document/chunk access restrictions:** Existing user view permissions constrain surfaced documents; separate chunk ACLs NOT VERIFIED.
8. **Inherited source permissions:** Source permissions retained; Search does not expand them. [M3: Microsoft Search overview](https://learn.microsoft.com/en-us/microsoftsearch/overview-microsoft-search)
9. **Conflict detection:** General policy contradiction detector: NOT VERIFIED.
10. **Outdated/superseded/current validity:** Recency/context and semantic indexing do not establish legally effective as-of validity; automatic supersession handling NOT VERIFIED.
11. **Agentic workflow: actual work:** Copilot orchestration and extensibility/agents documented; behavior and data handling depend on the chosen extension.
12. **Hallucination, injection and disclosure controls:** Vendor documents prompt-injection protections and Graph authorization. Existing overbroad sharing remains accessible; citations and protection claims are not universal correctness guarantees.
13. **Documented limitations and review trade-offs:** Tenant content governance and third-party agent privacy are customer responsibilities. No paid tenant or connector behavior tested.
14. **Openness and licensing:** Proprietary enterprise service.
15. **Cortex learning — our interpretation:** Learn identity-bound retrieval, governance of existing sharing and source-linked answers; avoid claiming RBAC as Cortex novelty.

Evidence set: [M1: Microsoft Copilot privacy and security](https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-privacy); [M2: Microsoft semantic indexing](https://learn.microsoft.com/en-us/microsoftsearch/semantic-index-for-copilot); [M3: Microsoft Search overview](https://learn.microsoft.com/en-us/microsoftsearch/overview-microsoft-search). Confidence: H; unknowns explicitly marked above.

## 3. Amazon Q Business

1. **Problem solved:** Enterprise question answering over connected organizational data.
2. **Target users:** Workforce users and AWS/identity administrators.
3. **Key features:** Connectors, enterprise assistant, citations, configurable grounding and guardrails.
4. **Retrieval mechanism and evidence boundary:** Retriever selects relevant authorized documents before generation; admin can allow model knowledge or restrict answers to enterprise data. [Q1: Amazon Q Business workflow](https://docs.aws.amazon.com/amazonq/latest/qbusiness-ug/how-it-works.html)
5. **Keyword/vector/hybrid/reranking/RAG:** RAG documented; precise managed vector/keyword/hybrid/reranking implementation NOT VERIFIED in reviewed pages. Do not infer internals from the word retriever.
6. **Source citations:** Source citations and content access controls documented. [Q2: Amazon Q Business overview](https://docs.aws.amazon.com/amazonq/latest/qbusiness-ug/what-is.html)
7. **Document/chunk access restrictions:** Document ACL support documented; chunk-specific restriction model NOT VERIFIED.
8. **Inherited source permissions:** Connected data ACL support exists, with identity mapping and connector configuration dependencies; all-connector parity NOT VERIFIED.
9. **Conflict detection:** Cross-policy contradiction detection: NOT VERIFIED. Hallucination correction compares support for a response, not necessarily mutual consistency of policies.
10. **Outdated/superseded/current validity:** Automatic operational validity windows or supersession: NOT VERIFIED.
11. **Agentic workflow: actual work:** Chat orchestration routes across configured plugins and data sources; agents do not thereby prove temporal/conflict analysis. [Q4: Amazon Q guardrails](https://docs.aws.amazon.com/amazonq/latest/qbusiness-ug/guardrails.html)
12. **Hallucination, injection and disclosure controls:** Optional high-confidence hallucination correction is documented. [Q3: Amazon Q hallucination mitigation](https://docs.aws.amazon.com/amazonq/latest/qbusiness-ug/hallucination-reduction.html)
13. **Documented limitations and review trade-offs:** Hallucination mitigation is unsupported with chat orchestration, plugin workflows and certain tabular/multimodal responses. Identity federation options have integration constraints; paid service not tested.
14. **Openness and licensing:** Proprietary AWS service.
15. **Cortex learning — our interpretation:** Learn pre-generation authorization and test guardrail composition: adding orchestration can change which protections are available.

Evidence set: [Q1: Amazon Q Business workflow](https://docs.aws.amazon.com/amazonq/latest/qbusiness-ug/how-it-works.html); [Q2: Amazon Q Business overview](https://docs.aws.amazon.com/amazonq/latest/qbusiness-ug/what-is.html); [Q3: Amazon Q hallucination mitigation](https://docs.aws.amazon.com/amazonq/latest/qbusiness-ug/hallucination-reduction.html); [Q4: Amazon Q guardrails](https://docs.aws.amazon.com/amazonq/latest/qbusiness-ug/guardrails.html). Confidence: H; unknowns explicitly marked above.

## 4. Google Gemini Enterprise and Agent Search

1. **Problem solved:** Unified enterprise search/assistance and developer-built search grounded in connected data.
2. **Target users:** Enterprise workforce, administrators and application developers.
3. **Key features:** Connected search, answer summaries, citations and enterprise agents.
4. **Retrieval mechanism and evidence boundary:** Current developer product page calls Vertex AI Search 'Agent Search on Gemini Enterprise Agent Platform'. Gemini Enterprise workforce apps use data stores, search and answer APIs; exact ranking internals NOT VERIFIED. [C1: Gemini Enterprise launch](https://cloud.google.com/blog/products/ai-machine-learning/introducing-gemini-enterprise/) [C2: Google Agent Search](https://cloud.google.com/products/gemini-enterprise-agent-platform/agent-search)
5. **Keyword/vector/hybrid/reranking/RAG:** Search and grounded answers documented; independent vector/hybrid/rerank mechanics for this enterprise surface NOT VERIFIED here. Do not borrow capabilities of unrelated Google databases.
6. **Source citations:** Summary citations configurable through includeCitations; default in the reviewed API is false. [C5: Gemini ContentSearchSpec](https://docs.cloud.google.com/gemini/enterprise/docs/reference/rest/v1/ContentSearchSpec)
7. **Document/chunk access restrictions:** Custom-source document ACLs and app/data-store IAM documented; chunk-specific ACLs NOT VERIFIED.
8. **Inherited source permissions:** Source ACLs synced for supporting third-party connectors; custom sources require identity and ACL metadata setup. IAM grants alone do not replace source ACLs. [C3: Gemini custom-source ACLs](https://docs.cloud.google.com/agentspace/docs/identity) [C4: Gemini granular access controls](https://docs.cloud.google.com/gemini/enterprise/docs/iam-policy-for-apps-and-data-stores)
9. **Conflict detection:** Formal cross-document contradiction detection: NOT VERIFIED.
10. **Outdated/superseded/current validity:** Automatic effective-date or partial supersession logic: NOT VERIFIED.
11. **Agentic workflow: actual work:** Enterprise platform advertises agent creation/orchestration; source retrieval and action authorization are separate configuration concerns. No agent run tested.
12. **Hallucination, injection and disclosure controls:** Identity-aware retrieval and IAM reduce disclosure; query-classification options exist. Robust resistance to malicious retrieved instructions NOT VERIFIED.
13. **Documented limitations and review trade-offs:** Broad project roles can defeat granular app/store isolation; connector support, licenses, API defaults and propagation delays matter. Product branding and API paths are transitional.
14. **Openness and licensing:** Proprietary cloud service; open client tooling is not an open product.
15. **Cortex learning — our interpretation:** Learn separate app/store/source permission layers and explicit citation configuration.

Evidence set: [C1: Gemini Enterprise launch](https://cloud.google.com/blog/products/ai-machine-learning/introducing-gemini-enterprise/); [C2: Google Agent Search](https://cloud.google.com/products/gemini-enterprise-agent-platform/agent-search); [C3: Gemini custom-source ACLs](https://docs.cloud.google.com/agentspace/docs/identity); [C4: Gemini granular access controls](https://docs.cloud.google.com/gemini/enterprise/docs/iam-policy-for-apps-and-data-stores); [C5: Gemini ContentSearchSpec](https://docs.cloud.google.com/gemini/enterprise/docs/reference/rest/v1/ContentSearchSpec). Confidence: H/M; unknowns explicitly marked above.

## 5. Azure AI Search

1. **Problem solved:** Managed indexing and retrieval for search, RAG and grounding agents.
2. **Target users:** Search engineers and enterprise application developers, rather than a turnkey employee assistant.
3. **Key features:** Full-text/vector/hybrid search, semantic ranking, ingestion enrichment and classic/agentic retrieval.
4. **Retrieval mechanism and evidence boundary:** Parallel lexical/vector retrieval with RRF; optional semantic reranking. Agentic retrieval adds LLM-assisted query planning and retrieval. [A1: Azure AI Search overview](https://learn.microsoft.com/en-us/azure/search/search-what-is-azure-search) [A2: Azure hybrid search](https://learn.microsoft.com/en-us/azure/search/hybrid-search-overview)
5. **Keyword/vector/hybrid/reranking/RAG:** Keyword, vectors, hybrid, semantic reranking and RAG grounding documented.
6. **Source citations:** Agentic output provides references/grounding artifacts; classic search requires application answer generation and citation presentation.
7. **Document/chunk access restrictions:** Document security filters and native ACL/RBAC approaches exist. Several native ingestion/enforcement features are preview; separate intra-document ACL model NOT VERIFIED. [A3: Azure document access control](https://learn.microsoft.com/en-us/azure/search/search-document-level-access-overview)
8. **Inherited source permissions:** Selected sources support inherited permission metadata, including ADLS/SharePoint preview paths. Generic arbitrary-source inheritance is application work.
9. **Conflict detection:** Dedicated contradiction detector: NOT VERIFIED.
10. **Outdated/superseded/current validity:** Metadata filters enable time constraints when supplied; automatic valid-time interpretation and supersession NOT VERIFIED.
11. **Agentic workflow: actual work:** Query planning/retrieval/response construction documented; request must carry appropriate end-user identity for protected evidence. [A4: Azure agentic retrieval requests](https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-how-to-retrieve)
12. **Hallucination, injection and disclosure controls:** Entra, authorization, network controls and retrieval filtering are documented. Grounding does not ensure immunity to prompt injection.
13. **Documented limitations and review trade-offs:** Preview/API-version/source constraints, permission propagation and operational cost. Confidential compute restricts some semantic/agentic features. A reviewed FAQ has older wording on DLS; current dedicated access-control docs take precedence with preview caveats.
14. **Openness and licensing:** Proprietary managed service; SDKs/samples may be open.
15. **Cortex learning — our interpretation:** Learn fusion baselines, references and identity propagation; measure stale ACL handling explicitly.

Evidence set: [A1: Azure AI Search overview](https://learn.microsoft.com/en-us/azure/search/search-what-is-azure-search); [A2: Azure hybrid search](https://learn.microsoft.com/en-us/azure/search/hybrid-search-overview); [A3: Azure document access control](https://learn.microsoft.com/en-us/azure/search/search-document-level-access-overview); [A4: Azure agentic retrieval requests](https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-how-to-retrieve); [A5: Azure security best practices](https://learn.microsoft.com/en-us/azure/search/search-security-best-practices). Confidence: H; unknowns explicitly marked above.

## 6. Elastic: Elasticsearch search/RAG capabilities; legacy Enterprise Search

1. **Problem solved:** Search over large indices and retrieval grounding for custom enterprise applications.
2. **Target users:** Search engineers, platform teams and existing Elastic enterprise-search customers.
3. **Key features:** Lexical/vector hybrid retrieval, configurable relevance and document/field security; application RAG integrations.
4. **Retrieval mechanism and evidence boundary:** Elasticsearch supports combined full-text/vector search and RRF. Standalone Enterprise Search, App Search and Workplace Search are unavailable in 9+; migrate to Elasticsearch-native tools. [E1: Elastic Enterprise Search migration](https://www.elastic.co/guide/en/enterprise-search/current/upgrading-to-9-x.html) [E2: Elasticsearch hybrid search](https://www.elastic.co/docs/solutions/search/hybrid-search)
5. **Keyword/vector/hybrid/reranking/RAG:** Keyword, vector and hybrid documented. Reranking can be integrated; exact current edition entitlement for each ranker needs planning-phase verification. RAG is application integration, not a universal assistant.
6. **Source citations:** Source hits/metadata available; generated source citations depend on the RAG application, NOT VERIFIED as universal engine behavior.
7. **Document/chunk access restrictions:** DLS/FLS read restrictions exist. Chunk security requires indexing chunks with preserved policy; automatically independent chunk ACLs NOT VERIFIED. [E4: Elasticsearch document and field security](https://www.elastic.co/docs/deploy-manage/users-roles/cluster-or-deployment-auth/controlling-access-at-document-field-level)
8. **Inherited source permissions:** Supported self-managed content connectors have permission syncing; beta and subscription limitations documented. [E3: Elastic connector DLS](https://www.elastic.co/docs/reference/search-connectors/document-level-security)
9. **Conflict detection:** Policy contradiction detector: NOT VERIFIED.
10. **Outdated/superseded/current validity:** Date/metadata filtering is configurable; automatic operational validity and supersession NOT VERIFIED.
11. **Agentic workflow: actual work:** Search/RAG orchestration can be composed; native autonomous conflict/authorization/temporal stage set NOT VERIFIED.
12. **Hallucination, injection and disclosure controls:** DLS/FLS and configured identity constraints support secure retrieval. Multi-role grants can broaden access; no LLM injection guarantee follows.
13. **Documented limitations and review trade-offs:** Migration burden, cluster operation, license gating and beta connector security. Read security does not safely constrain write privileges. Elastic also documents aggregate information about inaccessible documents as a possible disclosure path; direct search API exposure requires separate restrictions.
14. **Openness and licensing:** Mixed licensing/open code and commercial features; do not label all Elastic functionality as permissively open source.
15. **Cortex learning — our interpretation:** Learn composable lexical/vector retrieval and connector policy fields; review licenses before a student prototype depends on paid security features.

Evidence set: [E1: Elastic Enterprise Search migration](https://www.elastic.co/guide/en/enterprise-search/current/upgrading-to-9-x.html); [E2: Elasticsearch hybrid search](https://www.elastic.co/docs/solutions/search/hybrid-search); [E3: Elastic connector DLS](https://www.elastic.co/docs/reference/search-connectors/document-level-security); [E4: Elasticsearch document and field security](https://www.elastic.co/docs/deploy-manage/users-roles/cluster-or-deployment-auth/controlling-access-at-document-field-level). Confidence: H; unknowns explicitly marked above.

## 7. OpenSearch

1. **Problem solved:** Self-managed search and vector retrieval with configurable security and RAG pipelines.
2. **Target users:** Search/platform engineers and developers building grounded applications.
3. **Key features:** Hybrid score/rank fusion, DLS/FLS, conversational memory and RAG/flow-agent integration.
4. **Retrieval mechanism and evidence boundary:** Search pipelines normalize/combine lexical and semantic scores or use RRF; conversational RAG uses a retrieval_augmented_generation processor. [O1: OpenSearch hybrid search](https://docs.opensearch.org/latest/vector-search/ai-search/hybrid-search/index/) [O4: OpenSearch conversational RAG](https://docs.opensearch.org/latest/vector-search/ai-search/conversational-search/)
5. **Keyword/vector/hybrid/reranking/RAG:** Keyword/vector/hybrid documented; reranking can be composed but reviewed evidence establishes fusion, not every ranker. RAG processor available.
6. **Source citations:** Search evidence returned; automatic faithful inline citations across every RAG configuration NOT VERIFIED.
7. **Document/chunk access restrictions:** Security plugin provides document/field read restrictions. Chunk restrictions require correct indexed policy granularity. [O2: OpenSearch document security](https://docs.opensearch.org/latest/security/access-control/document-level-security/) [O3: OpenSearch field security](https://docs.opensearch.org/latest/security/access-control/field-level-security/)
8. **Inherited source permissions:** Automatic inheritance from arbitrary connected enterprise sources NOT VERIFIED; source ACL ingestion/mapping is an integration task.
9. **Conflict detection:** Contradiction detector: NOT VERIFIED.
10. **Outdated/superseded/current validity:** Time filters can be engineered; automatic supersession and as-of validity NOT VERIFIED.
11. **Agentic workflow: actual work:** Conversational flow agent retrieves and invokes LLMs; a flow is not evidence of autonomous policy reconciliation. [O5: OpenSearch conversational agent](https://docs.opensearch.org/latest/ml-commons-plugin/tutorials/rag-conversational-agent/)
12. **Hallucination, injection and disclosure controls:** DLS/FLS can constrain retrieved data; LLM/tool permissions and prompt-injection resistance require additional controls.
13. **Documented limitations and review trade-offs:** DLS/FLS do not restrict writes; multi-role combinations and required visible query fields are subtle. Operating a cluster adds memory and maintenance burden.
14. **Openness and licensing:** Apache-2.0 open-source project; hosting and third-party models may cost money.
15. **Cortex learning — our interpretation:** Learn server-enforced restrictions and inspect read/write boundaries; a local prototype need not inherit full cluster complexity.

Evidence set: [O1: OpenSearch hybrid search](https://docs.opensearch.org/latest/vector-search/ai-search/hybrid-search/index/); [O2: OpenSearch document security](https://docs.opensearch.org/latest/security/access-control/document-level-security/); [O3: OpenSearch field security](https://docs.opensearch.org/latest/security/access-control/field-level-security/); [O4: OpenSearch conversational RAG](https://docs.opensearch.org/latest/vector-search/ai-search/conversational-search/); [O5: OpenSearch conversational agent](https://docs.opensearch.org/latest/ml-commons-plugin/tutorials/rag-conversational-agent/). Confidence: H; unknowns explicitly marked above.

## 8. Onyx (formerly Danswer)

1. **Problem solved:** Search/chat across company documents and application-layer tools for LLMs.
2. **Target users:** Teams seeking hosted or self-hosted enterprise knowledge assistance.
3. **Key features:** Indexed hybrid/agentic RAG, connectors, custom agents, deep research and external actions.
4. **Retrieval mechanism and evidence boundary:** Official repository describes hybrid indexing and a custom retrieval-agent harness; it is a vendor/maintainer description, not a benchmark we reproduced. [N1: Onyx official repository](https://github.com/onyx-dot-app/onyx)
5. **Keyword/vector/hybrid/reranking/RAG:** Hybrid/RAG documented; exact current BM25/vector/rerank internals and defaults NOT VERIFIED at pinned-code level.
6. **Source citations:** Grounded answers documented; citation presentation/faithfulness on the current build NOT VERIFIED in this review.
7. **Document/chunk access restrictions:** Connector docs explicitly scope preservation of user permissions to Enterprise Edition; freely available chat/RAG is not proof of free permission-sync support. [N2: Onyx connector documentation](https://docs.onyx.app/overview/core_features/connectors)
8. **Inherited source permissions:** Enterprise Edition permission preservation documented; connector-specific capabilities and refresh/revocation behavior need tests.
9. **Conflict detection:** Explicit cross-policy contradiction detector: NOT VERIFIED.
10. **Outdated/superseded/current validity:** Connector updates sync; update sync does not establish effective validity or partial supersession, which remain NOT VERIFIED.
11. **Agentic workflow: actual work:** Custom agents select knowledge/tools; deep research performs multiple research steps; external/MCP actions available per repository.
12. **Hallucination, injection and disclosure controls:** Self-hosted/local processing options reduce external exposure; permission sync is edition-specific. Quantified injection/hallucination resistance NOT VERIFIED.
13. **Documented limitations and review trade-offs:** Community/enterprise differences, deployment complexity and connector fidelity. No local deployment or paid enterprise build tested.
14. **Openness and licensing:** Community core MIT; enterprise features use separate terms. A MIT-only FOSS mirror exists. [N3: Onyx MIT-only distribution](https://github.com/onyx-dot-app/onyx-foss/blob/main/README.md)
15. **Cortex learning — our interpretation:** Learn inspectable retrieval and connector design while avoiding reliance on paid ACL sync as a free baseline.

Evidence set: [N1: Onyx official repository](https://github.com/onyx-dot-app/onyx); [N2: Onyx connector documentation](https://docs.onyx.app/overview/core_features/connectors); [N3: Onyx MIT-only distribution](https://github.com/onyx-dot-app/onyx-foss/blob/main/README.md). Confidence: H/M; unknowns explicitly marked above.

## 9. RAGFlow

1. **Problem solved:** Grounded Q&A over complex documents with parsing and workflow orchestration.
2. **Target users:** Developers and teams handling PDFs, tables and document-heavy knowledge bases.
3. **Key features:** Document understanding/chunking, cited Q&A, configurable retrieval and no-code workflow components.
4. **Retrieval mechanism and evidence boundary:** Knowledge-base retrieval exposes keyword/vector weighting, thresholds, top N and optional rerank model. [R1: RAGFlow official repository](https://github.com/infiniflow/ragflow) [R4: RAGFlow components](https://ragflow.io/docs/v1.0.0-rc1/basic_component)
5. **Keyword/vector/hybrid/reranking/RAG:** Vector/keyword/hybrid, optional reranking and RAG documented.
6. **Source citations:** Citations can be enabled for agent responses using retrieval results; source spans do not alone prove entailment.
7. **Document/chunk access restrictions:** Open-source Only me/Team resource scopes are documented. Current permission-rule docs describe additional document operations, but edition and query-path enforcement are NOT VERIFIED. Independent chunk ACLs NOT VERIFIED. [R2: RAGFlow open-source sharing](https://ragflow.io/docs/v1.0.0-rc1/guides/team/sharing_scope_configuration/open_source_edition_sharing_scope_configuration) [R3: RAGFlow permission rules](https://github.com/infiniflow/ragflow/blob/main/docs/guides/team/permission_system_overview/permission_effective_rules.md)
8. **Inherited source permissions:** Automatic preservation of connected source ACLs NOT VERIFIED; resource collaboration permissions are not equivalent.
9. **Conflict detection:** General contradiction detector: NOT VERIFIED; a workflow could be configured to compare evidence.
10. **Outdated/superseded/current validity:** Date metadata/workflows could support temporal rules; built-in effective validity or partial supersession NOT VERIFIED.
11. **Agentic workflow: actual work:** Canvas components support branching, loops, categorization, retrieval and HTTP/database/MCP tools; agent tool use may decide when to retrieve.
12. **Hallucination, injection and disclosure controls:** Grounding, permissions and instructions reduce some risk; measured injection resistance NOT VERIFIED.
13. **Documented limitations and review trade-offs:** Reviewed v1.0.0-rc1 docs are release-candidate evidence, not a stable-version guarantee. Parser quality, model/index resources, reranking and reflection add latency.
14. **Openness and licensing:** Apache-2.0 repository with edition-dependent permission documentation; other providers/services retain their licenses.
15. **Cortex learning — our interpretation:** Learn parsing traces, chunk evidence and simple workflows; validate security scope in the exact edition/version.

Evidence set: [R1: RAGFlow official repository](https://github.com/infiniflow/ragflow); [R2: RAGFlow open-source sharing](https://ragflow.io/docs/v1.0.0-rc1/guides/team/sharing_scope_configuration/open_source_edition_sharing_scope_configuration); [R3: RAGFlow permission rules](https://github.com/infiniflow/ragflow/blob/main/docs/guides/team/permission_system_overview/permission_effective_rules.md); [R4: RAGFlow components](https://ragflow.io/docs/v1.0.0-rc1/basic_component). Confidence: H/M; unknowns explicitly marked above.

## 10. AnythingLLM

1. **Problem solved:** Accessible local or self-hosted chat/RAG over uploaded knowledge and agent skills.
2. **Target users:** Individuals and small teams wanting configurable model and embedding providers.
3. **Key features:** Workspaces, document embedding, attached-document chat, local models and extensible agents.
4. **Retrieval mechanism and evidence boundary:** Embedded documents are chunked and searched as vectors; optional Accuracy Optimized reranking is documented for LanceDB. [T2: AnythingLLM document behavior](https://docs.anythingllm.com/chatting-with-documents/introduction)
5. **Keyword/vector/hybrid/reranking/RAG:** Vector, optional reranking and RAG documented. Native keyword/hybrid support on the reviewed path NOT VERIFIED.
6. **Source citations:** Document sources/grounded chat available; current inline citation behavior and faithfulness NOT VERIFIED in reviewed evidence.
7. **Document/chunk access restrictions:** Workspace/user scopes documented; embedding makes the document available to all workspace users and threads. Per-document/chunk ACL enforcement on that path NOT VERIFIED.
8. **Inherited source permissions:** Preserving external source permissions per individual document NOT VERIFIED.
9. **Conflict detection:** Automatic cross-document contradiction detector: NOT VERIFIED.
10. **Outdated/superseded/current validity:** Automatic validity windows/supersession: NOT VERIFIED.
11. **Agentic workflow: actual work:** Custom agent skills extend callable behavior; their privileges and correctness require review. [T3: AnythingLLM custom skills](https://docs.anythingllm.com/agent/custom/introduction)
12. **Hallucination, injection and disclosure controls:** Local model/storage option reduces third-party disclosure; it does not solve workspace oversharing or malicious content. Guaranteed hallucination/injection prevention NOT VERIFIED.
13. **Documented limitations and review trade-offs:** Context pruning can drop information, RAG can miss passages, and reranking costs time. A shared workspace is too coarse for mixed confidential documents without additional policy controls.
14. **Openness and licensing:** MIT application; model/provider services have independent costs and terms. [T1: AnythingLLM official repository](https://github.com/Mintplex-Labs/anything-llm)
15. **Cortex learning — our interpretation:** Learn inexpensive demonstrations and distinguish workspace isolation from document-level enterprise authorization.

Evidence set: [T1: AnythingLLM official repository](https://github.com/Mintplex-Labs/anything-llm); [T2: AnythingLLM document behavior](https://docs.anythingllm.com/chatting-with-documents/introduction); [T3: AnythingLLM custom skills](https://docs.anythingllm.com/agent/custom/introduction). Confidence: H/M; unknowns explicitly marked above.

## 11. LlamaIndex

1. **Problem solved:** Developer framework connecting external data to retrieval/generation workflows.
2. **Target users:** AI application engineers rather than a turnkey corporate knowledge service.
3. **Key features:** Composable indices/retrievers, node postprocessors, citation query engine and agents.
4. **Retrieval mechanism and evidence boundary:** Retriever guides describe BM25/hybrid/fusion, metadata and composed retrieval; postprocessors rerank before response synthesis. [L2: LlamaIndex retriever guides](https://developers.llamaindex.ai/python/framework/module_guides/querying/retriever/retrievers/) [L4: LlamaIndex rerankers](https://developers.llamaindex.ai/python/framework/module_guides/models/rerankers/)
5. **Keyword/vector/hybrid/reranking/RAG:** Keyword/vector/hybrid/reranking/RAG available through chosen integrations, not uniform defaults across stores.
6. **Source citations:** CitationQueryEngine builds source-node-based citations; output still requires faithfulness evaluation. [L3: LlamaIndex citations](https://developers.llamaindex.ai/python/framework-api-reference/query_engine/citation/)
7. **Document/chunk access restrictions:** Metadata filters can be applied to nodes/stores; user identity policy and fail-closed enforcement must be built. Framework filters alone are not ACL guarantees.
8. **Inherited source permissions:** Source connector ingestion is not proof of source permission inheritance; automatic end-to-end ACL preservation NOT VERIFIED.
9. **Conflict detection:** NLI or LLM comparison can be composed; turnkey validated contradiction detector NOT VERIFIED.
10. **Outdated/superseded/current validity:** Metadata filtering permits engineered date checks; built-in policy supersession or legal validity interpretation NOT VERIFIED.
11. **Agentic workflow: actual work:** Agents/workflows can choose tools and perform retrieval; application controls execution permissions. [L5: LlamaIndex agents](https://developers.llamaindex.ai/python/framework/module_guides/deploying/agents/)
12. **Hallucination, injection and disclosure controls:** Grounding and constrained postprocessing are building blocks; security, tool privilege and injection defense remain application obligations.
13. **Documented limitations and review trade-offs:** Store-specific filter semantics, framework churn, integration/model dependencies and data handling differences; no framework baseline run.
14. **Openness and licensing:** MIT core framework with separate hosted/commercial offerings. [L1: LlamaIndex official repository](https://github.com/run-llama/llama_index)
15. **Cortex learning — our interpretation:** Learn modular retrieval/citation components and explicit traceable boundaries; candidate tool only, no stack selection.

Evidence set: [L1: LlamaIndex official repository](https://github.com/run-llama/llama_index); [L2: LlamaIndex retriever guides](https://developers.llamaindex.ai/python/framework/module_guides/querying/retriever/retrievers/); [L3: LlamaIndex citations](https://developers.llamaindex.ai/python/framework-api-reference/query_engine/citation/); [L4: LlamaIndex rerankers](https://developers.llamaindex.ai/python/framework/module_guides/models/rerankers/); [L5: LlamaIndex agents](https://developers.llamaindex.ai/python/framework/module_guides/deploying/agents/). Confidence: H/M; unknowns explicitly marked above.

## 12. Haystack

1. **Problem solved:** Composable retrieval, generation and agent pipelines with explicit components.
2. **Target users:** AI/search developers and teams requiring inspectable orchestration.
3. **Key features:** Retrievers, joiners, rankers, generators, answer builders and tool-using agents.
4. **Retrieval mechanism and evidence boundary:** Sparse/dense retrievers can be joined into hybrid pipelines; chosen store supports its own filters and hybrid strategy. [H2: Haystack retrievers](https://docs.haystack.deepset.ai/docs/retriever)
5. **Keyword/vector/hybrid/reranking/RAG:** Keyword/vector/hybrid and RAG documented; ranker components allow reranking, with model/latency dependency.
6. **Source citations:** AnswerBuilder can parse reference patterns; without a pattern all input docs are associated. This is source attribution machinery, not entailment verification. [H3: Haystack AnswerBuilder](https://docs.haystack.deepset.ai/docs/answerbuilder)
7. **Document/chunk access restrictions:** Metadata filters available; enterprise user/document ACL enforcement is application/store responsibility, NOT VERIFIED as turnkey framework behavior.
8. **Inherited source permissions:** Automatic source ACL synchronization NOT VERIFIED.
9. **Conflict detection:** Comparison/classifier pipelines possible; turnkey contradiction detector NOT VERIFIED.
10. **Outdated/superseded/current validity:** Time filtering can be engineered; policy effective dates and supersession NOT VERIFIED as native end-to-end features.
11. **Agentic workflow: actual work:** Agent calls configured tools with state and exit conditions; deterministic pipelines can orchestrate the same retrieval stages. [H4: Haystack Agent](https://docs.haystack.deepset.ai/docs/agent)
12. **Hallucination, injection and disclosure controls:** Inspectable pipeline boundaries enable controls; prompt injection and unauthorized tools require explicit policy and testing.
13. **Documented limitations and review trade-offs:** Integration-specific filters, component/API evolution and user-built policy enforcement; no baseline executed.
14. **Openness and licensing:** Apache-2.0 framework; commercial deepset platform is a separate offering. [H1: Haystack official repository](https://github.com/deepset-ai/haystack)
15. **Cortex learning — our interpretation:** Learn reproducible stage ablations and explicit component outputs; compare against a simple fixed pipeline before agent autonomy.

Evidence set: [H1: Haystack official repository](https://github.com/deepset-ai/haystack); [H2: Haystack retrievers](https://docs.haystack.deepset.ai/docs/retriever); [H3: Haystack AnswerBuilder](https://docs.haystack.deepset.ai/docs/answerbuilder); [H4: Haystack Agent](https://docs.haystack.deepset.ai/docs/agent). Confidence: H/M; unknowns explicitly marked above.

## 13. Vectara

1. **Problem solved:** Managed grounding, retrieval and agents over application knowledge corpora.
2. **Target users:** Enterprise application developers and organizations seeking managed RAG.
3. **Key features:** Hybrid retrieval, filters/rerankers, citations, agent steps, traces and hallucination evaluation/correction.
4. **Retrieval mechanism and evidence boundary:** Vendor docs describe chunking → embedding → BM25+dense+filters → reranking → citations → generation context. Treat performance/safety language as vendor claims. [V1: Vectara retrieval](https://docs.vectara.com/docs/search-and-retrieval) [V2: Vectara platform stack](https://docs.vectara.com/docs/platform-architecture/platform-stack)
5. **Keyword/vector/hybrid/reranking/RAG:** Keyword/vector/hybrid/reranking/RAG documented.
6. **Source citations:** Source-linked generated citations documented; independent entailment accuracy not measured here.
7. **Document/chunk access restrictions:** Current platform documentation claims retrieval-time RBAC and identity-entitled chunks; corpus RBAC plus trusted metadata filters are described. Independently authored per-chunk ACL semantics NOT VERIFIED.
8. **Inherited source permissions:** Session-bound ACL/tenant filters can scope searches; automatic inherited-source ACL parity across connectors NOT VERIFIED. [V3: Vectara agent retrieval tuning](https://docs.vectara.com/docs/agents/tune-retrieval-for-agents)
9. **Conflict detection:** General policy contradiction detector: NOT VERIFIED; hallucination correction targets unsupported output, not automatically conflicting policies.
10. **Outdated/superseded/current validity:** Time-decay/UDF and metadata can shape retrieval; as-of effective windows and clause supersession NOT VERIFIED as built-in policy semantics.
11. **Agentic workflow: actual work:** Step graphs, scoped tools and sub-agent sessions documented; graph controls routing while LLM chooses within a step.
12. **Hallucination, injection and disclosure controls:** Vendor documents HHEM grading/correction, retrieval RBAC and scoped tools. None establishes attack immunity or zero hallucinations on Cortex data.
13. **Documented limitations and review trade-offs:** Proprietary service, provider/model dependencies and filter design/reindexing constraints. No subscription purchased or security audit performed.
14. **Openness and licensing:** Proprietary platform; public models/tools may have separate open releases.
15. **Cortex learning — our interpretation:** Learn observability, trusted filter binding and support checks; do not claim citations, reranking or verification stages as novel.

Evidence set: [V1: Vectara retrieval](https://docs.vectara.com/docs/search-and-retrieval); [V2: Vectara platform stack](https://docs.vectara.com/docs/platform-architecture/platform-stack); [V3: Vectara agent retrieval tuning](https://docs.vectara.com/docs/agents/tune-retrieval-for-agents). Confidence: H; unknowns explicitly marked above.
