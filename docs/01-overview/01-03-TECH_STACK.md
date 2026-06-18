# Technology Stack

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TECHNOLOGY STACK MAP                                 │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │                    FRONTEND TIER                              │     │
│   │  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐  │     │
│   │  │  React   │   │  React   │   │   i18n   │   │  React   │  │     │
│   │  │  (18.x)  │   │  Router  │   │  (16 ns) │   │  Query   │  │     │
│   │  │  UI lib  │   │  (v6)    │   │  en+ta   │   │  (v5)    │  │     │
│   │  └──────────┘   └──────────┘   └──────────┘   └──────────┘  │     │
│   └──────────────────────────────────────────────────────────────┘     │
│                                 │                                        │
│                                 ▼                                        │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │               REVERSE PROXY + SSL TERMINATION                │     │
│   │                   NGINX (port 80→443)                        │     │
│   └──────────────────────────────────────────────────────────────┘     │
│                                 │                                        │
│                                 ▼                                        │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │                     BACKEND TIER (Node.js 20)                │     │
│   │  ┌──────────┐   ┌──────────┐   ┌──────────┐                │     │
│   │  │ Express  │   │   Zod    │   │ Pipeline │                │     │
│   │  │  (4.x)   │   │validation│   │  Runner  │                │     │
│   │  └──────────┘   └──────────┘   └──────────┘                │     │
│   │  ┌──────────┐   ┌──────────┐   ┌──────────┐                │     │
│   │  │ BullMQ   │   │  Prisma  │   │ Argon2id │                │     │
│   │  │ (queues) │   │  (ORM)   │   │ (pwd hash)│                │     │
│   │  └──────────┘   └──────────┘   └──────────┘                │     │
│   └──────────────────────────────────────────────────────────────┘     │
│                                 │                                        │
│                   ┌─────────────┴─────────────┐                        │
│                   ▼                            ▼                        │
│   ┌────────────────────────┐    ┌────────────────────────┐            │
│   │    PostgreSQL 16       │    │      Redis 7           │            │
│   │  ┌──────────────────┐  │    │  ┌──────────────────┐  │            │
│   │  │ 50 tables        │  │    │  │ sessions         │  │            │
│   │  │ 32 enums         │  │    │  │ cache (tagged)   │  │            │
│   │  │ Prisma migrations│  │    │  │ BullMQ queues    │  │            │
│   │  └──────────────────┘  │    │  └──────────────────┘  │            │
│   └────────────────────────┘    └────────────────────────┘            │
└─────────────────────────────────────────────────────────────────────────┘
```

## Frontend

| Technology | Version | Purpose | Why It Was Chosen |
|-----------|---------|---------|-------------------|
| React | 18.x | UI framework | Wide ecosystem, stable |
| React Router | v6 | Client-side routing | Nested layouts, loaders |
| React Query | v5 | Server state + caching | Automatic cache invalidation |
| i18next | — | Internationalization | 16 namespaces, en+ta |
| Vite | — | Build tool | Fast HMR, TypeScript native |

## Backend

| Technology | Version | Purpose | Why It Was Chosen |
|-----------|---------|---------|-------------------|
| Node.js | 20 LTS | Runtime | Long-term support |
| Express | 4.x | HTTP framework | Simple, well-known |
| TypeScript | 5.x | Type safety | Catch errors at compile time |
| Prisma | — | ORM / migrations | Type-safe DB access |
| Zod | — | Schema validation | Runtime + TypeScript types |
| BullMQ | — | Background job queue | Redis-backed, reliable |
| Argon2id | — | Password hashing | OWASP-recommended |

## Infrastructure

| Technology | Purpose |
|-----------|---------|
| Docker Compose | Container orchestration |
| Nginx | Reverse proxy + SSL termination |
| Certbot | Let's Encrypt SSL auto-renewal |
| PostgreSQL 16 | Primary database |
| Redis 7 | Cache + session store + queue backend |
| Sentry | Error tracking |

## Development

| Tool | Purpose |
|------|---------|
| Vitest | Unit + integration testing |
| Supertest | HTTP integration tests |
| ESLint | Code linting |
| Prettier | Code formatting |
