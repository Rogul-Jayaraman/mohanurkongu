# Pipeline 5: profile-shortlist

> **For beginners**: Save profiles you're interested in (like bookmarking).
> Also lists your shortlisted profiles. Each add counts toward your
> membership's daily shortlist limit.

## Purpose

Replaces `toggleShortlist()` and `fetchShortlisted()` in `profile.service.ts`. Two sub-flows: toggle adds/removes a profile from the viewer's shortlist with membership quota check on add; list fetches the viewer's shortlisted profiles with cursor-based pagination, reusing the shared `formatProfileCard` helper from browse.

## Actor & Entry

| Route | Method | action | Rate Limiter |
|-------|--------|--------|-------------|
| `/profiles/:id/shortlist` | POST | `toggle` | `shortlistLimiter` (30/window) |
| `/profiles/shortlisted` | GET | `list` | `defaultLimiter` (30/window) |

**Allowed Roles:** `USER` (via `requireSession` middleware)
**Validation:** `profileIdParamSchema` (UUID params) + `toggleShortlistSchema` (`{ action: 'add' | 'remove' }`)

## High-Level Architecture

```
  ┌─ POST /profiles/:id/shortlist  → action = 'toggle'
  │  GET  /profiles/shortlisted    → action = 'list'
  ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  ProfileController                                                    │
  │  const ctx = {                                                        │
  │    input:      { profileId: req.params.id, action: req.body.action,  │
  │                  cursor: req.query.cursor, limit: req.query.limit },  │
  │    accountId:  req.account.sub,                                       │
  │    roles:      req.roles,                                             │
  │    capabilities: req.capabilities,                                    │
  │    action:     req.path.includes('/shortlisted') ? 'list' : 'toggle', │
  │  };                                                                    │
  │  const result = await profileShortlistPipeline(ctx);                  │
  │  sendSuccess(res, result);                                             │
  └──────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  PipelineRunner.run(steps, ctx)                                      │
  │                                                                       │
  │  ┌── S1-S4a: PRE-TRANSACTION ───────────────────────────────┐       │
  │  │  S1. permissionGate                                          │       │
  │  │                                                              │       │
  │  │  toggle flow:               list flow:                       │       │
  │  │  S2a. resolveProfile(       S2b. (none — uses accountId)     │       │
  │  │    id,['ACTIVE'], ANY)                                       │       │
  │  │  S3a. checkExistingShortlist                                 │       │
  │  │  S4a. membershipGate(                                        │       │
  │  │    shortlist-limit) — add only                               │       │
  │  └──────────────────────────────────────────────────────────────┘       │
  │  ┌── S5: TRANSACTION (toggle only) ────────────────────────────┐      │
  │  │  S5a. toggleShortlistRow (INSERT or DELETE)                   │      │
  │  └──────────────────────────────────────────────────────────────┘      │
  │  ┌── S6-S8: POST-TRANSACTION ──────────────────────────────┐        │
  │  │  toggle:                            list:                  │        │
  │  │  S6a. setResponse(isShortlisted)    S6b. executeListQuery() │        │
  │  │                                     S7b. formatProfileCard │        │
  │  │                                     S8b. setResponse()     │        │
  │  └─────────────────────────────────────────────────────────────┘        │
  └──────────────────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture — Step by Step

---

### S1: permissionGate

```
====================================================================================
S1: permissionGate
────────────────────────────────────────────────────────────────────────────────────
action = (ctx.action == 'toggle') ? 'profile:shortlist' : 'profile:shortlist-list'

┌───────────────────┬──────────────────┐
│ Action            │ Allowed Roles    │
├───────────────────┼──────────────────┤
│ profile:shortlist     │ ['USER']      │
│ profile:shortlist-list│ ['USER']      │
└───────────────────┴──────────────────┘

if ctx.roles does not include any allowed role
  → AppError(401, AUTH_PORTAL_MISMATCH)

Output: ctx (unaltered)
```

---

### S2a: resolveProfile (TOGGLE only)

```
====================================================================================
S2a: resolveProfile (TOGGLE)
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.input.profileId, ctx.accountId (to check not own profile)

Query:
  SELECT p.id, p.current_status, p.account_id
  FROM profiles p
  WHERE p.id = :profileId

if not found → AppError(404, PROFILE_NOT_FOUND)
if current_status != 'ACTIVE' → AppError(400, PROFILE_NOT_ACTIVE)
if account_id == ctx.accountId → AppError(400, CANNOT_SHORTLIST_OWN_PROFILE)

Check account not SUSPENDED:
  SELECT status FROM accounts WHERE id = :profile.account_id

if status == 'SUSPENDED' → AppError(400, ACCOUNT_SUSPENDED)

Output: ctx.profile = { id, status: 'ACTIVE', accountId }
```

---

### S3a: checkExistingShortlist (TOGGLE only)

```
====================================================================================
S3a: checkExistingShortlist
────────────────────────────────────────────────────────────────────────────────────
Query:
  SELECT id, created_at
  FROM shortlists
  WHERE profile_id = :profileId AND shortlisted_by_account_id = :accountId

┌─ existingShortlist found → mode = 'REMOVE'
│  ctx.existingShortlistId = row.id
│  ctx.shortlistedAt = row.created_at
│  → SKIP membershipGate (no quota needed for remove)
│
└─ not found → mode = 'ADD'
   → CONTINUE to membershipGate

Output: ctx.mode, ctx.existingShortlistId?
```

---

### S4a: membershipGate (shortlist limit)

```
====================================================================================
S4a: membershipGate (shortlist limit)
────────────────────────────────────────────────────────────────────────────────────
Only runs when ctx.mode == 'ADD' (removing doesn't consume quota)

if ctx.capabilities == null
  OR ctx.capabilities.shortlistLimit < 0
  → skip (unlimited)

Query:
  SELECT COUNT(*) FROM shortlists
  WHERE shortlisted_by_account_id = :accountId

if count >= ctx.capabilities.shortlistLimit
  → AppError(403, MEMBERSHIP_SHORTLIST_LIMIT_REACHED)

Output: ctx.remainingShortlist = limit - count
```

---

### S5a: toggleShortlistRow [TOGGLE only, inside $transaction]

```
====================================================================================
S5a: toggleShortlistRow
────────────────────────────────────────────────────────────────────────────────────
┌─ mode == 'ADD' ───────────────────────────────────────────────────────┐
│  INSERT INTO shortlists (profile_id, shortlisted_by_account_id)        │
│  VALUES (:profileId, :accountId)                                       │
│                                                                         │
│  ctx.isShortlisted = true                                               │
│  ctx.shortlistedAt = NOW()                                              │
└────────────────────────────────────────────────────────────────────────┘
┌─ mode == 'REMOVE' ─────────────────────────────────────────────────────┐
│  DELETE FROM shortlists                                                 │
│  WHERE id = :existingShortlistId                                        │
│                                                                         │
│  ctx.isShortlisted = false                                              │
│  ctx.shortlistedAt = null                                               │
└────────────────────────────────────────────────────────────────────────┘
```

---

### S6b: executeListQuery (LIST only)

```
====================================================================================
S6b: executeListQuery
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.accountId, ctx.input.cursor, ctx.input.limit (default 20)

Query:
  SELECT p.id, p.reg_no, p.created_at,
         pb.*, pc.*, pp.*, ph.*, t.first_name, t.last_name,
         s.created_at AS shortlisted_at
  FROM shortlists s
  JOIN profiles p ON p.id = s.profile_id
  JOIN profile_basic pb ON pb.profile_id = p.id
  LEFT JOIN profile_communities pc ON pc.profile_id = p.id
  LEFT JOIN profile_professionals pp ON pp.profile_id = p.id
  LEFT JOIN profile_photos ph ON ph.profile_id = p.id
  LEFT JOIN profile_translations t ON t.profile_id = p.id AND t.language = 'EN'
  WHERE s.shortlisted_by_account_id = :accountId
    AND p.current_status = 'ACTIVE'

  ORDER BY s.created_at DESC

  CURSOR: WHERE (s.created_at, s.id) < (:cursorDate, :cursorId)
  LIMIT :limit + 1

hasMore = results.length > limit
items = results.slice(0, limit)
nextCursor = hasMore ? encodeCursor({ ... }) : null

Output: ctx.result = { items, nextCursor, hasMore }
```

---

### S7b: formatProfileCard (LIST only)

```
====================================================================================
S7b: formatProfileCard
────────────────────────────────────────────────────────────────────────────────────
Same shared formatter as browse (Pipeline 4, S7):

For each raw row → ProfileCardDTO:
  {
    profileId, regNo, firstName, lastName, age, gender, height,
    community, profession, city, primaryPhotoUrl,
    isShortlisted: true,
    shortlistedAt: s.shortlisted_at,
    createdAt: p.created_at,
  }

Output: ctx.result.items = ProfileCardDTO[]
```

---

### S6a / S8b: setResponse

```
====================================================================================
S6a: setResponse (TOGGLE)
────────────────────────────────────────────────────────────────────────────────────
ctx.responseData = {
  profileId: ctx.input.profileId,
  isShortlisted: ctx.isShortlisted,
  shortlistedAt: ctx.shortlistedAt,
  totalCount: ctx.remainingShortlist ?? undefined,
}

====================================================================================
S8b: setResponse (LIST)
────────────────────────────────────────────────────────────────────────────────────
ctx.responseData = {
  profiles: ctx.result.items,
  pagination: {
    cursor: ctx.result.nextCursor,
    hasMore: ctx.result.hasMore,
    limit: ctx.input.limit ?? 20,
  }
}
```

## Dependencies

| File | Role |
|------|------|
| `common/profile/steps/permissionGate.step.ts` | Route-level role ACL |
| `common/profile/steps/resolveProfile.step.ts` | Profile existence + status |
| `common/profile/steps/checkExistingShortlist.step.ts` | Dupe check |
| `common/profile/steps/membershipGate.step.ts` | Shortlist limit check |
| `common/profile/steps/toggleShortlistRow.step.ts` | INSERT/DELETE shortlist |
| `common/profile/steps/executeListQuery.step.ts` | Shortlisted profiles query |
| `common/profile/helpers/formatProfileCard.ts` | Card DTO transform |
| `common/profile/steps/setResponse.step.ts` | Response shape |
