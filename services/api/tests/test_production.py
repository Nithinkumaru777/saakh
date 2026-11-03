"""Production hardening + real-time feed, under the 100-run rule.

F17: batch header / row / size limits (SPEC F17: "up to 5,000 rows; header must match template").
F19: history pagination in SQL, literal search, and the live change feed (app/events.py).
"""

from __future__ import annotations

import asyncio
import csv
import io
import json
import threading

import pytest
from fastapi.testclient import TestClient
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from app import events
from app.db import AssessmentRecord, engine
from app.main import BATCH_FIELDS, BATCH_MAX_BYTES, BATCH_MAX_ROWS, app
from conftest import counts
from sqlmodel import Session, func, select

SETTINGS = settings(max_examples=100, deadline=None, database=None, suppress_health_check=list(HealthCheck))

VALID_ROW = {
    "full_name": "Valid Name", "age": "30", "employment_type": "salaried", "years_in_job": "4.0",
    "city_tier": "1", "dependents": "0", "residence": "rented", "monthly_income": "75000",
    "other_monthly_income": "0", "cibil_score": "760", "credit_history_years": "5.0",
    "open_credit_lines": "3", "credit_utilisation_pct": "20.0", "missed_payments_24m": "0",
    "enquiries_6m": "0", "past_default": "false", "existing_emi": "5000", "outstanding_debt": "30000",
    "loan_type": "personal", "loan_amount": "300000", "tenure_months": "36", "collateral_value": "0",
    "purpose": "Personal",
}


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:  # runs lifespan: init, seed, warm-up
        yield c


def _csv(header: list[str], rows: int) -> bytes:
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(header)
    for _ in range(rows):
        w.writerow([VALID_ROW.get(h, "x") for h in header])
    return buf.getvalue().encode("utf-8")


# ---------------------------------------------------------------------------- F17


@counts("F17")
@SETTINGS
@given(
    order=st.permutations(BATCH_FIELDS),
    drop=st.lists(st.sampled_from(BATCH_FIELDS), max_size=3, unique=True),
    extra=st.lists(st.sampled_from(["notes", "score", "Age ", "ssn"]), max_size=2, unique=True),
)
def test_batch_header_must_match_template(client, order, drop, extra):
    header = [h for h in order if h not in drop] + extra
    resp = client.post("/api/batch", files={"file": ("b.csv", _csv(header, 2), "text/csv")})
    # "Age " strips to "Age", which is not a template column either.
    bad_extra = [e for e in extra if e.strip() not in BATCH_FIELDS]
    if drop or bad_extra:
        assert resp.status_code == 422
        detail = resp.json()["detail"]
        assert "does not match the template" in detail
        for d in drop:
            assert d in detail
    else:
        assert resp.status_code == 200, resp.text
        assert resp.json()["processed"] == 2


@counts("F17")
def test_batch_row_and_size_limits(client):
    over = client.post(
        "/api/batch", files={"file": ("b.csv", _csv(BATCH_FIELDS, BATCH_MAX_ROWS + 1), "text/csv")}
    )
    assert over.status_code == 422
    assert "5,000" in over.json()["detail"]

    huge = b",".join(f.encode() for f in BATCH_FIELDS) + b"\n" + b"a" * (BATCH_MAX_BYTES + 10)
    too_big = client.post("/api/batch", files={"file": ("b.csv", huge, "text/csv")})
    assert too_big.status_code == 413


# ---------------------------------------------------------------------------- F19


@counts("F19")
@SETTINGS
@given(page=st.integers(1, 12), page_size=st.integers(1, 100))
def test_history_pagination_matches_sql_total(client, page, page_size):
    with Session(engine) as s:
        total = s.exec(select(func.count()).select_from(AssessmentRecord)).one()
    body = client.get(f"/api/assessments?page={page}&page_size={page_size}").json()
    assert body["total"] == total
    expected = max(0, min(page_size, total - (page - 1) * page_size))
    assert len(body["items"]) == expected
    assert body["total_pages"] == max(1, -(-total // page_size))
    dates = [i["created_at"] for i in body["items"]]
    assert dates == sorted(dates, reverse=True)


@counts("F19")
@SETTINGS
@given(
    q=st.tuples(
        st.text("abcdefgh ", max_size=6), st.sampled_from(["%", "_", "%%", r"\%"]), st.text("abcdefgh", max_size=6)
    ).map("".join)
)
def test_history_search_treats_wildcards_literally(client, q):
    # Names may only contain letters, spaces and . ' -  so a literal % or _ never matches.
    body = client.get("/api/assessments", params={"q": q}).json()
    assert body["total"] == 0


def _drain(queue: asyncio.Queue[str]) -> list[dict]:
    out = []
    while not queue.empty():
        frame = queue.get_nowait()
        out.append(json.loads(frame.split("data: ", 1)[1]))
    return out


@counts("F19")
@SETTINGS
@given(
    batches=st.lists(
        st.tuples(
            st.sampled_from(["assessment.created", "assessment.deleted"]),
            st.lists(st.text("abcdef0123456789-", min_size=1, max_size=12), max_size=60),
        ),
        min_size=1,
        max_size=8,
    )
)
def test_change_feed_delivers_cross_thread_publishes_in_order(batches):
    async def scenario():
        queue = events.try_subscribe()
        assert queue is not None
        try:
            # Publish from a worker thread, as sync FastAPI endpoints do.
            t = threading.Thread(target=lambda: [events.publish(k, ids=i) for k, i in batches])
            t.start()
            await asyncio.to_thread(t.join)
            await asyncio.sleep(0)  # let call_soon_threadsafe callbacks run
            got = _drain(queue)
        finally:
            events.unsubscribe(queue)
        assert [g["kind"] for g in got] == [k for k, _ in batches]
        assert [g["ids"] for g in got] == [i[:50] for _, i in batches]
        assert events.subscriber_count() == 0

    asyncio.run(scenario())


@counts("F19")
def test_change_feed_bounds_memory_and_capacity(monkeypatch):
    async def scenario():
        queue = events.try_subscribe()
        for n in range(events.QUEUE_SIZE + 25):
            events.publish("assessment.created", ids=[str(n)])
        await asyncio.sleep(0)
        got = _drain(queue)
        events.unsubscribe(queue)
        # Slow client: oldest frames dropped, newest kept, never more than QUEUE_SIZE.
        assert len(got) == events.QUEUE_SIZE
        assert got[-1]["ids"] == [str(events.QUEUE_SIZE + 24)]

        monkeypatch.setattr(events, "MAX_SUBSCRIBERS", 1)
        first = events.try_subscribe()
        assert events.try_subscribe() is None
        events.unsubscribe(first)

    asyncio.run(scenario())


@counts("F19")
def test_stream_sends_ready_then_frames_and_unsubscribes():
    async def scenario():
        queue = events.try_subscribe()
        calls = {"n": 0}

        async def disconnected():
            calls["n"] += 1
            return calls["n"] > 1  # connected for one frame, then gone

        gen = events.stream(queue, disconnected)
        first = await gen.__anext__()
        assert first.startswith("retry: 3000") and "event: ready" in first
        events.publish("assessment.deleted", ids=["x"])
        await asyncio.sleep(0)
        frame = await gen.__anext__()
        assert "event: change" in frame and '"ids":["x"]' in frame
        with pytest.raises(StopAsyncIteration):
            await gen.__anext__()
        assert events.subscriber_count() == 0

    asyncio.run(scenario())


@counts("F19")
def test_writes_publish_change_events(client, monkeypatch):
    seen: list[tuple[str, list[str]]] = []
    monkeypatch.setattr(events, "publish", lambda kind, ids=None, count=1: seen.append((kind, ids or [])))

    payload = {k: v for k, v in VALID_ROW.items()}
    for k in ("age", "city_tier", "dependents", "monthly_income", "other_monthly_income", "cibil_score",
              "open_credit_lines", "missed_payments_24m", "enquiries_6m", "existing_emi",
              "outstanding_debt", "loan_amount", "tenure_months", "collateral_value"):
        payload[k] = int(payload[k])
    for k in ("years_in_job", "credit_history_years", "credit_utilisation_pct"):
        payload[k] = float(payload[k])
    payload["past_default"] = False

    created = client.post("/api/assess", json=payload)
    assert created.status_code == 200, created.text
    new_id = created.json()["id"]
    assert seen[-1] == ("assessment.created", [new_id])

    assert client.delete(f"/api/assessments/{new_id}").status_code == 200
    assert seen[-1] == ("assessment.deleted", [new_id])

    client.post("/api/score", json=payload)  # fast path never persists, never publishes
    assert len(seen) == 2


@counts("F19")
def test_events_endpoint_rejects_when_full(client, monkeypatch):
    monkeypatch.setattr(events, "try_subscribe", lambda: None)
    resp = client.get("/api/events")
    assert resp.status_code == 503
