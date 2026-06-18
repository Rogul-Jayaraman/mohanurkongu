# Running Tests

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        TEST HIERARCHY                                  │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │                    BACKEND (Vitest)                          │     │
│   │                                                              │     │
│   │   UNIT TESTS                      INTEGRATION TESTS          │     │
│   │   ┌──────────────────────┐        ┌──────────────────────┐   │     │
│   │   │ • crypto helpers     │        │ • Auth pipeline      │   │     │
│   │   │ • JWT utilities      │        │   (login→register→   │   │     │
│   │   │ • validators         │        │    otp→refresh)      │   │     │
│   │   │ • error classes      │        │ • Pipeline runner    │   │     │
│   │   │ • string helpers     │        │ • Middleware chain    │   │     │
│   │   └──────────────────────┘        └──────────────────────┘   │     │
│   │                                                              │     │
│   │   TOOLS: vitest, supertest, TestContainer (PostgreSQL)       │     │
│   └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │                    FRONTEND (Vitest)                         │     │
│   │                                                              │     │
│   │   COMPONENT TESTS                 HOOK TESTS                 │     │
│   │   (minimal)                       (minimal)                  │     │
│   └──────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Backend Tests

```bash
cd backend

# Run all tests
npm test

# Watch mode (re-run on changes)
npm run test:watch

# Run specific test file
npx vitest src/auth/__tests__/pipeline.test.ts

# Run tests matching a pattern
npx vitest -t "login"

# Coverage report
npx vitest --coverage
```

### Test Structure

```
backend/src/
  __tests__/               # Integration tests (pipeline-level)
    auth-pipeline.test.ts
    profile-pipeline.test.ts
  auth/
    __tests__/             # Unit tests per module
    otp.service.test.ts
  common/
    __tests__/
    pipeline-runner.test.ts
```

### Test Database

Integration tests spin up a **TestContainer** PostgreSQL instance automatically. No manual setup needed.

- Test DB runs on a random available port
- Schema is auto-applied via Prisma migrations
- Each test suite gets a fresh database
- Tests clean up after themselves

## Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Watch mode
npm run test:watch
```

Frontend tests are currently minimal. Most testing effort is on the backend.

## Writing Tests

See [Testing Guide](../04-development/04-07-TESTING_GUIDE.md) for patterns and conventions.

## Current Status

- **107 passed** (core auth + profile pipelines)
- **6 skipped** (require SMTP or external service)
- **1 pre-existing failure** (known issue — see [Known Limitations](../08-reference/08-05-KNOWN_LIMITATIONS.md))
