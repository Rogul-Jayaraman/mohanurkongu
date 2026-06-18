# Configuration Reference

> **For beginners**: Environment variables are how you configure the app
> without editing code. Copy `backend/.env.example` to `backend/.env` (dev)
> or `backend/.env.prod` (prod), then fill in the values. See the example
> file for the complete list.

## Required Secrets

These have **no default** — the app throws on startup if missing.

| Variable | Description | Generate with |
|----------|-------------|--------------|
| `JWT_ACCESS_SECRET` | Signs access tokens (15 min expiry) | `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | Signs refresh tokens (7 day expiry) | `openssl rand -base64 48` |
| `JWT_VERIFICATION_SECRET` | Signs email verification tokens | `openssl rand -base64 48` |
| `JWT_RESET_SECRET` | Signs password reset tokens | `openssl rand -base64 48` |
| `COOKIE_SECRET` | Signs session cookies | `openssl rand -base64 48` |

## Connections

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://mohanurkongu:mohanurkongu@localhost:5433/mohanurkongu?schema=public` | PostgreSQL connection string |
| `REDIS_QUEUE_HOST` | `localhost` | Redis host for BullMQ job queue |
| `REDIS_QUEUE_PORT` | `6379` | Redis port for queue |
| `REDIS_CACHE_HOST` | `localhost` | Redis host for cache manager |
| `REDIS_CACHE_PORT` | `6380` | Redis port for cache |
| `SMTP_HOST` | `localhost` | SMTP server for email |
| `SMTP_PORT` | `1025` | SMTP port |
| `SMTP_USER` | _(empty)_ | SMTP username |
| `SMTP_PASS` | _(empty)_ | SMTP password |
| `SMTP_FROM` | `noreply@mohanurkongu.com` | From address for outgoing email |

## Domain & Security

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_URL` | `http://localhost:5173` | Public URL of the frontend |
| `CORS_ORIGIN` | `http://localhost:5173` | Comma-separated allowed origins |
| `COOKIE_SECURE` | `false` | Set `true` in production (HTTPS only) |
| `ADMIN_ALLOWED_IPS` | _(not set = allow all)_ | Comma-separated IP allowlist for admin routes |

## App Config

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | `development`, `production`, or `test` |
| `PORT` | `4000` | Backend listen port |
| `HOST` | `0.0.0.0` | Backend listen host |
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error` |
| `STORAGE_DIR` | `<project>/../storage` | Root directory for uploaded media |
| `ACCOUNT_NO_PREFIX` | `MKM` | Prefix for auto-generated account numbers |
| `REG_NO_PREFIX` | `MK` | Prefix for auto-generated registration numbers |

## JWT Expiry

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token lifetime |
| `JWT_VERIFICATION_EXPIRES_IN` | `15m` | Email verification token lifetime |
| `JWT_RESET_EXPIRES_IN` | `15m` | Password reset token lifetime |

## Argon2 (Password Hashing)

| Variable | Default | Description |
|----------|---------|-------------|
| `ARGON2_MEMORY` | `65536` | Memory cost (KB) |
| `ARGON2_ITERATIONS` | `3` | Time cost |
| `ARGON2_PARALLELISM` | `4` | Parallelism factor |
| `ARGON2_HASH_LENGTH` | `32` | Output hash length (bytes) |

## OTP

| Variable | Default | Description |
|----------|---------|-------------|
| `OTP_LENGTH` | `6` | Number of digits |
| `OTP_EXPIRY_MINUTES` | `5` | How long an OTP is valid |
| `OTP_COOLDOWN_SECONDS` | `60` | Min time between resends |
| `OTP_MAX_RESENDS` | `3` | Max resends per window |
| `OTP_RESEND_WINDOW_MINUTES` | `5` | Resend counting window |

## Rate Limiting

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_WINDOW_MS` | `60000` | Window duration (ms) |
| `RATE_LIMIT_MAX` | `100` | Global requests per window |
| `OTP_RATE_LIMIT_MAX` | `3` | OTP send requests per window |
| `OTP_VERIFY_RATE_LIMIT_MAX` | `5` | OTP verify attempts per window |
| `SIGNUP_RATE_LIMIT_MAX` | `5` | Signup attempts per window |
| `REFRESH_RATE_LIMIT_MAX` | `10` | Token refresh requests per window |

## Session

| Variable | Default | Description |
|----------|---------|-------------|
| `SESSION_CLEANUP_INTERVAL_MINUTES` | `15` | How often expired sessions are cleaned |
| `SESSION_MAX_ACTIVE` | `5` | Max concurrent sessions per account |

## Background Jobs

| Variable | Default | Description |
|----------|---------|-------------|
| `VERIFICATION_EXPIRE_INTERVAL_MS` | `60000` | Check interval for expired verifications |
| `VERIFICATION_ARCHIVE_INTERVAL_MS` | `86400000` | Check interval for archivable verifications |
| `VERIFICATION_PURGE_INTERVAL_MS` | `604800000` | Check interval for purgeable verifications |
| `VERIFICATION_ARCHIVE_AFTER_DAYS` | `30` | Archive verifications after N days |
| `VERIFICATION_PURGE_AFTER_DAYS` | `90` | Purge archived verifications after N days |

## Sentry (Error Tracking)

| Variable | Default | Description |
|----------|---------|-------------|
| `SENTRY_DSN` | _(not set = disabled)_ | Sentry project DSN |
| `SENTRY_TRACES_SAMPLE_RATE` | `0.1` | APM trace sampling rate (0.0–1.0) |

## Frontend (Vite)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:4000` | Backend API base URL |
| `VITE_SENTRY_DSN` | _(not set = disabled)_ | Frontend Sentry DSN |
| `VITE_APP_ENV` | `development` | Environment label for Sentry events |
| `VITE_SENTRY_TRACES_SAMPLE_RATE` | `0.2` | Frontend trace sampling rate |

## Docker Infrastructure

These vars are used by `docker-compose.yml` services via `env_file`.
Set them in `backend/.env` (dev) or `backend/.env.prod` (production).

| Variable | Dev Default | Description |
|----------|-------------|-------------|
| `POSTGRES_USER` | `mohanurkongu` | PostgreSQL user |
| `POSTGRES_PASSWORD` | `mohanurkongu` | PostgreSQL password |
| `POSTGRES_DB` | `mohanurkongu` | PostgreSQL database name |
| `DOMAIN_NAME` | `localhost` | Domain for nginx `envsubst` + certbot |
| `CERTBOT_EMAIL` | `admin@localhost` | Email for Let's Encrypt notifications |

## Seed (Dev Only)

| Variable | Default | Description |
|----------|---------|-------------|
| `ENHANCED_SEED` | _(not set)_ | Set `true` to enable enhanced seed data |
| `SEED` | `42` | Random seed for reproducible data |
| `CONFIG_TOTAL_ACCOUNTS` | seed default | Override number of accounts to seed |
| `CONFIG_TOTAL_PROFILES` | seed default | Override number of profiles to seed |
| `CONFIG_TOTAL_UPLOADS` | seed default | Override number of uploads to seed |
