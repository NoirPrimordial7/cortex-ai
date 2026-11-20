# Figure register

Figures 1–6 reproduce from `figures/source/draw_figures.py` as vector PDF and SVG, with 350 dpi PNG exports. Captions and accessible image text are in the authoritative manuscript. The application screenshot composite is supplementary. [Design and print rules](FIGURE_DESIGN_SYSTEM.md)

| Figure | Subject | Technical evidence |
|---|---|---|
| 1 | Browser, API, authorization, review, storage and answering architecture | backend/app/main.py, documents.py, security.py, pipeline.py |
| 2 | Strict permission-safe policy retrieval and answering | backend/app/pipeline.py and saved-source path in main.py |
| 3 | Fictional leave editions with publication and effective dates | New benchmark LV-A to LV-C and half-open interval implementation |
| 4 | Time replacement, rank filtering, abstention and exact human choice | pipeline.py and conflict_reaudit.py |
| 5 | Evidence-specific storage relationships | backend/app/db.py, integrity.py and migration 0009 |
| 6 | Development fixture and independent-in-content fictional benchmark with controlled comparators | backend/evaluate.py and experiments/run_benchmark.py |
| Supplementary | Fictional application outputs with an exact source passage and a two-source conflict listing | [Local screenshot evidence and provenance](evidence/APPLICATION_SCREENSHOTS.md) |
