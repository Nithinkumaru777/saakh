"""Customer accounts: registration, login, profile, and endpoint protection."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app import auth
from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(autouse=True)
def _auth_on(monkeypatch):
    monkeypatch.setenv("SAAKH_REQUIRE_AUTH", "1")
    auth._FAILS.clear()


def _register(client, email="asha@example.com", password="Sup3rsecret", name="Asha Rao"):
    return client.post("/api/auth/register", json={"email": email, "password": password, "full_name": name})


def _hdr(token):
    return {"Authorization": f"Bearer {token}"}


def test_register_login_me_roundtrip(client):
    r = _register(client, "roundtrip@example.com")
    assert r.status_code == 201
    tok = r.json()["token"]
    assert "password" not in str(r.json()).lower().replace("password_hash", "")
    me = client.get("/api/auth/me", headers=_hdr(tok))
    assert me.status_code == 200 and me.json()["email"] == "roundtrip@example.com"
    lg = client.post("/api/auth/login", json={"email": "ROUNDTRIP@example.com", "password": "Sup3rsecret"})
    assert lg.status_code == 200 and lg.json()["token"]


def test_duplicate_email_rejected(client):
    _register(client, "dup@example.com")
    assert _register(client, "dup@example.com").status_code == 409


@pytest.mark.parametrize("pw", ["short1", "allletters", "12345678"])
def test_weak_passwords_rejected(client, pw):
    assert _register(client, "weak@example.com", pw).status_code == 422


def test_bad_email_and_name_rejected(client):
    assert _register(client, "not-an-email").status_code == 422
    assert _register(client, "ok@example.com", name="<script>").status_code == 422


def test_wrong_password_and_unknown_user_same_message(client):
    _register(client, "who@example.com")
    a = client.post("/api/auth/login", json={"email": "who@example.com", "password": "wrongpass1"})
    b = client.post("/api/auth/login", json={"email": "nobody@example.com", "password": "wrongpass1"})
    assert a.status_code == b.status_code == 401
    assert a.json()["detail"] == b.json()["detail"]


def test_lockout_after_repeated_failures(client):
    _register(client, "lock@example.com")
    for _ in range(5):
        client.post("/api/auth/login", json={"email": "lock@example.com", "password": "wrongpass1"})
    r = client.post("/api/auth/login", json={"email": "lock@example.com", "password": "Sup3rsecret"})
    assert r.status_code == 429


def test_tampered_and_expired_tokens_rejected(client, monkeypatch):
    tok = _register(client, "tamper@example.com").json()["token"]
    body, sig = tok.split(".")
    assert client.get("/api/auth/me", headers=_hdr(body + "." + sig[:-2] + "AA")).status_code == 401
    assert client.get("/api/auth/me", headers=_hdr("garbage")).status_code == 401
    monkeypatch.setenv("SAAKH_TOKEN_TTL_H", "-1")
    expired = auth.make_token(1)
    assert client.get("/api/auth/me", headers=_hdr(expired)).status_code == 401


def test_profile_update_and_validation(client):
    tok = _register(client, "prof@example.com").json()["token"]
    ok = client.patch(
        "/api/auth/me",
        headers=_hdr(tok),
        json={"phone": "98765 43210", "city": "Bengaluru", "employment_type": "salaried", "monthly_income": 85000},
    )
    assert ok.status_code == 200
    assert ok.json()["phone"] == "9876543210" and ok.json()["monthly_income"] == 85000
    assert client.patch("/api/auth/me", headers=_hdr(tok), json={"phone": "12345"}).status_code == 422
    assert client.patch("/api/auth/me", headers=_hdr(tok), json={"employment_type": "pirate"}).status_code == 422
    assert client.patch("/api/auth/me", headers=_hdr(tok), json={"monthly_income": -5}).status_code == 422
    # email and id are not editable through the profile endpoint
    client.patch("/api/auth/me", headers=_hdr(tok), json={"email": "evil@example.com"})
    assert client.get("/api/auth/me", headers=_hdr(tok)).json()["email"] == "prof@example.com"


def test_change_password(client):
    tok = _register(client, "chg@example.com").json()["token"]
    bad = client.post("/api/auth/change-password", headers=_hdr(tok), json={"current_password": "nope12345", "new_password": "Brandn3wpass"})
    assert bad.status_code == 401
    ok = client.post("/api/auth/change-password", headers=_hdr(tok), json={"current_password": "Sup3rsecret", "new_password": "Brandn3wpass"})
    assert ok.status_code == 200
    assert client.post("/api/auth/login", json={"email": "chg@example.com", "password": "Sup3rsecret"}).status_code == 401
    assert client.post("/api/auth/login", json={"email": "chg@example.com", "password": "Brandn3wpass"}).status_code == 200


def test_delete_account(client):
    tok = _register(client, "gone@example.com").json()["token"]
    assert client.delete("/api/auth/me", headers=_hdr(tok)).status_code == 200
    assert client.get("/api/auth/me", headers=_hdr(tok)).status_code == 401


def test_data_endpoints_require_login_but_live_score_and_model_stay_public(client):
    for method, url in [("get", "/api/assessments"), ("get", "/api/portfolio"), ("post", "/api/batch"), ("post", "/api/assess")]:
        assert getattr(client, method)(url).status_code == 401, url
    assert client.get("/api/health").status_code == 200
    assert client.get("/api/model").status_code == 200
    tok = _register(client, "data@example.com").json()["token"]
    assert client.get("/api/assessments", headers=_hdr(tok)).status_code == 200
    assert client.get("/api/portfolio", headers=_hdr(tok)).status_code == 200


def test_security_headers_present(client):
    h = client.get("/api/health").headers
    assert h["x-content-type-options"] == "nosniff" and h["x-frame-options"] == "DENY"


def test_password_hash_is_salted_and_verifies():
    a, b = auth.hash_password("Sup3rsecret"), auth.hash_password("Sup3rsecret")
    assert a != b and auth.verify_password("Sup3rsecret", a) and not auth.verify_password("Sup3rsecreT", a)
    assert not auth.verify_password("x", "garbage")


def test_demo_account_exists_for_local_use_but_never_in_production(monkeypatch):
    from sqlmodel import Session, select

    from app.db import _seed_demo_user, engine

    def demo():
        with Session(engine) as s:
            return s.exec(select(auth.User).where(auth.User.email == "officer@saakh.ai")).first()

    with Session(engine) as s:
        for u in s.exec(select(auth.User).where(auth.User.email == "officer@saakh.ai")).all():
            s.delete(u)
        s.commit()

    monkeypatch.setenv("SAAKH_ENV", "production")
    _seed_demo_user()
    assert demo() is None

    monkeypatch.delenv("SAAKH_ENV")
    _seed_demo_user()
    assert auth.verify_password("Saakh2026!", demo().password_hash)
    _seed_demo_user()  # running again must not fail or duplicate
