# ADR 0012 — Deterministic employee resolution

Recorded 2026-11-17, Asia/Calcutta. Status: implemented for local review.

Extract a person from supported leave-question forms. Normalize Unicode and
case, prefer an exact full name, then allow contiguous partial name tokens
with at least two characters per prefix. Match active users in the same
tenant and abstain on ties. No aliases or probabilistic NER model are used.

The resolver returns a candidate internally. The existing leave service
authorizes and audits access before exposing a name or balance. Unknown,
ambiguous and inaccessible matches have the same outward response. Active
directory changes can alter which partial names are unique. No schema
change is needed.
