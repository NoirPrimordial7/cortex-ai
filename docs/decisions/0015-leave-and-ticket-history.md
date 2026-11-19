# ADR 0015 — Transactional leave applications and re-audit decisions

**2026-11-20:** Ticket intake and annotation-only resolution below are superseded by [ADR 0017](0017-conflict-driven-reaudit.md), following the owner's correction. The leave module and preserved historical records remain unchanged.

Timestamp: 2026-11-19T23:00:00+05:30. Status: implemented locally. Module: leave and policy tickets. Commit: feature branch history.

## Choice and rationale

Use the same SQLite database, SQLAlchemy Core, tenant foreign keys and exclusive single-process gate. Add application and ticket projections with revision checks, backed by append-only event records. Do not build a second authorization system or alter the evidence conflict resolver.

Leave applications count inclusive Monday–Friday dates. No holiday calendar exists; the form states that public holidays are counted. Existing configurable leave types and signed ledger allocations supply balances. Pending/rejected/withdrawn requests do not post a transaction. Auditor approval checks the current balance and appends one negative usage entry. An approved cancellation first becomes cancellation_pending; only Auditor approval appends one positive reversal. Unique request/operation and ledger links prevent duplicate postings. A declined cancellation returns to approved without a credit. All posting and status/history changes commit in the same request transaction. Admin can configure types and append allocations/corrections, while approval actions belong only to Auditor.

Tickets retain their initially selected accessible, approved policies. Only the concerned Employee and tenant Auditor can read them. Resolution selects one of those policies and rechecks the concerned Employee's current source access. Rollback clears the current resolution projection, appends its reason and creates an in-app notification. It never changes a policy, a query conflict or another ticket. Supporting TXT/PDF/DOCX files are opaque downloadable evidence, up to five files of 2 MiB per ticket, stored with SHA-256 in the same database. They are never parsed or indexed as policies.

## Consequences and verification

There is no automatic annual grant scheduler, holiday calendar, partial-day leave, email notification, escalation queue or attachment antivirus service. Configuration alone does not credit balances; Admin explicitly allocates through the ledger. Notifications persist in-app. Global serialization is retained, so a long policy extraction can delay leave or ticket requests. These limits are stated in the UI or operating report rather than simulated.

Tests cover exact deductions/restorations, stale/replayed and concurrent approvals, insufficient balances, withdrawal/rejection, private same-tenant and cross-tenant records, attachment boundaries, ticket rollback/history and restart persistence. See [the detailed report](../implementation/GOVERNANCE_TEST_REPORT.md). Previous [ADR 0008](0008-leave-ledger-and-direct-reports.md) explains the original ledger; its manager access is superseded by [ADR 0014](0014-three-role-governance.md).
