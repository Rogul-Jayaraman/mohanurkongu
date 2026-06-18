# Request Lifecycle

What happens from the moment a user clicks a button to when they see the result.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  FULL REQUEST LIFECYCLE (3-column swimlane)            │
│                                                                         │
│  BROWSER              NGINX                  BACKEND                    │
│  ┌─────────┐          ┌─────────┐            ┌──────────────────────┐  │
│  │Click    │          │         │            │                      │  │
│  │"Login"  │          │         │            │                      │  │
│  └────┬────┘          │         │            │                      │  │
│       │ POST /api/    │         │            │                      │  │
│       │ auth/login    │         │            │                      │  │
│       ▼               │         │            │                      │  │
│  ┌─────────┐          │         │            │                      │  │
│  │Axios    │─────────▶│ :443    │───────────▶│                      │  │
│  │POST     │          │ HTTPS   │            │                      │  │
│  └─────────┘          │         │            │                      │  │
│       ▲               │  ┌──────────────┐    │  ┌──────────────┐    │  │
│       │               │  │301 if HTTP    │    │  │helmet        │    │  │
│       │               │  │/api/* → :3000 │    │  │cors          │    │  │
│       │               │  └──────────────┘    │  │cookieParser   │    │  │
│       │               │                      │  │rateLimit      │    │  │
│       │               │                      │  │session        │    │  │
│       │               │                      │  │i18n           │    │  │
│       │               │                      │  │router         │    │  │
│       │               │                      │  └───────┬───────┘    │  │
│       │               │                      │          │            │  │
│       │               │                      │  ┌───────▼───────┐    │  │
│       │               │                      │  │ authRouter    │    │  │
│       │               │                      │  │ POST /login   │    │  │
│       │               │                      │  └───────┬───────┘    │  │
│       │               │                      │          │            │  │
│       │               │                      │  ┌───────▼───────┐    │  │
│       │               │                      │  │ requireBody   │    │  │
│       │               │                      │  │ (Zod parse)   │    │  │
│       │               │                      │  │ ──email──    │    │  │
│       │               │                      │  │ password      │    │  │
│       │               │                      │  └───────┬───────┘    │  │
│       │               │                      │          │            │  │
│       │               │                      │  ┌───────▼───────┐    │  │
│       │               │                      │  │ LoginPipeline │    │  │
│       │               │                      │  │ Step 1: find  │    │  │
│       │               │                      │  │  account      │    │  │
│       │               │                      │  │ Step 2: verify│    │  │
│       │               │                      │  │  password     │    │  │
│       │               │                      │  │ Step 3: check │    │  │
│       │               │                      │  │  status       │    │  │
│       │               │                      │  │ Step 4: check │    │  │
│       │               │                      │  │  membership   │    │  │
│       │               │                      │  │ Step 5: gen   │    │  │
│       │               │                      │  │  tokens       │    │  │
│       │               │                      │  │ Step 6: set   │    │  │
│       │               │                      │  │  cookies      │    │  │
│       │               │                      │  │ Step 7: send  │    │  │
│       │               │                      │  │  response     │    │  │
│       │               │                      │  └───────┬───────┘    │  │
│       │               │                      │          │            │  │
│       │               │                      │  ┌───────▼───────┐    │  │
│       │               │                      │  │ Response      │    │  │
│       │               │                      │  │ { user,       │    │  │
│       │               │                      │  │   token, ... } │    │  │
│       │               │                      │  └───────────────┘    │  │
│       │               │                      │                        │  │
│  ┌─────────┐          │                      │                        │  │
│  │React    │◀─────────│◀─────────────────────│◀───────────────────    │  │
│  │updates  │          │                      │                        │  │
│  │UI       │          │                      │                        │  │
│  └─────────┘          │                      │                        │  │
│                                                                         │
│  SIDE TRACES (happen alongside the main flow):                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ • Audit log: Step 7 writes login event to audit_log table        │  │
│  │ • Cookie: Set-Cookie header with refresh token (httpOnly)        │  │
│  │ • Cache: React Query caches user data on frontend                │  │
│  │ • Sentry: Captures any unhandled error                           │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## The Path, Step by Step

| # | Component | What Happens |
|---|-----------|-------------|
| 1 | Browser | User clicks "Login". React dispatches an Axios POST to `/api/auth/login`. |
| 2 | Nginx | Receives request on port 443. Routes `/api/*` to `backend:3000`. Adds forwarded headers. |
| 3 | helmet | Sets security headers (CSP, HSTS, X-Frame-Options, etc.) |
| 4 | cors | Validates origin against whitelist. Adds CORS headers. |
| 5 | cookieParser | Parses `Cookie` header into `req.cookies`. |
| 6 | rateLimit | Checks rate limiter (global + per-route). Returns 429 if exceeded. |
| 7 | session | Resumes or creates session (used for non-JWT state). |
| 8 | i18n | Detects language from `Accept-Language` or cookie. Sets `req.t()`. |
| 9 | router | Routes to `authRouter` based on path `/auth/login`. |
| 10 | requireBody | Zod schema parses + validates request body. Returns 400 if invalid. |
| 11 | Pipeline | LoginPipeline runs 7 sequential steps (see pipeline docs). |
| 12 | Controller | Receives pipeline output, formats HTTP response. |
| 13 | Response | JSON body + Set-Cookie header + status code sent back. |
| 14 | Nginx | Passes response to browser. |
| 15 | Browser | React Query caches result. UI updates. |

## Error Handling

If any step throws an `AppError`, the error middleware catches it and returns a structured error response:

```json
{
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "statusCode": 401
  }
}
```

See [Error Handling Guide](../04-development/04-06-ERROR_HANDLING_GUIDE.md) for all error codes.

## Edge Cases

| Scenario | What Happens | Mitigation |
|----------|-------------|-----------|
| Network failure before nginx | Browser shows connection error | Axios timeout + retry |
| Nginx receives HTTP on port 80 | 301 redirect to HTTPS | Automatic in production config |
| Rate limit exceeded | 429 Too Many Requests | `Retry-After` header set |
| Invalid request body | 400 Bad Request | Zod validation error message |
| Account doesn't exist | 401 Unauthorized | Error returned; no account enumeration |
| Account suspended | 403 Forbidden | Login rejected at status check step |
| Database connection failure | 500 Internal Server Error | Sentry captures error |
| JWT expired on request | 401 → Frontend calls refresh → retries | Axios interceptor handles automatically |
| Concurrent refresh race | Only one refresh succeeds; others get 401 | Token family + version check |
