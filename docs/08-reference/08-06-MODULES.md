# Modules Reference

All 18 backend modules + frontend sections with responsibilities, key files, and cross-references.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MODULE MAP                                          │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐     │
│ │  BACKEND (18 modules)                                        │     │
│ │  ┌──────────────────────────────────────────────────────────┐ │     │
│ │  │ Application: app.ts, server.ts, main.ts                  │ │     │
│ │  │ Auth: controller, routes, service, 7 pipelines, dtos     │ │     │
│ │  │ Manamaalai: controller, routes, service, dtos,           │ │     │
│ │  │   validators/, pipelines/ (13+ files)                    │ │     │
│ │  │ Maaligai: controller, routes, service, dtos,            │ │     │
│ │  │   validators/, pipelines/ (11 files)                     │ │     │
│ │  │ Common: middleware/ (9), pipeline/, errors/,             │ │     │
│ │  │   queue/, services/ (4), utils/ (3), constants           │ │     │
│ │  │ Session, Token, Analytics, ...                           │ │     │
│ │  └──────────────────────────────────────────────────────────┘ │     │
│ │                                                              │     │
│ │  FRONTEND (8 sections)                                       │     │
│ │  ┌──────────────────────────────────────────────────────────┐ │     │
│ │  │ App.tsx, main.tsx                                        │ │     │
│ │  │ i18n: en/ + ta/ (16 namespaces)                         │ │     │
│ │  │ components: ui/, Feature/, Form/, Layout/, shared/      │ │     │
│ │  │ hooks: useAuth, useProfile, useBooking, useTranslation  │ │     │
│ │  │ pages: auth, manamaalai, maaligai, admin                │ │     │
│ │  │ services: api (Axios), auth, profile, booking           │ │     │
│ │  │ types, utils, routes                                    │ │     │
│ │  └──────────────────────────────────────────────────────────┘ │     │
│ └──────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Backend Modules

| Module | Key Files | Responsibility | Dependencies |
|--------|-----------|---------------|--------------|
| **app** | `app.ts` | Express setup, middleware chain, router mounting | All modules |
| **server** | `server.ts` | HTTP server bootstrap | app |
| **main** | `main.ts` | CLI commands (start, migrate, seed) | app |
| **auth** | controller, routes, service, dtos, 7 pipelines | Authentication (login, register, OTP, tokens, password) | common, session, token |
| **manamaalai** | controller, routes, service, dtos, validators/, pipelines/ | Profile CRUD, browse, shortlist, admin ops | common |
| **mandapam** | controller, routes, service, dtos, pipelines/ | Booking, calendar, settlement, tokens | common |
| **common/middleware** | 9 guard files | Auth guards, role checks, validation, rate limiting, error handler | common/errors |
| **common/pipeline** | runner, types, utils | Pipeline execution engine | — |
| **common/errors** | AppError, error-codes | Structured error responses | — |
| **common/queue** | BullMQ config | Background job processing | Redis |
| **common/services/otp** | `otp.service.ts` | OTP generation, hashing, verification | common/utils |
| **common/services/cache** | `cache.service.ts` | Redis cache wrapper | Redis |
| **common/services/email** | `email.service.ts` | SMTP email sending | SMTP |
| **common/services/audit** | `audit.service.ts` | Audit logging | Database |
| **common/utils** | `crypto.ts`, `jwt.ts`, `date.ts` | Shared helpers | — |
| **session** | session config | Express session management | Redis |
| **token** | `token.service.ts` | Refresh token CRUD + rotation | Database |
| **analytics** | analytics service + queries | Reporting and analytics | Database |

## Frontend Sections

| Section | Key Files | Responsibility |
|---------|-----------|---------------|
| **App** | `App.tsx`, `main.tsx` | Provider nesting, router mount |
| **i18n** | `en/` (16), `ta/` (16) | Translation files |
| **components/ui** | Button, Input, Modal, Card, Table, etc. | Reusable primitives |
| **components/Feature** | ProfileCard, LoginForm, etc. | Product-specific components |
| **components/Form** | Form wrappers with Zod validation | Form handling |
| **components/Layout** | Header, Footer, Sidebar, PageShell | Page layout |
| **components/shared** | LoadingSpinner, ErrorDisplay, EmptyState | Cross-cutting UI |
| **hooks** | useAuth, useProfile, useBooking, useTranslation | React Query hooks + custom hooks |
| **pages** | auth/, manamaalai/, maaligai/, admin/ | Page components |
| **services** | api.ts, auth.service.ts, profile.service.ts, booking.service.ts | Axios API layer |
| **types** | TypeScript type definitions | Shared types |
| **utils** | Helper functions | Utility code |
| **routes** | Route path definitions | Client-side routing config |

## Cross-References

| Module | Pipeline Docs | Business Rules | Architecture |
|--------|--------------|----------------|--------------|
| auth | `05-pipelines/backend/auth/` (9 files) | 06-01, 06-02 | 03-07 |
| manamaalai | `05-pipelines/backend/manamaalai/` (17 files) | 06-03 | 03-04 |
| mandapam | `05-pipelines/backend/mandapam/` (12 files) | 06-04 | 03-04 |
| common/middleware | — | 06-06 | 03-07 |
| common/pipeline | — | 03-03 | 03-03 |
