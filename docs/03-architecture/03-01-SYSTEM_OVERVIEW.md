# System Overview

High-level architecture of the entire platform — frontend, backend, database, and infrastructure layers.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FULL SYSTEM TOPOLOGY                                 │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │  USER / BROWSER                                               │      │
│  │  React SPA (port 5173 dev, 80/443 prod)                      │      │
│  └──────────┬───────────────────────────────────────────────────┘      │
│             │ HTTP / HTTPS                                              │
│             ▼                                                           │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │  NGINX (reverse proxy, SSL termination)                      │      │
│  │  ┌────────────────────────────────────────────────────────┐  │      │
│  │  │  HTTP :80  → 301 redirect  →  HTTPS :443               │  │      │
│  │  │  TLSv1.2 / TLSv1.3  |  HSTS  |  OCSP stapling          │  │      │
│  │  │  /api/*  → backend :3000                                │  │      │
│  │  │  /*      → frontend  (served as static / proxied)       │  │      │
│  │  │  Certbot auto-renewal (weekly cron)                     │  │      │
│  │  └────────────────────────────────────────────────────────┘  │      │
│  └──────────────────────────────────────────────────────────────┘      │
│             │                                                           │
│             ▼                                                           │
│  ┌──────────────────────────────────────────────────────────────┐      │
│  │  BACKEND (Express, Node.js 20)                               │      │
│  │                                                              │      │
│  │  ┌────────────────────────────────────────────────────────┐  │      │
│  │  │  MIDDLEWARE CHAIN                                       │  │      │
│  │  │  helmet → cors → cookieParser → rateLimit →            │  │      │
│  │  │  session → i18n → serveStatic → router                  │  │      │
│  │  └────────────────────────────────────────────────────────┘  │      │
│  │                                                              │      │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │      │
│  │  │ AUTH MODULE  │  │ MANAMAALAI   │  │ MAALIGAI     │       │      │
│  │  │ login/reg/   │  │ MODULE       │  │ MODULE       │       │      │
│  │  │ otp/refresh/ │  │ profile/     │  │ booking/     │       │      │
│  │  │ reset-pw/    │  │ shortlist/   │  │ calendar/    │       │      │
│  │  │ change-pw    │  │ showcase     │  │ settlement/  │       │      │
│  │  └──────────────┘  └──────────────┘  └──────────────┘       │      │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │      │
│  │  │ COMMON       │  │ PIPELINE     │  │ QUEUE        │       │      │
│  │  │ middleware    │  │ runner +     │  │ BullMQ       │       │      │
│  │  │ guards/errors │  │ step pattern │  │ background   │       │      │
│  │  │ utils/i18n   │  │              │  │ jobs         │       │      │
│  │  └──────────────┘  └──────────────┘  └──────────────┘       │      │
│  └──────────────────────────────────────────────────────────────┘      │
│             │                                                           │
│      ┌──────┴──────┐                                                    │
│      ▼              ▼                                                   │
│  ┌────────────────┐  ┌────────────────┐                                │
│  │  POSTGRESQL 16 │  │  REDIS 7       │                                │
│  │                │  │                │                                │
│  │  accounts      │  │  sessions      │                                │
│  │  profiles      │  │  cache (tags)  │                                │
│  │  bookings      │  │  BullMQ queues │                                │
│  │  calendar      │  │  rate limiter  │                                │
│  │  financial     │  │  lock manager  │                                │
│  │  payments      │  │                │                                │
│  │  audit_log     │  │                │                                │
│  └────────────────┘  └────────────────┘                                │
└─────────────────────────────────────────────────────────────────────────┘
```

## Layer Responsibilities

| Layer | Technology | Responsibility |
|-------|-----------|----------------|
| **Frontend** | React 18 + React Router v6 + React Query v5 | UI rendering, client-side routing, server state caching |
| **Reverse Proxy** | Nginx | SSL termination, static file serving, API routing |
| **Backend** | Express 4 + TypeScript | API endpoints, business logic, pipeline execution |
| **Database** | PostgreSQL 16 | Primary data store (50 tables, 32 enums) |
| **Cache / Queue** | Redis 7 | Session store, data cache, background job queue |

## Request Flow (Simplified)

```
Browser → Nginx → Express middleware → Router → Guard → Controller → Pipeline → Service → Repository → Prisma → PostgreSQL
```

Each arrow is explained in detail in [03-02-REQUEST_LIFECYCLE.md](03-02-REQUEST_LIFECYCLE.md).

## Security Perimeter

- All traffic encrypted via TLS (nginx terminates)
- JWT access tokens (15min) + refresh tokens (7d) in HTTP-only cookies
- Rate limiting at nginx + Express levels
- IP allowlisting for admin routes
- CSP, HSTS, and other security headers via helmet

## Deployment

Production runs in Docker Compose with 7 containers:
- `app` (Node.js backend)
- `frontend` (nginx serving React build)
- `db` (PostgreSQL)
- `redis`
- `certbot` (SSL)
- `worker` (BullMQ job processor)
- `nginx` (reverse proxy)

See [Deployment Topology](03-10-DEPLOYMENT_TOPOLOGY.md) and [Deployment Guide](../07-operations/07-01-DEPLOYMENT_GUIDE.md).
