# User journeys and intended states

## Employee finds the current leave rule

Login Maya → assistant → choose2026-10-09/full-time/IN → ask annual leave → evidence answer20workingdays → open citationL26-C1 → inspect exact quote and effective interval. Future L27 is readable but not used for this answer. [Assistant concept](previews/assistant.png) illustrates intended layout, not executed retrieval.

## Employee asks about inaccessible knowledge

Maya asks executive bonus → backend scoped retrieval has no eligible governing evidence → generic abstention. UI must not display the executive title, amount, hidden-source count, or restricted rejection list. Direct guessed resource request looks unavailable. The fixture specification contains canaries for implementation tests; mockups for Maya never display those restricted details.

## Manager uploads a future version

Ravi opens upload → validates file → quarantined/extracting → pending review → independently enters approved scope/date/claims/source kind and READ grants → approve → atomic index publication. Future-effective version appears labeled future in allowed library/detail; current assistant answer still uses current valid policy. Protected metadata cannot be set by document instructions.

## Employee encounters equal-authority conflict

Maya asks remote work days → approved operations policiesA=2andB=3 both valid → assistant declines definitive answer and shows both readable spans. Manager review may later create an approved amendment; a UI click must not silently rewrite governance.

## Administrator revokes access

Ravi edits document READ grants → previews/save → policy revision changes → Maya's next history/citation/query call reauthorizes. Saved answer is withheld if dependency loses access; UI clears stale evidence. This cannot erase content Maya already viewed.

## Auditor checks activity

Isha opens activity → sees redacted permitted security events, time/action/outcome. Auditor role does not itself allow reading source policy text. Dashboard counts reflect only accessible records. No real organization data used.
