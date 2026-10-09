# Cortex AI in plain English

**Phase3 implementation note.** The careful librarian is now real for four reviewed numeric policy topics. React sends your date/scope to FastAPI; the backend checks identity, grants, approval and dates before reading evidence. It returns the supported value plus an exact passage, or says evidence is missing/conflicting. The20/18/future24 leave examples are actual seeded results, not free-form model predictions. [Run and inspect](../implementation/RUN_LOCAL.md) · [actual limits](../implementation/IMPLEMENTATION_STATUS.md) · [implemented diagram](../diagrams/11-implemented-core.svg). The explanation below preserves Phase2 planned context.

---

## Preserved Phase 2 baseline

**Planned behavior, not implemented.** Think of Cortex as a careful company librarian. Finding a page containing “leave” is only the first step. The librarian must check that you may read it, that it applies to your employee group on the requested date, and that it is approved. If two valid policies disagree, the librarian says so instead of inventing a compromise.

![How information moves](../diagrams/02-data-flow.svg)

Example: fictional Northstar Works has a 20-day leave policy for 2026 and a 24-day policy effective January 2027, uploaded in October. On October 9 the answer is 20 days. Upload time tells us when the file arrived, not when the rule applies.

The first working version will produce an evidence answer: a reviewed value or exact passage, with a link to its source. A local language model may improve wording later, but it cannot replace access or date checks. See [requirements](../planning/REQUIREMENTS.md) and [fixture expectations](../planning/DEMO_SCENARIOS.md).
