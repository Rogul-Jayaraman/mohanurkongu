# Token Refresh Pipeline

> **For beginners**: Your access token expires every 15 minutes. This pipeline
> quietly gets you a new one using a refresh token stored in a cookie. It also
> detects if someone stole your token and invalidates it.

## Purpose

Atomically rotate an expiring refresh token into a new access + refresh token pair. This pipeline handles reuse detection (token family revocation), account state validation, token version checking, and cleans up stale sessions when the max active limit is exceeded. It is shared by both USER and ADMIN portals.

## High-Level Architecture

```
                    ┌──────────────────┐
                    │  POST /auth/     │
                    │  refresh         │
                    │  [cookie:        │
                    │   refreshToken]  │
                    └────────┬─────────┘
                             │
                             ▼
               ┌─────────────────────────┐
               │  SessionService.        │
               │  rotateSession()        │
               │  (this IS the pipeline) │
               └──────────┬──────────────┘
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
      ┌──────────┐ ┌──────────┐ ┌──────────────┐
      │Step 1:   │ │Step 2:   │ │   Step 3:    │
      │Verify    │→│Find      │→│  Check       │
      │Refresh   │ │Session   │ │  Account     │
      │Token JWT │ │by Hash   │ │  State +     │
      │          │ │          │ │  TokenVer    │
      └──────────┘ └──────────┘ └──────┬───────┘
                                       │
               ┌────────────┐ ┌────────▼───────┐
               │  Step 6:   │ │   Step 5:      │
               │  Create    │←│  Atomic        │
               │  New       │ │  Revoke (race  │
               │  Session   │ │  condition     │
               │             │ │  winner)       │
               └────────────┘ │  + Reuse       │
                              │  Detection     │
                              └────────────────┘
```

## Low-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ Client                    Controller            SessionService                  │
│                                                 Pipeline Steps                  │
│ POST /auth/refresh       AuthController         .rotateSession(refreshToken,   │
│ [cookie:                  .refresh()             device)                        │
│  refreshToken]            │                      │                              │
│    │                      │                      ▼                              │
│    │                      │             ┌──────────────────┐                    │
│    │                      │             │ verifyRefreshToken│                   │
│    │                      │             │                  │                    │
│    │                      │             │ JWT.verify with  │                    │
│    │                      │             │ refreshSecret    │                    │
│    │                      │             ├──────────────────┤                    │
│    │                      │             │ Check type ===   │                    │
│    │                      │             │ 'refresh'        │                    │
│    │                      │             ├──────────────────┤                    │
│    │                      │             │ Throws: 401 if   │                    │
│    │                      │             │ invalid/expired  │                    │
│    │                      │             └────────┬─────────┘                    │
│    │                      │                      │                              │
│    │                      │                      ▼                              │
│    │                      │             ┌──────────────────┐                    │
│    │                      │             │ findByHash       │                    │
│    │                      │             │                  │                    │
│    │                      │             │ sha256(refresh   │                    │
│    │                      │             │ Token) → hash    │                    │
│    │                      │             │                  │                    │
│    │                      │             │ Find session by  │                    │
│    │                      │             │ refreshTokenHash  │                   │
│    │                      │             ├──────────────────┤                    │
│    │                      │             │ Throws: 401 if   │                    │
│    │                      │             │ session not found│                    │
│    │                      │             └────────┬─────────┘                    │
│    │                      │                      │                              │
│    │                      │                      ▼                              │
│    │                      │             ┌──────────────────┐                    │
│    │                      │             │ findById(account) │                   │
│    │                      │             │                  │                    │
│    │                      │             │ Fetch account    │                    │
│    │                      │             │ by session.      │                    │
│    │                      │             │ accountId        │                    │
│    │                      │             ├──────────────────┤                    │
│    │                      │             │ Throws: 401 if   │                    │
│    │                      │             │ account not found │                   │
│    │                      │             └────────┬─────────┘                    │
│    │                      │                      │                              │
│    │                      │                      ▼                              │
│    │                      │             ┌──────────────────┐                    │
│    │                      │             │  checkSuspended  │                    │
│    │                      │             │                  │                    │
│    │                      │             │ if account.      │                    │
│    │                      │             │ currentState === │                    │
│    │                      │             │ 'SUSPENDED' →    │                    │
│    │                      │             │  throw 403       │                    │
│    │                      │             └────────┬─────────┘                    │
│    │                      │                      │                              │
│    │                      │                      ▼                              │
│    │                      │             ┌──────────────────┐                    │
│    │                      │             │  checkTokenVer   │                    │
│    │                      │             │                  │                    │
│    │                      │             │ if payload.tver  │                    │
│    │                      │             │ ≠ account.       │                    │
│    │                      │             │ tokenVersion →   │                    │
│    │                      │             │  revoke session  │                    │
│    │                      │             │  throw 401       │                    │
│    │                      │             │  (stale token)   │                    │
│    │                      │             └────────┬─────────┘                    │
│    │                      │                      │                              │
│    │                      │                      ▼                              │
│    │                      │             ┌──────────────────┐                    │
│    │                      │             │  tryAtomicRevoke │                    │
│    │                      │             │                  │                    │
│    │                      │             │ UPDATE session   │                    │
│    │                      │             │ SET revokedAt =  │                    │
│    │                      │             │ now, revoked     │                    │
│    │                      │             │ Reason = 'rotated'│                   │
│    │                      │             │ WHERE id = s.id  │                    │
│    │                      │             │ AND revokedAt IS │                    │
│    │                      │             │ NULL             │                    │
│    │                      │             ├──────────────────┤                    │
│    │                      │             │ Returns: boolean  │                    │
│    │                      │             │ (whether row     │                    │
│    │                      │             │  was updated)    │                    │
│    │                      │             │                  │                    │
│    │                      │             │ If false:        │                    │
│    │                      │             │  REUSE DETECTED  │                    │
│    │                      │             │  → revoke ALL    │                    │
│    │                      │             │  by tokenFamily  │                    │
│    │                      │             │  → throw 401     │                    │
│    │                      │             └────────┬─────────┘                    │
│    │                      │                      │                              │
│    │                      │                      ▼                              │
│    │                      │             ┌──────────────────┐                    │
│    │                      │             │  createSession   │                    │
│    │                      │             │                  │                    │
│    │                      │             │ New refresh token│                    │
│    │                      │             │ New access token │                    │
│    │                      │             │ Same tokenFamily │                    │
│    │                      │             │ (or new family)  │                    │
│    │                      │             │                  │                    │
│    │                      │             │ Checks maxActive │                    │
│    │                      │             │ → revoke oldest  │                    │
│    │                      │             │ if exceeded      │                    │
│    │                      │             └────────┬─────────┘                    │
│    │                      │                      │                              │
│    │                      │◄─────────────────────┘                              │
│    │◄─────────────────────┘                                                     │
│    │                                                                           │
│ ← { accessToken }         Set new refreshToken                                │
│    (refresh token in      as httpOnly cookie                                   │
│     cookie)               (same path, extended 7d)                            │
│    HTTP 200                                                                    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Pipeline Steps Detail

This pipeline is implemented entirely in `SessionService.rotateSession()`.

### Step 1: `verifyRefreshTokenJWT`

```
Input:  refreshToken string
Output: payload (RefreshTokenPayload: { sub, jti, tver, type })

Logic:
  - jwt.verify(token, refreshSecret) → payload
  - Check payload.type === 'refresh'
  - If JWT verify throws (expired, malformed, wrong secret) → throw 401 AUTH_TOKEN_INVALID
```

**Edge Cases:**
- Token expired → JWT throws `TokenExpiredError` → caught → 401
- Token tampered → JWT throws `JsonWebTokenError` → caught → 401
- Token from wrong portal (same keys) → type check passes, but cookie path differs → irrelevant for JWT

### Step 2: `findSessionByHash`

```
Input:  refreshToken string
Output: session (AccountSession row)

Logic:
  - hash = sha256(refreshToken)
  - sessionRepo.findByRefreshTokenHash(hash)
  - If not found → throw 401 AUTH_SESSION_EXPIRED
```

**Edge Cases:**
- Session was revoked (password reset, logout, admin action) → not found → 401
- Hash collision → not possible with SHA-256
- Session table cleaned up (expired purged) → not found → 401

### Step 3: `findAccountAndCheckState`

```
Input:  session.accountId
Output: account (Account with roles)

Logic:
  - accountRepo.findById(session.accountId) — includes roles
  - If not found → throw 401 ACCOUNT_NOT_FOUND
  - If account.currentState === 'SUSPENDED' → throw 403 ACCOUNT_SUSPENDED
```

**Edge Cases:**
- Account deleted (hard delete) → not found → 401
- Account suspended after session was created → 403, session effectively dead
- Account roles changed since session creation → new tokens will reflect current roles (read from DB, not from old JWT)

### Step 4: `checkTokenVersion`

```
Input:  payload.tver, account.tokenVersion
Output: (none, throws if mismatch)

Logic:
  - if payload.tver !== account.tokenVersion →
      sessionRepo.revoke(session.id, 'token_version_mismatch')
      throw 401 AUTH_TOKEN_REUSE
```

**Edge Cases:**
- Password was reset → tokenVersion incremented → tver mismatch → session revoked → client must re-login
- Admin "logout all devices" → same behavior
- TokenVersion overflow → unlikely (small int, but Prisma int can go high)

### Step 5: `tryAtomicRevoke` (Race Condition + Reuse Detection)

```
Input:  session.id
Output: boolean (true = won the race)

Logic:
  - UPDATE accountSession
    SET revokedAt = now(), revokedReason = 'rotated'
    WHERE id = session.id AND revokedAt IS NULL
  - If affected rows === 1 → true (we won)
  - If affected rows === 0 → false (someone else already revoked this session)
    - This means the refresh token was used before → REUSE ATTEMPT
    - Revoke ALL sessions in the same tokenFamily → security containment
    - throw 401 AUTH_TOKEN_REUSE
```

**Why Atomic Revoke?**
This is the critical security mechanism for refresh token rotation:
- Legitimate client refreshes: wins the atomic update, gets new tokens
- Attacker who stole the token tries to refresh: loses the atomic update (session already revoked)
- Family-wide revocation: if reuse is detected, all sibling sessions (issued from same family) are revoked, containing the breach
- This implements RFC 6819 OAuth 2.0 Threat Model Section 5.2.1.3

**Edge Cases:**
- Network split: client refreshes, wins atomic revoke, but response never reaches client → client will retry with old token on next 401 → atomic revoke already won (true) → new session exists, but client doesn't have tokens → tricky. Mitigated by:
  - Client's in-memory token store + interceptor queue
  - If network split resolves, client's next API call gets 401 → tries refresh → old token already revoked → reuse detection → family revoked → new session also invalidated → client gets 401 → redirects to login
- Legitimate concurrent refreshes from two tabs using same token → second loses atomic revoke → reuse detected → family revoked → both tabs logged out. This is a known trade-off: security vs UX. Mitigate by:
  - Using short access tokens (15min) to reduce concurrent refresh window
  - Client-side refresh deduplication (see `api.ts` interceptor with `failedQueue`)

### Step 6: `createSession` (New Token Pair)

```
Input:  session.accountId, account.roles, account.tokenVersion, device
Output: { accessToken, refreshToken, sessionId }

Logic:
  - generate new refresh token JWT with new jti
  - hash and store in new AccountSession row (same tokenFamily or new family)
  - generate new access token with current roles
  - Check maxActiveSessions → revoke oldest if exceeded
  - Return token pair
```

**Edge Cases:**
- Max active exceeded → oldest session (not the one being rotated) is revoked
- Device info changes → new session records current device fingerprint
- Roles changed → new access token reflects updated roles

## Refresh Flow Diagram (Reuse Detection)

```
Normal Flow:
  Client A                Server
    │                       │
    │── POST /auth/refresh──│
    │   [cookie: RT]        │
    │                       │── tryAtomicRevoke(session.id)
    │                       │   ✓ won → OK
    │                       │── createSession(...)
    │◄── { new AT, new RT }─│
    │                       │

Reuse Attack Flow:
  Attacker (stole RT)      Server              Client A (legitimate)
    │                       │                       │
    │── POST /auth/refresh──│                       │
    │   [cookie: RT]        │                       │
    │                       │── tryAtomicRevoke     │
    │                       │   ✓ won → OK          │
    │                       │── createSession(...)  │
    │◄── { new AT, new RT }─│                       │
    │                       │                       │
    │ (sends old RT)        │── POST /auth/refresh──│
    │                       │── tryAtomicRevoke     │
    │                       │   ✗ lost → REUSE!    │
    │                       │── revokeAllByFamily   │
    │                       │── throw 401           │
    │                       │◄──────────────────────│
    │                       │   (client A gets 401  │
    │                       │    on next API call)  │
```

## Error Scenarios

| Scenario | Step | HTTP | Code | Message |
|----------|------|------|------|---------|
| Expired/invalid token JWT | verifyJWT | 401 | AUTH_TOKEN_INVALID | Invalid token |
| Session not found in DB | findByHash | 401 | AUTH_SESSION_EXPIRED | Session expired |
| Account not found | findById | 401 | ACCOUNT_NOT_FOUND | Account not found |
| Account suspended | checkSuspended | 403 | ACCOUNT_SUSPENDED | Account suspended |
| Token version mismatch | checkTokenVer | 401 | AUTH_TOKEN_REUSE | Token reuse detected |
| Reuse detected (lost race) | tryAtomicRevoke | 401 | AUTH_TOKEN_REUSE | Token reuse detected |
| Rate limit exceeded | (middleware) | 429 | RATE_LIMIT_EXCEEDED | Too many requests |

## Cookie Management

Both refresh endpoints set a new refresh token cookie on every successful rotation:

| Portal | Cookie Path | Route |
|--------|-------------|-------|
| User | `/auth` | `POST /auth/refresh` |
| Admin | `/admin/auth` | `POST /admin/auth/refresh` |

Successfully refetched refresh token clears the old cookie and sets a new one with `maxAge: 7d`.

## Audit Events

| Event | Session ID | When |
|-------|-----------|------|
| (no dedicated audit for refresh — token rotation is a technical operation) |

## Testing Considerations

- **Happy path**: Refresh → get new tokens → use new access token → success
- **Expired token test**: Wait for refresh token expiry (7d) → 401
- **Reuse test**: Submit same refresh token twice → first succeeds, second returns 401 with family revocation
- **Concurrent refresh test**: Two simultaneous refresh attempts → one wins, one detects reuse (known limitation)
- **Suspended account test**: Suspend account mid-session → next refresh returns 403
- **Password reset test**: Reset password → previous refresh tokens return 401 (tver mismatch)
- **Revoked session test**: Logout → try to refresh → 401
- **Max active sessions test**: Create 5+ sessions → oldest auto-revoked
- **Client interceptor test**: Queue up 50 requests during refresh → all retry with new token

## Performance Characteristics

| Aspect | Expected |
|--------|----------|
| P50 latency | ~30ms (no password hashing) |
| P99 latency | ~100ms |
| DB queries | 2 reads + 1 write (atomic revoke) + 1 write (create session) + 1 count |
| External calls | 0 |
