# Known Limitations

Current bugs, missing features, and test gaps.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    LIMITATIONS OVERVIEW                                │
│                                                                         │
│   ┌──────────────────────┬───────────┬──────────────────────────┐      │
│   │ Issue                │ Severity  │ Status                   │      │
│   ├──────────────────────┼───────────┼──────────────────────────┤      │
│   │ 1 pre-existing test  │ LOW       │ Known, see below         │      │
│   │ 6 skipped tests      │ LOW       │ Need SMTP to run         │      │
│   │ Frontend stubs       │ MEDIUM    │ 12 pages are stubs       │      │
│   │ i18n coverage ~70%   │ LOW       │ Missing Tamil keys       │      │
│   │ No E2E tests         │ MEDIUM    │ Acceptance criteria gap  │      │
│   │ No CI pipeline       │ MEDIUM    │ No automated builds      │      │
│   │ Seed data incomplete │ LOW       │ Missing edge case data   │      │
│   └──────────────────────┴───────────┴──────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
```

## Fixed Bugs (previously documented, now resolved)

| Bug | File | Fix | Date |
|-----|------|-----|------|
| SQL injection in analytics queries | `analytics.repository.ts` | Converted 6 queries to `Prisma.sql` tagged templates | 2026-06-18 |
| OTP hard lockout not setting EXPIRED | `otp.service.ts` | Added `state='EXPIRED'` transition on max attempts | 2026-06-18 |
| CSP missing frameAncestors, formAction, baseUri | `app.ts` | Added missing directives to helmet config | 2026-06-18 |
| Admin routes lacked IP allowlisting | 8 route modules | Added `requireIpAllowlist` middleware | 2026-06-18 |
| Missing `.env.example` with placeholder secrets | Backend root | Created `backend/.env.example` | 2026-06-18 |
| Analytics queries lack date-range filtering | 5 analytics queries | Added optional `since` parameter + `daysAgo(365)` default | 2026-06-18 |
| SSL/TLS not split into HTTP/HTTPS configs | `nginx/` | Split nginx config, added certbot sidecar | 2026-06-18 |
| Missing `requireRole('ADMIN')` on admin routes | 4 route modules | Already wired on all 53 admin route entries (verified) | 2026-06-18 |

## Open Issues

| Issue | Severity | Location | Description |
|-------|----------|----------|-------------|
| 1 pre-existing test failure | LOW | `backend/src/__tests__/some.test.ts` | Edge case with date boundary — next day rollover. Fix pending investigation. |
| 6 skipped tests | LOW | Various test files | Require SMTP server. Run with `SMTP_HOST` set to test. |
| Frontend stubs | MEDIUM | 12 page components | Pages exist with placeholder text but no real API integration. See Feature Matrix. |
| i18n ~70% Tamil coverage | LOW | `frontend/src/i18n/ta/` | Some keys fall back to English. Adding translations is ongoing. |
| No E2E tests | MEDIUM | N/A | No Playwright/Cypress tests. Acceptance criteria verified manually. |
| No CI pipeline | MEDIUM | N/A | No GitHub Actions or similar. Tests run manually. |
| Seed data incomplete | LOW | `prisma/seed.ts` | Missing edge case profiles (suspended accounts, expired memberships, etc.). |
| Rate limiting not per-user | LOW | `common/middleware/rateLimit.ts` | Currently per-IP only. Authenticated rate limiting not implemented. |

## Test Gaps

| Area | Missing Tests | Priority |
|------|--------------|----------|
| Maaligai booking pipelines | Full integration test suite | HIGH |
| Maaligai calendar | Concurrent booking race condition | HIGH |
| Manamaalai admin operations | Approve/reject/archive/delete flows | MEDIUM |
| Payment settlement | Gateway timeout, retry, idempotency | MEDIUM |
| File upload | Size limits, format validation, concurrent uploads | LOW |
| Frontend components | Most components untested | MEDIUM |
| Cache invalidation | Tag invalidation, race conditions | LOW |
| i18n fallback | Missing key behavior, pluralization | LOW |
