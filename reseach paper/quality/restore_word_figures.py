"""Restore the original 350 dpi technical PNGs after Word downsamples them."""

import argparse
import re
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parents[1]
CAPTION = re.compile(r"\bFig\.\s+([1-6])\.\s")


def restore(path):
    replacement = path.with_suffix(".print.pdf")
    with pymupdf.open(path) as pdf:
        found = []
        for page in pdf:
            figures = page.get_image_info(xrefs=True)
            captions = CAPTION.findall(page.get_text())
            if len(figures) != len(captions):
                raise ValueError(f"Unmatched figure images on page {page.number + 1}")
            for figure, number in zip(figures, captions, strict=True):
                original = ROOT / f"figures/rendered/fig{number}.png"
                page.replace_image(figure["xref"], filename=str(original))
                found.append(number)
        if found != list("123456"):
            raise ValueError(f"Expected six ordered captions, found {found}")
        pdf.save(replacement, garbage=4, deflate=True)
    replacement.replace(path)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("proofs", type=Path, nargs="+")
    for proof in parser.parse_args().proofs:
        restore(proof)
