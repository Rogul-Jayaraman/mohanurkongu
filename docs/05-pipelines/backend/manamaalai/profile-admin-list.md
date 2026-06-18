# Pipeline 6: profile-admin-list

> **For beginners**: Admins view all profiles in a table with filters, search,
> and pagination. Shows details users can't see (status history, review notes).

## Purpose

Replaces `listProfiles()` and `getProfileDetail()` in `admin-profiles.service.ts`. Provides admin-facing profile browsing with offset-based pagination, advanced filters (status, search, registration number, community), and full-detail view with audit history (no field gating).

## Actor & Entry

| Route | Method | mode | Rate Limiter |
|-------|--------|------|-------------|
| `/admin/profiles` | GET | `list` | None |
| `/admin/profiles/:id` | GET | `detail` | None |

**Allowed Roles:** `ADMIN` (via `requireSession` + `requireRole('ADMIN')` middleware)

## High-Level Architecture

```
  ┌─ GET /admin/profiles?page=1&limit=20&status=ACTIVE&search=...
  │  GET /admin/profiles/:id
  ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  AdminProfilesController                                              │
  │  const ctx = {                                                        │
  │    input:     { ...req.query, profileId: req.params.id },            │
  │    accountId: req.account.sub,                                       │
  │    roles:     req.roles,                                             │
  │    mode:      req.params.id ? 'detail' : 'list',                     │
  │  };                                                                    │
  │  const result = await profileAdminListPipeline(ctx);                 │
  │  sendSuccess(res, result);                                            │
  └──────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  PipelineRunner.run(steps, ctx)                                      │
  │                                                                       │
  │  ┌── S1: PRE-TRANSACTION ──────────────────────────────────┐        │
  │  │  S1. permissionGate                                       │        │
  │  │                                                           │        │
  │  │  list mode:                     detail mode:               │        │
  │  │  S2a. buildListFilter(          S2b. resolveProfile(      │        │
  │  │    query, roles)                    id, ANY, ADMIN)       │        │
  │  └───────────────────────────────────────────────────────────┘        │
  │  ┌── POST-TRANSACTION ────────────────────────────────────┐          │
  │  │  S3a. executeListQuery(offset, compiledFilter)           │          │
  │  │  S3b. loadFullDetail(profileId, includeAudit: true)      │          │
  │  │  S4a. formatAdminTable(rows)                             │          │
  │  │  S5a/ S4b. setResponse()                                 │          │
  │  └──────────────────────────────────────────────────────────┘          │
  └────────────────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture — Step by Step

---

### S1: permissionGate

```
====================================================================================
S1: permissionGate
────────────────────────────────────────────────────────────────────────────────────
action = (ctx.mode == 'list') ? 'profile:admin-list' : 'profile:admin-detail'

┌───────────────────┬─────────────────────┐
│ Action            │ Allowed Roles       │
├───────────────────┼─────────────────────┤
│ profile:admin-list    │ ['ADMIN'] │
│ profile:admin-detail  │ ['ADMIN'] │
└───────────────────┴─────────────────────┘

if ctx.roles does not include any allowed role
  → AppError(401, AUTH_PORTAL_MISMATCH)

Output: ctx (unaltered)
```

---

### S2a: buildListFilter (LIST mode)

```
====================================================================================
S2a: buildListFilter
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.input.{ page, limit, status, search, regNo, communityId,
                   createdAtFrom, createdAtTo }

WHERE clause construction:

  ┌──────────────────────────────────────────────────────────────────┐
  │  WHERE 1=1                                                        │
  │  AND (:status IS NULL OR p.current_status = :status)               │
  │  AND (:regNo IS NULL OR p.reg_no ILIKE :regNo)                    │
  │  AND (:communityId IS NULL OR pc.community_id = :communityId)     │
  │  AND (:createdAtFrom IS NULL OR p.created_at >= :createdAtFrom)   │
  │  AND (:createdAtTo IS NULL OR p.created_at <= :createdAtTo)       │
  │  AND (:search IS NULL OR (                                         │
  │    t.first_name ILIKE :search OR                                   │
  │    t.last_name ILIKE :search OR                                    │
  │    p.reg_no ILIKE :search                                          │
  │  ))                                                                │
  └──────────────────────────────────────────────────────────────────┘

ORDER BY:
  ┌─ sort == 'created' → p.created_at DESC
  ├─ sort == 'updated' → p.updated_at DESC
  ├─ sort == 'regNo'   → p.reg_no ASC
  └─ default           → p.updated_at DESC

Pagination: offset = (page - 1) * limit, limit = clamp(limit, 1, 100)
  default: page=1, limit=20

Output: ctx.compiledFilter = { whereClause, orderBy, offset, limit }
```

---

### S2b: resolveProfile (DETAIL mode)

```
====================================================================================
S2b: resolveProfile (DETAIL)
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.input.profileId

Query:
  SELECT * FROM profiles WHERE id = :profileId

if not found → AppError(404, PROFILE_NOT_FOUND)
No status restriction — ADMIN can view any status except DELETED

Output: ctx.profile = { id, status, accountId, regNo, ... }
```

---

### S3a: executeListQuery (LIST mode)

```
====================================================================================
S3a: executeListQuery
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.compiledFilter

Main query:
  SELECT p.*, pb.*, pc.*, t.first_name, t.last_name,
         ph.primary_upload_id, up.url AS photo_url,
         a.email, a.phone
  FROM profiles p
  JOIN profile_basic pb ON pb.profile_id = p.id
  LEFT JOIN profile_communities pc ON pc.profile_id = p.id
  LEFT JOIN profile_translations t ON t.profile_id = p.id AND t.language = 'EN'
  LEFT JOIN profile_photos ph ON ph.profile_id = p.id
  LEFT JOIN uploads up ON up.id = ph.primary_upload_id
  LEFT JOIN accounts a ON a.id = p.account_id
  WHERE <compiledFilter.whereClause>
  ORDER BY <compiledFilter.orderBy>
  OFFSET :offset LIMIT :limit

Count query (same filters, no pagination):
  SELECT COUNT(*) FROM profiles p
  JOIN profile_basic pb ON pb.profile_id = p.id
  LEFT JOIN profile_communities pc ON pc.profile_id = p.id
  LEFT JOIN profile_translations t ON t.profile_id = p.id AND t.language = 'EN'
  WHERE <compiledFilter.whereClause>

Output: ctx.result = { items: rawRows[], total: number, page, limit }
```

---

### S3b: loadFullDetail (DETAIL mode)

```
====================================================================================
S3b: loadFullDetail
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.profileId

Query set (same as profile-view S3 + audit trail):
  — FULL profile with all JOINs (no gating)
  — No field restrictions — admin sees everything including contact info

PLUS audit trail:
  SELECT * FROM profile_state_history
  WHERE profile_id = :profileId
  ORDER BY created_at DESC
  LIMIT 50

  SELECT * FROM profile_reviews
  WHERE profile_id = :profileId
  ORDER BY created_at DESC
  LIMIT 10

  SELECT * FROM verification_queue
  WHERE profile_id = :profileId

Output: ctx.responseData = {
  profile: FullProfileDTO (all fields, no gating),
  audit: ProfileStateHistory[],
  reviews: ProfileReview[],
  queue: VerificationQueue | null,
}
```

---

### S4a: formatAdminTable (LIST mode)

```
====================================================================================
S4a: formatAdminTable
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.result.items (raw rows)

For each row → AdminTableRowDTO:
  {
    profileId, regNo,
    fullName: t ? `${t.first_name} ${t.last_name}` : '-',
    gender: pb.gender,
    age: pb.age,
    community: pc?.community?.name ?? '-',
    status: p.current_status,
    primaryPhotoUrl: up?.url,
    email: a.email,
    phone: a.phone,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }

totalPages = Math.ceil(ctx.result.total / ctx.compiledFilter.limit)

Output: ctx.result.formatted = { items: AdminTableRowDTO[], totalPages }
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
S4b: setResponse (DETAIL)
────────────────────────────────────────────────────────────────────────────────────
ctx.responseData = {
  profile: ctx.responseData.profile,
  audit: ctx.responseData.audit,
  reviews: ctx.responseData.reviews,
  queue: ctx.responseData.queue,
}
```

## Dependencies

| File | Role |
|------|------|
| `common/profile/steps/permissionGate.step.ts` | Route-level role ACL |
| `common/profile/steps/buildListFilter.step.ts` | Admin filter assembly |
| `common/profile/steps/resolveProfile.step.ts` | Profile lookup (detail) |
| `common/profile/steps/executeListQuery.step.ts` | Admin query + COUNT |
| `common/profile/steps/loadFullDetail.step.ts` | Full JOIN + audit trail |
| `common/profile/steps/formatAdminTable.step.ts` | Row-to-DTO transform |
| `common/profile/steps/setResponse.step.ts` | Response shape |
