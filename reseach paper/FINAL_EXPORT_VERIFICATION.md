# Final export verification

| Edition | Review PDF | Editable manuscript | Pages |
|---|---|---|---:|
| Goa guidelines | [PDF](exports/goa/Cortex-SMARTCOM-Goa-Guidelines.pdf) | [Word](exports/goa/Cortex-SMARTCOM-Goa-Guidelines.docx) | 14 |
| Springer proceedings | [PDF](exports/springer/cortex-springer.pdf) | [LaTeX](manuscript/cortex-springer.tex) | 14 |
| Springer Word | [Proof PDF](exports/springer/Cortex-SMARTCOM-Word-proof.pdf) | [Word](exports/springer/Cortex-SMARTCOM-editable.docx) | 14 |
| IEEE conference | [PDF](exports/ieee/cortex-ieee.pdf) | [LaTeX](manuscript/cortex-ieee.tex) | 8 |
| IJSREM journal | [PDF](exports/ijsrem/Cortex-IJSREM.pdf) | [Word](exports/ijsrem/Cortex-IJSREM.docx) | 10 |
| General academic | [PDF](exports/academic/cortex-academic.pdf) | [LaTeX](manuscript/cortex-academic.tex) | 13 |

Every page was rasterized and inspected in page overviews. The visual review examined figure boundaries, headings, page breaks, display mathematics, table placement and reference pages, with larger detail views for the journal and the six diagrams. The [physical bounds check](quality/structural-checks.json) found no extracted words outside page bounds. The [content checks](quality/editorial-export-checks.json) verify all four authors, the correspondence, key formulas, figure numbering and bibliography. The Word proofs contain the same 18 native math expressions as the baseline, while the IJSREM presentation numbers its displayed equation. Pandoc and Tectonic regenerated three LaTeX sources and PDFs. TeX reported underfull line spacing in body or bibliography paragraphs, with no overfull boxes, missing characters, oversize floats or unresolved references.

Word's initial PDF export reduced the technical images to about 200 dpi. The [proof postprocessor](quality/restore_word_figures.py) restored the original PNGs at their existing positions. Effective resolution exceeds 300 dpi in all three Word-derived PDFs. The three LaTeX PDFs preserve vector diagrams.

The authoritative content has 4,012 words in a Pandoc plain-text count that includes headings, captions and table text and excludes citation keys and the reference list. The abstract has 161 words. The Goa and Springer page counts include references. The IJSREM review copy fits the published 6–15-page range for original research, and the organizer and journal questions are recorded in the [format comparison](PUBLICATION_FORMAT_COMPARISON.md).

On this workstation, the prior proofs and figure assets are backed up under `inputs/production-baseline/`. The tracked rollback is [commit 1376a0e](https://github.com/NoirPrimordial7/cortex-ai/commit/1376a0e9bd7280ed2e20b0b5fb5bf0363e341713). The screenshot composite and seven originals are supplementary.
