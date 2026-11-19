# Results verification

Pinned GitHub main dbbd2f293f312f3055db6beffc045e3e5b7ee62a. Reproduction uses an isolated Windows 11 checkout with Python 3.12.10, SQLite 3.49.1, FastAPI 0.143.0, SQLAlchemy 2.0.54, Node's pinned frontend lockfile and Chrome 157.0.8103.79 on an Intel Core i7-13700F. The optional MiniLM ONNX and tokenizer matched the exact upstream hashes before inference.

| Evidence | Verified result |
|---|---|
| Earlier governance checkpoint c8e5468 | Repository and project report agree on 97 backend, 39 frontend and 13 browser checks. Historical counts only. |
| Latest backend | 107 passed, 1 inherited Starlette HTTPX deprecation warning, including actual pinned MiniLM CPU inference. |
| Latest frontend | 44 passed in 14 files. TypeScript/Vite build and Ruff passed. Pinned Python dependencies passed pip check. |
| Latest Chrome | Six scenarios passed including the live re-audit round trip and 320/390/768/1280/1440 widths, both roles and themes. Fresh isolated browser fixture only. |
| Original development fixture | 12/12 outcomes, 15/15 eligible peers, 10/10 exact citations, 5/5 temporal and 4/4 abstention; one positive conflict, no false positives or observed restricted marker. Warm 50 requests, median 11.670 ms, p95 15.887 ms. |
| New 12-policy / 16-query corpus | A 5/16, B 14/16, C 14/16 and D 16/16. D matched 19/19 peers, 16/16 citation checks, 5/5 expected abstentions and two positive conflict queries over one pair. Two inaccessible version reads returned 404, and neither marker appeared in checked stages or responses. |
| New corpus strict route warm timing | Model loaded for related passages, 50 repetitions, median 28.721 ms, nearest-rank p95 51.339 ms. |
| Exploratory passage comparison | One designated policy recovery in four hybrid probes versus zero in four lexical probes. Related results exclude strict citations. For a single paraphrase, 30 warm requests per mode, median and p95 10.329/11.692 ms lexical, 27.763/45.733 ms hybrid. |

Evidence files are in experiments/. In-process measurements include persistence and TestClient overhead and exclude browser, network, cold starts and concurrency. The lexical and temporal controls share approval and scope. No isolated causal estimate for approval or authority alone, independent real-corpus replication, many-dispute conflict estimate, database side-channel study, or memory and scale study was performed. Neither test counts nor the new corpus success rate generalizes to arbitrary organizations or production traffic.
