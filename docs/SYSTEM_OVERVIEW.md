# System Overview

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              Browser                                    │
│  React 19 SPA │ i18next (en/ta) │ React Router v6 │ Axios              │
└────────────────────┬────────────────────────────────────────────────────┘
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Nginx (reverse proxy)                           │
│  /api/*  → backend:4000 │  /*  → frontend:5173                         │
│  /health → backend:4000 │  /ws/*  → (not implemented)                  │
└────────────────────┬────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Backend — Express 5 (port 4000)                      │
│                                                                         │
│  Auth Module (EXECUTED)                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐         │
│  │ Routes   │───▶│Controller│───▶│ Service  │───▶│  Repo    │         │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘         │
│                                                                         │
│  Middleware Chain:                                                      │
│    cors() → cookieParser() → json() → morgan() → helmet()              │
│                                                                         │
│  Guards: requireAuth (jwtVerify), requireRole (UNUSED)                 │
└────────────────────┬────────────────────────────────────────────────────┘
                     │
                     ├──────────────────────────────────┐
                     ▼                                  ▼
┌──────────────────────────────┐     ┌──────────────────────────────┐
│     PostgreSQL 16            │     │   Redis (BullMQ)             │
│  accounts                    │     │  ┌────────────────────┐      │
│  credentials                 │     │  │ email.queue       │      │
│  sessions                    │     │  │ otp.queue         │      │
│  verifications               │     │  │ audit.queue       │      │
│  roles                       │     │  └────────────────────┘      │
│  plans                       │     │                              │
│  profiles (NOT BUILT)        │     │  BullMQ Workers:             │
│  bookings (NOT BUILT)        │     │  - email.worker.ts           │
│  packages (NOT BUILT)        │     │  - otp.worker.ts             │
│  mandapams (NOT BUILT)       │     │  - audit.worker.ts           │
│  translations (NOT BUILT)    │     │  - background.worker.ts      │
│  communities (NOT BUILT)     │     │    (expireOtp, expireSession,│
│  devices (NOT BUILT)         │     │     purgeAnon, archiveOld)   │
└──────────────────────────────┘     └──────────────────────────────┘
```

## Execution Flow (Auth — the only connected module)

### Registration
```
Frontend → POST /auth/send-otp (type=registration)
  → [BUG: OTP never delivered via email]
  → POST /auth/verify-otp
  → POST /auth/signup { email, password, name, ... }
  → [BUG: no email-match check against verified OTP]
  → Create account + credential + session
  → [BUG: welcome email never sent]
  → Return { id, accountNo, roles, membership, accessToken }
```

### Login
```
Frontend → POST /auth/login { email, password, portal? }
  → Verify credential (Argon2id)
  → [BUG: portal bypass — omitting portal parameter skips role check]
  → Create session (device fingerprint hashed)
  → Return { id, accountNo, roles, membership } + accessToken + refreshToken cookie
  → [BUG: response lacks profile fields; frontend adapters read undefined]
```

### Refresh
```
Frontend (Axios interceptor) → POST /auth/refresh (cookie)
  → [BUG: no rate limiter]
  → [BUG: concurrent rotation race — both succeed]
  → Return new accessToken + rotated refreshToken cookie
```

### Logout
```
Frontend → POST /auth/logout (cookie)
  → [BUG: no rate limiter]
  → Revoke session
  → Clear cookie
```

## System Execution Status

| Component | Status | Notes |
|---|---|---|
| **FRONTEND** | | |
| Auth pages (Login, Signup, ForgotPassword, AdminLogin) | **EXECUTED** | Connected to real API |
| User pages (Dashboard, Browse, Shortlist, MyProfiles, etc.) | **BROKEN** | Rendered but use stubs — no backend |
| Admin pages (Dashboard, Analytics, Verification, etc.) | **BROKEN** | Rendered but use stubFetch* — no backend |
| Landing / Maaligai Pages | **EXECUTED** | Static content, no backend dependency |
| i18n (16 namespaces, en/ta) | **EXECUTED** | Fully wired |
| **BACKEND** | | |
| Auth routes (11 endpoints) | **EXECUTED** | With known bugs |
| Profile routes | **NOT IMPLEMENTED** | Zero files |
| Mandapam routes | **NOT IMPLEMENTED** | Zero files |
| Admin routes | **NOT IMPLEMENTED** | Zero files |
| Email workers | **EXECUTED** | Queue/worker/renderer exist but UNUSED by auth |
| Background jobs | **EXECUTED** | Expire OTP/session, purge, archive run on interval |
| **DATABASE** | | |
| accounts, credentials, sessions, verifications | **EXECUTED** | Tables created, migrations applied |
| profiles, profiles_photos, profiles_education, etc. | **NOT CREATED** | Schema defines them but no data written and no migration constraints configured |
| mandapams, packages, bookings, etc. | **NOT CREATED** | Schema defines them but no data written |
| communities, translations, devices | **NOT CREATED** | Schema defines indices/constraints but no data |
