# Caching Strategy

Three-layer caching with tag-based invalidation and per-request gating.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      3-LAYER CACHE ARCHITECTURE                        │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │  LAYER 1: REACT QUERY (Browser memory)                      │     │
│   │                                                              │     │
│   │  Purpose: Avoid re-fetching the same data on page navigation │     │
│   │  TTL: 5 minutes (staleTime), 30 minutes (gcTime)            │     │
│   │  Scoped: Per user session, per query key                    │     │
│   │  Invalidation: On mutation success (tag-based)              │     │
│   │  Offline: Shows stale data when network unavailable          │     │
│   └───────────────────┬──────────────────────────────────────────┘     │
│                       │                                                │
│                       ▼                                                │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │  LAYER 2: REDIS CACHE (Server memory)                       │     │
│   │                                                              │     │
│   │  Purpose: Avoid DB queries for frequently-accessed data      │     │
│   │  TTL: Varies by entity (1-15 minutes)                       │     │
│   │  Tags: Entity-based tags for invalidation                    │     │
│   │  Version: Cache version key increments on schema migration   │     │
│   │  Gating: Never cache auth decisions, user-specific data      │     │
│   └───────────────────┬──────────────────────────────────────────┘     │
│                       │                                                │
│                       ▼                                                │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │  LAYER 3: POSTGRESQL (Primary store)                        │     │
│   │                                                              │     │
│   │  Purpose: Source of truth                                    │     │
│   │  No TTL: Data lives until deleted/updated                   │     │
│   └──────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Tag-based Invalidation

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TAG INVALIDATION PATTERN                            │
│                                                                         │
│   When a mutation occurs (e.g., profile update):                      │
│                                                                         │
│   1. Backend performs the write                                        │
│   2. Backend emits invalidation tag: "profile:123"                    │
│   3. Redis clears all keys tagged with "profile:123"                  │
│   4. Response includes invalidation headers                            │
│   5. Frontend React Query reads headers → invalidates matching keys   │
│                                                                         │
│   ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     │
│   │ Profile  │────▶│Redis     │────▶│Response  │────▶│React Q.  │     │
│   │ Updated  │     │inval.    │     │headers   │     │refetches │     │
│   └──────────┘     └──────────┘     └──────────┘     └──────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
```

## TTL Policy

| Entity | Redis TTL | React Query staleTime | Why |
|--------|-----------|----------------------|-----|
| Profile data | 5 min | 5 min | Moderately volatile |
| Profile browse | 2 min | 2 min | Search results change often |
| Mandapam list | 15 min | 15 min | Rarely changes |
| Calendar | 1 min | 30 sec | Bookings change frequently |
| Membership | 10 min | 10 min | Changes on upgrade only |
| Static config | 1 hour | 1 hour | Almost never changes |
| Auth decisions | **Never** | **Never** | Must be real-time |
| User-specific | **Never** | Per user key | Don't mix user data |

## Gating Rules

| Condition | Cache Behavior |
|-----------|---------------|
| Route is admin | Bypass Redis (never cache admin responses) |
| User is suspended | Bypass all caches |
| Request has `Cache-Control: no-cache` | Bypass |
| Entity is user-specific | Keyed by userId, never shared |
| Entity is public | Aggressively cached |

## Race Condition Mitigations

| Scenario | Mitigation |
|----------|-----------|
| Cache stampede (many requests for expired key) | Redis lock — first request re-generates, others wait |
| Stale cache after write | Tag-based invalidation before write response |
| Concurrent writes | Prisma $transaction serializes writes |
| Cache key collision | Key = `entityType:entityId:tenant` |

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Redis down | Service falls through to PostgreSQL (graceful degradation) |
| React Query cache stale | Background refetch on component mount |
| Cache version mismatch | On deploy, increment cache version — all old keys ignored |
| User logs out | Clear React Query cache + Redis session keys |
| Bulk data update | Invalidate by tag group (e.g., "profile:*") |
