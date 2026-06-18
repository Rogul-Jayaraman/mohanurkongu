# OTP Pipeline

> **For beginners**: This handles sending and verifying one-time passwords.
> Used for email verification (registration) and identity verification
> (password reset). Think: send code → check email → enter code → verified.
> Cooldowns and attempt limits prevent abuse.

## Purpose

Send and verify one-time passwords (OTPs) for two flows: **registration** (email verification) and **password reset** (identity verification). The OTP pipeline is shared between these two flows, parameterized by `purpose: 'REGISTER' | 'RESET_PASSWORD'`. It enforces cooldown periods, resend limits, expiry, attempt limits, and timing-safe comparison.

## High-Level Architecture

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│  Two Sub-Pipelines:                                                               │
│                                                                                   │
│  SEND OTP                                VERIFY OTP                               │
│  ┌──────────────────────┐               ┌──────────────────────┐                  │
│  │ POST /auth/          │               │ POST /auth/          │                  │
│  │ registration/otp     │               │ registration/otp/    │                  │
│  │ (or /auth/password/  │               │ verify                │                  │
│  │  otp)                │               │ (or /auth/password/  │                  │
│  │ { email }            │               │  otp/verify)          │                  │
│  └──────────┬───────────┘               │ { email, otp }       │                  │
│             │                           └──────────┬───────────┘                  │
│             ▼                                      ▼                              │
│    ┌────────────────┐                    ┌──────────────────────┐                 │
│    │  OtpPipeline    │                    │  OtpPipeline         │                 │
│    │  .sendOtp()     │                    │  .verifyOtp()        │                 │
│    └───────┬─────────┘                    └──────────┬───────────┘                 │
│            │                                         │                            │
│  ┌─────────┴─────────┐                    ┌──────────┴──────────┐                 │
│  │1. Check cooldown   │                    │1. Find latest OTP   │                 │
│  │2. Check resend     │                    │   record            │                 │
│  │   limit            │                    │2. Check state       │                 │
│  │3. Generate OTP     │                    │   (PENDING?)        │                 │
│  │4. Hash OTP         │                    │3. Check expiry      │                 │
│  │5. Upsert OTP record│                    │4. Check attempts    │                 │
│  │6. Return plain OTP │                    │5. Timing-safe       │                 │
│  └────────────────────┘                    │   compare           │                 │
│                                             │6. Transition to     │                 │
│                                             │   VERIFIED          │                 │
│                                             │7. Issue session     │                 │
│                                             │   token (JWT)       │                 │
│                                             │   + create reg/     │                 │
│                                             │   reset session     │                 │
│                                             └────────────────────┘                 │
└───────────────────────────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture

### SEND OTP

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Client                    Controller            VerificationService              │
│                                                 (OtpPipeline.sendOtp)           │
│ POST /auth/registration/  VerificationController .sendOtp(type, target,         │
│  otp (or /auth/           .sendRegistrationOtp   purpose)                       │
│  password/otp)            (or .sendPassword      │                              │
│ { email }                  ResetOtp)             │                              │
│    │                       │                     ▼                              │
│    │                       │            ┌──────────────────┐                     │
│    │                       │            │ checkCooldown    │                     │
│    │                       │            │                  │                     │
│    │                       │            │ Find recent OTP  │                     │
│    │                       │            │ within cooldown  │                     │
│    │                       │            │ period (config:  │                     │
│    │                       │            │ OTP_COOLDOWN_    │                     │
│    │                       │            │ SECONDS = 60)    │                     │
│    │                       │            ├──────────────────┤                     │
│    │                       │            │ Throws: 429 if   │                     │
│    │                       │            │ within cooldown  │                     │
│    │                       │            └────────┬─────────┘                     │
│    │                       │                     │                               │
│    │                       │                     ▼                               │
│    │                       │            ┌──────────────────┐                     │
│    │                       │            │ checkResendLimit │                     │
│    │                       │            │                  │                     │
│    │                       │            │ Count resends in │                     │
│    │                       │            │ window (config:  │                     │
│    │                       │            │ RESEND_WINDOW_   │                     │
│    │                       │            │ MINUTES = 5,     │                     │
│    │                       │            │ MAX_RESENDS = 3) │                     │
│    │                       │            ├──────────────────┤                     │
│    │                       │            │ Throws: 429 if   │                     │
│    │                       │            │ limit exceeded   │                     │
│    │                       │            └────────┬─────────┘                     │
│    │                       │                     │                               │
│    │                       │                     ▼                               │
│    │                       │            ┌──────────────────┐                     │
│    │                       │            │  generateOTP     │                     │
│    │                       │            │  (config:        │                     │
│    │                       │            │  OTP_LENGTH=6)   │                     │
│    │                       │            │  → "482916"     │                     │
│    │                       │            └────────┬─────────┘                     │
│    │                       │                     │                               │
│    │                       │                     ▼                               │
│    │                       │            ┌──────────────────┐                     │
│    │                       │            │  hashOTP(otp)    │                     │
│    │                       │            │  → sha256(       │                     │
│    │                       │            │   "482916")      │                     │
│    │                       │            └────────┬─────────┘                     │
│    │                       │                     │                               │
│    │                       │                     ▼                               │
│    │                       │            ┌──────────────────┐                     │
│    │                       │            │ upsert OTP record│                     │
│    │                       │            │                  │                     │
│    │                       │            │ Creates or up-   │                     │
│    │                       │            │ dates record for │                     │
│    │                       │            │ (target, purpose)│                     │
│    │                       │            │ with new OTP hash │                    │
│    │                       │            │ + expiry +       │                     │
│    │                       │            │ maxAttempts      │                     │
│    │                       │            └────────┬─────────┘                     │
│    │                       │                     │                               │
│    │                       │◄────────────────────┘                               │
│    │◄──────────────────────┘                Returns plain OTP                    │
│    │                                          (only for email)                   │
│    │                                                                             │
│ ← 200 null                 [notificationService.sendRegistrationOtpEmail(       │
│                              target, otp)]                                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### VERIFY OTP

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Client                    Controller            VerificationService + Controller│
│                                                 OtpPipeline.verifyOtp          │
│ POST /auth/registration/  VerificationController .verifyOtp(type, target,      │
│  otp/verify (or /auth/    .verifyRegistration   otp, purpose)                   │
│  password/otp/verify)      Otp                  │                               │
│ { email, otp }            (or .verifyPassword   │                               │
│                            ResetOtp)            ▼                               │
│    │                       │            ┌──────────────────┐                     │
│    │                       │            │ findLatest       │                     │
│    │                       │            │                  │                     │
│    │                       │            │ WHERE target AND │                     │
│    │                       │            │ purpose          │                     │
│    │                       │            │ ORDER BY createdAt│                     │
│    │                       │            │ DESC LIMIT 1      │                    │
│    │                       │            ├──────────────────┤                     │
│    │                       │            │ Throws: 400 if   │                     │
│    │                       │            │ no record        │                     │
│    │                       │            └────────┬─────────┘                     │
│    │                       │                     │                               │
│    │                       │                     ▼                               │
│    │                       │            ┌──────────────────┐                     │
│    │                       │            │ verifyState      │                     │
│    │                       │            │                  │                     │
│    │                       │            │ EXPIRED → 410    │                     │
│    │                       │            │ VERIFIED → 400   │                     │
│    │                       │            │ (already used)   │                     │
│    │                       │            │ CANCELLED → 400  │                     │
│    │                       │            └────────┬─────────┘                     │
│    │                       │                     │                               │
│    │                       │                     ▼                               │
│    │                       │            ┌──────────────────┐                     │
│    │                       │            │ verifyExpiry     │                     │
│    │                       │            │                  │                     │
│    │                       │            │ if expiresAt <   │                     │
│    │                       │            │ now:             │                     │
│    │                       │            │  → state=EXPIRED │                     │
│    │                       │            │  → throw 410     │                     │
│    │                       │            └────────┬─────────┘                     │
│    │                       │                     │                               │
│    │                       │                     ▼                               │
│    │                       │            ┌──────────────────┐                     │
│    │                       │            │ checkAttempts    │                     │
│    │                       │            │                  │                     │
│    │                       │            │ if record.       │                     │
│    │                       │            │ attempts >=      │                     │
│    │                       │            │ maxAttempts (5)  │                     │
│    │                       │            │ → throw 429      │                     │
│    │                       │            └────────┬─────────┘                     │
│    │                       │                     │                               │
│    │                       │                     ▼                               │
│    │                       │            ┌──────────────────┐                     │
│    │                       │            │  timingSafeCompare│                    │
│    │                       │            │                  │                     │
│    │                       │            │ hashOTP(otp)     │                     │
│    │                       │            │ compare with     │                     │
│    │                       │            │ record.otpHash   │                     │
│    │                       │            │ (constant-time)  │                     │
│    │                       │            ├──────────────────┤                     │
│    │                       │            │ On fail:         │                     │
│    │                       │            │  incrementAttempts│                    │
│    │                       │            │  → throw 400     │                     │
│    │                       │            └────────┬─────────┘                     │
│    │                       │                     │                               │
│    │                       │                     ▼                               │
│    │                       │            ┌──────────────────┐                     │
│    │                       │            │ transition to    │                     │
│    │                       │            │ VERIFIED         │                     │
│    │                       │            └────────┬─────────┘                     │
│    │                       │                     │                               │
│    │                       │◄────────────────────┘                               │
│    │                       │                                                     │
│    │                       │  CONTROLLER (after service returns):                │
│    │                       │                                                     │
│    │                       │  ┌─────────────────────────────────────┐            │
│    │                       │  │ signVerificationToken({            │            │
│    │                       │  │   sub: record.id,                  │            │
│    │                       │  │   purpose: 'register'              │            │
│    │                       │  │ })  OR                             │            │
│    │                       │  │ signResetToken({                   │            │
│    │                       │  │   sub: record.id,                  │            │
│    │                       │  │   purpose: 'reset_password'        │            │
│    │                       │  │ })                                 │            │
│    │                       │  └─────────────────────────────────────┘            │
│    │                       │                                                     │
│    │                       │  ┌─────────────────────────────────────┐            │
│    │                       │  │ createRegistrationSession(          │            │
│    │                       │  │   or createResetSession)            │            │
│    │                       │  │ with snapshotTarget=email,          │            │
│    │                       │  │ expiresAt=15min                     │            │
│    │                       │  └─────────────────────────────────────┘            │
│    │◄──────────────────────┘                                                     │
│    │                                                                             │
│ ← { verificationToken }    OR  { resetToken }                                  │
│    HTTP 200                                                                      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Pipeline Steps Detail

### SEND OTP: Step 1 — `checkCooldown`

```
Input:  target (email), purpose (REGISTER | RESET_PASSWORD)
Output: (none, throws if cooldown active)

Logic:
  - Find most recent AccountVerification for (target, purpose)
  - If created within last OTP_COOLDOWN_SECONDS (60s) → throw 429 AUTH_OTP_COOLDOWN
```

**Edge Cases:**
- First-ever OTP for this target → no recent record → cooldown passes
- Cooldown period is per (target, purpose) — sending REGISTER OTP doesn't affect RESET_PASSWORD cooldown
- Cooldown resets after OTP_COOLDOWN_SECONDS from the _last_ send

### SEND OTP: Step 2 — `checkResendLimit`

```
Input:  target, purpose
Output: (none, throws if limit exceeded)

Logic:
  - Count AccountVerification records for (target, purpose) in the last RESEND_WINDOW_MINUTES (5min)
  - If count >= MAX_RESENDS (3) → throw 429 RATE_LIMIT_EXCEEDED
```

**Edge Cases:**
- 4 rapid resend attempts → first 3 succeed, 4th is rejected
- Window is sliding (based on created_at), not calendar-based

### SEND OTP: Step 3 — `generateAndStore`

```
Input:  target, purpose, type (EMAIL | PHONE)
Output: plain OTP string

Logic:
  - otp = generateOTP() — crypto.randomInt(10^(len-1), 10^len - 1).toString()
  - otpHash = hashOTP(otp) — SHA-256
  - expiresAt = now + OTP_EXPIRY_MINUTES (5min)
  - Upsert: if existing PENDING record for (target, purpose) exists:
      - Update otpHash, expiresAt, reset attempts to 0
    Else:
      - Create new AccountVerification with state PENDING
  - Return plain OTP (for email sending)
```

**Edge Cases:**
- Upsert vs Create — if a previous OTP was never verified (still PENDING), it's replaced
- If previous OTP was VERIFIED — new record is created (old is done)
- OTP delivery to email happens asynchronously (fire-and-forget via NotificationService)
- The plain OTP is only available in-memory; it's returned to the controller which passes it to the email sender

### VERIFY OTP: Step 1 — `findLatestRecord`

```
Input:  target, purpose
Output: AccountVerification record or throw

Logic:
  - Find most recent AccountVerification where target === email AND purpose
  - If not found at all → throw 400 AUTH_OTP_EXPIRED
```

### VERIFY OTP: Step 2 — `checkState`

```
Input:  record.state
Output: (none, throws)

Logic:
  - If state === 'EXPIRED' → throw 410 AUTH_VERIFICATION_EXPIRED
  - If state === 'VERIFIED' | 'CANCELLED' | 'ARCHIVED' → throw 400 AUTH_OTP_ALREADY_USED
  - (PENDING passes through)
```

### VERIFY OTP: Step 3 — `checkExpiry`

```
Input:  record.expiresAt
Output: (none, throws)

Logic:
  - If record.expiresAt < now →
      transition state to 'EXPIRED'
      throw 410 AUTH_VERIFICATION_EXPIRED (with canResend: true)
```

**Edge Cases:**
- Expired OTP transitions to EXPIRED state and informs client they can resend
- Frontend shows "OTP expired, please resend" with a resend button

### VERIFY OTP: Step 4 — `checkAttempts`

```
Input:  record.attempts, record.maxAttempts (5)
Output: (none, throws)

Logic:
  - If attempts >= maxAttempts → throw 429 AUTH_OTP_MAX_ATTEMPTS
```

**Edge Cases:**
- 5 failed attempts → OTP becomes unusable (even if correct on 6th attempt)
- User must request a new OTP to try again
- Attempt counter resets when a new OTP is sent (in upsert)

### VERIFY OTP: Step 5 — `timingSafeCompare`

```
Input:  otp (user input), record.otpHash
Output: (none, throws on mismatch)

Logic:
  - inputHash = hashOTP(otp)
  - if (!timingSafeEqual(inputHash, record.otpHash)) →
      incrementAttempts(record.id, record.attempts)
      throw 400 AUTH_OTP_INVALID
  - transitionState(record.id, 'VERIFIED')
  - Return record
```

**Edge Cases:**
- Timing-safe comparison prevents timing attacks on OTP guessing (SHA-256 of the OTP, not raw compare)
- Each failed attempt increments, so a brute force of 10^6 possible 6-digit OTPs is limited to 5 attempts
- Successful verification transitions the state; subsequent verify attempts get AUTH_OTP_ALREADY_USED

### Post-Verify: Controller Issues Session Token

After `verifyOtp` succeeds, the controller:

1. **For Registration**: Signs a `verificationToken` JWT with `{ sub: record.id, purpose: 'register' }` and creates a `RegistrationSession` row (15min expiry). Returns `{ verificationToken }`.

2. **For Password Reset**: Signs a `resetToken` JWT with `{ sub: record.id, purpose: 'reset_password' }` and creates a `ResetSession` row (15min expiry). Returns `{ resetToken }`.

The session token is the bridge to the Register/Reset Password pipelines.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `OTP_LENGTH` | 6 | Number of digits in generated OTP |
| `OTP_EXPIRY_MINUTES` | 5 | OTP validity duration |
| `OTP_COOLDOWN_SECONDS` | 60 | Minimum time between resends |
| `OTP_MAX_RESENDS` | 3 | Max resends in the resend window |
| `OTP_RESEND_WINDOW_MINUTES` | 5 | Sliding window for resend counting |
| maxAttempts | 5 (hardcoded) | Max failed verify attempts per OTP |

## Error Scenarios

| Scenario | Sub-flow | HTTP | Code | Message |
|----------|----------|------|------|---------|
| OTP sent too soon | send | 429 | AUTH_OTP_COOLDOWN | Please wait before resending |
| Max resends exceeded | send | 429 | RATE_LIMIT_EXCEEDED | Too many requests |
| No OTP record | verify | 400 | AUTH_OTP_EXPIRED | OTP expired |
| OTP expired (state) | verify | 410 | AUTH_VERIFICATION_EXPIRED | OTP expired, resend? |
| OTP already used | verify | 400 | AUTH_OTP_ALREADY_USED | OTP already used |
| OTP wrong | verify | 400 | AUTH_OTP_INVALID | Invalid OTP |
| Max attempts reached | verify | 429 | AUTH_OTP_MAX_ATTEMPTS | Too many attempts |
| Rate limit exceeded | (middleware) | 429 | RATE_LIMIT_EXCEEDED | Too many requests |

## Response Shapes

**Send OTP (200):**
```json
{ "success": true, "data": null }
```

**Verify OTP — Registration (200):**
```json
{
  "success": true,
  "data": {
    "verificationToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Verify OTP — Password Reset (200):**
```json
{
  "success": true,
  "data": {
    "resetToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Verify OTP — Expired (410):**
```json
{
  "success": false,
  "code": "AUTH_VERIFICATION_EXPIRED",
  "message": "Verification expired",
  "canResend": true
}
```

## Audit Events

| Event | Target | When |
|-------|--------|------|
| `OTP_SENT` | email | OTP sent |
| `OTP_VERIFIED` | email | OTP verified successfully |
| `OTP_FAILED` | email | Wrong OTP attempt |
| `OTP_EXPIRED` | email | OTP expired (on verify) |

## Testing Considerations

- **Cooldown test**: Send OTP → immediately resend → 429 → wait 60s → resend succeeds
- **Resend limit test**: Send OTP 4 times → 4th fails → wait 5min → succeeds again
- **Expiry test**: Wait 5min → verify → 410 with canResend
- **Attempt limit test**: Send OTP → verify with wrong OTP 5 times → 429 → send new OTP → attempts reset → verify succeeds
- **Timing attack test**: Wrong OTP and correct OTP should have same response time
- **Reuse test**: Verify OTP → verify again with same OTP → 400 AUTH_OTP_ALREADY_USED
- **Cross-purpose test**: Registration OTP should not work for password reset
- **Expired state test**: OTP expires → state becomes EXPIRED → verify returns 410

## Performance Characteristics

| Aspect | Expected |
|--------|----------|
| P50 latency (send) | ~15ms (no crypto-heavy operations) |
| P50 latency (verify) | ~10ms (SHA-256 is fast) |
| P99 latency | ~50ms |
| DB queries (send) | 1 read (find recent) + 1 count (resends) + 1 upsert |
| DB queries (verify) | 1 read (find latest) + 1 write (transition/incr) |
