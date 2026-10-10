"""Build curated fictional originals and a manifest; existing fixtures never change."""
import hashlib
import io
import json
import re
import textwrap
from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt
from pypdf import PdfWriter
from pypdf.generic import DictionaryObject, NameObject, DecodedStreamObject

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "originals"
OUT.mkdir(exist_ok=True)


def docx_bytes(text):
    doc = Document()
    section = doc.sections[0]
    section.page_width, section.page_height = Inches(8.27), Inches(11.69)
    section.top_margin = section.bottom_margin = Inches(.8)
    doc.styles["Normal"].font.name = "Calibri"
    doc.styles["Normal"].font.size = Pt(11)
    lines = text.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        if " | " in line and i > 5:
            rows = []
            while i < len(lines) and " | " in lines[i]:
                rows.append(lines[i].split(" | ")); i += 1
            table = doc.add_table(rows=0, cols=len(rows[0]), style="Light Shading Accent 1")
            for row in rows:
                for cell, value in zip(table.add_row().cells, row, strict=True):
                    cell.text = value
            continue
        if i == 0:
            doc.add_heading(line, 0)
        elif re.match(r"^\d+\. ", line):
            doc.add_heading(line, 1)
        else:
            doc.add_paragraph(line)
        i += 1
    doc.core_properties.author = "Northstar Works - synthetic demonstration"
    buffer = io.BytesIO(); doc.save(buffer)
    return buffer.getvalue()


def pdf_bytes(text):
    writer = PdfWriter()
    fonts = {}
    for name, base in [("F1", "Times-Roman"), ("F2", "Helvetica-Bold")]:
        fonts[NameObject('/'+name)] = writer._add_object(DictionaryObject({NameObject('/Type'): NameObject('/Font'), NameObject('/Subtype'): NameObject('/Type1'), NameObject('/BaseFont'): NameObject('/'+base)}))
    page_lines = [[]]
    for index, line in enumerate(text.splitlines()):
        heading = bool(index == 0 or re.match(r"^\d+\. ", line))
        for value in textwrap.wrap(line, width=80 if heading else 94) or [""]:
            if len(page_lines[-1]) >= 46: page_lines.append([])
            page_lines[-1].append((value, heading))
    for number, lines in enumerate(page_lines, 1):
        page = writer.add_blank_page(width=595.28, height=841.89)
        page[NameObject('/Resources')] = DictionaryObject({NameObject('/Font'): DictionaryObject(fonts)})
        commands = ["0.09 0.24 0.19 rg"]
        y = 760
        for value, heading in lines:
            safe = value.replace('\\','\\\\').replace('(','\\(').replace(')','\\)')
            commands.append(f"BT /{'F2' if heading else 'F1'} {12 if heading else 11} Tf 48 {y} Td ({safe}) Tj ET")
            y -= 15
        commands.append(f"BT /F1 9 Tf 48 38 Td (Northstar Works - Restricted synthetic document | Page {number} of {len(page_lines)}) Tj ET")
        stream = DecodedStreamObject(); stream.set_data('\n'.join(commands).encode('ascii'))
        page[NameObject('/Contents')] = writer._add_object(stream)
    writer.add_metadata({"/Title": "Northstar information handling - fictional", "/Author": "Northstar Works synthetic demonstration"})
    buffer=io.BytesIO(); writer.write(buffer); return buffer.getvalue()


manifest = []
hr = (ROOT/'source/hr-leave.txt').read_text(encoding='utf-8')
remote = (ROOT/'source/remote-work.txt').read_text(encoding='utf-8')
old = hr.replace('HR-AL-2026','HR-AL-2025').replace('Edition 2.0','Edition 1.0').replace('Published: 15 December 2025 | Effective: 1 January 2026 to 1 January 2027','Published: 15 December 2024 | Effective: 1 January 2025 to 1 January 2026').replace('employees receive 20','employees receive 18')
old = old.replace('2.0 | 1 January 2026 to 1 January 2027 | Allocation updated to 20 working days; clearer coverage controls\n','')
old = old.replace('This edition does not imply that the later 2027 value is already effective.', 'A future proposal does not amend the allocation in this archived edition.')
for did, vid, title, category, text, kind, value, topic, start, end, restricted in [
    ('ENT-LEAVE','ENT-LEAVE-2025','Annual Leave and Absence Standard','hr',old,'txt',18,'leave','2025-01-01','2026-01-01',False),
    ('ENT-LEAVE','ENT-LEAVE-2026','Annual Leave and Absence Standard','hr',hr,'docx',20,'leave','2026-01-01','2027-01-01',False),
    ('ENT-REMOTE-A','ENT-REMOTE-A-2026','Distributed Work Standard A','operations',remote,'txt',2,'remote_work','2026-01-01',None,False),
    ('ENT-REMOTE-B','ENT-REMOTE-B-2026','Distributed Work Standard B','operations',remote.replace('Standard A','Standard B').replace('OPS-DW-A','OPS-DW-B').replace('remotely 2 days','remotely 3 days'),'docx',3,'remote_work','2026-01-01',None,False),
    ('ENT-INCIDENT','ENT-INCIDENT-3.1','Service Incident Response SOP','sop',(ROOT/'source/incident-sop.txt').read_text(),'docx',None,None,None,None,False),
    ('ENT-LEGAL','ENT-LEGAL-2.2','Information Handling and Supplier Confidentiality','legal',(ROOT/'source/legal-data.txt').read_text(),'pdf',None,None,None,None,True),
    ('ENT-SUPPLIER','ENT-SUPPLIER-1.4','Supplier Onboarding and Purchase Control','sop',(ROOT/'source/procurement.txt').read_text(),'txt',None,None,None,None,False),
]:
    payload = docx_bytes(text) if kind=='docx' else pdf_bytes(text) if kind=='pdf' else text.encode('utf-8')
    name=f'{vid}.{kind}'; (OUT/name).write_bytes(payload)
    manifest.append(dict(document_id=did,version_id=vid,title=title,category=category,file='originals/'+name,sha256=hashlib.sha256(payload).hexdigest(),value=value,topic=topic,valid_from=start,valid_to=end,restricted=restricted,word_count=len(text.split())))
(ROOT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf-8')
print(f'Built {len(manifest)} fictional original files. {sum(d["word_count"] for d in manifest)} source words across versions.')
