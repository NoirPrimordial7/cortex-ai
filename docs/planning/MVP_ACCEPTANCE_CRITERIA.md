# MVP acceptance gate — October 10 demonstration

**No criterion is currently passed by a functional application.** Architecture and static previews are planning deliverables. Milestone A must be evaluated after Phase 3 approval and implementation.

| Gate | Required evidence |
|---|---|
| A-G1 startup | Reproducible local setup, exact locks, runtime FTS5 check, no paid or required external AI service |
| A-G2 authentication | Two active users, logout/expiry/disabled-user checks; backend action enforcement; CSRF/Origin tests |
| A-G3 ingestion | Exact TXT plus one text PDF and one DOCX through bounded parser; state/hash/locator correct; pending/failed files not evidence |
| A-G4 permissions | D02,D08,D12 and route matrix; zero forbidden content at every downstream stage or visible surface |
| A-G5 validity | D03,D04,D11 produce exact expected source/value; upload/publish/effective dates visibly distinguished |
| A-G6 authority/conflict | D05,D06,D10 plus unknown/exception controls; no arbitrary tie break or conflation of different scopes |
| A-G7 answer/citations | D01,D07,D09; source spans and hashes verified, unsupported answers abstain, offline mode honestly labeled |
| A-G8 usable UI | Login, assistant, permitted library, upload/review, source detail; manager can edit grants; approved date and source pane visible |
| A-G9 audit/repeatability | Redacted events, fresh-run D01–D12 expected outputs, result log with failures and hardware/latency |

Demonstration narrative: sign in Maya → ask leave → inspect exact source → show future/historical boundary → show lower-authority note → show unresolved remote conflict → generic missing/restricted answer → manager revokes grant → history/citation inaccessible. Manager upload illustrates quarantine→review→publication. Use separate sessions, not frontend role switching.

## Honest fallback and stop rules

If time permits only TXT ingestion and assistant/library, present that as a partial vertical slice with named missing gates. Static high-fidelity mockups can show planned screens, visibly marked design concepts; they cannot count as functional tests. A security failure blocks that flow immediately. Remove optional model/vector work and secondary polish first. Do not remove ACL/date/citation checks to meet a percentage. College 40% rubric, team capacity and hardware remain unanswered; no percentage is claimed.

Before demo: run relevant unit/API/E2E checks once after final changes; use failures to prioritize fixes; don't hide failed cases or silently replace fixtures. All functional statuses and screenshots must be dated, cite the exact commit and identify design concept vs running system.
