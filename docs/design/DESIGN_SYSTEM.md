# Cortex design system — Evidence Studio proposal

**Implemented Evidence Studio, Phase3.** Actual shared tokens/styles are in `frontend/src/styles.css`; light/dark themes run in the application. Ink#142033, canvas#F6F7F9, muted#526174, teal#067267 and the planned dark values are retained. Actual typography: system SegoeUI fallbacks,14px base/compact reading,30px primary heading,19px section heading,15px subheading,16px/1.7 source passage and12px metadata. No external font/CDN. Phosphor library icons accompany an original typographic cortexAI wordmark; no copied product imagery.

Desktop224px rail, tablet/icon rail and mobile drawer;8px-derived spacing, restrained6px controls/separators, visible focus, reduced-motion rule, mobile44px controls. Current badges separate approval from validity; expired is neutral, future/pending amber, rejection/failure red. Date and source metadata are text, not color-only. Theme choice is in memory, not persisted.

[12 sampled actual light/dark contrast pairs](contrast-results.json) all≥4.5 (minimum5.11); this is not certification of every state. [Screenshots](README.md) and [design QA](../../design-qa.md) replace deferred testing claims for inspected views. Historical proposed sizing/tokens follow for provenance.

---

## Preserved Phase 2 baseline

**Original proposed tokens, implementation pending.** See [moodboard](previews/moodboard.png) and [three directions](previews/visual-directions.png).

| Token | Light value | Purpose |
|---|---|---|
| ink | #142033 | Navigation and primary text |
| canvas | #F6F7F9 | Workspace background |
| surface | #FFFFFF | Reading/table surface |
| muted | #526174 | Secondary text; avoid lighter low-contrast body text |
| border | #DDE3EA | Subtle separators; controls still have visible focus |
| accent | #067267 | Primary action / selected navigation |
| accent_soft | #E3F4EF | Approved/valid surface tint |
| warning | #8F5900 | Conflict/pending foreground on #FFF3D6 |
| danger | #B42332 | Failed/denied foreground on #FDEBEC |
| focus | #2457C5 | 2px keyboard focus ring with offset |

Dark proposal: canvas#0F1724, surface#182438, text#F4F7FB, muted#BBC7D6, border#34445B, accent#6AE0C3, warning#FFD185. Dark theme application test deferred B; no claim all token combinations pass.

Typography: Segoe UI on Windows with system-ui/Arial fallbacks; no downloaded font/CDN dependency. One family,400/500/600/700 weights. Display32/40, heading24/32, subheading18/26, body16/24, compact14/20, label12/18. Policy quotations16/26, normal case, maximum70ch. Tabular numbers for dates/counts; use monospace only for IDs/hash inspection, not body.

Grid: 8px spacing foundation; values4/8/12/16/24/32/40/48. Desktop1440, rail224, page gutter40, max content1200; assistant grid minmax(0,1fr)+360 evidence, gap24. Tablet1024 rail64 or drawer; mobile390 gutter20, one column. Radius8 buttons,12 surfaces; use separators before adding cards/shadows. No nested card inventory.

States: approved+valid, approved+future, expired, pending review, failed extraction, unresolved conflict, inaccessible generic unavailable. Color always accompanied by text/icon. Never say “secure” as a success badge implying proven protection. No confidence percentages or fabricated activity/results.

Motion: hover/focus color120ms, drawer opacity/position160ms; reduced motion disables movement. Keyboard focus order follows visual order. Touch targets>=44px; desktop control height40–44px. Tables require headers/sort labels; mobile cards retain field labels. Live announcements for answer/upload status without reading hidden data.

Phase2 concept QA measures selected foreground/background contrast; Phase3 must test actual computed styles, focus/reflow and screen readers against [WCAG2.2](https://www.w3.org/TR/WCAG22/). Tokens are not accessibility certification.
