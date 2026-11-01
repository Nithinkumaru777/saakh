"""Generate docs/REPORT.docx from docs/REPORT.md using python-docx."""

from pathlib import Path
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

ROOT = Path(__file__).resolve().parents[1]
MD_PATH = ROOT / "docs" / "REPORT.md"
DOCX_PATH = ROOT / "docs" / "REPORT.docx"


def build_docx():
    doc = docx.Document()

    # Set standard margins
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    lines = MD_PATH.read_text(encoding="utf-8").splitlines()

    for line in lines:
        line_str = line.strip()
        if not line_str:
            continue

        if line_str.startswith("# "):
            p = doc.add_paragraph()
            run = p.add_run(line_str[2:])
            run.font.name = "Georgia"
            run.font.size = Pt(22)
            run.font.bold = True
            run.font.color.rgb = RGBColor(0x17, 0x17, 0x1A)
        elif line_str.startswith("## "):
            p = doc.add_paragraph()
            run = p.add_run(line_str[3:])
            run.font.name = "Georgia"
            run.font.size = Pt(16)
            run.font.bold = True
            run.font.color.rgb = RGBColor(0x17, 0x17, 0x1A)
        elif line_str.startswith("### "):
            p = doc.add_paragraph()
            run = p.add_run(line_str[4:])
            run.font.name = "Arial"
            run.font.size = Pt(13)
            run.font.bold = True
            run.font.color.rgb = RGBColor(0x4D, 0x4E, 0x55)
        elif line_str.startswith("- ") or line_str.startswith("* "):
            p = doc.add_paragraph(style="List Bullet")
            clean_text = line_str[2:].replace("**", "")
            run = p.add_run(clean_text)
            run.font.name = "Arial"
            run.font.size = Pt(10)
        elif line_str.startswith("|"):
            # Table row (handled as clean text bullet if header/separator)
            if "---" in line_str:
                continue
            p = doc.add_paragraph()
            clean_text = "  |  ".join([c.strip() for c in line_str.split("|") if c.strip()])
            run = p.add_run(clean_text)
            run.font.name = "Consolas"
            run.font.size = Pt(9)
        else:
            p = doc.add_paragraph()
            clean_text = line_str.replace("**", "")
            run = p.add_run(clean_text)
            run.font.name = "Arial"
            run.font.size = Pt(10.5)

    doc.save(DOCX_PATH)
    print(f"Generated {DOCX_PATH}")


if __name__ == "__main__":
    build_docx()
