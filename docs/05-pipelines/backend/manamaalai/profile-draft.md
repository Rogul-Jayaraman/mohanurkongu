# Pipeline 2: profile-draft

> **For beginners**: Resume a saved draft or delete one. If you started
> creating a profile but didn't finish, this lets you pick up where you
> left off. Delete is soft — data stays in the database.

## Purpose

Replaces `resumeDraft()` and `deleteDraft()` in `profile.service.ts`. Two sub-flows under one pipeline: resume fetches full draft data pre-filled for editing; delete performs a **soft-delete** (sets `currentStatus = 'DELETED'`, transitions uploads to `DELETE_PENDING`). The delete flow is the user-facing equivalent of admin-delete but restricted to DRAFT status only and does NOT perform CASCADE row deletion.

## Actor & Entry

| Route | Method | action | Rate Limiter |
|-------|--------|--------|-------------|
| `/profiles/draft/:id/resume` → GET  | `resume` | `defaultLimiter` (30/window) |
| `/profiles/draft/:id`              | DELETE | `delete` | `defaultLimiter` (30/window) |

**Allowed Roles:** `USER` (via `requireSession` middleware)

## High-Level Architecture

```
  ┌─ GET  /profiles/draft/:id/resume  → action = 'resume'
  │  DELETE /profiles/draft/:id       → action = 'delete'
  ▼
  ┌────────────────────────────────────────────────────────────────────┐
  │  ProfileController                                                  │
  │  const ctx = {                                                      │
  │    input:     { profileId: req.params.id },                         │
  │    accountId: req.account.sub,                                      │
  │    roles:     req.roles,                                            │
  │    action:    req.method == 'DELETE' ? 'delete' : 'resume',          │
  │    storageService: this.storageService,                             │
  │  };                                                                  │
  │  const result = await profileDraftPipeline(ctx);                    │
  │  if (action == 'delete') sendStatus(res, 204);                      │
  │  else sendSuccess(res, result.responseData);                        │
  └────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
  ┌────────────────────────────────────────────────────────────────────┐
  │  PipelineRunner.run(steps, ctx)                                    │
  │                                                                     │
  │  ┌── S1-S2: PRE-TRANSACTION ───────────────────────────────────┐   │
  │  │  S1. permissionGate                                           │   │
  │  │  S2. resolveProfile(profileId, ['DRAFT'], OWNER_ONLY)         │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  │                                                                     │
  │  ┌── BRANCH: resume vs delete ────────────────────────────────┐   │
  │  │                                                              │   │
  │  │  action == 'resume'         │  action == 'delete'            │   │
  │  │  ───────────────────────────│────────────────────────────   │   │
  │  │  S3a. loadFullProfile()     │  S3b. collectUploadIds()       │   │
  │  │                              │  S4b. bulkTransitionStatus     │   │
  │  │                              │       (ATTACHED/ACTIVE         │   │
  │  │                              │        → DELETE_PENDING)       │   │
  │  │  POST-TRANSACTION            │  ┌── $transaction ──────┐    │   │
  │  │  S4a. setResponse(full)      │  │  S5b. softDelete()    │    │   │
  │  │                              │  │  S6b. recordHistory   │    │   │
  │  │                              │  └──────────────────────┘    │   │
  │  │                              │  S7b. setStatus(204)         │   │
  └────────────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture — Step by Step

---

### S1: permissionGate

```
====================================================================================
S1: permissionGate
────────────────────────────────────────────────────────────────────────────────────
action = (ctx.action == 'resume') ? 'profile:draft-resume' : 'profile:draft-delete'

┌────────────────────┬──────────────────┐
│ Action             │ Allowed Roles    │
├────────────────────┼──────────────────┤
│ draft-resume       │ ['USER']         │
│ draft-delete       │ ['USER']         │
└────────────────────┴──────────────────┘

if ctx.roles does not include any allowed role
  → AppError(401, AUTH_PORTAL_MISMATCH)

Output: ctx (unaltered)
```

---

### S2: resolveProfile (owner-only draft check)

```
====================================================================================
S2: resolveProfile (light)
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.input.profileId, ctx.accountId

Query:
  SELECT id, current_status, account_id
  FROM profiles
  WHERE id = :profileId

if not found → AppError(404, PROFILE_NOT_FOUND)
if current_status != 'DRAFT' → AppError(400, PROFILE_NOT_DRAFT)
if account_id != accountId → AppError(403, AUTH_FORBIDDEN)

Output: ctx.profile = { id, status: 'DRAFT', accountId }
```

---

### S3a: loadFullProfile (RESUME only)

```
====================================================================================
S3a: loadFullProfile (RESUME)
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.profileId

Query via prisma.profile.findFirst or repo with full include tree:
  profiles (full row)
  + profile_basic (with profileFor, height, currentLocation×district×taluk,
                   nativeLocation×district×taluk)
  + profile_community (with community, caste, kulam)
  + profile_professional (with jobSector)
  + profile_family
  + profile_horoscope (with rasi, nakshatra, lagna, rasiChart, navamsaChart)
  + profile_assets
  + partner_preference (with heightMin, heightMax)
  + profile_translations (EN + TA)
  + profile_photos (with primaryUpload, gallery×upload)

Transform to client DTO:
  data = {
    profileId,
    basic: { gender, dob, diet, height, profileFor, currentLocation, nativeLocation },
    community: { community, caste, kulam },
    professional: { education, jobSector, jobDetail, salary },
    family: { fatherAlive, motherAlive, noOfBrother, noOfSister },
    horoscope: { mode, rasi, nakshatra, lagna, chartUploadIds },
    assets: { land, residenceType, vehicle },
    partnerPreference: { ageMin, ageMax, heightMin, heightMax, salary },
    photos: { primaryUploadId, galleryUploadIds },
    translations: { EN: { firstName, lastName, ... }, TA: { firstName, lastName, ... } }
  }

Output: ctx.responseData = data
```

---

### S3b-S4b: collectUploadIds + bulkTransitionStatus (DELETE only)

```
====================================================================================
S3b: collectUploadIds (DELETE)
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.profileId

uploadIds = []

SELECT primary_upload_id FROM profile_photos WHERE profile_id = :profileId
  → if set: uploadIds.push(primary_upload_id)

SELECT upload_id FROM profile_gallery_photos pgp
  JOIN profile_photos pp ON pp.id = pgp.profile_photo_id
  WHERE pp.profile_id = :profileId
  → uploadIds.push(...results)

SELECT rasi_chart_upload_id, navamsa_chart_upload_id
  FROM profile_horoscopes WHERE profile_id = :profileId
  → if set: uploadIds.push(rasi), push(navamsa)

====================================================================================
S4b: bulkTransitionStatus (DELETE — pre-transaction)
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.uploadIds (deduplicated), ctx.storageService

storageService.bulkTransitionStatus(uploadIds, ['ATTACHED', 'ACTIVE'], 'DELETE_PENDING')
  → UPDATE uploads SET status = 'DELETE_PENDING'
     WHERE id IN (:uploadIds) AND status IN ('ATTACHED', 'ACTIVE')

NOTE: This runs BEFORE the $transaction to avoid deadlocks with concurrent operations.
```

---

### S5b: softDelete [INSIDE $transaction]

```
====================================================================================
S5b: softDelete (DELETE only)
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.profileId

UPDATE profiles
SET current_status = 'DELETED', updated_at = NOW()
WHERE id = :profileId

NOTE: This is a SOFT delete — no rows are removed from any table.
      Contrast with admin-delete (Pipeline 9) which performs CASCADE deletion.
```

---

### S6b: recordStateHistory [INSIDE $transaction]

```
====================================================================================
S6b: recordStateHistory (DELETE only)
────────────────────────────────────────────────────────────────────────────────────
INSERT INTO profile_state_history (profile_id, changed_by_account_id, from_status, to_status)
VALUES (:profileId, :accountId, 'DRAFT', 'DELETED')
```

---

### S4a/S7b: setResponse

```
====================================================================================
S7b / S4a: setResponse
────────────────────────────────────────────────────────────────────────────────────
RESUME (S4a):
  ctx.responseData = full DTO object from S3a
  Output: { profileId, basic, community, professional, family, horoscope,
            assets, partnerPreference, photos, translations }

DELETE (S7b):
  ctx.responseData = null
  Controller returns HTTP 204 No Content
```

## Dependencies

| File | Role |
|------|------|
| `common/profile/steps/permissionGate.step.ts` | Route-level role ACL |
| `common/profile/steps/resolveProfile.step.ts` | Profile lookup + ownership |
| `common/profile/steps/loadFullProfile.step.ts` | Resume: full JOIN fetch |
| `common/profile/steps/collectUploadIds.step.ts` | Upload ID collection |
| `common/profile/steps/updateProfileStatus.step.ts` | Soft-delete status update |
| `common/profile/steps/recordStateHistory.step.ts` | State transition log |
| `common/profile/steps/setResponse.step.ts` | Response shape |
| `modules/storage/storage.service.ts` | bulkTransitionStatus |
