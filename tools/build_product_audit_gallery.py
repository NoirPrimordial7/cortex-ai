"""Build a review gallery from real Playwright captures; requires Pillow.

Run from repository root. Originals remain in ignored outputs/product-audit.
Only screenshot JPEGs and sanitized measurements are copied into documentation.
"""
import json
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "outputs/product-audit"
DEST = ROOT / "docs/design/product-audit"
NOTES = {
    "login": "Shared identity, compact fictional profile picker, labeled form and service/session retry states.",
    "origin-denied": "Actual isolated backend403 for an intentionally unapproved exact origin. Clear explanation and approved published-demo link; no authentication bypass.",
    "overview": "Ask and permitted documents lead. Real counts and distinctive recent answers replace oversized statistics.",
    "library": "Search, category and sort controls; compact phone rows. Approval/effective metadata stays in version detail because this API supplies summaries.",
    "document": "Selected current version and reading lead; secondary history, uploads and integrity are disclosed on demand.",
    "review": "Focused approval dialog; exact passage and manually reviewed claims, dates and uniform-access confirmation remain required.",
    "upload": "Source selection precedes metadata; filename, format, size and review-before-publish guidance are visible.",
    "ask-empty": "Closed empty inspector, shared shell and natural phone scrolling.",
    "ask-answer": "Smaller answer, compact citation, one detailed inspector and reachable follow-up composer.",
    "evidence": "Dedicated mobile evidence view with Back action and focus restoration; one exact authorized passage.",
    "ask-conflict": "Explicit abstention and separate competing citations. Scrolled desktop full-page captures place the sticky composer at its natural end position.",
    "activity": "Compact history disclosures retain every request; current access is checked before showing source passages.",
    "conflicts": "Dedicated conflict cards with an explicit comparison action.",
    "conflict-comparison": "New detailed comparison: two columns on desktop, sequential evidence on mobile, no invented winner.",
    "people": "Compact people table/phone cards, action roles and one focused editor per person.",
    "person-edit": "New focused person editor. Preparing this screenshot changes no account permissions.",
    "access-change-review": "New pending-change summary. The captured fictional disable proposal was cancelled; no permission mutation occurred.",
    "grants": "Selected-document grants, human names, readable grouping and explicit review before saving.",
    "audit": "Sanitized event rows become phone cards. Full request IDs wrap; document text and credentials remain redacted.",
    "disabled-signin": "The separate test profile remains an intentionally disabled account with a real authentication denial.",
}


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    entries = []
    for phase in ("before", "after", "after-dark"):
        for source in sorted((SOURCE / phase).glob("*/*.png")):
            state, width = source.stem.rsplit("-", 1)
            relative = Path("screenshots") / phase / source.parent.name / (source.stem + ".jpg")
            target = DEST / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            with Image.open(source) as picture:
                dimensions = picture.size
                picture.convert("RGB").save(target, quality=88, optimize=True)
            entries.append(dict(phase=phase, role=source.parent.name, state=state, width=int(width), image=relative.as_posix(), dimensions=dimensions))
    data = dict(entries=entries, notes=NOTES)
    (DEST / "manifest.json").write_text(json.dumps(data, indent=2), encoding="utf-8")
    for phase in ("before", "after", "after-dark"):
        path = SOURCE / phase / "observations.json"
        if path.exists():
            shutil.copyfile(path, DEST / (phase + "-observations.json"))
    for group in ("workflow", "performance"):
        path = SOURCE / group / "result.json"
        if path.exists():
            shutil.copyfile(path, DEST / (group + "-results.json"))
    shutil.copyfile(SOURCE / "performance/login-loading.json", DEST / "login-loading.json")
    for source in sorted((SOURCE / "workflow").glob("*.png")):
        with Image.open(source) as picture:
            picture.convert("RGB").save(DEST / (source.stem + ".jpg"), quality=88, optimize=True)
    template = r'''<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cortex · Complete product review</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f7f6ef;color:#173d30;font:16px/1.6 system-ui,sans-serif}header,main{max-width:1500px;margin:auto;padding:32px}h1,h2{font-family:Georgia,serif;font-weight:500;line-height:1.2}h1{font-size:36px;margin:0 0 16px}a{color:inherit}p{max-width:90ch}label{display:grid;gap:8px}select,button{font:inherit;color:inherit;background:#fffef9;border:1px solid #7b8b7c;border-radius:6px;min-height:44px;padding:8px 12px}button{cursor:pointer}a:focus-visible,select:focus-visible,button:focus-visible{outline:3px solid #173d30;outline-offset:4px}.filters{display:flex;flex-wrap:wrap;gap:16px;margin:24px 0}.filters label{flex:1 1 170px}.comparison{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;align-items:start}figure{margin:0;background:#fffef9;border:1px solid #d4dacf;border-radius:8px;padding:16px;min-width:0}figcaption{margin-bottom:16px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}.image{display:block;width:fit-content;max-width:100%;margin:auto}.image img{max-width:100%;height:auto;display:block}.missing{padding:32px;color:#58675d;background:#edf0e5}.note{border-left:3px solid #173d30;background:#edf0e5;padding:16px}.muted{color:#58675d;font-size:14px}footer{padding:24px 32px;border-top:1px solid #d4dacf}.next{display:flex;gap:16px;flex-wrap:wrap;margin-top:24px} @media(max-width:700px){header,main{padding:24px 16px}.comparison{grid-template-columns:1fr}h1{font-size:28px}}
</style>
<header><h1>Cortex, one evidence desk.</h1><p>Issue #4 · Real before-and-after application captures from the reconciled Fieldbook baseline and the full-product review branch. Forest green, ivory, Fraunces and DM Sans remain the visual identity.</p><p><a href="http://127.0.0.1:5173/assistant">Open running application</a> · <a href="verification.md">Verification log</a> · <a href="README.md">Full audit report</a></p><p class="muted">Fictional isolated backend data, restored from the same database snapshot. Widths 320, 390, 768, 1024, 1280 and 1440; viewport height 900. Full-page captures preserve natural page height; dialogs use the viewport. Timestamps and audit request IDs can differ. Before captures retain the original names; after captures use the Auronix team display names with identical account IDs and permission examples. Dark captures are additional verification; the retained baseline is light. New dialogs/comparisons have no manufactured “before” view.</p></header>
<main><div class="filters"><label>Profile<select id="role"></select></label><label>Screen or state<select id="state"></select></label><label>Viewport width<select id="width"></select></label><label>Review theme<select id="theme"><option value="after">Light · before / after</option><option value="after-dark">Dark · additional after verification</option></select></label></div><p class="note" id="note"></p><div class="comparison" id="frames"></div><div class="next"><button id="previous">Previous screen</button><button id="next">Next screen</button></div><p id="inventory" class="muted"></p></main>
<footer>Retained pre-release gallery. The full product was subsequently published after owner approval; <a href="../production-release/README.md">final production verification and fresh screenshots</a>. The exact preview-origin restart remains recorded in <a href="preview-origin-change.md">configuration verification</a>. Native Safari, physical phones, assistive technology and field INP remain unverified limitations. <a href="approved-future-policy-390.jpg">Real upload / approval</a> · <a href="denied-private-policy-390.jpg">Real denied document</a> · <a href="performance-results.json">Measured performance sample</a></footer>
<script>
const data = __DATA__;
const controls=Object.fromEntries(['role','state','width','theme'].map(key=>[key,document.getElementById(key)]));
const labels={maya:'Arya Dhumal · Employee',ravi:'Aditya Gholar · Reviewer/admin',isha:'Ashwin Gudur · Auditor',orbit:'Yashraj Bansal · Other workspace',noor:'Disabled test account'};
function options(control,values,label=x=>x){control.replaceChildren(...values.map(value=>{const option=document.createElement('option');option.value=value;option.textContent=label(value);return option;}));}
options(controls.role,['maya','ravi','isha','orbit','noor'],x=>labels[x]);
options(controls.width,[320,390,768,1024,1280,1440],x=>x+'px');controls.width.value='1440';
function states(){const selected=controls.state.value;options(controls.state,[...new Set(data.entries.filter(x=>x.role===controls.role.value).map(x=>x.state))],x=>x.replaceAll('-',' '));if([...controls.state.options].some(x=>x.value===selected))controls.state.value=selected;render();}
function render(){const role=controls.role.value,state=controls.state.value,width=Number(controls.width.value),phase=controls.theme.value;document.getElementById('note').textContent=data.notes[state]||'';const frames=document.getElementById('frames');frames.replaceChildren();for(const side of (phase==='after'?['before','after']:['after-dark'])){const entry=data.entries.find(x=>x.phase===side&&x.role===role&&x.state===state&&x.width===width);const figure=document.createElement('figure'),caption=document.createElement('figcaption');const title=document.createElement('strong');title.textContent=side==='before'?'Before · retained baseline':side==='after'?'After · refined application':'After · dark theme';caption.append(title);figure.append(caption);if(entry){const link=document.createElement('a');link.className='image';link.href=entry.image;link.target='_blank';link.rel='noopener';const image=document.createElement('img');image.src=entry.image;image.alt=labels[role]+' '+state+' '+side+' '+width+'px';image.width=entry.dimensions[0];image.height=entry.dimensions[1];link.append(image);figure.append(link);const sizes=document.createElement('span');sizes.textContent=entry.dimensions.join(' × ')+'px · open full size';caption.append(sizes);}else{const missing=document.createElement('p');missing.className='missing';missing.textContent='No retained baseline for this new state at this width. The after view is genuine additional coverage.';figure.append(missing);}frames.append(figure);}frames.style.gridTemplateColumns=phase==='after-dark'?'minmax(0,1fr)':'';document.getElementById('inventory').textContent=data.entries.length+' actual capture files across all profiles, widths and themes. Choose another screen to inspect its comparison.';}
controls.role.addEventListener('change',states);for(const key of ['state','width','theme'])controls[key].addEventListener('change',render);for(const [id,step]of [['previous',-1],['next',1]])document.getElementById(id).addEventListener('click',()=>{controls.state.selectedIndex=(controls.state.selectedIndex+step+controls.state.options.length)%controls.state.options.length;render();});states();controls.state.value='ask-answer';render();
</script></html>'''
    (DEST / "gallery.html").write_text(template.replace("__DATA__", json.dumps(data)), encoding="utf-8")
    total = sum(p.stat().st_size for p in (DEST / "screenshots").rglob("*.jpg"))
    print(f"Gallery: {len(entries)} genuine screenshots, {total / 1024 / 1024:.2f} MiB")


if __name__ == "__main__":
    main()
