# API Reference

All endpoints grouped by module.

## Auth (`/api/auth`)

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| POST | `/api/auth/register` | None | 5/15min | Create account |
| POST | `/api/auth/login` | None | 5/15min | Login with email + password |
| POST | `/api/auth/refresh` | Cookie | — | Refresh access token |
| POST | `/api/auth/logout` | ✓ | — | Clear session + cookies |
| POST | `/api/auth/otp/send` | None | 3/15min | Send verification OTP |
| POST | `/api/auth/otp/verify` | None | 5/15min | Verify OTP code |
| POST | `/api/auth/reset-password` | None | 3/60min | Request password reset |
| POST | `/api/auth/change-password` | ✓ | — | Change password (authenticated) |

### POST `/api/auth/login`

```json
// Request
{ "email": "user@example.com", "password": "Password123!" }

// Response 200
{ "data": { "user": { "id": "uuid", "email": "user@example.com", "role": "USER" } } }
// Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=604800

// Error 401
{ "error": { "code": "AUTH_INVALID_CREDENTIALS", "message": "Invalid email or password", "statusCode": 401 } }
```

## Manamaalai — Profiles (`/api/profiles`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/profiles` | Optional | Browse profiles (tier-filtered) |
| GET | `/api/profiles/:id` | Optional | View profile detail |
| POST | `/api/profiles` | ✓ | Create profile |
| PUT | `/api/profiles/:id` | ✓ (owner) | Update profile |
| DELETE | `/api/profiles/:id` | ✓ (owner) | Delete profile |
| POST | `/api/profiles/:id/shortlist` | ✓ | Toggle shortlist |
| GET | `/api/profiles/my` | ✓ | Get own profiles |

## Manamaalai — Admin (`/admin/manamaalai`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/manamaalai/profiles` | ADMIN | List all profiles |
| GET | `/admin/manamaalai/profiles/:id` | ADMIN | View profile detail |
| PUT | `/admin/manamaalai/profiles/:id/status` | ADMIN | Approve/reject/archive |
| DELETE | `/admin/manamaalai/profiles/:id` | ADMIN | Soft delete |

## Maaligai (`/api/mandapams`, `/api/bookings`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/mandapams` | Optional | List halls |
| GET | `/api/mandapams/:id` | Optional | Hall detail + calendar |
| POST | `/api/bookings` | ✓ | Create booking |
| GET | `/api/bookings` | ✓ | List own bookings |
| GET | `/api/bookings/:id` | ✓ | Booking detail |
| POST | `/api/bookings/:id/cancel` | ✓ | Cancel booking |
| POST | `/api/bookings/:id/settle` | ✓ | Initiate settlement |
| GET | `/api/calendar?mandapamId=&date=` | Optional | View calendar availability |

## Mandapam — Booking Admin (`/admin/mandapam`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/mandapam/bookings` | ADMIN | List all bookings |
| PUT | `/admin/mandapam/bookings/:id/status` | ADMIN | Update booking status |
| POST | `/admin/mandapam/calendar/block` | ADMIN | Block calendar dates |

## System

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Basic health check |
| GET | `/health/db` | Database health |
| GET | `/health/redis` | Redis health |
| GET | `/admin/queues` | Bull Board UI (ADMIN) |
