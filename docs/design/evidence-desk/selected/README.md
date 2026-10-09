# Fieldbook with editorial refinement

Selected by the owner on 2026-10-10. The exact attached Fieldbook image (`exec-acddd87a-23ff-4ffa-a053-90ae451dfcaa.png`) supplies the visual identity. The attached Reference House image (`exec-911bc475-b11a-44d9-ac96-055a23e13cdd.png`) supplies editorial restraint. The second attachment is from the earlier set; it does not select Carbon Evidence.

The owner then locked the identity and requested UX refinement, expressly rejecting further variations. One earlier [combined refinement](fieldbook-editorial.png) is retained as visual grounding; its duplicated source block is superseded by the owner's final instructions.

The implementation changes Ask Cortex first. Warm paper, forest ink, Fraunces display type and DM Sans controls remain; lime marks citation numbers and approval only. Main answers have compact citation buttons. Quotes, versions, validity, locator and authority live in a collapsible desktop inspector or a dedicated mobile evidence view. One composer supports the next question. The reading area scrolls separately so the composer cannot cover citations; short keyboard-like viewports use normal scrolling.

Display answers use 36px desktop and 26–28px mobile; answers over 360 characters use 24px desktop and 21px mobile with more line height. Spacing uses an 8px rhythm, with 12px adjustments for compact controls. Icons come from the existing Phosphor library. No generated artwork is shipped in the app.

## Actual local browser views

- [Desktop, real allowed annual-leave response](implemented/real-answer-1536.jpg)
- [390px answer](implemented/real-answer-390.jpg) and [evidence view](implemented/real-evidence-390.jpg)
- [320px answer](implemented/real-answer-320.jpg) and [evidence view](implemented/real-evidence-320.jpg)
- [320px second conflicting source, real backend response](implemented/real-conflict-evidence-320.jpg)
- [Reference and implementation together](implemented/comparison-final.jpg)

The files prefixed `ui-test-` are actual Chromium captures with deterministic API fixtures, including the full shared-demo disclosure. They verify frontend behavior, not backend authorization. Real browser captures above reuse the existing fictional local session and genuine allowed endpoints. Local mode has no hosted-only disclosure.

## Validation and limits

13 frontend regressions, 13 Playwright scenarios, 38 backend regressions, strict TypeScript/Vite build, Ruff and npm audit pass. Browser widths: 320, 390, 768, 1280 and 1440; both themes, no page overflow, exact source context, focus trapping/return, desktop collapse, long answers, follow-ups, clarification, abstention, conflicts and revocation. [QA report](../../../../design-qa.md) explains the scope and resolved findings; [sampled contrast measurements](implemented/contrast.json) cover both themes.

Playwright is pinned to 1.64.0 in dev dependencies. Run `npm run test:e2e` from frontend after `npx playwright install chromium`; the suite starts/reuses loopback Vite and mocks API responses. It does not modify the live database. Physical phone keyboards, Safari, assistive-technology testing, controlled web-vitals and production deployment remain outstanding. Other pages retain Atlas Professional.

The two self-hosted Latin WOFF2 files total 73,552 bytes, use font-display swap, and load through the lazy assistant stylesheet. SIL OFL licenses are bundled in frontend/public/fonts. DM Sans: Google Fonts v17; Fraunces: v38. No paid or remote runtime font service.
