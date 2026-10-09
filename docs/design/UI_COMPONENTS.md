# Reusable UI component contracts

**Current functional component inventory.** `App.tsx` implements session-aware shell/navigation/theme/drawer/route UX; `components.tsx` implements State, Badge, PageHeading, bounded resource loading, SourceDialog and date/state helpers; `api.ts` sends same-origin CSRF requests; `session.tsx` invalidates evidence on observed identity/role/revision changes. `pages/Assistant.tsx` implements composer, grounded answer, citations and exact escaped highlight; `Library.tsx` permitted rows/filter; `DocumentDetail.tsx` versions/source/download/review/version upload; `Upload.tsx` private ingestion; `Permissions.tsx` actual roles/grants; `Activity.tsx` history/conflicts/audit; Login/Dashboard use real session/API data.

The table below remains a design contract, not a claim every specified enhancement exists. Current library groups documents and opens versions separately; category/state filtering, full command palette, copy-quote control, broad sort/pagination and graphical lineage are not implemented. Ctrl+K focuses the query field. No mock application data is shipped as an alternative to API calls. [Actual scope](../implementation/IMPLEMENTATION_STATUS.md).

---

## Preserved Phase 2 baseline

**Design specification only.** Components consume allowed API data; a hidden route/button is not a permission check.

| Component | Content / states | Interaction and accessibility |
|---|---|---|
| AppShell | Wordmark, company, nav, user; role-appropriate actions | Skip link, active link aria-current; mobile drawer traps/restores focus |
| QueryComposer | Labeled question, as-of date, population/jurisdiction, submit | Enter behavior explicit; loading prevents duplicate submits; query persists only in own state |
| AnswerState | Answered/evidence, abstained/conflict/missing, clarification, changed context | Role=status; mode label “Evidence answer”; never invented confidence |
| ClaimWithCitation | Claim text + numbered source control | Keyboard button opens exact allowed quote, accessible name includes citation number |
| EvidencePane | Allowed title/version, approved/effective dates, quote/locator | Focus target, copy permitted quote, no external resource auto-fetch; generic access-change state |
| StatusBadge | Text state + restrained color | Meaning not color-only; future/expired distinguished from pending approval |
| DocumentTable | Title, category, version, approval, validity, authorized action | Semantic table headers, sortable column names; mobile labeled rows; no hidden totals |
| PolicyTimeline | Publication/upload/effective intervals separately labeled | Text alternative to timeline; no “latest” default inference |
| ConflictPanel | Two equally authoritative readable facts + scope/date | Clear “No definitive answer”; no Resolve button that silently chooses a fact |
| UploadStepper | Validating/extracting/review/ready or failed | Formats/bounds before selection; pending is not search-ready; safe error message |
| ACLGrantEditor | Current user/role READ grants separate from app role actions | Review changed grants, explicit save, prevent accidental lockout; revision-conflict retry |
| EmptyState / Error | Missing evidence, empty library, timeout, unavailable | Explain allowed next action; no hidden document title or existence hint |
| ActivityList | Permitted actor/time/action/outcome only | Auditor role required for global view, no raw sensitive prompts |

Mockup counts/statuses are labeled fictional. Functional generation, search, upload, login and permissions remain Phase3 tasks. Source drawer and admin actions must be tested against actual backend responses before demo.
