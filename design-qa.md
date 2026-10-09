# Cortex full-product UI/UX verification

10 October 2026 · `codex/full-product-ux` · Issue #4

**Local review gate: PASS for the bounded checks. Release: pending owner visual approval, preview-origin configuration approval and post-deployment verification.** No main merge or production deployment was performed.

The shared shell, tokens and all routes now use the approved forest/ivory identity. Every audit finding, real screenshot coverage, test result, measured performance sample and limitation is recorded in the [full audit report](docs/design/product-audit/README.md). The [interactive gallery](docs/design/product-audit/gallery.html) contains 652 real before/after captures at all six requested widths and both review themes. [Previous Fieldbook QA](docs/design/product-audit/previous-design-qa.md) remains historical evidence.

Verified: 39 backend tests, 21 frontend tests, 56 selected browser tests, Ruff, TypeScript/Vite and npm audit. Geometry observations show no page overflow or sampled visible target below 44px. Keyboard dialogs, evidence focus return, denied/revoked sources, long answers, conflict abstention, private upload/review/download integrity, role boundaries, read-only governance, reduced motion, contrast and 200% text/reflow emulation pass.

The owner's preview login403 is confirmed as exact-Origin rejection. [Reviewable configuration proposal](docs/design/product-audit/preview-origin-change.md) is prepared and remains unapplied because production must stay untouched until approval. The unchanged public production alias still signs in normally. Auronix team display names are verified locally, with existing identity/permission contracts preserved.

Local measurements do not certify physical devices, Safari, screen readers, mobile networks, field INP or Render cold starts. These limits and separate publication checks are explicit in the report.
