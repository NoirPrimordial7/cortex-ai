"""Reproducible fixture sanity checks, not a held-out generalization benchmark."""

import hashlib
import json
import platform
import statistics
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path
from fastapi.testclient import TestClient
from app.cli import migrate, seed
from app.db import engine_for
from app.main import create_app
from app.settings import ROOT, Settings

ORIGIN = "http://127.0.0.1:8000"
CASES = [
    (
        "D01 authorized",
        "leave",
        "2026-10-09",
        "india_full_time",
        {"L26-C1", "LN-C1"},
        {"L26-C1"},
        "answered",
    ),
    (
        "D02 restricted",
        "executive bonus",
        "2026-10-09",
        "india_full_time",
        set(),
        set(),
        "abstained",
    ),
    (
        "D03 future upload",
        "leave",
        "2026-10-10",
        "india_full_time",
        {"L26-C1", "LN-C1"},
        {"L26-C1"},
        "answered",
    ),
    (
        "D03 future effective",
        "leave",
        "2027-01-01",
        "india_full_time",
        {"L27-C1", "LN-C1"},
        {"L27-C1"},
        "answered",
    ),
    (
        "D04 historical",
        "leave",
        "2025-06-01",
        "india_full_time",
        {"L25-C1"},
        {"L25-C1"},
        "answered",
    ),
    (
        "D05 authority",
        "vacation",
        "2026-10-09",
        "india_full_time",
        {"L26-C1", "LN-C1"},
        {"L26-C1"},
        "answered",
    ),
    (
        "D06 conflict",
        "remote days per week",
        "2026-10-09",
        "india_full_time",
        {"RA-C1", "RB-C1"},
        {"RA-C1", "RB-C1"},
        "abstained",
    ),
    ("D07 missing", "meal allowance", "2026-10-09", "india_full_time", set(), set(), "abstained"),
    (
        "D09 notice citation",
        "notice period",
        "2026-10-09",
        "india_full_time",
        {"N26-C1"},
        {"N26-C1"},
        "answered",
    ),
    ("D10 scope", "leave", "2026-10-09", "india_contractor", {"C26-C1"}, {"C26-C1"}, "answered"),
    (
        "D11 boundary",
        "leave",
        "2026-01-01",
        "india_full_time",
        {"L26-C1", "LN-C1"},
        {"L26-C1"},
        "answered",
    ),
    ("D11 no valid interval", "leave", "2023-01-01", "india_full_time", set(), set(), "abstained"),
]


def main():
    work = ROOT / "outputs" / "evaluation"
    work.mkdir(parents=True, exist_ok=True)
    temporary = Path(tempfile.mkdtemp(prefix="fixture-", dir=work)).resolve()
    if not temporary.is_relative_to(work.resolve()):
        raise RuntimeError("Unsafe evaluation location")
    settings = Settings(temporary)
    engine = engine_for(settings.db_path)
    migrate(engine)
    credentials = seed(engine, settings)
    engine.dispose()
    app = create_app(settings)
    with TestClient(app, base_url=ORIGIN) as client:
        response = client.post(
            "/api/v1/auth/login", json=credentials["maya"], headers={"Origin": ORIGIN}
        )
        response.raise_for_status()
        csrf = client.get("/api/v1/auth/session").json()["csrf_token"]
        client.headers.update({"Origin": ORIGIN, "X-CSRF-Token": csrf})
        results = []
        correct, supported, citations, retrieved, eligible, tp, fp, fn, temporal, abstention = (
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            [],
            [],
        )
        canary_violations = 0
        for name, query, as_of, population, gold_peers, gold_selected, status in CASES:
            stages = []
            app.state.observe = lambda stage, evidence: stages.append((stage, list(evidence)))
            started = time.perf_counter()
            response = client.post(
                "/api/v1/queries", json={"query": query, "as_of": as_of, "population": population}
            )
            response.raise_for_status()
            elapsed = (time.perf_counter() - started) * 1000
            answer = response.json()
            peers = {
                e.clause_id for stage, evidence in stages if stage == "reasoning" for e in evidence
            }
            selected = {c["clause_id"] for c in answer["citations"]}
            passed = selected == gold_selected and answer["status"] == status
            correct += passed
            retrieved += len(peers & gold_peers)
            eligible += len(gold_peers)
            gold_conflict = name.startswith("D06")
            is_conflict = answer["reason_code"] == "UNRESOLVED_CONFLICT"
            tp += gold_conflict and is_conflict
            fp += not gold_conflict and is_conflict
            fn += gold_conflict and not is_conflict
            if name.startswith(("D03", "D04", "D11")):
                temporal.append(passed)
            if status == "abstained":
                abstention.append(answer["status"] == status and selected == gold_selected)
            canary_violations += "CANARY_EXEC_75K" in json.dumps(answer)
            canary_violations += sum(
                "CANARY_EXEC_75K" in e.quote for _, evidence in stages for e in evidence
            )
            for c in answer["citations"]:
                source = client.get(f"/api/v1/queries/{answer['query_id']}/citations/{c['id']}")
                source.raise_for_status()
                body = source.json()
                citations += 1
                supported += (
                    body["text"][c["start_char"] : c["end_char"]] == c["quote"]
                    and hashlib.sha256(body["text"].encode()).hexdigest() == c["source_hash"]
                )
            results.append(
                {
                    "id": name,
                    "passed": passed,
                    "status": answer["status"],
                    "reason": answer["reason_code"],
                    "selected": sorted(selected),
                    "gold_selected": sorted(gold_selected),
                    "peer_recall_numerator": len(peers & gold_peers),
                    "peer_recall_denominator": len(gold_peers),
                    "query_latency_ms": round(elapsed, 3),
                }
            )
        app.state.observe = None
        latencies = []
        for _ in range(50):
            started = time.perf_counter()
            client.post(
                "/api/v1/queries", json={"query": "annual leave", "as_of": "2026-10-09"}
            ).raise_for_status()
            latencies.append((time.perf_counter() - started) * 1000)
        report = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "protocol": "Crafted Phase 2 fixture sanity checks; same development fixture; no held-out data or ablation; no generalization claim",
            "fixture_sha256": hashlib.sha256(
                (ROOT / "docs/planning/demo/fixture-spec.json").read_bytes()
            ).hexdigest(),
            "environment": {
                "python": platform.python_version(),
                "platform": platform.platform(),
                "transport": "FastAPI TestClient in-process HTTP, not network or browser latency",
                "workers": 1,
            },
            "metrics": {
                "scenario_correct": correct,
                "scenario_count": len(CASES),
                "authorized_peer_recall": {"retrieved": retrieved, "eligible": eligible},
                "temporal_correct": sum(temporal),
                "temporal_count": len(temporal),
                "conflict_precision": {"tp": tp, "fp": fp},
                "conflict_recall": {"tp": tp, "fn": fn},
                "citation_span_hash_supported": supported,
                "citation_count": citations,
                "abstention_correct": sum(abstention),
                "abstention_count": len(abstention),
                "restricted_canary_violations_in_checked_stages_and_payloads": canary_violations,
                "warm_query_latency_ms": {
                    "n": len(latencies),
                    "median": round(statistics.median(latencies), 3),
                    "p95_nearest_rank": round(sorted(latencies)[47], 3),
                },
            },
            "scenarios": results,
            "limitations": [
                "Only one positive equal-authority conflict case",
                "Reviewer-supplied claims, small lexical domain; no semantic contradiction classification",
                "Citation support checks exact spans/hashes, not independent semantic entailment",
                "Revocation, isolation and upload security are separate pytest tests",
                "No application completion percentage or production-security certification",
            ],
        }
        destination = ROOT / "docs/implementation/fixture-results.json"
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(report["metrics"], indent=2))
        if correct != len(CASES) or supported != citations or canary_violations:
            raise SystemExit("Fixture evaluation failed; inspect the saved report")
    app.state.engine.dispose()


if __name__ == "__main__":
    main()
