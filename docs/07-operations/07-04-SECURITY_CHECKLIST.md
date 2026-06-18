# Security Checklist

All security measures currently implemented, and what should be checked regularly.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                                     │
│                                                                         │
│   1. NETWORK SECURITY                                                    │
│      ├── HTTPS enforced (301 on HTTP)                                  │
│      ├── TLSv1.2 / TLSv1.3 only                                        │
│      ├── HSTS (max-age=63072000)                                       │
│      └── IP allowlisting for admin routes                               │
│                                                                         │
│   2. APPLICATION SECURITY                                                │
│      ├── CSP headers (XSS prevention)                                  │
│      ├── Helmet security headers                                       │
│      ├── Argon2id password hashing                                     │
│      ├── Rate limiting (global + per-route)                           │
│      ├── JWT with short expiry (15 min)                                │
│      └── Refresh token rotation + family                               │
│                                                                         │
│   3. DATA SECURITY                                                       │
│      ├── Passwords: Argon2id (never stored in plaintext)               │
│      ├── Tokens: SHA-256 hash in DB (never plaintext)                 │
│      ├── Cookies: httpOnly, Secure, SameSite=Lax                       │
│      └── Environment variables (never in code)                         │
│                                                                         │
│   4. OPERATIONAL SECURITY                                                │
│      ├── Sentry error tracking                                          │
│      ├── Audit logging for all state changes                           │
│      ├── Secrets in .env (not committed)                               │
│      └── Docker containers run as non-root user                        │
└─────────────────────────────────────────────────────────────────────────┘
```

## HTTP Headers (Set by Helmet + Nginx)

| Header | Value | Status |
|--------|-------|--------|
| Content-Security-Policy | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://inputtools.google.com; frame-ancestors 'none'; base-uri 'self'` | ✅ Implemented |
| X-Frame-Options | `DENY` | ✅ Implemented |
| X-Content-Type-Options | `nosniff` | ✅ Implemented |
| Strict-Transport-Security | `max-age=63072000; includeSubDomains` | ✅ Implemented |
| Referrer-Policy | `strict-origin-when-cross-origin` | ✅ Implemented |
| X-XSS-Protection | `0` (disabled — CSP handles this) | ✅ Implemented |

## Regular Checks

| Frequency | Check | How |
|-----------|-------|-----|
| Weekly | Review Sentry errors | sentry.io dashboard |
| Weekly | Check failed BullMQ jobs | /admin/queues |
| Monthly | Review audit logs | SQL query on audit_log table |
| Monthly | Dependency audit | `npm audit` |
| Quarterly | SSL cert expiry | `openssl x509 -enddate -noout -in /etc/ssl/certs/cert.pem` |
| Quarterly | Penetration test | Manual review |
| After deploy | Verify CSP headers | `curl -sI https://yourdomain.com \| grep content-security-policy` |
| After deploy | Verify HSTS | `curl -sI https://yourdomain.com \| grep strict-transport-security` |

## Known Gaps (Future Work)

| Gap | Priority | Notes |
|-----|----------|-------|
| Automated dependency scanning | Medium | Integrate Dependabot or Snyk |
| 2FA/MFA for admin accounts | Medium | Future feature |
| Audit log for admin actions | Low | Currently logging state changes, not admin view actions |
| Rate limit per-user (not just per-IP) | Low | Requires authenticated rate limiter |
| Secrets rotation schedule | Low | Documented but not automated |
