# Approved preview sign-in configuration change

**Applied 10 October 2026 after the owner explicitly approved preview login configuration.** The failure was an exact-Origin allowlist mismatch, before credential verification; the initial unauthenticated session401 is expected.

Render service `srv-db4h9q1srm7s73b4b5g0` (`cortex-ai-demo`) now has this exact `CORTEX_ORIGINS` value:

```text
https://cortex-ai-three-kappa.vercel.app,https://cortex-ai-noir-s-projects2.vercel.app,https://cortex-ai-git-codex-full-product-ux-noir-s-projects2.vercel.app,https://cortex-phokpl83t-noir-s-projects2.vercel.app
```

Both existing production origins were preserved. Only the verified current review-branch alias and the current build origin were appended. No wildcard, proxy Origin rewriting, credential change or protection bypass was applied.

The dashboard's **Save and deploy** action reused the existing build. Render deployment `dep-db4mlje0tbcc73efh6v0` reached Live in40.8seconds on unchanged main source `2919a6dfe649db097d132a3e0dac1e9464cde304`. This approved configuration restart may invalidate disposable demo sessions; choose a fresh profile and sign in again. No review UI/backend code was merged or released.

[Saved configuration screenshot](render-preview-origins.jpg) · [backend verification](preview-origin-verification.json) · [post-change production smoke](post-origin-hosted-smoke.json).

Both added origins passed actual shared-backend login200, session200, annual-leave query200 and citation200 with exact span/hash validation. Wrong CSRF and an unapproved origin still returned403. The public production alias passed52 functional HTTP assertions and a fresh Chromium profile-login test after the restart. The test output contains no passwords, session cookies or CSRF tokens.

Use the [stable review alias](https://cortex-ai-git-codex-full-product-ux-noir-s-projects2.vercel.app/) across subsequent branch builds. The build origin above belongs to the verified deployment `dpl_2tScBVi8BozWyPAdmeVMsegDvVik`, source `b3bf89fad9f7f12d9f075abf0a898269a857d5db`; new random build URLs are not automatically approved.

Protected-preview browser/proxy verification remains pending in the owner's authenticated Vercel browser. Automatic approval review rejected the temporary Vercel authentication-bypass link because it bypasses preview protection; no alternative bypass was attempted. Direct backend Origin checks establish the allowlist fix, not end-to-end verification of the protected preview proxy.

The earlier supplied `design-full-product-ux-co-e37227` alias remains historical diagnostic evidence in [the original report](preview-login-diagnosis.json). It was superseded by the verified current branch/build and was not added. Published main still uses the old fictional names until the approved team-name backend change is released; local review names are already verified.
