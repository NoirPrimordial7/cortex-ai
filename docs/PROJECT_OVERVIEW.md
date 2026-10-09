# Cortex AI — project overview

**Enterprise AI Knowledge Intelligence System** for a final-year BTech Computer Science project. Status on 2026-10-09: Phase 1 research only. Repository: https://github.com/NoirPrimordial7/cortex-ai, private. Project owner approval is required before Phase 2 planning.

## Problem and intended users

Employees need answers drawn from distributed SOPs, HR policies, legal/project documents and messages. Relevant text may be stale, inconsistent or inaccessible. A supported statement can still be wrong for the query date, location, approval scope or user. Intended users are employees querying permitted knowledge, knowledge owners approving source validity, and administrators maintaining access rules.

## Proposed objectives

- Retrieve relevant authorized evidence with visible sources.
- Identify applicable versions for an explicit as_of date rather than simply the latest upload.
- Detect scoped inconsistencies and distinguish them from legitimate amendments or exceptions.
- Respect approved topic-specific authority and avoid silently resolving ambiguous equal-authority conflicts.
- Explain executed evidence-selection decisions without revealing restricted content.
- Abstain when permitted evidence cannot support a reliable answer.

These are desired, testable behaviors, not implemented capabilities. The initial academic objective is to determine whether this combination improves correctness/coverage while satisfying controlled authorization tests, and at what latency and complexity cost.

## Research boundaries and non-goals

No backend, frontend, agents, vector database, model deployment or production infrastructure exists. No stack is selected. No paid services, production credentials, real confidential company data or third-party accounts were used. Research may propose patterns and experimental designs but cannot establish security, novelty or performance without implementation and evaluation.

Broad novelty claims are inappropriate: [P12](https://aclanthology.org/2026.acl-long.1180/) and [P14](https://arxiv.org/abs/2609.11572) already address temporal/conflict-aware retrieval, and enterprise products already support permission-aware answers. The candidate contribution is a bounded, reproducible integration study with transparent failure analysis.

## Illustrative fixture — invented, not a real company policy

An approved travel policy allows a limit of 5,000 units through October 31. A future-effective policy, uploaded earlier, allows 6,000 from November 1. A newer informal message says 8,000. For an October 9 question, choose the approved applicable 5,000 rule; do not use upload recency as validity or the message as authority. If two approved applicable policies disagree for the same population, flag the permitted conflict and abstain from an unqualified value. If the necessary policy is inaccessible, answer only from permitted evidence or abstain without identifying the hidden document.

## Success dimensions for later evaluation

Correct evidence selection; as-of answer accuracy; authority accuracy; contradiction precision/recall and false alarms; citation entailment/coverage; selective accuracy versus coverage; unauthorized context/canary exposure; revocation/cache behavior; latency/calls/memory. No metric has been measured yet.

## Constraints and open inputs

Development deadline, team size, local CPU/GPU/RAM, permitted dataset access, submission criteria and preferred languages are unknown. The recommended scope assumes an 8–12 week implementation/evaluation period after planning and must be resized if that assumption fails. Dataset/model licenses and local resource costs remain to be reviewed.

See [research summary](RESEARCH_SUMMARY.md), [draft roadmap](PROJECT_ROADMAP.md), [architecture patterns](ARCHITECTURE_NOTES.md) and [gap analysis](RESEARCH_GAPS.md).
