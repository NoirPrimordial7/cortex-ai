# Design references and skill review

Reviewed 10 October 2026. These references inform hierarchy and interaction; they do not supply Cortex assets, fonts, claims or backend behavior.

## Awwwards references

Selected from the official [Sites of the Year collection](https://www.awwwards.com/websites/sites_of_the_year/). Award entries are historical references; a current live site can differ from its awarded version.

| Reference | Verified source | What transfers to Cortex |
|---|---|---|
| Pangram Pangram Foundry | [Award entry](https://www.awwwards.com/sites/pangram-pangram-foundry), Site of the Day 11 November 2021; [current live site](https://pangrampangram.com/) inspected in the browser. | Clear typographic roles and quiet catalog metadata. Apply to question versus answer hierarchy and source previews; retain Cortex's own licensed bundled fonts. |
| Frans Hals Museum | [Award entry](https://www.awwwards.com/sites/franshals-museum), Site of the Day 17 April 2018; [current live site](https://franshalsmuseum.nl/en) inspected in the browser. | Strong content grouping and purposeful collection navigation. Apply to evidence reading and, after pilot approval, library organization. Its full-bleed video and art identity are not appropriate for a policy workspace. |
| Opal Tadpole | [Award entry](https://www.awwwards.com/sites/opal-tadpole), Site of the Day 11 January 2024. The entry's live link now redirects to [Opal Electronics](https://op.al/). | Historical reference for a focused product explanation and clear primary action. The awarded Tadpole interaction could not be inspected live in its original form, so no claim is made that Cortex reproduces it. |

Actual current browser captures are retained locally in `outputs/premium-refinement/references/`. They document research, not Cortex before/after results. No reference-site assets were downloaded or copied into the application. The applied decisions are our interpretation of these references.

## Skills searched and used

The official OpenAI curated skill catalog and current Anthropic/Vercel repositories were checked. Current upstream commit observations: Vercel Agent Skills `063bee94c3f4df8453406c830b0a7df0f2860278`; OpenAI Skills `49f948faa9258a0c61caceaf225e179651397431`. These identify researched sources, not automatic upgrades of local skills.

The four already-reviewed, project-scoped skills fit this application:

- [frontend-design](../../../.agents/skills/frontend-design/SKILL.md): subject-specific type/layout plan, restraint, screenshot critique.
- [web-design-guidelines](../../../.agents/skills/web-design-guidelines/SKILL.md): freshly fetched [current review rules](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md), applied to Ask semantics, focus, input size, content handling and responsive evidence inspection.
- [vercel-react-best-practices](../../../.agents/skills/vercel-react-best-practices/SKILL.md): separate relevant request lifetimes and measure actual bundle/runtime behavior. The source request must not prolong question-processing UI.
- [vercel-composition-patterns](../../../.agents/skills/vercel-composition-patterns/SKILL.md): lift the unfinished draft into a session-scoped provider rather than synchronizing it through effects or global browser storage.

The [OpenAI Playwright skill](https://github.com/openai/skills/tree/main/skills/.curated/playwright) was also reviewed. Its CLI-first wrapper duplicates the repository's established Playwright test workflow and is not installed. Figma, website-cloning and motion-generation skills do not improve this scoped pilot. Installing every design-related skill would add conflicting workflows; no unreviewed remote installer was executed. The existing four remain the implementation toolkit, with fresh guideline research and the pinned test runner. Official Playwright Firefox and WebKit binaries were installed for cross-engine verification.

Relevant upstream catalogs: [Anthropic frontend design](https://github.com/anthropics/skills/tree/main/skills/frontend-design), [Vercel Agent Skills](https://github.com/vercel-labs/agent-skills), [OpenAI Skills](https://github.com/openai/skills).
