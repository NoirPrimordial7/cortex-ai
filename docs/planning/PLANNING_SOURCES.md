# Phase2 decision evidence

**Assessment date2026-10-09; scoped primary-source review, not new product benchmarking.** Phase1's [76-source register](../RESEARCH_SOURCES.md) remains unchanged. This page records only additional engineering/design checks. Link reachability is not proof of implementation quality.

| Source checked | Supported planning use | Evidence confidence / boundary |
|---|---|---|
| [Vite guide](https://vite.dev/guide/) | Local frontend build and Node runtime requirement verification | H official guide; exact dependency locks unimplemented |
| [Tailwind Vite setup](https://tailwindcss.com/docs/installation/using-vite) | Tailwind4 integration choice | H official documentation, no installation performed |
| [FastAPI security](https://fastapi.tiangolo.com/tutorial/security/) | Available primitives; our sessions/ACLs remain app responsibility | H; no security guarantee inferred |
| [React](https://react.dev/) | Component-based UI architecture | H official docs; no React app scaffolded |
| [argon2-cffi](https://argon2-cffi.readthedocs.io/en/stable/) | Argon2id password-hashing interface | H official docs; actual parameters/resource tests Phase3 |
| [Pytest](https://docs.pytest.org/en/stable/) and [Vitest](https://vitest.dev/guide/) | Planned Python/frontend test tooling | H official guides; no application suite executed |
| [SQLAlchemy](https://www.sqlalchemy.org/) | Current2.1 vs maintained2.0 options; conservative2.0 baseline | H official release information, compatibility tests pending |
| [SQLite FTS5](https://sqlite.org/fts5.html) | Full-text matching and scoring limitations | H; shared index statistics not authorization |
| [SQLite WAL](https://sqlite.org/wal.html) | Local host/write concurrency and current WAL-reset bug guidance | H; exact installed SQLite patch must be checked before WAL |
| [pypdf extraction](https://pypdf.readthedocs.io/en/stable/user/extract-text.html) | Text-bearing PDF extraction limitations | H; OCR/scanned layouts not claimed supported |
| [python-docx](https://python-docx.readthedocs.io/en/latest/) | DOCX reading ecosystem | H; malformed/untrusted input still bounded |
| [OWASP sessions](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) | Opaque sessions, cookies and expiration threat guidance | H authoritative engineering guidance; deployment not audited |
| [OWASP authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) | Deny-default/object checks/test design | H; tests are not proof of universal safety |
| [WCAG2.2](https://www.w3.org/TR/WCAG22/) | Accessibility target and selected contrast calculations | H standard; no full application conformance claim |
| [SaaSUI](https://www.saasui.design/) and [navigation examples](https://www.saasui.design/pattern/navigation) | Public pattern directory; live visual navigation inspection | M design inspiration; subjective Cortex adaptation |
| [Mobbin](https://mobbin.com/) | Public reference directory | M; cookie/blur limited visual access, gated flows NOT VERIFIED |
| [Dribbble dashboard collection](https://dribbble.com/tags/saas-dashboard) | Public visual collection route | M; individual shots/usability not audited |
| [Awwwards](https://www.awwwards.com/) | Requested reference attempted | NOT VERIFIED: fetch timeout/unavailable |
| [Behance](https://www.behance.net/) | Requested reference attempted | NOT VERIFIED: fetch unavailable |

No external assets copied, no paid research access, no account registration. [Design research](../design/DESIGN_RESEARCH.md) distinguishes accessed references from unavailable ones. No source establishes a competitive advantage or Cortex performance. Recent temporal/conflict/citation papers are reused from Phase1 rather than repeatedly surveyed.
