# Experiment protocol

## Pinned implementation

dbbd2f293f312f3055db6beffc045e3e5b7ee62a. Use a clean copy under inputs/upstream and install backend/requirements.lock and backend/requirements-embeddings.lock into an isolated environment. Run the original evaluator inside backend. It writes docs/implementation/fixture-results.json inside that checkout, so run it only in a disposable snapshot.

## New fictional benchmark

The declaration is experiments/benchmark_cases.json. Each policy tuple gives ID, topic, population, kind, integer, effective start, exclusive end, publication date, approval flag, and Employee visibility. Each question tuple gives ID, prompt topic, as-of date, population, eligible peer IDs, expected cited source IDs, expected value and expected reason. The 12 policy versions are distinct from those in the original development fixture. The script uses the real ingestion/approval flows and a generated database. Only the initialized development records' disposable Employee grants are removed before data collection. Pending and private records remain inaccessible and are checked through the regular content route.

## Comparators

A ranks lexically matching documents by most recent publication. B ranks only temporally valid lexical candidates. C applies the fixture's governing-kind tier then chooses its best lexical match. D is the actual strict HTTP path, with routing, evidence verification, and complete outcomes. A–C are offline models of the declared rules. All comparators share the same approved, Employee-visible topic and scope universe. Approval and scope were exercised by negative controls, without independent factorial effect estimates.

## Run

From the pinned backend with an isolated Python, run `python evaluate.py`; then run `python "PATH/experiments/run_benchmark.py" . --model "PATH/templates/minilm"`. Model loading checks the hash and pinned revision. Omit --model to reproduce decision and citation cases without optional passage comparisons. Timings are host-specific. The primary benchmark result file includes each case, outcomes, peer sets, overlap checks and raw latency samples.

## Metrics

A–C compare value or absence of value. For D verify answer status, reason, value, exact selected sources, authorized-peer overlap, extra candidates, exposure markers and citation source re-fetch checks. Count conflict labels and predictions at query level and distinguish the number of underlying disputes. Warm timing is nearest-rank p95 and median across repeated local API calls, including SQLite persistence and TestClient overhead. CPU and process memory profiles and real-corpus estimates remain open.
