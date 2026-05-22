# ADR-09: Why JWT (not Session-Based Auth)

## Context
Need authentication for a serverless SPA. Requirements: stateless (no server memory), simple implementation, works with Vercel serverless.

## Options Considered
| Option | Pros | Cons |
|---|---|---|
| **JWT (jsonwebtoken)** | Stateless, no DB lookup on each request, serverless-friendly | Cannot revoke without blacklist |
| Session-based (express-session) | Revocable, server-controlled | Requires stateful storage (Redis), harder with serverless |
| Session (stored in DB) | Revocable | DB lookup on every request, slower |
| OAuth + OpenID | Industry standard, social login | Overkill for current scale, complex setup |

## Decision
**JWT with 7-day expiry**. Stateless tokens work well with Vercel serverless — no session store needed. The 7-day expiry balances security with UX (users don't re-login weekly).

## Consequences
- ✅ No server-side session storage needed
- ✅ Works seamlessly with serverless (no Redis required yet)
- ✅ Simple implementation (middleware verifies token)
- ❌ Cannot revoke individual tokens without a blacklist (future: Redis)
- ❌ Token stored in localStorage (vulnerable to XSS — mitigated via input sanitization)
- ❌ No refresh token mechanism (token is valid until expiry)

## When to Revisit
- If token revocation becomes necessary → implement Redis blacklist
- If security requirements increase → add refresh token rotation
- If needing SSO → implement OAuth 2.0
