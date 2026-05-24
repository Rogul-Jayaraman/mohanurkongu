# Environment Variables Reference

## Configuration Source

Environment variables are loaded by `backend/src/config/env.ts` using `dotenv`. The `.env` file sits at the backend root.

## Variable Reference

### Server

| Variable | Required | Default | Secret | Used By | Rotate |
|---|---|---|---|---|---|
| `PORT` | No | `4000` | No | Backend, Workers | — |
| `NODE_ENV` | Yes | — | No | Backend | — |

### Database (PostgreSQL)

| Variable | Required | Default | Secret | Used By | Rotate |
|---|---|---|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://postgres:postgres@localhost:5432/manamaalai` | Yes | Backend, Workers, Prisma | — |

Connection string format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`

### Redis (BullMQ)

| Variable | Required | Default | Secret | Used By | Rotate |
|---|---|---|---|---|---|
| `REDIS_HOST` | No | `localhost` | No | Backend, Workers | — |
| `REDIS_PORT` | No | `6379` | No | Backend, Workers | — |

### JWT (Authentication)

| Variable | Required | Default | Secret | Used By | Rotate |
|---|---|---|---|---|---|
| `JWT_ACCESS_SECRET` | Yes | — | **YES** | AuthModule (signAccessToken, verifyAccessToken) | 90 days |
| `JWT_REFRESH_SECRET` | Yes | — | **YES** | AuthModule (signRefreshToken, verifyRefreshToken) | 90 days |
| `JWT_ACCESS_EXPIRES_IN` | No | `15m` | No | AuthModule | — |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | No | AuthModule | — |
| `JWT_ISSUER` | No | — | No | AuthModule | — |

**BUG-CRIT-003:** `JWT_ACCESS_SECRET` is reused for signing verification tokens. A separate `JWT_VERIFICATION_SECRET` should be introduced.

### Argon2 (Password Hashing)

| Variable | Required | Default | Secret | Used By | Rotate |
|---|---|---|---|---|---|
| `ARGON2_MEMORY_COST` | No | `65536` (64MB) | No | AuthService | — |
| `ARGON2_TIME_COST` | No | `3` | No | AuthService | — |
| `ARGON2_PARALLELISM` | No | `2` | No | AuthService | — |

### CORS

| Variable | Required | Default | Secret | Used By | Rotate |
|---|---|---|---|---|---|
| `CORS_ORIGIN` | No | `http://localhost:5173` | No | Backend | — |

### Email (SMTP)

| Variable | Required | Default | Secret | Used By | Rotate |
|---|---|---|---|---|---|
| `SMTP_HOST` | No | — | No | Email Worker | — |
| `SMTP_PORT` | No | `587` | No | Email Worker | — |
| `SMTP_USER` | No | — | No | Email Worker | — |
| `SMTP_PASS` | No | — | **YES** | Email Worker | 90 days |
| `SMTP_FROM` | No | — | No | Email Worker | — |

### Session

| Variable | Required | Default | Secret | Used By | Rotate |
|---|---|---|---|---|---|
| `SESSION_EXPIRY_DAYS` | No | `7` | No | AuthService, SessionModule | — |

### Redis Queue

| Variable | Required | Default | Secret | Used By | Rotate |
|---|---|---|---|---|---|
| `REDIS_QUEUE_PREFIX` | No | `manamaalai` | No | BullMQ Queues | — |

## Example .env File

```env
NODE_ENV=development
PORT=4000

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/manamaalai

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_ACCESS_SECRET=replace-with-random-64-chars
JWT_REFRESH_SECRET=replace-with-random-64-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

ARGON2_MEMORY_COST=65536
ARGON2_TIME_COST=3
ARGON2_PARALLELISM=2

CORS_ORIGIN=http://localhost:5173

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=replace-with-smtp-password
SMTP_FROM="Mohanur Kongu" <noreply@example.com>

SESSION_EXPIRY_DAYS=7
```

## Missing Variables (Should Be Added)

| Variable | Reason |
|---|---|
| `JWT_VERIFICATION_SECRET` | Separate verification token signing (BUG-CRIT-003 fix) |
| `APP_BASE_URL` | Construction of email action URLs (BUG-HIGH-004 fix) |
| `BACKUP_DATABASE_URL` | Database backup script |
| `SENTRY_DSN` | Error tracking |
| `LOG_LEVEL` | Log verbosity control |
| `REDIS_PASSWORD` | Redis authentication |
