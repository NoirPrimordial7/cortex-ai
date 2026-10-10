import os
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


@dataclass(frozen=True)
class Settings:
    data_dir: Path
    origins: tuple[str, ...] = (
        "http://127.0.0.1:8000",
        "http://localhost:8000",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    )
    secure_cookie: bool = False
    allowed_hosts: tuple[str, ...] = ("127.0.0.1", "localhost", "testserver")
    demo_accounts_enabled: bool = False
    shared_demo_read_only: bool = False
    pdf_renderer: str | None = None

    @property
    def db_path(self):
        return self.data_dir / "cortex.sqlite3"

    @classmethod
    def from_env(cls):
        data_dir = Path(os.environ.get("CORTEX_DATA_DIR", ROOT / "local-data")).resolve()
        origins = tuple(
            x.strip() for x in os.environ.get("CORTEX_ORIGINS", "").split(",") if x.strip()
        )
        hosts = tuple(
            x.strip() for x in os.environ.get("CORTEX_ALLOWED_HOSTS", "").split(",") if x.strip()
        )
        return cls(
            data_dir,
            origins=origins or cls.__dataclass_fields__["origins"].default,
            secure_cookie=os.environ.get("CORTEX_SECURE_COOKIE") == "1",
            allowed_hosts=hosts or cls.__dataclass_fields__["allowed_hosts"].default,
            demo_accounts_enabled=os.environ.get("CORTEX_DEMO_ACCOUNTS") == "1"
            or (data_dir / "demo-autofill.enabled").is_file(),
            shared_demo_read_only=os.environ.get("CORTEX_SHARED_DEMO_READ_ONLY") == "1",
            pdf_renderer=os.environ.get("CORTEX_PDF_RENDERER") or None,
        )
