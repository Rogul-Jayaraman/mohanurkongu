# Backend Modules

Directory structure, responsibilities, and dependency graph of all 18 backend modules.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                 BACKEND MODULE TREE (backend/src/)                      │
│                                                                         │
│  src/                                                                   │
│  ├── app.ts                          App setup, middleware, router mgt │
│  ├── server.ts                       HTTP server entry point            │
│  ├── main.ts                         CLI entry (start, migrate, seed)  │
│  │                                                                    │
│  ├── auth/                           Authentication module              │
│  │   ├── auth.controller.ts          Route handlers                     │
│  │   ├── auth.routes.ts              /auth/* route definitions          │
│  │   ├── auth.service.ts             Business logic                    │
│  │   ├── auth.dtos.ts                Zod schemas for auth requests     │
│  │   ├── login.pipeline.ts           7-step login pipeline             │
│  │   ├── register.pipeline.ts        7-step registration pipeline      │
│  │   ├── otp.send.pipeline.ts        6-step send OTP pipeline          │
│  │   ├── otp.verify.pipeline.ts      9-step verify OTP pipeline        │
│  │   ├── refresh.pipeline.ts         6-step token refresh pipeline     │
│  │   ├── reset-password.pipeline.ts  6-step password reset pipeline    │
│  │   ├── change-password.pipeline.ts 4-step change password pipeline   │
│  │   └── membership.pipeline.ts      4-step membership check pipeline  │
│  │                                                                    │
│  ├── manamaalai/                     Matrimony module (profiles)       │
│  │   ├── manamaalai.controller.ts    Route handlers (admin + user)     │
│  │   ├── manamaalai.routes.ts        /admin/manamaalai/* + /api/*     │
│  │   ├── manamaalai.service.ts       Business logic                   │
│  │   ├── manamaalai.dtos.ts          Zod schemas                      │
│  │   ├── validators/                 Custom validators                │
│  │   │   ├── create-profile.validator.ts                              │
│  │   │   ├── update-profile.validator.ts                              │
│  │   │   ├── browse-profiles.validator.ts                             │
│  │   │   └── ...                     Many more validators             │
│  │   └── pipelines/                  All profile pipelines             │
│  │       ├── profile-upsert.pipeline.ts   17-step upsert pipeline     │
│  │       ├── profile-view.pipeline.ts     7-step view pipeline        │
│  │       ├── profile-browse.pipeline.ts   8-step browse pipeline      │
│  │       ├── profile-shortlist.pipeline.ts 6-step shortlist pipeline  │
│  │       ├── profile-showcase.pipeline.ts  3-step showcase pipeline   │
│  │       └── ...                     More pipelines                    │
│  │                                                                    │
│  ├── maaligai/                      Hall booking module               │
│  │   ├── maaligai.controller.ts     Route handlers                    │
│  │   ├── maaligai.routes.ts         /admin/maaliagai/* + /api/*      │
│  │   ├── maaligai.service.ts        Business logic                    │
│  │   ├── maaligai.dtos.ts           Zod schemas                      │
│  │   ├── validators/               Custom validators                 │
│  │   └── pipelines/                 All booking pipelines             │
│  │       ├── booking-create.pipeline.ts   12-step create pipeline     │
│  │       ├── booking-status.pipeline.ts   6-step status pipeline      │
│  │       ├── booking-settlement.pipeline.ts 10-step settle pipeline   │
│  │       └── ...                     More pipelines                    │
│  │                                                                    │
│  ├── common/                        Shared utilities                   │
│  │   ├── middleware/                                                   │
│  │   │   ├── requireAuth.ts         JWT + session guard               │
│  │   │   ├── optionalAuth.ts        Optional auth (read-only check)   │
│  │   │   ├── requireRole.ts         Role-based access control          │
│  │   │   ├── requireIpAllowlist.ts  IP whitelist for admin routes     │
│  │   │   ├── requireBody.ts         Zod body validation               │
│  │   │   ├── requireParams.ts       URL param validation              │
│  │   │   ├── requireQuery.ts        Query string validation           │
│  │   │   ├── rateLimit.ts           Rate limiting                     │
│  │   │   └── errorHandler.ts        Global error handler              │
│  │   ├── pipeline/                  Pipeline runner + types           │
│  │   │   ├── pipeline-runner.ts     Generic pipeline executor         │
│  │   │   ├── pipeline.types.ts      TypeScript types                  │
│  │   │   └── pipeline.utils.ts      Helper functions                  │
│  │   ├── errors/                    AppError + error codes            │
│  │   │   ├── AppError.ts            Custom error class                │
│  │   │   └── error-codes.ts         79 error codes                   │
│  │   ├── queue/                     BullMQ queue setup                │
│  │   ├── services/                  Shared services                   │
│  │   │   ├── otp.service.ts         OTP generation + verification    │
│  │   │   ├── cache.service.ts       Redis cache wrapper              │
│  │   │   ├── email.service.ts       SMTP email sender                │
│  │   │   └── audit.service.ts       Audit logging                    │
│  │   ├── utils/                     Helpers (crypto, date, etc)      │
│  │   │   ├── crypto.ts             Token generation, hashing         │
│  │   │   ├── jwt.ts                JWT sign/verify                  │
│  │   │   ├── date.ts               Date helpers                      │
│  │   │   └── ...                                                      │
│  │   └── constants.ts              Shared constants                   │
│  │                                                                    │
│  ├── auth/                          Account session token management  │
│  │   └── token.service.ts          Token CRUD + rotation             │
│  │                                                                    │
│  ├── session/                       Session management               │
│  │                                                                    │
│  └── ...                            Other modules...                  │
└─────────────────────────────────────────────────────────────────────────┘
```

## Module Dependency Graph

```
auth ──▶ session ──▶ token
  │
  ├──▶ manamaalai ──▶ common (pipeline, middleware, errors)
  │                      │
  ├──▶ maaligai ──▶──────┘
  │
  └──▶ common (all middleware, services, utils)
```

Modules are **independent** of each other — auth doesn't depend on manamaalai, and vice versa. Both depend on `common/` for shared utilities.

## Module Responsibilities

| Module | Key Files | Responsibility |
|--------|-----------|---------------|
| **auth** | controller, routes, 7 pipelines | Login, register, OTP, refresh, password reset, change password, membership |
| **manamaalai** | controller, routes, 13+ pipelines | Profile CRUD, browse, shortlist, showcase, admin operations |
| **maaliagai** | controller, routes, 11 pipelines | Booking CRUD, calendar, settlement, tokens, packages |
| **common/middleware** | 9 middleware files | Auth guards, role checks, body/param/query validation, rate limiting, error handler |
| **common/pipeline** | runner, types, utils | Generic pipeline execution engine |
| **common/errors** | AppError, error-codes | Structured error responses |
| **common/queue** | BullMQ config | Background job processing |
| **common/services** | 4 service files | OTP, cache, email, audit |
| **common/utils** | crypto, jwt, date | Shared helpers |
