# Literature comparison

The studies below supply methods, evaluations or standards cited in the paper. Cortex reproduced none of the cited studies' published results. The linked records are in the reference audit. The project literature review was the starting inventory. ReAct was omitted from the manuscript comparison because the strict pipeline performs fixed retrieval and adjudication and the paper makes no tool-using-agent claim.

| Citation key | Method or capability | Original evaluation or scope | Limitation and relevance to Cortex |
|---|---|---|---|
| alavi | Enterprise knowledge management | Organizational issues and benefits | Establishes organizational setting; no temporal or evidence-answer evaluation. |
| sandhu | RBAC constraints and role permissions | Model and standardization proposal | Cortex combines action permissions with document READ grants. |
| buettcher | Access-aware full-text search | File permissions and performance comparison | Direct precedent for authorization-aware search; application-level isolation is narrower than a full index security model. |
| lewis | Neural retriever plus generator | Knowledge-intensive NLP tasks | Open-domain benchmarks; Cortex uses deterministic output for the strict decision. |
| robertson | BM25 family of lexical ranking | Derivation and ranking framework | Relevant baseline and passage-search component; no policy validity layer. |
| karpukhin | Dense dual-encoder passage retrieval | Open-domain QA datasets | Motivates paraphrase tests; Cortex uses a local, smaller encoder in the passage path. |
| cormack | Rank-list fusion | TREC-style ranking evaluation | Equal-weight fusion used for related passages; rank alone has no authority semantics. |
| thakur | Zero-shot retrieval benchmark | Heterogeneous retrieval tasks and models | Shows value of lexical baselines and out-of-domain tests; no policy access scope. |
| dhingra | Time-conditioned models | Temporal factual queries | Fact recency and change motivate temporal scope; Cortex uses reviewed explicit intervals. |
| ouyang | Benchmark of stale and current evidence | Wikipedia snapshot changes and QA | Public encyclopedia drift differs from approved policy windows and scoped authority. |
| cao | Time-aware retrieval and recency filtering | Temporal QA benchmarks | Close temporal/conflict work; explicit applicability and a later publication date answer different questions. |
| nam | Clause-level temporal reranking | Synthetic TimelyQABench | Direct prior work on evolving policy-like sources; cited as a preprint. |
| williams | Natural-language inference | Multi-genre annotated sentence pairs | Structured numeric incompatibility is narrower than semantic contradiction. |
| gross | Conflicting and consistent contexts | Controlled inter-context contradictions | Motivates explicit negative controls; supplied context differs from an authorized corpus. |
| gao | ALCE citation quality evaluation | Open QA, citation support and completeness | Exact offsets and hashes establish evidence location and integrity; separate semantic support is still needed. |
| es | Reference-free RAG evaluation | Retrieval and answer quality dimensions | Motivates component metrics; Cortex uses case-specific gold evidence and access observations. |
| asai | Adaptive retrieval and critique | QA, reasoning and fact verification | Learned self-critique and fixed adjudication gates have different failure modes. |
| geifman | Selective prediction and risk–coverage | Classification with rejection | Useful reporting framework; rules here do not estimate calibrated risk. |
| zou | Retrieval corpus poisoning | Controlled security study of LLM-based retrieval systems | Untrusted content motivates curated approval; no robustness claim against malicious approved policies. |
| rfc8032 | Ed25519 signature specification | Standard plus test vectors | Explains primitive; binding signer to an organization requires separate trust. |
