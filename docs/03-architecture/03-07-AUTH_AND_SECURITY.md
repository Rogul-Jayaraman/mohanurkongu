# Authentication & Security

Multi-layer auth system: JWT access tokens, refresh token rotation, IP allowlisting, and security headers.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION ARCHITECTURE                        │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │                    TOKEN STRATEGY                            │     │
│   │                                                              │     │
│   │   ┌──────────────────────┐    ┌──────────────────────────┐   │     │
│   │   │  ACCESS TOKEN        │    │  REFRESH TOKEN            │   │     │
│   │   │  Type: JWT (HS256)   │    │  Type: Random bytes       │   │     │
│   │   │  Lifetime: 15 min    │    │  Lifetime: 7 days         │   │     │
│   │   │  Stored: Memory      │    │  Stored: httpOnly cookie  │   │     │
│   │   │  Contains: userId,   │    │  DB: SHA-256 hash        │   │     │
│   │   │  role, sessionId     │    │  Rotated on every use    │   │     │
│   │   └──────────────────────┘    └──────────────────────────┘   │     │
│   │                                                              │     │
│   │   ┌──────────────────────┐    ┌──────────────────────────┐   │     │
│   │   │  VERIFICATION TOKEN  │    │  RESET TOKEN             │   │     │
│   │   │  Email verification  │    │  Password reset          │   │     │
│   │   │  Lifetime: 24 hours  │    │  Lifetime: 1 hour       │   │     │
│   │   │  One-time use        │    │  One-time use            │   │     │
│   │   └──────────────────────┘    └──────────────────────────┘   │     │
│   └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │                    AUTH FLOW                                │     │
│   │                                                              │     │
│   │   ┌────────┐     ┌────────┐     ┌────────┐     ┌────────┐  │     │
│   │   │LOGIN   │────▶│JWT +   │────▶│Browser │────▶│API call│  │     │
│   │   │        │     │Refresh │     │stores  │     │with    │  │     │
│   │   │email+  │     │token   │     │cookie  │     │Bearer  │  │     │
│   │   │password│     │created │     │+memory │     │token   │  │     │
│   │   └────────┘     └────────┘     └────────┘     └────┬───┘  │     │
│   │                                                      │      │     │
│   │   ┌──────────────────────────────────────────────────┴──┐   │     │
│   │   │  ACCESS TOKEN EXPIRED?                              │   │     │
│   │   │  ┌──── YES ──────────────────────────────────┐      │   │     │
│   │   │  │  Axios interceptor → POST /auth/refresh   │      │   │     │
│   │   │  │  New tokens issued, old refresh invalidated│      │   │     │
│   │   │  └───────────────────────────────────────────┘      │   │     │
│   │   │  ┌──── NO ───────────────────────────────────┐      │   │     │
│   │   │  │  Continue to controller                    │      │   │     │
│   │   │  └───────────────────────────────────────────┘      │   │     │
│   │   └──────────────────────────────────────────────────────┘   │     │
│   └──────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Middleware Guards

| Guard | Purpose | Used By |
|-------|---------|---------|
| `requireAuth` | Validates JWT, attaches `req.user` | All authenticated endpoints |
| `optionalAuth` | Attaches `req.user` if token present, doesn't reject | Public browse endpoints |
| `requireRole('ADMIN')` | Rejects non-admin users | All admin routes |
| `requireRole('SUPER_ADMIN')` | Rejects non-super-admin | User management routes |
| `requireIpAllowlist` | Restricts to VPN/internal IPs | Admin routes (production) |

## Security Headers

Configured via `helmet` in `app.ts`:

| Header | Value | What It Prevents |
|--------|-------|-----------------|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; form-action 'self'; base-uri 'self'` | XSS, clickjacking, form hijacking |
| `X-Frame-Options` | `DENY` | Clickjacking |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` | HTTPS enforcement (2 years) |
| `X-XSS-Protection` | `0` | Disables legacy XSS filter |

## Password Security

- **Algorithm**: Argon2id (OWASP recommended)
- **Salt**: Auto-generated per password (16 bytes)
- **Memory**: 64MB
- **Iterations**: 3
- **Parallelism**: 4

## Rate Limiting

| Scope | Limit | Window |
|-------|-------|--------|
| Global (per IP) | 100 requests | 1 minute |
| Login | 5 attempts | 15 minutes |
| OTP send | 3 attempts | 15 minutes |
| OTP verify | 5 attempts | 15 minutes |
| Password reset | 3 attempts | 1 hour |

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Token reuse (refresh stolen) | Token family — old token version invalidates all sibling tokens |
| Concurrent refresh requests | Only first succeeds; subsequent get 401 |
| Refresh cookie but no cookie | 401 — frontend redirects to login |
| Account suspended mid-session | Next API call: requireAuth succeeds, but business logic rejects with 403 |
| JWT tampered | JWT verification fails → 401 |
| JWT expired + refresh also expired | 401 → login required |
| IP allowlisted route from non-VPN | 403 Forbidden |
| Rate limit exceeded | 429 Too Many Requests with Retry-After |
| Browser sends cookie + Authorization header | Both validated; mismatch = 401 |
| OTP brute force | After 5 failed attempts, OTP moves to EXPIRED state |
