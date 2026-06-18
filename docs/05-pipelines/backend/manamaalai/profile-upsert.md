# Pipeline 1: profile-upsert

> **For beginners**: The big one — 17 steps to create or update a matrimony
> profile. Handles all 9 profile sections (basics, community, family,
> horoscope, photos, partner preferences, etc.) plus duplicate detection
> and membership checks.

## Purpose

Replaces `saveDraft()` and `createProfile()` in `profile.service.ts`. A unified upsert pipeline that either saves profile data as DRAFT or submits it as PENDING for verification. Handles all 9 profile sub-tables (basic, community, professional, family, horoscope, assets, partner preference, photos, translations) plus upload token resolution, duplicate detection, registration number generation, and membership slot gating.

## Actor & Entry

| Route | Method | targetStatus | Rate Limiter |
|-------|--------|-------------|-------------|
| `/profiles/draft` | POST | `DRAFT` | `defaultLimiter` (30/window) |
| `/profiles/create` | POST | `PENDING` | `createLimiter` (3/window) |

**Allowed Roles:** `USER` (via `requireSession` middleware)

**Validation Schemas:**
- Draft: `saveDraftSchema` — all optional, superRefine requires firstName + gender+dob
- Create: `createProfileSchema` — strict: age 21-40, gender/diet enum, section completeness

## High-Level Architecture

```
  ┌─ POST /profiles/draft   → targetStatus = 'DRAFT'
  │  POST /profiles/create  → targetStatus = 'PENDING'
  ▼
  ┌──────────────────────────────────────────────────────────────────────────┐
  │  ProfileController                                                        │
  │  const ctx = {                                                            │
  │    input:        req.body,                                                 │
  │    accountId:    req.account.sub,                                          │
  │    roles:        req.roles ?? ['USER'],                                    │
  │    capabilities: req.capabilities,                                         │
  │    targetStatus: req.path.includes('/draft') ? 'DRAFT' : 'PENDING',        │
  │    storageService: this.storageService,                                    │
  │    accountService: this.accountService,                                    │
  │  };                                                                        │
  │  const result = await profileUpsertPipeline(ctx);                          │
  │  sendSuccess(res.status(targetStatus == 'PENDING' ? 201 : 200), result);   │
  └──────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
  ┌──────────────────────────────────────────────────────────────────────────┐
  │  PipelineRunner.run(steps, ctx)                                          │
  │                                                                           │
  │  ┌── S1-S6: PRE-TRANSACTION (validation + checks) ─────────────────┐     │
  │  │  S1. permissionGate                                              │     │
  │  │  S2. validateData                                                │     │
  │  │  S3. checkDuplicate                                              │     │
  │  │  S4. checkProfileState   ←── new-vs-draft branching here         │     │
  │  │  S5. membershipGate (slot quota)                                 │     │
  │  │  S6. resolveUploadTokens                                        │     │
  │  └──────────────────────────────────────────────────────────────────┘     │
  │  ┌── S7-S12: INSIDE $transaction ──────────────────────────────────┐     │
  │  │  S7.  generateRegNo (PENDING only)                              │     │
  │  │  S8.  createOrUpdateProfileRow                                  │     │
  │  │  S9.  processImages                                             │     │
  │  │  S10. writeSections (9 sub-tables)                              │     │
  │  │  S11. manageProfileUploads (TEMP→ATTACHED)                      │     │
  │  │  S12. upsertVerificationQueue (PENDING only)                    │     │
  │  │  S13. recordStateHistory                                        │     │
  │  └──────────────────────────────────────────────────────────────────┘     │
  │  ┌── S14: POST-TRANSACTION ───────────────────────────────────────┐     │
  │  │  setResponse(status, regNo)                                       │     │
  │  └──────────────────────────────────────────────────────────────────┘     │
  └──────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
                      { profileId, status, regNo? }
```

## Low-Level Architecture — Step by Step

---

### S1: permissionGate

```
====================================================================================
S1: permissionGate
────────────────────────────────────────────────────────────────────────────────────
action = (targetStatus == 'DRAFT') ? 'profile:save-draft' : 'profile:create'

┌──────────────┬──────────────────────────┐
│ Action       │ Allowed Roles            │
├──────────────┼──────────────────────────┤
│ save-draft   │ ['USER']                 │
│ create       │ ['USER']                 │
└──────────────┴──────────────────────────┘

if ctx.roles does not include any allowed role
  → AppError(401, AUTH_PORTAL_MISMATCH)

Output: ctx (unaltered)
```

---

### S2: validateData

```
====================================================================================
S2: validateData
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.input (raw request body), ctx.targetStatus

DRAFT mode:  all fields optional → ctx.profileData = validatedDto (no errors)
PENDING mode: requires:

  ┌────────────────────┬──────────────────────────────────┐
  │ Field              │ Validation                       │
  ├────────────────────┼──────────────────────────────────┤
  │ basic.gender       │ present, non-empty, valid enum   │
  │ basic.dob          │ present, parseable ISO date      │
  │ basic.diet         │ present, valid enum              │
  │ basic.heightId     │ present (0 = not specified)      │
  │ basic.profileFor   │ present (string code)            │
  │ community          │ present with community+caste     │
  │ photos.primaryUploadId │ present (token or UUID)      │
  │ translations.EN.firstName │ non-empty                 │
  │ age range          │ 21-40 inclusive                  │
  │ partnerPreference ageMin ≤ ageMax                     │
  │ horoscope chartIds  │ valid UUIDs if provided         │
  └────────────────────┴──────────────────────────────────┘

Data transformations:
  complexions: 'VERY_FAIR' → null, 'NOT_SPECIFIED' → omitted
  height <valueCm> → heightId (resolved via heights table)
  heightMin/Max <valueCm> → heightMinId/heightMaxId

if any validation fails → AppError(400, VALIDATION_ERROR) with field details
Output: ctx.profileData = validatedDto
```

---

### S3: checkDuplicate

```
====================================================================================
S3: checkDuplicate
────────────────────────────────────────────────────────────────────────────────────
Only runs when targetStatus == 'PENDING' (no duplicate check for drafts)

Query:
  SELECT COUNT(*) FROM profiles p
  JOIN profile_basic pb ON pb.profile_id = p.id
  WHERE p.account_id != :accountId
    AND pb.dob = :dob
    AND pb.gender = :gender
    AND p.current_status NOT IN ('DELETED')

if count > 0 → AppError(409, DUPLICATE_PROFILE)

Output: ctx (unaltered)
```

---

### S4: checkProfileState (with new-vs-draft branching)

```
====================================================================================
S4: checkProfileState
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.input.profileId (optional, from request body), ctx.targetStatus

           ┌─ profileId PRESENT (update existing) ──────────────────────────────┐
           │  SELECT current_status FROM profiles WHERE id = :profileId         │
           │  AND account_id = :accountId                                       │
           │                                                                    │
           │  if not found → AppError(404, PROFILE_NOT_FOUND)                   │
           │                                                                    │
           │  ┌─ status == 'DRAFT' → ctx.existingProfile = { id, status }      │
           │  │   Valid transitions: DRAFT→DRAFT, DRAFT→PENDING                 │
           │  │   ctx.isNew = false                                             │
           │  │                                                                 │
           │  ├─ status == 'REJECTED' → ctx.existingProfile = { id, status }    │
           │  │   Valid transitions: REJECTED→PENDING                           │
           │  │   ctx.isNew = false                                             │
           │  │                                                                 │
           │  └─ status NOT IN ('DRAFT','REJECTED')                             │
           │      → AppError(400, PROFILE_WRONG_STATUS)                         │
           │                                                                     │
           └─ profileId ABSENT (brand new) ─────────────────────────────────    │
              ctx.existingProfile = null, ctx.isNew = true                       │
              Valid: null → DRAFT, null → PENDING                               │
           └─────────────────────────────────────────────────────────────────────┘

Output: ctx.existingProfile?, ctx.isNew
```

---

### S5: membershipGate (slot quota)

```
====================================================================================
S5: membershipGate (slot quota)
────────────────────────────────────────────────────────────────────────────────────
Only runs when targetStatus == 'PENDING' (drafts don't consume slots)

if ctx.capabilities == null
  OR ctx.capabilities.profileSlotLimit < 0
  → skip (unlimited)

Query:
  SELECT COUNT(*) FROM profiles
  WHERE account_id = :accountId
    AND current_status IN ('DRAFT','PENDING','ACTIVE','ARCHIVED')

slotOccupiedByThis = ctx.existingProfile != null ? 1 : 0
remaining = ctx.capabilities.profileSlotLimit - (current - slotOccupiedByThis)

if remaining <= 0 → AppError(403, MEMBERSHIP_SLOT_LIMIT_REACHED)

Output: ctx.remainingSlots = remaining
```

---

### S6: resolveUploadTokens

```
====================================================================================
S6: resolveUploadTokens
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.accountId, ctx.profileData.photos.{primaryUploadId, galleryUploadIds[]},
       ctx.profileData.horoscope.{rasiChartUploadId, navamsaChartUploadId}

For each upload reference:
  if value matches UUID regex → already resolved, skip
  if value matches uploadToken pattern:
    SELECT id, owner_account_id FROM uploads WHERE upload_token = :token

    if not found → AppError(404, UPLOAD_NOT_FOUND)
    if owner_account_id != accountId → AppError(403, AUTH_FORBIDDEN)
    replace token value with resolved UUID in ctx.profileData

Batch ownership verification (all UUIDs):
  SELECT COUNT(*) FROM uploads
  WHERE id IN (:allUploadIds) AND owner_account_id = :accountId

  if count != len(allUploadIds) → AppError(403, AUTH_FORBIDDEN)

Output: ctx.profileData (all tokens replaced with UUIDs)
```

---

### S7: generateRegNo [INSIDE $transaction]

```
====================================================================================
S7: generateRegNo
────────────────────────────────────────────────────────────────────────────────────
Only runs when targetStatus == 'PENDING'

regNo = accountService.generateRegNo(tx)
  ┌── accountService.nextCounter(appConfig.prefixes.reg, tx)
  │   appConfig.prefixes.reg = 'MK'  (configurable via env REG_NO_PREFIX)
  │   counters table:
  │     UPSERT counter WHERE prefix = 'MK' SET count = count + 1
  │     RETURN CONCAT(prefix, '-', LPAD(count, 4, '0'))
  │     → 'MK-0001', 'MK-0002', ...
  └── Atomic: uses the same $transaction (tx passed through)

Output: ctx.regNo = generatedRegNo (only when PENDING)
```

---

### S8: createOrUpdateProfileRow [INSIDE $transaction]

```
====================================================================================
S8: createOrUpdateProfileRow
────────────────────────────────────────────────────────────────────────────────────
           ┌─ ctx.isNew (brand new) ──────────────────────────────────────────────┐
           │  profile = tx.profile.create({                                      │
           │    data: { accountId, currentStatus: targetStatus }                 │
           │  })                                                                 │
           │  if targetStatus == 'PENDING':                                      │
           │    tx.profile.update({                                              │
           │      where: { id: profile.id },                                     │
           │      data: { regNo: ctx.regNo }                                     │
           │    })                                                               │
           │  ctx.profileId = profile.id                                         │
           └──────────────────────────────────────────────────────────────────── ┘
           ┌─ !ctx.isNew (from draft) ───────────────────────────────────────────┐
           │  if targetStatus == 'PENDING':                                      │
           │    tx.profile.update({                                              │
           │      where: { id: ctx.existingProfile.id },                         │
           │      data: { currentStatus: targetStatus, regNo: ctx.regNo }        │
           │    })                                                               │
           │  ctx.profileId = ctx.existingProfile.id                             │
           └──────────────────────────────────────────────────────────────────────┘

Output: ctx.profileId
```

---

### S9: processImages [INSIDE $transaction]

```
====================================================================================
S9: processImages
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.profileId, ctx.profileData.photos.{primaryUploadId, galleryUploadIds[]}

┌── Upsert primary photo ─────────────────────────────────────────────────┐
│  tx.profilePhoto.upsert({                                               │
│    where: { profileId: ctx.profileId },                                  │
│    create: { profileId: ctx.profileId, primaryUploadId },               │
│    update: { primaryUploadId }                                           │
│  })                                                                      │
└──────────────────────────────────────────────────────────────────────────┘
┌── Replace gallery ──────────────────────────────────────────────────────┐
│  tx.profileGalleryPhoto.deleteMany({                                    │
│    where: { profilePhotoId: profilePhoto.id }                           │
│  })                                                                      │
│  for each galleryUploadId:                                               │
│    tx.profileGalleryPhoto.create({                                       │
│      profilePhotoId: profilePhoto.id, uploadId                          │
│    })                                                                    │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### S10: writeSections [INSIDE $transaction]

```
====================================================================================
S10: writeSections
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.profileId, ctx.profileData (all sections), ctx.targetStatus

┌──────────────────────────────────────────────────────────────────────────────────┐
│  Sub-step 10a: ProfileBasic                                                       │
│  LOOKUP: heights (valueCm → id), districts (code → id), taluks (code → id),      │
│          profile_fors (code → id)                                                 │
│  CREATE: locations (current + native — INSERT if not exists, reuse)               │
│  WRITE:  profile_basic.upsert({ profileId, profileForId, heightId,               │
│           currentLocationId, nativeLocationId, gender, dob, diet, ... })          │
├──────────────────────────────────────────────────────────────────────────────────┤
│  Sub-step 10b: ProfileCommunity                                                    │
│  LOOKUP: communities (code → id), castes (code + community → id),                  │
│          kulams (code → id)                                                       │
│  WRITE:  profile_community.upsert({ communityId, casteId, kulamId })              │
├──────────────────────────────────────────────────────────────────────────────────┤
│  Sub-step 10c: ProfileProfessional                                                  │
│  LOOKUP: job_sectors (code → id)                                                  │
│  WRITE:  profile_professional.upsert({ education, jobSectorId, jobDetail, ... })  │
├──────────────────────────────────────────────────────────────────────────────────┤
│  Sub-step 10d: ProfileFamily                                                       │
│  WRITE:  profile_family.upsert({ fatherAlive, motherAlive,                        │
│           noOfBrother, noOfSister, ... })                                          │
├──────────────────────────────────────────────────────────────────────────────────┤
│  Sub-step 10e: ProfileHoroscope                                                    │
│  LOOKUP: rasis (code → id), nakshatras (code → id), lagnas (code → id)           │
│  WRITE:  profile_horoscope.upsert({ mode, rasiId, nakshatraId, chartUploadIds })  │
├──────────────────────────────────────────────────────────────────────────────────┤
│  Sub-step 10f: ProfileAssets                                                       │
│  WRITE:  profile_assets.upsert({ land, residenceType, vehicle, ... })             │
├──────────────────────────────────────────────────────────────────────────────────┤
│  Sub-step 10g: PartnerPreference                                                   │
│  LOOKUP: heights (valueCm → id for min/max)                                       │
│  WRITE:  partner_preference.upsert({ ageMin, ageMax, heightMinId, heightMaxId,    │
│           salary, ... })                                                          │
├──────────────────────────────────────────────────────────────────────────────────┤
│  Sub-step 10h: ProfileTranslations                                                 │
│  for each language (EN, TA):                                                      │
│    WRITE:  profile_translation.upsert({ language, firstName, lastName,           │
│             locationFields })                                                     │
├──────────────────────────────────────────────────────────────────────────────────┤
│  Sub-step 10i: Upload Status Transition                                            │
│  WRITE:  uploads SET status = 'ATTACHED'                                          │
│          WHERE id IN (:allUploadIds) AND status = 'TEMP'                          │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

### S11: manageProfileUploads (TEMP→ATTACHED) [INSIDE $transaction]

```
====================================================================================
S11: manageProfileUploads
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.profileId, ctx.storageService

Collect all upload IDs for this profile:
  SELECT primary_upload_id FROM profile_photos WHERE profile_id = :profileId
  SELECT upload_id FROM profile_gallery_photos pgp
    JOIN profile_photos pp ON pp.id = pgp.profile_photo_id
    WHERE pp.profile_id = :profileId
  SELECT rasi_chart_upload_id, navamsa_chart_upload_id
    FROM profile_horoscopes WHERE profile_id = :profileId

storageService.bulkTransitionStatus(uploadIds, ['TEMP'], 'ATTACHED', tx)
  → UPDATE uploads SET status = 'ATTACHED'
     WHERE id IN (:uploadIds) AND status = 'TEMP'

if result.count != uploadIds.length
  → AppError(400, UPLOAD_INVALID_STATUS)  (some uploads already transitioned)
```

---

### S12: upsertVerificationQueue [INSIDE $transaction]

```
====================================================================================
S12: upsertVerificationQueue
────────────────────────────────────────────────────────────────────────────────────
Only runs when targetStatus == 'PENDING'

tx.verificationQueue.upsert({
  where: { profileId: ctx.profileId },
  create: { profileId: ctx.profileId, priority: 0 },
  update: {}
})
```

---

### S13: recordStateHistory [INSIDE $transaction]

```
====================================================================================
S13: recordStateHistory
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.profileId, ctx.accountId, ctx.targetStatus

Determining fromStatus:
  ┌─ ctx.isNew && targetStatus == 'DRAFT'   → fromStatus = null
  ├─ ctx.isNew && targetStatus == 'PENDING'  → fromStatus = null
  ├─ !ctx.isNew && targetStatus == 'DRAFT'   → fromStatus = 'DRAFT'
  └─ !ctx.isNew && targetStatus == 'PENDING'  → fromStatus = ctx.existingProfile.status

tx.profileStateHistory.create({
  data: {
    profileId: ctx.profileId,
    changedByAccountId: ctx.accountId,
    fromStatus,
    toStatus: targetStatus
  }
})
```

---

### S14: setResponse

```
====================================================================================
S14: setResponse
────────────────────────────────────────────────────────────────────────────────────
response = { profileId: ctx.profileId }

if targetStatus == 'PENDING':
  response.status = 'PENDING'
  response.regNo = ctx.regNo
else:
  response.status = 'DRAFT'

ctx.responseData = response
Output: { profileId, status, regNo? }
```

## Dependencies

| File | Role |
|------|------|
| `common/profile/steps/permissionGate.step.ts` | Route-level role ACL |
| `common/profile/steps/validateProfileData.step.ts` | Zod/DTO validation |
| `common/profile/steps/checkDuplicate.step.ts` | Gender+DOB uniquenss |
| `common/profile/steps/checkProfileState.step.ts` | State machine rules |
| `common/profile/steps/membershipGate.step.ts` | Slot quota check |
| `common/profile/steps/resolveUploadTokens.step.ts` | Token→UUID resolution |
| `common/profile/steps/generateRegNo.step.ts` | Counter-based reg number |
| `common/profile/steps/createOrUpdateProfileRow.step.ts` | Profile row lifecycle |
| `common/profile/steps/processImages.step.ts` | Photo/gallery association |
| `common/profile/steps/writeSections.step.ts` | 9 sub-table upserts |
| `common/profile/steps/manageProfileUploads.step.ts` | Upload status transition |
| `common/profile/steps/upsertVerificationQueue.step.ts` | Queue entry |
| `common/profile/steps/recordStateHistory.step.ts` | State transition log |
| `common/profile/steps/setResponse.step.ts` | Response shape |
