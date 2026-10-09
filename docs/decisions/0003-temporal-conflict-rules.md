# ADR 0003 — Reviewed validity intervals and bounded structured conflicts

- Timestamp: 2026-10-09T16:25:00+05:30; Phase 2 / reasoning.
- Status: selected planning baseline; implementation approval pending.
- Context: upload recency is not policy validity, and disagreement is not necessarily contradiction.
- Options: newest upload; recency decay; learned NLI alone; reviewed intervals/scope/authority and typed claim comparison.
- Decision: half-open valid dates in tenant timezone; separate publication/ingestion timestamps; append metadata revisions; topic authority after eligibility; complete authorized peer expansion for matched claim keys. Equal strongest conflicting claims cause cited abstention. Reviewed supersession closes predecessor interval; exact exceptions handled only with reviewed condition keys.
- Evidence: [TimelyRAG](https://arxiv.org/abs/2609.11572) and [Re³](https://aclanthology.org/2026.acl-long.1180/) are close temporal prior art; [Ragability](https://aclanthology.org/2026.lrec-1.182/) motivates conflict false-positive tests; [ALCE](https://arxiv.org/abs/2305.14627) motivates source support checks.
- Trade-offs: manual metadata/claims simplify correctness but limit arbitrary prose and increase annotation burden. Incorrect reviewer input remains a real risk. NLI optional after controlled rule baseline.
- Verification: fictional expected outcomes defined before implementation; date boundaries, scopes, amendment/exception negatives and peer overflow must be tested.
- Files: pipeline, schema, fixture specification, acceptance/tests/backlog and diagrams.
- Outstanding: do not infer benchmark quality or semantic understanding from a small curated corpus.
- Commit: resolve architecture/security planning subject in Git.
