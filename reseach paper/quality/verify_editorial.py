"""Verify synchronized review outputs and record artifact digests."""

import hashlib
import json
import re
import unicodedata
from collections import Counter
from pathlib import Path
from zipfile import ZipFile

import pymupdf
from lxml import etree

ROOT = Path(__file__).resolve().parents[1]
EXPORT = ROOT / "exports"
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
M = "{http://schemas.openxmlformats.org/officeDocument/2006/math}"
WP = "{http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing}"
AUTHORS = ("Aditya Gholap", "Arya Dhumal", "Ashwin Gudur", "Yashraj Bansal")
CORRESPONDENCE = "adityagholap19.06@gmail.com"
VALUES = (
    "16/16",
    "5/16",
    "14/16",
    "11.670",
    "15.887",
    "28.721",
    "51.339",
    "10.329",
    "11.692",
    "27.763",
    "45.733",
    "q=(u,t,s,k)",
    "G(u,c)",
    "S(c,q)",
    "T[i:j]",
    "SHA256",
    "UTF8",
)
CAPTION = r"\b(?:Fig(?:ure)?\.?)\s+([1-6])[.:]\s"


def inspect_pdf(path):
    with pymupdf.open(path) as doc:
        text = unicodedata.normalize("NFKC", "\n".join(p.get_text() for p in doc))
        compact = re.sub(r"\s+", "", text)
        assert "\ufffd" not in text and "{.unnumbered}" not in text, path
        assert all(a in text for a in AUTHORS), path
        assert all(a in doc.metadata["author"] for a in AUTHORS), path
        assert doc.metadata["title"].startswith("Cortex AI:"), path
        assert CORRESPONDENCE in compact and "emailtobeconfirmed" not in compact, path
        assert all(a in compact for a in VALUES), path
        assert re.search(r"(?im)^\s*references\s*$", text), path
        assert Counter(re.findall(CAPTION, text)) == Counter("123456"), path
        if "Goa" not in path.name:
            bib = re.split(r"(?im)^\s*references\s*$", text)[-1]
            labels = re.findall(r"(?m)^\s*(?:\[(\d+)\]|(\d+)\.)\s", bib)
            assert set(range(1, 21)) <= {int(a or b) for a, b in labels}, path
        result = {"pages": len(doc), "key_formula_tokens_verified": True, "figures": 6}
        if path.name.startswith("Cortex-"):
            fonts = Counter()
            for page in doc:
                assert len(page.get_image_info()) == len(
                    re.findall(CAPTION, page.get_text())
                ), path
                for image in page.get_image_info():
                    x0, _, x1, _ = image["bbox"]
                    assert image["width"] * 72 / (x1 - x0) >= 300, path
                for span in (
                    span
                    for block in page.get_text("dict", flags=pymupdf.TEXTFLAGS_TEXT)[
                        "blocks"
                    ]
                    for line in block.get("lines", [])
                    for span in line["spans"]
                ):
                    fonts[round(span["size"], 1)] += len(span["text"])
            result["dominant_font_size_pt"] = fonts.most_common(1)[0][0]
            if "Goa" in path.name:
                assert result["dominant_font_size_pt"] == 12.0
        return result


def inspect_docx(path):
    with ZipFile(path) as doc:
        tree = etree.fromstring(doc.read("word/document.xml"))
        text = " ".join(t.text or "" for t in tree.iter(W + "t"))
        assert all(a in text for a in AUTHORS) and CORRESPONDENCE in text, path
        assert "email to be confirmed" not in text, path
        if "IJSREM" in path.name:
            headings = re.findall(r"\b([IVX]+)\. [A-Z]{3,}", text)
            assert headings[:6] == ["I", "II", "III", "IV", "V", "VI"], path
            assert "TABLE I." in text and "Table I summarizes" in text, path
        formulae = [
            "".join(t.text or "" for t in m.iter(M + "t"))
            for m in tree.iter(M + "oMath")
        ]
        descriptions = [d.get("descr") for d in tree.iter(WP + "docPr")]
        entries = []
        for paragraph in tree.iter(W + "p"):
            style = paragraph.find(f"{W}pPr/{W}pStyle")
            if style is not None and style.get(W + "val") == "referenceitem":
                entries.append(paragraph)
        assert len(formulae) == 18 and len(entries) == 20, path
        assert len(descriptions) == 6 and all(descriptions), path
        assert any("SHA256" in m for m in formulae), path
        if "Goa" in path.name:
            surnames = []
            for entry in entries:
                numbering = entry.find(f"{W}pPr/{W}numPr/{W}numId")
                assert numbering is not None and numbering.get(W + "val") == "0", path
                label = "".join(t.text or "" for t in entry.iter(W + "t"))
                surnames.append(
                    unicodedata.normalize("NFKD", label.split(",")[0]).casefold()
                )
            assert surnames == sorted(surnames), path
        return {
            "native_omml_objects": len(formulae),
            "figures_with_alt_text": 6,
            "references": 20,
        }


def main():
    pdfs = sorted(EXPORT.glob("*/*.pdf"))
    docs = sorted(EXPORT.glob("*/*.docx"))
    assert len(pdfs) == 6 and len(docs) == 3
    result = {path.name: inspect_pdf(path) for path in pdfs}
    result.update({path.name: inspect_docx(path) for path in docs})
    (ROOT / "quality/editorial-export-checks.json").write_text(
        json.dumps(result, indent=2) + "\n"
    )
    files = [
        ROOT / "manuscript/paper.md",
        ROOT / "bibliography/references.bib",
        *pdfs,
        *docs,
    ]
    digests = {
        p.relative_to(ROOT).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
        for p in files
    }
    (ROOT / "quality/artifact-digests.json").write_text(
        json.dumps(digests, indent=2) + "\n"
    )
    print(json.dumps(result))


if __name__ == "__main__":
    main()
