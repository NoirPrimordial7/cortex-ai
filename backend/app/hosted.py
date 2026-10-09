"""Single-process, disposable fictional demo on a free Render web service."""

import json
import os
import tempfile
from pathlib import Path
from urllib.parse import urlsplit
import uvicorn
from .cli import migrate, seed
from .db import engine_for
from .security import one
from .settings import Settings


def prepare():
    host = os.environ.get("RENDER_EXTERNAL_HOSTNAME", "")
    origins = os.environ.get("CORTEX_ORIGINS", "")
    if not host or "/" in host or "*" in host or not origins:
        raise RuntimeError("Exact Render hostname and HTTPS frontend origins are required")
    for value in origins.split(","):
        url = urlsplit(value.strip())
        if (
            url.scheme != "https"
            or not url.hostname
            or url.path
            or url.query
            or url.fragment
            or url.username
        ):
            raise RuntimeError("CORTEX_ORIGINS must contain exact HTTPS origins")
    os.environ["CORTEX_ALLOWED_HOSTS"] = host
    os.environ["CORTEX_SECURE_COOKIE"] = "1"
    os.environ["CORTEX_DEMO_ACCOUNTS"] = "1"
    os.environ["CORTEX_SHARED_DEMO_READ_ONLY"] = "1"
    os.environ.setdefault(
        "CORTEX_DATA_DIR", str(Path(tempfile.gettempdir()) / "cortex-public-demo")
    )
    settings = Settings.from_env()
    engine = engine_for(settings.db_path)
    migrate(engine)
    with engine.begin() as conn:
        empty = one(conn, "SELECT id FROM tenants LIMIT 1") is None
    credentials_path = settings.data_dir / "credentials.json"
    if empty:
        credentials_path.write_text(json.dumps(seed(engine, settings)), encoding="utf-8")
    elif not credentials_path.is_file():
        raise RuntimeError("Demo credential file missing; refusing to overwrite existing database")
    engine.dispose()
    return settings


if __name__ == "__main__":
    prepare()
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "10000")),
        workers=1,
        proxy_headers=False,
    )
