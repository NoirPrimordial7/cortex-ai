# Cortex AI

Conflict-aware and permission-safe enterprise knowledge intelligence, proposed as a final-year BTech Computer Science project.

Company knowledge is scattered across policies, SOPs, legal documents, and project files. Relevant text can still be outdated, inconsistent, or inaccessible to the person asking. Cortex AI will investigate whether retrieval augmented generation, explicit validity metadata, source authority, and authorization checks can produce more reliable, evidence-backed answers.

**Status: Phase 1 approved; Phase 2 architecture and development planning in progress, as of 2026-10-09 (Asia/Calcutta).** Stack and contracts are selected as a planning baseline. No functional application, agents, database or measured evaluation has been implemented. Phase 3 requires explicit owner approval.

The preserved Phase 1 dossier covers 13 competitor families, 15 academic works and 76 primary references. Paper findings are author-reported, product behavior is documentation-based, and unverified functionality is explicitly qualified. No experiments or product benchmarks have been run. No paid services are authorized.

Repository: https://github.com/NoirPrimordial7/cortex-ai. Created private in Phase 1; authenticated GitHub metadata on 2026-10-09 now reports **public**. This change was not performed by this planning task. Visibility must not change without explicit approval.

Change policy: meaningful work must update the appropriate changelog and research/development log, be reviewed for sensitive content, and be committed and pushed with the outcome verified. Never force-push or discard existing work.

## Research documents

- [Research briefing](docs/RESEARCH_SUMMARY.md) and [project overview](docs/PROJECT_OVERVIEW.md)
- [Competitor profiles](docs/COMPETITOR_ANALYSIS.md) and [cited feature matrix](docs/FEATURE_COMPARISON.md)
- [Literature review](docs/LITERATURE_REVIEW.md) and [source register](docs/RESEARCH_SOURCES.md)
- [Research gaps](docs/RESEARCH_GAPS.md) and [proposed improvements](docs/PROPOSED_IMPROVEMENTS.md)
- [Draft roadmap and three scopes](docs/PROJECT_ROADMAP.md) and [observed/proposed architecture notes](docs/ARCHITECTURE_NOTES.md)
- [Quality review](docs/QUALITY_REVIEW.md), [decision policy](docs/decisions/README.md), [changelog](docs/changelog/CHANGELOG.md), [development log](docs/logs/DEVELOPMENT_LOG.md) and [research log](docs/logs/RESEARCH_LOG.md)
- [Paper registry](research/papers/README.md), [competitor registry](research/competitors/README.md), [proposed experiment protocol](research/experiments/README.md), [source inventory](research/SOURCE_INVENTORY.json) and [dated link checks](research/SOURCE_CHECKS.json)

Selected planning direction: a bounded, reproducible policy-answering system using reviewed access, validity and approval metadata, with conflict/abstention evaluation and matched retrieval baselines. Temporal/conflict-aware retrieval, permissions, citations and agents already exist; no world-first claim is made. [Selected stack](docs/planning/TECH_STACK.md), [architecture](docs/planning/SYSTEM_ARCHITECTURE.md), [security contract](docs/planning/SECURITY_MODEL.md), [visual diagrams](docs/DIAGRAMS.md) and [fictional demonstration expectations](docs/planning/DEMO_SCENARIOS.md) are planning artifacts awaiting owner review before implementation.

## Visual architecture — planned

![Cortex system architecture](docs/diagrams/01-system-architecture.svg)

The browser uses one backend that checks identity and access before evidence analysis. Offline evidence answers are the required baseline; local generation is an optional later enhancement.

## Long-term traceability

Every meaningful change records ISO 8601 date/time with timezone, phase/module, files added/changed/removed, reason, outcome, verification/tests, outstanding issues and commit reference when available. Update the changelog and relevant chronological log; add an ADR when an actual architecture decision is made. A commit cannot contain its own hash: record it in the next log update or resolve its descriptive subject with Git.

Before each push, inspect staged filenames and diff, check for secrets/confidential content, commit only intended changes, push to the verified remote/branch and compare remote HEAD with local HEAD. Ignore rules are defense in depth and cannot guarantee that a secret is never staged. Never change repository visibility or collaborators without explicit approval.
