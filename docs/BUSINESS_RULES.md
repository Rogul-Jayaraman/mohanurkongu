# Business Rules

## Account State Machine

```
PENDING → ACTIVE (via email verification)
ACTIVE  → SUSPENDED (admin action)
ACTIVE  → DELETED (user request)
SUSPENDED → ACTIVE (admin unsuspend)
SUSPENDED → DELETED (MISSING — BUG)
```

**Implementation:** `role` enum on `accounts` table (`ANON | USER | ADMIN | SUPER_ADMIN`). No actual state column exists — state is implied by relationship to `Verification` and `Credential` status.

## Registration Flow Rules

1. **OTP Generation:** `POST /auth/send-otp` generates 6-digit OTP, SHA-256 hashes it, stores in `Verifications` table with `expiresAt = NOW() + 5min`
2. **OTP Delivery:** Should send email via `enqueueOtpEmail()` — **NOT IMPLEMENTED (BUG-CRIT-001)**
3. **OTP Verification:** `POST /auth/verify-otp` checks SHA-256 hash match, marks `usedAt`, returns verification token (JWT, signed with access token secret — **BUG-CRIT-003**)
4. **Signup Email Check:** Signup does NOT verify `dto.email` matches the verified OTP's `target` — **BUG-CRIT-002**
5. **Account Creation:** Creates account with role `USER`, credential with Argon2id hash, session with device fingerprint
6. **Welcome Email:** Should send via `enqueueWelcomeEmail()` — **NOT IMPLEMENTED (BUG-CRIT-004)**

## Login Rules

1. Credential lookup by email + active credential only
2. Argon2id password verification
3. `portal` parameter validation — if provided, must match account role (BUG: `portal` is optional — omitting it skips role validation — **BUG-MED-004**)
4. Device fingerprint captured and hashed (SHA-256 of IP + UA + Accept-Lang + Accept)
5. Session created with refresh token (random bytes, SHA-256 hashed, stored)
6. Response: `{ id, accountNo, roles, membership }` + accessToken + refreshToken cookie

## Password Rules

1. Min 6 chars (validation: `password: z.string().min(6)`)
2. Must match confirmPassword
3. Reset flow requires OTP verification (password-specific `type: 'password-reset'`)
4. Change password (authenticated) increments `tokenVersion` — does NOT revoke existing sessions (**BUG-HIGH-002**)

## Session Rules

1. Refresh token rotation: old token revoked, new token issued on each refresh
2. Concurrent refresh race: two parallel requests both succeed (**BUG-HIGH-001**)
3. Logout-all revokes all sessions for account
4. Logout revokes current session
5. Refresh token cookie: httpOnly, secure, sameSite strict, path `/auth` (**BUG-MED-001**: leaks to all /auth/* endpoints)

## Role & Permission Rules

1. **Roles:** `ANON`, `USER`, `ADMIN`, `SUPER_ADMIN`
2. **Access Token Claim:** `{ sub: accountId, roles: string[] }`
3. **Role Guard:** `requireRole('ADMIN')` defined at `common/guards/role.guard.ts` but **NEVER IMPORTED (BUG-ADMIN-003)**
4. **Route Protection:** `requireAuth` middleware verifies JWT, attaches `req.user` — no route-level role enforcement exists
5. **Admin Routes:** Zero admin routes implemented in backend

## Data Ownership Rules

| Entity | Owner | Access Rule |
|---|---|---|
| Account | Self | Owner + ADMIN |
| Credential | Account owner | Owner only (via AuthService) |
| Session | Account owner | Owner only (via AuthService) |
| Verification | Requestor | Requestor only |
| Profile (not implemented) | Account owner | Owner (private), all users (browse visible), ADMIN |
| Mandapam booking (not implemented) | Booked by user | User + hall owner + ADMIN |

## Validation Rules

- **Email:** Must match pattern `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **Password:** Min 6 chars
- **Phone:** Optional, validated by pattern
- **OTP:** Exactly 5 digits (string)
- **Name (signup):** Min 2 chars, max 100 chars
- **Portal:** Must be `USER` or `ADMIN` if provided (optional)

## State Transition Validation

- OTP: `PENDING` → `USED` or `EXPIRED`. `EXPIRED → PENDING` allowed (intentional).
- Session: `ACTIVE` → `REVOKED` or `EXPIRED`.
- Account: No formal state machine. Role changes managed by `AccountService.updateRole()` — **UNUSED**.
