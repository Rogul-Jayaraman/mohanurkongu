# API Reference

## Base URL

```
Development: http://localhost:4000
Production: https://<domain>/api
```

All API endpoints are prefixed with `/api` (mounted in `app.ts` via `app.use('/api', routes)`).

## Authentication

### POST /auth/send-otp

Send OTP to email for registration or password reset.

**Request:**
```json
{
  "email": "user@example.com",
  "type": "registration"
}
```

**Type enum:** `registration` | `password-reset`

**Rate Limit:** 10 requests per 15 minutes (per IP)

**Response (200):**
```json
{
  "message": "OTP sent successfully",
  "expiresIn": 300
}
```

**BUG-CRIT-001:** The OTP is generated, hashed, stored but never delivered via email. `enqueueOtpEmail()` is defined but never called.

---

### POST /auth/verify-otp

Verify an OTP code.

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "12345",
  "type": "registration"
}
```

**Rate Limit:** 10 requests per 15 minutes (per IP)

**Response (200):**
```json
{
  "message": "OTP verified successfully",
  "token": "<JWT verification token>"
}
```

**BUG-CRIT-003:** The returned `token` is signed using `JWT_ACCESS_SECRET` (same as real access tokens). A separate `JWT_VERIFICATION_SECRET` should be used.

**Error (400):**
```json
{ "error": "Invalid OTP" }
```
```json
{ "error": "OTP expired" }
```

---

### POST /auth/signup

Create a new account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secret123",
  "confirmPassword": "secret123",
  "name": "User Name",
  "token": "<verification token from verify-otp>"
}
```

**Rate Limit:** 10 requests per 15 minutes

**Response (201):**
```json
{
  "id": "uuid",
  "accountNo": "MKM10001",
  "roles": ["USER"],
  "membership": null,
  "accessToken": "<JWT access token>",
  "refreshToken": "<cookie>"
}
```

**BUG-CRIT-002:** `dto.email` is NOT validated against the verified OTP's `target`. An account can be created with a different email than the one that was OTP-verified.

**BUG-CRIT-004:** Welcome email (`enqueueWelcomeEmail`) is never called after signup.

**BUG-CRIT-003:** The verification token in request is verified using `JWT_ACCESS_SECRET`.

---

### POST /auth/login

Authenticate a user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "secret123",
  "portal": "USER"
}
```

**Portal enum:** `USER` | `ADMIN` (optional — **BUG-MED-004**)

**Rate Limit:** 10 requests per 15 minutes

**Response (200):**
```json
{
  "id": "uuid",
  "accountNo": "MKM10001",
  "roles": ["USER"],
  "membership": null,
  "accessToken": "<JWT>"
}
```

**Set-Cookie:** `refreshToken=<token>; HttpOnly; Secure; SameSite=Strict; Path=/auth; Max-Age=604800`

**BUG-ADMIN-001:** Login response only returns `{ id, accountNo, roles, membership }`. The frontend `mapAccountToAdmin` adapter expects `name`, `email`, `phone`, `avatar`, `createdAt` — all `undefined`.

**BUG-MED-001:** Refresh cookie path `/auth` leaks to all public `/auth/*` endpoints.

---

### GET /auth/me

Get currently authenticated user's profile.

**Auth:** Required (Bearer token or `req.user` set by `requireAuth`)

**Response (200):**
```json
{
  "id": "uuid",
  "accountNo": "MKM10001",
  "email": "user@example.com",
  "name": "User Name",
  "phone": null,
  "avatar": "",
  "roles": ["USER"],
  "membership": null,
  "membershipExpiresAt": null,
  "isVerified": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### POST /auth/refresh

Refresh access token using refresh token cookie.

**Auth:** Cookie-based (refresh token cookie required)

**Missing Rate Limiter** (BUG-HIGH-003)

**Response (200):**
```json
{
  "accessToken": "<new JWT>"
}
```

**Set-Cookie:** New refresh token cookie with rotation.

**BUG-HIGH-001:** Two concurrent refresh requests both succeed because both read `revokedAt = null` before either writes.

---

### POST /auth/logout

Logout current session.

**Auth:** Required

**Missing Rate Limiter** (BUG-HIGH-003)

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

**Clear-Cookie:** refreshToken cookie cleared.

---

### POST /auth/logout-all

Logout all sessions.

**Auth:** Required

**Rate Limit:** 5 requests per 15 minutes

**Response (200):**
```json
{
  "message": "Logged out from all devices"
}
```

---

### POST /auth/forgot-password

Request password reset OTP.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Rate Limit:** 5 requests per 15 minutes

**Response (200):**
```json
{
  "message": "Password reset OTP sent to email"
}
```

**BUG-CRIT-001:** OTP never delivered via email.

---

### POST /auth/verify-password-otp

Verify password reset OTP.

**Request:**
```json
{
  "email": "user@example.com",
  "otp": "12345"
}
```

**Rate Limit:** 10 requests per 15 minutes

**Response (200):**
```json
{
  "message": "OTP verified",
  "token": "<reset JWT>"
}
```

---

### POST /auth/reset-password

Reset password using verified token.

**Request:**
```json
{
  "token": "<reset JWT>",
  "password": "newPassword123",
  "confirmPassword": "newPassword123"
}
```

**Missing Rate Limiter**

**Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

---

### POST /auth/change-password

Change password (authenticated).

**Request:**
```json
{
  "currentPassword": "old123",
  "newPassword": "new123",
  "confirmNewPassword": "new123"
}
```

**Auth:** Required

**Rate Limit:** 5 requests per 15 minutes

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

**BUG-HIGH-002:** `tokenVersion` is incremented but existing sessions are NOT revoked. Old sessions remain valid.

---

### GET /health

Health check endpoint.

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345
}
```

## Error Response Format (all endpoints)

```json
{
  "error": "Error message string"
}
```

## HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created (signup) |
| 400 | Bad request / validation error |
| 401 | Unauthorized (invalid credentials, expired/missing token) |
| 403 | Forbidden (BUG-ADMIN-003: role guard NOT enforced) |
| 404 | Not found |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal server error |

## Missing Endpoints (Frontend calls, no backend implementation)

- Profile CRUD (GET/POST/PUT profiles/*)
- Photo upload
- Browse/search profiles
- Shortlist (POST/DELETE shortlist)
- Interest expression
- Mandapam CRUD
- Mandapam availability
- Mandapam bookings
- Admin stats/dashboard
- Admin profile verification
- Admin user management
- Admin analytics
- Admin membership management
- Admin system settings
