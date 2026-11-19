"""Ed25519 signatures bind immutable version metadata to uploaded and extracted hashes."""

import base64
import hashlib
import json
import os
from pathlib import Path
from fastapi import HTTPException
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey
from .security import audit, execute, now, one, uid, version


class Signer:
    def __init__(self, settings):
        self.path = settings.signing_key_path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            key = Ed25519PrivateKey.generate()
            payload = key.private_bytes(
                serialization.Encoding.PEM,
                serialization.PrivateFormat.PKCS8,
                serialization.NoEncryption(),
            )
            try:
                with os.fdopen(
                    os.open(self.path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600), "wb"
                ) as stream:
                    stream.write(payload)
            except FileExistsError:
                pass
        self.key = serialization.load_pem_private_key(self.path.read_bytes(), password=None)
        if not isinstance(self.key, Ed25519PrivateKey):
            raise ValueError("An Ed25519 private key is required")
        self.public = self.key.public_key().public_bytes(
            serialization.Encoding.Raw, serialization.PublicFormat.Raw
        )
        self.key_id = hashlib.sha256(self.public).hexdigest()


def manifest(v, uploader, filename):
    return {
        "tenant_id": v["tenant_id"],
        "version_id": v["id"],
        "document_id": v["document_id"],
        "version_label": v["version_label"],
        "object_key": v["object_key"],
        "sha256": v["sha256"],
        "extracted_sha256": v["extracted_sha256"],
        "uploaded_by": uploader,
        "original_filename": filename,
        "uploaded_at": v["ingested_at"],
    }


def seal(db, settings, v, uploader, filename, origin="upload"):
    if not settings.signing_key_path.is_file() and one(
        db, "SELECT id FROM policy_integrity LIMIT 1"
    ):
        raise HTTPException(503, "Restore the original signing key before uploading policies")
    try:
        signer = Signer(settings)
    except (OSError, ValueError, TypeError):
        raise HTTPException(503, "Policy signing key is unavailable") from None
    payload = json.dumps(manifest(v, uploader, filename), sort_keys=True, separators=(",", ":"))
    execute(
        db,
        """INSERT INTO policy_integrity
        (id,tenant_id,version_id,uploaded_by,original_filename,manifest_json,signature,
         public_key,key_id,created_at,origin)
        VALUES (:id,:t,:v,:u,:f,:m,:s,:p,:k,:at,:origin)""",
        id=uid(),
        t=v["tenant_id"],
        v=v["id"],
        u=uploader,
        f=filename,
        m=payload,
        s=base64.b64encode(signer.key.sign(payload.encode())).decode(),
        p=base64.b64encode(signer.public).decode(),
        k=signer.key_id,
        at=now(),
        origin=origin,
    )


def inspect_record(db, settings, v):
    record = one(
        db,
        """SELECT * FROM policy_integrity WHERE tenant_id=:t AND version_id=:v""",
        t=v["tenant_id"],
        v=v["id"],
    )
    if record is None:
        return "Unable to Verify", None
    try:
        if not settings.signing_key_path.is_file():
            return "Unable to Verify", record
        signer = Signer(settings)
        if (
            record["key_id"] != signer.key_id
            or record["public_key"] != base64.b64encode(signer.public).decode()
        ):
            return "Unable to Verify", record
        public = Ed25519PublicKey.from_public_bytes(signer.public)
        public.verify(base64.b64decode(record["signature"]), record["manifest_json"].encode())
        expected = manifest(v, record["uploaded_by"], record["original_filename"])
        if json.loads(record["manifest_json"]) != expected:
            return "Integrity Mismatch", record
        private = (settings.data_dir / "uploads").resolve()
        target = (private / v["object_key"]).resolve()
        if target.parent != private:
            return "Integrity Mismatch", record
        with target.open("rb") as source:
            actual_hash = hashlib.file_digest(source, "sha256").hexdigest()
        if (
            actual_hash != v["sha256"]
            or hashlib.sha256(v["extracted_text"].encode()).hexdigest() != v["extracted_sha256"]
        ):
            return "Integrity Mismatch", record
        return "Verified", record
    except InvalidSignature:
        return "Integrity Mismatch", record
    except (OSError, ValueError, TypeError):
        return "Unable to Verify", record


def verify(ctx, settings, vid):
    v = version(ctx, vid)
    status, record = inspect_record(ctx.db, settings, v)
    at = now()
    execute(
        ctx.db,
        """INSERT INTO integrity_verifications
        (id,tenant_id,version_id,actor_id,status,verified_at)
        VALUES (:id,:tenant,:vid,:user,:status,:at)""",
        **ctx.parameters(),
        id=uid(),
        vid=vid,
        status=status,
        at=at,
    )
    audit(ctx, "policy.integrity.verify", outcome=status, target=vid, target_type="version")
    return {
        "version_id": vid,
        "status": status,
        "last_verified_at": at,
        "sha256": v["sha256"],
        "extracted_sha256": v["extracted_sha256"],
        "uploaded_at": v["ingested_at"],
        "version_label": v["version_label"],
        "uploaded_by": record["uploaded_by"] if record else None,
        "uploader_name": (
            one(
                ctx.db,
                "SELECT display_name FROM users WHERE tenant_id=:tenant AND id=:id",
                **ctx.parameters(),
                id=record["uploaded_by"],
            )
            or {}
        ).get("display_name")
        if record
        else None,
        "original_filename": record["original_filename"] if record else None,
        "algorithm": "Ed25519",
        "key_id": record["key_id"] if record else None,
        "signature": record["signature"] if record else None,
        "public_key": record["public_key"] if record else None,
        "origin": record["origin"] if record else None,
        "encryption": "Local upload files are not encrypted at rest",
    }


def backfill(db, settings):
    from .security import rows

    for v in rows(
        db,
        """SELECT v.*,d.owner_user_id FROM document_versions v
        JOIN documents d ON d.tenant_id=v.tenant_id AND d.id=v.document_id
        WHERE NOT EXISTS(SELECT 1 FROM policy_integrity i WHERE i.tenant_id=v.tenant_id AND i.version_id=v.id)""",
    ):
        private = (settings.data_dir / "uploads").resolve()
        target = (private / v["object_key"]).resolve()
        if target.parent != private or not target.is_file():
            continue
        if hashlib.sha256(target.read_bytes()).hexdigest() != v["sha256"]:
            continue
        if hashlib.sha256(v["extracted_text"].encode()).hexdigest() != v["extracted_sha256"]:
            continue
        seal(
            db,
            settings,
            v,
            None,
            "Historical upload" + Path(v["object_key"]).suffix,
            "verified_legacy_backfill",
        )
        execute(
            db,
            """INSERT INTO audit_events
            (id,tenant_id,actor_user_id,action,outcome,request_id,target_type,target_id,policy_revision,created_at)
            VALUES (:id,:tenant,NULL,'policy.integrity.backfill','success',:request,'version',:version,
              (SELECT policy_revision FROM tenants WHERE id=:tenant),:at)""",
            id=uid(),
            tenant=v["tenant_id"],
            request=uid(),
            version=v["id"],
            at=now(),
        )
