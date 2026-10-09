import shutil
import pytest
from fastapi.testclient import TestClient
from app.cli import migrate, seed
from app.db import engine_for
from app.main import create_app
from app.settings import Settings

ORIGIN = "http://127.0.0.1:8000"


@pytest.fixture(scope="session")
def seeded(tmp_path_factory):
    settings = Settings(tmp_path_factory.mktemp("fictional-base"))
    engine = engine_for(settings.db_path)
    migrate(engine)
    credentials = seed(engine, settings)
    engine.dispose()
    return settings, credentials


@pytest.fixture
def system(tmp_path, seeded):
    base, credentials = seeded
    settings = Settings(tmp_path)
    shutil.copy2(base.db_path, settings.db_path)
    shutil.copytree(base.data_dir / "uploads", settings.data_dir / "uploads")
    app = create_app(settings)
    yield app, credentials
    app.state.engine.dispose()


def client_for(system, user="maya"):
    app, credentials = system
    client = TestClient(app, base_url=ORIGIN)
    login = client.post("/api/v1/auth/login", json=credentials[user], headers={"Origin": ORIGIN})
    assert login.status_code == 200, login.text
    session = client.get("/api/v1/auth/session").json()
    client.headers.update({"Origin": ORIGIN, "X-CSRF-Token": session["csrf_token"]})
    return client


def ask(client, query="How many annual leave days do I have?", as_of="2026-10-09", **scope):
    result = client.post("/api/v1/queries", json={"query": query, "as_of": as_of, **scope})
    assert result.status_code == 200, result.text
    return result.json()
