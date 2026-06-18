# Pipeline 13: profile-my-profiles

> **For beginners**: Lists your own profiles with their current status and
> basic stats. If you've created multiple drafts, you'll see them all here.

## Purpose

Replaces `getMyProfiles()` in `profile.service.ts`. Returns all non-deleted profiles for the authenticated user. Supports optional client-side text search on first name, last name (EN/TA), and registration number. Returns card-shaped results with status indicators for each profile.

## Actor & Entry

| Route | Method | Rate Limiter |
|-------|--------|-------------|
| `/profiles/my-profiles` | GET | `defaultLimiter` (30/window) |

**Allowed Roles:** `USER` (via `requireSession` middleware)
**Validation:** Optional query param `q` (string, max 100 chars)

## High-Level Architecture

```
  ┌─ GET /profiles/my-profiles?q=john
  ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  ProfileController                                                    │
  │  const ctx = {                                                        │
  │    input:     { q: req.query.q },                                     │
  │    accountId: req.account.sub,                                        │
  │    roles:     req.roles,                                              │
  │  };                                                                    │
  │  const result = await profileMyProfilesPipeline(ctx);                 │
  │  sendSuccess(res, result);                                             │
  └──────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  PipelineRunner.run(steps, ctx)                                      │
  │                                                                       │
  │  ┌── S1-S2: PRE-TRANSACTION ───────────────────────────────┐        │
  │  │  S1. permissionGate                                           │        │
  │  │  S2. executeMyProfilesQuery(accountId)                        │        │
  │  └───────────────────────────────────────────────────────────────┘        │
  │  ┌── S3-S4: POST-TRANSACTION ──────────────────────────────┐          │
  │  │  S3. clientFilter(q?) — optional text search              │          │
  │  │  S4. formatMyProfileCard                                  │          │
  │  │  S5. setResponse                                          │          │
  │  └────────────────────────────────────────────────────────────┘          │
  └──────────────────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture — Step by Step

---

### S1: permissionGate

```
====================================================================================
S1: permissionGate
────────────────────────────────────────────────────────────────────────────────────
action = 'profile:my-profiles'

┌──────────────────┬──────────────────┐
│ Action           │ Allowed Roles    │
├──────────────────┼──────────────────┤
│ profile:my-profiles │ ['USER']          │
└──────────────────┴──────────────────┘

if ctx.roles does not include any allowed role
  → AppError(401, AUTH_PORTAL_MISMATCH)

Output: ctx (unaltered)
```

---

### S2: executeMyProfilesQuery

```
====================================================================================
S2: executeMyProfilesQuery
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.accountId

Query via ProfileRepository.findAllByAccountId(accountId):

  SELECT p.id, p.reg_no, p.current_status, p.created_at, p.updated_at,
         pb.gender, pb.dob, pb.diet, pb.age,
         pf.name AS profile_for,
         h.value_cm AS height,
         cd.name AS current_district, td.name AS current_taluk,
         nd.name AS native_district, nt.name AS native_taluk,
         c.name AS community,
         pp.education, pp.job_detail,
         up.url AS primary_photo_url,
         t_en.first_name AS first_name_en, t_en.last_name AS last_name_en,
         t_ta.first_name AS first_name_ta, t_ta.last_name AS last_name_ta
  FROM profiles p
  JOIN profile_basic pb ON pb.profile_id = p.id
  LEFT JOIN profile_fors pf ON pf.id = pb.profile_for_id
  LEFT JOIN heights h ON h.id = pb.height_id
  LEFT JOIN locations cl ON cl.id = pb.current_location_id
  LEFT JOIN districts cd ON cd.id = cl.district_id
  LEFT JOIN taluks td ON td.id = cl.taluk_id
  LEFT JOIN locations nl ON nl.id = pb.native_location_id
  LEFT JOIN districts nd ON nd.id = nl.district_id
  LEFT JOIN taluks nt ON nt.id = nl.taluk_id
  LEFT JOIN profile_communities pc ON pc.profile_id = p.id
  LEFT JOIN communities c ON c.id = pc.community_id
  LEFT JOIN profile_professionals pp ON pp.profile_id = p.id
  LEFT JOIN profile_photos ph ON ph.profile_id = p.id
  LEFT JOIN uploads up ON up.id = ph.primary_upload_id
  LEFT JOIN profile_translations t_en ON t_en.profile_id = p.id AND t_en.language = 'EN'
  LEFT JOIN profile_translations t_ta ON t_ta.profile_id = p.id AND t_ta.language = 'TA'
  WHERE p.account_id = :accountId
    AND p.current_status != 'DELETED'
  ORDER BY p.updated_at DESC

Output: ctx.rawProfiles = rawRows[]  (all non-deleted profiles for this account)
```

---

### S3: clientFilter

```
====================================================================================
S3: clientFilter (optional text search)
────────────────────────────────────────────────────────────────────────────────────
Only runs when ctx.input.q is provided and non-empty.

query = ctx.input.q.toLowerCase().trim()

For each profile in ctx.rawProfiles:
  searchableText = [
    row.first_name_en,
    row.last_name_en,
    row.first_name_ta,
    row.last_name_ta,
    row.reg_no,
  ].filter(Boolean).join(' ').toLowerCase()

  if searchableText.includes(query) → keep
  else → filter out

Output: ctx.rawProfiles = filteredRows[]
```

---

### S4: formatMyProfileCard

```
====================================================================================
S4: formatMyProfileCard
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.rawProfiles (filtered)

For each row → MyProfileCardDTO:
  {
    id: p.id,
    regNo: p.reg_no ?? '-',
    status: p.current_status,
    isOwner: true,
    firstNameEn: t_en?.first_name ?? '',
    lastNameEn: t_en?.last_name ?? '',
    firstNameTa: t_ta?.first_name ?? '',
    lastNameTa: t_ta?.last_name ?? '',
    name: buildDisplayName(t_en, t_ta),
    gender: pb.gender,
    dob: pb.dob,
    age: pb.age,
    diet: pb.diet,
    height: h?.value_cm,
    profileFor: pf?.name,
    community: c?.name,
    education: pp?.education,
    jobDetail: pp?.job_detail,
    currentDistrict: cd?.name,
    currentTaluk: td?.name,
    nativeDistrict: nd?.name,
    nativeTaluk: nt?.name,
    primaryPhotoUrl: up?.url,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }

buildDisplayName logic:
  ┌─ t_en.first_name exists → t_en.first_name + ' ' + t_en.last_name
  ├─ t_ta.first_name exists → t_ta.first_name + ' ' + t_ta.last_name
  └─ neither → '-'

Output: ctx.formattedProfiles = MyProfileCardDTO[]
```

---

### S5: setResponse

```
====================================================================================
S5: setResponse
────────────────────────────────────────────────────────────────────────────────────
ctx.responseData = ctx.formattedProfiles
  (returns a flat array, not paginated)
```

## Dependencies

| File | Role |
|------|------|
| `common/profile/steps/permissionGate.step.ts` | Route-level role ACL |
| `common/profile/steps/executeMyProfilesQuery.step.ts` | accountId-based query |
| `common/profile/steps/clientFilter.step.ts` | Client-side text search |
| `common/profile/steps/formatMyProfileCard.step.ts` | Card DTO transform |
| `common/profile/steps/setResponse.step.ts` | Response shape |
| `modules/profile/profile.repository.ts` | findAllByAccountId |
