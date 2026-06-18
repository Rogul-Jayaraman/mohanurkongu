# How to Add a Pipeline

Create a new multi-step operation using the pipeline pattern.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ADD A PIPELINE — 6 STEPS                            │
│                                                                         │
│   1. Define Context (types)   What data flows through the pipeline     │
│   2. Write Step Functions     Individual step logic (PRE/TX/POST)      │
│   3. Create Runner            Instantiate PipelineRunner with steps    │
│   4. Wire into Controller     Controller calls pipeline.run(ctx)       │
│   5. Handle Results           Check for errors, build response         │
│   6. Document in 05-pipelines/   Create docs/05-pipelines/{name}.md    │
│                                                                         │
│   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐     │
│   │Context │──▶│ Steps  │──▶│ Runner │──▶│Control │──▶│  Doc   │     │
│   └────────┘   └────────┘   └────────┘   └────────┘   └────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Example: SimpleNotificationPipeline

Let's create a pipeline that sends a notification when a profile is shortlisted.

### Step 1: Context

```typescript
// backend/src/manamaalai/pipelines/shortlist-notification.context.ts
interface ShortlistNotificationContext extends PipelineContext {
  actorId: string;          // Who shortlisted
  targetProfileId: string;  // Who was shortlisted
  notification?: {
    id: string;
    type: 'SHORTLIST';
    sentAt: Date;
  };
}
```

### Step 2: Steps

```typescript
// backend/src/manamaalai/pipelines/steps/validate-shortlist.step.ts
// PRE step — validates that both profiles exist and are active
async function validateShortlist(
  ctx: ShortlistNotificationContext,
  prev: StepOutput,
): Promise<StepOutput> {
  const [actor, target] = await Promise.all([
    prisma.profile.findUnique({ where: { id: ctx.actorId } }),
    prisma.profile.findUnique({ where: { id: ctx.targetProfileId } }),
  ]);
  if (!actor || !target) {
    return { context: {}, error: new AppError(ErrorCode.PROFILE_NOT_FOUND, 404, ...) };
  }
  // ... return success with context
}
```

```typescript
// TX step — creates notification record
async function createNotification(ctx, prev) {
  const notification = await prisma.notification.create({
    data: { type: 'SHORTLIST', toProfileId: ctx.targetProfileId, fromProfileId: ctx.actorId },
  });
  return { context: { notification } };
}
```

```typescript
// POST step — sends real-time notification via queue
async function sendNotification(ctx, prev) {
  await notificationQueue.add('send', { notificationId: ctx.notification!.id });
  return { context: {} };
}
```

### Step 3: Runner

```typescript
// backend/src/manamaalai/pipelines/shortlist-notification.pipeline.ts
const pipeline = new PipelineRunner<ShortlistNotificationContext>([
  // PRE (validations)
  validateShortlist,
  checkDuplicateShortlist,
  // TX (database writes)
  createNotification,
  // POST (side effects)
  sendNotification,
]);

export async function runShortlistNotification(ctx: ShortlistNotificationContext) {
  return pipeline.run(ctx);
}
```

### Step 4: Wire into Controller

```typescript
// In the shortlist controller action:
const result = await runShortlistNotification({
  actorId: req.user!.id,
  targetProfileId: params.profileId,
  requestId: req.id,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
} as ShortlistNotificationContext);
```

### Step 5: Handle Results

```typescript
if (result.error) {
  return next(result.error);
}
res.status(201).json({ data: result.context });
```

### Step 6: Document

Add a pipeline doc to `docs/05-pipelines/backend/manamaalai/shortlist-notification.md` following the existing format (ASCII diagram → step table → edge cases).

## Pipeline Guidelines

| Rule | Why |
|------|-----|
| Steps are pure functions | Testable, predictable |
| Each step returns `StepOutput`, never throws | Runner handles error propagation |
| PRE steps never write to DB | Fast failure without side effects |
| TX steps are inside a Prisma $transaction | Atomic writes, rollback on failure |
| POST steps are best-effort | Operation already committed |
| Context carries ALL state between steps | No global variables, no surprise mutations |
| Maximum ~12 steps per pipeline | Readability, testability |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Step throws instead of returning error | Always return `StepOutput` with `error` field |
| PRE step writes to DB | Move write to TX phase |
| TX step depends on POST output | TX is self-contained; POST is for side effects |
| Context field names clash | Use descriptive, unique names per domain |
| Pipeline too long (20+ steps) | Split into sub-pipelines |
| Forgetting to document in docs/05-pipelines/ | The pipeline doc is the source of truth for the flow |
