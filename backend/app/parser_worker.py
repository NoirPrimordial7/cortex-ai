"""Bounded parser child. Accepts a server-created local path; never fetches URLs."""

import json
import sys
from pathlib import Path
from zipfile import ZipFile, BadZipFile

MAX_TEXT = 2 * 1024 * 1024


def extract(path):
    suffix = path.suffix.lower()
    segments = []
    parts = []
    size = 0

    def add(value, locator):
        nonlocal size
        if not value.strip():
            return
        end = size + len(value)
        if end > MAX_TEXT:
            raise ValueError("TEXT_TOO_LARGE")
        parts.append(value)
        segments.append({"start": size, "end": end, "locator": locator})
        size = end

    if suffix == ".txt":
        value = path.read_bytes().decode("utf-8", errors="strict")
        if "\x00" in value:
            raise ValueError("UNSUPPORTED_TEXT")
        # Preserve bytes' decoded character offsets, including existing newlines.
        for i, line in enumerate(value.splitlines(keepends=True), 1):
            end = size + len(line)
            if end > MAX_TEXT:
                raise ValueError("TEXT_TOO_LARGE")
            parts.append(line)
            segments.append({"start": size, "end": end, "locator": f"TXT line {i}"})
            size = end
    elif suffix == ".pdf":
        from pypdf import PdfReader

        if not path.read_bytes().startswith(b"%PDF-"):
            raise ValueError("FORMAT_MISMATCH")
        reader = PdfReader(path)
        if reader.is_encrypted or len(reader.pages) > 200:
            raise ValueError("UNSUPPORTED_PDF")
        for i, page in enumerate(reader.pages, 1):
            add((page.extract_text() or "") + "\n", f"PDF page {i}")
    elif suffix == ".docx":
        from docx import Document
        from docx.text.paragraph import Paragraph

        try:
            with ZipFile(path) as archive:
                entries = archive.infolist()
                if len(entries) > 1000 or sum(i.file_size for i in entries) > 50 * 1024 * 1024:
                    raise ValueError("ARCHIVE_LIMIT")
                if any(
                    "vbaProject" in i.filename or ".." in Path(i.filename).parts for i in entries
                ):
                    raise ValueError("UNSUPPORTED_ARCHIVE")
                if "word/document.xml" not in archive.namelist():
                    raise ValueError("FORMAT_MISMATCH")
        except BadZipFile:
            raise ValueError("FORMAT_MISMATCH") from None
        doc = Document(path)
        paragraph_no = table_no = 0
        for block in doc.iter_inner_content():
            if isinstance(block, Paragraph):
                paragraph_no += 1
                add(block.text + "\n", f"DOCX paragraph {paragraph_no}")
            else:
                table_no += 1
                for j, row in enumerate(block.rows, 1):
                    add(
                        " | ".join(cell.text for cell in row.cells) + "\n",
                        f"DOCX table {table_no} row {j}",
                    )
    else:
        raise ValueError("UNSUPPORTED_FORMAT")
    content = "".join(parts)
    if not content.strip():
        raise ValueError("NO_EXTRACTABLE_TEXT")
    return {"text": content, "segments": segments}


if __name__ == "__main__":
    try:
        result = extract(Path(sys.argv[1]))
    except Exception:
        # Parser diagnostics cannot return document data or filesystem paths.
        result = {"error": "EXTRACTION_FAILED_OR_UNSUPPORTED"}
    print(json.dumps(result, ensure_ascii=True))
