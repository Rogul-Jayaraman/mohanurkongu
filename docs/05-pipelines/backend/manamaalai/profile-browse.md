# Pipeline 4: profile-browse

> **For beginners**: Search through profiles with filters (age, location,
> community, etc.). Results are paginated (cursor-based for smooth scrolling)
> and gated by your membership tier.

## Purpose

Replaces `browseProfiles()` and `getShowcaseProfiles()` in `profile.service.ts`. Implements cursor-based pagination over ACTIVE profiles with membership-gated search levels that enable/disable filter groups. Optionally resolves viewer's own profile for age-difference filtering. Returns shortlist status for each result.

## Actor & Entry

| Route | Method | Rate Limiter |
|-------|--------|-------------|
| `/profiles/browse` | GET | `browseLimiter` (60/window) |

**Allowed Roles:** `USER` (via `requireSession` middleware)
**Validation:** `browseSchema` (query params — all optional, coerce numbers, max 100 chars, UUID cursor)

## High-Level Architecture

```
  ┌─ GET /profiles/browse?cursor=X&gender=M&ageMin=22&...
  ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  ProfileController                                                    │
  │  const ctx = {                                                        │
  │    input:      req.query,                                             │
  │    accountId:  req.account.sub,                                       │
  │    roles:      req.roles,                                             │
  │    capabilities: req.capabilities,                                    │
  │    memberProfile: req.memberProfile,  // set by middleware            │
  │    membershipService: this.membershipService,                         │
  │  };                                                                    │
  │  const result = await profileBrowsePipeline(ctx);                     │
  │  sendSuccess(res, result);                                             │
  └──────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  PipelineRunner.run(steps, ctx)                                      │
  │                                                                       │
  │  ┌── S1-S4: PRE-TRANSACTION ───────────────────────────────┐        │
  │  │  S1. permissionGate                                          │        │
  │  │  S2. membershipGate (search level)                           │        │
  │  │  S3. resolveViewerProfile [CONDITIONAL: ageDiff]             │        │
  │  │  S4. buildBrowseQuery                                        │        │
  │  └─────────────────────────────────────────────────────────────┘        │
  │  ┌── S5: POST-TRANSACTION ──────────────────────────────────┐        │
  │  │  S5. executeBrowseQuery (cursor, limit, compiled)          │        │
  │  │  S6. fetchShortlistStatus (for all result profileIds)      │        │
  │  │  S7. formatProfileCard (shared response shape)             │        │
  │  │  S8. setResponse (paginated result)                        │        │
  │  └─────────────────────────────────────────────────────────────┘        │
  └─────────────────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture — Step by Step

---

### S1: permissionGate

```
====================================================================================
S1: permissionGate
────────────────────────────────────────────────────────────────────────────────────
action = 'profile:browse'

┌────────────────┬──────────────────┐
│ Action         │ Allowed Roles    │
├────────────────┼──────────────────┤
│ profile:browse │ ['USER']         │
└────────────────┴──────────────────┘

if ctx.roles does not include any allowed role
  → AppError(401, AUTH_PORTAL_MISMATCH)

Output: ctx (unaltered)
```

---

### S2: membershipGate (search level)

```
====================================================================================
S2: membershipGate (search level)
────────────────────────────────────────────────────────────────────────────────────
caps = membershipService.resolveCapabilities(ctx.accountId)
ctx.searchLevel = caps?.searchLevel ?? 'BASIC'

┌────────────┬──────────────────────────────────────────────────────────────────┐
│ Search     │ Available Filter Groups                                          │
│ Level      │                                                                  │
├────────────┼──────────────────────────────────────────────────────────────────┤
│ BASIC      │ gender, age range, age diff, text search                        │
│ EXTENDED   │ + community, caste, location (district/taluk)                    │
│ ADVANCED   │ + marital status, complexion, diet, dosham, education,           │
│            │   job sector, residence type                                     │
│ FULL       │ + height range, weight, salary range, job title, job location,   │
│            │   horoscope (rasi, nakshatra, lagnam)                            │
└────────────┴──────────────────────────────────────────────────────────────────┘

ctx.maxVisible:
  BASIC    → 30 profiles max
  EXTENDED → 100 profiles max
  ADVANCED → 500 profiles max
  FULL     → UNLIMITED

Output: ctx.searchLevel, ctx.maxVisible, ctx.queryFilters = filtered params
  (filter groups above the user's level are stripped from the query)
```

---

### S3: resolveViewerProfile [CONDITIONAL]

```
====================================================================================
S3: resolveViewerProfile
────────────────────────────────────────────────────────────────────────────────────
Only runs when ctx.input.ageDiff is present (age difference filter requested)

if ctx.memberProfile is set by middleware:
  ctx.viewerProfile = ctx.memberProfile
else:
  SELECT p.id, pb.dob, pb.gender, pb.age
  FROM profiles p
  JOIN profile_basic pb ON pb.profile_id = p.id
  WHERE p.account_id = :accountId
    AND p.current_status = 'ACTIVE'

if not found → AppError(404, PROFILE_NOT_FOUND)
  (cannot filter by age diff without own profile)

Age diff calculation:
  selfAge = viewerProfile.age
  targetAgeMin = selfAge - ageDiff.minDiff
  targetAgeMax = selfAge + ageDiff.maxDiff

Output: ctx.viewerProfile (or skipped if no ageDiff)
```

---

### S4: buildBrowseQuery

```
====================================================================================
S4: buildBrowseQuery
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.queryFilters (filtered by search level), ctx.viewerProfile, ctx.accountId

WHERE clause construction:

  ┌──────────────────────────────────────────────────────────────────────────┐
  │  p.current_status = 'ACTIVE'                                              │
  │  AND p.account_id != :accountId   -- hide own profile                     │
  │  AND (:gender IS NULL OR pb.gender = :gender)                             │
  │  AND (:ageMin IS NULL OR pb.age >= :ageMin)                               │
  │  AND (:ageMax IS NULL OR pb.age <= :ageMax)                               │
  │                                                                           │
  │  -- age diff (if viewerProfile resolved):                                 │
  │  AND pb.age BETWEEN :targetAgeMin AND :targetAgeMax                       │
  │                                                                           │
  │  -- search level EXTENDED+:                                                │
  │  AND (:communityId IS NULL OR pc.community_id = :communityId)              │
  │  AND (:casteId IS NULL OR pc.caste_id = :casteId)                         │
  │                                                                           │
  │  -- search level ADVANCED+:                                               │
  │  AND (:diet IS NULL OR pb.diet = :diet)                                    │
  │  AND (:education IS NULL OR pp.education = :education)                     │
  │                                                                           │
  │  -- search level FULL+:                                                   │
  │  AND (:salaryMin IS NULL OR pp.salary >= :salaryMin)                       │
  │  AND (:heightMin IS NULL OR pb.height_id >= :heightMinId)                  │
  │                                                                           │
  │  -- text search (if q provided):                                          │
  │  AND (t.first_name ILIKE :q OR t.last_name ILIKE :q                       │
  │       OR p.reg_no ILIKE :q)                                               │
  └──────────────────────────────────────────────────────────────────────────┘

ORDER BY:
  ┌─ sort == 'age'     → pb.age ASC
  ├─ sort == 'created' → p.created_at DESC
  └─ default           → p.created_at DESC, p.id DESC

CURSOR (keyset pagination):
  WHERE (p.created_at, p.id) < (:cursorDate, :cursorId)

LIMIT :limit + 1    -- +1 to detect hasMore

Output: ctx.compiledQuery = { whereClause, orderBy, cursor, limit }
```

---

### S5: executeBrowseQuery

```
====================================================================================
S5: executeBrowseQuery
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.compiledQuery

results = prisma.$queryRaw(SQL) or prisma.profile.findMany({
  where: compiledQuery.whereClause,
  orderBy: compiledQuery.orderBy,
  include: {
    basic: { include: { height: true, profileFor: true,
               currentLocation: { include: { district: true } } } },
    community: { include: { community: true } },
    professional: true,
    photo: { include: { primaryUpload: true } },
    translations: { where: { language: 'EN' } },
  },
  take: compiledQuery.limit + 1,
  ...cursor
})

hasMore = results.length > compiledQuery.limit
items = results.slice(0, compiledQuery.limit)

nextCursor = hasMore
  ? encodeCursor({ createdAt: items[items.length - 1].createdAt,
                   id: items[items.length - 1].id })
  : null

Output: ctx.result = { items: rawRows[], nextCursor, hasMore }
```

---

### S6: fetchShortlistStatus

```
====================================================================================
S6: fetchShortlistStatus
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.accountId, ctx.result.items (profileIds[])

if items.length == 0 → skip

Query:
  SELECT profile_id, created_at AS shortlisted_at
  FROM shortlists
  WHERE shortlisted_by_account_id = :accountId
    AND profile_id IN (:profileIds)

Map results → Set<profileId> for O(1) lookup

Output: ctx.shortlistedProfileIds = Set<string>
```

---

### S7: formatProfileCard

```
====================================================================================
S7: formatProfileCard
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.result.items (raw rows), ctx.shortlistedProfileIds

For each raw row → ProfileCardDTO:
  {
    profileId: p.id,
    regNo: p.regNo ?? '-',
    firstName: t?.firstName ?? '',
    lastName: t?.lastName ?? '',
    age: pb?.age,
    gender: pb?.gender,
    height: pb?.height?.valueCm,
    community: pc?.community?.name,
    profession: pp?.jobDetail,
    city: pb?.currentLocation?.district?.name,
    primaryPhotoUrl: ph?.primaryUpload?.url,
    isShortlisted: shortlistedProfileIds.has(p.id),
    shortlistedAt: shortlistedProfileIds.get(p.id) ?? null,
    createdAt: p.createdAt,
  }

Output: ctx.result.items = ProfileCardDTO[]
```

---

### S8: setResponse

```
====================================================================================
S8: setResponse
────────────────────────────────────────────────────────────────────────────────────
ctx.responseData = {
  profiles: ctx.result.items,
  pagination: {
    cursor: ctx.result.nextCursor,
    hasMore: ctx.result.hasMore,
    limit: ctx.compiledQuery.limit,
  }
}
```

## Dependencies

| File | Role |
|------|------|
| `common/profile/steps/permissionGate.step.ts` | Route-level role ACL |
| `common/profile/steps/membershipGate.step.ts` | Search level check |
| `common/profile/steps/resolveViewerProfile.step.ts` | Age-diff viewer profile |
| `common/profile/steps/buildBrowseQuery.step.ts` | SQL WHERE assembly |
| `common/profile/steps/executeBrowseQuery.step.ts` | Cursor query execution |
| `common/profile/steps/fetchShortlistStatus.step.ts` | Shortlist EXISTS check |
| `common/profile/helpers/formatProfileCard.ts` | Response shape |
| `common/profile/steps/setResponse.step.ts` | Pagination wrapper |
