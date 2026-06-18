# Sub-Pipeline A: manage-profile-uploads

> **For beginners**: Shared logic for managing profile photo uploads.
> Used by draft deletion, admin deletion, and verification approval.
> Think of it as a helper that several pipelines call.

## Purpose

A composed step reused by 3 parent pipelines to manage upload lifecycle transitions. Eliminates duplicated upload ID collection + bulk status transition logic across profile-draft.delete, profile-admin-delete, and verification-decision.approve.

## Used By

| Parent Pipeline | Mode | fromStatuses | toStatus |
|-----------------|------|-------------|----------|
| profile-draft (delete) — Pipeline 2 | `deleteAll` | `ATTACHED`, `ACTIVE` | `DELETE_PENDING` |
| profile-admin-delete — Pipeline 9 | `deleteAll` | `TEMP`, `ATTACHED`, `ACTIVE` | `DELETE_PENDING` |
| verification-decision (approve) — Pipeline 10 | `activateAll` | `TEMP`, `ATTACHED` | `ACTIVE` |

## Architecture

```
  ┌────────────────────────────────────────────────────────────────────┐
  │  manageProfileUploads(storageService, profileId, mode)             │
  │                                                                     │
  │  ┌── S1: collectUploadIds ───────────────────────────────┐        │
  │  │  Gather all upload UUIDs from 3 profile tables          │        │
  │  └────────────────────────────────────────────────────────┘        │
  │                                                                     │
  │  ┌── S2: bulkTransitionStatus ───────────────────────────┐        │
  │  │  UPDATE uploads SET status = :toStatus                  │        │
  │  │  WHERE id IN (:uploadIds) AND status IN (:fromStatuses) │        │
  │  └────────────────────────────────────────────────────────┘        │
  └────────────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture

---

### S1: collectUploadIds

```
====================================================================================
S1: collectUploadIds
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.profileId

uploadIds = []

-- Primary photo:
SELECT primary_upload_id FROM profile_photos WHERE profile_id = :profileId
  → if result?.primary_upload_id: uploadIds.push(result.primary_upload_id)

-- Gallery photos:
SELECT pgp.upload_id
FROM profile_gallery_photos pgp
JOIN profile_photos pp ON pp.id = pgp.profile_photo_id
WHERE pp.profile_id = :profileId
  → uploadIds.push(...results)

-- Horoscope charts:
SELECT rasi_chart_upload_id, navamsa_chart_upload_id
FROM profile_horoscopes WHERE profile_id = :profileId
  → if result?.rasi_chart_upload_id: uploadIds.push(result.rasi_chart_upload_id)
  → if result?.navamsa_chart_upload_id: uploadIds.push(result.navamsa_chart_upload_id)

uploadIds = [...new Set(uploadIds)]  -- deduplicate

Output: ctx.uploadIds = string[]
```

---

### S2: bulkTransitionStatus

```
====================================================================================
S2: bulkTransitionStatus
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.uploadIds (deduplicated), ctx.storageService

┌─ ctx.mode == 'deleteAll' ────────────────────────────────────────────┐
│  fromStatuses = ['TEMP','ATTACHED','ACTIVE']  (admin-delete)          │
│  fromStatuses = ['ATTACHED','ACTIVE']         (user draft-delete)     │
│  toStatus = 'DELETE_PENDING'                                          │
└───────────────────────────────────────────────────────────────────────┘
┌─ ctx.mode == 'activateAll' ───────────────────────────────────────────┐
│  fromStatuses = ['TEMP','ATTACHED']                                   │
│  toStatus = 'ACTIVE'                                                  │
└───────────────────────────────────────────────────────────────────────┘

storageService.bulkTransitionStatus(uploadIds, fromStatuses, toStatus, tx)
  → prisma.upload.updateMany({
      where: { id: { in: uploadIds }, status: { in: fromStatuses } },
      data: { status: toStatus }
    })

if updateMany.count != uploadIds.length
  → AppError(400, UPLOAD_INVALID_STATUS)
  (some uploads already transitioned to wrong state)

Output: void
```

## Interface

```
  manageProfileUploads(ctx: {
    storageService: StorageService,
    profileId: string,
    mode: 'deleteAll' | 'activateAll',
  }): Promise<void>
```

## Dependencies

| File | Role |
|------|------|
| `modules/storage/storage.service.ts` | `bulkTransitionStatus()` |
