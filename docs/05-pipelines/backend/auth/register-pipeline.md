# Register Pipeline

> **For beginners**: When you sign up, this pipeline validates your
> verification token, creates your account, and assigns you the free BRONZE
> plan. Unlike login, it does NOT log you in — you go to the login page after
> registering.

## Purpose

Create a new user account by validating a verification token, creating the account record with credentials and translations, assigning the USER role, assigning a free (BRONZE) subscription, and consuming the verification session. **No tokens are returned** — the frontend redirects to login.

## High-Level Architecture

```
                    ┌──────────────────┐
                    │  POST /auth/     │
                    │  register        │
                    │  { verification  │
                    │   Token, first-  │
                    │   NameEn, ... }  │
                    └────────┬─────────┘
                             │
                             ▼
               ┌─────────────────────────┐
               │  RegisterPipeline       │
               │  (1 transaction)        │
               └──────────┬──────────────┘
                          │
             ┌────────────┼────────────┼──────────────┐
             ▼            ▼            ▼              ▼
      ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
      │Step 1:   │ │Step 2:   │ │Step 3:   │ │   Step 4:    │
      │Validate  │→│Find Reg  │→│Verify    │→│  Create      │
      │Verif     │ │Session   │ │Verif     │ │  Account +   │
      │Token     │ │(valid &  │ │Record    │ │  Credential  │
      │          │ │unused)   │ │matched   │ │  + Trans-    │
      └──────────┘ └──────────┘ └──────────┘ │  lations     │
                                              └──────┬───────┘
                                                     │
             ┌──────────────┐ ┌──────────┐ ┌────────▼───────┐
             │   Step 7:    │ │ Step 6:  │ │   Step 5:      │
             │  Consume     │←│ Assign   │←│  Create Free   │
             │  Verif       │ │ USER     │ │  (BRONZE)      │
             │  Session +   │ │ Role     │ │  Subscription  │
             │  Mark Verif  │ │          │ │                │
             │  Archived    │ └──────────┘ └────────────────┘
             └──────┬───────┘
                    │
                    ▼
          ┌─────────────────────┐
          │  { accountId,       │
          │    email }          │
          │  HTTP 201           │
          └─────────────────────┘
```

## Low-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Client                    Controller              Pipeline                     │
│                                                   Steps                        │
│ POST /auth/register       AuthController          RegisterPipeline             │
│ {                          .register()            .execute(ctx)                │
│   verificationToken,                              (in $transaction)            │
│   firstNameEn,                                    │                            │
│   lastNameEn,                      │              │                            │
│   firstNameTa,                    │               ▼                            │
│   lastNameTa,                    │       ┌──────────────────┐                  │
│   phone                          │       │validateVerifToken│                  │
│ }                                │       │                  │                  │
│    │                             │       │ verifyVerification│                 │
│    │                             │       │ Token(purpose:   │                  │
│    │                             │       │  'register')     │                  │
│    │                             │       ├──────────────────┤                  │
│    │                             │       │ Throws: 400 if   │                  │
│    │                             │       │ expired/invalid  │                  │
│    │                             │       └────────┬─────────┘                  │
│    │                             │                │                            │
│    │                             │                ▼                            │
│    │                             │       ┌──────────────────┐                  │
│    │                             │       │ findRegSession   │                  │
│    │                             │       │                  │                  │
│    │                             │       │ WHERE verification│                 │
│    │                             │       │ Id AND usedAt IS │                  │
│    │                             │       │ NULL ANDexpiresAt│                  │
│    │                             │       │ > now            │                  │
│    │                             │       ├──────────────────┤                  │
│    │                             │       │ Throws: 400 if   │                  │
│    │                             │       │ not found        │                  │
│    │                             │       └────────┬─────────┘                  │
│    │                             │                │                            │
│    │                             │                ▼                            │
│    │                             │       ┌──────────────────┐                  │
│    │                             │       │verifyVerifRecord │                  │
│    │                             │       │                  │                  │
│    │                             │       │ Checks:          │                  │
│    │                             │       │ record.target == │                  │
│    │                             │       │ regSession.      │                  │
│    │                             │       │ snapshotTarget   │                  │
│    │                             │       ├──────────────────┤                  │
│    │                             │       │ Throws: 400 if   │                  │
│    │                             │       │ mismatch         │                  │
│    │                             │       └────────┬─────────┘                  │
│    │                             │                │                            │
│    │                             │                ▼                            │
│    │                             │       ┌──────────────────┐                  │
│    │                             │       │  hashPassword    │                  │
│    │                             │       │  (argon2)        │                  │
│    │                             │       └────────┬─────────┘                  │
│    │                             │                │                            │
│    │                             │                ▼                            │
│    │                             │       ┌──────────────────┐                  │
│    │                             │       │  generateAccountNo│                 │
│    │                             │       │  (sequential)    │                  │
│    │                             │       └────────┬─────────┘                  │
│    │                             │                │                            │
│    │                             │                ▼                            │
│    │                             │       ┌──────────────────┐                  │
│    │                             │       │  createAccount   │                  │
│    │                             │       │  + credential    │                  │
│    │                             │       │  + translations  │                  │
│    │                             │       │  (EN + TA)       │                  │
│    │                             │       ├──────────────────┤                  │
│    │                             │       │ On P2002(email): │                  │
│    │                             │       │  → 409           │                  │
│    │                             │       │ On P2002(phone): │                  │
│    │                             │       │  → 409           │                  │
│    │                             │       └────────┬─────────┘                  │
│    │                             │                │                            │
│    │                             │                ▼                            │
│    │                             │       ┌──────────────────┐                  │
│    │                             │       │  assignUserRole  │                  │
│    │                             │       │                  │                  │
│    │                             │       │ accountRole.     │                  │
│    │                             │       │ create with      │                  │
│    │                             │       │ roleCode = 'USER'│                  │
│    │                             │       ├──────────────────┤                  │
│    │                             │       │ Throws: 500 if   │                  │
│    │                             │       │ USER role not    │                  │
│    │                             │       │ configured       │                  │
│    │                             │       └────────┬─────────┘                  │
│    │                             │                │                            │
│    │                             │                ▼                            │
│    │                             │       ┌──────────────────┐                  │
│    │                             │       │  assignFreeSubs  │                  │
│    │                             │       │                  │                  │
│    │                             │       │ Creates BRONZE   │                  │
│    │                             │       │ subscription with│                  │
│    │                             │       │ capability       │                  │
│    │                             │       │ snapshots        │                  │
│    │                             │       ├──────────────────┤                  │
│    │                             │       │ Skips if BRONZE  │                  │
│    │                             │       │ plan not found   │                  │
│    │                             │       │ (graceful)       │                  │
│    │                             │       └────────┬─────────┘                  │
│    │                             │                │                            │
│    │                             │                ▼                            │
│    │                             │       ┌──────────────────┐                  │
│    │                             │       │  consumeSessions │                  │
│    │                             │       │                  │                  │
│    │                             │       │ Mark regSession  │                  │
│    │                             │       │ usedAt = now     │                  │
│    │                             │       │ Archive verif    │                  │
│    │                             │       │ record           │                  │
│    │                             │       │ Set email/phone  │                  │
│    │                             │       │ verified = true  │                  │
│    │                             │       └────────┬─────────┘                  │
│    │                             │                │                            │
│    │                             │◄───────────────┘                            │
│    │◄────────────────────────────┘                                             │
│    │                                                                          │
│ ← { accountId, email }       NO cookies set                                  │
│    HTTP 201                   NO tokens returned                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Pipeline Steps Detail

### Step 1: `validateVerificationToken`

```
Input:  ctx.dto.verificationToken
Output: ctx.verificationPayload.sub (verification record ID)

Logic:
  - verifyVerificationToken(dto.verificationToken) — JWT verify
  - Check: payload.type === 'verification' && payload.purpose === 'register'
  - If invalid/expired → throw 400 AUTH_REGISTRATION_SESSION_INVALID
```

**Edge Cases:**
- Token signed with wrong secret → JWT verify throws, caught → 400
- Token expired → JWT verify throws (expired), caught → 400
- Token with purpose 'reset_password' used for register → type/purpose mismatch → 400
- Reused token → JWT verify passes but regSession already has `usedAt` set → caught in step 2

### Step 2: `findRegistrationSession`

```
Input:  ctx.verificationPayload.sub (verificationId)
Output: ctx.regSession (full RegistrationSession row)

Logic (inside $transaction):
  - Find first registrationSession where:
      verificationId === payload.sub
      usedAt IS NULL
      expiresAt > NOW()
  - If not found → throw 400 AUTH_REGISTRATION_SESSION_INVALID
```

**Edge Cases:**
- Session expired → `expiresAt < now`, not found → 400
- Session already consumed → `usedAt` set, not found → 400
- Multiple registration sessions for same verificationId (shouldn't happen) → expects only one

### Step 3: `verifyVerificationRecord`

```
Input:  ctx.regSession.verificationId
        ctx.regSession.snapshotTarget
Output: ctx.verificationRecord (AccountVerification row)

Logic:
  - Find accountVerification where id = verificationId
  - If not found → throw 400 AUTH_REGISTRATION_SESSION_INVALID
  - Check: verificationRecord.target === regSession.snapshotTarget
  - If mismatch → throw 400 AUTH_REGISTRATION_SESSION_INVALID
```

**Edge Cases:**
- Record exists but target doesn't match snapshot → tamper detection, 400
- Record already ARCHIVED → still found, but state check might be needed (currently step 7 consumes it, but if called twice, step 2's `usedAt` check prevents that)

### Step 4: `hashPassword`

```
Input:  ctx.dto.password
Output: ctx.passwordHash

Logic:
  - await hashPassword(dto.password) — argon2 with configurable params
```

### Step 5: `generateAccountNumber`

```
Input:  tx (transaction client)
Output: ctx.accountNo

Logic:
  - Call AccountService.generateAccountNo(tx)
  - Sequential number generation (typically using a counter table or sequence)
```

### Step 6: `createAccount`

```
Input:  ctx.accountNo, ctx.passwordHash
        ctx.dto.firstNameEn, lastNameEn, firstNameTa, lastNameTa, phone
        ctx.regSession.snapshotTarget (email)
Output: ctx.account (created Account with relations)

Logic:
  - Prisma create account with nested creates:
    - 2 translations (EN + TA, EN is default)
    - 1 credential (email, phone, passwordHash)
    - 1 statusHistory (state: ACTIVE, reason: "Account created")
  - Catch P2002:
    - If target includes 'email' → throw 409 AUTH_EMAIL_EXISTS
    - If target includes 'phone' → throw 409 AUTH_PHONE_EXISTS
```

**Edge Cases:**
- Duplicate email race condition → caught by unique constraint + P2002 handler
- Duplicate phone → same as above
- Email already exists from a different registration attempt → 409
- Very long names → validation layer should truncate/enforce length limits

### Step 7: `assignUserRole`

```
Input:  ctx.account.id
Output: (side effect)

Logic:
  - Find role where code === 'USER'
  - If not found → throw 500 INTERNAL_ERROR "Default role not configured"
  - Create accountRole linking account to USER role
```

**Edge Cases:**
- USER role missing from DB → 500, this is a deployment/seed issue
- Role already assigned (shouldn't happen, new account) → unique constraint would fail

### Step 8: `assignFreeSubscription`

```
Input:  ctx.account.id
Output: (side effect, soft — skips if BRONZE plan missing)

Logic:
  - Find plan where code === 'BRONZE'
  - If found → create subscription with ACTIVE status and capability snapshots
  - If not found → skip silently (graceful fallback)
```

**Edge Cases:**
- BRONZE plan not seeded → registration still succeeds, user has no subscription fallback
- Memberhip system disabled → `resolveCapabilities` returns full access regardless of subscription
- Free plan configuration changes → snapshot pattern ensures historical accuracy
- No durationDays (null) → subscription never expires

### Step 9: `consumeVerificationSessions`

```
Input:  ctx.regSession.id, ctx.verificationRecord.id
        ctx.account.id, ctx.credential
        ctx.seenVerificationType
Output: (side effect)

Logic:
  - Update registrationSession: set usedAt = now()
  - Update accountVerification: set state = 'ARCHIVED', consumedAt = now()
  - Update accountCredential: set emailVerified or phoneVerified based on verification type
```

**Edge Cases:**
- Registration via EMAIL vs PHONE → only the verified channel is marked verified
- Record already archived → wraps in same transaction, should not happen (step 2 prevents re-entry)

### Step 10: `sendWelcomeEmail`

```
Input:  ctx.account.email, ctx.dto.firstNameEn
Output: (fire-and-forget — non-blocking)

Logic:
  - notificationService.sendWelcomeEmail(email, firstNameEn, profileUrl)
  - .catch(() => {}) — never fails the pipeline
```

**Edge Cases:**
- Email service down → welcome email lost, user can still log in
- Invalid email → email bounces, not our concern at this point
- Email queued but never delivered → no retry mechanism (logged on send failure)

## Error Scenarios

| Scenario | Step | HTTP | Code | Message |
|----------|------|------|------|---------|
| Invalid/expired verification token | validateVerifToken | 400 | AUTH_REGISTRATION_SESSION_INVALID | — |
| Registration session expired | findRegSession | 400 | AUTH_REGISTRATION_SESSION_INVALID | — |
| Verification record target mismatch | verifyVerifRecord | 400 | AUTH_REGISTRATION_SESSION_INVALID | — |
| Duplicate email | createAccount | 409 | AUTH_EMAIL_EXISTS | Email already registered |
| Duplicate phone | createAccount | 409 | AUTH_PHONE_EXISTS | Phone already registered |
| USER role not configured | assignUserRole | 500 | INTERNAL_ERROR | Default role not configured |
| Rate limit exceeded | (middleware) | 429 | RATE_LIMIT_EXCEEDED | Too many requests |

## Response Shape

**Success (201):**
```json
{
  "success": true,
  "data": {
    "accountId": "uuid",
    "email": "user@example.com"
  }
}
```

**No refresh token cookie is set. No access token is returned.**

The frontend (`useAuth.tsx`) observes this and redirects to `/manamaalai/login` — the register page's `onSuccess` handler navigates to login, not to dashboard.

## Audit Events

| Event | Payload | When |
|-------|---------|------|
| `ACCOUNT_CREATED` | `{ accountNo, email }` | Account created |

## Testing Considerations

- **Token replay test**: Use the same verification token twice → second attempt returns 400
- **Expired token test**: Wait for token expiration → 400
- **Duplicate registration test**: Same email → 409 on second attempt
- **Missing BRONZE plan test**: Delete BRONZE plan, register, verify account has no subscription but can still log in
- **Transaction rollback test**: Force a failure mid-transaction (e.g., unique constraint), verify no partial account creation
- **Parallel registration test**: Same email simultaneously → second wins P2002 → 409
- **Tamil name test**: Unicode names in firstNameTa/lastNameTa → should be stored and returned correctly

## Performance Characteristics

| Aspect | Expected |
|--------|----------|
| P50 latency | ~200ms (argon2 hash ~150ms + DB writes) |
| P99 latency | ~500ms (under load) |
| DB queries | 5+ in transaction (multiple creates + reads) |
| External calls | 1 (argon2 hash) + 1 (email, async) |
