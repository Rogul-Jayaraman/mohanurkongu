# Known Limitations

## Critical

| ID | Description | Impact |
|---|---|---|
| BUG-CRIT-001 | OTP never delivered via email/wire — `enqueueOtpEmail()` never called | Users cannot complete registration |
| BUG-CRIT-002 | Signup does not verify email matches verified OTP target | Account can be created with different email |
| BUG-CRIT-003 | Verification tokens signed with same secret as access tokens | Verification token = access token |
| BUG-CRIT-004 | Welcome email never sent — `enqueueWelcomeEmail()` never called | Users never receive confirmation |

## High

| ID | Description | Impact |
|---|---|---|
| BUG-HIGH-001 | Concurrent refresh token rotation race condition | Lost token family, user logged out |
| BUG-HIGH-002 | Password change increments tokenVersion but doesn't revoke sessions | Old sessions remain valid |
| BUG-HIGH-003 | Missing rate limiters on /auth/refresh and /auth/logout | Brute force / DoS window |
| BUG-HIGH-004 | Email template action URLs are empty strings | All email links broken |

## Medium

| ID | Description | Impact |
|---|---|---|
| BUG-MED-001 | Refresh cookie path `/auth` leaks to all /auth/* endpoints | CSRF amplification risk |
| BUG-MED-004 | Portal parameter optional in login; omitted value bypasses role check | Admin credentials can authenticate via user portal |

## Architecture Gaps

| Gap | Impact |
|---|---|
| **Profile module not implemented** | 70% of frontend features are stub-reliant |
| **Mandapam module not implemented** | All booking/availability features are stubs |
| **Admin module not implemented** | 10 admin pages use stubs, no backend validation |
| **No CI/CD pipeline** | Manual deployment only |
| **No health probes** | Docker healthcheck not configured |
| **No monitoring** | No logging aggregation, metrics, or alerting |
| **No backup strategy** | PostgreSQL backup not configured in Docker |
| **Seed script missing admin user** | First admin must be created via DB or manual code |
| **`requireRole` guard never wired** | No route-level authorization enforcement |
| **Dead code: `AccountService.changePassword()`** | AuthService duplicates logic |
| **No rate limit on password reset** | POST /auth/reset-password has no rate limiter |
| **No email verification expiry feedback** | No API to check if OTP expired before trying to verify |
