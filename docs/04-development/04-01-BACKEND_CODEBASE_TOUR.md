# Backend Codebase Tour

Walk through every directory in `backend/src/` — what each file does and patterns to follow.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    BACKEND CODEBASE MAP                                │
│                                                                         │
│   backend/src/                                                         │
│   ├── app.ts               ← START HERE: middleware chain + router mgt │
│   ├── server.ts            ← HTTP server bootstrap                    │
│   ├── main.ts              ← CLI commands (start, migrate, seed)      │
│   │                                                                     │
│   ├── auth/                ← Login, register, OTP, tokens              │
│   │   ├── auth.controller.ts    Route handlers — thin, delegates to     │
│   │   │                         pipeline                              │
│   │   ├── auth.routes.ts        Route definitions — mounts controllers │
│   │   ├── auth.service.ts       Business logic (used by pipelines)     │
│   │   ├── auth.dtos.ts          Zod schemas for request validation     │
│   │   └── *.pipeline.ts         7 pipeline files (7-9 steps each)     │
│   │                                                                     │
│   ├── manamaalai/          ← Matrimony profiles                        │
│   │   ├── manamaalai.controller.ts                                     │
│   │   ├── manamaalai.routes.ts                                         │
│   │   ├── manamaalai.service.ts                                        │
│   │   ├── manamaalai.dtos.ts                                           │
│   │   ├── validators/      ← Zod-based validators                     │
│   │   └── pipelines/       ← 13+ pipeline files                       │
│   │                                                                     │
│   ├── maaligai/            ← Hall booking                              │
│   │   ├── maaligai.controller.ts                                       │
│   │   ├── maaligai.routes.ts                                           │
│   │   ├── maaligai.service.ts                                          │
│   │   ├── maaligai.dtos.ts                                             │
│   │   ├── validators/      ← Booking-specific validators              │
│   │   └── pipelines/       ← 11 pipeline files                        │
│   │                                                                     │
│   ├── common/              ← SHARED: middleware, pipeline, errors      │
│   │   ├── middleware/      9 guard middlewares                         │
│   │   ├── pipeline/        Pipeline runner + types                    │
│   │   ├── errors/          AppError class + 79 error codes            │
│   │   ├── queue/           BullMQ setup                              │
│   │   ├── services/        OTP, cache, email, audit services          │
│   │   └── utils/           Crypto, JWT, date helpers                 │
│   │                                                                     │
│   └── ...                                                              │
└─────────────────────────────────────────────────────────────────────────┘
```

## Key Files

### `app.ts`
The entry point where everything is wired:
- Middleware chain (order matters — see below)
- Router mounting
- Error handler (last in chain)
- 404 handler

### `server.ts`
Creates HTTP server, calls `app.ts`, starts listening. Used by:
- `npm run dev` (nodemon restarts)
- Docker production entry point

### `main.ts`
CLI interface:
```bash
node dist/main.js start     # Start server
node dist/main.js migrate   # Run Prisma migrations
node dist/main.js seed      # Seed database
```

## Middleware Chain Order

This order is **critical** — changing it can break auth, security, or i18n.

```typescript
// app.ts (simplified)
app.use(helmet())           // 1. Security headers
app.use(cors(corsConfig))   // 2. CORS (before cookies)
app.use(cookieParser())     // 3. Cookie parsing
app.use(rateLimit)          // 4. Rate limiting
app.use(session(sessConfig))// 5. Session
app.use(i18nMiddleware)     // 6. i18n (sets req.t)
app.use(serveStatic)        // 7. Static files
app.use(router)             // 8. API routes
app.use(errorHandler)       // 9. Error handler (last!)
```

## Common Patterns

### Controller → Pipeline → Service → Repository

```
Controller:     Parses request, calls pipeline
Pipeline:       Orchestrates steps (PRE → TX → POST)
Service:        Business logic (used by pipeline steps)
Repository:     Prisma queries (services call Prisma directly)
```

### Error Handling

```typescript
// Never throw raw Error — always use AppError
throw new AppError(
  ErrorCode.AUTH_INVALID_CREDENTIALS,
  401,
  'auth:errors.invalidCredentials'
);
```

## What NOT to Touch

| File | Why |
|------|-----|
| `common/middleware/errorHandler.ts` | Global handler — changing format breaks all API error responses |
| `common/pipeline/pipeline-runner.ts` | Core engine — all pipelines depend on its behavior |
| `app.ts` middleware order | Changing order can break security, i18n, or cookie parsing |
| `common/constants.ts` | Shared across all modules |
