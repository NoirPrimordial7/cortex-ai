# Technical figure design

Figures 1–6 are authored as coordinates in [draw_figures.py](figures/source/draw_figures.py). Each has selectable vector text in PDF and SVG, with a 350 dpi PNG for Word. Rendered shapes distinguish processes, decisions, time intervals and record links. Captions and accessible descriptions come from the authoritative manuscript.

The palette uses dark ink (#173047), a teal evidence path (#17655d), neutral outlines (#516775), and pale process and evidence fills. Line direction, explicit branch labels, distinct shapes, and solid versus dashed marks carry the meaning when reproduced in grayscale. Standard body labels use 9-point Helvetica on a 360-point canvas and node headings use 10-point bold. Text is checked against its available box width at generation.

Springer and the single-column layouts place the same vectors within their native text measure. IEEE uses wide two-column floats so a full diagram does not have to fit an individual narrow column. IJSREM and other Word proofs use the PNG assets, with wide sections for the IJSREM body figures and comparison table.

The [two-panel screenshot composite](figures/rendered/fig7.pdf) is supplementary. The original captures show a source-supported answer and a conflict listing, but do not contain an expanded conflict or a document-grant view. The [evidence register](evidence/APPLICATION_SCREENSHOTS.md) records the original sources and crops.
