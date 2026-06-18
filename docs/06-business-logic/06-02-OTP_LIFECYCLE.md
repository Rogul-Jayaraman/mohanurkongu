# OTP Lifecycle

One-time password lifecycle — from generation to purge.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        OTP STATE MACHINE                               │
│                                                                         │
│                   ┌──────────────┐                                      │
│                   │   PENDING    │  ← Generated, waiting for input     │
│                   └──────┬───────┘                                      │
│                          │                                              │
│               ┌──────────┼──────────┐                                  │
│               │          │          │                                    │
│               ▼          ▼          ▼                                    │
│          ┌────────┐ ┌────────┐ ┌──────────┐                            │
│          │VERIFIED│ │EXPIRED │ │CANCELLED │                            │
│          └────────┘ └────────┘ └──────────┘                            │
│               │          │          │                                    │
│               │          ▼          │                                    │
│               │     ┌──────────┐    │                                   │
│               └─────▶  ARCHIVED  ◀──┘                                   │
│                     └────┬─────┘                                        │
│                          │                                              │
│                          ▼                                              │
│                     ┌──────────┐                                        │
│                     │  PURGED  │  (hard delete after 90 days)           │
│                     └──────────┘                                        │
│                                                                         │
│   RESTRICTED TRANSITIONS:                                              │
│   PENDING → PURGED  ✗          EXPIRED → VERIFIED  ✗                  │
│   VERIFIED → EXPIRED ✗         CANCELLED → VERIFIED ✗                 │
└─────────────────────────────────────────────────────────────────────────┘
```

## Transitions

| From | To | Trigger | When |
|------|----|---------|------|
| PENDING | VERIFIED | User submits correct code | OTP verify step |
| PENDING | EXPIRED | 3-minute TTL elapsed | Background job or check on access |
| PENDING | CANCELLED | User requests new OTP | Auto-cancels previous pending OTP |
| VERIFIED | ARCHIVED | Post-verification cleanup | Immediately after use |
| EXPIRED | ARCHIVED | Retention policy | 24 hours after expiry |
| CANCELLED | ARCHIVED | Retention policy | 24 hours after cancel |
| ARCHIVED | PURGED | Hard delete | 90 days after archive |

## Business Rules

1. **Cooldown**: 60 seconds between OTP sends to the same email/phone
2. **Max attempts**: 5 failed verify attempts → OTP moves to EXPIRED
3. **TTL**: 3 minutes from creation
4. **Length**: 6 digits
5. **Rate limit**: 3 OTP sends per 15 minutes per account
6. **One active OTP**: Creating a new OTP cancels any existing PENDING OTP for the same target

## Edge Cases

| Scenario | Behavior | Why |
|----------|----------|-----|
| Submit OTP after expiry | 410 GONE + error message | OTP_EXPIRED |
| Submit OTP already used | 409 CONFLICT | OTP_ALREADY_VERIFIED |
| 5th wrong attempt | OTP moves to EXPIRED, locked out | Prevent brute force |
| Send OTP during 60s cooldown | 429 with Retry-After header | Rate limiting |
| OTP for unregistered email | 404 NOT FOUND | Don't reveal account existence? No — we allow any email |
| Two OTPs sent, which is valid? | Only the most recent PENDING one | Others are auto-cancelled |
| OTP contains leading zeros | Stored as string, compared as string | Preserve "001234" |
| Server restarts mid-OTP | TTL checked on access, not in memory | Stateless check |
| SMS fails after OTP created | OTP exists but never delivered; user can request resend | Resend cancels + creates new |
| Hardlock after max attempts | OTP moves to EXPIRED, user must request new OTP | Replaces brute-force scenario |
