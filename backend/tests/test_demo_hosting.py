import json
from dataclasses import replace
import pytest
from fastapi.testclient import TestClient
from app.main import create_app
from app.hosted import prepare
from conftest import ask, client_for


def test_picker_is_opt_in_and_whitelists_only_seed_accounts(system):
    app, credentials = system
    path = app.state.settings.data_dir / "credentials.json"
    path.write_text(json.dumps({**credentials, "actual": {"password": "do-not-disclose"}}))
    assert TestClient(app).get("/api/v1/demo/accounts").json()["items"] == []
    demo = create_app(replace(app.state.settings, demo_accounts_enabled=True))
    try:
        client = TestClient(demo)
        response = client.get("/api/v1/demo/accounts")
        assert response.headers["cache-control"] == "no-store"
        items = response.json()["items"]
        assert {x["key"] for x in items} == {"maya", "ravi", "isha", "noor", "orbit"}
        assert not next(x for x in items if x["key"] == "noor")["active"]
        assert "do-not-disclose" not in response.text
        for malformed in ["not-json", "[]", '{"maya": []}']:
            path.write_text(malformed)
            assert client.get("/api/v1/demo/accounts").json()["items"] == []
        path.unlink()
        assert client.get("/api/v1/demo/accounts").json()["items"] == []
    finally:
        demo.state.engine.dispose()


def test_read_only_demo_keeps_auth_queries_and_denies_governance(system):
    app, credentials = system
    demo = create_app(replace(app.state.settings, shared_demo_read_only=True))
    try:
        admin = client_for((demo, credentials), "ravi")
        assert admin.get("/api/v1/auth/session").json()["user"]["read_only_demo"]
        assert ask(admin)["status"] == "answered"
        assert admin.get("/api/v1/admin/users").status_code == 200
        for method, path in [
            ("PATCH", "/admin/users/maya"),
            ("PUT", "/admin/documents/leave/acl"),
            ("POST", "/documents"),
            ("POST", "/versions/v/review"),
        ]:
            response = admin.request(method, "/api/v1" + path, json={})
            assert response.status_code == 403
            assert response.json()["error"]["code"] == "DEMO_READ_ONLY"
        assert admin.post("/api/v1/auth/logout").status_code == 204
    finally:
        demo.state.engine.dispose()


def test_hosted_secure_cookie_exact_host_and_origin(system):
    app, credentials = system
    origin = "https://frontend.example"
    demo = create_app(
        replace(
            app.state.settings,
            origins=(origin,),
            allowed_hosts=("backend.example",),
            secure_cookie=True,
        )
    )
    try:
        client = TestClient(demo, base_url="https://backend.example")
        response = client.post(
            "/api/v1/auth/login", json=credentials["maya"], headers={"Origin": origin}
        )
        assert response.status_code == 200
        assert "secure" in response.headers["set-cookie"].lower()
        assert client.get("/api/v1/auth/session").status_code == 200
        assert (
            client.get("/api/v1/demo/accounts", headers={"Host": "evil.example"}).status_code == 400
        )
        assert (
            client.post(
                "/api/v1/auth/login",
                json=credentials["maya"],
                headers={"Origin": "https://evil.example"},
            ).status_code
            == 403
        )
    finally:
        demo.state.engine.dispose()


@pytest.mark.parametrize(
    "origin",
    [
        "http://frontend.example",
        "https://frontend.example/path",
        "https://user@frontend.example",
        "",
        "https://frontend.example?x=1",
    ],
)
def test_hosted_bootstrap_rejects_non_origin_settings(monkeypatch, tmp_path, origin):
    monkeypatch.setenv("RENDER_EXTERNAL_HOSTNAME", "demo.onrender.com")
    monkeypatch.setenv("CORTEX_ORIGINS", origin)
    monkeypatch.setenv("CORTEX_DATA_DIR", str(tmp_path))
    with pytest.raises(RuntimeError):
        prepare()


def test_hosted_bootstrap_seeds_once_and_never_replaces_existing_db(monkeypatch, tmp_path):
    for key, value in {
        "RENDER_EXTERNAL_HOSTNAME": "demo.onrender.com",
        "CORTEX_ORIGINS": "https://frontend.example",
        "CORTEX_DATA_DIR": str(tmp_path),
    }.items():
        monkeypatch.setenv(key, value)
    for key in [
        "CORTEX_SECURE_COOKIE",
        "CORTEX_ALLOWED_HOSTS",
        "CORTEX_DEMO_ACCOUNTS",
        "CORTEX_SHARED_DEMO_READ_ONLY",
    ]:
        monkeypatch.setenv(key, "")
    settings = prepare()
    assert (
        settings.secure_cookie and settings.demo_accounts_enabled and settings.shared_demo_read_only
    )
    assert settings.allowed_hosts == ("demo.onrender.com",)
    path = tmp_path / "credentials.json"
    original = path.read_bytes()
    prepare()
    assert path.read_bytes() == original
    path.unlink()
    with pytest.raises(RuntimeError, match="refusing to overwrite"):
        prepare()
