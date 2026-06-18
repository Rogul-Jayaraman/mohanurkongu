# Backend — Mohanur Kongu Manamaalai

Express 5 API server with TypeScript, Prisma ORM (PostgreSQL), BullMQ queues, and JWT auth.

---

## Getting Started

```bash
npm install
cp .env.example .env          # Configure DB, Redis, SMTP, JWT secrets
npx prisma generate
npx prisma db push            # Create tables (or npm run db:migrate)
npm run db:seed               # Seed roles, admin account, plans
npm run db:seed:enhanced       # Seed roles, admin account, plans + comprehensive mock data (15k+ records)
npm run dev                   # http://localhost:4000
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Watch mode with tsx |
| `npm run build` | `tsc` |
| `npm start` | `node dist/server.js` |
| `npm test` | `vitest` (unit + integration) |
| `npm run test:e2e` | `vitest run --config vitest.e2e.config.ts` |
| `npm run lint` | `tsc --noEmit` |
| `npm run db:generate` | `prisma generate` |
| `npm run db:push` | `prisma db push` |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:seed` | `tsx prisma/seed.ts` |
| `npm run db:seed:enhanced` | `tsx prisma/seed.ts` (with ENHANCED_SEED=true) |

---

## Application Structure

```
src/
├── app.ts                     # Express app setup (middleware, routes, error handler)
├── server.ts                  # Entry point (starts server, registers jobs)
├── common/
│   ├── errors/                # AppError, ErrorCodes, LocalizedError
│   ├── guards/                # Role guard
│   ├── middleware/            # errorHandler, language, requestId, requireAuth, validate
│   ├── responses/             # ApiResponse helper (success/error envelope)
│   ├── utils/                 # crypto, device, hash, jwt, logger, mask, otp, translation
│   └── validators/            # Zod schemas (auth, account)
├── config/
│   ├── app.config.ts          # Server, CORS, cookie, accountNo prefix
│   ├── auth.config.ts         # JWT expiry, rate limits, OTP config
│   ├── database.config.ts     # Prisma connection config
│   └── queue.config.ts        # Redis/BullMQ config
├── database/
│   └── prisma.ts              # Prisma client singleton
├── jobs/                      # Scheduled jobs (verification lifecycle)
│   ├── expire-verification.job.ts
│   ├── archive-verification.job.ts
│   └── purge-verification.job.ts
├── locales/
│   ├── en/errors.json         # English error messages
│   ├── en/validation.json     # English validation messages
│   ├── ta/errors.json         # Tamil error messages
│   └── ta/validation.json     # Tamil validation messages
├── modules/
│   ├── account/               # Account repository + service
│   ├── auth/                  # Auth controller, service, routes, DTOs, policy
│   ├── membership/            # Membership service (plan management)
│   ├── notification/          # Email templates (Handlebars), queue
│   ├── session/               # Session repository + service
│   └── verification/          # Verification repository + service
├── tests/
│   ├── e2e/                   # End-to-end tests (verification lifecycle)
│   ├── integration/           # Integration tests
│   ├── unit/                  # Unit tests (crypto, jwt, otp, validators)
│   └── setup.ts               # Test setup (test DB, DI container)
└── workers/
    ├── email.worker.ts        # Email sending worker (BullMQ)
    ├── otp.worker.ts          # OTP processing worker
    └── audit.worker.ts        # Audit log worker
```

---

## Pipeline Architecture

The backend uses two independent pipeline systems for **auth** and **mandapam (hall booking)** modules, plus a shared **cache pipeline**.

```
                         PIPELINE ARCHITECTURE
                         =====================

  AUTH PIPELINE SYSTEM                    MANDAPAM PIPELINE SYSTEM
  ──────────────────────                  ──────────────────────────

  Runner: PipelineRunner (Pipeline.ts)    Runner: runSteps / runInTransaction
  Context: PipelineContext                Context: MandapamPipelineContext
  Step Type: StepFunction                 Step Type: MandapamStep

   Pipelines:                              Pipelines:
     login.pipeline.ts     [7 steps]         booking-create.pipeline.ts   [4 pre + ~7 tx + 1 post]
     register.pipeline.ts  [6 steps]         booking-status.pipeline.ts   [3 pre + ~4 tx + 2 post]
     refresh.pipeline.ts   [3 steps]         booking-settlement.pipeline  [4 pre + ~3 tx + 2 post]
     change-password.ts    [4 steps]         booking-addon.pipeline.ts    [3 pre + ~3 tx + 2 post]
     reset-password.ts     [5 steps]         financial-transaction.pipe   [4 pre + ~3 tx + 2 post]
     otp.pipeline.ts       (class-based)     calendar-view.pipeline.ts    [3 fns: view / day / public]
                                            calendar-block.pipeline.ts    [direct tx + cache flush]
                                            catalog-entity.pipeline.ts    [single step + cache]
                                            booking-get.pipeline.ts       [direct query + cache, returns totalCharges/totalPayments/totalRefunds/outstandingAmount]
                                            booking-list.pipeline.ts      [direct query + cache, uses Prisma groupBy aggregation]
                                            token-validate.pipeline.ts    [direct query]
                                            package-update.pipeline.ts    [direct tx + cache flush]
                                            public-catalog.pipeline.ts    [new — consolidates packages/facilities/addons in 1 call]

  ── CACHE STEPS (shared) ──             ── MANDAPAM CACHE STEPS ──
  cacheRead(tags)     → checks cache      mandapamCacheRead(tags)       → checks cache
  cacheWrite(tags,    → writes cache      mandapamCacheWrite(tags,      → writes cache
    ttl, dataFn)                              ttl, dataFn)
  flushCacheInvalid.  → flushes tags      mandapamFlushCacheInvalid.    → flushes tags

  ── CURRENT CACHE USAGE ──              ── CACHE TAGS ──
  AccountService:                          mandapam:calendar:{from}:{to}
    getProfile() → cacheManager           mandapam:calendar-day:{date}
    changePassword() → flush              mandapam:booking:{id}
  AnalyticsCache:                          mandapam:booking-list:{hash}
    getStats() → cacheManager             mandapam:catalog:{facility|addon}
    flushTags()                            mandapam:public:catalog:{lang}
                                           mandapam:packages:all:{lang}
                                           mandapam:package:{code}

  ── GAP (before this update) ──         ── STATUS ──
  Auth pipelines had cache fields in      Step-based pipelines: invalidation via
  PipelineContext but NO cache steps      cacheInvalidationTags + flush in post-steps
  were wired. CacheManager existed        Direct-query pipelines: inline cache
  but was never passed into pipelines.    read/write (calendar, booking, catalog,
                                          packages). CacheManager passed via
                                          MandapamController constructor.
```

### How Cache Flows Through Mandapam Pipelines

**Step-based pipelines** (booking-create, status, settlement, addon, financial-transaction):
1. Pre-steps: `addCacheInvalidationTag()` registers tags for affected entities
2. Transaction steps: main business logic runs inside a DB transaction
3. Post-steps: `setMutationResponse` builds lightweight `{ id, bookingNo, status, outstandingAmount }` response → `mandapamFlushCacheInvalidations` flushes tags
   - Exception: `booking-create` omits the response step entirely; returns `{ id, bookingNo, status }` directly (frontend redirects to detail view)

**Direct-query pipelines** (calendar-view, booking-get, booking-list):
- `cacheManager.get(tag)` at start → return cached if hit
- Execute DB query → `cacheManager.setByTags()` to store result
- TTLs range from 60s (booking list) to 1800s (catalog/packages)
- `booking-get`: precomputes `totalCharges`, `totalPayments`, `totalRefunds`, `outstandingAmount` (removes `_outstanding` private naming)
- `booking-list`: uses Prisma `groupBy` aggregation instead of loading full entry arrays (4x data reduction for large lists)

**Mutation pipelines** (calendar-block, package-update, catalog-entity):
- Inline `cacheManager.flushTags()` after mutation completes
- Catalog entity: invalidation tags registered in `entityCrudWithTranslations` step, flushed in `catalogEntityPipeline`

**Public endpoints** (packages, facilities, addons, calendar):
- Controller methods check cache before querying DB
- Cache keys include language parameter (e.g., `mandapam:packages:all:EN`)
- Invalidated when admin updates/deletes entities
- **New:** `GET /mandapam/public/catalog` consolidates packages + facilities + addons in a single call (replaces 3 separate public API calls)

All cache operations are non-critical — failures are logged and swallowed to avoid impacting API availability.

---

## API Envelope

All responses follow a consistent format:

```typescript
// Success
{ success: true, data: T }

// Error
{ success: false, error: { code: string, message: string, details?: unknown } }
```

Error messages are automatically localized based on `Accept-Language` header (en/ta).

---

## Auth Routes (all implemented)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/registration/otp` | — | Send 6-digit OTP to email |
| POST | `/auth/registration/otp/verify` | — | Verify OTP, get verificationToken |
| POST | `/auth/signup` | — | Create account with verificationToken |
| POST | `/auth/login` | — | Login, returns accessToken + httpOnly refresh cookie |
| POST | `/auth/refresh` | Cookie | Rotate tokens (silent refresh) |
| POST | `/auth/logout` | Cookie | Revoke current session |
| POST | `/auth/logout-all` | Bearer | Revoke all sessions |
| POST | `/auth/password/otp` | — | Send password reset OTP |
| POST | `/auth/password/otp/verify` | — | Verify OTP, get resetToken |
| POST | `/auth/password/reset` | — | Reset password with resetToken |
| GET | `/auth/me` | Bearer | Get authenticated user profile |
| POST | `/auth/change-password` | Bearer | Change password |

---

## Verification Lifecycle (State Machine)

```
PENDING → VERIFIED   (successful OTP entry)
       → EXPIRED     (OTP TTL, job runs every 1min)
       → CANCELLED   (user requests new OTP)
                ↓
           ARCHIVED  (30 days, daily job)
                ↓
           PURGED    (90 days, weekly job)
```

### Scheduled Jobs

| Job | Interval | Action |
|-----|----------|--------|
| `expire-verification` | 1 min | `PENDING` → `EXPIRED` where `expiresAt < now` |
| `archive-verification` | Daily | Any terminal state → `ARCHIVED` where age > 30 days |
| `purge-verification` | Weekly | `ARCHIVED` → `PURGED` where age > 90 days |

### Registration / Reset Sessions

- `RegistrationSession` stores signup payload (`snapshotTarget`) keyed by `verificationId`.
- `ResetSession` stores the reset target similarly.
- These sessions are consumed via `usedAt` timestamp. They prevent race conditions where cleanup deletes a verification row mid-flow.

---

## Error Codes

Standardized error codes with localized messages:

| Code | Meaning |
|------|---------|
| `AUTH_VERIFICATION_EXPIRED` | OTP timed out (HTTP 410) |
| `AUTH_INVALID_OTP` | Wrong OTP |
| `AUTH_USER_EXISTS` | Email/phone already registered |
| `AUTH_INVALID_CREDENTIALS` | Bad login |
| `AUTH_ACCOUNT_NOT_FOUND` | No such account |
| `AUTH_EMAIL_DELIVERY_FAILED` | SMTP failure |
| `AUTH_REGISTRATION_INCOMPLETE` | Missing verification step |
| `AUTH_UNAUTHORIZED_PORTAL` | Wrong portal for role |
| `VALIDATION_ERROR` | Zod validation failed (HTTP 422) |
| `RATE_LIMIT_EXCEEDED` | Too many requests (HTTP 429) |

Full list in `ErrorCodes.ts` and `locales/{en,ta}/errors.json`.

---

## Dependency Injection Wiring

```
VerificationRepository
        ↓
VerificationService
        ↓
    AuthService  ←  SessionService  ←  SessionRepository
        ↓              ↑
    AuthController  AccountService  ←  AccountRepository
        ↓
  AuthRoutes (Router)
```

All DI is manual (no framework). Each constructor receives its dependencies. The `createApp()` function in `app.ts` wires everything together.

---

## Config

| Config File | Key Settings |
|-------------|-------------|
| `app.config.ts` | `port`, `corsOrigin`, `cookieSecret`, `accountNoPrefix` |
| `auth.config.ts` | JWT expiry (access: 15min, refresh: 7d), OTP length/expiry (3min, 6 digits), rate limits, job intervals |
| `database.config.ts` | Prisma datasource URL |
| `queue.config.ts` | Redis connection for BullMQ |

---

## Development

### Testing

```bash
npm test              # All tests (unit + integration)
npm run test:e2e      # E2E tests (require test DB)
```

Tests use a separate test database. The `setup.ts` file handles test DB creation/teardown.

### Adding a New Route

1. Create DTO schema in `modules/{module}/dto/` (Zod)
2. Add validator schema in `common/validators/`
3. Add service method in `modules/{module}/{module}.service.ts`
4. Add controller handler in `modules/{module}/{module}.controller.ts`
5. Register route in `modules/{module}/{module}.routes.ts`
6. Mount route in `app.ts`
7. Create API client function in `frontend/src/api/{module}.api.ts`

### Prisma Schema Changes

```bash
# After editing schema.prisma:
npx prisma generate      # Client regeneration
npx prisma migrate dev   # Migration + apply
npm run db:seed          # Re-seed if needed
```
