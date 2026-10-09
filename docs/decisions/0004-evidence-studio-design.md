# ADR0004 — Evidence Studio visual recommendation

- Timestamp:2026-10-09T16:49:00+05:30; Phase2 / UI design.
- Status: proposed visual recommendation; owner review pending, no implementation approval.
- Context: professional enterprise demonstration must show what evidence applies and avoid polished UI obscuring permission/date limitations.
- Options: Evidence Studio (assistant plus source pane), Policy Ledger (document/governance first), Signal Console (dark investigation view). [Original direction artwork](../design/previews/visual-directions.png).
- Recommendation: Evidence Studio, ink rail/light workspace, restrained teal, readable hierarchy, explicit date/scope/mode/source labels; components and page contracts specified.
- Evidence: public [SaaSUI navigation](https://www.saasui.design/pattern/navigation) inspected; Mobbin public landing inspection limited; Dribbble collection accessible; Awwwards/Behance unavailable and not claimed inspected. Accessibility criteria from [WCAG2.2](https://www.w3.org/TR/WCAG22/). Source observations are distinct from our original design judgments.
- Trade-offs: light primary theme prioritizes reading; dark theme deferred; deterministic artwork previews communicate design but cannot establish browser responsiveness/usability.
- Verification: high-fidelity SVG→PNG concepts inspected; measured token pairs pass normal-text AA contrast after darkening approved-badge teal. In-app local preview failed, Chrome unavailable, owner declined headless Playwright. Static HTML/CSS preserved; no browser-screenshot claim.
- Files: docs/design/, UI_UX_PLAN, learning/navigation docs, README/gallery. No functional app.
- Outstanding: owner visual choice, real browser/screens/readability/accessibility and API state integration in Phase3.
- Commit: resolve `docs: plan delivery backlog and Cortex visual experience`; hash recorded after commit.
