"""Screen the draft against explicitly supplied local sources using exact word windows."""

import argparse
import json
import re
import unicodedata
from pathlib import Path

WINDOW = 8


def draft_prose(source):
    """Retain narrative and captions, excluding metadata, links, and citation keys."""
    header, body = source.split("---", 2)[1:]
    abstract = re.search(r"(?ms)^abstract: \|\n(.*?)^keywords:", header)[1].strip()
    body = re.sub(r"(?ms)^\$\$.*?^\$\$", "", body)
    body = re.sub(r"\[@[^\]]+\]", "", body)
    body = re.sub(r"!?\[([^\]]+)\]\([^)]+\)(?:\{[^}]+\})?", r"\1", body)
    return f"{abstract}\n\n{body.strip()}\n"


def windows(text):
    words = re.findall(r"[^\W_]+", unicodedata.normalize("NFKC", text).casefold())
    return {tuple(words[i : i + WINDOW]) for i in range(len(words) - WINDOW + 1)}


def load(path):
    if path.suffix.lower() == ".pdf":
        import pymupdf

        with pymupdf.open(path) as doc:
            return "\n".join(page.get_text() for page in doc)
    return path.read_text(encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("paper", type=Path)
    parser.add_argument("sources", type=Path, nargs="+")
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    draft = windows(draft_prose(args.paper.read_text(encoding="utf-8")))
    records = []
    for path in args.sources:
        source = windows(load(path))
        if not source:
            raise ValueError(f"No extractable text in {path.name}")
        matches = sorted(draft & source)
        records.append(
            {
                "source": path.name,
                "matches": len(matches),
                "matched_windows": [" ".join(words) for words in matches],
            }
        )
    result = {
        "consecutive_words": WINDOW,
        "document_count": len(records),
        "sources": records,
    }
    args.output.write_text(
        json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(json.dumps({r["source"]: r["matches"] for r in records}, ensure_ascii=False))


if __name__ == "__main__":
    main()
