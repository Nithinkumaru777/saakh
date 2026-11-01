"""Phase 10: Test F26 report and documentation generation under the 100-run rule."""

from pathlib import Path
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st
from conftest import counts

ROOT = Path(__file__).resolve().parents[3]
REPORT_MD = ROOT / "docs" / "REPORT.md"
REPORT_DOCX = ROOT / "docs" / "REPORT.docx"
DEMO_SCRIPT = ROOT / "docs" / "DEMO_SCRIPT.md"
README_MD = ROOT / "README.md"


@counts("F26")
@settings(
    max_examples=100,
    deadline=None,
    database=None,
    suppress_health_check=[HealthCheck.too_slow],
)
@given(iteration=st.integers(1, 1000))
def test_f26_report_and_docs(iteration):
    # Verify REPORT.md exists and contains required student accreditation
    assert REPORT_MD.exists()
    content_report = REPORT_MD.read_text(encoding="utf-8")
    assert "NITHIN KUMAR U" in content_report
    assert "2102508611" in content_report
    assert "AI for Finance" in content_report
    assert "Topic 4" in content_report

    # Verify REPORT.docx exists and is non-empty
    assert REPORT_DOCX.exists()
    assert REPORT_DOCX.stat().st_size > 5000

    # Verify DEMO_SCRIPT.md exists and has timed sections
    assert DEMO_SCRIPT.exists()
    content_script = DEMO_SCRIPT.read_text(encoding="utf-8")
    assert "NITHIN KUMAR U" in content_script
    assert "2102508611" in content_script
    assert "0:00" in content_script

    # Verify README.md exists and documents setup
    assert README_MD.exists()
    content_readme = README_MD.read_text(encoding="utf-8")
    assert "NITHIN KUMAR U" in content_readme
    assert "2102508611" in content_readme
