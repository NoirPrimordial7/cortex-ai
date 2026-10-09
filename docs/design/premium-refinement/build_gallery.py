"""Copy unmodified real-browser captures and build the Ask review gallery."""
from pathlib import Path
from shutil import copyfile
import json

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent
states = {"ask-empty": "Start a question", "ask-answer": "Supported answer", "ask-conflict": "Conflicting policies", "evidence": "Mobile evidence view"}
widths = [320, 390, 768, 1024, 1280, 1440]
items = []
for theme in ["light", "dark"]:
    suffix = "-dark" if theme == "dark" else ""
    for state, label in states.items():
        for width in widths:
            before = ROOT / f"outputs/product-audit/premium-before{suffix}/maya/{state}-{width}.png"
            after = ROOT / f"outputs/product-audit/premium-after{suffix}/maya/{state}-{width}.png"
            if not before.exists() or not after.exists():
                continue
            pair = {"state": state, "label": label, "width": width, "theme": theme}
            for phase, source in [("before", before), ("after", after)]:
                relative = f"{phase}/maya-{state}-{width}{suffix}.png"
                (OUT / phase).mkdir(exist_ok=True)
                copyfile(source, OUT / relative)
                pair[phase] = relative
            items.append(pair)
(OUT / "captures.json").write_text(json.dumps(items, indent=2), encoding="utf-8")
template = """<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cortex · Ask pilot review</title>
<style>
:root{font:16px/1.5 system-ui;color:#173d30;background:#f7f6ef}*{box-sizing:border-box}body{margin:0;padding:24px}main{max-width:1540px;margin:auto}h1{font:500 36px/1.2 Georgia;margin:0 0 12px}p{max-width:80ch}a{color:inherit}nav{display:flex;flex-wrap:wrap;gap:16px;margin:24px 0}label{display:grid;gap:6px}select{font:inherit;min-height:44px;padding:8px;border:1px solid #7b8b7c;background:#fffef9;color:#173d30;border-radius:6px}section{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start}figure{margin:0;min-width:0}figcaption{padding:12px 0;font-weight:600}.frame{background:#edf0e5;padding:8px;min-width:0}img{display:block;max-width:100%;height:auto;margin:auto}footer{margin:32px 0;font-size:14px;color:#58675d}:focus-visible{outline:3px solid #173d30;outline-offset:3px}@media(max-width:700px){body{padding:16px}section{grid-template-columns:1fr}h1{font-size:28px}}
</style>
<main><h1>Ask Cortex, refined.</h1><p>Real before-and-after captures of the running application, using the same employee profile, policy date and source data. Keep the approved forest and ivory identity; make the question, answer and evidence easier to use.</p>
<p><a href="AUDIT.md">Full route audit</a> · <a href="REFERENCES.md">Awwwards references & reviewed skills</a> · <a href="README.md">Changes, tests & performance</a> · <a href="http://127.0.0.1:5173/assistant">Try the local pilot</a></p>
<nav aria-label="Capture selection"><label>Screen<select id="screen"></select></label><label>Viewport<select id="width"></select></label><label>Theme<select id="theme"><option value="light">Light</option><option value="dark">Dark</option></select></label></nav>
<p id="context" role="status"></p><section aria-label="Before and after"><figure><figcaption>Before · released baseline a3c3a314</figcaption><div class="frame"><a id="before-link"><img id="before" alt=""></a></div></figure><figure><figcaption>After · feature branch pilot</figcaption><div class="frame"><a id="after-link"><img id="after" alt=""></a></div></figure></section>
<footer>Original PNGs are unmodified. Open a capture for its full resolution. Phone evidence captures show the actual dedicated modal viewport; other captures contain the full page. The UI test scenarios for exceptionally long answers and revoked sources use explicit fixtures and are documented separately; the comparisons above use the real backend. Production remains unchanged pending review. Desktop emulation does not certify a physical phone keyboard or notch.</footer></main>
<script>
const captures=__CAPTURES__, screen=document.querySelector('#screen'), width=document.querySelector('#width'), theme=document.querySelector('#theme');
for(const [value,label] of Object.entries(__STATES__)){screen.add(new Option(label,value))}
screen.value='ask-answer';
function updateWidths(){const old=width.value; width.replaceChildren();for(const n of [...new Set(captures.filter(c=>c.state===screen.value).map(c=>c.width))])width.add(new Option(`${n}px`,String(n)));width.value=[...width.options].some(o=>o.value===old)?old:'390'}
function show(){const c=captures.find(c=>c.state===screen.value&&c.width===Number(width.value)&&c.theme===theme.value);for(const phase of ['before','after']){const img=document.querySelector(`#${phase}`);img.src=c[phase];img.alt=`${phase==='before'?'Before':'After'}: ${c.label}, ${c.width}px, ${c.theme} theme`;img.style.width=`${c.width}px`;document.querySelector(`#${phase}-link`).href=c[phase]}document.querySelector('#context').textContent=`${c.label} · ${c.width}px · ${c.theme} · real backend · 10 Oct 2026`;const params=new URLSearchParams({screen:screen.value,width:width.value,theme:theme.value});history.replaceState(null,'',`?${params}`)}
const params=new URLSearchParams(location.search);if([...screen.options].some(o=>o.value===params.get('screen')))screen.value=params.get('screen');updateWidths();if([...width.options].some(o=>o.value===params.get('width')))width.value=params.get('width');if(params.get('theme')==='dark')theme.value='dark';screen.onchange=()=>{updateWidths();show()};width.onchange=theme.onchange=show;show();
</script></html>"""
(OUT / "gallery.html").write_text(template.replace("__CAPTURES__", json.dumps(items)).replace("__STATES__", json.dumps(states)), encoding="utf-8")
print(f"Built {len(items)} before/after pairs from unmodified actual screenshots.")
