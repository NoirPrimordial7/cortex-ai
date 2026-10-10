"""Index genuine PNG captures without changing any pixels."""

import hashlib
import json
import struct
from pathlib import Path

root = Path(__file__).resolve().parent
captures = []
for path in sorted(root.glob("*.png")):
    raw = path.read_bytes()
    width, height = struct.unpack(">II", raw[16:24])
    captures.append(
        {
            "file": path.name,
            "width": width,
            "height": height,
            "sha256": hashlib.sha256(raw).hexdigest(),
        }
    )
(root / "captures.json").write_text(
    json.dumps(captures, indent=2) + "\n", encoding="utf-8"
)
html = """<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Cortex · document reader and conflict review</title>
<style>*{box-sizing:border-box}body{margin:0;background:#f7f6ef;color:#173d30;font:16px/1.5 system-ui,sans-serif}header{padding:24px 32px;background:#173d30;color:#fffef9}h1{margin:0;font:32px Georgia,serif}p{max-width:100ch}a{color:inherit}main{padding:24px 32px}.controls{display:flex;gap:20px;flex-wrap:wrap;margin-bottom:24px}label{display:grid;gap:6px;min-width:0;max-width:100%}select{width:100%;min-width:0;max-width:100%;font:inherit;padding:10px;background:#fffef9;color:#173d30;border:1px solid #7b8b7c;border-radius:6px;min-height:44px}select:focus-visible,a:focus-visible{outline:3px solid #173d30;outline-offset:4px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start}figure{margin:0;min-width:0}figcaption{margin-bottom:12px}img{display:block;width:100%;height:auto;border:1px solid #d4dacf}.mobile img{max-width:390px;margin:auto}section{margin-bottom:40px}h2{font:24px Georgia,serif}@media(max-width:600px){header,main{padding:20px 16px}.pair{grid-template-columns:1fr}}</style>
<header><h1>Cortex · document reading and conflict review</h1><p>Genuine local Chromium screenshots. Approved forest and ivory direction retained. Draft PR #8; release approval pending.</p></header><main><div class="controls">
<label>View<select id="view"><option value="fullscreen">Complete document reader</option><option value="full-evidence">Complete reader · exact evidence</option><option value="evidence">Focused source context</option><option value="document">Document Details · typeset text</option><option value="baseline-conflicts">Conflicts · same five events before / after</option><option value="conflicts">Conflicts · richer enterprise corpus</option><option value="original-pdf">Original PDF page rendering</option></select></label>
<label>Viewport<select id="width"><option value="all">1440, 390 and 320</option><option>1440</option><option>390</option><option>320</option><option>1280</option><option>768</option></select></label><label>Theme<select id="theme"><option value="both">Both themes</option><option>light</option><option>dark</option></select></label></div><p id="status" role="status"></p><div id="captures"></div>
<p>70 untouched PNGs. Complete-reader dialogs are actual 900px-high viewport screenshots; ordinary routes use full-page capture. Reflowed reading pages are explicitly distinguished from original file pages. Original PDF images retain the actual source layout; citation highlights appear in extracted text.</p>
<p>Before / after conflict comparison uses the same five historical events and the same two short policies. Enterprise captures use the new fictional corpus and four authorized conflicting claims; they are separate scenarios.</p><p><a href="README.md">Implementation, tests and limitations</a> · <a href="captures.json">Original dimensions and hashes</a> · <a href="http://127.0.0.1:8008/documents/ENT-LEAVE">Open the local document reader</a></p></main>
<script>const view=document.getElementById('view'),width=document.getElementById('width'),theme=document.getElementById('theme');function update(){const widths=width.value==='all'?[1440,390,320]:[Number(width.value)],themes=theme.value==='both'?['light','dark']:[theme.value],container=document.getElementById('captures');container.replaceChildren();for(const t of themes)for(const w of widths){const section=document.createElement('section'),heading=document.createElement('h2'),pair=document.createElement('div');heading.textContent=view.options[view.selectedIndex].text+' · '+w+'px · '+t;section.append(heading);pair.className=(view.value==='baseline-conflicts'?'pair':'')+(w<1100?' mobile':'');const paths=view.value==='baseline-conflicts'?[['Before · approved rollout','../rollout/after/'+t+'-conflicts-'+w+'.png'],['After · grouped occurrences',t+'-baseline-conflicts-'+w+'.png']]:[['New reader / focused refinement',t+'-'+view.value+'-'+w+'.png']];for(const [label,path] of paths){const figure=document.createElement('figure'),caption=document.createElement('figcaption'),link=document.createElement('a'),img=document.createElement('img');caption.textContent=label;link.href=path;link.target='_blank';link.rel='noopener';img.src=path;img.loading='lazy';img.alt=heading.textContent+' · '+label;link.append(img);figure.append(caption,link);pair.append(figure);}section.append(pair);container.append(section);}document.getElementById('status').textContent=(widths.length*themes.length)+' screenshot scenarios shown. Click a capture for original pixels.';}for(const control of [view,width,theme])control.addEventListener('change',update);update();</script></html>"""
(root / "gallery.html").write_text(html, encoding="utf-8")
print(f"Indexed {len(captures)} unmodified browser captures.")
