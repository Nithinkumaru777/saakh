"""Real-time change feed (Server-Sent Events) for the Applicants and Portfolio views.

Publishers are sync FastAPI endpoints (run in the threadpool), subscribers are async SSE
streams, so events cross into each subscriber's loop with call_soon_threadsafe.
"""

from __future__ import annotations

import asyncio
import json
import threading
from datetime import datetime, timezone
from typing import Any, AsyncIterator, Optional

# ponytail: in-process fan-out; use Redis pub/sub if the API runs as multiple workers.
MAX_SUBSCRIBERS = 500
HEARTBEAT_S = 15.0
QUEUE_SIZE = 100

_lock = threading.Lock()
_subscribers: set[tuple[asyncio.AbstractEventLoop, asyncio.Queue[str]]] = set()


def subscriber_count() -> int:
    with _lock:
        return len(_subscribers)


def _frame(event: str, data: dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(data, separators=(',', ':'))}\n\n"


def _offer(queue: asyncio.Queue[str], frame: str) -> None:
    # A stalled client must not grow memory without bound: drop its oldest frame.
    if queue.full():
        try:
            queue.get_nowait()
        except asyncio.QueueEmpty:
            pass
    queue.put_nowait(frame)


def publish(kind: str, *, ids: Optional[list[str]] = None, count: int = 1) -> None:
    """Broadcast `{kind, ids, count, at}` to every connected stream. Safe from any thread."""
    frame = _frame(
        "change",
        {
            "kind": kind,
            "ids": (ids or [])[:50],
            "count": count,
            "at": datetime.now(timezone.utc).isoformat(),
        },
    )
    with _lock:
        targets = list(_subscribers)
    for loop, queue in targets:
        try:
            loop.call_soon_threadsafe(_offer, queue, frame)
        except RuntimeError:  # loop already closed: subscriber is gone
            pass


def try_subscribe() -> Optional[asyncio.Queue[str]]:
    """Register a stream on the running loop; None when the server is at capacity."""
    queue: asyncio.Queue[str] = asyncio.Queue(maxsize=QUEUE_SIZE)
    entry = (asyncio.get_running_loop(), queue)
    with _lock:
        if len(_subscribers) >= MAX_SUBSCRIBERS:
            return None
        _subscribers.add(entry)
    return queue


def unsubscribe(queue: asyncio.Queue[str]) -> None:
    with _lock:
        for entry in [e for e in _subscribers if e[1] is queue]:
            _subscribers.discard(entry)


async def stream(queue: asyncio.Queue[str], is_disconnected: Any) -> AsyncIterator[str]:
    """Yields SSE frames until the client disconnects; heartbeats keep proxies from timing out."""
    try:
        yield "retry: 3000\n\n" + _frame("ready", {})
        while True:
            if await is_disconnected():
                break
            try:
                yield await asyncio.wait_for(queue.get(), timeout=HEARTBEAT_S)
            except asyncio.TimeoutError:
                yield ": ping\n\n"
    finally:
        unsubscribe(queue)
