# Evidence Studio implementation design QA

Checked 2026-10-09, Asia/Calcutta. **Passed for this bounded local visual checkpoint**, with no remaining identified P0/P1/P2 visual blocker in the inspected priority views. This is not a full WCAG or usability certification.

The approved original Phase2 assistant, dashboard and library artwork was viewed side by side with genuine1440px browser captures in the same comparison images. Temporary comparison sheets were analysis aids under ignored `outputs/`; they are not screenshots. Editable concepts and actual screenshots remain separately labelled in the [gallery](docs/design/README.md).

| Finding | Priority | Correction and recheck |
|---|---|---|
| Evidence quote was14px and metadata11px, smaller than the intended reading hierarchy | P2 | Quote16px/1.7, metadata12px; recaptured assistant and re-compared with the approved concept |
| Evidence pane omitted source-kind and actual authority rank required for transparent selection | P2 | Backend citation now returns reviewed rank; UI shows HR/Operations/informal kind and real rank; backend assertion and build pass; real browser rank100 inspected |
| Open-ended reviewed interval looked like missing review; expired badge looked successful | P2 | Separate Open-ended/Not reviewed labels; expired neutral clock, rejected/extraction failure danger; recaptured version detail |
| Hot reload could replace a context module and throw while rendering | P1 functional | Shared context separated; full TypeScript build and browser navigation/query checked afterward |

The live application retains ink navigation, teal evidence/action accents, restrained borders, system typography, and the evidence pane beside the answer on desktop. Functional differences are deliberate: the dashboard uses actual permitted counts/history; library groups documents and labels arrival as Latest upload with version inspection on detail; the assistant uses editable date/scope and real citations rather than concept-only explanatory claims. No decorative analytics or invented confidence was added.

All major screens were captured at1440/1024/390 widths; selected light/dark assistant views inspected.46 saved measurements show no horizontal overflow;12 selected actual text/background pairs meet4.5contrast (minimum5.11). Keyboard focus, source dismissal, mobile drawer and readable text states were inspected; source dialog keyboard behavior/stale response/access-loss checks have unit tests. These observations do not cover every screen reader, platform or interaction combination.

Outstanding lower-scope work: held-out usability/evaluation, richer lineage and rejected-source explanations, persistent preference storage, exhaustive accessibility/automated browser regression, general semantic policy extraction and production parser isolation. There is no assertion of pixel identity to artwork or access to proprietary product internals.

Capture correction: initial immediate-resize frames were rejected and affected tablet/mobile files recaptured after observing settled page state in a separate browser call. Screenshot raster dimensions may exclude scrollbar or reflect native browser framing;1440/1024/390 labels identify requested CSS viewport widths, not a promise of identical JPEG pixel dimensions. Long review/history pages require vertical scrolling; a viewport image does not claim every control fits above the fold.
