# Bug Report

## Critical

### BUG-CRIT-001: OTP Never Delivered via Email

| Field | Value |
|---|---|
| **Severity** | CRITICAL |
| **Type** | Logic |
| **Category** | Registration, Password Reset |
| **Root Cause** | `enqueueOtpEmail()` is defined in `email.queue.ts` but never called from any auth service method |
| **Evidence** | `backend/src/modules/auth/auth.service.ts` — `sendRegistrationOtp()` and `sendPasswordResetOtp()` generate OTP but never import or call `enqueueOtpEmail` |
| **Fix** | Add `import { enqueueOtpEmail } from '../../notification/email.queue.js'` and call after OTP generation in both methods |
| **Impact** | Users never receive OTP codes. Registration and password reset are non-functional. |

### BUG-CRIT-002: Signup Does Not Verify Email Match

| Field | Value |
|---|---|
| **Severity** | CRITICAL |
| **Type** | Logic / Security |
| **Category** | Registration |
| **Root Cause** | `signup()` in `auth.service.ts` accepts `dto.email` and `verificationToken`, decodes the JWT to get `verification.target` but never compares `dto.email === verification.target` |
| **Evidence** | `auth.service.ts` has decoded token with `target` field but the next line creates the account with `dto.email` without comparison |
| **Fix** | Add `if (dto.email !== decoded.target) throw new BadRequestException('Email mismatch')` after JWT decode |
| **Impact** | An attacker can verify an email they control, then sign up with a different victim email |

### BUG-CRIT-003: Verification Tokens Signed with Access Token Secret

| Field | Value |
|---|---|
| **Severity** | CRITICAL |
| **Type** | Security |
| **Category** | Authentication |
| **Root Cause** | `signAccessToken()` is used to sign both real access tokens and verification tokens. `JWT_ACCESS_SECRET` is the shared secret. |
| **Evidence** | `backend/src/common/utils/jwt.ts` — only `signAccessToken` and `signRefreshToken` exist. No `signVerificationToken` function. AuthService calls `signAccessToken` for verification token. |
| **Fix** | Add `JWT_VERIFICATION_SECRET` env var, create `signVerificationToken()` / `verifyVerificationToken()` using it |
| **Impact** | A verification JWT can be used as a real access token (same signing key, same claims structure). Full account takeover. |

### BUG-CRIT-004: Welcome Email Never Sent

| Field | Value |
|---|---|
| **Severity** | CRITICAL |
| **Type** | Logic |
| **Category** | Registration, UX |
| **Root Cause** | `enqueueWelcomeEmail()` defined in `email.queue.ts` but never called |
| **Evidence** | `auth.service.ts` `signup()` method — after account creation, no call to enqueueWelcomeEmail |
| **Fix** | Add `await enqueueWelcomeEmail({ ... })` after successful account creation in `signup()` |
| **Impact** | New users never receive registration confirmation. No onboarding email journey. |

## High

### BUG-HIGH-001: Concurrent Refresh Token Rotation Race Condition

| Field | Value |
|---|---|
| **Severity** | HIGH |
| **Type** | Logic / Data |
| **Category** | Authentication, Session |
| **Root Cause** | `session.service.ts` `rotateSession()` reads session to check `revokedAt === null`, then creates new session and marks old as revoked. Two concurrent requests both pass the null check before either writes. |
| **Evidence** | `session.repository.ts` `revoke()` has no `WHERE revokedAt = null` guard. `rotateSession()` has no Prisma transaction or row-level locking. |
| **OWASP** | A2:2021 – Cryptographic Failures (token handling) |
| **Fix** | Use atomic `UPDATE sessions SET revokedAt = NOW() WHERE id = ? AND revokedAt IS NULL` with row-count check, or use Prisma transaction with `$transaction` and row lock |
| **Impact** | Lost token family. One of the two concurrent users gets logged out when the other's session replaces it. |

### BUG-HIGH-002: Password Change Does Not Revoke Existing Sessions

| Field | Value |
|---|---|
| **Severity** | HIGH |
| **Type** | Security |
| **Category** | Authentication |
| **Root Cause** | `changePassword()` in `auth.service.ts` increments `tokenVersion` but never calls `sessionService.revokeAll()` |
| **Evidence** | `auth.service.ts` `changePassword()`: updates credential, increments `tokenVersion`, saves — no session revoke call |
| **OWASP** | A7:2021 – Identification and Authentication Failures |
| **Fix** | Add `await sessionService.revokeAll(accountId, currentSessionId)` after password update |
| **Impact** | After password change, old sessions remain valid. Stolen tokens are not invalidated. |

### BUG-HIGH-003: Missing Rate Limiters on Critical Endpoints

| Field | Value |
|---|---|
| **Severity** | HIGH |
| **Type** | Security / Performance |
| **Category** | Authentication |
| **Root Cause** | `/auth/refresh` and `/auth/logout` routes have no `createRateLimiter()` middleware |
| **Evidence** | `auth.routes.ts` — refresh and logout route definitions lack rate limiter calls (other routes have them) |
| **OWASP** | A4:2021 – Insecure Design (lack of DoS protection) |
| **Fix** | Add `.post(createRateLimiter(10), ...)` to refresh and logout routes |
| **Impact** | Brute-force attack window on refresh tokens. DoS amplification vector. |

### BUG-HIGH-004: Email Template Action URLs Are Empty Strings

| Field | Value |
|---|---|
| **Severity** | HIGH |
| **Type** | Logic |
| **Category** | Notification, UX |
| **Root Cause** | `email.queue.ts` constructs `enqueueOtpEmail` and `enqueueWelcomeEmail` with `verifyUrl: ''`, `resetUrl: ''`, `profileUrl: ''`, `exploreUrl: ''` |
| **Evidence** | `backend/src/modules/notification/email.queue.ts`: all URL fields set to empty string |
| **Fix** | Construct URLs from env var `APP_BASE_URL` + path. E.g., ``const baseUrl = process.env.APP_BASE_URL; verifyUrl: `${baseUrl}/verify?token=${token}` `` |
| **Impact** | All email links are dead. Users receive emails with empty/invalid action buttons. |

## Medium

### BUG-MED-001: Refresh Cookie Path Leaks to Public Endpoints

| Field | Value |
|---|---|
| **Severity** | MEDIUM |
| **Type** | Security |
| **Category** | Authentication |
| **Root Cause** | Refresh token cookie set with `path: '/auth'` instead of `path: '/auth/refresh'` |
| **Evidence** | `auth.controller.ts` `setRefreshTokenCookie()` — path is `/auth` |
| **OWASP** | A5:2021 – Security Misconfiguration |
| **Fix** | Change path to `/auth/refresh` or use `path: '/api/auth/refresh'` |
| **Impact** | Cookie sent to all `/auth/*` endpoints, including public ones like `/auth/send-otp`. CSRF amplification risk. |

### BUG-MED-004: Portal Parameter Optional — Bypasses Role Check

| Field | Value |
|---|---|
| **Severity** | MEDIUM |
| **Type** | Logic / Security |
| **Category** | Authentication |
| **Root Cause** | `loginSchema.portal` is optional (`.optional()`) in validation. Login only checks portal when present — if omitted, any account passes. |
| **Evidence** | `auth.validation.ts` portal is optional. `auth.service.ts` `login()` checks `dto.portal` only when truthy. |
| **OWASP** | A1:2021 – Broken Access Control |
| **Fix** | Default `portal` to `'USER'` in validation: `.default('USER')`, skip the optional |
| **Impact** | Admin credentials can authenticate via the user login endpoint without specifying `portal`, bypassing the role mismatch check. |

## Admin

### BUG-ADMIN-001: Login Response Missing Profile Fields

| Field | Value |
|---|---|
| **Severity** | HIGH |
| **Type** | Frontend/Backend Contract Mismatch |
| **Category** | Admin Login |
| **Root Cause** | Login response includes only `{ id, accountNo, roles, membership }` but frontend `mapAccountToAdmin()` expects `name`, `email`, `phone`, `avatar`, `createdAt` |
| **Evidence** | `frontend/src/adapters/auth.adapter.ts` reads `user.name`, `user.email`, `user.phone`, `user.avatar`, `user.createdAt` — all undefined from login response |
| **Fix** | Extend login response to include profile fields, or redirect admin to `GET /auth/me` after login to hydrate |
| **Impact** | Admin dashboard shows empty/null values for admin name, email, join date |

### BUG-ADMIN-002: Admin Module Backend Not Implemented

| Field | Value |
|---|---|
| **Severity** | HIGH |
| **Type** | Architecture |
| **Category** | Admin |
| **Root Cause** | Zero admin controller, service, or route files exist in backend |
| **Evidence** | `backend/src/modules/` has no `admin/` directory. `app.ts` mounts only `authRoutes`. |
| **Fix** | Implement admin module with controllers, services, repositories, routes, mount in `app.ts` |
| **Impact** | All 10 admin frontend pages use stub data. No real admin operations possible. |

### BUG-ADMIN-003: requireRole Guard Never Imported or Used

| Field | Value |
|---|---|
| **Severity** | HIGH |
| **Type** | Security |
| **Category** | Authorization |
| **Root Cause** | `requireRole('ADMIN')` defined in `common/guards/role.guard.ts` but never imported in any route file |
| **Evidence** | Grep for `requireRole` across backend — only found in its definition file |
| **Fix** | Import and apply `requireRole('ADMIN')` to all admin-specific routes when created |
| **Impact** | No route-level authorization enforcement. Any authenticated user could access admin routes. |

### BUG-ADMIN-004: No Admin User in Seed Data

| Field | Value |
|---|---|
| **Severity** | MEDIUM |
| **Type** | Data |
| **Category** | Admin |
| **Root Cause** | `prisma/seed.ts` creates roles (ANON, USER, ADMIN, SUPER_ADMIN) and plans but no admin user account |
| **Evidence** | `prisma/seed.ts` — only seeds roles, plans, counter; no account creation |
| **Fix** | Add seed admin account with known credentials for dev/staging |
| **Impact** | First deployment requires manual database insert to create an admin account |
