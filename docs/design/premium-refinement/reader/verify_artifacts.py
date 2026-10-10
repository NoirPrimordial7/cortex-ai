"""Verify immutable fixtures, genuine screenshots, bundle bytes and PR scope.

Reports names/counts/hashes only. Runtime credentials, cookies and traces are never read.
Run from the repository root after staging the final review artifacts.
"""

import gzip
import hashlib
import json
import re
import struct
import subprocess
from pathlib import Path
from zipfile import ZipFile

root = Path(__file__).resolve().parents[4]
here = Path(__file__).resolve().parent
manifest = json.loads((root / "docs/demo-enterprise/manifest.json").read_text())
for item in manifest:
    path = "docs/demo-enterprise/" + item["file"]
    raw = subprocess.check_output(["git", "show", ":" + path], cwd=root)
    assert hashlib.sha256(raw).hexdigest() == item["sha256"], path
    assert raw == (root / path).read_bytes(), path
    if path.endswith(".docx"):
        with ZipFile(root / path) as archive:
            assert not any(
                "vba" in name.lower() or name.endswith(".exe")
                for name in archive.namelist()
            )

captures = json.loads((here / "captures.json").read_text())
assert len(captures) == 70
for item in captures:
    raw = (here / item["file"]).read_bytes()
    assert hashlib.sha256(raw).hexdigest() == item["sha256"]
    assert struct.unpack(">II", raw[16:24]) == (item["width"], item["height"])
    assert item["width"] in {320, 390, 768, 1280, 1440}

files = (
    subprocess.check_output(["git", "diff", "--name-only", "main"], cwd=root)
    .decode()
    .splitlines()
)
for path in files:
    assert not re.search(
        r"(^|/)(?:credentials\.json|\.env(?:\.|$)|test-results|playwright-report|node_modules|dist|local-data|outputs)(/|$)",
        path,
    ), path
    assert not path.endswith((".sqlite", ".db", ".zip", ".webm")), path
    raw = (root / path).read_bytes()
    if b"\0" not in raw and not path.endswith(
        (".png", ".jpg", ".pdf", ".docx", ".woff2")
    ):
        text = raw.decode("utf-8", errors="replace")
        assert not re.search(
            r"(?:AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)",
            text,
        ), path

bundle = []
for path in sorted((root / "frontend/dist/assets").glob("*")):
    if path.suffix not in {".js", ".css"}:
        continue
    raw = path.read_bytes()
    bundle.append(
        {
            "file": path.name,
            "bytes": len(raw),
            "gzip_bytes": len(gzip.compress(raw, compresslevel=9, mtime=0)),
            "sha256": hashlib.sha256(raw).hexdigest(),
        }
    )
(here / "bundle.json").write_text(
    json.dumps(
        {
            "method": "Python gzip level 9, decimal bytes; Vite displayed rounded figures reported separately",
            "assets": bundle,
        },
        indent=2,
    )
    + "\n",
    encoding="utf-8",
)
result = {
    "pr_changed_files": len(files),
    "pr_png_files": sum(p.endswith(".png") for p in files),
    "pr_new_reader_pngs": len(captures),
    "original_hashes": "7 staged originals match manifest and working bytes",
    "docx_archives": "no macros or executables",
    "unexpected_runtime_artifacts": 0,
    "high_confidence_secret_patterns": 0,
    "bundle_assets": len(bundle),
}
(here / "reconciliation.json").write_text(
    json.dumps(result, indent=2) + "\n", encoding="utf-8"
)
print(json.dumps(result, indent=2))
