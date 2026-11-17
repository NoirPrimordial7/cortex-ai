"""Local CPU inference for the pinned sentence-transformers MiniLM export."""

import hashlib
import json
import math

from .security import execute, now, uid

REVISION = "c9745ed1d9f207416be6d2e6f8de32d1f16199bf"
MODEL = f"sentence-transformers/all-MiniLM-L6-v2@{REVISION}"
MODEL_FILES = {
    "model.onnx": "6fd5d72fe4589f189f8ebc006442dbb529bb7ce38f8082112682524616046452",
    "tokenizer.json": "be50c3628f2bf5bb5e3a7f17b1f74611b2561a3a27eeab05e5aa30f411572037",
}
DIMENSIONS = 384


class MiniLM:
    def __init__(self, directory):
        import numpy as np
        import onnxruntime as ort
        from tokenizers import Tokenizer

        for name, expected in MODEL_FILES.items():
            with (directory / name).open("rb") as artifact:
                if hashlib.file_digest(artifact, "sha256").hexdigest() != expected:
                    raise ValueError(f"Unexpected MiniLM artifact: {name}")
        self.np = np
        self.tokenizer = Tokenizer.from_file(str(directory / "tokenizer.json"))
        self.tokenizer.enable_truncation(max_length=256)
        options = ort.SessionOptions()
        options.intra_op_num_threads = 2
        options.inter_op_num_threads = 1
        self.session = ort.InferenceSession(
            str(directory / "model.onnx"), sess_options=options, providers=["CPUExecutionProvider"]
        )

    def encode(self, text):
        encoded = self.tokenizer.encode(text)
        np = self.np
        inputs = {
            "input_ids": np.array([encoded.ids], dtype=np.int64),
            "attention_mask": np.array([encoded.attention_mask], dtype=np.int64),
            "token_type_ids": np.array([encoded.type_ids], dtype=np.int64),
        }
        hidden, *_ = self.session.run(None, inputs)
        weights = inputs["attention_mask"][..., None]
        pooled = (hidden * weights).sum(axis=1)[0] / weights.sum()
        norm = float(np.linalg.norm(pooled))
        if not math.isfinite(norm) or norm == 0 or len(pooled) != DIMENSIONS:
            raise ValueError("Invalid MiniLM output")
        return (pooled / norm).tolist()


def load_encoder(settings):
    return MiniLM(settings.embedding_model_dir) if settings.embedding_model_dir else None


def store_embedding(db, tenant, clause, encoder, text):
    execute(
        db,
        """INSERT INTO clause_embeddings (id,tenant_id,clause_id,model_name,vector_json,created_at)
        VALUES (:id,:tenant,:clause,:model,:vector,:at)
        ON CONFLICT (tenant_id,clause_id,model_name) DO UPDATE
        SET vector_json=excluded.vector_json,created_at=excluded.created_at""",
        id=uid(), tenant=tenant, clause=clause, model=MODEL,
        vector=json.dumps(encoder.encode(text), allow_nan=False), at=now(),
    )


def cosine_rank(candidates, vector, top_k=12, minimum=0.30):
    ranked = []
    for candidate in candidates:
        try:
            stored = json.loads(candidate["vector_json"])
            if not isinstance(stored, list) or len(stored) != len(vector):
                continue
            norm = math.sqrt(sum(value * value for value in stored))
            score = sum(a * b for a, b in zip(stored, vector)) / norm
        except (ValueError, TypeError, ZeroDivisionError, OverflowError):
            continue
        if math.isfinite(score) and score >= minimum:
            ranked.append((candidate["id"], score))
    ranked.sort(key=lambda item: (-item[1], item[0]))
    return [ident for ident, _ in ranked[:top_k]]


def fuse_rankings(*rankings):
    scores = {}
    for ranking in rankings:
        for rank, ident in enumerate(ranking, 1):
            scores[ident] = scores.get(ident, 0) + 1 / (60 + rank)
    return sorted(scores, key=lambda ident: (-scores[ident], ident))
