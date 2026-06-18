# Error Codes Reference

All 79 error codes with HTTP status, when they fire, and i18n keys.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ERROR CODE CATEGORIES                               │
│                                                                         │
│   ┌──────────────┬───────┬─────────────────────────────────────┐      │
│   │ Category     │ Count │ Code Prefix                         │      │
│   ├──────────────┼───────┼─────────────────────────────────────┤      │
│   │ Auth         │  8    │ AUTH_                                │      │
│   │ OTP          │  9    │ OTP_                                 │      │
│   │ Account      │  4    │ ACCOUNT_                             │      │
│   │ Profile      │  6    │ PROFILE_                             │      │
│   │ Membership   │  3    │ MEMBERSHIP_                          │      │
│   │ Mandapam     │  2    │ MANDAPAM_                            │      │
│   │ Booking      │  5    │ BOOKING_                             │      │
│   │ Settlement   │  3    │ SETTLEMENT_                          │      │
│   │ Upload       │  3    │ UPLOAD_                              │      │
│   │ Validation   │  2    │ VALIDATION_                          │      │
│   │ General      │  5    │ GENERAL_ / RATE_LIMIT_ / FORBIDDEN   │      │
│   │ Calendar     │  2    │ CALENDAR_                            │      │
│   │ Token        │  3    │ TOKEN_                               │      │
│   └──────────────┴───────┴─────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
```

## Auth (8 codes)

| Code | Status | i18n Key | When |
|------|--------|----------|------|
| AUTH_INVALID_CREDENTIALS | 401 | `auth:errors.invalidCredentials` | Wrong email or password |
| AUTH_ACCOUNT_LOCKED | 403 | `auth:errors.accountLocked` | Account suspended |
| AUTH_TOKEN_EXPIRED | 401 | `auth:errors.tokenExpired` | JWT expired |
| AUTH_TOKEN_INVALID | 401 | `auth:errors.tokenInvalid` | JWT malformed/wrong secret |
| AUTH_REFRESH_INVALID | 401 | `auth:errors.refreshInvalid` | Refresh token not found |
| AUTH_REFRESH_EXPIRED | 401 | `auth:errors.refreshExpired` | Refresh token past TTL |
| AUTH_SESSION_EXPIRED | 401 | `auth:errors.sessionExpired` | Session timed out |
| AUTH_EMAIL_NOT_VERIFIED | 403 | `auth:errors.emailNotVerified` | Email not verified |

## OTP (9 codes)

| Code | Status | i18n Key | When |
|------|--------|----------|------|
| OTP_NOT_FOUND | 404 | `otp:errors.notFound` | OTP record missing |
| OTP_EXPIRED | 410 | `otp:errors.expired` | OTP past 3 min TTL |
| OTP_MAX_ATTEMPTS | 429 | `otp:errors.maxAttempts` | 5 failed attempts |
| OTP_COOLDOWN | 429 | `otp:errors.cooldown` | 60s between sends |
| OTP_ALREADY_VERIFIED | 409 | `otp:errors.alreadyVerified` | OTP already used |
| OTP_INVALID_CODE | 400 | `otp:errors.invalidCode` | Wrong code |
| OTP_CANCELLED | 410 | `otp:errors.cancelled` | OTP was cancelled |
| OTP_SEND_FAILED | 502 | `otp:errors.sendFailed` | SMTP unreachable |
| OTP_HARDLOCKED | 403 | `otp:errors.hardlocked` | Account level OTP lock |

## Account (4 codes)

| Code | Status | i18n Key | When |
|------|--------|----------|------|
| ACCOUNT_NOT_FOUND | 404 | `account:errors.notFound` | No account for email |
| ACCOUNT_DUPLICATE_EMAIL | 409 | `account:errors.duplicateEmail` | Email already registered |
| ACCOUNT_SUSPENDED | 403 | `account:errors.suspended` | Admin suspended |
| ACCOUNT_DELETED | 410 | `account:errors.deleted` | Account deleted |

## Profile (6 codes)

| Code | Status | i18n Key | When |
|------|--------|----------|------|
| PROFILE_NOT_FOUND | 404 | `profile:errors.notFound` | Profile ID not found |
| PROFILE_DUPLICATE | 409 | `profile:errors.duplicate` | User already has a profile |
| PROFILE_REJECTED | 403 | `profile:errors.rejected` | Admin rejected |
| PROFILE_ARCHIVED | 410 | `profile:errors.archived` | Profile archived |
| PROFILE_INCOMPLETE | 400 | `profile:errors.incomplete` | Missing required fields |
| PROFILE_LAPSED | 403 | `profile:errors.lapsed` | Membership expired |

## Membership (3 codes)

| Code | Status | i18n Key | When |
|------|--------|----------|------|
| MEMBERSHIP_EXPIRED | 403 | `membership:errors.expired` | Plan expired |
| MEMBERSHIP_LIMIT | 403 | `membership:errors.limitReached` | Plan cap exceeded |
| MEMBERSHIP_NOT_FOUND | 404 | `membership:errors.notFound` | No membership record |

## Booking (5 codes)

| Code | Status | i18n Key | When |
|------|--------|----------|------|
| BOOKING_NOT_FOUND | 404 | `booking:errors.notFound` | Booking ID invalid |
| BOOKING_CONFLICT | 409 | `booking:errors.conflict` | Overlapping booking |
| BOOKING_CANNOT_CANCEL | 400 | `booking:errors.cannotCancel` | Wrong state for cancel |
| BOOKING_CANNOT_MODIFY | 400 | `booking:errors.cannotModify` | Wrong state for modification |
| BOOKING_ALREADY_SETTLED | 409 | `booking:errors.alreadySettled` | Payment already processed |

## Mandapam (2 codes)

| Code | Status | i18n Key | When |
|------|--------|----------|------|
| MANDAPAM_NOT_FOUND | 404 | `mandapam:errors.notFound` | Hall not found |
| MANDAPAM_UNAVAILABLE | 409 | `mandapam:errors.unavailable` | Date already booked |

## Settlement (3 codes)

| Code | Status | i18n Key | When |
|------|--------|----------|------|
| SETTLEMENT_FAILED | 502 | `settlement:errors.gatewayError` | Payment gateway error |
| SETTLEMENT_NOT_FOUND | 404 | `settlement:errors.notFound` | Settlement record missing |
| SETTLEMENT_TIMEOUT | 408 | `settlement:errors.timeout` | Payment gateway timeout |

## Upload (3 codes)

| Code | Status | i18n Key | When |
|------|--------|----------|------|
| UPLOAD_TOO_LARGE | 413 | `upload:errors.tooLarge` | File > 5MB |
| UPLOAD_INVALID_TYPE | 415 | `upload:errors.invalidType` | Wrong file format |
| UPLOAD_FAILED | 500 | `upload:errors.failed` | Storage error |

## Validation (2 codes)

| Code | Status | i18n Key | When |
|------|--------|----------|------|
| VALIDATION_ERROR | 400 | `validation:errors.generic` | Zod validation failed |
| VALIDATION_MISSING_FIELD | 400 | `validation:errors.missingField` | Required field missing |

## Calendar (2 codes)

| Code | Status | i18n Key | When |
|------|--------|----------|------|
| CALENDAR_DATE_UNAVAILABLE | 409 | `calendar:errors.dateUnavailable` | Date blocked |
| CALENDAR_NOT_FOUND | 404 | `calendar:errors.notFound` | Calendar entry missing |

## Token (3 codes)

| Code | Status | i18n Key | When |
|------|--------|----------|------|
| TOKEN_NOT_FOUND | 404 | `token:errors.notFound` | Token missing |
| TOKEN_EXPIRED | 410 | `token:errors.expired` | Token past TTL |
| TOKEN_ALREADY_CONSUMED | 409 | `token:errors.alreadyConsumed` | Token already used |

## General (5 codes)

| Code | Status | i18n Key | When |
|------|--------|----------|------|
| INTERNAL_ERROR | 500 | `common:errors.internalError` | Unhandled exception |
| RATE_LIMIT_EXCEEDED | 429 | `common:errors.rateLimited` | Too many requests |
| FORBIDDEN | 403 | `common:errors.forbidden` | Not authorized |
| NOT_FOUND | 404 | `common:errors.notFound` | Route not found |
| METHOD_NOT_ALLOWED | 405 | `common:errors.methodNotAllowed` | Wrong HTTP method |
