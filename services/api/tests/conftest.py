"""SPEC §T: the 100-run rule.

Usage (decorator order matters: @counts goes on top):

    from conftest import counts

    @counts("F02")
    @settings(max_examples=100, deadline=None, database=None, suppress_health_check=[HealthCheck.too_slow])
    @given(...)
    def test_emi_properties(...): ...

@counts wraps Hypothesis' inner test, so every executed example (and every failing one) is tallied
for the function id. A Hypothesis test that executed fewer than 100 examples fails at teardown.
Plain (golden) tests decorated with @counts add one execution each. Totals are written to
tests/ledger/counts.json at the end of the session.
"""

from __future__ import annotations

import functools
import json
import os
import re
from pathlib import Path

import tempfile

import pytest

# Tests must never write into the committed demo database (data/saakh.db). This runs before
# any test module imports app.db, so the engine is created against a temp file.
os.environ.setdefault("SAAKH_DB_PATH", str(Path(tempfile.mkdtemp(prefix="saakh-test-")) / "saakh.db"))

pytest_plugins = ["pytester"]

MIN_RUNS = 100
ROOT = Path(__file__).resolve().parents[3]
COUNTS_FILE = Path(os.environ.get("SAAKH_COUNTS_FILE", ROOT / "tests" / "ledger" / "counts.json"))
_FID = re.compile(r"^F\d{2}$")

# fid -> {"executions": int, "failed": int}
_tallies: dict[str, dict[str, int]] = {}
# id(test function) -> examples executed in its current run (reset by _enforce_min_runs)
_per_test: dict[int, int] = {}


def _tally(fid: str) -> dict[str, int]:
    return _tallies.setdefault(fid, {"executions": 0, "failed": 0})


def counts(fid: str):
    """Count every execution of the decorated test for ledger function id `fid` (e.g. "F02")."""
    if not _FID.match(fid):
        raise ValueError(f'counts: function id must look like F01, got "{fid}"')

    def decorate(test):
        key = id(test)

        def counted(inner):
            @functools.wraps(inner)
            def run(*args, **kwargs):
                t = _tally(fid)
                t["executions"] += 1
                _per_test[key] = _per_test.get(key, 0) + 1
                try:
                    return inner(*args, **kwargs)
                except BaseException:
                    t["failed"] += 1
                    raise

            return run

        hyp = getattr(test, "hypothesis", None)
        if hyp is not None:
            # Supported Hypothesis hook: replace the per-example function.
            hyp.inner_test = counted(hyp.inner_test)
            test = pytest.mark.counts(fid, key=key, min_runs=MIN_RUNS)(test)
            return test
        return pytest.mark.counts(fid, key=key, min_runs=1)(counted(test))

    return decorate


@pytest.fixture(autouse=True)
def _enforce_min_runs(request):
    marker = request.node.get_closest_marker("counts")
    if marker is None:
        yield
        return
    key = marker.kwargs["key"]
    _per_test[key] = 0
    yield
    ran = _per_test.get(key, 0)
    need = marker.kwargs["min_runs"]
    assert ran >= need, f"{marker.args[0]}: {request.node.name} executed {ran} examples, needs >= {need}"


def pytest_configure(config):
    config.addinivalue_line("markers", "counts(fid): ledger function id for the 100-run rule")


def pytest_sessionfinish(session, exitstatus):
    COUNTS_FILE.parent.mkdir(parents=True, exist_ok=True)
    COUNTS_FILE.write_text(json.dumps(dict(sorted(_tallies.items())), indent=2) + "\n", encoding="utf-8")
