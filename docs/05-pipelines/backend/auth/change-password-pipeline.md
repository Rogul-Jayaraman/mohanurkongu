# Change Password Pipeline

> **For beginners**: Already logged in and want to change your password?
> This is like the reset flow but gentler — it keeps you logged in on your
> current device instead of logging out everywhere.

## Purpose

Allow an **authenticated user** (or admin) to change their password by providing their current password and a new password. Unlike the reset password flow, this does NOT revoke all sessions — only the current session is kept (optionally revoking others). The `tokenVersion` is NOT bumped to avoid forcing logout from all devices.

## High-Level Architecture

```
                    ┌──────────────────────┐
                    │  POST /auth/password │
                    │  /change             │
                    │  [requireSession]    │
                    │  { currentPassword,  │
                    │    newPassword }     │
                    └──────────┬───────────┘
                               │
                               ▼
               ┌────────────────────────────┐
               │  ChangePasswordPipeline    │
               │  (authenticated)           │
               └──────────┬─────────────────┘
                          │
             ┌────────────┼────────────────┐
             ▼            ▼                ▼
      ┌──────────┐ ┌──────────┐ ┌──────────────┐
      │Step 1:   │ │Step 2:   │ │   Step 3:    │
      │Get Auth  │→│Verify    │→│  Hash New    │
      │Account   │ │Current   │ │  Password    │
      │Credential│ │Password  │ │              │
      └──────────┘ └──────────┘ └──────┬───────┘
                                       │
                              ┌────────▼───────┐
                              │   Step 4:      │
                              │  Update        │
                              │  Password Hash │
                              │  (in $tx)      │
                              └────────────────┘
```

## Low-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Client                    Controller(s)          Pipeline                     │
│                                                   Steps                        │
│ POST /auth/password/      AuthController.         ChangePasswordPipeline       │
│ change                     changePassword()?      .execute(ctx)                │
│ {                          (or dedicated          │                             │
│   currentPassword,         PasswordController)    │                             │
│   newPassword              │                      ▼                             │
│ }                          │             ┌──────────────────┐                   │
│    │                       │             │  fetchCredential │                   │
│    │                       │             │                  │                   │
│    │                       │             │ Find credential  │                   │
│    │                       │             │ by req.account   │                   │
│    │                       │             │ .sub (accountId) │                   │
│    │                       │             ├──────────────────┤                   │
│    │                       │             │ Throws: 404 if   │                   │
│    │                       │             │ not found        │                   │
│    │                       │             └────────┬─────────┘                   │
│    │                       │                      │                             │
│    │                       │                      ▼                             │
│    │                       │             ┌──────────────────┐                   │
│    │                       │             │  verifyCurrent   │                   │
│    │                       │             │  Password        │                   │
│    │                       │             │                  │                   │
│    │                       │             │ verifyPassword(  │                   │
│    │                       │             │  currentPassword,│                   │
│    │                       │             │  credential.     │                   │
│    │                       │             │  passwordHash)   │                   │
│    │                       │             ├──────────────────┤                   │
│    │                       │             │ Throws: 401 if   │                   │
│    │                       │             │ invalid          │                   │
│    │                       │             └────────┬─────────┘                   │
│    │                       │                      │                             │
│    │                       │                      ▼                             │
│    │                       │             ┌──────────────────┐                   │
│    │                       │             │  hashNewPassword │                   │
│    │                       │             │                  │                   │
│    │                       │             │ argon2 hash      │                   │
│    │                       │             │ of newPassword   │                   │
│    │                       │             └────────┬─────────┘                   │
│    │                       │                      │                             │
│    │                       │                      ▼                             │
│    │                       │             ┌──────────────────┐                   │
│    │                       │             │ $transaction:    │                   │
│    │                       │             │  update          │                   │
│    │                       │             │  credential      │                   │
│    │                       │             │  set passwordHash │                  │
│    │                       │             └────────┬─────────┘                   │
│    │                       │                      │                             │
│    │                       │◄─────────────────────┘                             │
│    │◄──────────────────────┘                                                    │
│    │                                                                           │
│ ← { message: "Password     Current session stays valid                         │
│     changed successfully" } Other sessions are NOT revoked                     │
│    HTTP 200                                                                    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Pipeline Steps Detail

### Step 1: `fetchCredential`

```
Input:  req.account.sub (from requireSession middleware)
Output: ctx.credential (AccountCredential with passwordHash)

Logic:
  - prisma.accountCredential.findUnique({ where: { accountId } })
  - If not found → throw 404 (unlikely since account exists if session is valid)
```

**Edge Cases:**
- Account deleted between middleware check and pipeline execution → unlikely, handled by 404
- Credential record missing (data integrity issue) → 404

### Step 2: `verifyCurrentPassword`

```
Input:  ctx.dto.currentPassword, ctx.credential.passwordHash
Output: (none, throws if invalid)

Logic:
  - verifyPassword(credential.passwordHash, dto.currentPassword) — argon2
  - If invalid → throw 401 AUTH_INVALID_CREDENTIALS
```

**Edge Cases:**
- Current password matches but is weak → allow, no complexity re-check on current password
- `currentPassword === newPassword` → should be caught by dto validation (must differ)
- Attempt to change password of another account → impossible, `req.account.sub` is from JWT

### Step 3: `hashNewPassword`

```
Input:  ctx.dto.newPassword
Output: ctx.newPasswordHash

Logic:
  - await hashPassword(dto.newPassword) — argon2
```

### Step 4: `updatePasswordHash`

```
Input:  ctx.credential.accountId, ctx.newPasswordHash
Output: (side effect)

Logic (simple update, no transaction needed for single write):
  - prisma.accountCredential.update({
      where: { accountId },
      data: { passwordHash: newPasswordHash }
    })
  - enqueueAuditEvent(PASSWORD_CHANGED, accountId, {})
```

## Why TokenVersion Is NOT Bumped

Unlike password reset (which is an account recovery flow where an attacker may have had access), changing password while authenticated assumes the legitimate user is in control:

- **Current session stays valid** — no interruption to the user's workflow
- **Other sessions NOT revoked** — user stays logged in on other devices
- **Security trade-off**: If the user believes their account is compromised, they should use "logout all devices" (which bumps `tokenVersion`) or the reset password flow

This is a deliberate design choice to match user expectations — changing password in settings should not log you out.

## Response Shape

**Success (200):**
```json
{
  "success": true,
  "data": {
    "message": "Password changed successfully"
  }
}
```

## Error Scenarios

| Scenario | Step | HTTP | Code | Message |
|----------|------|------|------|---------|
| Credential not found | fetchCredential | 404 | (default 404) | Not found |
| Wrong current password | verifyCurrentPassword | 401 | AUTH_INVALID_CREDENTIALS | Invalid credentials |
| Same password | (validator) | 400 | Validation error | New password must differ |
| No session (no token) | (middleware) | 401 | AUTH_UNAUTHORIZED | Unauthorized |

## Audit Events

| Event | Payload | When |
|-------|---------|------|
| `PASSWORD_CHANGED` | `{}` | Password successfully changed |

## Testing Considerations

- **Happy path**: Change password → Verify old password fails → Verify new password works
- **Wrong current password**: 401, no update
- **No session**: 401 before pipeline runs
- **Same password**: DTO validation rejects
- **Weak new password**: DTO validation rejects (if policy configured)
- **Concurrent change**: Two simultaneous changes → both succeed (last write wins), no corruption
- **Account state check**: Suspended account → `requireSession` middleware already rejects (403)

## Performance Characteristics

| Aspect | Expected |
|--------|----------|
| P50 latency | ~200ms (argon2 verify + argon2 hash) |
| P99 latency | ~500ms |
| DB queries | 1 read + 1 write |
| External calls | 2 (argon2 verify + argon2 hash) |
