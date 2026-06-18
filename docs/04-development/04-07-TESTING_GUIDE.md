# Testing Guide

How tests are structured, what to test, and common patterns.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TEST PYRAMID                                         │
│                                                                         │
│                         ┌──────┐                                        │
│                        /│ E2E  │\   Few — full login→flow→verify       │
│                       / │      │ \                                     │
│                      /  └──────┘  \                                    │
│                     /┌────────────┐\                                   │
│                    / │Integration │ \  Many — pipeline + middleware    │
│                   /  │(with DB)    │  \                                │
│                  /   └────────────┘   \                                │
│                 / ┌──────────────────┐ \                               │
│                /  │    Unit          │  \   Most — pure function tests │
│               /   │ (isolated)       │   \                             │
│              /    └──────────────────┘    \                            │
└─────────────────────────────────────────────────────────────────────────┘
```

## Unit Tests

Test pure functions in isolation. Mock nothing (or very little).

```typescript
// backend/src/common/__tests__/crypto.test.ts
describe('crypto', () => {
  describe('generateToken', () => {
    it('generates a 32-byte hex string', () => {
      const token = generateToken();
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it('generates unique values', () => {
      const t1 = generateToken();
      const t2 = generateToken();
      expect(t1).not.toBe(t2);
    });
  });

  describe('hashToken', () => {
    it('produces a SHA-256 hash', () => {
      const hash = hashToken('test-token');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
      // Deterministic
      expect(hashToken('test-token')).toBe(hash);
    });
  });
});
```

## Integration Tests

Test pipelines and services with a real database.

```typescript
// backend/src/__tests__/auth-pipeline.test.ts
import { setupTestDb, teardownTestDb } from './helpers';

describe('Auth Pipeline (integration)', () => {
  beforeAll(async () => {
    await setupTestDb();  // Spins up TestContainer PostgreSQL
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  describe('Login', () => {
    it('succeeds with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'Password123!' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('fails with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
    });
  });
});
```

## Mocking Strategy

| What | How |
|------|-----|
| Database | Real PostgreSQL via TestContainer (integration tests) |
| Redis | Not needed for most tests; mock only if testing caching |
| SMTP | Mock email service — verify it was called with correct args |
| JWT | Use real JWT signing with test secrets |
| Time | Use `vi.useFakeTimers()` for time-sensitive tests |
| File system | Mock `fs` or `sharp` for upload tests |

## Fixtures

```typescript
// backend/src/__tests__/fixtures.ts
export const testAccount = {
  email: 'test@example.com',
  password: 'Password123!',
  status: 'ACTIVE',
  role: 'USER',
};

export const testProfile = {
  name: 'Test User',
  age: 28,
  height: 170,
  // ... full profile data
};
```

## Running Tests

```bash
# Backend
cd backend
npm test                    # All tests
npx vitest --reporter=verbose  # Verbose output
npx vitest --coverage          # Coverage report

# Frontend
cd frontend
npm test
```

## What to Test

| Layer | What | Example |
|-------|------|---------|
| Crypto utils | Correct output, uniqueness | Token generation, hashing |
| Validators | Valid/invalid input, edge cases | Email format, password strength |
| Pipeline steps | Each step in isolation | ValidateAccountStatus with suspended account |
| Full pipeline | Happy path through all steps | Login → register → OTP verify |
| Middleware | Auth guard rejects unauthenticated | requireAuth without cookie |
| Controller | Correct status codes, response shape | GET returns 200 with data |
| Error handler | Structured error response | AppError produces correct JSON |
| Frontend hooks | Query returns data, mutation succeeds | useProfile returns profile |

## Edge Cases to Always Test

- [ ] Empty body → 400
- [ ] Missing required fields → 400
- [ ] Invalid data types → 400
- [ ] Unauthenticated → 401
- [ ] Wrong role → 403
- [ ] Not found → 404
- [ ] Concurrent requests → no corruption
- [ ] Rate limit → 429
- [ ] Null/undefined inputs → graceful handling
