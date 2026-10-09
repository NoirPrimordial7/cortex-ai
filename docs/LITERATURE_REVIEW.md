# Literature review

Assessment date: **2026-10-09** (Asia/Calcutta). Fifteen academic works selected for problem relevance: retrieval baselines, contradiction, temporal validity, grounded generation, evaluation, attacks and enterprise knowledge governance. This is a focused research review, not an exhaustive systematic survey.

All titles, authors, years and identifiers below were checked against primary publication/arXiv records. Older foundational records were reviewed at abstract/metadata level; recent closest temporal/conflict work was additionally inspected at method/limitations sections. **Reported findings** belong to the authors and have not been reproduced. **Cortex relevance and scope inferences** are our interpretations. No paper's result is an achieved project result. Publication years are separated from preprint years. arXiv identifiers are supplied where a venue DOI was not checked.

## P01 — Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks

- **Authors:** Patrick Lewis; Ethan Perez; Aleksandra Piktus; Fabio Petroni; Vladimir Karpukhin; Naman Goyal; Heinrich Küttler; Mike Lewis; Wen-tau Yih; Tim Rocktäschel; Sebastian Riedel; Douwe Kiela.
- **Year/venue:** 2020 (NeurIPS; arXiv revised 2021).
- **Primary record:** [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401).
- **Identifier:** arXiv:2005.11401.
- **Objective:** Combine external retrievable knowledge with parametric generation.
- **Methodology:** Fine-tuned sequence-to-sequence generator with a dense Wikipedia index; sequence-level and token-level passage conditioning evaluated on knowledge-intensive tasks.
- **Verified reported findings:** Authors report better open-domain QA and more specific/factual generation than their parametric-only baselines; not a claim about all contemporary models.
- **Limitations:** Scope inference: Wikipedia QA does not test enterprise ACLs, policy effective windows, poisoning or enforceable source authority.
- **Relevance — our interpretation:** Use retrieval-plus-generation as a baseline; modern prompted RAG differs from this trained formulation.
- **Review depth:** Primary abstract/metadata; reported findings not reproduced.

## P02 — Reciprocal rank fusion outperforms condorcet and individual rank learning methods

- **Authors:** Gordon V. Cormack; Charles L. A. Clarke; Stefan Buettcher.
- **Year/venue:** 2009 (SIGIR).
- **Primary record:** [Reciprocal rank fusion outperforms condorcet and individual rank learning methods](https://doi.org/10.1145/1571941.1572114).
- **Identifier:** DOI:10.1145/1571941.1572114.
- **Objective:** Fuse rankings without learning cross-system score calibration.
- **Methodology:** Combine reciprocal rank contributions from multiple systems; experiments on TREC runs and LETOR 3.
- **Verified reported findings:** Authors report fused rankings outperform the individual systems and Condorcet fusion in evaluated settings.
- **Limitations:** Scope inference: historical benchmarks and rank-only fusion do not establish that every lexical/vector combination improves every domain; fusion cannot recover evidence missing from all candidate lists.
- **Relevance — our interpretation:** Define a reproducible hybrid baseline before adding temporal/authority logic.
- **Review depth:** Publisher abstract and bibliographic metadata; no experimental reproduction. [Author-hosted paper](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf) is a reachable primary alternative to the DOI publisher's automated-access restriction.

## P03 — BEIR: A Heterogenous Benchmark for Zero-shot Evaluation of Information Retrieval Models

- **Authors:** Nandan Thakur; Nils Reimers; Andreas Rücklé; Abhishek Srivastava; Iryna Gurevych.
- **Year/venue:** 2021 (NeurIPS Datasets and Benchmarks).
- **Primary record:** [BEIR: A Heterogenous Benchmark for Zero-shot Evaluation of Information Retrieval Models](https://arxiv.org/abs/2104.08663).
- **Identifier:** arXiv:2104.08663.
- **Objective:** Evaluate out-of-domain retrieval generalization.
- **Methodology:** Compare 10 lexical, sparse, dense, late-interaction and reranking systems on 18 datasets.
- **Verified reported findings:** BM25 is a robust baseline; reranking/late interaction perform strongly on average with greater computation in the reported experiments.
- **Limitations:** Scope inference: generic retrieval relevance labels do not cover enterprise access controls, validity or abstention.
- **Relevance — our interpretation:** Report Recall@k/nDCG and latency; do not assume vector-only retrieval is best.
- **Review depth:** Primary abstract/metadata; author findings not reproduced.

## P04 — A Broad-Coverage Challenge Corpus for Sentence Understanding through Inference

- **Authors:** Adina Williams; Nikita Nangia; Samuel R. Bowman.
- **Year/venue:** 2018 (NAACL; preprint 2017).
- **Primary record:** [A Broad-Coverage Challenge Corpus for Sentence Understanding through Inference](https://arxiv.org/abs/1704.05426).
- **Identifier:** arXiv:1704.05426.
- **Objective:** Create broad natural-language inference evaluation across genres.
- **Methodology:** MultiNLI supplies approximately 433,000 premise/hypothesis pairs with entailment, neutral and contradiction labels and cross-genre evaluation.
- **Verified reported findings:** Authors establish a diverse challenge corpus and report baseline difficulty; existence of contradiction labels is not proof of reliable policy contradiction recognition.
- **Limitations:** Scope inference: sentence-pair labels omit approval status, jurisdiction, exceptions, clause dependencies and temporal overlap; domain transfer must be measured.
- **Relevance — our interpretation:** Candidate conflict classifier foundation, with custom policy pairs and human-reviewed labels.
- **Review depth:** Primary abstract/metadata; policy transfer is our hypothesis.

## P05 — Time-Aware Language Models as Temporal Knowledge Bases

- **Authors:** Bhuwan Dhingra; Jeremy R. Cole; Julian Martin Eisenschlos; Daniel Gillick; Jacob Eisenstein; William W. Cohen.
- **Year/venue:** 2022 (TACL; preprint 2021).
- **Primary record:** [Time-Aware Language Models as Temporal Knowledge Bases](https://aclanthology.org/2022.tacl-1.15/).
- **Identifier:** DOI:10.1162/tacl_a_00459; arXiv:2106.15110.
- **Objective:** Probe and improve language-model knowledge that changes over time.
- **Methodology:** Diagnostic temporal factual dataset and language modeling conditioned jointly on text and timestamps; evaluate memorization, future calibration and refresh.
- **Verified reported findings:** Authors report improved temporal knowledge behavior and efficient refresh with time context.
- **Limitations:** Scope inference: temporal parameterized knowledge is different from authorized retrieval over valid clauses; no source permission guarantee.
- **Relevance — our interpretation:** Separate query time from ingestion time and avoid treating a model's remembered fact as approved evidence.
- **Review depth:** Publisher abstract/metadata verified; findings not reproduced.

## P06 — ReAct: Synergizing Reasoning and Acting in Language Models

- **Authors:** Shunyu Yao; Jeffrey Zhao; Dian Yu; Nan Du; Izhak Shafran; Karthik Narasimhan; Yuan Cao.
- **Year/venue:** 2023 (ICLR; preprint 2022).
- **Primary record:** [ReAct: Synergizing Reasoning and Acting in Language Models](https://arxiv.org/abs/2210.03629).
- **Identifier:** arXiv:2210.03629.
- **Objective:** Integrate reasoning and external actions.
- **Methodology:** Interleave model-produced task reasoning and actions on QA/fact verification with a Wikipedia API and interactive ALFWorld/WebShop tasks.
- **Verified reported findings:** Authors report improved performance and task trajectories over specified reasoning/action baselines.
- **Limitations:** Scope inference: these benchmarks do not prove secure enterprise tool authorization; more calls add cost and failure modes, and model traces are not policy proofs.
- **Relevance — our interpretation:** Optional bounded retrieval retries/tool use; compare with a deterministic pipeline and do not let an agent decide access grants.
- **Review depth:** Primary abstract/metadata; author results not reproduced.

## P07 — Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection

- **Authors:** Akari Asai; Zeqiu Wu; Yizhong Wang; Avirup Sil; Hannaneh Hajishirzi.
- **Year/venue:** 2023 preprint (venue not required for this record).
- **Primary record:** [Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection](https://arxiv.org/abs/2310.11511).
- **Identifier:** arXiv:2310.11511.
- **Objective:** Make retrieval and generation adaptive with learned critique.
- **Methodology:** Train models using reflection tokens to decide retrieval and evaluate passage relevance/support and output quality.
- **Verified reported findings:** Authors report improved factuality, QA and citation accuracy on evaluated tasks versus specified contemporary baselines.
- **Limitations:** Scope inference: requires trained reflection behavior; adding a prompted verifier is not a replication. Self-critique is not independent ground truth or permission enforcement.
- **Relevance — our interpretation:** Evaluate explicit support checks and selective retrieval without assuming reflection eliminates hallucination.
- **Review depth:** Primary abstract/metadata; experiments not reproduced.

## P08 — Enabling Large Language Models to Generate Text with Citations

- **Authors:** Tianyu Gao; Howard Yen; Jiatong Yu; Danqi Chen.
- **Year/venue:** 2023 (EMNLP).
- **Primary record:** [Enabling Large Language Models to Generate Text with Citations](https://arxiv.org/abs/2305.14627).
- **Identifier:** arXiv:2305.14627.
- **Objective:** Evaluate end-to-end generation with supporting citations.
- **Methodology:** ALCE benchmark and metrics for fluency, correctness and citation quality with retrieved corpora and prompting comparisons.
- **Verified reported findings:** Authors find substantial citation-support gaps; on ELI5 even their best tested models lack complete support about half the time.
- **Limitations:** Scope inference: automatic entailment checks and open-domain tasks need human calibration and adaptation to policies; no ACL or valid-time coverage.
- **Relevance — our interpretation:** Measure citation precision and claim coverage separately from merely displaying links.
- **Review depth:** Primary abstract/metadata; benchmark result is historical, not a universal current-model rate.

## P09 — RAGAs: Automated Evaluation of Retrieval Augmented Generation

- **Authors:** Shahul Es; Jithin James; Luis Espinosa Anke; Steven Schockaert.
- **Year/venue:** 2024 (EACL demonstrations; preprint 2023).
- **Primary record:** [RAGAs: Automated Evaluation of Retrieval Augmented Generation](https://aclanthology.org/2024.eacl-demo.16/).
- **Identifier:** DOI:10.18653/v1/2024.eacl-demo.16; arXiv:2309.15217.
- **Objective:** Accelerate evaluation of retrieval and generation without full ground-truth annotations.
- **Methodology:** Suite of reference-free metrics separating focused retrieval context, faithful use and response quality.
- **Verified reported findings:** Authors present automated assessment supporting faster evaluation cycles; this is not evidence that its judge can certify authorization or every factual claim.
- **Limitations:** Scope inference: model judges can make correlated errors; metric versions and model prompts affect reproducibility. No security assurance follows from a high aggregate score.
- **Relevance — our interpretation:** Use optional evaluation automation as a secondary signal; retain manually labeled policy, conflict and access ground truth.
- **Review depth:** Publisher abstract and arXiv metadata; no execution.

## P10 — PoisonedRAG: Knowledge Corruption Attacks to Retrieval-Augmented Generation of Large Language Models

- **Authors:** Wei Zou; Runpeng Geng; Binghui Wang; Jinyuan Jia.
- **Year/venue:** 2025 (USENIX Security; preprint 2024).
- **Primary record:** [PoisonedRAG: Knowledge Corruption Attacks to Retrieval-Augmented Generation of Large Language Models](https://www.usenix.org/conference/usenixsecurity25/presentation/zou-poisonedrag).
- **Identifier:** arXiv:2402.07867.
- **Objective:** Study targeted answer corruption through retrieved knowledge.
- **Methodology:** Optimize malicious text in black-box and white-box settings and insert small numbers of attack documents into large retrieval corpora; test defenses.
- **Verified reported findings:** Authors report strong targeted attack success, including a 90% result with five texts per target question in their tested settings, and insufficient tested defenses.
- **Limitations:** Scope inference: attacker capabilities and model/corpus conditions bound that rate; it must not be presented as every production system's attack success. Knowledge poisoning also differs from prompt-instruction injection.
- **Relevance — our interpretation:** Include benign-looking poisoned facts and malicious instructions as separate adversarial test categories.
- **Review depth:** Official USENIX record and arXiv abstract verified; not reproduced.

## P11 — HoH: A Dynamic Benchmark for Evaluating the Impact of Outdated Information on Retrieval-Augmented Generation

- **Authors:** Jie Ouyang; Tingyue Pan; Mingyue Cheng; Ruiran Yan; Yucong Luo; Jiaying Lin; Qi Liu.
- **Year/venue:** 2025 (ACL).
- **Primary record:** [HoH: A Dynamic Benchmark for Evaluating the Impact of Outdated Information on Retrieval-Augmented Generation](https://aclanthology.org/2025.acl-long.301/).
- **Identifier:** DOI:10.18653/v1/2025.acl-long.301.
- **Objective:** Measure interference from outdated evidence coexisting with current facts.
- **Methodology:** Token-level differences between Wikipedia snapshots plus LLM pipelines create evolving QA data; study retrieval and generation timeliness.
- **Verified reported findings:** Authors find stale evidence reduces accuracy and can cause harmful output even when current evidence is present; recognizing outdatedness does not necessarily prevent using it.
- **Limitations:** Author-stated, §7: snapshot cadence misses continuous change; many questions derive from individual articles; stale versions of one article are less heterogeneous than real multi-source evidence.
- **Relevance — our interpretation:** Design controlled stale/current mixtures and measure whether invalid evidence enters the generator, not just whether the answer is correct.
- **Review depth:** Full PDF methods/conclusion/limitations sections inspected; no reproduction.

## P12 — Re³: Relevance & Recency Retrieval for Mitigating Temporal Hallucination

- **Authors:** Jiawei Cao; Jie Ouyang; Mingyue Cheng; Zhaomeng Zhou; Chunli Liu; Yupeng Li; Zirui Liu; Shijin Wang (Anthology author order).
- **Year/venue:** 2026 (ACL).
- **Primary record:** [Re³: Relevance & Recency Retrieval for Mitigating Temporal Hallucination](https://aclanthology.org/2026.acl-long.1180/).
- **Identifier:** DOI:10.18653/v1/2026.acl-long.1180.
- **Objective:** Reduce temporal-semantic mismatch and stale-version interference.
- **Methodology:** Time-aware dual relevance encoder and listwise conflict-aware recency filter; Re² Bench and public benchmark comparisons.
- **Verified reported findings:** Authors report improvements across evaluated settings. Their reported gains are not Cortex results or proof that newest always means valid.
- **Limitations:** Author-stated, §6: assumes latest conflicting fact supersedes older facts within credible corpora; now-focused QA limits historical/multi-time use; LLM filter adds latency; temporal parsing remains ambiguous. Latest false/adversarial documents are outside scope.
- **Relevance — our interpretation:** Strong overlap with Cortex's initial temporal/conflict idea. Compare explicit approved validity/authority against recency, especially future-effective and historical cases.
- **Review depth:** Full PDF methods and limitations inspected; latest-authoritative assumptions checked; not reproduced.

## P13 — Ragability Benchmark: A Dataset and Library to Test LLMs on Inter-context Conflicts

- **Authors:** Stephanie Gross; Johann Petrak; Brigitte Krenn.
- **Year/venue:** 2026 (LREC).
- **Primary record:** [Ragability Benchmark: A Dataset and Library to Test LLMs on Inter-context Conflicts](https://aclanthology.org/2026.lrec-1.182/).
- **Identifier:** DOI:10.63317/2ty3hnn3bgb9.
- **Objective:** Evaluate implicit and explicit conflicts between supplied contexts.
- **Methodology:** Replace real entities with fantasy entities to reduce internal-knowledge interference; test seven LLMs with contradictory and non-contradictory contexts.
- **Verified reported findings:** Authors report that identifying contradictions can be easier than answering content questions; contradiction hints improve detection on conflict examples while hurting non-conflict cases.
- **Limitations:** Author-stated, §5.1: up to four contexts and limited conflict types; expansion needs manual work; checker LLMs also require validation; benchmark scores can give false confidence.
- **Relevance — our interpretation:** Use balanced non-conflict controls and measure false alarms; build policy-specific adjudication and avoid treating every changed rule as a simultaneous contradiction.
- **Review depth:** Full PDF limitations and primary abstract inspected; not reproduced.

## P14 — TimelyRAG: Semantic-Temporal Hybrid Retrieval for Time-Critical Question Answering in Overlapping-Evolving Documents

- **Authors:** Youngeun Nam; Joeun Kim; Hwanjun Song; Susik Yoon; Jae-Gil Lee; Byung Suk Lee.
- **Year/venue:** 2026 (September arXiv preprint; peer review NOT VERIFIED).
- **Primary record:** [TimelyRAG: Semantic-Temporal Hybrid Retrieval for Time-Critical Question Answering in Overlapping-Evolving Documents](https://arxiv.org/abs/2609.11572).
- **Identifier:** arXiv:2609.11572.
- **Objective:** Retrieve temporally appropriate evidence across successive policy/regulation amendments.
- **Methodology:** Semantic first-stage candidate retrieval followed by temporal compatibility reranking distinguishing insertion and event times, including clause-validity intervals; synthetic TimelyQABench.
- **Verified reported findings:** Authors report retrieval and generation gains on controlled overlapping-version scenarios; already addresses clause-level temporal retrieval, so Cortex must not claim this is new.
- **Limitations:** Author-stated: cannot recover missing first-stage candidates; harder temporal extraction outside formulaic effective dates; synthetic benchmark needs real versioned corpora; complex temporal logic remains future work.
- **Relevance — our interpretation:** Closest related temporal engineering work. Extend evaluation with explicit authority and authorized-only context, while testing ambiguous metadata and not silently equating insertion with validity.
- **Review depth:** Full HTML method and limitations inspected; preprint claims not independently reproduced.

## P15 — Knowledge Management Systems: Issues, Challenges, and Benefits

- **Authors:** Maryam Alavi; Dorothy Leidner.
- **Year/venue:** 1999 (Communications of the Association for Information Systems).
- **Primary record:** [Knowledge Management Systems: Issues, Challenges, and Benefits](https://aisel.aisnet.org/cais/vol1/iss1/7/).
- **Identifier:** DOI:10.17705/1CAIS.00107.
- **Objective:** Understand emerging organizational knowledge-management systems and outcomes.
- **Methodology:** Analyze practices and outcomes across fifty organizations.
- **Verified reported findings:** Authors identify concerns about accurate knowledge and encouraging contributions, alongside varied technical foundations.
- **Limitations:** Scope inference: historical organizational study is not a modern RAG security/effectiveness benchmark; cannot justify current product-performance claims.
- **Relevance — our interpretation:** Knowledge ownership, approval and maintenance are organizational inputs. Retrieval cannot manufacture trusted metadata or resolve every governance dispute.
- **Review depth:** Primary publisher abstract and bibliographic record; no raw study-data reanalysis.

## Coverage of requested research themes

| Theme | Evidence and implications |
|---|---|
| RAG | P01 baseline; external text improves access to knowledge, not guaranteed reliability. |
| Hybrid retrieval/reranking | P02 rank fusion; P03 retrieval generalization; Azure/OpenSearch/LlamaIndex/Haystack technical docs show present engineering patterns. |
| Enterprise knowledge management | P15 ownership/maintenance concern; Glean verification demonstrates current governance mechanisms. |
| Temporal reasoning/time-aware RAG | P05 timestamp modeling; P11 stale interference; P12 recency/conflict filter; P14 clause validity. |
| Versioning/validity/supersession | P14 overlaps the proposed contribution; valid/transaction-time distinction from Jensen/Snodgrass. |
| NLI/conflicts | P04 foundation; P13 domain/context conflict benchmark. |
| Trust/authority/provenance | Glean verified states; W3C PROV-DM represents derivation, not truth; authority must be organization-approved. |
| RBAC/ABAC | NIST roles and attribute policy models; source ACLs differ from app-level roles. |
| Permission-aware retrieval | Glean/Microsoft/Amazon/Google/Azure/Elastic evidence: filtering/authorization before generation already exists. |
| Agents/tools/orchestration | P06; actual workflows in RAGFlow/Haystack/Vectara; need fixed-pipeline comparison. |
| Hallucination/grounding/citations | P07 and P08; cited text may still be invalid or unauthorized. |
| Evaluation frameworks/benchmarks | P03/P08/P09/P11/P13/P14; no single benchmark covers all Cortex objectives. |
| Injection/poisoning | P10 targeted fact poisoning; OWASP indirect-injection and RAG pipeline guidance. |
| Secure indexing/embeddings/filters | OWASP guidance plus engine DLS docs; retain policy on every chunk and derived artifact. |

## Closest-work assessment

The broad proposed combination is **not established novelty**. Re³ already explicitly combines temporal and conflict-aware retrieval, and TimelyRAG already models clause-level validity under amendments. A defensible student contribution would test whether a small, auditable integration of **approved validity, source authority and authorization** improves controlled policy-answer quality and selective abstention over recency and basic RAG baselines. That integration's benefit is **unvalidated** until ablation experiments are run.

Technical standards and primary engineering sources supporting the coverage map are linked in [RESEARCH_SOURCES.md](RESEARCH_SOURCES.md). No benchmark, paper code, model weight or licensed paper PDF has been downloaded into the repository.
