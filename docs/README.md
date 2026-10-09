# Cortex AI documentation

**Phase1 approved; Phase2 planning/design prepared for owner review; Phase3 has not begun.** All architecture, policies and UI demonstrations below describe intended behavior. Repository currently reports public; no visibility change performed here.

## Start here

- Understand the system: [plain-English explanation](learning/SYSTEM_EXPLAINED.md), [architecture explained](learning/ARCHITECTURE_EXPLAINED.md), [AI pipeline](learning/AI_PIPELINE_EXPLAINED.md), [security](learning/SECURITY_EXPLAINED.md), [database](learning/DATABASE_EXPLAINED.md), [glossary](learning/TECHNICAL_GLOSSARY.md).
- Inspect visuals: [ten-diagram gallery](DIAGRAMS.md), [UI design gallery](design/README.md), [design research](design/DESIGN_RESEARCH.md), [static HTML/CSS sources](design/mockups/index.html).
- Build after approval: [implementation backlog](planning/IMPLEMENTATION_BACKLOG.md), [exact development sequence](planning/DEVELOPMENT_SEQUENCE.md), [MVP acceptance gate](planning/MVP_ACCEPTANCE_CRITERIA.md).

## Architecture and engineering contracts

| Area | Documents |
|---|---|
| Scope / choices | [Requirements](planning/REQUIREMENTS.md), [selected stack](planning/TECH_STACK.md), [architecture](planning/SYSTEM_ARCHITECTURE.md) |
| Data / protection | [Schema](planning/DATABASE_SCHEMA.md), [security and bounded threat model](planning/SECURITY_MODEL.md) |
| Query contracts | [Retrieval/reasoning](planning/RAG_PIPELINE.md), [API](planning/API_DESIGN.md), [frontend](planning/UI_UX_PLAN.md) |
| Demonstration / evaluation | [Fictional scenarios](planning/DEMO_SCENARIOS.md), [fixture specification](planning/demo/fixture-spec.json), [tests and metrics](planning/TEST_STRATEGY.md) |
| Quality / provenance | [Phase2 review](planning/QUALITY_REVIEW.md), [planning sources](planning/PLANNING_SOURCES.md), [ADRs](decisions/README.md) |

## Preserved approved research

[Summary](RESEARCH_SUMMARY.md), [competitors](COMPETITOR_ANALYSIS.md), [cited comparison](FEATURE_COMPARISON.md), [literature](LITERATURE_REVIEW.md), [gaps](RESEARCH_GAPS.md), [proposed improvements](PROPOSED_IMPROVEMENTS.md), [source register](RESEARCH_SOURCES.md), [observed architecture](ARCHITECTURE_NOTES.md). These reports retain their Phase1 dates/status as historical research; current Phase2 choices live under planning/ADRs.

## Review and tracking

[Roadmap](PROJECT_ROADMAP.md), [changelog](changelog/CHANGELOG.md), [development log](logs/DEVELOPMENT_LOG.md), [research log](logs/RESEARCH_LOG.md). Commit history is the exact technical record. Planning selections await owner review before application implementation; no paid services or benchmark results.
