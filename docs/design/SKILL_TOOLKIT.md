# Cortex AI — curated agent design toolkit

**Status:** four selected skills installed locally at project scope on 2026-10-09; all four appeared in the next turn's catalog on 2026-10-10, confirming discovery. Pinned sources and inspection results are recorded in [the installation record](evidence-desk/SKILL_INSTALLATION.md). Playwright test dependencies and browser binaries remain a later implementation step. This branch has no application UI changes. [Latest six-concept exploration](evidence-desk/round-2/README.md) awaits owner selection.

## Recommended sources (start small)

| Priority | Source | What to use | Why |
|---|---|---|---|
| 1 | [Anthropic skills](https://github.com/anthropics/skills) | `frontend-design` | Stronger layout, visual hierarchy and character than default dashboard boilerplate. Review SKILL.md before use. |
| 2 | [Vercel Agent Skills](https://github.com/vercel-labs/agent-skills) | `web-design-guidelines` | Systematic UI reviews including clarity and accessibility. |
| 3 | [Vercel Agent Skills](https://github.com/vercel-labs/agent-skills) | `vercel-react-best-practices` | React correctness, bundle/performance and rendering review. |
| 4 | [Vercel Agent Skills](https://github.com/vercel-labs/agent-skills) | `vercel-composition-patterns` where available | Avoid unmaintainable component architecture and prop sprawl. |
| 5 | [Microsoft Playwright](https://github.com/microsoft/playwright) | Browser testing tooling (not a replacement for a design skill) | Automated viewport, interaction and regression testing. |

Additional **already available ChatGPT** skills include Product Design audit, get-context, ideate, image-to-code and design QA; Vercel react-best-practices and verification. These ChatGPT-hosted skills do **not** automatically install inside a local Codex desktop workspace.

## Safe local installation (Codex Desktop, project scope)

1. In PowerShell open the real project directory (`E:\Cortex AI` if unchanged). Run `git status`; do not overwrite local work. Make or switch to a feature branch.
2. Check current Node and npx versions, then inspect the skills CLI help. Do **not** run unexamined remote shell install scripts.
3. Run the discovery commands separately:
   ```powershell
   npx skills add anthropics/skills --list
   npx skills add vercel-labs/agent-skills --list
   ```
   Check exact advertised names and package integrity; skill names and CLI flags can change.
4. After reviewing each `SKILL.md`, install **only** the listed, trusted skills for Codex at project scope using the CLI's current documented flags. An example on CLI versions supporting these switches:
   ```powershell
   npx skills add anthropics/skills --skill frontend-design --agent codex
   npx skills add vercel-labs/agent-skills --skill web-design-guidelines --agent codex
   npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices --agent codex
   ```
   Confirm scope and destination in the CLI prompt; use non-interactive flags only after checking help. Do not choose global installation.
5. Inspect all newly added `SKILL.md`, scripts and references; review Git diff and ignore rules. Verify Codex can discover them in a **new session**. Commit reviewed project-local skill files only if they are legally redistributable and non-sensitive. Otherwise record pinned source URL, license and instructions without copying.
6. For automated browser checks install compatible project dev dependencies and browsers through the normal lockfile reviewed process; `@playwright/test` is a test package, not a design skill. Run real regression tests rather than relying on a visual screenshot.

**Security:** Skills are executable instructions. Do not bulk-install arbitrary community repos, use `curl | sh`, grant deployments/secrets to unknown tools, or allow skill text to override repository security policy. Pin a reviewed Git commit and license before vendoring. No skill grants authority to bypass ACLs, modify paid services or expose credentials.

## Required way to use skills
- `frontend-design`: propose exactly three **clearly different** layouts, then choose deliberately before refactoring production views.
- `web-design-guidelines`: audit hierarchy, labels, keyboard access, contrast and error states after each major screen.
- `vercel-react-best-practices`: review changed TSX, route splitting, effects, state and bundle changes.
- Playwright: test desktop 1440, laptop 1280, tablet 768, mobile 390 and narrow mobile 320; capture both light/dark and answer/conflict/empty states; test click citation → exact source, keyboard and responsive overflow.
- Keep the existing authenticated backend, current permission checks, evidence citations and read-only hosted demo unaffected.

## Definition of done
All links/versions/licenses checked; only selected skills installed in project scope and actually discoverable; screenshots compare the same state at the same widths; tests/build/hosted smoke pass; p50/p95 warm API, cold start, LCP/CLS/INP measurements labeled by environment; changed design documented and committed on a review branch. Avoid unearned 'best' or 'zero latency' claims.
