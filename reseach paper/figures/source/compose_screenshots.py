"""Compose publication crops from the original fictional demo screenshots."""

from pathlib import Path

import pymupdf
from PIL import Image
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen.canvas import Canvas

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "inputs/application-screenshots"
OUTPUT = ROOT / "figures/rendered"
WIDTH = 735
MARGIN = 10

PANELS = (
    (
        "(a) Supported policy answer and cited passage",
        "WhatsApp Image 2026-11-19 at 10.11.42 PM.jpeg",
        (((126, 119, 843, 307), 1.00), ((897, 35, 1495, 437), 1.16)),
    ),
    (
        "(b) Unresolved policy conflict",
        "WhatsApp Image 2026-11-19 at 10.11.42 PM (2).jpeg",
        (((155, 178, 736, 229), 1.21), ((184, 326, 687, 395), 1.30)),
    ),
)


def main():
    height = 2 * MARGIN + sum(
        31 + sum((box[3] - box[1]) * scale + 7 for box, scale in crops)
        for _, _, crops in PANELS
    )
    path = OUTPUT / "fig7.pdf"
    page = Canvas(str(path), pagesize=(WIDTH, height), invariant=1)
    page.setTitle("Cortex AI fictional demonstration screenshots")
    page.setFillColor(HexColor("#151515"))
    page.setFont("Helvetica-Bold", 20)
    top = height - MARGIN
    for title, filename, crops in PANELS:
        page.drawString(MARGIN, top - 20, title)
        top -= 31
        with Image.open(SOURCE / filename) as original:
            for box, scale in crops:
                crop = original.crop(box).convert("RGB")
                width = crop.width * scale
                image_height = crop.height * scale
                top -= image_height
                page.drawImage(ImageReader(crop), MARGIN, top, width, image_height)
                top -= 7
    page.showPage()
    page.save()
    with pymupdf.open(path) as doc:
        doc[0].get_pixmap(dpi=180, alpha=False).save(OUTPUT / "fig7.png")


if __name__ == "__main__":
    main()
