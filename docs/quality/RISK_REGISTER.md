# Risk Register

## Current Risks

| ID | Risk | Likelihood | Impact | Level | Mitigation |
|---|---|---|---|---|---|
| R-001 | Verification token = access token vulnerability being exploited | Medium | Critical | **HIGH** | Deploy separate JWT_VERIFICATION_SECRET |
| R-002 | Account takeover via email mismatch during signup | Medium | Critical | **HIGH** | Add email-match check in signup |
| R-003 | Refresh token brute force (no rate limit) | High | High | **HIGH** | Add rate limiters to refresh/logout |
| R-004 | Session hijack after password change | Medium | High | **MEDIUM** | Revoke sessions in changePassword |
| R-005 | Concurrent request session desync | Medium | High | **MEDIUM** | Atomic session rotation with row lock |
| R-006 | Admin credential login via user portal | Low | High | **MEDIUM** | Default portal to USER, reject mismatch |
| R-007 | Email link click leads to dead page | High | High | **HIGH** | Construct proper URLs from base URL |
| R-008 | Cookie-based CSRF on /auth endpoints | Low | High | **LOW** | SameSite strict + path hardening |
| R-009 | Redis data loss (no persistence) | Low | Medium | **LOW** | Enable RDB/AOF persistence |
| R-010 | Production deployment without admin user | High | Medium | **MEDIUM** | Add admin seed or setup script |
| R-011 | No CI/CD — deployment errors in rollback | High | Medium | **HIGH** | Establish CI/CD pipeline |
| R-012 | PostgreSQL data loss (no backup configured) | Medium | Critical | **HIGH** | Configure automated backups |
| R-013 | No monitoring/alerting — outages undetected | High | High | **HIGH** | Set up health checks + alerting |
| R-014 | Stub data in production (admin pages) | High | Critical | **CRITICAL** | Block /admin frontend routes until backend ready |

## Risk Level Definitions

| Level | Action Required |
|---|---|
| CRITICAL | Immediate remediation required. Ship-blocking. |
| HIGH | Fix in current sprint. Deploy as soon as possible. |
| MEDIUM | Add to backlog. Address within 2 sprints. |
| LOW | Monitor. Accept or address when convenient. |

## Mitigation Priority

1. **CRITICAL:** Fix BUG-CRIT-001 through BUG-CRIT-004 (core auth is broken without these)
2. **HIGH:** Rate limiters, session revocation on password change, email URL construction
3. **MEDIUM:** Atomic refresh, admin seed, portal default, cookie path hardening
4. **LOW:** Redis persistence, CSRF hardening
