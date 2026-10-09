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

    @property
    def db_path(self):
        return self.data_dir / "cortex.sqlite3"

    @classmethod
    def from_env(cls):
        # Local-only deployment. A hosted deployment needs a reviewed HTTPS configuration.
        return cls(
            Path(os.environ.get("CORTEX_DATA_DIR", ROOT / "local-data")).resolve(),
            secure_cookie=os.environ.get("CORTEX_SECURE_COOKIE") == "1",
        )
