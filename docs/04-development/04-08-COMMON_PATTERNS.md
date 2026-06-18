# Common Patterns

Recurring implementation patterns used across the codebase.

## Pagination

Cursor-based for real-time data (profiles, bookings), offset-based for admin lists.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PAGINATION PATTERNS                                 │
│                                                                         │
│   CURSOR-BASED (profiles, bookings)    OFFSET-BASED (admin lists)      │
│   ┌──────────────────────────────┐     ┌──────────────────────────┐    │
│   │ GET /api/profiles            │     │ GET /api/admin/profiles  │    │
│   │ ?cursor=abc&limit=20        │     │ ?page=2&pageSize=20      │    │
│   │                              │     │                          │    │
│   │ Response:                    │     │ Response:                │    │
│   │ { data: [...],               │     │ { data: [...],           │    │
│   │   nextCursor: "xyz" }        │     │   total: 154,            │    │
│   │                              │     │   page: 2,               │    │
│   │ Stable ordering, no skip     │     │   totalPages: 8 }        │    │
│   └──────────────────────────────┘     └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Cursor-based

```typescript
// Service
async browseProfiles(cursor?: string, limit = 20) {
  const profiles = await prisma.profile.findMany({
    take: limit + 1,  // Fetch one extra to detect "has more"
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' },
    where: { status: 'ACTIVE' },
  });

  const hasMore = profiles.length > limit;
  if (hasMore) profiles.pop();

  return {
    data: profiles,
    nextCursor: hasMore ? profiles[profiles.length - 1].id : null,
  };
}
```

## Optimistic Updates

Used for shortlist toggle (instant UI feedback, then sync with server).

```typescript
// Frontend hook
const toggleShortlist = useMutation({
  mutationFn: (profileId: string) => api.post(`/api/shortlist/${profileId}`),
  onMutate: async (profileId) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['profiles'] });
    // Snapshot previous value
    const prev = queryClient.getQueryData(['profiles']);
    // Optimistically update
    queryClient.setQueryData(['profiles'], (old) =>
      old.map((p) => p.id === profileId ? { ...p, isShortlisted: !p.isShortlisted } : p),
    );
    return { prev };
  },
  onError: (err, profileId, context) => {
    // Rollback on error
    queryClient.setQueryData(['profiles'], context?.prev);
  },
});
```

## Cache Invalidation

```typescript
// After write operations, invalidate by tags
router.post('/profiles/:id/shortlist', requireAuth, async (req, res) => {
  await shortlistService.toggle(req.params.id, req.user!.id);
  await cacheService.invalidateTag(`profile:${req.params.id}`);
  res.json({ success: true });
});
```

## File Upload

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FILE UPLOAD FLOW                                    │
│                                                                         │
│   Client → multer (parse) → sharp (resize) → storage (disk/S3) → URL  │
│                                                                         │
│   Max size: 5MB                                                         │
│   Allowed: jpg, png, webp                                               │
│   Output: 3 sizes (thumbnail 150x, medium 600x, full 1920x)            │
│   Storage: /uploads/profiles/{id}/{size}/{filename}                     │
│                                                                         │
│   Edge cases:                                                          │
│   - Exceeds 5MB → 413                                                   │
│   - Wrong format → 415                                                  │
│   - Image corruption → 400                                              │
│   - Disk full → 500                                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Audit Logging

```typescript
// Every state-changing operation logs to audit_log
await auditService.log({
  entityType: 'PROFILE',
  entityId: profile.id,
  action: 'STATUS_CHANGE',
  oldState: { status: 'DRAFT' },
  newState: { status: 'ACTIVE' },
  performedBy: req.user!.id,
  ip: req.ip,
});
```

## Rate Limiting Configuration

```typescript
// Per-route rate limits
router.post('/auth/otp/send',
  rateLimit({ windowMs: 60000, max: 3 }),  // 3 per minute
  controller.sendOtp,
);

router.post('/auth/otp/verify',
  rateLimit({ windowMs: 60000, max: 5 }),  // 5 per minute
  controller.verifyOtp,
);
```
