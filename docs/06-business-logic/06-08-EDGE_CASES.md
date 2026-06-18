# Cross-cutting Edge Cases

Scenarios that span multiple systems or are too broad for per-entity edge case sections.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CROSS-CUTTING EDGE CASES                            │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │ # │ Scenario               │ Impact     │ Mitigation            │  │
│   ├─────────────────────────────────────────────────────────────────┤  │
│   │ 1 │ Concurrent refresh     │ 2 sessions  │ Token family +       │  │
│   │   │ race                   │             │ version check        │  │
│   │ 2 │ OTP brute force        │ Account     │ Max attempts →       │  │
│   │   │                        │ lockout     │ EXPIRED state        │  │
│   │ 3 │ Double-booking race    │ Calendar    │ $transaction +       │  │
│   │   │                        │ conflict    │ unique constraint    │  │
│   │ 4 │ DB down on login       │ Auth down   │ Error handling +     │  │
│   │   │                        │             │ retry in service     │  │
│   │ 5 │ Redis down             │ Cache miss  │ Graceful degradation │  │
│   │ 6 │ SMTP down              │ OTP stuck   │ Log error + retry    │  │
│   │ 7 │ Concurrent profile     │ Race        │ Upsert pattern +     │  │
│   │   │ upsert                 │ condition   │ locking              │  │
│   │ 8 │ Token stolen           │ Account     │ Rotate on use,       │  │
│   │   │                        │ hijack      │ family invalidation  │  │
│   │ 9 │ Payment processed but  │ Double      │ Idempotency key      │  │
│   │   │ system crash before DB │ charge      │ (payment gateway)    │  │
│   │10 │ Migration fails in     │ DB schema   │ Rollback + fix +     │  │
│   │   │ production             │ mismatch    │ re-deploy            │  │
│   │11 │ User on two devices    │ Session     │ Both active,         │  │
│   │   │                        │ conflict    │ refresh token per    │  │
│   │   │                        │             │ device               │  │
│   │12 │ File upload exceeds    │ Storage     │ Size check before    │  │
│   │   │ disk quota             │ full        │ processing           │  │
│   │13 │ Profile view count     │ Inflated    │ Dedup by user +      │  │
│   │   │ repeatedly refreshed   │ stats       │ session per time     │  │
│   │14 │ Browser blocks third-  │ Auth        │ Cookie set without   │  │
│   │   │ party cookies          │ broken      │ SameSite=None → use  │  │
│   │   │                        │             │ SameSite=Lax         │  │
│   │15 │ Cert renewal fails     │ SSL expired │ Keep old cert, alert │  │
│   └─────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## 1. Concurrent Refresh Race

Two API requests arrive simultaneously with the same refresh token.

**Impact**: One succeeds, the other fails. This is **intentional** — it prevents token replay.

**Mitigation**: Token version + family:
- Each refresh token has a `familyId` and `version`
- On use: version increments, old token is invalidated
- If an old version is presented → entire family is invalidated (token stolen detected)

## 2. OTP Brute Force

Attacker tries all 1M possible 6-digit codes.

**Impact**: After 5 failed attempts, OTP moves to EXPIRED state. Attacker must start over.

**Mitigation**: Rate limit + max attempts + cooldown timer.

## 3. Double-Booking Race Condition

Two users book the same mandapam for the same date simultaneously.

**Impact**: Calendar conflict if not handled atomically.

**Mitigation**:
1. Calendar availability check inside Prisma `$transaction`
2. Unique constraint on `(mandapamId, date)` in CalendarEntry
3. Second booking fails with 409 BOOKING_CONFLICT

## 4. Database Down

PostgreSQL is unreachable during a login request.

**Impact**: Auth is down. Users can't log in.

**Mitigation**:
- Backend returns 500 with error logged to Sentry
- Frontend shows "Service temporarily unavailable"
- Docker healthcheck restarts container
- Connection pooling + retry logic in Prisma

## 5. Redis Down

Redis service crashes.

**Impact**:
- Session store → falls through to DB (graceful degradation)
- Cache → all requests hit PostgreSQL (slower but works)
- BullMQ → jobs queue in memory (lost on restart unless persistent)

**Mitigation**: Redis persistence (AOF + RDB), health checks, auto-restart.

## 6. SMTP Down

Email service (OTP delivery) is unreachable.

**Impact**: OTP send returns error. User can't verify email.

**Mitigation**:
- Backend logs error, returns 502
- BullMQ retry queue for email delivery
- Admin alert on repeated email failures

## 7. Concurrent Profile Upsert

User saves profile from two browser tabs at the same time.

**Impact**: Last write wins. Some data could be lost.

**Mitigation**:
- Profile upsert pipeline uses Prisma `$transaction`
- Client-side: disable save button while request is in flight
- Version field (future: optimistic concurrency control)

## 8. Stolen Refresh Token

Attacker obtains the refresh token cookie.

**Impact**: Attacker can issue new access tokens until the family is invalidated.

**Mitigation**:
- Token family + version: if old version detected, invalidate entire family
- User can revoke all sessions from account settings
- Refresh token is httpOnly, Secure, SameSite=Lax

## 9. Payment Gateway Timeout

Payment succeeds at gateway but backend crashes before recording it.

**Impact**: User charged but booking not confirmed. Potential double-charge on retry.

**Mitigation**:
- Idempotency key sent with each payment request
- Gateway returns existing result if same key used
- BullMQ job reconciles pending payments with gateway

## 10-15: Additional Scenarios

| # | Key Takeaway |
|---|-------------|
| 10 | Always test migrations in staging before production |
| 11 | Multi-device: each device gets its own refresh token |
| 12 | Check available disk before accepting upload |
| 13 | Deduplicate view counts by user + session within time window |
| 14 | SameSite=Lax for cookies: works for top-level navigation |
| 15 | Certbot auto-renewal failure → alert, SSL still works with old cert |
