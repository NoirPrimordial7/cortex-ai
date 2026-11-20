"""Render every page, build contact sheets, and record basic structural checks."""

import json
import re
from pathlib import Path
from zipfile import ZipFile

import pymupdf
from PIL import Image, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parents[1]
RENDERS = ROOT / "quality/page-renders"
RENDERS.mkdir(exist_ok=True)
AUTHOR_NAMES = ("Aditya Gholap", "Arya Dhumal", "Ashwin Gudur", "Yashraj Bansal")


def contact_sheet(definitions, output, width=365, height=490):
    columns = min(4, len(definitions))
    rows = (len(definitions) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * width, rows * height), "#e6e6e6")
    draw = ImageDraw.Draw(sheet)
    for index, (path, label) in enumerate(definitions):
        with Image.open(path) as original:
            image = ImageOps.contain(original.convert("RGB"), (width - 14, height - 27))
        left, top = (index % columns) * width, (index // columns) * height
        sheet.paste(image, (left + (width - image.width) // 2, top + 5))
        draw.text((left + 12, top + height - 19), label, fill="#171717")
    sheet.save(output)


def readable_words(s):
    return len(re.findall(r"\b[\w]+(?:[-’][\w]+)*\b", s))


def main():
    summary = {"pdfs": {}}
    for path in sorted((ROOT / "exports").glob("*/*.pdf")):
        page_entries, text_entries, out_of_page = [], [], []
        with pymupdf.open(path) as doc:
            for number, page in enumerate(doc, 1):
                dest = RENDERS / f"{path.stem}-{number:02d}.png"
                page.get_pixmap(dpi=144, alpha=False).save(dest)
                page_entries.append((dest, f"Page {number}"))
                text_entries.append(page.get_text())
                for word in page.get_text("words"):
                    if not page.rect.contains(pymupdf.Rect(word[:4])):
                        out_of_page.append([number, word[4]])
            contents = "\n".join(text_entries)
            found = re.findall(r"\b(?:Fig(?:ure)?\.?)\s+([1-7])[.:]\s", contents)
            summary["pdfs"][path.name] = {
                "pages": len(doc),
                "authors_present": all(n in contents for n in AUTHOR_NAMES),
                "figure_caption_numbers": sorted(set(found)),
                "keywords_present": "Keywords" in contents or "Index Terms" in contents,
                "references_present": bool(
                    re.search(r"\breferences\b", contents, re.IGNORECASE)
                ),
                "words_outside_page": out_of_page,
                "text_words_by_page": list(map(readable_words, text_entries)),
            }
        contact_sheet(page_entries, RENDERS / f"{path.stem}-overview.png")
    images = [
        (ROOT / f"figures/rendered/fig{i}.png", f"Figure {i}") for i in range(1, 7)
    ]
    contact_sheet(images, RENDERS / "figures-overview.png", width=370, height=265)
    for path in (ROOT / "exports").glob("*/*.docx"):
        with ZipFile(path) as package:
            xml = package.read("word/document.xml").decode()
            summary[path.name] = {
                "zip_check": package.testzip(),
                "images": len(re.findall(r"<(?:\w+:)?inline\b", xml)),
                "editable_equations": len(re.findall(r"<m:oMath(?:\s|>)", xml)),
                "contains_vba": any(
                    "vba" in name.lower() for name in package.namelist()
                ),
            }
    result = ROOT / "quality/structural-checks.json"
    result.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
