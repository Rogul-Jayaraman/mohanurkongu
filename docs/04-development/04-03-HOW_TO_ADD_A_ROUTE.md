# How to Add a Route

8-step guide with code templates. We'll use a real example: `GET /api/profiles/:id/stats`.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ADD A ROUTE — 8 STEPS                               │
│                                                                         │
│   1. DTO (Zod schema)          Define shape + validation               │
│   2. Validator (optional)      Custom validation logic                 │
│   3. Service (optional)        Business logic                          │
│   4. Pipeline (optional)       Multi-step pipeline                     │
│   5. Controller                Parse → call service/pipeline → respond  │
│   6. Routes                    Mount method + path + middleware        │
│   7. Mount in app.ts           Wire route module into app              │
│   8. Test                      Vitest + supertest                     │
│                                                                         │
│   ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐     │
│   │ DTO  │──▶│Valid │──▶│Svc   │──▶│Pipe  │──▶│Ctrl  │──▶│Routes│     │
│   └──────┘   └──────┘   └──────┘   └──────┘   └──────┘   └──┬───┘     │
│                                                              │        │
│                                                              ▼        │
│                                                   ┌────────┐ ┌──────┐ │
│                                                   │ Mount  │ │Test  │ │
│                                                   └────────┘ └──────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

## Step 1: DTO (Zod Schema)

Define what the request looks like and validate it.

```typescript
// backend/src/manamaalai/manamaalai.dtos.ts (add to existing)
export const ProfileStatsParamsDto = z.object({
  id: z.string().uuid(),
});

export const ProfileStatsQueryDto = z.object({
  daysBack: z.coerce.number().int().min(1).max(365).default(30),
});
```

## Step 2: Validator (for complex logic)

Optional — only needed if validation goes beyond Zod's capability.

```typescript
// backend/src/manamaalai/validators/profile-stats.validator.ts
export async function validateProfileAccess(
  profileId: string,
  userId: string,
): Promise<void> {
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) throw new AppError(ErrorCode.PROFILE_NOT_FOUND, 404, 'profile:errors.notFound');
  if (profile.accountId !== userId && req.user.role !== 'ADMIN') {
    throw new AppError(ErrorCode.FORBIDDEN, 403, 'common:errors.forbidden');
  }
}
```

## Step 3: Service (business logic)

Does the actual work — queries, calculations, transformations.

```typescript
// backend/src/manamaalai/manamaalai.service.ts
async getProfileStats(profileId: string, daysBack: number): Promise<ProfileStats> {
  const since = subDays(new Date(), daysBack);

  const [shortlistCount, viewCount, interestCount] = await Promise.all([
    prisma.shortlist.count({ where: { targetProfileId: profileId, createdAt: { gte: since } } }),
    prisma.profileView.count({ where: { profileId, createdAt: { gte: since } } }),
    prisma.interest.count({ where: { toProfileId: profileId, createdAt: { gte: since } } }),
  ]);

  return { profileId, shortlistCount, viewCount, interestCount, period: daysBack };
}
```

## Step 4: Pipeline (multi-step)

Only needed if the operation requires multiple steps with PRE/TX/POST boundaries. For simple operations, skip this and call the service directly from the controller.

## Step 5: Controller

Thin handler — parse request, call service, format response.

```typescript
// backend/src/manamaalai/manamaalai.controller.ts
async getProfileStats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const params = ProfileStatsParamsDto.parse(req.params);
    const query = ProfileStatsQueryDto.parse(req.query);
    await validateProfileAccess(params.id, req.user!.id);
    const stats = await manamaalaiService.getProfileStats(params.id, query.daysBack);
    res.json({ data: stats });
  } catch (err) {
    next(err);
  }
}
```

## Step 6: Routes

Mount the method + path + middleware.

```typescript
// backend/src/manamaalai/manamaalai.routes.ts
// Add to the existing router:
router.get(
  '/profiles/:id/stats',
  requireAuth,
  controller.getProfileStats.bind(controller),
);
```

## Step 7: Mount in app.ts

If it's a new route module, mount it in `app.ts`:

```typescript
// backend/src/app.ts (existing — add if new module)
app.use('/api', manamaalaiRoutes);
```

## Step 8: Test

```typescript
// backend/src/manamaalai/__tests__/profile-stats.test.ts
describe('GET /api/profiles/:id/stats', () => {
  it('returns stats for own profile', async () => {
    const res = await request(app)
      .get(`/api/profiles/${profileId}/stats?daysBack=30`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('shortlistCount');
    expect(res.body.data).toHaveProperty('viewCount');
    expect(res.body.data).toHaveProperty('interestCount');
  });

  it('returns 403 for unauthorized access', async () => {
    const res = await request(app)
      .get(`/api/profiles/${otherProfileId}/stats`)
      .set('Authorization', `Bearer ${otherUserToken}`);

    expect(res.status).toBe(403);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app)
      .get(`/api/profiles/${profileId}/stats`);

    expect(res.status).toBe(401);
  });
});
```

## Common Mistakes Checklist

- [ ] DTO validates types AND constraints (string length, number range)
- [ ] Controller catches errors and calls `next(err)`
- [ ] Route has correct middleware guards (auth, role, rate limit)
- [ ] Route path matches frontend API call
- [ ] Response format matches existing patterns (`{ data: ... }` or `{ error: ... }`)
- [ ] Test covers: success, auth failure, validation failure, not found
- [ ] Error codes match codes in `error-codes.ts`
