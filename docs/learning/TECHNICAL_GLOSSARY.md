# Technical glossary

| Term | Plain meaning / Cortex example |
|---|---|
| API | A defined conversation between browser and backend, such as POST /queries |
| Authentication | Verify the person/session |
| Authorization | Decide whether that person may perform this action on this object |
| RBAC | Roles grant application actions; employee can ask, manager can review |
| ACL | Explicit list of users/roles allowed to read a document |
| Tenant | One company boundary; every tenant-owned row is scoped |
| Fail closed | Missing/uncertain permission or policy metadata causes refusal |
| RAG | Retrieve evidence, then generate an answer using that evidence |
| Extractive answer | Return an exact passage or reviewed value with a citation, without an LLM |
| FTS5 | SQLite's full-text matching extension |
| Embedding | Model-created numeric representation for semantic search; sensitive derived data |
| Hybrid retrieval / RRF | Combine keyword and semantic rank lists; optional later experiment |
| Reranker | Reorder permitted candidates by relevance; cannot grant access |
| Valid time | When a policy rule applies in the organization |
| Ingestion time | When Cortex received the file |
| Supersession | Reviewed replacement of an earlier clause at an effective boundary |
| Authority | Topic-specific precedence of reviewed source types |
| NLI | Learned classification of entailment/contradiction/neutrality; not policy governance |
| Abstention | Decline a definitive answer when permitted evidence cannot support it |
| Citation support | Evidence actually backs the specific answer claim |
| Provenance | Where content came from and how it was processed |
| CSRF | A malicious site attempts to make the browser issue authenticated changes |
| IDOR | User changes an object ID to access someone else's resource |
| Policy revision | Counter identifying the current access-governance state |
| ADR | A dated record explaining an architecture decision and trade-offs |
| Ablation | Remove one component to measure its actual contribution |
| Precision / recall | How many predicted conflicts are real / how many real conflicts were found |
| p95 latency | Duration below which 95% of measured requests completed |

Definitions explain the selected plan; they are not claims that every component is built.
