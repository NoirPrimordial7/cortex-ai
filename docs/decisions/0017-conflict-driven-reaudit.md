# ADR 0017 — Re-audit from an actual Cortex conflict, with a reversible primary

Timestamp: 2026-11-20T00:30:00+05:30. Status: implemented locally at the owner's request. Module: Ask Cortex, policy reviews and conflict decisions. Branch: `codex/conflict-driven-reaudit`.

## Before and requested correction

The previous Employee ticket form accepted policy IDs and a description independently of a Cortex answer. Auditor resolution annotated that ticket without affecting the answerer. If Admin distribution removed the Auditor's document grant, both choices became unavailable. The owner explicitly requested a single escalation button beside a detected disagreement, no Employee ticket section, both real policies in the Auditor dropdown, and Undo that restores the disagreement and reopens the review.

This supersedes the ticket intake and purely annotative resolution in [ADR 0015](0015-leave-and-ticket-history.md). Its leave decisions and historical records remain unchanged. It does not introduce a new visual direction.

## Decision

Keep the existing `policy_tickets` history, three roles, opaque sessions, SQLAlchemy Core/SQLite and exclusive request transaction. `POST /policy-tickets` now accepts only the owned `query_id`. The server loads the actual stored unresolved conflict, reconstructs current eligible evidence for its original date/scope and compares every original source. The client cannot supply policy IDs, descriptions or a preferred winner. An expired, unrelated, foreign, changed or inaccessible query cannot create the case.

Migration 0009 adds immutable conflict context, pinned source references and subscribers. Context includes topic/scope/date, origin query and a fingerprint over the complete strongest conflicting evidence set: clause/claim/version IDs, hashes, authority, claim key/value, validity and source kind. One tenant/fingerprint has one case; repeated clicks and matching Employee reports share it. New explicit, audited Auditor READ grants cover the involved documents. Existing manual records receive missing same-tenant Auditor grants, retain history/attachments, and remain view-only; a real detected conflict must be submitted for an actionable case. Historical manual input never becomes authority automatically.

The Auditor sees the exact source versions, excerpts, effective intervals and full source links. Dropdown values are clause IDs, rather than document IDs, so conflicting versions of one document remain separate choices. All text is hydrated under the actual Auditor's current READ. Candidate IDs independently check the originator's current eligibility; extra Auditor-only policies do not change the Employee's conflict set. Hash/span and signed original integrity checks fail closed before selection. Access revoked after submission stays revoked; GET does not silently recreate a grant.

## Answering and Undo

Only Auditor can select a primary. This records the chosen clause and decision history, then increments the tenant knowledge revision. Cortex still performs normal permission, approval, date/scope, authority, peer expansion and support checks. Only when the same strongest conflicting evidence set matches a current resolved case does it use that source's existing reviewed claim, with the cited answer labelled **Auditor-selected primary policy**. The underlying documents, metadata, authority ranks and hashes are unchanged. New versions, changed peers/ranks/validity, another scope, revoked READ or failed integrity cannot silently inherit the decision.

The scoped primary can govern other readers who independently have the same eligible source set. The original question and private review explanation are not thereby public: only case subscribers and Auditor receive the review explanation. Admin and other readers get the cited primary and a neutral explanation. Subscribers retain in-app notifications.

**Undo / Reopen conflict** requires an explanation and expected revision. In the same transaction it clears the primary projection, returns the case to pending, appends the rollback reason, notifies subscribers and increments knowledge revision. Subsequent matching questions abstain with both sources again. Saved answers based on the old choice are withheld; already visible answers clear on the existing session refresh/focus checks. The Auditor can then select the other version. Stale, repeated or racing decisions cannot overwrite the newer revision. Undo remains available even if source access/integrity later fails, because removing a prior choice must remain possible.

## Consequences and verification

Employee `/tickets` navigation, dashboard entry and form are removed; its old route redirects to Ask Cortex. Auditor retains the review queue, resolved cases and historical manual records. Employee attachment intake is retired with 410; historical evidence remains downloadable by authorized Auditor.

The original request must still have an active originator and a matching current eligible source set before primary selection. Changed access/source sets require a fresh Cortex question. Supported conflict detection remains the existing bounded structured numeric/authority workflow; this does not add semantic contradiction detection or a general-purpose policy ranking engine.

[Test report and actual browser views](../implementation/CONFLICT_REAUDIT_TEST_REPORT.md) cover primary/undo/reselection, missing review access, same-document versions, extra Auditor access, shared subscribers, privacy, tampering, migration/history, race/restart, both themes and required widths. No deployment or permission bypass is part of this decision.
