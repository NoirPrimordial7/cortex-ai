"""Run the new fictional fixture against an unmodified upstream backend."""
import argparse
import hashlib
import json
import platform
import sqlite3
import statistics
import sys
import tempfile
import time
from importlib.metadata import version
from pathlib import Path

HERE = Path(__file__).resolve().parent
BASE = HERE / "benchmark_cases.json"
TOPICS = {
    "leave": ("leave", "annual_leave_days", "working_days_per_year", "hr_policy"),
    "remote_work": ("remote work", "remote_days_per_week", "days_per_week", "operations_policy"),
    "notice": ("notice period", "notice_period_days", "calendar_days", "hr_policy"),
    "bonus": ("executive bonus", "executive_bonus", "INR", "hr_policy"),
}
FIELDS = "id topic population kind value start end published approved visible".split()
CANARIES = ("HARBOR_PRIVATE_83000", "CEDAR_PENDING_41")


def quote(policy):
    query, _, unit, _ = TOPICS[policy["topic"]]
    description = policy["population"].replace("india_", "India ").replace("_", "-")
    marker = f" {CANARIES[0]}" if policy["id"] == "BN-A" else (
        f" {CANARIES[1]}" if policy["id"] == "LV-F" else ""
    )
    return f"The {query} for {description} personnel is {policy['value']} {unit.replace('_', ' ')}.{marker}"


def checked(response):
    response.raise_for_status()
    return response.json()


def controls(policies, topic, population, day, bm25, tokenize):
    corpus = [p for p in policies if p["approved"] and p["visible"]
              and p["population"] == population and p["topic"] == topic]
    tokens = tokenize(TOPICS[topic][0])

    def top(pool, recency=False):
        ordering = {ident: ix for ix, ident in enumerate(
            bm25([{"id": p["id"], "text": quote(p)} for p in pool], tokens)
        )}
        pool = [p for p in pool if p["id"] in ordering]
        if recency:
            pool.sort(key=lambda p: p["published"], reverse=True)
        else:
            pool.sort(key=lambda p: ordering[p["id"]])
        return pool[0]["value"] if pool else None

    valid = [p for p in corpus if p["start"] <= day and (p["end"] is None or day < p["end"])]
    governing = [p for p in valid if p["kind"] == TOPICS[topic][3]]
    # Fixture authority is uniform within its governing kind and below it for informal notes.
    return {"A": top(corpus, recency=True), "B": top(valid), "C": top(governing)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("backend", type=Path, help="backend directory of pinned upstream snapshot")
    parser.add_argument("--model", type=Path, help="Optional pinned MiniLM artifact directory")
    parser.add_argument("--output", type=Path, default=HERE / "benchmark-results.json")
    args = parser.parse_args()
    sys.path.insert(0, str(args.backend.resolve()))
    from fastapi.testclient import TestClient
    from app.cli import migrate, seed
    from app.db import engine_for
    from app.main import create_app
    from app.pipeline import bm25, search_tokens
    from app.security import execute
    from app.settings import Settings

    source = BASE.read_bytes()
    fixture = json.loads(source)
    policies = [dict(zip(FIELDS, row, strict=True)) for row in fixture["policies"]]
    origin = "http://127.0.0.1:8000"
    results, mapping, timings, semantic = [], {}, [], {}
    citation_checks = canary_violations = 0
    with tempfile.TemporaryDirectory(prefix="cortex-paper-") as directory:
        settings = Settings(Path(directory), embedding_model_dir=args.model)
        engine = engine_for(settings.db_path)
        migrate(engine)
        creds = seed(engine, settings)
        with engine.begin() as conn:
            execute(conn, "DELETE FROM document_acl WHERE tenant_id='NORTHSTAR' AND (role_id='employee' OR user_id='maya')")
        engine.dispose()
        app = create_app(settings)

        def session(identity):
            client = TestClient(app, base_url=origin)
            checked(client.post("/api/v1/auth/login", json=creds[identity], headers={"Origin": origin}))
            current = checked(client.get("/api/v1/auth/session"))
            client.headers.update({"Origin": origin, "X-CSRF-Token": current["csrf_token"]})
            return client

        with session("ravi") as admin, session("isha") as auditor, session("maya") as employee:
            heading = checked(auditor.post("/api/v1/policy-headings", json={"name": "Fictional research corpus"}))["id"]
            for p in policies:
                passage = quote(p)
                raw = (passage + "\n").encode()
                item = checked(admin.post("/api/v1/documents", data={"title": p["id"]},
                                          files={"file": (p["id"] + ".txt", raw)}))
                did, vid = item["document_id"], item["version_id"]
                mapping[did] = p["id"]
                original = checked(admin.get(f"/api/v1/versions/{vid}/content"))["text"]
                offset = original.index(passage)
                if p["approved"]:
                    checked(admin.post(f"/api/v1/versions/{vid}/submit", json={"expected_revision": 0}))
                    _, predicate, unit, _ = TOPICS[p["topic"]]
                    checked(auditor.post(f"/api/v1/versions/{vid}/review", json=dict(
                        expected_metadata_revision=0, approval_state="approved", valid_from=p["start"],
                        valid_to=p["end"], open_ended=p["end"] is None, population=p["population"],
                        jurisdiction="IN", topic=p["topic"], source_kind=p["kind"],
                        published_at=p["published"], start_char=offset, end_char=offset+len(passage),
                        claim=dict(subject=p["population"], predicate=predicate, value=p["value"], unit=unit),
                        access_scope="uniform", reason="Fictional author review for research fixture",
                        heading_id=heading,
                    )))
                    if p["visible"]:
                        acl = checked(admin.get(f"/api/v1/admin/documents/{did}/acl"))
                        checked(admin.put(f"/api/v1/admin/documents/{did}/acl", json={
                            "expected_policy_revision": acl["policy_revision"],
                            "grants": [{"user_id": "ravi"}, {"role_id": "employee"}],
                        }))
                if not p["visible"]:
                    assert employee.get(f"/api/v1/versions/{vid}/content").status_code == 404

            def ask(prompt, day, pop="india_full_time"):
                return checked(employee.post("/api/v1/queries", json={
                    "query": prompt, "as_of": day, "population": pop,
                }))

            for ident, topic, day, pop, gold_peers, gold_sources, gold_value, gold_reason in fixture["queries"]:
                stages = {}
                app.state.observe = lambda stage, evidence: stages.update({stage: list(evidence)})
                result = ask(TOPICS[topic][0], day, pop)
                peers = sorted(mapping[e.document_id] for e in stages.get("reasoning", []))
                for secret in CANARIES:
                    canary_violations += int(secret in json.dumps(result))
                    canary_violations += sum(secret in e.quote for stage in stages.values() for e in stage)
                sources = sorted(mapping[c["document_id"]] for c in result["citations"])
                value = result["citations"][0]["reviewed_value"] if result["status"] == "answered" else None
                for citation in result["citations"]:
                    item = checked(employee.get(f"/api/v1/queries/{result['query_id']}/citations/{citation['id']}"))
                    text = item["text"]
                    assert text[citation["start_char"]:citation["end_char"]] == citation["quote"]
                    assert hashlib.sha256(text.encode()).hexdigest() == citation["source_hash"]
                    citation_checks += 1
                results.append(dict(id=ident, value=value, reason=result["reason_code"],
                                    status=result["status"], gold_value=gold_value, gold_reason=gold_reason,
                                    peers=peers, gold_peers=gold_peers, sources=sources, gold_sources=gold_sources,
                                    baselines=controls(policies, topic, pop, day, bm25, search_tokens)))

            app.state.observe = None
            for _ in range(5):
                ask("leave", "2026-11-20")
            for _ in range(50):
                start = time.perf_counter_ns()
                ask("leave", "2026-11-20")
                timings.append((time.perf_counter_ns() - start) / 1e6)

            if args.model:
                active = app.state.encoder
                for label, encoder in [("lexical", None), ("hybrid", active)]:
                    app.state.encoder = encoder
                    prompts = [
                        ("What is the vacation entitlement?", "LV-B"),
                        ("How often can staff telecommute?", "RW-B"),
                        ("How long before leaving the company?", "NT-A"),
                        ("How many days of notice are required?", "NT-A")
                    ]
                    metrics = []
                    for prompt, expected in prompts:
                        evidence = ask(prompt, "2026-08-17")["related_results"]
                        metrics.append({"prompt": prompt, "reference_policy": expected,
                                        "related": [mapping[e["document_id"]] for e in evidence]})
                    latency = []
                    for _ in range(5):
                        ask(prompts[1][0], "2026-08-17")
                    for _ in range(30):
                        start = time.perf_counter_ns()
                        ask(prompts[1][0], "2026-08-17")
                        latency.append((time.perf_counter_ns() - start) / 1e6)
                    semantic[label] = {"queries": metrics, "milliseconds": latency}
        app.state.engine.dispose()

    outcome = dict(
        fixture_sha256=hashlib.sha256(source).hexdigest(),
        environment={"python": platform.python_version(), "platform": platform.platform(),
                     "sqlite": sqlite3.sqlite_version, "fastapi": version("fastapi"),
                     "sqlalchemy": version("SQLAlchemy"), "transport": "single-worker in-process TestClient"},
        variants={method: sum(row["baselines"][method] == row["gold_value"] for row in results)
                  for method in ("A", "B", "C")},
        full_correct=sum(r["value"] == r["gold_value"] and r["reason"] == r["gold_reason"]
                         and r["status"] == ("answered" if r["gold_reason"] is None else "abstained")
                         and r["sources"] == sorted(r["gold_sources"]) for r in results),
        authorized_peers_recovered=sum(len(set(r["peers"]) & set(r["gold_peers"])) for r in results),
        authorized_peers_expected=sum(len(r["gold_peers"]) for r in results),
        unexpected_peers=sum(len(set(r["peers"]) - set(r["gold_peers"])) for r in results),
        exact_span_hash_checks=citation_checks, canary_violations=canary_violations,
        strict_timing_ms={"n": len(timings), "median": statistics.median(timings),
                          "p95_nearest_rank": sorted(timings)[47], "samples": timings},
        optional_related_passage_semantic=semantic, queries=results,
    )
    args.output.write_text(json.dumps(outcome, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: v for k, v in outcome.items() if k not in ("queries", "optional_related_passage_semantic")}, indent=2))


if __name__ == "__main__":
    main()
