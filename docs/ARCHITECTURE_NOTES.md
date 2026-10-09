# Architecture notes — observed patterns and proposed hypotheses

As of 2026-10-09. **Research notes, not an approved architecture or stack.** Descriptions below reflect published interfaces/docs, not access to proprietary internals. No software architecture has been implemented.

## Observed patterns

| Pattern | Primary evidence | What is established | Boundary |
|---|---|---|---|
| Permission-trimmed connected knowledge | [G2](https://docs.glean.com/connectors/native/gdrive/security/permissions), [M1](https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-privacy), [Q1](https://docs.aws.amazon.com/amazonq/latest/qbusiness-ug/how-it-works.html), [C4](https://docs.cloud.google.com/gemini/enterprise/docs/iam-policy-for-apps-and-data-stores) | Source identity/ACLs constrain enterprise retrieval/answers | Connector exceptions, source oversharing, sync and edition details need verification |
| Parallel lexical/vector fusion | [A2](https://learn.microsoft.com/en-us/azure/search/hybrid-search-overview), [O1](https://docs.opensearch.org/latest/vector-search/ai-search/hybrid-search/index/), [E2](https://www.elastic.co/docs/solutions/search/hybrid-search) | Hybrid retrieval with rank/score fusion is a standard pattern | No universal best fusion or quality gain assumed |
| Retrieval → postprocessing → synthesis | [L4](https://developers.llamaindex.ai/python/framework/module_guides/models/rerankers/), [H2](https://docs.haystack.deepset.ai/docs/retriever) | Frameworks expose separately inspectable stages | Framework composition does not enforce identity policy automatically |
| Document/chunk evidence references | [L3](https://developers.llamaindex.ai/python/framework-api-reference/query_engine/citation/), [H3](https://docs.haystack.deepset.ai/docs/answerbuilder), [V1](https://docs.vectara.com/docs/search-and-retrieval) | Source-node citations or references can be carried through generation | Displaying references does not establish claim support or validity |
| Configured workflow/agent steps | [R4](https://ragflow.io/docs/v1.0.0-rc1/basic_component), [H4](https://docs.haystack.deepset.ai/docs/agent), [V2](https://docs.vectara.com/docs/platform-architecture/platform-stack) | Routing, retrieval and tool execution can be orchestrated | Workflow orchestration and autonomous model planning are different capabilities |
| Knowledge lifecycle state | [G3](https://docs.glean.com/user-guide/knowledge/verification/how-verification-works) | Verified/deprecated content and verifier timestamps exist | Does not establish automatic as-of clause supersession |
| Temporal/conflict retrieval | [P12](https://aclanthology.org/2026.acl-long.1180/), [P14](https://arxiv.org/abs/2609.11572) | Research combines recency/conflict filtering or semantic/clause temporal compatibility | Re³ assumptions and TimelyRAG synthetic/extraction limits constrain transfer |
| Provenance model | [S3](https://www.w3.org/TR/prov-dm/) | Entities, activities and agents encode origin/derivation | Origin alone is not truth or organizational authority |

Published architecture/API diagrams are not proof of hidden ranking implementation, secure deployment configuration or product performance. Proprietary weights, models and operational policies are NOT VERIFIED unless explicitly documented.

## Proposed logical stages — hypotheses for Phase 2 comparison

A candidate fixed workflow is shown only to express research boundaries. Database/model/framework deployment choices remain open.

1. Resolve trusted user/tenant and requested date/scope; clarify ambiguous as_of intent.
2. Enforce permitted evidence eligibility before any model/reranker sees text. Lexical/vector retrieval uses the same trusted constraints; do not let prompts supply or weaken ACL filters.
3. Apply approved validity/lineage rules; retained historical versions support explicit historical requests.
4. Retrieve/fuse/rerank eligible evidence and record candidate coverage. A second defense checks permission again before context use; authority scoring can never override access or validity.
5. Match scoped claims, apply topic-approved authority, and flag unresolved contradictions among authorized applicable evidence. NLI and structured rules are competing candidates.
6. Generate only from allowed selected evidence with source-span links, or abstain with a safe reason.
7. Check claim support/citation consistency and emit an authorized trace. Optional bounded retrieval retries can seek missing permitted evidence but cannot change policy.

The ordering of temporal eligibility versus broad candidate retrieval is an experimental trade-off: early filters reduce invalid evidence but may lose relevant candidates when metadata is uncertain. Compare variants with the same authorization invariant. Similarity scores must not be treated as factual confidence.

## Candidate metadata contract — not a database schema decision

| Metadata | Why it matters | Research boundary |
|---|---|---|
| tenant_id, document_id, version_id, clause_id, source locator/hash | Identity and reproducible provenance | Hash proves consistency with an approved baseline, not safe content |
| ACL subjects/groups or controlled attributes; policy revision | Determine who may retrieve/use the record | Every chunk and derived artifact inherits reviewed policy; missing policy fails closed |
| approved status/approver and topic authority | Distinguish adopted policy from draft/message | Approval must come from trusted governance, never document text alone |
| jurisdiction/population/topic | Define applicability and conflict scope | Different scope can explain disagreement without contradiction |
| published_at, ingested_at, valid_from, valid_to | Separate system history and operational truth | Proposed half-open intervals [from,to); date-only timezone/boundary rules need approval |
| supersedes clause/version IDs and effective scope | Model partial amendments | Missing/cyclic lineage is an error; do not drop unchanged valid clauses |
| extraction source/confidence and reviewer | Distinguish stated metadata from inferred metadata | Manual truth first; automatic extraction evaluated separately |

Historical query semantics need two separate concepts: **what rule applied then**, and **what evidence was known then**. Do not assume these are the same. Historical content queries must still respect current user authorization; old ACL snapshots must not resurrect revoked access. This is a proposed policy requiring planning review.

## Security boundaries and trade-offs to evaluate

- Authentication/app RBAC, source document ACLs and section policy have separate roles. Mixed-access sections must be split with policy labels or withheld at the safest enclosing scope.
- Permission restriction must cover rerankers/conflict models, summaries, embeddings, chat memory, caches, citations, logs and tools. Embeddings and derived summaries are sensitive artifacts, not automatically anonymous.
- Never reveal a restricted document title, existence or rejection reason in the user trace. Within permitted evidence, explain executed reason codes instead of free-form invented rationales.
- Prevent document text from changing system policy or tool privileges. Use protected ingestion, read-only tool scopes and layered injection tests; no claim of absolute model immunity.
- Shared caches must bind tenant, identity/policy version and permitted evidence; revocation and retained conversation histories need explicit invalidation or reauthorization.
- Learned extraction/conflict/support checks can make correlated mistakes. Keep rules and audit data independently inspectable; document uncertainty and bounded abstention.

These are proposed engineering controls informed by [S1](https://csrc.nist.gov/pubs/sp/800/162/upd2/final), [S2](https://csrc.nist.gov/Projects/role-based-access-control/faqs), [S5](https://cheatsheetseries.owasp.org/cheatsheets/RAG_Security_Cheat_Sheet.html) and [S6](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html); they have not been built or security-tested. More agents may add latency and attack surface without quality improvement, so autonomy is optional and must be justified experimentally.

## Open architecture questions

Storage/metadata policy enforcement; parser support; clause-boundary preservation; model hardware; ACL revocation strategy; policy governance; deterministic versus learned conflict detection; earliest filter stage; audit redaction; evaluation judge calibration; resource/latency targets. Capture actual decisions as ADRs only in Phase 2 after approval.
