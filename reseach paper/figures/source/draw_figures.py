"""Render editable coordinates to vector PDF/SVG and 350 dpi PNG."""

import itertools
from html import escape
from math import atan2, cos, sin
from pathlib import Path

import pymupdf
from reportlab.pdfgen import canvas

OUT = Path(__file__).resolve().parents[1] / "rendered"
OUT.mkdir(exist_ok=True)
WIDTH = 360


class Figure:
    def __init__(self, number, height, alt):
        self.height = height
        self.base = OUT / f"fig{number}"
        self.pdf = canvas.Canvas(
            str(self.base.with_suffix(".pdf")), pagesize=(WIDTH, height), invariant=1
        )
        self.pdf.setTitle(alt)
        self.svg = [
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{height}" viewBox="0 0 {WIDTH} {height}" role="img"><title>{escape(alt)}</title>'
        ]

    def box(self, x, y, width, height, label, shade=0.96):
        self.pdf.setStrokeGray(0.25)
        self.pdf.setFillGray(shade)
        self.pdf.setLineWidth(0.65)
        self.pdf.roundRect(
            x, self.height - y - height, width, height, 4, fill=1, stroke=1
        )
        gray = round(255 * shade)
        self.svg.append(
            f'<rect x="{x}" y="{y}" width="{width}" height="{height}" rx="4" fill="rgb({gray},{gray},{gray})" stroke="#404040" stroke-width=".65"/>'
        )
        labels = label.split("|")
        for i, line in enumerate(labels):
            self.text(
                x + width / 2,
                y + height / 2 + 3 + (i - (len(labels) - 1) / 2) * 11,
                line,
                8.6,
                i == 0,
            )

    def text(self, x, y, label, size=8.1, bold=False):
        self.pdf.setFont("Helvetica-Bold" if bold else "Helvetica", size)
        self.pdf.setFillGray(0.08)
        self.pdf.drawCentredString(x, self.height - y, label)
        self.svg.append(
            f'<text x="{x}" y="{y}" fill="#141414" text-anchor="middle" font-family="Arial,sans-serif" font-size="{size}" font-weight="{700 if bold else 400}">{escape(label)}</text>'
        )

    def arrow(self, *points, head=True):
        self.pdf.setStrokeGray(0.15)
        self.pdf.setLineWidth(0.7)
        paths = [points]
        if head:
            (a, b), (x, y) = points[-2:]
            angle = atan2(y - b, x - a)
            paths.append(
                (
                    (x - 5 * cos(angle + 0.43), y - 5 * sin(angle + 0.43)),
                    (x, y),
                    (x - 5 * cos(angle - 0.43), y - 5 * sin(angle - 0.43)),
                )
            )
        for path in paths:
            for (a, b), (x, y) in itertools.pairwise(path):
                self.pdf.line(a, self.height - b, x, self.height - y)
            self.svg.append(
                '<polyline points="'
                + " ".join(f"{x},{y}" for x, y in path)
                + '" fill="none" stroke="#262626" stroke-width=".7"/>'
            )

    def save(self):
        self.pdf.showPage()
        self.pdf.save()
        self.base.with_suffix(".svg").write_text(
            "\n".join(self.svg + ["</svg>"]), encoding="utf-8"
        )
        with pymupdf.open(self.base.with_suffix(".pdf")) as doc:
            doc[0].get_pixmap(dpi=350, alpha=False).save(self.base.with_suffix(".png"))


f = Figure(
    1,
    181,
    "Architecture from browser and API authorization to reviewed storage and response",
)
f.box(7, 10, 100, 35, "React browser|Ask, review, inspect")
f.box(130, 10, 100, 35, "FastAPI|Session and actions")
f.box(253, 10, 100, 35, "Document READ|Tenant and grants", 0.88)
f.arrow((107, 27), (130, 27))
f.arrow((230, 27), (253, 27))
f.box(7, 72, 100, 39, "Private ingestion|TXT, PDF and DOCX")
f.box(130, 72, 100, 39, "Independent review|Approval and claim")
f.box(253, 72, 100, 39, "SQLite and FTS5|Metadata, text, grants")
f.arrow((180, 45), (180, 58), (57, 58), (57, 72))
f.arrow((107, 91), (130, 91))
f.arrow((230, 91), (253, 91))
f.arrow((303, 45), (303, 72))
f.box(253, 134, 100, 36, "Authorized retrieval|Date, scope, peers")
f.box(130, 134, 100, 36, "Evidence decision|Rank, verify, abstain")
f.box(7, 134, 100, 36, "API response|Status and citations")
f.arrow((303, 111), (303, 134))
f.arrow((253, 152), (230, 152))
f.arrow((130, 152), (107, 152))
f.save()

f = Figure(
    2,
    198,
    "Strict policy path with authorization, peer selection, abstention, and exact-span verification",
)
for x, y, txt in [
    (7, 10, "1. Session and action|Require query.execute"),
    (130, 10, "2. Eligibility predicate|READ, approved, valid"),
    (253, 10, "3. FTS5 ID gate|Scoped match exists"),
    (253, 73, "4. Expand peers|Filter predicate and unit"),
    (130, 73, "5. Compare authority|Strongest tier"),
    (7, 73, "6. Compare values|Exact Auditor decision"),
    (7, 137, "7. Verify support|Revision, span, hash"),
    (130, 137, "8. Emit and store|Answer or abstention"),
    (253, 137, "9. Inspect later|Reapply READ and hash"),
]:
    f.box(x, y, 100, 35, txt, 0.89 if x == 130 and y == 10 else 0.96)
for p, q in [
    ((107, 27), (130, 27)),
    ((230, 27), (253, 27)),
    ((303, 45), (303, 73)),
    ((253, 90), (230, 90)),
    ((130, 90), (107, 90)),
    ((57, 108), (57, 137)),
    ((107, 154), (130, 154)),
    ((230, 154), (253, 154)),
]:
    f.arrow(p, q)
f.text(
    180, 189, "A failed gate returns a bounded status. Unverified spans are withheld."
)
f.save()

f = Figure(
    3, 175, "Fictional leave policy editions with separate issue and validity dates"
)
f.text(180, 13, "Example question date: 20 November 2026", 9, True)
for x, head, support, publish, effect in [
    (
        7,
        "Edition A",
        "17 leave days",
        "Issued 03 Feb 2025",
        "01 Apr 2025 to 01 Apr 2026",
    ),
    (
        130,
        "Edition B",
        "23 leave days",
        "Issued 20 Jan 2026",
        "01 Apr 2026 to 01 Apr 2027",
    ),
    (253, "Edition C", "27 leave days", "Issued 01 Oct 2026", "From 01 Apr 2027"),
]:
    f.box(x, 26, 100, 44, f"{head}|{support}", 0.85 if x == 130 else 0.96)
    f.text(x + 50, 86, publish)
    f.text(x + 50, 108, effect, 7.7)
f.arrow((20, 126), (341, 126))
for x, label in [(57, "Expired"), (180, "Effective"), (303, "Future-effective")]:
    f.arrow((x, 120), (x, 132), head=False)
    f.text(x, 147, label, 8.8, True)
f.text(180, 165, "Effective end dates are exclusive. Dates and values are fictional.")
f.save()

f = Figure(
    4,
    225,
    "Decision flow distinguishes temporal replacement and active highest-rank disagreement",
)
f.box(108, 9, 144, 33, "Reviewed claims|Requested date and scope")
f.box(108, 61, 144, 33, "Filter date and scope|Check kind, key and rank")
f.arrow((180, 42), (180, 61))
f.box(7, 117, 100, 39, "One value|Answer after checks")
f.box(130, 117, 100, 39, "Competing values|Check bound and case")
f.box(253, 117, 100, 39, "No governing evidence|Abstain")
f.arrow((180, 94), (180, 117))
f.arrow((108, 77), (57, 77), (57, 117))
f.arrow((252, 77), (303, 77), (303, 117))
f.text(67, 69, "Single value", 7.7)
f.text(290, 69, "Missing", 7.7)
f.text(209, 108, "Different", 7.7)
f.box(73, 179, 100, 36, "No current choice|Abstain after checks", 0.88)
f.box(191, 179, 143, 36, "Verified exact choice|Cite selected primary")
f.arrow((157, 156), (157, 167), (123, 167), (123, 179))
f.arrow((205, 156), (205, 167), (264, 167), (264, 179))
f.save()

f = Figure(
    5,
    200,
    "Tenant-scoped relationships among access grants, policy source records and query evidence",
)
for x, y, txt in [
    (7, 13, "Users / roles|Membership"),
    (130, 13, "Document READ grants|User or role subject"),
    (253, 13, "Documents|Tenant-owned"),
    (253, 72, "Versions|Metadata and seal"),
    (130, 72, "Clauses|Offsets and valid time"),
    (7, 72, "Reviewed claims|Predicate, unit, value"),
    (7, 135, "Conflict evidence|Clause and claim"),
    (130, 135, "Citations|Clause and source hash"),
    (253, 135, "Saved queries|Owner and revisions"),
]:
    f.box(x, y, 100, 36, txt, 0.88 if y == 72 else 0.96)
for p, q in [
    ((107, 31), (130, 31)),
    ((230, 31), (253, 31)),
    ((303, 49), (303, 72)),
    ((253, 90), (230, 90)),
    ((130, 90), (107, 90)),
    ((57, 108), (57, 135)),
    ((180, 108), (180, 135)),
    ((253, 153), (230, 153)),
]:
    f.arrow(p, q)
f.text(
    180,
    190,
    "Arrows show evidence or access links. Tenant joins are enforced in the API.",
)
f.save()

f = Figure(
    6,
    176,
    "Evaluation separates development regression, fresh fixture and research-only comparators",
)
f.box(7, 10, 100, 38, "Development fixture|Pinned application")
f.box(130, 10, 100, 38, "New fictional policies|Freeze labels and cases")
f.box(253, 10, 100, 38, "Controlled variants|Same visible corpus")
f.box(7, 66, 100, 38, "HTTP and hooks|Peer and citation checks")
f.box(130, 66, 100, 38, "HTTP full method|Fresh SQLite fixture")
f.box(253, 66, 100, 38, "Offline decision rules|A, B and C")
for x in (57, 180, 303):
    f.arrow((x, 48), (x, 66))
f.arrow((230, 29), (253, 29))
f.box(
    66,
    127,
    228,
    37,
    "Summarize outcomes and inspect errors|Exact counts, scope controls and timing separately",
    0.88,
)
f.arrow((57, 104), (57, 118), (98, 118), (98, 127))
f.arrow((180, 104), (180, 127))
f.arrow((303, 104), (303, 118), (264, 118), (264, 127))
f.save()
