import math
import os
from pathlib import Path

import pytest

from app.cli import reindex_embeddings
from app.embeddings import DIMENSIONS, MiniLM, cosine_rank, fuse_rankings
from app.security import one
from conftest import ask, client_for


class ControlledEncoder:
    def __init__(self):
        self.calls = []

    def encode(self, text):
        self.calls.append(text)
        anchor = (1.0, 0.0) if "orange" in text or "paraphrase" in text else (0.0, 1.0)
        return [*anchor, *([0.0] * (DIMENSIONS - 2))]


def test_cosine_and_rrf_order():
    candidates = [
        {"id": "right", "vector_json": "[1,0]"},
        {"id": "similar", "vector_json": "[1,1]"},
        {"id": "invalid", "vector_json": "[0,0]"},
        {"id": "wrong", "vector_json": "[-1,0]"},
    ]
    assert cosine_rank(candidates, [1, 0], top_k=2) == ["right", "similar"]
    assert fuse_rankings(["right", "similar"], ["similar"]) == ["similar", "right"]


def test_approval_embeddings_publish_only_for_eligible_reads_and_are_removed_on_rejection(system):
    app, _ = system
    encoder = ControlledEncoder()
    app.state.encoder = encoder
    manager = client_for(system, "ravi")
    employee = client_for(system)
    uploaded = manager.post(
        "/api/v1/documents",
        data={"title": "Test leave passage"},
        files={"file": ("policy.txt", b"Fresh orange policy passage.", "text/plain")},
    )
    assert uploaded.status_code == 202
    ids = uploaded.json()
    endpoint = f"/api/v1/versions/{ids['version_id']}/review"
    body = {
        "expected_metadata_revision": 0, "approval_state": "pending",
        "valid_from": "2026-01-01", "valid_to": None, "open_ended": True,
        "population": "india_full_time", "jurisdiction": "IN", "topic": "leave",
        "source_kind": "hr_policy", "published_at": "2026-01-01", "start_char": 0,
        "end_char": len(b"Fresh orange policy passage."),
        "access_scope": "uniform", "reason": "Fictional approved inference fixture",
    }
    pending = manager.post(endpoint, json=body)
    assert pending.status_code == 200
    assert encoder.calls == []
    approved = manager.post(
        endpoint, json={**body, "expected_metadata_revision": 1, "approval_state": "approved"}
    )
    assert approved.status_code == 200
    assert encoder.calls == ["Fresh orange policy passage."]
    result = ask(manager, "paraphrase")
    assert result["status"] == "abstained"
    assert result["related_results"][0]["document_id"] == ids["document_id"]
    assert ask(employee, "paraphrase")["related_results"] == []
    assert ask(client_for(system, "orbit"), "paraphrase")["related_results"] == []
    assert ask(manager, "paraphrase", as_of="2025-07-01")["related_results"] == []
    rejected = manager.post(
        endpoint, json={**body, "expected_metadata_revision": 2, "approval_state": "rejected"}
    )
    assert rejected.status_code == 200
    assert ask(manager, "paraphrase")["related_results"] == []
    with app.state.engine.connect() as db:
        assert one(db, "SELECT id FROM clause_embeddings") is None


def test_real_local_minilm_recovers_paraphrase(system):
    directory = os.environ.get("CORTEX_TEST_MINILM_DIR")
    if not directory:
        pytest.skip("Set CORTEX_TEST_MINILM_DIR to run CPU model integration")
    encoder = MiniLM(Path(directory))
    vector = encoder.encode("Time away from work due to illness")
    assert len(vector) == DIMENSIONS and math.isclose(
        math.sqrt(sum(v * v for v in vector)), 1, rel_tol=1e-6
    )
    app, _ = system
    assert reindex_embeddings(app.state.engine, encoder) > 0
    assert reindex_embeddings(app.state.engine, encoder) == 0
    client = client_for(system)
    phrase = "I am unwell and need some time away"
    assert "SICK-C1" not in {p["clause_id"] for p in ask(client, phrase)["related_results"]}
    app.state.encoder = encoder
    result = ask(client, phrase)
    assert "SICK-C1" in {passage["clause_id"] for passage in result["related_results"]}
    assert result["citations"] == []
