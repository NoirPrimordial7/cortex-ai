# Figure register

All figures are original and reproduce from `figures/source/draw_figures.py`. PDF/SVG are vectors. PNG files are exported at 350 dpi. Captions and accessible image text are in the authoritative manuscript.

| Figure | Subject | Technical evidence |
|---|---|---|
| 1 | Browser, API, authorization, review, storage and answering architecture | backend/app/main.py, documents.py, security.py, pipeline.py |
| 2 | Strict permission-safe policy retrieval and answering | backend/app/pipeline.py and saved-source path in main.py |
| 3 | Fictional leave editions with publication and effective dates | New benchmark LV-A to LV-C and half-open interval implementation |
| 4 | Time replacement, rank filtering, abstention and exact human choice | pipeline.py and conflict_reaudit.py |
| 5 | Evidence-specific storage relationships | backend/app/db.py, integrity.py and migration 0009 |
| 6 | Development fixture and independent-in-content fictional benchmark with controlled comparators | backend/evaluate.py and experiments/run_benchmark.py |
