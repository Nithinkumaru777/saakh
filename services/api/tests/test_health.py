"""Phase 0: API boots, health endpoint, CORS limited to the web app origin."""

from fastapi.testclient import TestClient
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from app.main import app

client = TestClient(app)
WEB = "http://localhost:3000"
EXPECTED = {"status": "ok", "product": "Saakh", "student": "NITHIN KUMAR U", "usn": "2102508611"}


def test_health_golden():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == EXPECTED


def test_cors_allows_web_origin():
    r = client.options("/api/health", headers={"Origin": WEB, "Access-Control-Request-Method": "GET"})
    assert r.status_code == 200
    assert r.headers["access-control-allow-origin"] == WEB


origins = st.builds(
    lambda scheme, host, port: f"{scheme}://{host}{port}",
    st.sampled_from(["http", "https"]),
    st.from_regex(r"[a-z][a-z0-9-]{0,20}(\.[a-z]{2,6}){0,2}", fullmatch=True),
    st.sampled_from(["", ":3000", ":3001", ":8000", ":80"]),
).filter(lambda o: o != WEB)


@settings(max_examples=100, deadline=None, database=None, suppress_health_check=[HealthCheck.too_slow, HealthCheck.filter_too_much])
@given(origins)
def test_cors_rejects_every_other_origin(origin):
    r = client.get("/api/health", headers={"Origin": origin})
    assert r.status_code == 200
    assert r.json() == EXPECTED
    assert "access-control-allow-origin" not in r.headers
