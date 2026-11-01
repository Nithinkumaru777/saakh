"""Self-test of the @counts ledger decorator (SPEC §T): it must pass at 100 examples and fail below."""

import json
import shutil
from pathlib import Path

CONFTEST = Path(__file__).with_name("conftest.py")

BODY = '''
from hypothesis import HealthCheck, given, settings, strategies as st
from conftest import counts

@counts("F02")
@settings(max_examples={n}, deadline=None, database=None, suppress_health_check=[HealthCheck.too_slow])
@given(st.integers())
def test_prop(x):
    assert {assertion}

@counts("F03")
def test_golden():
    assert True
'''


def _run(pytester, monkeypatch, n, assertion="isinstance(x, int)"):
    shutil.copy(CONFTEST, pytester.path / "conftest.py")
    out = pytester.path / "counts.json"
    monkeypatch.setenv("SAAKH_COUNTS_FILE", str(out))
    pytester.makepyfile(test_sample=BODY.format(n=n, assertion=assertion))
    pytester.makeini("[pytest]\n")  # isolate from the repo-root pytest.ini
    result = pytester.runpytest_subprocess("-p", "no:cacheprovider")
    return result, json.loads(out.read_text())


def test_counts_passes_at_100_examples(pytester, monkeypatch):
    result, counts = _run(pytester, monkeypatch, 100)
    result.assert_outcomes(passed=2)
    assert counts == {"F02": {"executions": 100, "failed": 0}, "F03": {"executions": 1, "failed": 0}}


def test_counts_fails_below_100_examples(pytester, monkeypatch):
    result, counts = _run(pytester, monkeypatch, 5)
    result.assert_outcomes(passed=2, errors=1)
    result.stdout.fnmatch_lines(["*F02: test_prop executed 5 examples, needs >= 100*"])
    assert counts["F02"] == {"executions": 5, "failed": 0}


def test_counts_records_failures(pytester, monkeypatch):
    result, counts = _run(pytester, monkeypatch, 100, assertion="x < 10")
    result.assert_outcomes(failed=1, passed=1, errors=1)
    assert counts["F02"]["failed"] >= 1
