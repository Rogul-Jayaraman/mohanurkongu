# Pipeline 9: profile-admin-delete

> **For beginners**: Admins can delete profiles. This is a soft delete —
> data is preserved but marked as deleted. A background job purges it
> after 30 days.

## Purpose

Replaces `deleteProfile()` in `admin-profiles.service.ts`. Admin-only pipeline for soft-deleting a profile from any status (DRAFT, PENDING, ACTIVE, ARCHIVED, REJECTED). Performs CASCADE deletion of all profile data rows, transitions uploads to DELETE_PENDING, records admin action, and notifies the owner. Note: this is a **hard data delete** (rows removed from sub-tables) unlike the user-facing draft delete which is a soft status-only delete.

## Actor & Entry

| Route | Method | Rate Limiter |
|-------|--------|-------------|
| `/admin/profiles/:id/delete` | POST | `adminMutationLimiter` (30/window) |

**Allowed Roles:** `ADMIN` only

## High-Level Architecture

```
  ┌─ POST /admin/profiles/:id/delete
  ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  AdminProfilesController                                              │
  │  const ctx = {                                                        │
  │    input:      { profileId: req.params.id, reason: req.body.reason }, │
  │    accountId:  req.account.sub,                                       │
  │    roles:      req.roles,                                             │
  │    storageService: this.storageService,                               │
  │    ipAddress:  req.ip,                                                │
  │  };                                                                    │
  │  const result = await profileAdminDeletePipeline(ctx);                │
  │  sendSuccess(res, result);                                             │
  └──────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  PipelineRunner.run(steps, ctx)                                      │
  │                                                                       │
  │  ┌── S1-S2: PRE-TRANSACTION ───────────────────────────────┐        │
  │  │  S1. permissionGate (ADMIN only)                           │        │
  │  │  S2. resolveProfile(id, ANY_STATUS, ADMIN)                 │        │
  │  │      → skip if already DELETED (idempotent)               │        │
  │  └────────────────────────────────────────────────────────────┘        │
  │  ┌── S3-S6: INSIDE $transaction ───────────────────────────┐         │
  │  │  S3. deleteProfileCascade (11 tables)                      │         │
  │  │  S4. manageProfileUploads (→ DELETE_PENDING)               │         │
  │  │  S5. recordAdminAction (stateHistory + review + audit)     │         │
  │  └────────────────────────────────────────────────────────────┘         │
  │  ┌── S6-S7: POST-TRANSACTION ──────────────────────────────┐          │
  │  │  S6. sendNotification(ownerId, 'profile_deleted')          │          │
  │  │  S7. setResponse(profileId, 'DELETED')                     │          │
  │  └────────────────────────────────────────────────────────────┘          │
  └──────────────────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture — Step by Step

---

### S1: permissionGate

```
====================================================================================
S1: permissionGate (ADMIN only)
────────────────────────────────────────────────────────────────────────────────────
action = 'profile:admin-delete'

┌──────────────────┬──────────────────┐
│ Action           │ Allowed Roles    │
├──────────────────┼──────────────────┤
│ profile:admin-delete │ ['ADMIN']      │
└──────────────────┴──────────────────┘

Only ADMIN role can delete profiles.

if ctx.roles does not include 'ADMIN'
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
if current_status == 'DELETED' → skip remaining steps (idempotent: already deleted)

Output: ctx.profile = { id, status, accountId }
  ctx.skip = (current_status == 'DELETED')
```

---

### S3: deleteProfileCascade [INSIDE $transaction]

```
====================================================================================
S3: deleteProfileCascade
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.profileId

Operations in order (respects FK constraints):
  ┌──────────────────────────────────────────────────────────────────────────┐
  │  tx.profileTranslation.deleteMany({ where: { profileId } })              │
  │  tx.partnerPreference.delete({ where: { profileId } })                  │
  │  tx.profileAsset.delete({ where: { profileId } })                       │
  │  tx.profileHoroscope.delete({ where: { profileId } })                   │
  │  tx.profileFamily.delete({ where: { profileId } })                      │
  │  tx.profileProfessional.delete({ where: { profileId } })                 │
  │  tx.profileCommunity.delete({ where: { profileId } })                    │
  │  tx.profileBasic.delete({ where: { profileId } })                       │
  │                                                                           │
  │  -- Cascade via profile_photos → gallery_photos:                          │
  │  tx.profileGalleryPhoto.deleteMany({                                     │
  │    where: { profilePhoto: { profileId } }                                │
  │  })                                                                       │
  │  tx.profilePhoto.deleteMany({ where: { profileId } })                   │
  │                                                                           │
  │  -- Related records:                                                      │
  │  tx.verificationQueue.deleteMany({ where: { profileId } })               │
  │  tx.shortlist.deleteMany({ where: { profileId } })                       │
  │  tx.profileStateHistory.deleteMany({ where: { profileId } })             │
  │  tx.profileReview.deleteMany({ where: { profileId } })                   │
  │                                                                           │
  │  -- Finally the profile row itself:                                       │
  │  tx.profile.delete({ where: { id: profileId } })                         │
  └──────────────────────────────────────────────────────────────────────────┘

NOTE: This is a HARD DELETE (rows removed).
      Contrast with user-facing draft delete (Pipeline 2) which is soft-delete.
```

---

### S4: manageProfileUploads [INSIDE $transaction]

```
====================================================================================
S4: manageProfileUploads (→ DELETE_PENDING)
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.profileId, ctx.storageService

Collect upload IDs (same as subpipeline/manage-profile-uploads.md):
  — primary_upload_id from profile_photos
  — upload_id from profile_gallery_photos (via profile_photo join)
  — rasi_chart_upload_id, navamsa_chart_upload_id from profile_horoscopes

storageService.bulkTransitionStatus(uploadIds, ['TEMP','ATTACHED','ACTIVE'], 'DELETE_PENDING', tx)
  → UPDATE uploads SET status = 'DELETE_PENDING'
     WHERE id IN (:uploadIds) AND status IN ('TEMP', 'ATTACHED', 'ACTIVE')
```

---

### S5: recordAdminAction [INSIDE $transaction]

```
====================================================================================
S5: recordAdminAction (composed sub-pipeline)
────────────────────────────────────────────────────────────────────────────────────
INSERT INTO profile_state_history (profile_id, changed_by_account_id,
    from_status, to_status)
  VALUES (:profileId, :accountId, ctx.profile.current_status, 'DELETED')

INSERT INTO profile_reviews (profile_id, reviewed_by_account_id,
    action, note, created_at)
  VALUES (:profileId, :accountId, 'DELETE', ctx.input.reason, NOW())

INSERT INTO audit_log (actor_id, action_type, target_type, target_id,
    description, created_at)
  VALUES (:accountId, 'DELETE_PROFILE', 'PROFILE', :profileId,
          'Admin deleted profile' + (reason ? ': ' + reason : ''), NOW())

See subpipeline/record-admin-action.md for details.
```

---

### S6: sendNotification [POST-TRANSACTION]

```
====================================================================================
S6: sendNotification
────────────────────────────────────────────────────────────────────────────────────
ownerAccountId = ctx.profile.accountId

Template: 'profile_deleted'
  Message: "Your profile has been deleted by an administrator."
  + (reason ? "\nReason: " + reason : "")
Targets: owner email + in-app notification
```

---

### S7: setResponse

```
====================================================================================
S7: setResponse
────────────────────────────────────────────────────────────────────────────────────
ctx.responseData = {
  profileId: ctx.profileId,
  status: 'DELETED',
  deleted: true,
}
```

## Dependencies

| File | Role |
|------|------|
| `common/profile/steps/permissionGate.step.ts` | Route-level role ACL (ADMIN) |
| `common/profile/steps/resolveProfile.step.ts` | Profile lookup |
| `common/profile/steps/deleteProfileCascade.step.ts` | 11-table CASCADE delete |
| `common/profile/subpipeline/manage-profile-uploads.md` | Upload → DELETE_PENDING |
| `common/profile/subpipeline/record-admin-action.md` | History + review + audit |
| `common/profile/steps/sendNotifications.step.ts` | Owner notification |
| `common/profile/steps/setResponse.step.ts` | Response shape |
