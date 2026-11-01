"""scripts/test_ledger.py: status rule, merging, rendering (SPEC §T.5)."""

import importlib.util
import json
import re
from pathlib import Path

from hypothesis import given, settings
from hypothesis import strategies as st

_path = Path(__file__).resolve().parents[3] / "scripts" / "test_ledger.py"
_spec = importlib.util.spec_from_file_location("test_ledger_script_mod", _path)
ledger = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(ledger)

tally = st.fixed_dictionaries({"executions": st.integers(0, 10_000), "failed": st.integers(0, 50)})
fid = st.sampled_from(list(ledger.FUNCTIONS))
counts = st.dictionaries(fid, tally, max_size=26)


@settings(max_examples=100, deadline=None, database=None)
@given(st.integers(0, 10_000), st.integers(0, 50))
def test_status_rule(executions, failed):
    s = ledger.status(executions, failed)
    if failed:
        assert s == "FAIL"
    elif executions == 0:
        assert s == "PENDING"
    else:
        assert s == ("PASS" if executions >= 100 else "FAIL")


@settings(max_examples=100, deadline=None, database=None)
@given(counts, counts)
def test_merge_sums_and_render_lists_all_26(a, b):
    m = ledger.merge([a, b])
    for k in set(a) | set(b):
        assert m[k]["executions"] == a.get(k, {}).get("executions", 0) + b.get(k, {}).get("executions", 0)
        assert m[k]["failed"] == a.get(k, {}).get("failed", 0) + b.get(k, {}).get("failed", 0)
    text, fails = ledger.render(m, [])
    rows = [r for r in text.splitlines() if re.match(r"\| F\d{2} ", r)]
    assert len(rows) == 26
    assert fails == sum(r.endswith("| FAIL |") for r in rows)


def test_golden_row_matches_spec_example():
    text, fails = ledger.render({"F02": {"executions": 100, "failed": 0}}, [])
    assert "| F02 calc_emi | SPEC §F02 | 100 | 100 | 0 | PASS |" in text
    assert fails == 0


def test_rejects_malformed_counts(tmp_path):
    bad = tmp_path / "counts.json"
    bad.write_text(json.dumps({"F02": {"executions": -1, "failed": 0}}))
    try:
        ledger.load_counts(bad)
    except ValueError as err:
        assert "F02" in str(err)
    else:
        raise AssertionError("negative executions must be rejected")
    assert ledger.load_counts(tmp_path / "missing.json") == {}


def test_junit_totals(tmp_path):
    x = tmp_path / "junit-x.xml"
    x.write_text('<testsuites><testsuite tests="5" failures="1" errors="1" skipped="2"/><testsuite tests="3"/></testsuites>')
    assert ledger.junit_totals(x) == (8, 2, 2)
