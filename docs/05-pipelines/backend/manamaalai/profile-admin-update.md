# Pipeline 7: profile-admin-update

> **For beginners**: Admins can edit any profile's fields — used for
> corrections or updates that users can't make themselves. Every change
> is audited.

## Purpose

Replaces `updateProfile()` in `admin-profiles.service.ts`. Admin-only pipeline for directly editing any profile section on behalf of the user. Preserves the profile's current status (does NOT change it) and records an admin review entry alongside the update.

## Actor & Entry

| Route | Method | Rate Limiter |
|-------|--------|-------------|
| `/admin/profiles/:id` | PUT | `adminMutationLimiter` (30/window) |

**Allowed Roles:** `ADMIN` (via `requireSession` + `requireRole('ADMIN')` middleware)

**Status requirement:** Only works when profile status is `PENDING`.

## High-Level Architecture

```
  ┌─ PUT /admin/profiles/:id  body: { sections: {...}, reviewNote: '...' }
  ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  AdminProfilesController                                              │
  │  const ctx = {                                                        │
  │    input:      { profileId: req.params.id, ...req.body },             │
  │    accountId:  req.account.sub,                                       │
  │    roles:      req.roles,                                             │
  │    storageService: this.storageService,                               │
  │    ipAddress:  req.ip,                                                │
  │  };                                                                    │
  │  const result = await profileAdminUpdatePipeline(ctx);                │
  │  sendSuccess(res, result);                                             │
  └──────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  PipelineRunner.run(steps, ctx)                                      │
  │                                                                       │
  │  ┌── S1-S6: PRE-TRANSACTION ────────────────────────────────┐       │
  │  │  S1. permissionGate                                           │       │
  │  │  S2. resolveProfile(id, PENDING, ADMIN)                       │       │
  │  │  S3. validateProfileData (relaxed admin mode)                  │       │
  │  │  S4. checkProfileState (passthrough — status unchanged)        │       │
  │  │  S5. resolveUploadTokens                                      │       │
  │  └───────────────────────────────────────────────────────────────┘       │
  │  ┌── S6-S8: INSIDE $transaction ──────────────────────────┐          │
  │  │  S6. processImages (upsert photo/gallery)                │          │
  │  │  S7. writeSections (9 sub-tables, preserve queue)        │          │
  │  │  S8. recordAdminAction (stateHistory + review + audit)   │          │
  │  └──────────────────────────────────────────────────────────┘          │
  │  ┌── S9: POST-TRANSACTION ─────────────────────────────────┐         │
  │  │  setResponse(profileId, status: unchanged)                │         │
  │  └────────────────────────────────────────────────────────────┘         │
  └────────────────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture — Step by Step

---

### S1: permissionGate

```
====================================================================================
S1: permissionGate
────────────────────────────────────────────────────────────────────────────────────
action = 'profile:admin-update'

┌──────────────────┬─────────────────────┐
│ Action           │ Allowed Roles       │
├──────────────────┼─────────────────────┤
│ profile:admin-update │ ['ADMIN'] │
└──────────────────┴─────────────────────┘

if ctx.roles does not include any allowed role
  → AppError(401, AUTH_PORTAL_MISMATCH)

Output: ctx (unaltered)
```

---

### S2: resolveProfile

```
====================================================================================
S2: resolveProfile
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.input.profileId

Query:
  SELECT id, current_status, account_id
  FROM profiles
  WHERE id = :profileId

if not found → AppError(404, PROFILE_NOT_FOUND)
if current_status != 'PENDING' → AppError(400, PROFILE_NOT_PENDING)
  (admin can only update profiles currently under review)

Output: ctx.profile = { id, status: 'PENDING', accountId }
```

---

### S3: validateProfileData (relaxed admin mode)

```
====================================================================================
S3: validateProfileData (admin mode)
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.input.sections

Validation rules (relaxed vs user-facing):
  ┌──────────────────────────────────────────────────────────────────────────────┐
  │  All sections OPTIONAL — admin can send partial update (single field)        │
  │  Height/heightMin/heightMax <valueCm> resolved via heights table             │
  │  Complexion normalization (VERY_FAIR → null, NOT_SPECIFIED → omit)          │
  │  NO required-field checks (admin knows what they're doing)                   │
  │  field validations still apply (enums, formats, length limits)              │
  └──────────────────────────────────────────────────────────────────────────────┘

if validation fails → AppError(400, VALIDATION_ERROR)

Output: ctx.profileData = validated dto
```

---

### S4: checkProfileState (passthrough)

```
====================================================================================
S4: checkProfileState (passthrough)
────────────────────────────────────────────────────────────────────────────────────
Admin updates do NOT change profile status — profile stays PENDING.

No DB query needed. Status remains ctx.profile.current_status.

Output: ctx.targetStatus = ctx.profile.current_status  (unchanged)
```

---

### S5: resolveUploadTokens

```
====================================================================================
S5: resolveUploadTokens
────────────────────────────────────────────────────────────────────────────────────
Same logic as profile-upsert S6:
  For each upload reference in ctx.profileData.photos.*, horoscope.*:
    if matches UUID → skip
    if matches uploadToken → SELECT uploads WHERE upload_token = :token
      not found → 404; wrong owner → 403;    replace token → UUID

Batch ownership verification:
  SELECT COUNT(*) FROM uploads
  WHERE id IN (:allUploadIds) AND owner_account_id = :accountId

  if count != len(allUploadIds) → AppError(403, AUTH_FORBIDDEN)

Output: ctx.profileData (tokens replaced with UUIDs)
```

---

### S6: processImages [INSIDE $transaction]

```
====================================================================================
S6: processImages
────────────────────────────────────────────────────────────────────────────────────
Same as profile-upsert S9:
  Upsert profile_photos (primaryUploadId)
  Replace profile_gallery_photos (delete all, insert new)
```

---

### S7: writeSections [INSIDE $transaction]

```
====================================================================================
S7: writeSections
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.profileId, ctx.profileData (partial sections), ctx.profile.status

Same 9 sub-table upsert logic as profile-upsert S10:
  — Only sections present in ctx.profileData are written (partial update)
  — Existing sections not included in the payload are LEFT UNCHANGED

Differences from user-facing upsert:
  ┌──────────────────────────────────────────────────────────────────────────────┐
  │  Registration number NOT regenerated (already assigned at PENDING)           │
  │  Verification queue entry PRESERVED (not recreated — already exists)         │
  │  Upload status transition: only new uploads → ATTACHED (existing preserved)  │
  └──────────────────────────────────────────────────────────────────────────────┘
```

---

### S8: recordAdminAction [INSIDE $transaction]

```
====================================================================================
S8: recordAdminAction (composed sub-pipeline)
────────────────────────────────────────────────────────────────────────────────────
INSERT INTO profile_state_history (profile_id, changed_by_account_id,
    from_status, to_status)
  VALUES (:profileId, :accountId, 'PENDING', 'PENDING')
  -- from == to because admin update doesn't change status

INSERT INTO profile_reviews (profile_id, reviewed_by_account_id,
    action, note, created_at)
  VALUES (:profileId, :accountId, 'UPDATE', :reviewNote, NOW())

INSERT INTO audit_log (actor_id, action_type, target_type, target_id,
    description, created_at)
  VALUES (:accountId, 'UPDATE_PROFILE', 'PROFILE', :profileId,
    'Admin updated profile sections', NOW())

See subpipeline/record-admin-action.md for details.
```

---

### S9: setResponse

```
====================================================================================
S9: setResponse
────────────────────────────────────────────────────────────────────────────────────
ctx.responseData = {
  profileId: ctx.profileId,
  status: 'PENDING',
  updated: true,
}
```

## Dependencies

| File | Role |
|------|------|
| `common/profile/steps/permissionGate.step.ts` | Route-level role ACL |
| `common/profile/steps/resolveProfile.step.ts` | Profile lookup (PENDING only) |
| `common/profile/steps/validateProfileData.step.ts` | Relaxed admin validation |
| `common/profile/steps/checkProfileState.step.ts` | State passthrough |
| `common/profile/steps/resolveUploadTokens.step.ts` | Token→UUID resolution |
| `common/profile/steps/processImages.step.ts` | Photo/gallery upsert |
| `common/profile/steps/writeSections.step.ts` | Partial section upsert |
| `common/profile/subpipeline/record-admin-action.md` | History + review + audit |
| `common/profile/steps/setResponse.step.ts` | Response shape |
