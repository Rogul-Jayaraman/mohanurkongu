# Login Pipeline

> **For beginners**: When you log in, your email and password go through 7
> checkpoints. Each does exactly one thing: find your account, check for
> lockout, verify password, etc. If any step fails, you get a clear error.
> This doc walks through every step with diagrams.

## Purpose

Authenticate a user by email or phone, verify their password, check account state, detect lockout, apply a role gate (USER vs ADMIN), and issue a session (access + refresh tokens). This single pipeline replaces both `AuthService.login()` and `AdminAuthService.login()` — the only difference is the portal configuration that controls the role gate.

## High-Level Architecture

```
                    ┌──────────────────┐
                    │   POST /auth     │
                    │   /login         │
                    │   (or /admin/    │
                    │    auth/login)   │
                    └────────┬─────────┘
                             │
                             ▼
               ┌─────────────────────────┐
               │   LoginPipeline         │
               │   (orchestrator)        │
               └──────────┬──────────────┘
                          │
             ┌────────────┼────────────┬──────────────┐
             ▼            ▼            ▼              ▼
      ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
      │ Step 1:  │ │ Step 2:  │ │ Step 3:  │ │   Step 4:    │
      │Resolve   │→│Check     │→│Check     │→│  Verify      │
      │Credential│ │Account   │ │Lockout   │ │  Password    │
      │          │ │State     │ │          │ │              │
      └──────────┘ └──────────┘ └──────────┘ └──────┬───────┘
                                                     │
             ┌──────────────┐ ┌──────────┐ ┌────────▼───────┐
             │   Step 7:    │ │ Step 6:  │ │   Step 5:      │
             │  Create      │←│ Role     │←│  Track         │
             │  Session     │ │ Gate     │ │  Login (reset  │
             │              │ │          │ │  failed count) │
             └──────┬───────┘ └──────────┘ └────────────────┘
                    │
                    ▼
          ┌─────────────────────┐
          │  { accessToken,     │
          │    refreshToken,    │
          │    accountId,       │
          │    role,            │
          │    sessionId }      │
          └─────────────────────┘
```

## Low-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Client                          Controller              Pipeline               │
│                                                         Steps                  │
│  POST /auth/login               AuthController          LoginPipeline          │
│  { identifier, password }        .login()               .execute(ctx)         │
│         │                            │                      │                  │
│         │                            │                      ▼                  │
│         │                            │              ┌─────────────────┐        │
│         │                            │              │ resolveCredential│        │
│         │                            │              │                 │        │
│         │                            │     ┌────────┤ Input: ctx.dto   │        │
│         │                            │     │        │ identifier        │        │
│         │                            │     │        ├─────────────────┤        │
│         │                            │     │        │ Output: ctx.      │        │
│         │                            │     │        │ credential +      │        │
│         │                            │     │        │ account           │        │
│         │                            │     │        └────────┬────────┘        │
│         │                            │     │                 │                  │
│         │                            │     │                 ▼                  │
│         │                            │     │        ┌─────────────────┐        │
│         │                            │     │        │checkAccountState│        │
│         │                            │     │        │                 │        │
│         │                            │     │        │ Checks:         │        │
│         │                            │     │        │ currentState ≠  │        │
│         │                            │     │        │ SUSPENDED       │        │
│         │                            │     │        │                 │        │
│         │                            │     │        │ Throws: 403     │        │
│         │                            │     │        │ if suspended    │        │
│         │                            │     │        └────────┬────────┘        │
│         │                            │     │                 │                  │
│         │                            │     │                 ▼                  │
│         │                            │     │        ┌─────────────────┐        │
│         │                            │     │        │  checkLockout   │        │
│         │                            │     │        │                 │        │
│         │                            │     │        │ Checks:         │        │
│         │                            │     │        │ lockedUntil >   │        │
│         │                            │     │        │ now             │        │
│         │                            │     │        ├─────────────────┤        │
│         │                            │     │        │ If failedLogin  │        │
│         │                            │     │        │ ≥ 3, apply      │        │
│         │                            │     │        │ progressive     │        │
│         │                            │     │        │ delay           │        │
│         │                            │     │        ├─────────────────┤        │
│         │                            │     │        │ Throws: 429     │        │
│         │                            │     │        │ if locked      │        │
│         │                            │     │        └────────┬────────┘        │
│         │                            │     │                 │                  │
│         │                            │     │                 ▼                  │
│         │                            │     │        ┌─────────────────┐        │
│         │                            │     │        │  verifyPassword │        │
│         │                            │     │        │                 │        │
│         │                            │     │        │ Input:          │        │
│         │                            │     │        │  plaintext      │        │
│         │                            │     │        │  passwordHash   │        │
│         │                            │     │        ├─────────────────┤        │
│         │                            │     │        │ On fail:        │        │
│         │                            │     │        │  incr failed    │        │
│         │                            │     │        │  logins         │        │
│         │                            │     │        │  (lockout if    │        │
│         │                            │     │        │   exceeded)     │        │
│         │                            │     │        ├─────────────────┤        │
│         │                            │     │        │ Throws: 401     │        │
│         │                            │     │        │ if invalid      │        │
│         │                            │     │        └────────┬────────┘        │
│         │                            │     │                 │                  │
│         │                            │     │                 ▼                  │
│         │                            │     │        ┌─────────────────┐        │
│         │                            │     │        │  trackLogin     │        │
│         │                            │     │        │                 │        │
│         │                            │     │        │ Resets failed   │        │
│         │                            │     │        │ login count     │        │
│         │                            │     │        ├─────────────────┤        │
│         │                            │     │        │ Emits audit:    │        │
│         │                            │     │        │ LOGIN_SUCCESS   │        │
│         │                            │     │        └────────┬────────┘        │
│         │                            │     │                 │                  │
│         │                            │     │                 ▼                  │
│         │                            │     │        ┌─────────────────┐        │
│         │                            │     │        │   roleGate      │        │
│         │                            │     │        │                 │        │
│         │                            │     │        │ Checks:         │        │
│         │                            │     │        │ Portal config:  │        │
│         │                            │     │        │ USER portal     │        │
│         │                            │     │        │ → needs USER    │        │
│         │                            │     │        │ ADMIN portal    │        │
│         │                            │     │        │ → needs ADMIN   │        │
│         │                            │     │        ├─────────────────┤        │
│         │                            │     │        │ Throws: 401     │        │
│         │                            │     │        │ on mismatch     │        │
│         │                            │     │        └────────┬────────┘        │
│         │                            │     │                 │                  │
│         │                            │     │                 ▼                  │
│         │                            │     │        ┌─────────────────┐        │
│         │                            │     │        │ validateSession │        │
│         │                            │     │        │                 │        │
│         │                            │     │        │ Calls           │        │
│         │                            │     │        │ SessionService  │        │
│         │                            │     │        │ .createSession  │        │
│         │                            │     │        ├─────────────────┤        │
│         │                            │     │        │ Output: ctx.    │        │
│         │                            │     │        │ tokens           │        │
│         │                            │     │        └────────┬────────┘        │
│         │                            │     │                 │                  │
│         │                            │     └─────────────────┘                  │
│         │                            │                      │                  │
│         │                            │◄─────────────────────┘                  │
│         │◄───────────────────────────┘                                        │
│         │                                                                      │
│  ← { accessToken,                           Sets refreshToken                  │
│      refreshToken (cookie),                  as httpOnly cookie                │
│      sessionId }                             on path: /auth or /admin/auth     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Pipeline Steps Detail

### Step 1: `resolveCredential`

```
Input:  ctx.dto.identifier (email or phone string)
Output: ctx.credential (full credential row + account + roles)
        ctx.account (shortcut to credential.account)

Logic:
  - If identifier contains '@' → findCredentialByEmail(lowercased)
  - Else → findCredentialByPhone(identifier)
  - If not found → audit(LOGIN_FAILED, reason: account_not_found), throw 401
```

**Edge Cases:**
- Trailing whitespace in identifier → handle at validation layer, not here
- Case-insensitive email lookup → always lowercase
- Phone format normalization → handled in dto validation
- Account exists but credential doesn't (shouldn't happen, FK ensures 1:1) → treat as not found

### Step 2: `checkAccountState`

```
Input:  ctx.credential.account.currentState
Output: none (throws on SUSPENDED)

Logic:
  - if account.currentState === 'SUSPENDED' → audit(LOGIN_FAILED, reason: suspended), throw 403
```

**Edge Cases:**
- New ACTIVE accounts pass through
- Only SUSPENDED state blocks; other states (ACTIVE) proceed
- State changes between DB read and token issue → unlikely, acceptable race

### Step 3: `checkLockout`

```
Input:  ctx.credential.lockedUntil, failedLoginCount
Output: none (throws on lockout, applies progressive delay)

Logic:
  - if lockedUntil > now → throw 429 AUTH_ACCOUNT_LOCKED
  - if failedLoginCount >= 3 →
      delay = (failedLoginCount - 3) * 500ms (progressive delay)
      await sleep(delay)
  - Otherwise → pass through
```

**Edge Cases:**
- Lockout threshold: 3 failed attempts → locked. Reset on successful login.
- Progressive delay is an anti-timing-attack measure, not a lockout mechanism
- `lockedUntil` is set separately (typically after N consecutive failures beyond threshold, configured in account repo)
- Session cleanup may unlock automatically

### Step 4: `verifyPassword`

```
Input:  ctx.credential.passwordHash, ctx.dto.password (plaintext)
Output: ctx.passwordValid (boolean, or throws)

Logic:
  - verifyPassword(credential.passwordHash, dto.password) using argon2
  - If invalid →
      incrementFailedLogins(credential.accountId, credential.failedLoginCount)
      audit(LOGIN_FAILED, reason: invalid_password)
      throw 401 AUTH_INVALID_CREDENTIALS
  - If valid → continue
```

**Edge Cases:**
- Empty passwordHash (unlikely, but schema allows?) → `verifyPassword('', dto.password)` returns false, normal fail path
- Argon2 parameters configurable via env: `ARGON2_MEMORY`, `ARGON2_ITERATIONS`, `ARGON2_PARALLELISM`
- Timing-safe comparison is built into argon2 library

### Step 5: `trackLogin`

```
Input:  ctx.credential.accountId
Output: ctx.auditEvent (emitted)

Logic:
  - resetFailedLogins(credential.accountId)
  - enqueueAuditEvent(LOGIN_SUCCESS, credential.accountId, { device })
```

### Step 6: `roleGate`

```
Input:  ctx.credential.account.roles (Role[] from join table)
        ctx.portal ('user' | 'admin' — from route config)
Output: ctx.role ('USER' | 'ADMIN')
        ctx.roles (string[]) — all account roles

Logic:
  - Map roles to role codes: const roles = credential.account.roles.map(r => r.role.code)
  - If portal === 'user':
      if roles doesn't include 'USER' → throw 401 AUTH_PORTAL_MISMATCH
      ctx.role = 'USER'
  - If portal === 'admin':
      if roles doesn't include 'ADMIN' → throw 401 AUTH_PORTAL_MISMATCH
      ctx.role = 'ADMIN'
  - ctx.roles = roles (full list, for JWT embedding)
```

**Edge Cases:**
- Account with BOTH roles → works in either portal, role is determined by which login endpoint was used
- Account with NEITHER role → impossible (registration always assigns USER); but treated as 401
- Role check was previously 403 → **now 401** to prevent information leakage
- The JWT always contains ALL roles (e.g., `["USER", "ADMIN"]`), even if logged into a specific portal

### Step 7: `validateSession`

```
Input:  ctx.account.id, ctx.roles, ctx.account.tokenVersion
        ctx.dto.fingerprint (optional DeviceInfo)
Output: ctx.tokens.accessToken, ctx.tokens.refreshToken, ctx.tokens.sessionId

Logic:
  - Call SessionService.createSession(accountId, roles, tokenVersion, device)
  - Returns { accessToken, refreshToken, sessionId }
```

**Edge Cases:**
- TokenVersion changes between route read and session create → unlikely, acceptable
- Max active sessions exceeded → oldest session is auto-revoked inside `createSession`
- Session creation uses `crypto.randomUUID()` for JTI and tokenFamily → collisions negligible

## Portal Configuration

The login pipeline receives a `portal` parameter:

```
LoginPipeline.execute(dto, { portal: 'user' })
LoginPipeline.execute(dto, { portal: 'admin' })
```

This controls:
- Which rate limiter is applied (20 req/min for user, 10 req/min for admin)
- The role gate check (requires USER vs ADMIN)
- The cookie path (`/auth` vs `/admin/auth`)

The pipeline itself is role-agnostic; only the `roleGate` step branches on portal.

## Error Scenarios

| Scenario | Step | HTTP | Code | Message |
|----------|------|------|------|---------|
| Email not registered | resolveCredential | 401 | AUTH_INVALID_CREDENTIALS | Generic error |
| Wrong password | verifyPassword | 401 | AUTH_INVALID_CREDENTIALS | Generic error (same as above) |
| Account suspended | checkAccountState | 403 | AUTH_ACCOUNT_SUSPENDED | Account is suspended |
| Account locked | checkLockout | 429 | AUTH_ACCOUNT_LOCKED | Too many attempts |
| USER in admin portal | roleGate | 401 | AUTH_PORTAL_MISMATCH | Unauthorized |
| ADMIN in user portal | roleGate | 401 | AUTH_PORTAL_MISMATCH | Unauthorized |
| Rate limit exceeded | (middleware) | 429 | RATE_LIMIT_EXCEEDED | Too many requests |

## Audit Events

| Event | Payload | When |
|-------|---------|------|
| `LOGIN_FAILED` | `{ identifier, reason: 'account_not_found' }` | Credential not found |
| `LOGIN_FAILED` | `{ reason: 'suspended' }` | Account suspended |
| `LOGIN_FAILED` | `{ reason: 'locked' }` | Account locked |
| `LOGIN_FAILED` | `{ reason: 'invalid_password' }` | Wrong password |
| `LOGIN_SUCCESS` | `{ device: fingerprint }` | Successful login |

## Testing Considerations

- **Parametric login test**: Test the pipeline with both email and phone identifiers
- **Progressive delay test**: Verify timing increases with failed attempts >= 3
- **Lockout state test**: Lock account, verify 429, verify unlock after lockout period
- **Role gate test**: Verify ADMIN in user portal returns 401, USER in admin portal returns 401, dual-role account works in both
- **Session limit test**: Exceed `maxActive` sessions, verify oldest is revoked
- **Concurrent login test**: Multiple simultaneous logins should not cause data races
- **Edge: Bcrypt-to-Argon2 migration**: Ensure old hashes still verify (if migration is in progress)

## Performance Characteristics

| Aspect | Expected |
|--------|----------|
| P50 latency | ~50ms (argon2 verify is CPU-bound, ~30ms) |
| P99 latency | ~200ms (with progressive delay at high fail counts) |
| DB queries | 1 (findCredential) + 1 on write (resetFailedLogins) |
| External calls | 1 (argon2 verify) |
| Session create | 1 write + 1 count query |
