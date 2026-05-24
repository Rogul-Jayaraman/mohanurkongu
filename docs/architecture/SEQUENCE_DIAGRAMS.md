# Sequence Diagrams

## Registration Flow

```
User              Frontend              API(/auth)         Controller           Service             DB/Redis
 │                    │                    │                    │                  │                   │
 │  1. Fill form     │                    │                    │                  │                   │
 │──────────────────▶│                    │                    │                  │                   │
 │                    │  2. POST /auth/   │                    │                  │                   │
 │                    │     send-otp      │                    │                  │                   │
 │                    │──────────────────▶│─ ─ ─ ─ ─ ─ ─ ─ ─▶│─ ─ ─ ─ ─ ─ ─ ─▶│                   │
 │                    │                    │                    │  3. Hash OTP   │                   │
 │                    │                    │                    │  Store OTP     │                   │
 │                    │                    │                    │                │                   │
 │                    │                    │                    │  [BUG: BUG-CRIT-001]                │
 │                    │                    │                    │  SHOULD:        │                   │
 │                    │                    │                    │  enqueueOtpEmail│─ ─ ─ ─ ─ ─ ─ ─▶│
 │                    │                    │                    │  (NEVER CALLED) │                   │
 │                    │                    │                    │                │                   │
 │                    │  4. { message }   │                    │                │                   │
 │                    │◀──────────────────│◀ ─ ─ ─ ─ ─ ─ ─ ─ │◀ ─ ─ ─ ─ ─ ─ ─│                   │
 │                    │                    │                    │                  │                   │
 │  5. Notified      │                    │                    │                  │                   │
 │◀──────────────────│                    │                    │                  │                   │
 │                    │                    │                    │                  │                   │
 │  6. Enter OTP     │                    │                    │                  │                   │
 │──────────────────▶│  7. POST /auth/    │                    │                  │                   │
 │                    │     verify-otp    │                    │                  │                   │
 │                    │──────────────────▶│─ ─ ─ ─ ─ ─ ─ ─ ─▶│─ ─ ─ ─ ─ ─ ─ ─▶│                   │
 │                    │                    │                    │  8. SHA-256     │                   │
 │                    │                    │                    │     match       │                   │
 │                    │                    │                    │  9. Mark usedAt │                   │
 │                    │                    │                    │                │──────────────────▶│
 │                    │                    │                    │  [BUG: BUG-CRIT-003]               │
 │                    │                    │                    │  Verification   │                   │
 │                    │                    │                    │  token signed   │                   │
 │                    │                    │                    │  with ACCESS    │                   │
 │                    │                    │                    │  SECRET         │                   │
 │                    │                    │                    │                │                   │
 │                    │ 10. { verifToken }│                    │                │                   │
 │                    │◀──────────────────│◀ ─ ─ ─ ─ ─ ─ ─ ─ │◀ ─ ─ ─ ─ ─ ─ ─│                   │
 │                    │                    │                    │                  │                   │
 │  11. OTP verified  │                    │                    │                  │                   │
 │◀──────────────────│                    │                    │                  │                   │
 │                    │                    │                    │                  │                   │
 │  12. Fill signup   │                    │                    │                  │                   │
 │      form          │                    │                    │                  │                   │
 │──────────────────▶│ 13. POST /auth/    │                    │                  │                   │
 │                    │     signup        │                    │                  │                   │
 │                    │  (email, password,│                    │                  │                   │
 │                    │   name, verifToken│                    │                  │                   │
 │                    │──────────────────▶│─ ─ ─ ─ ─ ─ ─ ─ ─▶│─ ─ ─ ─ ─ ─ ─ ─▶│                   │
 │                    │                    │                    │                  │                   │
 │                    │                    │                    │  [BUG: BUG-CRIT-002]               │
 │                    │                    │                    │  dto.email NOT   │                  │
 │                    │                    │                    │  compared vs     │                  │
 │                    │                    │                    │  verification    │                  │
 │                    │                    │                    │  .target         │                  │
 │                    │                    │                    │                  │                   │
 │                    │                    │                    │  14. Create      │                  │
 │                    │                    │                    │      account     │                  │
 │                    │                    │                    │  15. Create      │──────────────────▶│
 │                    │                    │                    │      credential  │                  │
 │                    │                    │                    │  16. Create      ├──────────────────▶│
 │                    │                    │                    │      session     │                  │
 │                    │                    │                    │                │──────────────────▶│
 │                    │                    │                    │                  │                   │
 │                    │                    │                    │  [BUG: BUG-CRIT-004]               │
 │                    │                    │                    │  SHOULD:        │                   │
 │                    │                    │                    │  enqueueWelcome  │─ ─ ─ ─ ─ ─ ─ ─▶│
 │                    │                    │                    │  Email(NEVER    │                   │
 │                    │                    │                    │  CALLED)        │                   │
 │                    │                    │                    │                  │                   │
 │                    │ 17. { id, roles,  │                    │                  │                   │
 │                    │      membership,  │                    │                  │                   │
 │                    │      accessToken }│                    │                  │                   │
 │                    │◀──────────────────│◀ ─ ─ ─ ─ ─ ─ ─ ─ │◀ ─ ─ ─ ─ ─ ─ ─│                   │
 │                    │                    │                    │                  │                   │
 │  18. Redirect to   │                    │                    │                  │                   │
 │      dashboard     │                    │                    │                  │                   │
 │◀──────────────────│                    │                    │                  │                   │
```

## Login Flow

```
User              Frontend              API(/auth)         Controller           Service             DB/Redis
 │                    │                    │                    │                  │                   │
 │  1. Enter email,  │                    │                    │                  │                   │
 │     password,     │                    │                    │                  │                   │
 │     portal?       │                    │                    │                  │                   │
 │──────────────────▶│                    │                    │                  │                   │
 │                    │  2. POST /auth/   │                    │                  │                   │
 │                    │     login         │                    │                  │                   │
 │                    │──────────────────▶│─ ─ ─ ─ ─ ─ ─ ─ ─▶│─ ─ ─ ─ ─ ─ ─ ─▶│                   │
 │                    │                    │                    │                  │                   │
 │                    │                    │                    │  3. Find         │                  │
 │                    │                    │                    │     credential   │─ ─ ─ ─ ─ ─ ─ ─▶│
 │                    │                    │                    │     by email     │                  │
 │                    │                    │                    │                │◀ ─ ─ ─ ─ ─ ─ ─ ─│
 │                    │                    │                    │                  │                   │
 │                    │                    │                    │  4. Verify       │                  │
 │                    │                    │                    │     password     │                  │
 │                    │                    │                    │     (Argon2id)   │                  │
 │                    │                    │                    │                  │                   │
 │                    │                    │                    │  [BUG: BUG-MED-004]               │
 │                    │                    │                    │  portal optional │                  │
 │                    │                    │                    │  omitting it     │                  │
 │                    │                    │                    │  SKIPS role check│                  │
 │                    │                    │                    │                  │                   │
 │                    │                    │                    │  5. Create       │                  │
 │                    │                    │                    │     session      │──────────────────▶│
 │                    │                    │                    │     (device      │                  │
 │                    │                    │                    │      fingerprint)│                  │
 │                    │                    │                    │                  │                   │
 │                    │  6. Set-Cookie:   │                    │                  │                   │
 │                    │     refreshToken   │                    │                  │                   │
 │                    │     { id, roles,  │                    │                  │                   │
 │                    │       membership, │                    │                  │                   │
 │                    │       accessToken }│                   │                  │                   │
 │                    │◀──────────────────│◀ ─ ─ ─ ─ ─ ─ ─ ─ │◀ ─ ─ ─ ─ ─ ─ ─│                   │
 │                    │                    │                    │                  │                   │
 │  7. Store          │                    │                    │                  │                   │
 │     accessToken    │                    │                    │                  │                   │
 │     in memory      │                    │                    │                  │                   │
 │  8. Redirect       │                    │                    │                  │                   │
 │◀──────────────────│                    │                    │                  │                   │
```

## Refresh Flow

```
Frontend (Axios interceptor)   API(/auth)        Controller      Service          DB
 │                                │                    │           │               │
 │  POST /auth/refresh            │                    │           │               │
 │  (cookie: refreshToken)        │                    │           │               │
 │───────────────────────────────▶│─ ─ ─ ─ ─ ─ ─ ─ ─▶│─ ─ ─ ─ ─▶│               │
 │                                │                    │           │               │
 │                                │                    │  BUG: No  │               │
 │                                │                    │  rate     │               │
 │                                │                    │  limiter  │               │
 │                                │                    │           │               │
 │                                │                    │  1. Lookup──────────────▶│
 │                                │                    │     session (SHA-256     │
 │                                │                    │     of cookie)           │
 │                                │                    │◀ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
 │                                │                    │           │               │
 │                                │                    │  2. Verify not revoked   │
 │                                │                    │     Verify not expired   │
 │                                │                    │           │               │
 │                                │                    │  [BUG: BUG-HIGH-001]    │
 │                                │                    │  Concurrent requests    │
 │                                │                    │  both pass checks       │
 │                                │                    │  because both read      │
 │                                │                    │  revokedAt = null       │
 │                                │                    │           │               │
 │                                │                    │  3. Revoke old session──▶│
 │                                │                    │  4. Create new session──▶│
 │                                │                    │           │               │
 │  Set-Cookie: new refreshToken  │                    │           │               │
 │  { new accessToken }           │                    │           │               │
 │◀───────────────────────────────│◀ ─ ─ ─ ─ ─ ─ ─ ─ │◀ ─ ─ ─ ─│               │
```

## Logout Flow

```
Frontend              API(/auth)         Controller      Service          DB
 │                        │                    │           │               │
 │  POST /auth/logout     │                    │           │               │
 │  (cookie: accessToken, │                    │           │               │
 │   refreshToken)        │                    │           │               │
 │───────────────────────▶│─ ─ ─ ─ ─ ─ ─ ─ ─▶│─ ─ ─ ─ ─▶│               │
 │                        │                    │           │               │
 │                        │                    │  BUG: No  │               │
 │                        │                    │  rate     │               │
 │                        │                    │  limiter  │               │
 │                        │                    │           │               │
 │                        │                    │  1. Revoke───────────────▶│
 │                        │                    │     session              │
 │                        │                    │◀ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
 │                        │                    │           │               │
 │  Clear-Cookie          │                    │           │               │
 │  { message }           │                    │           │               │
 │◀───────────────────────│◀ ─ ─ ─ ─ ─ ─ ─ ─ │◀ ─ ─ ─ ─│               │
```

## Admin Login Flow

```
User              AdminLogin Page       API(/auth)         Controller      Service        DB
 │                    │                    │                    │           │               │
 │  Enter email,      │                    │                    │           │               │
 │  password          │                    │                    │           │               │
 │───────────────────▶│                    │                    │           │               │
 │                    │  POST /auth/login  │                    │           │               │
 │                    │  { portal: ADMIN } │                    │           │               │
 │                    │───────────────────▶│─ ─ ─ ─ ─ ─ ─ ─ ─▶│─ ─ ─ ─ ─▶│               │
 │                    │                    │                    │           │               │
 │                    │                    │                    │  1. Lookup───────────────▶│
 │                    │                    │                    │     credential by email  │
 │                    │                    │                    │◀ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
 │                    │                    │                    │           │               │
 │                    │                    │                    │  2. Verify password      │
 │                    │                    │                    │     (Argon2id)           │
 │                    │                    │                    │           │               │
 │                    │                    │                    │  [BUG: BUG-MED-004]     │
 │                    │                    │                    │  portal=ADMIN check is   │
 │                    │                    │                    │  applied only when       │
 │                    │                    │                    │  portal present           │
 │                    │                    │                    │           │               │
 │                    │                    │                    │  3. Create session──────▶│
 │                    │                    │                    │                          │
 │                    │  Set-Cookie:       │                    │                          │
 │                    │  refreshToken      │                    │                          │
 │                    │  { id, accountNo,  │                    │                          │
 │                    │    roles,          │                    │                          │
 │                    │    membership }    │                    │                          │
 │                    │◀───────────────────│◀ ─ ─ ─ ─ ─ ─ ─ ─ │◀ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
 │                    │                    │                    │           │               │
 │  [BUG: BUG-ADMIN-001]                   │                    │           │               │
 │  Response lacks: name, email, phone,    │                    │           │               │
 │  avatar, createdAt                      │                    │           │               │
 │                    │                    │                    │           │               │
 │  4. mapAccountToAdmin() reads undefined │                    │           │               │
 │      for above fields                   │                    │           │               │
 │  5. Redirect to /admin/dashboard        │                    │           │               │
 │     (stub data)                         │                    │           │               │
 │◀───────────────────│                    │                    │           │               │
```

## Password Reset Flow

```
User              Frontend              API(/auth)         Controller      Service        DB
 │                    │                    │                    │           │               │
 │  1. Enter email    │                    │                    │           │               │
 │───────────────────▶│                    │                    │           │               │
 │                    │  POST /auth/       │                    │           │               │
 │                    │  forgot-password   │                    │           │               │
 │                    │───────────────────▶│─ ─ ─ ─ ─ ─ ─ ─ ─▶│─ ─ ─ ─ ─▶│               │
 │                    │                    │                    │           │               │
 │                    │                    │                    │  2. Check account exists   │
 │                    │                    │                    │  3. Generate OTP─────────▶│
 │                    │                    │                    │     (type: password-reset) │
 │                    │                    │                    │                           │
 │                    │                    │                    │  [BUG: BUG-CRIT-001]      │
 │                    │                    │                    │  OTP never sent via email │
 │                    │                    │                    │                           │
 │  { message }       │                    │                    │                           │
 │◀───────────────────│◀ ─ ─ ─ ─ ─ ─ ─ ─ │◀ ─ ─ ─ ─ ─ ─ ─ ─│                           │
 │                    │                    │                    │                           │
 │  4. Enter OTP      │                    │                    │                           │
 │───────────────────▶│  POST /auth/       │                    │                           │
 │                    │  verify-password-  │                    │                           │
 │                    │  otp               │                    │                           │
 │                    │───────────────────▶│─ ─ ─ ─ ─ ─ ─ ─ ─▶│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─▶│
 │                    │                    │                    │  5. SHA-256 match         │
 │                    │                    │                    │  6. Mark usedAt           │
 │                    │                    │                    │  7. Return resetToken     │
 │  { resetToken }    │                    │                    │  (JWT, BUG-CRIT-003)     │
 │◀───────────────────│◀ ─ ─ ─ ─ ─ ─ ─ ─ │◀ ─ ─ ─ ─ ─ ─ ─ ─│◀ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
 │                    │                    │                    │                           │
 │  8. New password   │                    │                    │                           │
 │───────────────────▶│  POST /auth/       │                    │                           │
 │                    │  reset-password    │                    │                           │
 │                    │───────────────────▶│─ ─ ─ ─ ─ ─ ─ ─ ─▶│─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─▶│
 │                    │                    │                    │  9. Update credential     │
 │                    │                    │                    │  10. Revoke all sessions  │
 │  { message }       │                    │                    │                           │
 │◀───────────────────│◀ ─ ─ ─ ─ ─ ─ ─ ─ │◀ ─ ─ ─ ─ ─ ─ ─ ─│◀ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
```
