# Pipeline 11: verification-queue

> **For beginners**: Shows admins the queue of profiles waiting for review,
> with stats (how many pending, approved today, etc.). Read-only pipeline.

## Purpose

Replaces `getQueue()` and `getStats()` in `admin-verification.service.ts`. Two read-only sub-flows: queue listing returns paginated verification queue entries for profiles pending review; stats returns aggregate counts. Both are pure-read pipelines with no mutation steps.

## Actor & Entry

| Route | Method | mode | Rate Limiter |
|-------|--------|------|-------------|
| `/admin/verification/queue` | GET | `list` | None |
| `/admin/verification/stats` | GET | `stats` | None |

**Allowed Roles:** `ADMIN` (via `requireSession` + `requireRole('ADMIN')` middleware)

## High-Level Architecture

```
  ┌─ GET /admin/verification/queue?page=1&limit=20&search=...
  │  GET /admin/verification/stats
  ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  VerificationController                                               │
  │  const ctx = {                                                        │
  │    input:     req.query,                                              │
  │    accountId: req.account.sub,                                        │
  │    roles:     req.roles,                                              │
  │    mode:      req.path.includes('/stats') ? 'stats' : 'list',        │
  │  };                                                                    │
  │  const result = await verificationQueuePipeline(ctx);                 │
  │  sendSuccess(res, result);                                             │
  └──────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  PipelineRunner.run(steps, ctx)                                      │
  │                                                                       │
  │  ┌── S1: PRE-TRANSACTION ──────────────────────────────┐            │
  │  │  S1. permissionGate                                       │            │
  │  │                                                           │            │
  │  │  list mode:                     stats mode:               │            │
  │  │  S2a. buildQueueFilter(         S2b. (no filter)          │            │
  │  │    page, limit, search)                                   │            │
  │  └───────────────────────────────────────────────────────────┘            │
  │  ┌── POST-TRANSACTION ──────────────────────────────────┐              │
  │  │  S3a. executeQueueListQuery(filter)                     │              │
  │  │  S3b. executeStatsQuery()                               │              │
  │  │  S4a. formatQueueRows(rows, accountId)                  │              │
  │  │  S5a/ S4b. setResponse()                                │              │
  │  └──────────────────────────────────────────────────────────┘              │
  └────────────────────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture — Step by Step

---

### S1: permissionGate

```
====================================================================================
S1: permissionGate
────────────────────────────────────────────────────────────────────────────────────
action = (ctx.mode == 'list') ? 'profile:verification-queue' : 'profile:verification-stats'

┌──────────────────────┬─────────────────────┐
│ Action               │ Allowed Roles       │
├──────────────────────┼─────────────────────┤
│ profile:verification-queue │ ['ADMIN'] │
│ profile:verification-stats │ ['ADMIN'] │
└──────────────────────┴─────────────────────┘

if ctx.roles does not include any allowed role
  → AppError(401, AUTH_PORTAL_MISMATCH)

Output: ctx (unaltered)
```

---

### S2a: buildQueueFilter (LIST mode)

```
====================================================================================
S2a: buildQueueFilter
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.input.{ page, limit, search }

WHERE clause:
  ┌──────────────────────────────────────────────────────────────────────┐
  │  WHERE vq.completed_at IS NULL   -- only pending/in-progress         │
  │  AND (:search IS NULL OR (                                           │
  │    t.first_name ILIKE :search OR                                     │
  │    t.last_name ILIKE :search OR                                      │
  │    p.reg_no ILIKE :search                                            │
  │  ))                                                                   │
  └──────────────────────────────────────────────────────────────────────┘

ORDER BY:
  ┌─ default → vq.submitted_at ASC, vq.priority DESC
  │  (FIFO within priority tiers)
  └─ (no user-configurable sort in current implementation)

Pagination: offset = (page - 1) * limit, limit = clamp(limit, 1, 100)
  default: page=1, limit=20

Output: ctx.compiledFilter = { whereClause, orderBy, offset, limit }
```

---

### S2b: (no filter — STATS mode)

```
====================================================================================
S2b: (STATS — no filter needed)
────────────────────────────────────────────────────────────────────────────────────
Stats queries aggregate across ALL queue entries (no pagination, no filters).

Output: ctx (unaltered)
```

---

### S3a: executeQueueListQuery (LIST mode)

```
====================================================================================
S3a: executeQueueListQuery
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.compiledFilter, ctx.accountId (for claim status)

Main query:
  SELECT vq.id, vq.priority, vq.submitted_at, vq.reviewed_by,
         p.id AS profile_id, p.reg_no, p.current_status,
         pb.gender,
         EXTRACT(YEAR FROM AGE(pb.dob))::int AS age,
         pc.community_id, c.name AS community_name,
         t.first_name, t.last_name,
         CASE WHEN vq.reviewed_by = :accountId THEN true ELSE false END AS is_claimed
  FROM verification_queue vq
  JOIN profiles p ON p.id = vq.profile_id
  JOIN profile_basic pb ON pb.profile_id = p.id
  LEFT JOIN profile_communities pc ON pc.profile_id = p.id
  LEFT JOIN communities c ON c.id = pc.community_id
  LEFT JOIN profile_translations t ON t.profile_id = p.id AND t.language = 'EN'
  WHERE <compiledFilter.whereClause>
  ORDER BY vq.submitted_at ASC, vq.priority DESC
  OFFSET :offset LIMIT :limit

Count query (same filters):
  SELECT COUNT(*)
  FROM verification_queue vq
  JOIN profiles p ON p.id = vq.profile_id
  LEFT JOIN profile_translations t ON t.profile_id = p.id AND t.language = 'EN'
  WHERE <compiledFilter.whereClause>

Output: ctx.result = { items: rawRows[], total, page, limit }
```

---

### S3b: executeStatsQuery (STATS mode)

```
====================================================================================
S3b: executeStatsQuery
────────────────────────────────────────────────────────────────────────────────────
Query (single SQL run):
  SELECT
    (SELECT COUNT(*) FROM verification_queue
     WHERE completed_at IS NULL) AS pending_total,

    (SELECT COUNT(*) FROM verification_queue
     WHERE completed_at IS NULL
       AND submitted_at >= CURRENT_DATE) AS pending_today,

    (SELECT COUNT(*) FROM verification_queue
     WHERE status = 'APPROVED'
       AND completed_at >= CURRENT_DATE) AS approved_today,

    (SELECT COUNT(*) FROM verification_queue
     WHERE status = 'REJECTED'
       AND completed_at >= CURRENT_DATE) AS rejected_today,

    (SELECT COALESCE(
       AVG(EXTRACT(EPOCH FROM (completed_at - submitted_at)) / 3600), 0)
     FROM verification_queue
     WHERE completed_at IS NOT NULL
       AND completed_at >= CURRENT_DATE - INTERVAL '30 days') AS avg_review_time_hours

Output: ctx.result = { pendingTotal, pendingToday, approvedToday,
                       rejectedToday, avgReviewTimeHours }
```

---

### S4a: formatQueueRows (LIST mode)

```
====================================================================================
S4a: formatQueueRows
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.result.items (raw rows), ctx.accountId

For each row → QueueRowDTO:
  {
    queueId: vq.id,
    profileId: p.id,
    regNo: p.regNo ?? '-',
    fullName: t ? `${t.first_name} ${t.last_name}` : '-',
    gender: pb.gender,
    age: pb.age,
    community: c?.name ?? '-',
    submittedAt: vq.submitted_at,
    timeInQueueHours: hoursSince(vq.submitted_at),
    priority: vq.priority,
    reviewedBy: vq.reviewed_by,
    isClaimed: vq.is_claimed,
    canClaim: !vq.reviewed_by,  // not yet claimed by any admin
  }

totalPages = Math.ceil(ctx.result.total / limit)

Output: ctx.result.formatted = { items: QueueRowDTO[], totalPages }
```

---

### S5a / S4b: setResponse

```
====================================================================================
S5a: setResponse (LIST)
────────────────────────────────────────────────────────────────────────────────────
ctx.responseData = {
  data: ctx.result.formatted.items,
  pagination: {
    total: ctx.result.total,
    page: ctx.compiledFilter.page,
    limit: ctx.compiledFilter.limit,
    totalPages: ctx.result.formatted.totalPages,
  }
}

====================================================================================
S4b: setResponse (STATS)
────────────────────────────────────────────────────────────────────────────────────
ctx.responseData = {
  pendingTotal: ctx.result.pendingTotal,
  pendingToday: ctx.result.pendingToday,
  approvedToday: ctx.result.approvedToday,
  rejectedToday: ctx.result.rejectedToday,
  avgReviewTimeHours: Math.round(ctx.result.avgReviewTimeHours * 100) / 100,
}
```

## Dependencies

| File | Role |
|------|------|
| `common/profile/steps/permissionGate.step.ts` | Route-level role ACL |
| `common/profile/steps/buildQueueFilter.step.ts` | Queue filter assembly |
| `common/profile/steps/executeQueueListQuery.step.ts` | Queue query + COUNT |
| `common/profile/steps/executeStatsQuery.step.ts` | Stats aggregates |
| `common/profile/steps/formatQueueRows.step.ts` | Row-to-DTO transform |
| `common/profile/steps/setResponse.step.ts` | Response shape |
