# Reviewed rollout commits

The final tested application tree is `b7db57681e20412e51a62e48706a76a51bcfb6b6`, based on approved Ask iteration `316988c067dfc5976cbfb8c8553af57b0c2f4df9`. The subsequent evidence commit adds browser scenarios, original captures and documentation without changing application code.

| Group | Commit | Result |
|---|---|---|
| Library / Details | `6663c3ea272cec9f514cf38af83f9d387e744710` | Source catalogue, edition reading room and shared responsive visual foundation / controlled record pager |
| Conflicts / Activity | `5f48322cde52a7a60749614b6c6eee0fc21352c8` | Integrated exact authorized claims, focus jumps, paged answer registers and latest Ask polish |
| Permissions / Audit | `c045e7b90425989cd404f252861dbe6a3455f308` | Searchable people, grant workbench and filtered UTC journal |
| Upload / Dashboard / Login | `b7db57681e20412e51a62e48706a76a51bcfb6b6` | Purposeful task surfaces completing the application changes |

Validation in [README.md](README.md) applies to the combined final application tree, not independently buildable intermediate groups. Firefox and WebKit targeted regressions ran during the rollout; the final complete matrix, focus, edition and contrast checks ran in Chromium. The last changes after those targeted engine runs were text/spacing and disabled-action styling, verified by the final Chromium checks.

The `before` screenshots use the approved Ask baseline, the `after` screenshots use the final application tree. Review screenshots and hashes in [captures.json](captures.json). PR #8 remains draft. Main is unchanged at `a3c3a314e4fe5f93813c85591108195acf197c21`; no production deployment has been performed.
