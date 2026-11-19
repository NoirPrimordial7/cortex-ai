"""Build the LaTeX and Word manuscripts from paper.md using vendor templates."""

import argparse
import re
import shutil
import subprocess
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

import yaml
from lxml import etree

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
VENDOR = ROOT / "templates"
EXPORT = ROOT / "exports"
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
WP = "{http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing}"


def run(*command):
    subprocess.run([str(arg) for arg in command], cwd=HERE, check=True)


def transform_package(src, dest, transform):
    with ZipFile(src) as original, ZipFile(dest, "w", ZIP_DEFLATED) as result:
        for entry in original.namelist():
            if "vba" in entry.lower():
                continue
            data = transform(entry, original.read(entry))
            if data is not None:
                result.writestr(entry, data)


def word_reference():
    def transform(entry, data):
        if entry in {"[Content_Types].xml", "word/_rels/document.xml.rels"}:
            doc = etree.fromstring(data)
            for child in list(doc):
                if "vba" in str(dict(child.attrib)).lower():
                    doc.remove(child)
                elif (
                    child.get("ContentType")
                    == "application/vnd.ms-word.document.macroEnabled.main+xml"
                ):
                    child.set(
                        "ContentType",
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml",
                    )
            return etree.tostring(doc)
        return data

    ref = VENDOR / "springer-reference.docx"
    transform_package(VENDOR / "springer-word/splnproc2510.docm", ref, transform)
    return ref


def word_layout(entry, data):
    if entry != "word/document.xml":
        return data
    doc = etree.fromstring(data)
    body = doc.find(f"{W}body")
    styles = {
        "Title": "papertitle",
        "Author": "author",
        "Heading1": "heading1",
        "Heading2": "heading2",
        "Heading3": "heading3",
        "heading 1": "heading1",
        "heading 2": "heading2",
        "FirstParagraph": "p1a",
        "BodyText": "Normal",
        "ImageCaption": "figurecaption",
        "Caption": "figurecaption",
        "TableCaption": "tablecaption",
        "Bibliography": "referenceitem",
    }

    def style_for(p, style):
        ppr = p.find(f"{W}pPr")
        if ppr is None:
            ppr = etree.Element(f"{W}pPr")
            p.insert(0, ppr)
        pstyle = ppr.find(f"{W}pStyle")
        if pstyle is None:
            pstyle = etree.Element(f"{W}pStyle")
            ppr.insert(0, pstyle)
        pstyle.set(f"{W}val", style)

    def strip_generated_number(p):
        first = next(p.iter(f"{W}t"), None)
        if first is not None:
            first.text = re.sub(r"^\d+\.\s*", "", first.text or "")
        tab = next(p.iter(f"{W}tab"), None)
        if tab is not None:
            tab.getparent().remove(tab)

    number = 0
    table_number = 0
    for p in body.iter(f"{W}p"):
        pstyle = p.find(f"{W}pPr/{W}pStyle")
        old = pstyle.get(f"{W}val") if pstyle is not None else ""
        text = "".join(node.text or "" for node in p.iter(f"{W}t"))
        # Pandoc does not use publisher-specific front-matter style names.
        for prefix, name in [
            ("AFFILIATIONMARK ", "address"),
            ("CORRESPONDENCEMARK ", "e-mail"),
            ("Abstract. ", "abstract"),
            ("Keywords. ", "keywords"),
        ]:
            if text.startswith(prefix):
                style_for(p, name)
                if prefix.endswith("MARK "):
                    remaining = len(prefix)
                    for node in p.iter(f"{W}t"):
                        content = node.text or ""
                        discard = min(remaining, len(content))
                        node.text = content[discard:]
                        remaining -= discard
                        if not remaining:
                            break
                break
        if old in styles:
            style_for(p, styles[old])
        if p.find(f".//{WP}inline") is not None:
            style_for(p, "image")
            properties = p.find(f"{W}pPr")
            if properties.find(f"{W}keepNext") is None:
                properties.insert(1, etree.Element(f"{W}keepNext"))

        def insert_label(p, label):
            run = etree.Element(f"{W}r")
            txt = etree.SubElement(run, f"{W}t")
            txt.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
            txt.text = label
            p.insert(1, run)

        if old == "ImageCaption":
            number += 1
            insert_label(p, f"Fig. {number}. ")
        if old == "TableCaption":
            table_number += 1
            insert_label(p, f"Table {table_number}. ")
        if old == "Bibliography":
            strip_generated_number(p)
        if old in {"Heading1", "heading 1"} and text == "References":
            style_for(p, "referencelist")

    # Avoid instructions in empty imported sample header/footer links.
    for child in body.findall(f"{W}sectPr"):
        for tag in ("headerReference", "footerReference"):
            for ref in child.findall(f"{W}{tag}"):
                child.remove(ref)
    return etree.tostring(doc)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--pandoc", required=True)
    parser.add_argument("--tectonic")
    args = parser.parse_args()
    draft = HERE / "paper.md"
    text = draft.read_text(encoding="utf-8")
    if re.search(r"@@[A-Z_]+@@", text):
        raise ValueError("Resolve all experimental data tokens before building.")
    _, header, body = text.split("---", 2)
    meta = yaml.safe_load(header)
    for source, name in [
        (VENDOR / "springer-latex/llncs.cls", "llncs.cls"),
        (VENDOR / "springer-latex/splncs04.bst", "splncs04.bst"),
        (VENDOR / "IEEEtran.cls", "IEEEtran.cls"),
        (VENDOR / "IEEEtran.bst", "IEEEtran.bst"),
    ]:
        shutil.copyfile(source, HERE / name)
    build = HERE / "_build"
    build.mkdir(exist_ok=True)
    bibliography = ROOT / "bibliography/references.bib"
    for template in ("springer", "ieee", "academic"):
        target = HERE / f"cortex-{template}.tex"
        run(
            args.pandoc,
            draft,
            "--from=markdown+implicit_figures",
            "--standalone",
            "--to=latex",
            "--natbib",
            "--ascii",
            "--bibliography",
            bibliography,
            "--lua-filter",
            HERE / "layout.lua",
            "--template",
            HERE / f"{template}.template.tex",
            "-o",
            target,
        )
        if args.tectonic:
            run(args.tectonic, "--keep-logs", "--outdir", EXPORT, target.name)

    front = (
        f"---\ntitle: {yaml.safe_dump(meta['title'], default_flow_style=True, width=1000).splitlines()[0]}\n"
        f'author: "{", ".join(meta["author"])}"\n---\n\n'
        f"AFFILIATIONMARK {meta['institute']}\n\n"
        f"CORRESPONDENCEMARK {meta['correspondence']}\n\n"
        f"**Abstract.** {meta['abstract'].strip()}\n\n"
        f"**Keywords.** {meta['keywords']}\n\n"
    )
    word_input = build / "word.md"
    word_input.write_text(
        front + body + "\n\n# References {.unnumbered}\n", encoding="utf-8"
    )
    raw_word = build / "springer-unmapped.docx"
    run(
        args.pandoc,
        word_input,
        "--from=markdown+implicit_figures",
        "--to=docx",
        "--resource-path",
        HERE,
        "--reference-doc",
        word_reference(),
        "--bibliography",
        bibliography,
        "--csl",
        VENDOR / "springer-lncs.csl",
        "--citeproc",
        "-o",
        raw_word,
    )
    transform_package(raw_word, EXPORT / "Cortex-SMARTCOM-editable.docx", word_layout)


if __name__ == "__main__":
    main()
