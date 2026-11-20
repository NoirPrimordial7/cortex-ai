# Cortex AI research paper for SMARTCOM 2027

This folder contains the author-review manuscript, editable source, figures, and reproducibility records. The scientific question is whether a bounded policy answerer can keep authorization, valid time, conflict and citation checks in one inspectable flow. Application code was evaluated from an isolated snapshot of [GitHub main at dbbd2f2](https://github.com/NoirPrimordial7/cortex-ai/commit/dbbd2f293f312f3055db6beffc045e3e5b7ee62a).

| Path | Contents |
|---|---|
| manuscript | Authoritative paper.md, generated LaTeX, layout templates and build script |
| bibliography | Shared BibTeX reference database |
| figures/source and figures/rendered | Editable diagram and screenshot composition scripts with publication exports |
| experiments | Fictional policy labels, benchmark program, test and evaluation results |
| evidence | Artifact intake and source-to-claim register |
| literature | Notes on interpreting the literature and comparator work |
| quality | Render and export verification programs and findings |
| exports | Separate Goa, Springer, IEEE, IJSREM and academic editions |
| inputs and templates | Local-only attachment copies, isolated checkout, vendor tools/styles, and generated secrets in research-only runtime directories, all excluded from version control |

Read [CONFERENCE_REQUIREMENTS.md](CONFERENCE_REQUIREMENTS.md), [RESULTS_VERIFICATION.md](RESULTS_VERIFICATION.md), and [SUBMISSION_CHECKLIST.md](SUBMISSION_CHECKLIST.md) before using the exports. The word-processing version uses the downloadable publisher template's styles without running its macros. The companion formats share the same Markdown and bibliography, while each applies its own citation order and page layout.

The [final exports](FINAL_EXPORT_VERIFICATION.md), [publication format comparison](PUBLICATION_FORMAT_COMPARISON.md), [before-and-after figures](FIGURE_BEFORE_AFTER.md), [manuscript consistency report](MANUSCRIPT_CONSISTENCY_REPORT.md), and [local originality review](ORIGINALITY_TOOL_REPORT.md) document the production pass. The [Paperpal repair report](DOCUMENT_REPAIR_REPORT.md) records the preceding editorial work.

## Rebuild

1. Obtain the Springer Nature proceedings packages from the link in CONFERENCE_REQUIREMENTS.md, extract them into templates/springer-latex and templates/springer-word, and obtain the IEEEtran class and bibliography style from CTAN. Save the CSL Springer lecture-notes style as templates/springer-lncs.csl, [APA style](https://github.com/citation-style-language/styles/blob/master/apa.csl) as templates/apa.csl, and [IEEE style](https://github.com/citation-style-language/styles/blob/master/ieee.csl) as templates/ieee.csl.
2. Install Python dependencies PyYAML, lxml, reportlab, PyMuPDF and Pillow in an isolated environment. Install Pandoc 3.14 and Tectonic 0.17 or a corresponding TeX distribution. The build script expects the official package filenames in this folder.
3. Run `python figures/source/draw_figures.py`, then `python manuscript/build.py --pandoc PATH --tectonic PATH` from this research folder. The script runs in manuscript/ and writes exports/ without reading the attachments. A TeX distribution can alternatively compile the three generated .tex files from manuscript/ with the normal LaTeX and BibTeX passes.
4. On Windows with Word, run `quality/render_word.ps1` with -Document and -Pdf arguments to render the three Word sources to their matching PDFs. Pass those three PDFs to `python quality/restore_word_figures.py` to restore the original high-resolution figure pixels at their rendered positions. Run `python quality/verify_editorial.py` and `python quality/verify_exports.py` to check the contents and render individual pages.

The tracked Figure 7 assets are ready to use in a clean checkout. To reproduce them from the local originals in `inputs/application-screenshots/`, run `python figures/source/compose_screenshots.py` from this research folder. See [application screenshot evidence](evidence/APPLICATION_SCREENSHOTS.md) for the source manifest and crop decisions.

The inputs folder includes third-party material for private reference. Review the project author's permissions and the publication rules before public distribution of the research materials or manuscript.
