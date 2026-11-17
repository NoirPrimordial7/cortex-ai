# ADR 0009 — Related policy search and personal leave in Ask Cortex

Recorded 2026-11-17, Asia/Calcutta. Status: implemented for local review.

The strict numeric answer keeps its topic-specific claim, equal-authority
conflict, exact span and source hash checks. Related search uses the same
current READ, approval, date, population and jurisdiction eligibility before
reading matching text. SQLite FTS5 finds candidate IDs. BM25 term statistics
use eligible matches so restricted text cannot affect visible ordering.
Snippets are short plain-text fragments with match markers. They appear below
the answer and are tracked as document dependencies for saved queries.

Reviewers can publish a search-only passage by leaving out the optional claim.
The existing authority and immutable-span checks still apply. A search-only
passage can never serve as a strict numeric claim.

Personal leave chat delegates to the existing ledger service. The live result
has its own source marker and carries no citations. History stores only a
generic lookup record without the person's name, prompt or balance. Unknown,
ambiguous and unavailable people share one abstention.

Suggestions use curated phrases, eligible policy titles and current direct
reports. Returning a report's name records a user-targeted audit event.
No schema change was needed for this increment.
