# Auth Pipelines — Architecture Documentation

> **For beginners**: This page is the table of contents for all auth-related
> pipelines below. Each doc explains one operation (login, register, OTP,
> etc.) with diagrams and step-by-step details.

## Overview

The Mohanurkongu backend uses a **pipeline architecture** for authentication, authorization, and membership flows. Each pipeline is a linear sequence of composable steps, where each step receives a context object and returns a mutated context. This eliminates the ~85% code duplication previously shared between `auth.service.ts` (user login) and `admin-auth.service.ts` (admin login), standardizes error handling, and makes auth flows auditable and extensible.

## Architecture Principles

1. **Single Responsibility per Step** — Each step function does exactly one thing (e.g., `resolveCredential`, `verifyPassword`, `roleGate`). Steps are pure functions with no side effects beyond their return value and thrown errors.

2. **Context Object** — All pipeline steps share a typed `PipelineContext` that accumulates data as it flows through steps. Steps add properties, check properties set by previous steps, and throw `AppError` on failure.

3. **Role Autonomy** — Role enforcement is embedded in the login pipeline's `roleGate` step. The router composition in `app.ts` is the second enforcement layer: three routers (`publicRouter`/`userRouter`/`adminRouter`) with middleware applied at the router level, not per-route. No route handler needs to manually check roles.

4. **401 Not 403 on Role Mismatch** — When a USER tries `/admin/*` or an ADMIN tries `/users/*`, the response is `401 "Unauthorized"` (not `403 "Forbidden"`). This prevents leaking account existence or role information.

5. **Registration Produces No Tokens** — `RegisterPipeline` returns only `{ accountId, email }` with HTTP 201. The frontend redirects to the login page after successful registration. No access/refresh tokens are issued.

6. **Capability Snapshot Pattern** — Membership capabilities are resolved into a typed snapshot at login and cached per-request. Guard checks consume the snapshot rather than querying the database each time.

## Pipeline Index

| Pipeline | File | Description |
|----------|------|-------------|
| [Login Pipeline](login-pipeline.md) | `auth/pipeline/login.pipeline.ts` | Authenticates credentials, applies role gate (USER/ADMIN), issues session |
| [Register Pipeline](register-pipeline.md) | `auth/pipeline/register.pipeline.ts` | Validates verification token, creates account + credential + role + free subscription |
| [Forgot/Reset Password Pipeline](reset-password-pipeline.md) | `auth/pipeline/reset-password.pipeline.ts` | Validates reset token, updates password, bumps token version, revokes all sessions |
| [Change Password Pipeline](change-password-pipeline.md) | `auth/pipeline/change-password.pipeline.ts` | Validates current password, updates password, bumps token version (keeps current session) |
| [Token Refresh Pipeline](refresh-pipeline.md) | `auth/pipeline/refresh.pipeline.ts` | Verifies refresh token, checks account state, atomic rotation with reuse detection |
| [OTP Pipeline](otp-pipeline.md) | `auth/pipeline/otp.pipeline.ts` | Sends and verifies OTP for registration and password reset flows |
| [Membership Pipeline](membership-pipeline.md) | `membership/pipeline/membership.pipeline.ts` | Resolves capabilities, assigns/cancels/reverts subscriptions |

## Shared Building Blocks

All pipelines consume these shared utilities:

| Utility | File | Purpose |
|---------|------|---------|
| `SessionService.createSession` | `session/session.service.ts` | Issues access + refresh token pair, persists session |
| `SessionService.rotateSession` | `session/session.service.ts` | Atomic token rotation with reuse detection |
| `JWT helpers` | `common/utils/jwt.ts` | Sign/verify 4 token types (access, refresh, verification, reset) |
| `Crypto helpers` | `common/utils/crypto.ts` | `hashPassword` / `verifyPassword` (argon2) |
| `OTP helpers` | `common/utils/otp.ts` | `generateOTP` / `hashOTP` |
| `Cookie helpers` | `common/utils/cookie.ts` | `setRefreshCookie` / `clearRefreshCookie` |
| `Rate Limiter` | `common/middleware/rateLimiter.ts` | Unified `createRateLimiter` factory |
| `Audit helper` | `common/utils/audit.ts` | `enqueueAuditEvent` for all security events |

## Error Code Reference

Auth pipelines use these error codes (defined in `common/errors/ErrorCodes.ts`):

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `AUTH_INVALID_CREDENTIALS` | 401 | Email/phone or password wrong |
| `AUTH_ACCOUNT_SUSPENDED` | 403 | Account is suspended |
| `AUTH_ACCOUNT_LOCKED` | 429 | Account temporarily locked (failed attempts) |
| `AUTH_UNAUTHORIZED` | 401 | No valid session |
| `AUTH_SESSION_EXPIRED` | 401 | Session has expired |
| `AUTH_TOKEN_INVALID` | 401 | Invalid or malformed token |
| `AUTH_TOKEN_REUSE` | 401 | Refresh token reuse detected |
| `AUTH_REGISTRATION_SESSION_INVALID` | 400 | Registration token expired/used |
| `AUTH_RESET_SESSION_INVALID` | 400 | Reset token expired/used |
| `AUTH_PORTAL_MISMATCH` | 401 | Role does not match portal (was 403, now 401) |
| `AUTH_OTP_COOLDOWN` | 429 | Too soon to resend OTP |
| `AUTH_OTP_EXPIRED` | 410 | OTP has expired |
| `AUTH_OTP_INVALID` | 400 | Wrong OTP |
| `AUTH_OTP_MAX_ATTEMPTS` | 429 | Too many failed OTP attempts |
| `AUTH_OTP_ALREADY_USED` | 400 | OTP already consumed |
| `RATE_LIMIT_EXCEEDED` | 429 | Global or endpoint rate limit hit |
| `AUTH_EMAIL_EXISTS` | 409 | Email already registered |
| `AUTH_PHONE_EXISTS` | 409 | Phone already registered |

## Key Database Schema (Prisma)

The auth system relies on these core models:

- **Account** — `id`, `accountNo`, `currentState` (ACTIVE/SUSPENDED), `tokenVersion`
- **AccountCredential** — `accountId`, `email`, `phone`, `passwordHash`, `failedLoginCount`, `lockedUntil`, `emailVerified`, `phoneVerified`
- **AccountRole** — `accountId`, `roleId` (join table, supports multiple roles)
- **Role** — `id`, `code` (USER/ADMIN)
- **AccountSession** — `id`, `accountId`, `refreshTokenHash`, `tokenFamily`, `tokenVersion`, `ipHash`, `userAgentHash`, `deviceFingerprint`, `expiresAt`, `revokedAt`, `revokedReason`
- **RegistrationSession** — `id`, `verificationId`, `snapshotTarget`, `expiresAt`, `usedAt`
- **ResetSession** — `id`, `verificationId`, `snapshotTarget`, `expiresAt`, `usedAt`
- **AccountVerification** — `id`, `type` (EMAIL/PHONE), `target`, `purpose` (REGISTER/RESET_PASSWORD), `otpHash`, `state` (PENDING/VERIFIED/EXPIRED/CANCELLED/ARCHIVED), `expiresAt`, `attempts`, `maxAttempts`
- **Subscription** — `id`, `accountId`, `planId`, `status`, `startedAt`, `expiresAt`, `snapshotPlanCode`, `snapshotPlanName`, `snapshotOpenLimit`, `snapshotShortlistLimit`, `snapshotProfileSlotLimit`, `snapshotViewDetails`, etc.
- **MembershipUsage** — `accountId`, `openUsed`

## Three-Router Composition

```
app.ts
├── publicRouter (port 0 — no guards)
│   ├── POST /auth/register
│   ├── POST /auth/login
│   ├── POST /auth/refresh
│   ├── POST /auth/logout
│   ├── POST /auth/registration/otp
│   ├── POST /auth/registration/otp/verify
│   ├── POST /auth/password/otp
│   ├── POST /auth/password/otp/verify
│   ├── POST /auth/password/reset
│   └── GET  /health, /metrics, /media/by-token/*
│
├── userRouter (port 1 — requireSession applied globally)
│   ├── GET    /account/me
│   ├── PATCH  /account/me
│   ├── POST   /auth/logout-all
│   ├── POST   /auth/password/change
│   ├── GET    /membership/plans
│   ├── GET    /membership/my-subscription
│   ├── GET    /membership/capabilities
│   ├── GET    /membership/billing-overview
│   ├── GET    /profile/*
│   ├── POST   /profile/*
│   ├── PATCH  /profile/*
│   ├── DELETE /upload/*
│   ├── POST   /upload/*
│   ├── GET    /horoscope/*
│   └── ... user-facing routes
│
└── adminRouter (port 2 — requireSession + requireRole('ADMIN') applied globally)
    ├── POST   /admin/auth/login
    ├── POST   /admin/auth/refresh
    ├── POST   /admin/auth/logout
    ├── GET    /admin/account/me
    ├── GET    /admin/users/*
    ├── PATCH  /admin/membership/plans/*
    ├── GET    /admin/membership/settings
    ├── POST   /admin/membership/subscriptions
    ├── GET    /admin/dashboard/*
    ├── GET    /admin/profiles/*
    ├── POST   /admin/profiles/verify
    ├── GET    /admin/analytics/*
    └── ... admin routes
```
