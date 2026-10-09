# Retrieval and reasoning explained

**Phase3 implementation note.** The current answerer uses no LLM. It recognizes four finite topics, retrieves only eligible clause IDs, scores allowed text, expands topic peers and compares reviewed numeric claims at the strongest authority. Equal-strength disagreement abstains. Exact spans/hashes are checked. General semantic contradiction, partial exceptions, embeddings and agent orchestration remain later experiments. [Run and inspect](../implementation/RUN_LOCAL.md) · [actual limits](../implementation/IMPLEMENTATION_STATUS.md) · [implemented diagram](../diagrams/11-implemented-core.svg). The explanation below preserves Phase2 planned context.

---

## Preserved Phase 2 baseline

![Pipeline](../diagrams/03-rag-pipeline.svg)

Retrieval means finding useful passages. Keyword search matches words, so “annual leave” finds policy clauses using those terms. Embeddings represent meaning numerically and may find paraphrases, but need a model and careful evaluation. We start with keyword matching because it runs on a CPU and is easy to inspect.

Reranking reorders candidate passages. Our first scorer uses matched query words on permitted text; it does not measure truth. Authority says which reviewed source governs a topic. A valid approved HR policy can outrank an informal note; equally authoritative valid policies with different values remain a conflict.

A citation connects a specific answer claim to a specific source span. Listing a document title is not enough: the passage must actually support the answer. If evidence is absent, unclear or contradictory, abstention means declining to provide a policy answer. This is a useful outcome, not an error hidden from the user.

There is no autonomous agent requirement. Fixed stages are easier to test. Optional agents later must improve measurable results compared with the same fixed workflow.
