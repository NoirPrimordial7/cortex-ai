# ADR 0010 — Local MiniLM hybrid retrieval

Recorded 2026-11-17, Asia/Calcutta. Status: implemented for local review.

Use the official sentence-transformers all-MiniLM-L6-v2 ONNX export on CPU,
with the pinned tokenizer, 256-token limit, masked mean pooling and 384-value
L2-normalized embeddings. The model and tokenizer are downloaded once with
SHA-256 checks. The service loads only verified local files and makes no
inference network calls. Use CORTEX_EMBEDDING_MODEL_DIR to opt in.

Migration 0003 puts vectors alongside clauses in SQLite with a same-tenant
foreign key. Approved review writes the vector atomically with the index
projection. Pending/rejected review removes the projection. Existing approved
clauses can be backfilled offline after validating each immutable source span.

Filter by current caller and policy eligibility before reading vector values.
Rank cosine candidates above 0.30, keep the best 12 and fuse them with all
positive eligibility-local BM25 matches using reciprocal ranks with constant
60. Recheck eligibility and source integrity before returning an excerpt.
Embedding similarity only affects related passages. Finite numeric proof and
conflict handling remain deterministic. This is a small-corpus brute-force
design with English-oriented model coverage and no measured recall guarantee.

[Pinned upstream model](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/tree/c9745ed1d9f207416be6d2e6f8de32d1f16199bf)
