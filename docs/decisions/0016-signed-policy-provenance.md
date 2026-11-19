# ADR 0016 — Ed25519 policy integrity and provenance

Timestamp: 2026-11-19T23:00:00+05:30. Status: implemented locally. Module: immutable policy provenance. Commit: feature branch history.

## Context, options and decision

A displayed SHA-256 is useful for comparison but does not authenticate stored provenance if both content and database fields are edited. Encryption addresses confidentiality and does not by itself supply the requested origin/history verification.

Sign a canonical JSON version manifest with a server-held Ed25519 private key using pinned cryptography 50.0.2. The manifest binds tenant, document/version ID and label, object key, original and extracted SHA-256 hashes, original filename, uploader ID and upload timestamp. Store the signature, public key and fingerprint in immutable provenance rows. Verification obtains the trusted public key from the server key file, checks signature and manifest fields, then recomputes hashes from original bytes and extracted text. Record every result as Verified, Integrity Mismatch or Unable to Verify, including timestamp and an audit event. The API returns only public verification material, never the key path or private key.

Use `CORTEX_SIGNING_KEY_FILE` to place the key outside the data directory if appropriate. Otherwise it lives at ignored `local-data/integrity-signing-key.pem`. Back up and restrict its filesystem access along with the database/uploads. New environments generate a key once. Verification does not recreate a missing key. If signed records exist and the key is lost, new signing fails with 503 until the original key is restored. Missing/unreadable key or source reports Unable to Verify; altered bytes or an invalid signature reports Integrity Mismatch. Review publication requires a successful current check.

Existing versions are backfilled by the migration CLI only after original and extracted hashes match stored historical values. Origin explicitly says verified_legacy_backfill and the historical uploader remains unknown. This authenticates the backfill observation, not the source's pre-migration history. Local source files and the database are **not encrypted at rest**. The UI states this separately from integrity.

## Consequences and limits

This supplies integrity since signing within the server trust boundary. It is not an external timestamp authority or proof against an attacker controlling both the server signing key and database. Automated key rotation, HSM/KMS storage and encrypted volumes are outside this increment. On Windows, owner-restricted NTFS ACLs must protect the chosen key location; POSIX creation mode is not a Windows ACL policy. Private keys, credentials, original uploads and runtime databases remain ignored by Git.

Tests verify raw tampering, missing-key recovery, immutable provenance and previous approved versions, tenant/READ denial and absence of private material in responses. Full checks, exact versions and limits are in [the test report](../implementation/GOVERNANCE_TEST_REPORT.md). Sources: [cryptography Ed25519 implementation documentation](https://github.com/pyca/cryptography/blob/main/docs/hazmat/primitives/asymmetric/ed25519.rst), [pinned package release](https://pypi.org/project/cryptography/50.0.2/).
