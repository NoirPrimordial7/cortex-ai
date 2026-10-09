# ADR 0002 — Hard evidence eligibility and current-permission revocation

- Timestamp: 2026-10-09T16:25:00+05:30; Phase 2 / security and reasoning.
- Status: selected planning baseline; implementation approval pending.
- Context: relevant text can be unauthorized, future-effective or conflicting. A prompt instruction is not authorization.
- Options: retrieve-all then filter; post-generation redaction; SQL-scoped IDs before text; global relevance/confidence score vs eligibility then precedence.
- Decision: trusted identity + operation permissions + explicit document READ grants; same-tenant constraints; permission filtering before text/model stages. Reviewed approval/date/scope are hard eligibility. Historical queries use current rights. No cache/streaming A; reauthorize derived artifacts. In-process tenant gate and revision checks bound revocation races in single-process deployment.
- Reason/evidence: [Amazon Q documented flow](https://docs.aws.amazon.com/amazonq/latest/qbusiness-ug/how-it-works.html), [NIST ABAC](https://csrc.nist.gov/pubs/sp/800/162/upd2/final), [OWASP authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html); established practice, not invented novelty.
- Consequences: missing grants/metadata reduce answer coverage; mixed-access documents withheld or split; no administrator READ bypass; downloaded text cannot be recalled. Multi-process/cloud deployment needs a new consistency ADR.
- Verification: contracts reviewed across schema, pipeline, API and threat model; implementation must instrument unauthorized inputs and revocation races.
- Files: DATABASE_SCHEMA, SECURITY_MODEL, RAG_PIPELINE, API_DESIGN, diagrams and learning notes.
- Outstanding: actual endpoint enforcement and side-channel evaluation unimplemented.
- Commit: resolve architecture/security planning subject in Git.
