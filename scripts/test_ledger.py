"""Build tests/ledger/LEDGER.md from the 100-run counters (SPEC §T.5).

Inputs (all optional; missing files count as zero):
  tests/ledger/counts.json       written by services/api/tests/conftest.py (@counts)
  tests/ledger/counts.web.json   written by apps/web/tests/count-runs.ts (countRuns)
  tests/ledger/junit-*.xml       suite totals from pytest / vitest / playwright

Status per function: PASS = >= 100 executions and 0 failures; FAIL = any failure or 1-99 executions;
PENDING = not built yet (0 executions). Exit code 1 if any function is FAIL, 2 on unreadable input.
Usage: python scripts/test_ledger.py
"""

from __future__ import annotations

import json
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEDGER = ROOT / "tests" / "ledger"
COUNT_FILES = ("counts.json", "counts.web.json")
MIN_RUNS = 100

FUNCTIONS = {
    "F01": "validate_application",
    "F02": "calc_emi",
    "F03": "calc_foir",
    "F04": "engineer_features",
    "F05": "policy_rules",
    "F06": "generate_dataset",
    "F07": "train_model",
    "F08": "predict_pd",
    "F09": "pd_to_grade",
    "F10": "decide",
    "F11": "indicative_rate",
    "F12": "max_eligible_amount",
    "F13": "explain",
    "F14": "counterfactuals",
    "F15": "assess (POST /api/assess)",
    "F16": "score (POST /api/score)",
    "F17": "batch_score (POST /api/batch)",
    "F18": "portfolio_stats (GET /api/portfolio)",
    "F19": "history list / get / delete",
    "F20": "ReportPdf (web)",
    "F21": "web formatting (lib/format.ts)",
    "F22": "personas and sample data (GET /api/personas)",
    "F23": "model page data (GET /api/model)",
    "F24": "shell features (web)",
    "F25": "quality gate: no emoji",
    "F26": "report and docs",
}


def load_counts(path: Path) -> dict[str, dict[str, int]]:
    if not path.exists():
        return {}
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError(f"{path.name}: expected an object of function ids")
    out = {}
    for fid, t in data.items():
        if not (isinstance(t, dict) and all(isinstance(t.get(k), int) and t[k] >= 0 for k in ("executions", "failed"))):
            raise ValueError(f"{path.name}: {fid} must have non-negative integer 'executions' and 'failed'")
        out[fid] = {"executions": t["executions"], "failed": t["failed"]}
    return out


def merge(sources: list[dict[str, dict[str, int]]]) -> dict[str, dict[str, int]]:
    merged: dict[str, dict[str, int]] = {}
    for src in sources:
        for fid, t in src.items():
            m = merged.setdefault(fid, {"executions": 0, "failed": 0})
            m["executions"] += t["executions"]
            m["failed"] += t["failed"]
    return merged


def status(executions: int, failed: int) -> str:
    if failed > 0 or 0 < executions < MIN_RUNS:
        return "FAIL"
    return "PASS" if executions >= MIN_RUNS else "PENDING"


def junit_totals(path: Path) -> tuple[int, int, int]:
    """(tests, failures + errors, skipped) summed over every <testsuite>."""
    root = ET.parse(path).getroot()
    suites = [root] if root.tag == "testsuite" else root.iter("testsuite")
    tests = bad = skipped = 0
    for s in suites:
        tests += int(s.get("tests", 0))
        bad += int(s.get("failures", 0)) + int(s.get("errors", 0))
        skipped += int(s.get("skipped", 0))
    return tests, bad, skipped


def render(merged: dict[str, dict[str, int]], junit: list[tuple[str, tuple[int, int, int]]]) -> tuple[str, int]:
    rows, fails = [], 0
    fids = list(FUNCTIONS) + sorted(set(merged) - set(FUNCTIONS))
    for fid in fids:
        t = merged.get(fid, {"executions": 0, "failed": 0})
        st = status(t["executions"], t["failed"])
        fails += st == "FAIL"
        name = FUNCTIONS.get(fid, "(not a SPEC function card)")
        rows.append(f"| {fid} {name} | SPEC §{fid} | {t['executions']} | {t['executions'] - t['failed']} | {t['failed']} | {st} |")

    done = sum(1 for fid in FUNCTIONS if status(**merged.get(fid, {"executions": 0, "failed": 0})) == "PASS")
    lines = [
        "# Test ledger",
        "",
        f"Generated {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')} by `python scripts/test_ledger.py`. "
        f"Rule (SPEC §T): a function is done at >= {MIN_RUNS} executions and 0 failures.",
        "",
        f"**{done} of {len(FUNCTIONS)} function cards PASS.** PENDING means the function has not been built yet.",
        "",
        "| Function | Spec | Executions | Passed | Failed | Status |",
        "|---|---|---|---|---|---|",
        *rows,
    ]
    if junit:
        lines += ["", "## Suites (JUnit)", "", "| Report | Tests | Failed | Skipped |", "|---|---|---|---|"]
        lines += [f"| {name} | {t} | {b} | {s} |" for name, (t, b, s) in junit]
    return "\n".join(lines) + "\n", fails


def main() -> int:
    try:
        merged = merge([load_counts(LEDGER / f) for f in COUNT_FILES])
        junit = [(p.name, junit_totals(p)) for p in sorted(LEDGER.glob("junit-*.xml"))]
    except (ValueError, json.JSONDecodeError, ET.ParseError) as err:
        print(f"test_ledger: unreadable input: {err}", file=sys.stderr)
        return 2
    text, fails = render(merged, junit)
    fails += sum(1 for _, (_, bad, _) in junit if bad)  # a failing suite fails the ledger too
    LEDGER.mkdir(parents=True, exist_ok=True)
    (LEDGER / "LEDGER.md").write_text(text, encoding="utf-8")
    print(f"test_ledger: wrote {(LEDGER / 'LEDGER.md').relative_to(ROOT)} ({fails} failing)")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
