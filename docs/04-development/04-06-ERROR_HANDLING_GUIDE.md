# Error Handling Guide

How errors flow from backend to frontend — with all 79 error codes.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING FLOW                                 │
│                                                                         │
│   BACKEND                             FRONTEND                          │
│                                                                         │
│   ┌──────────────────────┐           ┌──────────────────────────┐      │
│   │ Pipeline step fails  │           │ Axios interceptor        │      │
│   │ returns StepOutput   │           │ catches error response   │      │
│   │ with error           │           │                          │      │
│   └──────────┬───────────┘           │  ┌────────────────────┐  │      │
│              │                       │  │ 401? → refresh     │  │      │
│              ▼                       │  │ 429? → retry+toast │  │      │
│   ┌──────────────────────┐           │  │ 403? → redirect    │  │      │
│   │ Runner stops pipeline│           │  │ else → show error  │  │      │
│   │ Returns error result │           │  └────────────────────┘  │      │
│   └──────────┬───────────┘           └──────────────────────────┘      │
│              │                                                          │
│              ▼                                                          │
│   ┌──────────────────────┐                                             │
│   │ Controller catches   │                                             │
│   │ -> calls next(err)   │                                             │
│   └──────────┬───────────┘                                             │
│              │                                                          │
│              ▼                                                          │
│   ┌──────────────────────┐                                             │
│   │ Error middleware     │                                             │
│   │ translates error ->  │                                             │
│   │ sends structured     │                                             │
│   │ JSON response        │                                             │
│   └──────────┬───────────┘                                             │
│              │                                                          │
│              ▼                                                          │
│   ┌──────────────────────┐                                             │
│   │ Response:            │                                             │
│   │ { error: {           │                                             │
│   │   code: "...",       │                                             │
│   │   message: "...",    │                                             │
│   │   statusCode: NNN    │                                             │
│   │ }}                   │                                             │
│   └──────────────────────┘                                             │
└─────────────────────────────────────────────────────────────────────────┘
```

## Backend Error Structure

All errors use `AppError`:

```typescript
class AppError extends Error {
  constructor(
    public code: ErrorCode,     // Machine-readable: 'AUTH_INVALID_CREDENTIALS'
    public statusCode: number,  // HTTP: 401
    public message: string,     // i18n key: 'auth:errors.invalidCredentials'
    public details?: unknown,   // Optional: field-level validation errors
  ) { super(message); }
}
```

Error middleware produces:
```json
{
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "statusCode": 401
  }
}
```

## Error Code Categories

### Auth (codes AUTH_*)

| Code | Status | When |
|------|--------|------|
| AUTH_INVALID_CREDENTIALS | 401 | Wrong email or password |
| AUTH_ACCOUNT_LOCKED | 403 | Account suspended |
| AUTH_TOKEN_EXPIRED | 401 | JWT expired |
| AUTH_TOKEN_INVALID | 401 | JWT malformed or wrong secret |
| AUTH_REFRESH_INVALID | 401 | Refresh token not found |
| AUTH_REFRESH_EXPIRED | 401 | Refresh token past TTL |
| AUTH_SESSION_EXPIRED | 401 | Session timed out |
| AUTH_EMAIL_NOT_VERIFIED | 403 | Email not verified |
| AUTH_MFA_REQUIRED | 403 | MFA needed |

### OTP (codes OTP_*)

| Code | Status | When |
|------|--------|------|
| OTP_NOT_FOUND | 404 | OTP record missing |
| OTP_EXPIRED | 410 | OTP past TTL (3 min) |
| OTP_MAX_ATTEMPTS | 429 | 5 failed attempts |
| OTP_COOLDOWN | 429 | 60s between sends |
| OTP_ALREADY_VERIFIED | 409 | OTP already used |
| OTP_INVALID_CODE | 400 | Wrong code |
| OTP_CANCELLED | 410 | OTP was cancelled |

### Account (codes ACCOUNT_*)

| Code | Status | When |
|------|--------|------|
| ACCOUNT_NOT_FOUND | 404 | No account for email |
| ACCOUNT_DUPLICATE_EMAIL | 409 | Email already registered |
| ACCOUNT_SUSPENDED | 403 | Admin suspended |
| ACCOUNT_DELETED | 410 | Account deleted |

### Profile (codes PROFILE_*)

| Code | Status | When |
|------|--------|------|
| PROFILE_NOT_FOUND | 404 | Profile ID not found |
| PROFILE_DUPLICATE | 409 | User already has a profile |
| PROFILE_REJECTED | 403 | Admin rejected profile |
| PROFILE_ARCHIVED | 410 | Profile archived |
| PROFILE_INCOMPLETE | 400 | Missing required fields |

### Membership (codes MEMBERSHIP_*)

| Code | Status | When |
|------|--------|------|
| MEMBERSHIP_EXPIRED | 403 | Plan expired |
| MEMBERSHIP_LIMIT | 403 | Plan cap exceeded |
| MEMBERSHIP_NOT_FOUND | 404 | No membership record |

### Mandapam / Booking (codes MANDAPAM_*, BOOKING_*)

| Code | Status | When |
|------|--------|------|
| MANDAPAM_NOT_FOUND | 404 | Hall not found |
| MANDAPAM_UNAVAILABLE | 409 | Date already booked |
| BOOKING_CONFLICT | 409 | Overlapping booking |
| BOOKING_NOT_FOUND | 404 | Booking ID invalid |
| BOOKING_CANNOT_CANCEL | 400 | Wrong state for cancel |
| SETTLEMENT_FAILED | 502 | Payment gateway error |

### Upload (codes UPLOAD_*)

| Code | Status | When |
|------|--------|------|
| UPLOAD_TOO_LARGE | 413 | File exceeds limit |
| UPLOAD_INVALID_TYPE | 415 | Wrong file format |
| UPLOAD_FAILED | 500 | Storage error |

### Validation (codes VALIDATION_*)

| Code | Status | When |
|------|--------|------|
| VALIDATION_ERROR | 400 | Zod validation failed |
| VALIDATION_MISSING_FIELD | 400 | Required field missing |

### General (codes GENERAL_*, RATE_LIMIT_*, FORBIDDEN)

| Code | Status | When |
|------|--------|------|
| INTERNAL_ERROR | 500 | Unhandled error |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| FORBIDDEN | 403 | Not authorized |
| NOT_FOUND | 404 | Route not found |
| METHOD_NOT_ALLOWED | 405 | Wrong HTTP method |

## Frontend Error Handling

```typescript
// Axios interceptor (services/api.ts)
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;
    const errorCode = error.response?.data?.error?.code;

    if (status === 401 && errorCode !== 'AUTH_INVALID_CREDENTIALS') {
      // Try refresh
      const refreshed = await authService.refresh();
      if (refreshed) {
        return api.request(error.config!); // Retry original request
      }
      // Refresh failed — redirect to login
      window.location.href = '/auth/login';
      return Promise.reject(error);
    }

    if (status === 429) {
      toast.warn(t('common:errors.rateLimited'));
    }

    return Promise.reject(error);
  },
);
```

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Unhandled exception in step | Runner catches, wraps as INTERNAL_ERROR (500) |
| Error in error handler itself | Express default handler catches (returns 500 HTML) |
| Async error outside Express | `process.on('unhandledRejection')` logs + Sentry |
| Validation error with multiple fields | Returns array in `details` field |
| Error message not found in i18n | Falls back to English, logs missing key warning |
