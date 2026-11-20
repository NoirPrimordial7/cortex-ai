"""Apply the IJSREM author guidelines to the shared Pandoc Word export."""

import re
from copy import deepcopy

from lxml import etree

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
M = "{http://schemas.openxmlformats.org/officeDocument/2006/math}"
WP = "{http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing}"
ROMAN = ("I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII")


def journal_manuscript(body):
    """Group existing headings under the journal's IMRaD outline."""
    body = body.replace("width=89%", "width=84%").replace("Table 1", "Table I")
    body = body.replace("# Related Work\n", "# Literature Review\n")
    start = body.index("# Problem Definition")
    stop = body.index("# Results", start)
    methods = re.sub(r"(?m)^#", "##", body[start:stop])
    methods = methods.replace("## Methodology\n", "## Policy decision method\n")
    body = body[:start] + "# Methodology\n\n" + methods + body[stop:]
    return body.replace("# Threats to Validity", "## Threats to Validity")


def element(parent, name, **attributes):
    tag = W + name
    node = parent.find(tag)
    if node is None:
        node = etree.SubElement(parent, tag)
    for key, value in attributes.items():
        node.set(W + key, str(value))
    return node


def journal_styles(data):
    doc = etree.fromstring(data)
    specifications = {
        "papertitle": (16, "center", True, False),
        "author": (11, "center", False, False),
        "address": (10, "center", False, True),
        "e-mail": (9, "center", False, False),
        "abstract": (11, "left", True, False),
        "keywords": (11, "left", True, False),
        "heading1": (11, "center", True, False),
        "heading2": (11, "left", False, True),
        "heading3": (11, "left", False, True),
        "image": (11, "center", False, False),
        "figurecaption": (8, "center", False, False),
        "tablecaption": (8, "center", False, False),
        "referenceitem": (8, "left", False, False),
        "referencelist": (11, "center", True, False),
    }
    paragraph_styles = (
        s for s in doc.findall(W + "style") if s.get(W + "type") == "paragraph"
    )
    for style in paragraph_styles:
        name = style.get(W + "styleId")
        size, align, bold, italic = specifications.get(name, (11, "left", False, False))
        properties = element(style, "pPr")
        run = element(style, "rPr")
        element(
            run,
            "rFonts",
            ascii="Times New Roman",
            hAnsi="Times New Roman",
            cs="Times New Roman",
        )
        element(run, "sz", val=size * 2)
        element(run, "szCs", val=size * 2)
        element(run, "b", val=int(bold))
        element(run, "i", val=int(italic))
        element(properties, "jc", val=align)
        element(properties, "spacing", line="240", lineRule="auto", after="75")
        if name in {"heading1", "heading2", "heading3"}:
            element(element(properties, "numPr"), "numId", val="0")
            element(properties, "ind", left="0", right="0", firstLine="0")
        if name == "tablecaption":
            element(properties, "keepNext")
        if name in {
            "papertitle",
            "author",
            "address",
            "e-mail",
            "abstract",
            "keywords",
        }:
            element(properties, "suppressAutoHyphens")
            element(properties, "ind", left="0", right="0", firstLine="0")
            element(properties, "spacing", before="0")
        if name == "referenceitem":
            element(properties, "ind", left="260", hanging="260")
    return etree.tostring(doc)


def text_run(paragraph, value):
    run = etree.SubElement(paragraph, W + "r")
    text = etree.SubElement(run, W + "t")
    text.set("{http://www.w3.org/XML/1998/namespace}space", "preserve")
    text.text = value
    return run


def journal_document(data):
    doc = etree.fromstring(data)
    body = doc.find(W + "body")
    section = body.find(W + "sectPr")
    element(section, "pgSz", w="11906", h="16838")
    element(section, "pgMar", top="1440", bottom="1440", left="1440", right="1440")
    element(section, "type", val="continuous")
    element(section, "cols", num="2", space="288")

    def break_before(paragraph, columns):
        boundary = etree.Element(W + "p")
        paragraph.addprevious(boundary)
        close = deepcopy(section)
        element(close, "cols", num=columns, space="288")
        element(boundary, "pPr").append(close)

    def break_after(paragraph, columns):
        following = paragraph.getnext()
        if following is not None:
            break_before(following, columns)

    level1 = level2 = level3 = formula = table = citation = 0
    for p in list(body.findall(W + "p")):
        style = p.find(f"{W}pPr/{W}pStyle")
        name = style.get(W + "val") if style is not None else ""
        tokens = list(p.iter(W + "t"))
        if name == "keywords":
            break_after(p, 1)
        if name == "e-mail":
            element(p.find(W + "pPr"), "jc", val="center")
        if name in {"heading1", "heading2", "heading3"}:
            element(element(p.find(W + "pPr"), "numPr"), "numId", val="0")
            for tab in p.findall(f".//{W}tab"):
                tab.getparent().remove(tab)
        if name == "heading1":
            level1 += 1
            level2 = level3 = 0
            tokens[0].text = f"{ROMAN[level1 - 1]}. " + tokens[0].text.upper()
            for token in tokens[1:]:
                token.text = token.text.upper()
        elif name == "heading2":
            level2 += 1
            level3 = 0
            tokens[0].text = f"{chr(64 + level2)}. " + tokens[0].text
        elif name == "heading3":
            level3 += 1
            tokens[0].text = f"{level3}) " + tokens[0].text
        elif name == "image":
            break_before(p, 2)
            drawing = p.find(f".//{WP}inline")
            extent = drawing.find(WP + "extent")
            # Keep the diagram at or below its 5-inch native vector width.
            cx = min(int(extent.get("cx")), 4_572_000)
            cy = round(int(extent.get("cy")) * cx / int(extent.get("cx")))
            extent.set("cx", str(cx))
            extent.set("cy", str(cy))
            for transform in drawing.findall(
                ".//{http://schemas.openxmlformats.org/drawingml/2006/main}xfrm/"
                "{http://schemas.openxmlformats.org/drawingml/2006/main}ext"
            ):
                transform.set("cx", str(cx))
                transform.set("cy", str(cy))
        elif name == "figurecaption":
            break_after(p, 1)
        elif name == "tablecaption":
            table += 1
            tokens[0].text = f"TABLE {ROMAN[table - 1]}. "
            for token in tokens[1:]:
                token.text = token.text.upper()
            break_before(p, 2)
            table_node = p.getnext()
            if table_node is not None and table_node.tag == W + "tbl":
                break_after(table_node, 1)
                props = table_node.find(W + "tblPr")
                element(props, "jc", val="center")
                borders = element(props, "tblBorders")
                for side in ("top", "bottom", "insideH"):
                    element(borders, side, val="single", sz="4", color="6a6a6a")
                for side in ("left", "right", "insideV"):
                    element(borders, side, val="nil")
        elif name == "referencelist":
            tokens[0].text = "REFERENCES"
        elif name == "referenceitem":
            citation += 1
            properties = p.find(W + "pPr")
            element(element(properties, "numPr"), "numId", val="0")
            if tokens and tokens[0].text and tokens[0].text.strip().startswith("["):
                # Citeproc supplies the IEEE numeric prefix when it is plain text.
                continue
            p.insert(1, text_run(p, f"[{citation}] "))
        elif p.find(M + "oMathPara") is not None:
            formula += 1
            # A full measure keeps the eligibility predicate on one line.
            break_before(p, 2)
            break_after(p, 1)
            properties = element(p, "pPr")
            p.insert(0, properties)
            element(properties, "jc", val="left")
            element(element(properties, "tabs"), "tab", val="right", pos="9026")
            math_paragraph = p.find(M + "oMathPara")
            p.replace(math_paragraph, math_paragraph.find(M + "oMath"))
            etree.SubElement(etree.SubElement(p, W + "r"), W + "tab")
            text_run(p, f"({formula})")
    return etree.tostring(doc)
