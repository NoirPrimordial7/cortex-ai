# Project skill installation record

Date: 2026-10-09, Asia/Calcutta. Preparation branch: `design/skill-toolkit-mobile-first`, draft PR #2. Initial branch HEAD: `c174003445791c7b2441bcbf6fcbb8c365ccb581`.

Installed using the bundled Codex skill-installer helper, with explicit pinned `--ref` and project-local `--dest E:/Cortex AI/.agents/skills`. This replaces the guide's illustrative npx workflow with the available purpose-built installer; no remote shell installer or global installation was used.

| Local directory / skill name | Upstream path | Pinned commit | License evidence | Files |
| --- | --- | --- | --- | --- |
| frontend-design | anthropics/skills: skills/frontend-design | 9d630808e4add0a7146de4af9384155d5dee350a | Bundled LICENSE.txt, Apache-2.0 | 2 |
| web-design-guidelines | vercel-labs/agent-skills: skills/web-design-guidelines | 063bee94c3f4df8453406c830b0a7df0f2860278 | No explicit license in this selected directory; kept local, not redistributed | 1 |
| vercel-react-best-practices | vercel-labs/agent-skills: skills/react-best-practices | 063bee94c3f4df8453406c830b0a7df0f2860278 | SKILL.md declares MIT; standalone license file was not present | 76 |
| vercel-composition-patterns | vercel-labs/agent-skills: skills/composition-patterns | 063bee94c3f4df8453406c830b0a7df0f2860278 | SKILL.md declares MIT; standalone license file was not present | 14 |

All four SKILL.md entries were read before installation. The installed trees contain Markdown, JSON and the Anthropic license, with no executable scripts. Source trees were inspected and a targeted instruction scan covered execution, deletion, credentials and deployment terms. Code snippets in guidance are examples, not scripts executed during setup. Project security rules and user authorization take precedence over skill instructions. React/Next.js recommendations require adaptation to this Vite application; do not add Next.js, shared private-data caching or unnecessary dependencies merely to follow a generic example.

`.agents/` is already ignored by Git. No skill files were staged or uploaded. Project-local directory/entry presence was verified; the active turn's skill catalog is fixed, so actual fresh-turn/session discovery is pending. On the next turn, confirm the four names appear in available skills before claiming discovery verified. The package contents and local installation are verified independently of that remaining check.

Reproduce with the bundled helper (shown here as `$installerPath`; resolve it from the installed skill-installer skill):

```powershell
python $installerPath --repo anthropics/skills --ref 9d630808e4add0a7146de4af9384155d5dee350a --path skills/frontend-design --dest 'E:/Cortex AI/.agents/skills'
python $installerPath --repo vercel-labs/agent-skills --ref 063bee94c3f4df8453406c830b0a7df0f2860278 --path skills/web-design-guidelines --dest 'E:/Cortex AI/.agents/skills'
python $installerPath --repo vercel-labs/agent-skills --ref 063bee94c3f4df8453406c830b0a7df0f2860278 --path skills/react-best-practices --name vercel-react-best-practices --dest 'E:/Cortex AI/.agents/skills'
python $installerPath --repo vercel-labs/agent-skills --ref 063bee94c3f4df8453406c830b0a7df0f2860278 --path skills/composition-patterns --name vercel-composition-patterns --dest 'E:/Cortex AI/.agents/skills'
```

The helper refuses to overwrite existing directories. These commands are for reproduction on an uninstalled checkout, not a command to run again now. Playwright is test tooling rather than a design skill. No Playwright package/browser installation or automated viewport suite was run in this visual-selection stage. Existing source, dependency manifests and deployed UI were not changed. Automated tests, both themes, focus restoration, conflict/revocation checks and measured performance remain required after selection and implementation.
