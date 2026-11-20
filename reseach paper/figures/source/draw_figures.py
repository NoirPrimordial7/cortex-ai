"""Render editable coordinates to vector PDF/SVG and 350 dpi PNG."""

import itertools
from html import escape
from math import atan2, cos, sin
from pathlib import Path

import pymupdf
from reportlab.lib.colors import HexColor
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

OUT = Path(__file__).resolve().parents[1] / "rendered"
OUT.mkdir(exist_ok=True)
WIDTH = 360
INK = "#173047"
TEAL = "#17655d"
LINE = "#516775"
PALE = "#edf3f7"
ACTIVE = "#def1ea"


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

    def rect(self, x, y, width, height, fill=PALE, stroke=LINE, radius=3):
        self.pdf.setStrokeColor(HexColor(stroke))
        self.pdf.setFillColor(HexColor(fill))
        self.pdf.setLineWidth(0.8)
        self.pdf.roundRect(x, self.height - y - height, width, height, radius, fill=1)
        self.svg.append(
            f'<rect x="{x}" y="{y}" width="{width}" height="{height}" rx="{radius}" fill="{fill}" stroke="{stroke}" stroke-width=".8"/>'
        )

    def box(self, x, y, width, height, label, shade=0.96):
        self.rect(x, y, width, height, ACTIVE if shade < 0.95 else PALE)
        labels = label.split("|")
        for i, line in enumerate(labels):
            size = 10 if i == 0 else 9
            assert (
                stringWidth(line, "Helvetica-Bold" if i == 0 else "Helvetica", size)
                <= width - 5
            ), line
            self.text(
                x + width / 2,
                y + height / 2 + 3 + (i - (len(labels) - 1) / 2) * 11,
                line,
                size,
                i == 0,
            )

    def text(self, x, y, label, size=9, bold=False, color=INK):
        self.pdf.setFont("Helvetica-Bold" if bold else "Helvetica", size)
        self.pdf.setFillColor(HexColor(color))
        self.pdf.drawCentredString(x, self.height - y, label)
        self.svg.append(
            f'<text x="{x}" y="{y}" fill="{color}" text-anchor="middle" font-family="Arial,sans-serif" font-size="{size}" font-weight="{700 if bold else 400}">{escape(label)}</text>'
        )

    def arrow(self, *points, head=True, color=LINE, dashed=False):
        self.pdf.setStrokeColor(HexColor(color))
        self.pdf.setLineWidth(0.95)
        self.pdf.setDash(3, 2) if dashed else self.pdf.setDash()
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
                + f'" fill="none" stroke="{color}" stroke-width=".95"'
                + (' stroke-dasharray="3 2"' if dashed else "")
                + "/>"
            )
        self.pdf.setDash()

    def diamond(self, x, y, width, height, label):
        points = (
            (x, y - height / 2),
            (x + width / 2, y),
            (x, y + height / 2),
            (x - width / 2, y),
        )
        self.pdf.setStrokeColor(HexColor(TEAL))
        self.pdf.setFillColor(HexColor(ACTIVE))
        path = self.pdf.beginPath()
        path.moveTo(points[0][0], self.height - points[0][1])
        for px, py in points[1:]:
            path.lineTo(px, self.height - py)
        path.close()
        self.pdf.drawPath(path, fill=1, stroke=1)
        coords = " ".join(f"{px},{py}" for px, py in points)
        self.svg.append(f'<polygon points="{coords}" fill="{ACTIVE}" stroke="{TEAL}"/>')
        self.text(x, y + 3, label, 9, True)

    def save(self):
        self.pdf.showPage()
        self.pdf.save()
        self.base.with_suffix(".svg").write_text(
            "\n".join(self.svg + ["</svg>"]), encoding="utf-8"
        )
        with pymupdf.open(self.base.with_suffix(".pdf")) as doc:
            doc[0].get_pixmap(dpi=350, alpha=False).save(self.base.with_suffix(".png"))


# 1. Architecture. The public client is outside the application boundary.
f = Figure(
    1,
    232,
    "Application trust boundary, policy intake, permitted retrieval and response",
)
f.rect(4, 46, 352, 181, "#ffffff", LINE, 4)
f.text(74, 62, "Server trust boundary", bold=True)
f.box(115, 4, 130, 30, "React client|Ask, review, inspect")
f.arrow((180, 34), (180, 68), color=TEAL)
f.box(115, 68, 130, 32, "FastAPI and session|Authorize action")
f.box(12, 118, 101, 34, "Private ingestion|Extract and index")
f.box(129, 118, 101, 34, "Reviewer approval|Metadata and claim")
f.box(246, 118, 102, 34, "Document READ|Tenant and grants", 0.9)
f.arrow((115, 84), (62, 84), (62, 118))
f.arrow((245, 84), (297, 84), (297, 118), color=TEAL)
f.arrow((113, 135), (129, 135))
f.box(12, 179, 101, 38, "SQLite and FTS5|Policy data and index")
f.box(129, 179, 101, 38, "API response|Status and evidence")
f.box(
    246,
    172,
    102,
    50,
    "Evidence reasoning|Retrieve valid peers|Rank, verify, decide",
    0.9,
)
f.arrow((179, 152), (179, 165), (63, 165), (63, 179))
f.arrow((297, 152), (297, 172), color=TEAL)
f.arrow((113, 213), (123, 213), (123, 224), (240, 224), (240, 213), (246, 213))
f.arrow((246, 192), (230, 192), color=TEAL)
f.save()

# 2. Strict path. The colored arrows trace the admitted evidence.
f = Figure(
    2,
    218,
    "Ordered strict policy admission, FTS identifier gate, peer expansion and verification",
)
stages = [
    (7, 8, "1. Authenticate|Authorize query"),
    (130, 8, "2. Admit evidence|READ, approval, scope"),
    (253, 8, "3. Filter valid time|Apply effective window"),
    (253, 75, "4. FTS5 ID gate|Eligible hit required"),
    (130, 75, "5. Expand peers|Predicate and unit"),
    (7, 75, "6. Compare rank|Use strongest tier"),
    (7, 142, "7. Compare values|Check Auditor choice"),
    (130, 142, "8. Verify citations|Revision, span, hash"),
    (253, 142, "9. Emit status|Answer or abstention"),
]
for x, y, label in stages:
    f.box(x, y, 100, 42, label, 0.89 if x == 130 else 0.96)
for start, end in [
    ((107, 29), (130, 29)),
    ((230, 29), (253, 29)),
    ((303, 50), (303, 75)),
    ((253, 96), (230, 96)),
    ((130, 96), (107, 96)),
    ((57, 117), (57, 142)),
    ((107, 163), (130, 163)),
    ((230, 163), (253, 163)),
]:
    f.arrow(start, end, color=TEAL)
f.text(
    180,
    204,
    "A failed gate returns a bounded status. Citation reopening reapplies READ.",
)
f.save()

# 3. Shared time axis with distinct publication and effective-date marks.
f = Figure(
    3,
    172,
    "Three fictional policy validity intervals, with publication marks and a query date",
)
f.text(180, 12, "Fictional annual leave policy", 11, True)
f.arrow((26, 143), (340, 143))
for x, label in [(56, "Apr 2025"), (170, "Apr 2026"), (284, "Apr 2027")]:
    f.arrow((x, 139), (x, 147), head=False)
    f.text(x, 158, label, 9)
for start, end, issued, y, label, date, active in [
    (56, 170, 38, 47, "Expired / 17 days", "03 Feb 2025", False),
    (170, 284, 147, 79, "Effective / 23 days", "20 Jan 2026", True),
    (284, 335, 227, 111, "Future / 27 days", "01 Oct 2026", False),
]:
    f.rect(
        start,
        y + 5,
        end - start,
        9,
        ACTIVE if active else PALE,
        TEAL if active else LINE,
        1,
    )
    f.text((start + end) / 2, y + 2, label, 9, True)
    f.arrow((issued, y + 8), (start, y + 8), head=False, dashed=True)
    f.text((issued + start) / 2, y + 27, date, 8)
f.arrow((243, 30), (243, 69), color=TEAL, dashed=True)
f.arrow((335, 120.5), (349, 120.5))
f.text(243, 25, "Query: 20 Nov 2026", 9, True, TEAL)
f.text(
    180,
    170,
    "Dashed lead-in: issue date. Bounded effective intervals exclude the end date.",
    8.5,
)
f.save()

# 4. Explicit decision branches and separate terminal statuses.
f = Figure(
    4, 267, "Strongest-tier agreement, verified Auditor resolution, and abstention"
)
f.box(105, 5, 150, 31, "Eligible reviewed claims|As-of date and scope")
f.diamond(180, 64, 138, 35, "Governing evidence?")
f.arrow((180, 36), (180, 46.5))
f.box(256, 48, 96, 31, "Abstain|Missing evidence")
f.arrow((249, 64), (256, 64))
f.text(258, 44, "No", 8)
f.arrow((180, 81.5), (180, 97))
f.text(194, 93, "Yes", 8)
f.box(104, 97, 152, 31, "Rank sources|Comparable strongest tier")
f.diamond(180, 153, 132, 34, "Same claim value?")
f.arrow((180, 128), (180, 136))
f.box(6, 137, 96, 33, "Verify evidence|Supported answer", 0.9)
f.arrow((114, 153), (102, 153), color=TEAL)
f.text(108, 135, "Yes", 8)
f.arrow((180, 170), (180, 182))
f.text(193, 179, "No", 8)
f.diamond(180, 202, 164, 40, "Verified Auditor choice?")
f.box(3, 183, 87, 38, "Verify choice|Supported answer", 0.9)
f.arrow((98, 202), (90, 202), color=TEAL)
f.text(96, 180, "Yes", 8)
f.arrow((180, 222), (180, 239))
f.text(193, 233, "No", 8)
f.box(106, 239, 148, 25, "Abstain on current conflict")
f.save()

# 5. Records and associations. Dashed curves are unnecessary in this projection.
f = Figure(5, 216, "Tenant access, versioned evidence, and saved query relationships")
for x, y, width, label in [
    (5, 8, 103, "Users and roles|Tenant membership"),
    (128, 8, 103, "Document grants|READ subject"),
    (252, 8, 103, "Documents|Tenant-owned"),
    (252, 71, 103, "Versions|Source hash and seal"),
    (128, 71, 103, "Clauses|Offsets and valid time"),
    (5, 71, 103, "Reviewed claims|Key, unit, value"),
    (5, 137, 103, "Conflict evidence|Claim and clause"),
    (128, 137, 103, "Citations|Clause and digest"),
    (252, 137, 103, "Saved queries|Owner and revisions"),
]:
    f.box(x, y, width, 42, label, 0.9 if y == 71 else 0.96)
for start, end in [
    ((108, 29), (128, 29)),
    ((231, 29), (252, 29)),
    ((303, 50), (303, 71)),
    ((252, 92), (231, 92)),
    ((128, 92), (108, 92)),
    ((56, 113), (56, 137)),
    ((180, 113), (180, 137)),
    ((252, 158), (231, 158)),
]:
    f.arrow(start, end, head=False)
f.arrow((304, 179), (304, 194), (56, 194), (56, 179), head=False)
f.text(
    180,
    209,
    "Edges show stored records or linked evidence, without asserting SQL cardinality.",
)
f.save()

# 6. Compare the fixture streams, then bring them together for analysis.
f = Figure(
    6,
    195,
    "Development fixture and second fictional corpus with comparator and service evaluation",
)
f.box(6, 8, 103, 40, "Development fixture|Pinned scenarios")
f.box(
    129,
    8,
    225,
    40,
    "Second fictional policy corpus|Predefined query, expected status and evidence labels",
    0.9,
)
f.box(6, 73, 103, 40, "HTTP and hooks|Peers and citations")
f.box(129, 73, 103, 40, "Full Cortex service|Fresh SQLite corpus", 0.9)
f.box(251, 73, 103, 40, "Offline comparators|Rules A, B and C")
for a, b in [(57, 57), (180, 180), (303, 303)]:
    f.arrow((a, 48), (b, 73))
f.box(
    65,
    143,
    230,
    45,
    "Score and inspect outcomes|Status, eligible peers, citations and disagreements|Report passage timing separately",
    0.9,
)
f.arrow((57, 113), (57, 130), (106, 130), (106, 143))
f.arrow((180, 113), (180, 143))
f.arrow((303, 113), (303, 130), (254, 130), (254, 143))
f.save()
