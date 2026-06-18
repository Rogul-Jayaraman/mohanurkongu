# Auth Pipeline Implementation Plan

> **For beginners**: This is a planning document — it maps out how the auth
> system was refactored from old code into the current pipeline architecture.
> Useful if you want to understand why things are structured the way they are.

## Overview

This plan converts the existing auth architecture (~85% duplicated between `auth.service.ts` and `admin-auth.service.ts`) into a unified pipeline architecture. It covers backend pipeline core, individual pipelines, controller refactoring, router restructuring, and frontend alignment.

**Key breaking changes:**
1. Registration will stop returning tokens (currently `auth.service.ts:register()` creates a session and sets cookies)
2. `role.guard.ts` changes from `403 AUTH_FORBIDDEN` to `401 AUTH_PORTAL_MISMATCH` for wrong role
3. Auth services become thin wrappers around pipeline calls

---

## Phase 0: Pre-work & Dependency Verification

**Goal**: Confirm all building blocks exist before creating pipelines.

| What | File | Status |
|------|------|--------|
| Argon2 password hashing | `common/utils/crypto.ts` | ✅ Exists |
| JWT 4-token signing/verification | `common/utils/jwt.ts` | ✅ Exists |
| OTP generation + hashing | `common/utils/otp.ts` | ✅ Exists |
| Audit event queue | `common/utils/audit.ts` | ✅ Exists |
| Error codes | `common/errors/ErrorCodes.ts` | ✅ Exists (needs 1-2 additions) |
| Session creation + rotation | `modules/session/session.service.ts` | ✅ Exists |
| Device info extraction | `common/utils/device.ts` | ✅ Exists |
| Account CRUD | `modules/account/*` | ✅ Exists |
| StepIndicator, OTPInput, OtpVerificationModal | `frontend/` | ✅ Exists |
| Membership guard + service | `modules/membership/*` | ✅ Already refactored |

---

## Phase 1: Pipeline Core Infrastructure

### Task 1.1: Create `common/auth/types.ts`

New file. Defines the pipeline context type, step interface, portal config, and capability snapshot types.

```
backend/src/common/auth/types.ts
  - PipelineContext interface
    - account?: Account
    - credential?: AccountCredential
    - input: Record<string, unknown>    // raw DTO
    - roles: string[]
    - tokenVersion: number
    - session?: { accessToken, refreshToken, sessionId }
    - refreshTokenPayload?: RefreshTokenPayload
    - device?: DeviceInfo
    - portal: PortalConfig
    - capabilities?: CapabilitySnapshot
  - StepFunction type: (ctx: PipelineContext) => Promise<PipelineContext>
  - PortalConfig interface: { role: 'USER' | 'ADMIN'; cookiePath: string; refreshPath: string }
  - PORTAL_CONFIGS constant: { USER, ADMIN }
  - CapabilitySnapshot interface (viewDetails enum, openLimit, shortlistLimit, etc.)
```

### Task 1.2: Create `common/auth/Pipeline.ts`

New file. The `PipelineRunner` class that composes steps and manages error handling + audit hooks.

```
PipelineRunner.run(steps[], context)
  - Sequential step execution
  - On step error: wrap in AppError if not already, enqueue audit event
  - Returns mutated PipelineContext
  - Each step receives previous step's output context
```

### Task 1.3: Create `common/utils/cookie.ts`

New file. Cookie helper functions, currently duplicated across 2 controllers.

```
setRefreshCookie(res, refreshToken, cookiePath)
  - cookiePath: '/auth' | '/admin/auth'
  - httpOnly: true, secure: production, sameSite: 'strict'
  - maxAge: 7 days

clearRefreshCookie(res, cookiePath)
```

### Task 1.4: Add missing error codes to `ErrorCodes.ts`

Change file. Add codes not yet present.

```
AUTH_INSUFFICIENT_MEMBERSHIP: 'AUTH_INSUFFICIENT_MEMBERSHIP'
  (for ViewDetails guard, OpenLimit guard, etc.)
```

---

## Phase 2: Pipeline Step Functions

### Task 2.1: Create `common/auth/steps/resolveCredential.step.ts`

Extracts the `resolveCredential` logic currently duplicated in `auth.service.ts:login()` lines 202-214 and `admin-auth.service.ts:login()` lines 20-31.

```
resolveCredential(ctx):
  - Reads ctx.input.identifier
  - Determines email vs phone
  - Calls accountRepo.findCredentialByEmail() or findCredentialByPhone()
  - Sets ctx.credential
  - If not found: enqueue audit event, throw AUTH_INVALID_CREDENTIALS (401)
```

### Task 2.2: Create `common/auth/steps/verifyPassword.step.ts`

Extracts login password verification + failed login tracking.

```
verifyPassword(ctx):
  - Reads ctx.credential.passwordHash + ctx.input.password
  - Calls verifyPassword() from crypto.ts
  - Fails: incrementFailedLogins(), enqueue audit, throw AUTH_INVALID_CREDENTIALS (401)
  - Success: resetFailedLogins()
```

### Task 2.3: Create `common/auth/steps/checkAccountState.step.ts`

Extracts account state checks.

```
checkAccountState(ctx):
  - Reads ctx.credential.account.currentState
  - SUSPENDED → throw AUTH_ACCOUNT_SUSPENDED (403)
  - lockedUntil > now → throw AUTH_ACCOUNT_LOCKED (429)
  - failedLoginCount >= 3 → artificial delay (same as current code)
  - Sets ctx.roles = credential.account.roles.map(r => r.role.code)
  - Sets ctx.tokenVersion = credential.account.tokenVersion
```

### Task 2.4: Create `common/auth/steps/roleGate.step.ts`

Replaces the current `role.guard.ts` logic for login scenarios. The `role.guard.ts` middleware still exists separately for authenticated route protection.

```
roleGate(ctx):
  - Reads ctx.roles + ctx.portal.role
  - If ctx.roles doesn't include ctx.portal.role:
    - throw AUTH_PORTAL_MISMATCH (401)
  - (No modification to context)
```

### Task 2.5: Create `common/auth/steps/resolveCapabilities.step.ts`

Resolves membership capabilities for the context. Called during login and refresh.

```
resolveCapabilities(ctx):
  - Reads ctx.accountId
  - Finds active subscription
  - Builds CapabilitySnapshot (from subscription snapshot fields or FREE defaults)
  - Sets ctx.capabilities
  - (Capabilities not returned in login response — fetched separately by frontend)
```

### Task 2.6: Create `common/auth/steps/createSession.step.ts`

Creates the access + refresh token pair.

```
createSession(ctx):
  - Calls sessionService.createSession(accountId, roles, tokenVersion, device)
  - Sets ctx.session = { accessToken, refreshToken, sessionId }
```

### Task 2.7: Create `common/auth/steps/setRefreshCookie.step.ts`

Sets the httpOnly cookie in the response object.

```
setRefreshCookie(ctx, res):
  - Reads ctx.session.refreshToken + ctx.portal.cookiePath
  - Calls setRefreshCookie(res, refreshToken, cookiePath)
```

### Task 2.8: Create `common/auth/steps/validateVerificationToken.step.ts`

Extracts verification token validation (currently duplicated in `auth.service.ts:register()` and `auth.service.ts:resetPassword()`).

```
validateVerificationToken(ctx, expectedPurpose: 'register' | 'reset_password'):
  - Decodes verificationToken JWT
  - Checks type + purpose
  - Sets ctx.verificationId = payload.sub
```

### Task 2.9: Create `common/auth/steps/hashPassword.step.ts`

Simple step wrapping `hashPassword()` from crypto.ts.

```
hashPassword.step(ctx):
  - Reads ctx.input.password
  - Sets ctx.passwordHash = await hashPassword(password)
```

### Task 2.10: Create `common/auth/steps/accountManagement.steps.ts`

Group of small steps for account creation during registration.

```
checkEmailUniqueness(ctx):
  - Check if credential with this email exists
  - Exists → throw AUTH_EMAIL_EXISTS (409)

createAccount(ctx):
  - Creates account + translations + credential + statusHistory in transaction
  - Sets ctx.accountId

assignRole(ctx, roleCode: 'USER' | 'ADMIN'):
  - Creates AccountRole join record

assignFreeSubscription(ctx):
  - Finds BRONZE plan, creates subscription with snapshot

markRegistrationSessionUsed(ctx):
  - Updates RegistrationSession.usedAt
  - Updates AccountVerification state → ARCHIVED
```

---

## Phase 3: Pipeline Composition

### Task 3.1: Create `common/auth/pipelines/login.pipeline.ts`

```
LoginPipeline:
  Steps (ordered):
    1. resolveCredential
    2. verifyPassword
    3. checkAccountState
    4. roleGate          ← separates USER from ADMIN login
    5. resolveCapabilities
    6. createSession
    7. setRefreshCookie

  Returns: { accessToken, sessionId }
  Also: Sets httpOnly refresh cookie
```

### Task 3.2: Create `common/auth/pipelines/register.pipeline.ts`

```
RegisterPipeline:
  Steps (ordered):
    1. validateVerificationToken(purpose: 'register')
    2. checkEmailUniqueness
    3. hashPassword
    4. createAccount
    5. assignRole('USER')
    6. assignFreeSubscription
    7. markRegistrationSessionUsed
    8. enqueueAuditEvent('REGISTER')

  Returns: { accountId, email }
  ⚠ NO session creation
  ⚠ NO cookies
  ⚠ 201 status
```

**CRITICAL CHANGE**: Current `auth.service.ts:register()` creates a session and returns tokens (lines 178-193). This must be removed. The pipeline returns only `{ accountId, email }`.

The controller must change from:
```typescript
// Current: sets cookie, returns accessToken
sendSuccess(res, { accessToken: result.accessToken, sessionId: result.sessionId }, 201);
```
To:
```typescript
// New: no cookie, no tokens
sendSuccess(res, { accountId: result.accountId, email: result.email }, 201);
```

### Task 3.3: Create `common/auth/pipelines/refresh.pipeline.ts`

```
RefreshPipeline:
  Steps:
    1. validateRefreshToken (reads from cookie)
    2. call SessionService.rotateSession()
    3. setRefreshCookie (with new refreshToken)

  Returns: { accessToken }
```

Note: `SessionService.rotateSession()` already handles reuse detection and atomic revocation. The pipeline wraps it with cookie management.

### Task 3.4: Create `common/auth/pipelines/reset-password.pipeline.ts`

```
ResetPasswordPipeline:
  Steps:
    1. validateVerificationToken(purpose: 'reset_password')
    2. hashPassword
    3. updatePassword (in transaction)
    4. incrementTokenVersion
    5. revokeAllSessions
    6. markResetSessionUsed
    7. enqueueAuditEvent('PASSWORD_RESET')

  Returns: { message }
```

### Task 3.5: Create `common/auth/pipelines/change-password.pipeline.ts`

```
ChangePasswordPipeline:
  Steps:
    1. resolveAccountFromSession (from accessToken in Authorization header)
    2. verifyCurrentPassword
    3. hashPassword
    4. updatePassword (in transaction)
    5. incrementTokenVersion (KEEPS current session)
    6. enqueueAuditEvent('PASSWORD_CHANGED')

  Returns: { message }
```

Note: Unlike reset-password, change-password does NOT revoke sessions. Only the current session survives (other sessions are invalidated by tokenVersion bump).

### Task 3.6: Create `common/auth/pipelines/otp.pipeline.ts`

```
OtpPipeline:
  - Singleton class with send() and verify() methods
  - Both accept purpose: 'register' | 'reset_password'

  send(ctx):
    Steps: rateLimitCheck → accountExistenceCheck → generateOTP
           → hashOTP → saveVerification → sendEmail

  verify(ctx):
    Steps: findVerification → hashAndCompare → checkExpiry
           → markVerified → createVerificationToken
```

---

## Phase 4: Controller Refactoring

### Task 4.1: Refactor `auth.controller.ts`

Replace direct service calls with pipeline calls.

| Current Method | New Implementation |
|---|---|
| `register()` | Calls RegisterPipeline → `sendSuccess(res, { accountId, email }, 201)` — NO cookie, NO tokens |
| `login()` | Calls LoginPipeline(portal: USER) → `sendSuccess(res, { accessToken, sessionId })` |
| `refresh()` | Calls RefreshPipeline → `sendSuccess(res, { accessToken })` |
| `logout()` | Calls `sessionService.revokeSession()` + `clearRefreshCookie(res, '/auth')` |
| `logoutAll()` | Calls `sessionService.revokeAll()` + `clearRefreshCookie(res, '/auth')` |
| `resetPassword()` | Calls ResetPasswordPipeline → `sendSuccess(res, { message })` |
| `changePassword()` | (New) Calls ChangePasswordPipeline → `sendSuccess(res, { message })` |

### Task 4.2: Refactor `admin-auth.controller.ts`

| Current Method | New Implementation |
|---|---|
| `login()` | Calls LoginPipeline(portal: ADMIN) → `sendSuccess(res, { accessToken, accountId, role, sessionId })` |
| `refresh()` | Calls RefreshPipeline → `sendSuccess(res, { accessToken })` |
| `logout()` | Calls `sessionService.revokeSession()` + `clearRefreshCookie(res, '/admin/auth')` |
| `getProfile()` | (Unchanged — delegates to AccountService) |

### Task 4.3: Remove `auth.service.ts` and `admin-auth.service.ts`

After controller refactoring, these services become empty wrappers. Remove them entirely and let controllers call pipelines directly.

Services to remove:
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/auth/auth.policy.ts` (if empty/unused)
- `backend/src/modules/admin-auth/admin-auth.service.ts`

DI in `app.ts` changes:
- Remove `AuthService` and `AdminAuthService` instantiation
- Create `PipelineRunner` and individual pipeline instances
- Pass pipelines to controllers instead of services

---

## Phase 5: Router & Middleware Restructuring

### Task 5.1: Fix `role.guard.ts` to return 401

Current line 17:
```typescript
next(new AppError(403, ErrorCodes.AUTH_FORBIDDEN, ...));
```
Change to:
```typescript
next(new AppError(401, ErrorCodes.AUTH_PORTAL_MISMATCH, ...));
```

**Risk assessment**: This guard is used on:
- `admin-auth.routes.ts:49` — `/admin/account/me` with `requireRole('ADMIN')` ✅ (correct — 401 instead of 403)
- Any other routes using `requireRole()` — check all usages

Let's verify:
- `admin-auth.routes.ts`: `requireRole('ADMIN')` on `/admin/account/me`
- Any admin routes: likely `requireRole('ADMIN')`

If all usages are for ADMIN role enforcement, changing to 401 is correct per pipeline principle. If any route uses `requireRole()` for fine-grained permission checking (e.g., "only MANAGER can delete"), those should stay as 403.

Check all `requireRole` usages to confirm.

### Task 5.2: Restructure routes into three-router composition

Current structure in `app.ts` (lines 322-337):
```typescript
app.use('/', createAuthRoutes(authController));       // public + user
app.use('/', createAccountRoutes(accountController));  // user (has requireSession inside)
app.use('/admin', createAdminAuthRoutes(...));          // admin
app.use('/admin', createAdminAccountRoutes(...));       // admin
```

Target structure:
```
app.ts
├── publicRouter:
│   POST /auth/register
│   POST /auth/login
│   POST /auth/refresh
│   POST /auth/logout
│   POST /auth/registration/otp
│   POST /auth/registration/otp/verify
│   POST /auth/password/otp
│   POST /auth/password/otp/verify
│   POST /auth/password/reset
│   GET  /health, /metrics
│
├── userRouter (requireSession at router level):
│   GET    /account/me
│   PATCH  /account/me
│   POST   /auth/logout-all
│   POST   /auth/password/change
│   GET    /membership/*
│   GET    /profile/*
│   ... user routes
│
└── adminRouter (requireSession + requireRole('ADMIN') at router level):
    POST   /admin/auth/login
    POST   /admin/auth/refresh
    POST   /admin/auth/logout
    GET    /admin/account/me
    ... admin routes
```

Note: `requireSession` already handles `currentState` check and `tokenVersion` match. Adding it at router level means ALL routes under that router are automatically protected. Individual route handlers don't need to worry about auth.

### Task 5.3: Add `change-password` route

Currently missing from routes. Add to auth routes:
```
POST /auth/password/change  (in userRouter, needs requireSession)
```

---

## Phase 6: Frontend Changes

### Task 6.1: Fix `auth.api.ts:register()` return type

```typescript
// Current:
export function register(dto: SignupDto): Promise<LoginResponse>
// Change to:
export function register(dto: SignupDto): Promise<{ accountId: string; email: string }>
```

**No runtime impact** — `SignupFormWrapper.tsx:293` ignores the response body (`await authApi.register(...)` without storing result). Only the TypeScript type needs fixing.

### Task 6.2: (Optional) Optimize `api.ts` refresh endpoint selection

Add module-level `_lastAuthRole` variable:
```typescript
let _lastAuthRole: 'USER' | 'ADMIN' | null = null;
```

Set on login (in `useAuth.tsx` or in the interceptor based on response), use in interceptor to pick refresh endpoint.

### Task 6.3: (Optional) Optimize `useAuth.tsx:restoreSession()`

Cache last known role in `localStorage.setItem('auth_role', role)` on login/restore. On restore, read from localStorage to choose refresh endpoint on first try instead of double-fallback.

---

## Phase 7: Verification & Testing

### Task 7.1: Pipeline unit tests

Create `backend/src/common/auth/__tests__/` with tests for:
- LoginPipeline: all portal configs, error paths, session creation
- RegisterPipeline: returns { accountId, email }, no tokens, 201
- ResetPasswordPipeline: tokenVersion bump, session revocation
- ChangePasswordPipeline: keeps current session, bumps version
- RefreshPipeline: reuse detection, atomic rotation
- OTP pipeline: cooldown, expiry, max attempts

### Task 7.2: Integration tests

Test the full HTTP flow through controllers:
- POST /auth/register → 201, no Set-Cookie, no accessToken in body
- POST /auth/login → 200, Set-Cookie, { accessToken, sessionId }
- POST /auth/login (USER on admin portal) → 401 (not 403)
- POST /admin/auth/login (ADMIN on user portal) → 401
- Cookie path isolation: /auth cookie not sent to /admin/*
- POST /auth/logout → clears cookie, revokes session

### Task 7.3: Frontend verification

- Signup → navigates to login (no auto-login)
- User login → succeeds, redirects to /manamaalai/dashboard
- Admin login → succeeds, redirects to /admin/dashboard
- Token refresh interceptor → retries on 401, falls back to login
- Role mismatch → 401 → interceptor → refresh fails → redirect to login

---

## Dependency Order

```
Phase 0 (Verify deps)
  │
  ▼
Phase 1 (Core types, PipelineRunner, cookie utils)
  │
  ▼
Phase 2 (Individual steps — can be parallelized)
  ├── resolveCredential.step.ts
  ├── verifyPassword.step.ts
  ├── checkAccountState.step.ts
  ├── roleGate.step.ts
  ├── resolveCapabilities.step.ts
  ├── createSession.step.ts
  ├── setRefreshCookie.step.ts
  ├── validateVerificationToken.step.ts
  ├── hashPassword.step.ts
  └── accountManagement.steps.ts
  │
  ▼
Phase 3 (Pipeline composition)
  ├── login.pipeline.ts    ← depends on steps 2.1-2.7
  ├── register.pipeline.ts ← depends on steps 2.8-2.10
  ├── refresh.pipeline.ts  ← depends on steps 2.6-2.7
  ├── reset-password.pipeline.ts
  ├── change-password.pipeline.ts
  └── otp.pipeline.ts
  │
  ▼
Phase 4 (Controller + DI refactoring)
  ├── Refactor auth.controller.ts
  ├── Refactor admin-auth.controller.ts
  ├── Remove auth.service.ts
  ├── Remove admin-auth.service.ts
  └── Update app.ts DI
  │
  ▼
Phase 5 (Router restructuring)
  ├── Fix role.guard.ts 401
  ├── Create three-router composition
  └── Add change-password route
  │
  ▼
Phase 6 (Frontend changes)
  ├── Fix auth.api.ts register return type
  ├── (Optional) api.ts _lastAuthRole
  └── (Optional) useAuth.tsx localStorage cache
  │
  ▼
Phase 7 (Testing)
  ├── Pipeline unit tests
  ├── Integration tests
  └── Frontend verification
```

---

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|------------|------------|
| Registration returning tokens → frontend expected auto-login | HIGH | LOW | Already verified frontend ignores response and navigates to login |
| `role.guard.ts` 403→401 affects non-auth routes | MEDIUM | LOW | Check all `requireRole()` usages; permission guards use different code |
| Cookie path change breaks existing sessions | LOW | LOW | Old cookies expire naturally (7d TTL); no existing production traffic |
| Pipeline introduces regression in edge cases | MEDIUM | MEDIUM | Step-by-step unit tests matching pipeline doc edge case tables |
| `SessionService.rotateSession()` already handles reuse detection — double wrapping | LOW | LOW | Pipeline just delegates; no logic duplication |

---

## Files to Create

```
backend/src/common/auth/
  types.ts
  Pipeline.ts
  pipelines/
    login.pipeline.ts
    register.pipeline.ts
    refresh.pipeline.ts
    reset-password.pipeline.ts
    change-password.pipeline.ts
    otp.pipeline.ts
  steps/
    resolveCredential.step.ts
    verifyPassword.step.ts
    checkAccountState.step.ts
    roleGate.step.ts
    resolveCapabilities.step.ts
    createSession.step.ts
    setRefreshCookie.step.ts
    validateVerificationToken.step.ts
    hashPassword.step.ts
    accountManagement.steps.ts

backend/src/common/utils/
  cookie.ts
```

## Files to Modify

```
backend/src/common/errors/ErrorCodes.ts          — add AUTH_INSUFFICIENT_MEMBERSHIP
backend/src/common/guards/role.guard.ts           — 403→401
backend/src/modules/auth/auth.controller.ts       — delegate to pipelines
backend/src/modules/auth/auth.routes.ts           — fix register route, add change-password
backend/src/modules/admin-auth/admin-auth.controller.ts  — delegate to pipelines
backend/src/modules/admin-auth/admin-auth.routes.ts      — fix role guard
backend/src/app.ts                                — DI changes, three-router
frontend/src/api/auth.api.ts                      — fix register() return type
```

## Files to Remove

```
backend/src/modules/auth/auth.service.ts
backend/src/modules/admin-auth/admin-auth.service.ts
```

## Files to Keep Unchanged

```
backend/src/modules/session/session.service.ts    — already handles rotation + reuse
backend/src/common/utils/crypto.ts                — already exists
backend/src/common/utils/jwt.ts                   — already exists
backend/src/common/utils/otp.ts                   — already exists
backend/src/common/utils/audit.ts                 — already exists
backend/src/common/middleware/requireAuth.ts       — requireSession already correct
frontend/src/hooks/useAuth.tsx                     — already aligned
frontend/src/lib/api.ts                           — already aligned
frontend/src/adapters/auth.adapter.ts             — already aligned
frontend/src/components/**                        — already aligned
```

## Effort Estimate

| Phase | Files | Estimated Effort |
|-------|-------|-----------------|
| Phase 1: Core types + utils | 3 new files | 1-2 hours |
| Phase 2: Individual steps | 10 new files | 3-4 hours |
| Phase 3: Pipeline composition | 6 new files | 2-3 hours |
| Phase 4: Controller refactoring | 4 modified, 2 removed | 2-3 hours |
| Phase 5: Router restructuring | 2 modified | 1-2 hours |
| Phase 6: Frontend changes | 1 modified | 0.5 hours |
| Phase 7: Testing | ~10 test files | 3-4 hours |
| **Total** | **~35 files** | **~16-20 hours** |
