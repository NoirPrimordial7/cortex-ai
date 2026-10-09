# Proposed preview sign-in configuration change

**Status: prepared, verified diagnosis, not applied.** The owner requested production remain untouched until visual review and approval.

Failing address:
`https://cortex-ai-git-design-full-product-ux-co-e37227-noir-s-projects2.vercel.app`

The shared backend rejects POST `/api/v1/auth/login` from this exact Origin with403 “Origin not permitted”, before credential verification. The initial unauthenticated `/auth/session`401 is normal. The public production alias still authenticates successfully. [Sanitized diagnostic result](preview-login-diagnosis.json).

After owner approval, update **Render service `srv-db4h9q1srm7s73b4b5g0`**, backend `https://cortex-ai-demo.onrender.com`, environment variable **`CORTEX_ORIGINS`**:

1. Read its current value and preserve every existing approved origin.
2. Append exactly the failing HTTPS origin above, without a path or trailing slash, only if absent.
3. Keep exact-host checks, Secure cookies, CSRF, read-only shared-demo protections and arbitrary-preview rejection intact. Do not use a wildcard or spoof the Origin in the frontend proxy.
4. Apply the configuration, wait for backend health, load fresh fictional profiles and test normal sign-in/session/query/citation from that exact preview. Retest an unapproved origin403 and published production sign-in.

Applying Render environment changes can restart the disposable demo backend, invalidate sessions and reset shared demo history. This is a shared production backend configuration change, so it remains behind the owner's explicit approval requirement. No payment, instance upgrade, permission change, credential replacement or main merge is proposed.

This origin belongs to the URL the owner supplied; new review branch URLs require their own verified exact origin. The new UI/error explanation and Auronix team display names are currently on the local review branch, not the unchanged published main application.
