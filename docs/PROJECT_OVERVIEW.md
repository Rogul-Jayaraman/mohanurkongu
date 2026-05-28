# Project Overview — Mohanur Kongu Manamaalai

## Goal
Multi-tenant matrimonial and mandapam (marriage hall) booking platform serving the Kongu Vellalar community across Tamil Nadu.

## Domain
- **Matrimony:** Profile creation, browsing, shortlisting, interest expression, horoscope matching
- **Mandapam:** Marriage hall listing, availability calendar, package management, booking
- **Admin:** User management, profile verification, membership plans, analytics, settings

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, React Router v6, i18next (en/ta), Axios |
| Backend | Express 5, TypeScript, Prisma ORM |
| Database | PostgreSQL 16 |
| Queue | BullMQ (Redis) |
| Auth | JWT (access) + rotating refresh tokens (session store) |
| Passwords | Argon2id |
| Workers | BullMQ workers (email, OTP, audit, background jobs) |
| Container | Docker Compose (dev + prod) |
| Reverse Proxy | Nginx |

## Project Lifecycle
- **Current Phase:** Pre-production — Auth module complete, non-auth modules use frontend stubs with no backend implementation
- **Backend:** Only `authRoutes` mounted in `app.ts`. Zero profile/mandapam/admin controllers or services.
- **Frontend:** All 65 routes rendered. User-facing pages use stubs, admin pages use `stubFetch*` functions.

## Repository Structure (execution-relevant)
```
backend/
  src/
    app.ts                          # Express app — mounts ONLY authRoutes
    common/
      guards/role.guard.ts          # UNUSED — defined but never imported
      middleware/requireAuth.ts     # Used by all /auth protected routes
      pipes/prisma.ts               # DI singleton infra
      utils/                        # jwt.ts, hash.ts, mask.ts, device.ts, pattern.ts
    config/                         # env.ts, logger.ts, prisma.ts
    modules/
      auth/                         # EXECUTED — controller, service, routes, validation
      account/                      # PARTIAL — service defined but changePassword is dead code
      session/                      # EXECUTED — session rotation, revoke, repository
      email/                        # EXECUTED — queue, worker, renderer, templates
      notification/                 # EXECUTED — email.queue.ts, notification.service.ts
      worker/                       # EXECUTED — background jobs (expire, purge, archive)
      profile/                      # NOT IMPLEMENTED — no files
      mandapam/                     # NOT IMPLEMENTED — no files
      admin/                        # NOT IMPLEMENTED — no files
    prisma/
      schema.prisma                 # Database schema
      migrations/                   # Migration history
      seed.ts                       # Seeds roles, plans, counter — NO admin user
  Dockerfile
frontend/
  src/
    App.tsx                         # Route definitions (65 routes)
    main.tsx                        # Entry point
    api/                            # API client layer — auth.api.ts, api.ts
    adapters/                       # Data adapters — auth.adapter.ts
    components/                     # React components
    context/                        # LanguageContext, CapsLockContext
    hooks/                          # useAuth
    layout/                         # UserLayout, AdminLayout, MaaligaiLayout
    lib/                            # session.ts, api.ts (Axios interceptor)
    locales/                        # i18n translations (en, ta) — 16 namespaces
    pages/                          # All page components
    utils/                          # stubs.ts — ALL mock data for non-auth features
  Dockerfile
docker/
  docker-compose.yml                # Dev setup (postgres, redis, backend, frontend, nginx)
  docker-compose.prod.yml           # Production setup
  nginx/
    templates/                      # Nginx config templates
deploy/                             # Deployment scripts
```
