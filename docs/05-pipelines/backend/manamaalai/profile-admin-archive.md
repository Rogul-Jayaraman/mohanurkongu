# Pipeline 8: profile-admin-archive

> **For beginners**: Admins can archive (hide from public) or restore
> profiles. Archived profiles are invisible to regular users but not deleted.

## Purpose

Replaces `archiveProfile()` and `restoreProfile()` in `admin-profiles.service.ts`. Two sub-flows: archive transitions ACTIVE → ARCHIVED, restore transitions ARCHIVED → ACTIVE. Both require `reasonEn` (archive only), record admin action, and notify the profile owner.

## Actor & Entry

| Route | Method | action | Rate Limiter |
|-------|--------|--------|-------------|
| `/admin/profiles/:id/archive` | POST | `archive` | `adminMutationLimiter` (30/window) |
| `/admin/profiles/:id/restore` | POST | `restore` | `adminMutationLimiter` (30/window) |

**Allowed Roles:** `ADMIN` only

## High-Level Architecture

```
  ┌─ POST /admin/profiles/:id/archive  → action = 'archive'
  │  POST /admin/profiles/:id/restore  → action = 'restore'
  ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  AdminProfilesController                                              │
  │  const ctx = {                                                        │
  │    input:      { profileId: req.params.id, reasonEn?, reasonTa? },    │
  │    accountId:  req.account.sub,                                       │
  │    roles:      req.roles,                                             │
  │    action:     req.path.includes('/archive') ? 'archive' : 'restore', │
  │    ipAddress:  req.ip,                                                │
  │  };                                                                    │
  │  const result = await profileAdminArchivePipeline(ctx);               │
  │  sendSuccess(res, result);                                             │
  └──────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  PipelineRunner.run(steps, ctx)                                      │
  │                                                                       │
  │  ┌── S1-S3: PRE-TRANSACTION ──────────────────────────────┐         │
  │  │  S1. permissionGate (ADMIN only)                           │         │
  │  │  S2. resolveProfile(id, ANY_STATUS, ADMIN)                 │         │
  │  │  S3. checkProfileState (transition matrix)                 │         │
  │  │      ACTIVE → ARCHIVED  (archive)                          │         │
  │  │      ARCHIVED → ACTIVE  (restore)                          │         │
  │  └────────────────────────────────────────────────────────────┘         │
  │  ┌── S4-S5: INSIDE $transaction ─────────────────────────┐           │
  │  │  S4. updateProfileStatus(profileId, targetStatus)        │           │
  │  │  S5. recordAdminAction (stateHistory + review + audit)   │           │
  │  └──────────────────────────────────────────────────────────┘           │
  │  ┌── S6-S7: POST-TRANSACTION ────────────────────────────┐            │
  │  │  S6. sendNotification(ownerId, template)                │            │
  │  │  S7. setResponse(profileId, newStatus, action)          │            │
  │  └──────────────────────────────────────────────────────────┘            │
  └──────────────────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture — Step by Step

---

### S1: permissionGate

```
====================================================================================
S1: permissionGate (ADMIN only)
────────────────────────────────────────────────────────────────────────────────────
action = (ctx.action == 'archive') ? 'profile:admin-archive' : 'profile:admin-restore'

┌────────────────────┬──────────────────┐
│ Action             │ Allowed Roles    │
├────────────────────┼──────────────────┤
│ profile:admin-archive  │ ['ADMIN']      │
│ profile:admin-restore  │ ['ADMIN']      │
└────────────────────┴──────────────────┘

Only ADMIN role can archive and restore profiles.

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
  (no additional status restriction — ADMIN can archive/restore from any compatible status)

Output: ctx.profile = { id, status, accountId }
```

---

### S3: checkProfileState (transition matrix)

```
====================================================================================
S3: checkProfileState
────────────────────────────────────────────────────────────────────────────────────
ctx.targetStatus = (ctx.action == 'archive') ? 'ARCHIVED' : 'ACTIVE'

Transition matrix:
  ┌─────────────────────────┬───────────┬───────────┬──────────┐
  │ action   │ from        │ to        │ valid?    │          │
  ├──────────┼─────────────┼───────────┼───────────┤          │
  │ archive  │ ACTIVE      │ ARCHIVED  │ ✅ YES   │          │
  │ archive  │ (anything else) │ ARCHIVED  │ ❌ NO    │          │
  │ restore  │ ARCHIVED    │ ACTIVE    │ ✅ YES   │          │
  │ restore  │ (anything else) │ ACTIVE    │ ❌ NO    │          │
  └──────────┴─────────────┴───────────┴───────────┘          │

if !valid → AppError(400, PROFILE_WRONG_STATUS)

Output: ctx.targetStatus
```

---

### S4: updateProfileStatus [INSIDE $transaction]

```
====================================================================================
S4: updateProfileStatus
────────────────────────────────────────────────────────────────────────────────────
UPDATE profiles
SET current_status = :targetStatus, updated_at = NOW()
WHERE id = :profileId
```

---

### S5: recordAdminAction [INSIDE $transaction]

```
====================================================================================
S5: recordAdminAction (composed sub-pipeline)
────────────────────────────────────────────────────────────────────────────────────
INSERT INTO profile_state_history (profile_id, changed_by_account_id,
    from_status, to_status)
  VALUES (:profileId, :accountId, :fromStatus, :targetStatus)

actionLabel = (ctx.action == 'archive') ? 'ARCHIVE' : 'RESTORE'

INSERT INTO profile_reviews (profile_id, reviewed_by_account_id,
    action, note, created_at)
  VALUES (:profileId, :accountId, actionLabel,
          ctx.input.reasonEn ?? null, NOW())

INSERT INTO audit_log (actor_id, action_type, target_type, target_id,
    description, created_at)
  VALUES (:accountId, actionLabel + '_PROFILE', 'PROFILE', :profileId,
          'Admin ' + actionLabel + 'd profile', NOW())

See subpipeline/record-admin-action.md for details.
```

---

### S6: sendNotifications [POST-TRANSACTION]

```
====================================================================================
S6: sendNotifications
────────────────────────────────────────────────────────────────────────────────────
ownerAccountId = ctx.profile.accountId

┌─ action == 'archive' ───────────────────────────────────────────────────┐
│  Template: 'profile_archived'                                            │
│  Message: "Your profile has been archived. Reason: [reasonEn]"          │
│  Targets: owner email + in-app notification                              │
└──────────────────────────────────────────────────────────────────────────┘
┌─ action == 'restore' ───────────────────────────────────────────────────┐
│  Template: 'profile_restored'                                            │
│  Message: "Your profile has been restored and is now visible."          │
│  Targets: owner email + in-app notification                              │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### S7: setResponse

```
====================================================================================
S7: setResponse
────────────────────────────────────────────────────────────────────────────────────
ctx.responseData = {
  profileId: ctx.profileId,
  status: ctx.targetStatus,
  action: ctx.action,
}
```

## Dependencies

| File | Role |
|------|------|
| `common/profile/steps/permissionGate.step.ts` | Route-level role ACL (ADMIN) |
| `common/profile/steps/resolveProfile.step.ts` | Profile lookup |
| `common/profile/steps/checkProfileState.step.ts` | State machine (ACTIVE→ARCHIVED, ARCHIVED→ACTIVE) |
| `common/profile/steps/updateProfileStatus.step.ts` | Status UPDATE |
| `common/profile/subpipeline/record-admin-action.md` | History + review + audit |
| `common/profile/steps/sendNotifications.step.ts` | Owner notification |
| `common/profile/steps/setResponse.step.ts` | Response shape |
