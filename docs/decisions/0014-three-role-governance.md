# ADR 0014 — Three roles and independent policy approval

Timestamp: 2026-11-19T23:00:00+05:30. Status: implemented locally under the owner's enhancement request. Module: identity, policy governance and UI. Commit: see the feature branch history.

## Context and choice

The earlier implementation allowed a Knowledge Manager to upload and approve a source. Manager access also controlled direct-report leave reads. The requested three roles require independent review and centralized employee management.

Retain opaque sessions, current database role permissions, explicit READ grants and the existing exclusive request/transaction gate. Provision one Employee, Auditor or Admin membership per account, with a database uniqueness index and role-name guards. Intersect effective actions with the current role matrix on every request. Admin creates people and policy versions, submits review and distributes approved policies. Auditor creates reusable headings and approves or rejects submitted versions. Employee access requires both READ and an approved version. Every source/version route rechecks these conditions.

Migration 0005 preserves user IDs, password hashes, historical reviewers and reporting records. Existing Admin or Auditor memberships take precedence; discontinued roles become Employee. READ from memberships being removed is converted to direct grants for those original members, rather than shared with all Employees. Only exact fictional seed IDs and old email addresses are renamed, with collision checks. Historical approved sources receive headings from their existing category. Historical decisions are imported as history, without claiming an Auditor performed them.

## Alternatives and consequences

Keeping multiple active roles would allow Admins to acquire employee balances or approval actions. Automatically promoting Knowledge Managers to Auditor would expand privileges. Both were rejected. Existing users with discontinued roles may need an Admin to assign a privileged role deliberately. Historical ledger entries belonging to someone who is now Admin remain historical; no personal balance is exposed or created for that role.

Policy workflow events are append-only. Approval keeps the original strict metadata/span/claim checks. A separate comment-only rejection path avoids requiring invented dates or claims. Corrected source text requires a new immutable version. Submission adds an explicit Auditor READ grant and invalidates affected authorization revisions. Distribution never grants access to unapproved versions, including a newer draft on an otherwise approved document.

## UI and verification

Keep the forest/ivory shell, typography, controls and lazy routes. Before: Manager Team and Admin self-review. After: Leave Management for the three roles, Auditor Policy reviews, Employee/Auditor Re-audit tickets, and a personal leave card only for Employee. This extends the accepted design rather than selecting a new visual direction. See [verification and limitations](../implementation/GOVERNANCE_TEST_REPORT.md), migration tests and API role-matrix tests. Supersedes direct-report authorization in ADR 0008; historical records and date semantics remain preserved. No push or deployment is part of this decision.
