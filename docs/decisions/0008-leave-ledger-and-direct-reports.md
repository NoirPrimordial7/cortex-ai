# ADR 0008 — Personal leave ledger and direct-report access

- Recorded 2026-11-12T00:52:12+05:30
- Status: implemented for feature-branch review
- Scope: personal leave balances and reporting relationships

Previously, Ask Cortex could cite a reviewed policy entitlement. The workspace
now also shows each user's actual balance in **My leave** and gives managers
a **Team** page with current direct reports and dated balance details.

Store signed whole-day grants, accruals, usage, adjustments and carry-forwards
in the central SQLite database. Compute each balance by summing entries through
the requested effective date, inclusive. A mutable total would lose the basis
for a historical balance and could drift from its transactions. Corrections are
new entries. SQLite triggers reject ledger updates, deletions and replacements.
Annual entitlement is leave-type metadata. It does not create a ledger credit.
An active type with no eligible entries starts at zero. An inactive type remains
visible for dates where the employee has ledger activity.

Manager assignments use tenant-local calendar dates and half-open intervals
`[valid_from, valid_to)`. A change ends the old assignment and begins the new
one on the same date in the existing protected transaction. Repeating the
assignment preserves its start date. When an assignment is changed twice on
one day, the superseded same-day row has an empty interval. The API rejects
overlap with a future assignment. Historical rows show who was assigned
when without granting historical access.

Every active user can read their own balance. A manager sees only current direct
reports in their tenant, including when the requested balance is historical. A
dual-role manager/admin still uses the direct-report rule for employee reads.
An administrator with `leave.manage` and no manager action can read active
same-tenant employees. Team listing requires `leave.view_reports`; posting an
entry requires `leave.manage`; changing managers requires `user.manage`.
Inaccessible employee balances return the same 404 as a missing account.
Successful calls write sanitized user-targeted audit events. The ledger and
its references have no document, FTS, answer, or citation integration.

Migration `0002` provisions the schema and role permissions on existing
databases. Fictional entries, leave types and the example relationship are
inserted only when seeding an empty database. Leave-type provisioning, scheduled
assignments, fractional days and administrator write forms are outside the
current API/UI. A loaded page reflects the last authorized response until
refetched. As-of dates describe the ledger's effective dates, so a later
backdated correction can change a historical balance.

Verification covers fresh and existing database migration, cutoff dates,
tenant and direct-report access, audit targets, append-only storage and policy
evidence separation. See [implementation status](../implementation/IMPLEMENTATION_STATUS.md)
and [CI](../implementation/CI.md). Commit subject: `feat: add employee leave ledger and manager visibility`.
