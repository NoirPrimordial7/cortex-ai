# Export and editorial review

The manuscript uses one editable Markdown source and 20 shared BibTeX references. It has a 189-word abstract and approximately 3,790 words in the body source including headings, captions and table text. The author block names all four authors and uses the project report's affiliation. Correspondence remains an author-review placeholder.

| Format | Rendered pages | Basis and notes |
|---|---:|---|
| Springer proceedings review | 13 | Official Springer-provided LLNCS v2.25 class, publisher bibliography style and sample font packages. One page above the 10–12-page target. It meets the published minimum reviewed for SMARTCOM. Exact event-specific template precedence and maximum length were unconfirmed. |
| Editable Word and its PDF proof | 14 | Publisher template paragraph styles, page dimensions, numbered headings and numbered references. VBA was stripped without executing it. Figures are 350 dpi and captions are kept with the image. Citation order and pagination follow the Word export. |
| IEEE backup | 6 | Official IEEEtran conference class in two columns. Diagram labels are smaller than in the primary review copy. Separate vector originals are available. |
| General academic backup | 12 | Article layout, shared body, source figures and numbered bibliography. |

Every page was rendered and examined in the pagination overviews. Individual render files are in the local page-renders directory. Checked title, author block, displayed formula, all six figures and captions, decision table, reference numbering, and page edges. Layout review caught a split caption and double reference number in an early Word build. The corrected proof keeps each figure and caption on the same page and has one number per bibliography entry. The structural checks found no extracted words outside the page and no replacement glyphs in any export. The selected source-reference records and numerical results are the same across formats. The final TeX logs show no overfull boxes or missing characters. Some backup paragraphs around URLs have underfull line spacing.

The figures are original grayscale drawings with editable coordinates, PDF/SVG vector exports and PNG proofs. The development and new fictional benchmark outcomes were verified independently of the export. Remaining human decisions are recorded in the submission checklist.
