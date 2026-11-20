# Local writing and originality checks

Vale 3.28.1 and Proselint 0.16.0 were reused with the existing isolated Windows executables. They ran on the complete prose and captions, including the abstract. Vale reported no diagnostic. Proselint reported one typography diagnostic for the mathematical token `(c)`, which was left intact because it is part of a function argument. [Installed tool audit](FREE_TOOL_AUDIT.md)

The [local comparison script](quality/compare_local_sources.py) screened exact eight-word windows against 12 locally available PDFs, including nine reference papers, the Cortex project report, VERITAS and the IJSREM example. The only two matches overlap in the same project-report phrase listing Cortex's four supported policy topics. That factual terminology is appropriate in both artifacts. The two style examples had zero matching windows under this method. [Match record](quality/production-overlap.json)

| Alternative | Assessment |
|---|---|
| [LanguageTool](https://github.com/languagetool-org/languagetool) | The standalone checker can run locally. Its Java-based installation was evaluated previously, and the existing local tools covered the proofing run. |
| [Copy Spotter](https://github.com/Wazzabeee/copy-spotter) | MIT-licensed Python comparison utility with a pre-1.0 release record and its own document extraction dependencies. The existing deterministic corpus check provides traceable source-level evidence without another install. |
| [Noplag Engine](https://github.com/NoplagLabs/noplag-engine) | Apache-2.0 self-hosted comparison engine. It uses Python and PostgreSQL for the reference service, with comparison scoped to the loaded corpus. The 12-document check ran locally with the existing script. |

The match record applies to this local text corpus and this exact-window method. It supplies no internet-wide similarity percentage or assessment of paraphrased overlap.
