# Pipeline 12: profile-showcase

> **For beginners**: Shows a curated selection of profiles on the landing
> page. No login required. Two sets: recently updated and premium profiles.

## Purpose

Replaces `getShowcaseProfiles()` in `profile.service.ts`. A public read-only pipeline that returns the 5 most recently created ACTIVE profiles for each gender (FEMALE, MALE). No authentication required. Minimal JOINs — only photo and translation data needed for the carousel card.

## Actor & Entry

| Route | Method | Rate Limiter |
|-------|--------|-------------|
| `/profiles/showcase` | GET | `showcaseLimiter` (30/window) |

**Authentication:** NONE (public endpoint)
**Allowed Roles:** `PUBLIC` (no session required)

## High-Level Architecture

```
  ┌─ GET /profiles/showcase
  ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  ProfileController                                                    │
  │  const ctx = {                                                        │
  │    input:     {},  // no params needed                                │
  │    accountId: undefined,  // no auth                                  │
  │  };                                                                    │
  │  const result = await profileShowcasePipeline(ctx);                   │
  │  sendSuccess(res, result);                                             │
  └──────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  PipelineRunner.run(steps, ctx)                                      │
  │                                                                       │
  │  ┌── S1: executeShowcaseQuery ──────────────────────────────┐       │
  │  │  Two parallel queries (FEMALE, MALE), each LIMIT 5,       │       │
  │  │  ACTIVE only, ORDER BY created_at DESC                    │       │
  │  └───────────────────────────────────────────────────────────┘       │
  │  ┌── S2: formatShowcaseCards ───────────────────────────────┐       │
  │  │  Map raw rows → ShowcaseCardDTO (minimal card shape)      │       │
  │  └───────────────────────────────────────────────────────────┘       │
  │  ┌── S3: setResponse ───────────────────────────────────────┐       │
  │  │  { brides: ShowcaseCardDTO[], grooms: ShowcaseCardDTO[] } │       │
  │  └───────────────────────────────────────────────────────────┘       │
  └────────────────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture — Step by Step

---

### S1: executeShowcaseQuery

```
====================================================================================
S1: executeShowcaseQuery
────────────────────────────────────────────────────────────────────────────────────
No authentication, no permission gate, no transaction.

Two queries run in parallel via Promise.all:

  -- Brides (FEMALE):
  SELECT p.id, p.reg_no, p.created_at,
         pb.gender, pb.age,
         t.first_name, t.last_name,
         up.url AS primary_photo_url
  FROM profiles p
  JOIN profile_basic pb ON pb.profile_id = p.id AND pb.gender = 'FEMALE'
  LEFT JOIN profile_translations t ON t.profile_id = p.id AND t.language = 'EN'
  LEFT JOIN profile_photos ph ON ph.profile_id = p.id
  LEFT JOIN uploads up ON up.id = ph.primary_upload_id
  WHERE p.current_status = 'ACTIVE'
  ORDER BY p.created_at DESC
  LIMIT 5

  -- Grooms (MALE):
  ... same query with pb.gender = 'MALE'

if 0 results for a gender → empty array (no error)

Output: ctx.brides = rawRows[], ctx.grooms = rawRows[]
```

---

### S2: formatShowcaseCards

```
====================================================================================
S2: formatShowcaseCards
────────────────────────────────────────────────────────────────────────────────────
For each raw row → ShowcaseCardDTO:
  {
    profileId: p.id,
    regNo: p.regNo ?? '-',
    firstName: t?.firstName ?? '',
    lastName: t?.lastName ?? '',
    age: pb.age,
    gender: pb.gender,
    primaryPhotoUrl: up?.url,
    createdAt: p.created_at,
  }

Output: ctx.formatted = { brides: ShowcaseCardDTO[], grooms: ShowcaseCardDTO[] }
```

---

### S3: setResponse

```
====================================================================================
S3: setResponse
────────────────────────────────────────────────────────────────────────────────────
ctx.responseData = {
  brides: ctx.formatted.brides,
  grooms: ctx.formatted.grooms,
}
```

## Dependencies

| File | Role |
|------|------|
| `common/profile/steps/executeShowcaseQuery.step.ts` | Two parallel LIMIT-5 queries |
| `common/profile/steps/formatShowcaseCards.step.ts` | Card DTO transform |
| `common/profile/steps/setResponse.step.ts` | Response shape |
