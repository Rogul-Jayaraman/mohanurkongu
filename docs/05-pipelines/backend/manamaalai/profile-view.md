# Pipeline 3: profile-view

> **For beginners**: View someone's profile. What you see depends on your
> role (owner sees everything, others see limited fields based on membership
> tier). Each view counts toward your daily quota.

## Purpose

Replaces `getProfile()` in `profile.service.ts`. Returns full profile detail for a single profile with role-based field gating. Determines viewer role (OWNER, ADMIN, PUBLIC) and applies `viewDetails` membership tier gating for non-owner viewers. Non-owner public viewers also consume open quota.

## Actor & Entry

| Route | Method | Rate Limiter |
|-------|--------|-------------|
| `/profiles/:id` | GET | `defaultLimiter` (30/window) |

**Allowed Roles:** `USER`, `ADMIN` (via `requireSession` middleware)

## High-Level Architecture

```
  ┌─ GET /profiles/:id
  ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  ProfileController                                                    │
  │  const ctx = {                                                        │
  │    input:      { profileId: req.params.id },                          │
  │    accountId:  req.account.sub,                                       │
  │    roles:      req.roles,                                             │
  │    capabilities: req.capabilities,                                    │
  │    membershipService: this.membershipService,                         │
  │  };                                                                    │
  │  const result = await profileViewPipeline(ctx);                       │
  │  sendSuccess(res, result.responseData);                                │
  └──────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  PipelineRunner.run(steps, ctx)                                      │
  │                                                                       │
  │  ┌── S1-S5b: PRE-TRANSACTION ───────────────────────────────┐       │
  │  │  S1. permissionGate                                          │       │
  │  │  S2. validateIdFormat(UUID)                                 │       │
  │  │  S3. resolveProfile (full detail)                            │       │
  │  │  S4. visibilityCheck (role + status matrix)                  │       │
  │  │  S5a. membershipGate (open quota) — non-owner only           │       │
  │  └────────────────────────────────────────────────────────────┘       │
  │  ┌── S5b: INSIDE $transaction ──────────────────────────────────┐   │
  │  │  consumeOpenQuota — non-owner USER only                       │   │
  │  └───────────────────────────────────────────────────────────────────┘ │
  │  ┌── S6-S7: POST-TRANSACTION ──────────────────────────────────┐   │
  │  │  S6. applyFieldGating (viewDetails + role)                  │   │
  │  │  S7. setResponse                                            │   │
  │  └─────────────────────────────────────────────────────────────┘   │
  └──────────────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture — Step by Step

---

### S1: permissionGate

```
====================================================================================
S1: permissionGate
────────────────────────────────────────────────────────────────────────────────────
action = 'profile:view'

┌──────────────┬─────────────────────────┐
│ Action       │ Allowed Roles           │
├──────────────┼─────────────────────────┤
│ profile:view │ ['USER','ADMIN'] │
└──────────────┴─────────────────────────┘

if ctx.roles does not include any allowed role
  → AppError(401, AUTH_PORTAL_MISMATCH)

Output: ctx (unaltered)
```

---

### S2: validateIdFormat

```
====================================================================================
S2: validateIdFormat
────────────────────────────────────────────────────────────────────────────────────
UUID regex: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

if ctx.input.profileId does NOT match UUID pattern
  → AppError(404, PROFILE_NOT_FOUND)

Output: ctx (unaltered)
```

---

### S3: resolveProfile (full detail)

```
====================================================================================
S3: resolveProfile (full detail)
────────────────────────────────────────────────────────────────────────────────────
Query via ProfileRepository.findFullWithDetails(profileId):

  prisma.profile.findUnique({
    where: { id: profileId },
    include: {
      basic: { include: { profileFor: true, height: true,
                 currentLocation: { include: { district: true, taluk: true } },
                 nativeLocation: { include: { district: true, taluk: true } } } },
      community: { include: { community: true, caste: true, kulam: true } },
      professional: { include: { jobSector: true } },
      family: true,
      horoscope: { include: { rasi: true, nakshatra: true, lagna: true,
                     rasiChart: true, navamsaChart: true } },
      assets: true,
      partnerPreference: { include: { heightMin: true, heightMax: true } },
      translations: true,
      photo: { include: { primaryUpload: true,
                 gallery: { include: { upload: true } } } },
      account: { include: { credential: true } }  // for email/phone
    }
  })

if not found → AppError(404, PROFILE_NOT_FOUND)

Output: ctx.profile = fullProfile (all JOINs resolved)
```

---

### S4: visibilityCheck

```
====================================================================================
S4: visibilityCheck
────────────────────────────────────────────────────────────────────────────────────
owner = (ctx.profile.accountId == ctx.accountId)
isAdmin = ctx.roles.includes('ADMIN')

┌──────────────────────┬────────────┬──────────────────────────────────┐
│ Status               │ Owner      │ Non-owner                        │
├──────────────────────┼────────────┼──────────────────────────────────┤
│ DRAFT                │ visible    │ 404                              │
│ PENDING              │ visible    │ 404                              │
│ ACTIVE               │ visible    │ visible                          │
│ ARCHIVED             │ visible    │ 404                              │
│ REJECTED             │ visible    │ 404                              │
│ DELETED              │ 404        │ 404                              │
│ SUSPENDED account    │ visible    │ 404                              │
└──────────────────────┴────────────┴──────────────────────────────────┘

ADMIN override: all statuses visible (except DELETED)

if not visible → AppError(404, PROFILE_NOT_FOUND)

Output: ctx.isOwner = owner, ctx.viewerRole = isAdmin ? 'ADMIN' : (owner ? 'OWNER' : 'PUBLIC')
```

---

### S5a: membershipGate (open quota) — non-owner USER only

```
====================================================================================
S5a: membershipGate (open quota)
────────────────────────────────────────────────────────────────────────────────────
Only runs when ctx.viewerRole == 'PUBLIC' (non-owner, non-admin)

Query:
  caps = membershipService.resolveCapabilities(ctx.accountId)
  → returns CapabilitySnapshot { openProfileCount, openRemaining, viewDetails, ... }

  if caps && caps.openLimit >= 0 && caps.openRemaining <= 0
    → AppError(403, MEMBERSHIP_QUOTA_EXCEEDED)

  ctx.caps = caps
  ctx.viewDetails = caps?.viewDetails ?? 'BASIC'

Output: ctx.caps, ctx.viewDetails
```

---

### S5b: consumeOpenQuota [INSIDE $transaction]

```
====================================================================================
S5b: consumeOpenQuota (non-owner USER only)
────────────────────────────────────────────────────────────────────────────────────
Only runs when ctx.viewerRole == 'PUBLIC'

Query (dedup check):
  SELECT * FROM profile_opens
  WHERE viewer_account_id = :accountId AND profile_id = :profileId

if exists → skip (already viewed, no double charge)

Query (subscription check):
  SELECT * FROM membership_subscriptions
  WHERE account_id = :accountId AND is_active = true

if no subscription → skip (free user, no usage tracking)

WRITE:
  INSERT INTO profile_opens (viewer_account_id, profile_id, subscription_id)
  VALUES (:accountId, :profileId, :subscriptionId)

WRITE:
  UPSERT membership_usage (account_id) SET open_used = open_used + 1
```

---

### S6: applyFieldGating

```
====================================================================================
S6: applyFieldGating
────────────────────────────────────────────────────────────────────────────────────
levels = ['BASIC','EXTENDED','ADVANCED','FULL']
viewDetails = ctx.viewDetails  // default 'BASIC'

vd(lvl) = levels.indexOf(viewDetails) >= levels.indexOf(lvl)

if ctx.viewerRole == 'OWNER' || ctx.viewerRole == 'ADMIN':
  → no gating applied (all fields visible)
  Output: ctx (unaltered)

else:
  ┌─────────────────────┬──────────┬──────────┬──────────┬──────┐
  │ Field               │ BASIC    │ EXTENDED │ ADVANCED │ FULL │
  ├─────────────────────┼──────────┼──────────┼──────────┼──────┤
  │ professional.*      │ hidden   │ visible  │ visible  │ visible │
  │ family.*            │ hidden   │ visible  │ visible  │ visible │
  │ horoscope labels    │ hidden   │ hidden   │ visible  │ visible │
  │ horoscope charts    │ hidden   │ hidden   │ hidden   │ visible │
  │ gallery photos      │ hidden   │ visible  │ visible  │ visible │
  │ contact (email/ph)  │ hidden   │ hidden   │ hidden   │ visible │
  └─────────────────────┴──────────┴──────────┴──────────┴──────┘

  Field → NULL/empty mapping:
    hideProfessional = !vd('EXTENDED')
      → education=null, jobDetail=null, jobSector=null,
         companyName=null, jobLocation=null, salary=null

    hideFamily = !vd('EXTENDED')
      → fatherName=null, motherName=null, noOfBrother=null, noOfSister=null

    hideHoroscopeLabels = !vd('ADVANCED')
      → star=null, rasi=null, lagnam=null

    hideHoroscopeCharts = !vd('FULL')
      → horoscope={ locked: true } (no chart URLs or JSON)

    hideContact = !vd('FULL')
      → phone=null, email=null, contactLocked=true

    hideGallery = !vd('EXTENDED')
      → gallery=[], galleryLocked=true

Output: ctx.gatedProfile = profile with NULL'd restricted fields
```

---

### S7: setResponse

```
====================================================================================
S7: setResponse
────────────────────────────────────────────────────────────────────────────────────
Build full response from ctx.gatedProfile (or ctx.profile if owner/admin):

ctx.responseData = {
  id: profile.id,
  regNo: profile.regNo,
  status: profile.currentStatus,
  isOwner: ctx.isOwner,
  viewerRole: ctx.viewerRole,
  viewTier: ctx.viewerRole == 'PUBLIC' ? ctx.viewDetails : undefined,
  firstNameEn: translations?.EN?.firstName,
  lastNameEn: translations?.EN?.lastName,
  firstNameTa: translations?.TA?.firstName,
  lastNameTa: translations?.TA?.lastName,
  dob: basic?.dob,
  gender: basic?.gender,
  age: basic?.age,
  diet: basic?.diet,
  height: basic?.height?.valueCm,
  profileFor: basic?.profileFor,
  currentLocation: basic?.currentLocation ? { district, taluk } : null,
  nativeLocation: basic?.nativeLocation ? { district, taluk } : null,
  community: community ? { community, caste, kulam } : null,
  professional: gated (or null),
  family: gated (or null),
  horoscope: gated (or null),
  assets: assets ?? null,
  partnerPreference: partnerPreference ?? null,
  photos: { primary: upload?.url, gallery: galleryUrls },
  contact: gated (or { email, phone }),
  createdAt: profile.createdAt,
  updatedAt: profile.updatedAt,
}
```

## Dependencies

| File | Role |
|------|------|
| `common/profile/steps/permissionGate.step.ts` | Route-level role ACL |
| `common/profile/steps/validateIdFormat.step.ts` | UUID validation |
| `common/profile/steps/resolveProfile.step.ts` | Full JOIN fetch |
| `common/profile/steps/visibilityCheck.step.ts` | Role×status matrix |
| `common/profile/steps/membershipGate.step.ts` | Open quota check |
| `common/profile/steps/consumeOpenQuota.step.ts` | Usage tracking |
| `common/profile/steps/applyFieldGating.step.ts` | viewDetails gating |
| `common/profile/steps/setResponse.step.ts` | Response shape |
| `modules/membership/membership.guard.ts` | resolveCapabilities |
