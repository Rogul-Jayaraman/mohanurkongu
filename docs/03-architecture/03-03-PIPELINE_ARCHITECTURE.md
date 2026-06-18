# Pipeline Architecture

The pipeline pattern is the heart of every major backend operation. It transforms a complex multi-step process into composable, testable steps.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     GENERIC PIPELINE PATTERN                           │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │                    PIPELINE RUNNER                            │     │
│   │                                                              │     │
│   │  Context ──▶ Step 1 ──▶ Step 2 ──▶ Step 3 ──▶ ... ──▶ Output │     │
│   │                  │           │           │                    │     │
│   │                  ▼           ▼           ▼                    │     │
│   │             ┌────────┐ ┌────────┐ ┌────────┐                  │     │
│   │             │StepFn  │ │StepFn  │ │StepFn  │                  │     │
│   │             │        │ │        │ │        │                  │     │
│   │             │Input:  │ │Input:  │ │Input:  │                  │     │
│   │             │ctx +   │ │ctx+prev│ │ctx+prev│                  │     │
│   │             │prevOut │ │output  │ │output  │                  │     │
│   │             │Output: │ │Output: │ │Output: │                  │     │
│   │             │partial │ │partial │ │partial │                  │     │
│   │             └────────┘ └────────┘ └────────┘                  │     │
│   └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │                    PRE / TX / POST BOUNDARIES                 │     │
│   │                                                              │     │
│   │  ┌────────────────────────────────────────────────────────┐  │     │
│   │  │  PRE-PHASE (validations, lookups)                     │  │     │
│   │  │  → Can fail fast without touching DB transaction      │  │     │
│   │  └────────────────────────────────────────────────────────┘  │     │
│   │                           │                                   │     │
│   │                           ▼                                   │     │
│   │  ┌────────────────────────────────────────────────────────┐  │     │
│   │  │  $transaction PHASE (writes, must succeed atomically)  │  │     │
│   │  │  → All steps inside a Prisma $transaction              │  │     │
│   │  │  → Any failure rolls back everything                   │  │     │
│   │  └────────────────────────────────────────────────────────┘  │     │
│   │                           │                                   │     │
│   │                           ▼                                   │     │
│   │  ┌────────────────────────────────────────────────────────┐  │     │
│   │  │  POST-PHASE (side effects, notifications, audit logs)   │  │     │
│   │  │  → Runs after transaction commits                      │  │     │
│   │  │  → Failures are logged but don't roll back the op      │  │     │
│   │  └────────────────────────────────────────────────────────┘  │     │
│   └──────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Key Concepts

### PipelineContext

An object that flows through all steps. Each step reads from and writes to it.

```typescript
interface PipelineContext {
  // Input (from request)
  body: zod.infer<typeof SomeDto>;
  params?: Record<string, string>;
  query?: Record<string, string>;

  // Set by steps along the way
  account?: Account;
  profile?: Profile;
  tokens?: TokenPair;

  // Metadata
  requestId: string;
  ip: string;
  userAgent: string;
}

interface StepOutput {
  context: Partial<PipelineContext>;  // Updates to merge
  error?: AppError;                    // Step failed
}
```

### StepFunction

```typescript
type StepFunction<T extends PipelineContext> = (
  ctx: T,
  prev: StepOutput,
) => Promise<StepOutput>;
```

Each step:
- Receives the **full context** so far + **previous step's output**
- Returns an **object** (never throws) — success has `context`, failure has `error`
- Can access DB via Prisma, call external services, or validate data

### PipelineRunner

```typescript
class PipelineRunner<T extends PipelineContext> {
  constructor(private steps: StepFunction<T>[]) {}

  async run(ctx: T): Promise<RunResult> {
    let result: StepOutput = { context: {} };
    for (const step of this.steps) {
      result = await step(ctx, result);
      if (result.error) break;
    }
    return result;
  }
}
```

## Concrete Example: LoginPipeline (7 steps)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     LOGIN PIPELINE                                      │
│                                                                         │
│  STEP 1: FindAccount            PRE   Finds account by email           │
│  STEP 2: VerifyPassword         PRE   Argon2id.compare()              │
│  STEP 3: CheckAccountStatus     PRE   Not SUSPENDED or DELETED         │
│  STEP 4: CheckMembershipStatus  PRE   Not EXPIRED                    │
│  STEP 5: GenerateTokens         TX    Creates JWT + refresh token      │
│  STEP 6: SetCookies             POST  Sets httpOnly cookies           │
│  STEP 7: BuildResponse          POST  Returns user + sanitized data   │
│                                                                         │
│  Steps 1-4: PRE — can fail fast, no DB writes                         │
│  Step 5:    TX  — writes tokens to DB (inside $transaction)           │
│  Steps 6-7: POST — sets cookies, builds response                      │
└─────────────────────────────────────────────────────────────────────────┘
```

## Concrete Example: BookingCreatePipeline (12 steps)

```
┌─────────────────────────────────────────────────────────────────────────┐
│               BOOKING-CREATE PIPELINE (maaliagai)                      │
│                                                                         │
│  VerifyAuth → ValidateDates → CheckAvailability →                     │
│  ValidateAddons → CalculatePrice → CreateBooking →                    │
│  CreateSettlementToken → BlockCalendar → IssueToken →                 │
│  SendNotifications → AuditLog → BuildResponse                         │
│                                                                         │
│  PRE:  Steps 1-5 (validation + calculation)                           │
│  TX:   Steps 6-9 (booking, token, calendar — all or nothing)          │
│  POST: Steps 10-12 (notifications, audit, response)                   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Step throws (not AppError) | Runner catches, wraps in AppError(INTERNAL_ERROR), stops pipeline |
| Step returns error | Runner immediately stops, returns error result (no more steps run) |
| PRE step fails | Fast failure — no DB writes, no side effects |
| TX step fails | Prisma $transaction rolls back all writes |
| POST step fails | Error is logged to Sentry; operation is already committed |
| Concurrent pipeline on same account | Mutex lock via Redis (per-account lock) |
| Null context | Runner throws on first null access (defensive) |
| Pipeline with 0 steps | Returns empty result immediately |
| Step modifies context in unexpected way | TypeScript enforces Partial<PipelineContext> |

## All Pipeline Files

See [Pipeline Index](../05-pipelines/05-01-INDEX.md) for the complete catalog of all 61 pipeline documents.
