# Final review proofs

All deliverables use the [authoritative manuscript](manuscript/paper.md) and [20-entry bibliography](bibliography/references.bib).

## Figure 7 update

The Figure 7 build adds one page to each review PDF. The screenshot figure appears on page 8 in the Goa proof, page 9 in both Springer proofs and the general academic backup, and page 5 in the IEEE backup. The smallest displayed figure width among the five proofs is 119 mm. Visual review of the Goa and Springer page overviews and their full Figure 7 pages confirmed that both panels and the captions fit, with the source quote and competing source names readable. The LaTeX Springer proof places the figure on a dedicated page. Both editable Word exports retain 18 native equations, seven figures with alternative text, and 20 references. [Measurement record](quality/application-figure-checks.json)

The Goa and Springer proofs each contain 14 PDF pages including references. The [public author guidelines](https://www.smartcomconference.com/author-guidelines-for-paper-submission) specify at least 3,500 words or 10 pages and provide no explicit maximum. The organizer still needs to confirm the applicable page-count convention and any upper limit.

| Format | Deliverable | Current pages | Before Figure 7 |
|---|---|---:|---:|
| Goa public-guidance layout | [PDF](exports/Cortex-SMARTCOM-Goa-Guidelines.pdf) and [editable Word](exports/Cortex-SMARTCOM-Goa-Guidelines.docx) | 14 | 13 |
| Springer proceedings review | [PDF](exports/cortex-springer.pdf) | 14 | 13 |
| Springer editable | [Word](exports/Cortex-SMARTCOM-editable.docx) and [Word proof PDF](exports/Cortex-SMARTCOM-Word-proof.pdf) | 14 | 13 |
| IEEE backup | [PDF](exports/cortex-ieee.pdf) | 7 | 6 |
| General academic backup | [PDF](exports/cortex-academic.pdf) | 14 | 13 |

The preceding editorial pass reviewed all 58 rendered pages. The updated builds pass the [structural checks](quality/structural-checks.json) and [content checks](quality/editorial-export-checks.json) for the shared author block, editable equations, caption count, mathematical tokens, bibliography and reported results. There were no final TeX missing-character, undefined-citation, oversize-float or overfull warnings. The last bibliography pages in some formats are sparse, and IEEE diagram labels are smaller in two columns.

The 12-point, one-column Goa layout uses alphabetized, unnumbered author–year references. The separate LLNCS publisher proof uses numbered references. The organizer still needs to confirm template precedence for LNNS, anonymization, the deadline, and the page-count convention. The authors still need to confirm correspondence, benchmark label adjudication and the AI disclosure. [Existing format comparison](FORMAT_CONSISTENCY_CHECK.md)
