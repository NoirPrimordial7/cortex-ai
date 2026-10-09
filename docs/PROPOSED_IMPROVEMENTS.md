# Proposed improvements — research hypotheses

As of 2026-10-09. Recommendation only; implementation and architecture approval pending. Consult [gaps](RESEARCH_GAPS.md) and [draft roadmap](PROJECT_ROADMAP.md).

## Top five actionable ideas

1. **Authorized evidence as a hard boundary.** Derive subject/tenant from trusted authentication, apply policy consistently to lexical/vector retrieval, reranking, conflict analysis, caches, citations and tools. Fail closed on missing ACL/tenant metadata. In a controlled fixture, require zero unauthorized context/canary exposure; this is a test gate, not a universal security proof. Existing permission-aware products make this an engineering requirement, not novelty. [G2](https://docs.glean.com/connectors/native/gdrive/security/permissions) [M1](https://learn.microsoft.com/en-us/microsoft-365/copilot/microsoft-365-copilot-privacy) [O2](https://docs.opensearch.org/latest/security/access-control/document-level-security/)
2. **Approved validity and version lineage.** Capture valid_from/valid_to and supersedes at clause level alongside published_at/ingested_at. Permit historical as_of requests. Do not infer validity solely from upload time. Use manual metadata first to separate reasoning quality from extraction errors. Closely related prior art already exists. [S4](https://www2.cs.arizona.edu/~rts/pubs/TRmerged.pdf) [P14](https://arxiv.org/abs/2609.11572)
3. **Scope-aware authority and conflict handling.** Apply explicit organization-owned approval/authority only among relevant, permitted, temporally applicable clauses. Match subject/population/jurisdiction and retain same-authority conflicts. Add an NLI/LLM detector only if it beats simple structured rules on ambiguous prose. [G3](https://docs.glean.com/user-guide/knowledge/verification/how-verification-works) [P04](https://arxiv.org/abs/1704.05426) [P13](https://aclanthology.org/2026.lrec-1.182/)
4. **Claim support, explanations and abstention.** Cite permitted spans; separate answer correctness from citation entailment and coverage. Record executed reason codes, not invented rationale. Abstain for insufficient permitted evidence, uncertain validity or unresolved permitted conflict without disclosing restricted sources. [P08](https://arxiv.org/abs/2305.14627) [P09](https://aclanthology.org/2024.eacl-demo.16/)
5. **Controlled benchmark and staged ablations.** Freeze a curated policy corpus/splits and compare keyword, vector, hybrid, latest-upload, explicit-validity, authority, conflict and abstention variants. Evaluate a bounded retrieval planner only after fixed stages work. Publish negative results and cost/latency as well as quality. [P03](https://arxiv.org/abs/2104.08663) [P11](https://aclanthology.org/2025.acl-long.301/) [P12](https://aclanthology.org/2026.acl-long.1180/)

## Candidate acceptance criteria for later planning

These are proposed gates, not achieved metrics or fixed requirements. Numeric quality/latency targets must be agreed after hardware and baseline measurements.

| Improvement | What must be observable | Failure case to include |
|---|---|---|
| Permission boundary | Authorized document/chunk IDs entering each model stage; access decision snapshot | Missing ACL; tampered user filter; revocation; cross-user cache; restricted-source trace |
| Validity | Selected clause version matches approved time/jurisdiction | Future-effective policy uploaded early; expired policy reuploaded; backdated amendment |
| Authority | Approved topic-specific policy outranks conflicting informal message without hiding equal-authority conflict | Draft with newer timestamp; wrong department authority; forged approval metadata |
| Conflict | Flag includes permitted supporting clauses and calibrated confidence | Exception versus base rule; paraphrase; different population/date; low candidate recall |
| Abstention/support | Answer state, claim-to-span links and failure cause | Low relevance; unsupported claim; mixed permitted evidence; no eligible evidence |

## Proposed sequencing and kill criteria

Start with metadata-ground-truth fixtures and deterministic eligibility. If this cannot reliably select permitted valid evidence, pause model/agent expansion. Establish retrieval recall and simple answer baseline before a learned detector. Add one enhancement at a time and remove components that fail to improve the agreed quality/coverage objective or exceed the measured resource budget. No paid APIs, cloud resources or automatic external actions are needed for this proposal.

## Dependency decisions deliberately open

Language/framework, document store/vector engine, embedding model, reranker, local generator, parser and orchestration library remain undecided. Evaluate licensing, maintenance, hardware and filter semantics in Phase 2. Candidate building blocks include LlamaIndex or Haystack and engine-level metadata restrictions; listing a tool is not selecting it. A fixed pipeline is the provisional comparison baseline, not a frozen deployment architecture.
