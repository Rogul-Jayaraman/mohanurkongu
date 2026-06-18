# Forgot/Reset Password Pipeline

> **For beginners**: Forgot your password? After OTP verification, this
> lets you set a new one. It also logs you out of all devices by revoking
> every session — a security measure in case someone else has your password.

## Purpose

Allow an unauthenticated user to reset their password using a reset token obtained after OTP verification. The pipeline validates the reset token, finds the associated account, checks account state, updates the password hash, increments `tokenVersion` (revoking all existing sessions), and consumes the reset session.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Two-Phase Flow:                                                                │
│                                                                                  │
│  Phase 1: Request OTP + Verify OTP (see OTP Pipeline)                           │
│  ┌─────────────────┐     ┌──────────────────┐     ┌──────────────────────────┐  │
│  │ POST /auth/     │     │ POST /auth/      │     │ { resetToken }           │  │
│  │ password/otp   │────→│ password/otp/    │────→│ (JWT, 15min expiry)       │  │
│  │ { email }       │     │ verify            │     │                          │  │
│  └─────────────────┘     │ { email, otp }   │     └──────────────────────────┘  │
│                          └──────────────────┘                                  │
│                                                                                 │
│  Phase 2: Reset Password (this pipeline)                                       │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  POST /auth/password/reset  { resetToken, password }                     │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## High-Level Architecture (Pipeline)

```
                    ┌──────────────────┐
                    │  POST /auth/     │
                    │  password/reset  │
                    │  { resetToken,   │
                    │    password }    │
                    └────────┬─────────┘
                             │
                             ▼
               ┌─────────────────────────┐
               │  ResetPasswordPipeline  │
               │  (1 transaction)        │
               └──────────┬──────────────┘
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
      ┌──────────┐ ┌──────────┐ ┌──────────────┐
      │Step 1:   │ │Step 2:   │ │   Step 3:    │
      │Validate  │→│Find Reset│→│  Verify      │
      │Reset     │ │Session   │ │  Credential  │
      │Token     │ │(valid &  │ │  (email      │
      │          │ │unused)   │ │  lookup)     │
      └──────────┘ └──────────┘ └──────┬───────┘
                                       │
               ┌────────────┐ ┌────────▼───────┐
               │  Step 6:   │ │   Step 5:      │
               │  Consume   │←│  Update        │
               │  Reset     │ │  Password +    │
               │  Session   │ │  Bump Token    │
               │             │ │  Version +     │
               └────────────┘ │  Revoke All    │
                              │  Sessions      │
                              └────────────────┘
```

## Low-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Client                    Controller              Pipeline                     │
│                                                   Steps                        │
│ POST /auth/password/reset AuthController          ResetPasswordPipeline         │
│ {                          .resetPassword()       .execute(ctx)                │
│   resetToken,                                     (in $transaction)            │
│   password                 │                       │                            │
│ }                          │                       ▼                            │
│    │                       │              ┌──────────────────┐                  │
│    │                       │              │validateResetToken│                  │
│    │                       │              │                  │                  │
│    │                       │              │ verifyResetToken │                  │
│    │                       │              │ (JWT)            │                  │
│    │                       │              ├──────────────────┤                  │
│    │                       │              │ Check: type ===  │                  │
│    │                       │              │ 'reset' AND      │                  │
│    │                       │              │ purpose ===      │                  │
│    │                       │              │ 'reset_password' │                  │
│    │                       │              ├──────────────────┤                  │
│    │                       │              │ Throws: 400 if   │                  │
│    │                       │              │ invalid/expired  │                  │
│    │                       │              └────────┬─────────┘                  │
│    │                       │                       │                            │
│    │                       │                       ▼                            │
│    │                       │              ┌──────────────────┐                  │
│    │                       │              │ findResetSession │                  │
│    │                       │              │                  │                  │
│    │                       │              │ WHERE             │                  │
│    │                       │              │ verificationId = │                  │
│    │                       │              │ sub AND usedAt   │                  │
│    │                       │              │ IS NULL AND      │                  │
│    │                       │              │ expiresAt > now   │                  │
│    │                       │              ├──────────────────┤                  │
│    │                       │              │ Throws: 400 if   │                  │
│    │                       │              │ not found        │                  │
│    │                       │              └────────┬─────────┘                  │
│    │                       │                       │                            │
│    │                       │                       ▼                            │
│    │                       │              ┌──────────────────┐                  │
│    │                       │              │ findCredential   │                  │
│    │                       │              │                  │                  │
│    │                       │              │ Finds credential │                  │
│    │                       │              │ by email (from   │                  │
│    │                       │              │ resetSession.    │                  │
│    │                       │              │ snapshotTarget)  │                  │
│    │                       │              │ with account     │                  │
│    │                       │              ├──────────────────┤                  │
│    │                       │              │ Throws: 400 if   │                  │
│    │                       │              │ not found        │                  │
│    │                       │              │ Throws: 403 if   │                  │
│    │                       │              │ suspended        │                  │
│    │                       │              └────────┬─────────┘                  │
│    │                       │                       │                            │
│    │                       │                       ▼                            │
│    │                       │              ┌──────────────────┐                  │
│    │                       │              │ TRANSACTION:     │                  │
│    │                       │              │                  │                  │
│    │                       │              │ 1. hashPassword  │                  │
│    │                       │              │ 2. Update        │                  │
│    │                       │              │ credential       │                  │
│    │                       │              │ passwordHash     │                  │
│    │                       │              │ 3. Increment     │                  │
│    │                       │              │ account.         │                  │
│    │                       │              │   tokenVersion   │                  │
│    │                       │              │ 4. Revoke all    │                  │
│    │                       │              │ sessions         │                  │
│    │                       │              │    (revokedAt+   │                  │
│    │                       │              │     reason:      │                  │
│    │                       │              │    'password_    │                  │
│    │                       │              │     reset')      │                  │
│    │                       │              │ 5. Mark reset    │                  │
│    │                       │              │   session usedAt │                  │
│    │                       │              │                  │                  │
│    │                       │              └────────┬─────────┘                  │
│    │                       │                       │                            │
│    │                       │◄──────────────────────┘                            │
│    │◄──────────────────────┘                                                    │
│    │                                                                           │
│ ← { message: "Password    No cookies cleared (already logged out               │
│     reset successfully" } by tokenVersion bump)                                │
│    HTTP 200                                                                    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Pipeline Steps Detail

### Step 1: `validateResetToken`

```
Input:  ctx.dto.resetToken
Output: ctx.resetPayload.sub (verification record ID)
        ctx.resetPayload.purpose

Logic:
  - verifyResetToken(dto.resetToken) — JWT verify with reset secret
  - Check: payload.type === 'reset' && payload.purpose === 'reset_password'
  - If invalid/expired → throw 400 AUTH_RESET_SESSION_INVALID
```

**Edge Cases:**
- Token signed with verification secret (wrong token type) → JWT verify throws
- Token expired → JWT verify throws
- Token used for registration (shouldn't be possible, different sign function) → type/purpose mismatch → 400

### Step 2: `findResetSession`

```
Input:  ctx.resetPayload.sub (verificationId)
Output: ctx.resetSession (full ResetSession row)
        ctx.email (resetSession.snapshotTarget)

Logic:
  - Find first resetSession where:
      verificationId === payload.sub
      usedAt IS NULL
      expiresAt > NOW()
  - If not found → throw 400 AUTH_RESET_SESSION_INVALID
```

**Edge Cases:**
- Session expired (15min window from OTP verification) → not found → 400
- Session already consumed (shouldn't happen, usedAt check) → not found → 400
- No reset session created (unlikely, OTP verify always creates one) → not found → 400

### Step 3: `findCredentialByEmail`

```
Input:  ctx.email (from resetSession.snapshotTarget)
Output: ctx.credential (AccountCredential with Account)
        ctx.accountId

Logic:
  - findUnique accountCredential where email === ctx.email, include account
  - If not found → throw 400 AUTH_RESET_SESSION_INVALID (same error as step 1/2)
  - If account.currentState === 'SUSPENDED' → throw 403 AUTH_ACCOUNT_SUSPENDED
```

**Edge Cases:**
- Email changed between OTP verification and reset → the resetSession snapshots the original email, credential lookup by that email may fail → 400
- Account deleted (soft?) → currentState check catches it
- Email verified but account suspended → explicit 403

### Step 4: `hashNewPassword`

```
Input:  ctx.dto.password
Output: ctx.newPasswordHash

Logic:
  - await hashPassword(dto.password) — argon2
```

### Step 5: `updatePasswordAndRevokeSessions` (inside $transaction)

```
Input:  ctx.email, ctx.newPasswordHash, ctx.accountId
        ctx.resetSession.id
Output: (side effects)

Logic (all in one transaction):
  1. accountCredential.update({ where: { email }, data: { passwordHash } })
  2. account.update({ where: { id }, data: { tokenVersion: { increment: 1 } } })
  3. accountSession.updateMany({ where: { accountId, revokedAt: null },
       data: { revokedAt: now(), revokedReason: 'password_reset' } })
  4. resetSession.update({ where: { id }, data: { usedAt: now() } })
```

**Edge Cases:**
- TokenVersion increment → all existing JWTs (access + refresh) become invalid
- 15-minute access tokens still valid until they expire → `requireSession` middleware checks tver against DB, so tokens are revoked immediately at middleware level
- Refresh token rotation → `rotateSession` checks `payload.tver !== account.tokenVersion` → `AUTH_TOKEN_REUSE`
- Reset session consumed → prevents replay of the same reset token
- Transaction atomicity → all-or-nothing: either password changes AND sessions revoke, or nothing changes

### Step 6: `enqueuePasswordResetAudit`

```
Input:  ctx.accountId
Output: (fire-and-forget)

Logic:
  - enqueueAuditEvent(PASSWORD_RESET, accountId, {})
```

## Error Scenarios

| Scenario | Step | HTTP | Code | Message |
|----------|------|------|------|---------|
| Invalid/expired reset token | validateResetToken | 400 | AUTH_RESET_SESSION_INVALID | — |
| Reset session expired/used | findResetSession | 400 | AUTH_RESET_SESSION_INVALID | — |
| Account not found by email | findCredentialByEmail | 400 | AUTH_RESET_SESSION_INVALID | — |
| Account suspended | findCredentialByEmail | 403 | AUTH_ACCOUNT_SUSPENDED | Account is suspended |
| Rate limit exceeded | (middleware) | 429 | RATE_LIMIT_EXCEEDED | Too many requests |

**Important:** All "not found" errors return the same code (`AUTH_RESET_SESSION_INVALID`) to prevent enumeration attacks — an attacker cannot distinguish between an invalid token and a non-existent account.

## Response Shape

**Success (200):**
```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully"
  }
}
```

**No cookies are modified.** The frontend clears local state and redirects to login.

## Audit Events

| Event | Payload | When |
|-------|---------|------|
| `PASSWORD_RESET` | `{}` | Password successfully reset |

## Password Constraints

- Reset uses same password policy as registration (validated by `resetPasswordSchema`)
- Same password check: if user sets same password as before, the hash changes (argon2 salt is random), but tokenVersion bumps → old sessions still revoked
- Minimum/maximum length enforced by dto validator

## Security Considerations

- **Token replay protection**: Reset token is single-use (consumed by `usedAt`)
- **Session revocation**: All existing sessions (including attacker's if they had access) are invalidated
- **Timing attacks**: All "not found" cases return identical error code and message
- **Rate limiting**: 5 requests per window on the reset endpoint
- **OTP phase rate limit**: 3 OTP sends, 5 OTP verifies per window (separate from reset)

## Testing Considerations

- **Full flow test**: Request OTP → Verify OTP → Reset password → Login with new password → Verify old password fails
- **Invalid token test**: Random reset token → 400
- **Expired session test**: Let reset session expire (15min), attempt reset → 400
- **Suspended account test**: Suspend account, reset password → 403 before password change
- **Reuse test**: After successful reset, use the same reset token → 400
- **Concurrent reset test**: Same reset token used simultaneously → only one succeeds
- **Old session test**: Login, get tokens, reset password, try to use old access token → 401 (tver mismatch)

## Performance Characteristics

| Aspect | Expected |
|--------|----------|
| P50 latency | ~200ms (argon2 hash ~150ms + writes) |
| P99 latency | ~500ms |
| DB queries | 1 read + 4 writes in transaction |
| External calls | 1 (argon2 hash) |
