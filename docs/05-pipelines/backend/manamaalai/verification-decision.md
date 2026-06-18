# Pipeline 10: verification-decision

> **For beginners**: When a profile is submitted for review, admins approve
> or reject it. This pipeline handles the decision, notifies the owner, and
> updates related records.

## Purpose

Replaces `approveProfile()` and `rejectProfile()` in `admin-verification.service.ts`. A merged pipeline that handles both decisions via a `decision` parameter, sharing 10 of 13 steps identically. Only branches on queue status update, upload transition, and notification template. Saves ~60 lines versus two separate pipelines.

## Actor & Entry

| Route | Method | decision | Rate Limiter |
|-------|--------|----------|-------------|
| `/admin/verification/:id/approve` | POST | `approve` | `adminMutationLimiter` (30/window) |
| `/admin/verification/:id/reject` | POST | `reject` | `adminMutationLimiter` (30/window) |

**Allowed Roles:** `ADMIN` (via `requireSession` + `requireRole('ADMIN')` middleware)

## High-Level Architecture

```
  ┌─ POST /admin/verification/:id/approve  → decision = 'approve'
  │  POST /admin/verification/:id/reject   → decision = 'reject'
  ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  VerificationController                                               │
  │  const ctx = {                                                        │
  │    input:      { profileId: req.params.id, note: req.body.note },     │
  │    accountId:  req.account.sub,                                       │
  │    roles:      req.roles,                                             │
  │    decision:   req.path.includes('/approve') ? 'approve' : 'reject',  │
  │    storageService: this.storageService,                               │
  │    ipAddress:  req.ip,                                                │
  │  };                                                                    │
  │  const result = await verificationDecisionPipeline(ctx);              │
  │  sendSuccess(res, result);                                             │
  └──────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  PipelineRunner.run(steps, ctx)                                      │
  │                                                                       │
  │  ┌── S1-S4: PRE-TRANSACTION ───────────────────────────────┐        │
  │  │  S1. permissionGate                                           │        │
  │  │  S2. resolveProfile(id, ['PENDING'], ADMIN)                   │        │
  │  │     (includes JOIN with basic + account for self-check)       │        │
  │  │  S3. checkQueue (must exist, not completed)                   │        │
  │  │  S4. checkSelfApproval [approve only]                         │        │
  │  └───────────────────────────────────────────────────────────────┘        │
  │  ┌── S5-S8: INSIDE $transaction ────────────────────────────┐          │
  │  │  S5. updateProfileStatus(PENDING → ACTIVE|REJECTED)         │          │
  │  │  S6. manageProfileUploads [approve only: → ACTIVE]          │          │
  │  │  S7. updateQueue(completed_at, decision)                    │          │
  │  │  S8. recordAdminAction (stateHistory + review + audit)      │          │
  │  └─────────────────────────────────────────────────────────────┘          │
  │  ┌── S9-S10: POST-TRANSACTION ──────────────────────────┐              │
  │  │  S9. sendNotification(ownerId, decision template)       │              │
  │  │  S10. setResponse(profileId, decision)                  │              │
  │  └──────────────────────────────────────────────────────────┘              │
  └────────────────────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture — Step by Step

---

### S1: permissionGate

```
====================================================================================
S1: permissionGate
────────────────────────────────────────────────────────────────────────────────────
action = 'profile:verification-decide'

┌────────────────────────┬─────────────────────┐
│ Action                 │ Allowed Roles       │
├────────────────────────┼─────────────────────┤
│ profile:verification-decide │ ['ADMIN'] │
└────────────────────────┴─────────────────────┘

if ctx.roles does not include any allowed role
  → AppError(401, AUTH_PORTAL_MISMATCH)

Output: ctx (unaltered)
```

---

### S2: resolveProfile (with owner info)

```
====================================================================================
S2: resolveProfile (with owner info)
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.input.profileId

Query:
  SELECT p.id, p.current_status, p.account_id, p.reg_no,
         pb.gender, pb.dob,
         a.email, a.phone
  FROM profiles p
  JOIN profile_basic pb ON pb.profile_id = p.id
  JOIN accounts a ON a.id = p.account_id
  WHERE p.id = :profileId

if not found → AppError(404, PROFILE_NOT_FOUND)
if current_status != 'PENDING' → AppError(400, PROFILE_NOT_PENDING)

Output: ctx.profile = { id, status: 'PENDING', accountId, regNo, gender, dob,
                        ownerEmail, ownerPhone }
```

---

### S3: checkQueue

```
====================================================================================
S3: checkQueue
────────────────────────────────────────────────────────────────────────────────────
Query:
  SELECT id, status, submitted_at, completed_at, reviewed_by
  FROM verification_queue
  WHERE profile_id = :profileId

if not found → AppError(400, PROFILE_NOT_IN_QUEUE)
if completed_at IS NOT NULL → AppError(400, QUEUE_ALREADY_PROCESSED)
  (double-processing guard)

Output: ctx.queueEntry = { id, submittedAt, reviewedBy? }
```

---

### S4: checkSelfApproval [CONDITIONAL — approve only]

```
====================================================================================
S4: checkSelfApproval
────────────────────────────────────────────────────────────────────────────────────
Only runs when ctx.decision == 'approve'

if ctx.profile.accountId == ctx.accountId
  → AppError(403, CANNOT_APPROVE_SELF)

For reject: self-approval check NOT needed
  (rejected profiles can be rejected by anyone)

Output: ctx (unaltered)
```

---

### S5: updateProfileStatus [INSIDE $transaction]

```
====================================================================================
S5: updateProfileStatus
────────────────────────────────────────────────────────────────────────────────────
targetStatus = (ctx.decision == 'approve') ? 'ACTIVE' : 'REJECTED'

UPDATE profiles
SET current_status = :targetStatus, updated_at = NOW()
WHERE id = :profileId

Output: ctx.targetStatus
```

---

### S6: manageProfileUploads [CONDITIONAL — approve only, in $transaction]

```
====================================================================================
S6: manageProfileUploads
────────────────────────────────────────────────────────────────────────────────────
Only runs when ctx.decision == 'approve'
  (rejected profile uploads stay ATTACHED — user can resubmit)

Collect all upload IDs (same as subpipeline/manage-profile-uploads.md):
  — primary_upload_id from profile_photos
  — upload_id from profile_gallery_photos
  — rasi_chart_upload_id, navamsa_chart_upload_id from profile_horoscopes

storageService.bulkTransitionStatus(uploadIds, ['TEMP','ATTACHED'], 'ACTIVE', tx)
  → UPDATE uploads SET status = 'ACTIVE'
     WHERE id IN (:uploadIds) AND status IN ('TEMP', 'ATTACHED')
```

---

### S7: updateQueue [INSIDE $transaction]

```
====================================================================================
S7: updateQueue
────────────────────────────────────────────────────────────────────────────────────
decisionStatus = (ctx.decision == 'approve') ? 'APPROVED' : 'REJECTED'

UPDATE verification_queue
SET status = :decisionStatus,
    completed_at = NOW(),
    reviewed_by = :accountId
WHERE id = :queueEntryId
```

---

### S8: recordAdminAction [INSIDE $transaction]

```
====================================================================================
S8: recordAdminAction (composed sub-pipeline)
────────────────────────────────────────────────────────────────────────────────────
actionLabel = (ctx.decision == 'approve') ? 'APPROVED' : 'REJECTED'

INSERT INTO profile_state_history (profile_id, changed_by_account_id,
    from_status, to_status)
  VALUES (:profileId, :accountId, 'PENDING', :targetStatus)

INSERT INTO profile_reviews (profile_id, reviewed_by_account_id,
    action, note, created_at)
  VALUES (:profileId, :accountId, actionLabel, ctx.input.note, NOW())

INSERT INTO audit_log (actor_id, action_type, target_type, target_id,
    description, created_at)
  VALUES (:accountId, actionLabel + '_PROFILE', 'PROFILE', :profileId,
          'Admin ' + (ctx.decision == 'approve' ? 'approved' : 'rejected') + ' verification',
          NOW())

See subpipeline/record-admin-action.md for details.
```

---

### S9: sendNotification [POST-TRANSACTION]

```
====================================================================================
S9: sendNotification
────────────────────────────────────────────────────────────────────────────────────
┌─ decision == 'approve' ────────────────────────────────────────────────────────┐
│  Template: 'profile_approved'                                                   │
│  Message: "Congratulations! Your profile (RegNo: {regNo}) has been approved     │
│            and is now visible to other members."                                │
└─────────────────────────────────────────────────────────────────────────────────┘
┌─ decision == 'reject' ─────────────────────────────────────────────────────────┐
│  Template: 'profile_rejected'                                                   │
│  Message: "Your profile (RegNo: {regNo}) has been rejected.                     │
│            {note ? 'Reason: ' + note : ''}"                                     │
│  Note: "You can edit your profile and resubmit for review."                     │
└─────────────────────────────────────────────────────────────────────────────────┘

Targets: ctx.profile.ownerEmail + in-app notification
```

---

### S10: setResponse

```
====================================================================================
S10: setResponse
────────────────────────────────────────────────────────────────────────────────────
ctx.responseData = {
  profileId: ctx.profileId,
  status: ctx.targetStatus,
  decision: ctx.decision,
}
```

## Dependencies

| File | Role |
|------|------|
| `common/profile/steps/permissionGate.step.ts` | Route-level role ACL |
| `common/profile/steps/resolveProfile.step.ts` | Profile lookup (with owner) |
| `common/profile/steps/checkQueue.step.ts` | Queue entry validation |
| `common/profile/steps/checkSelfApproval.step.ts` | Approve-only guard |
| `common/profile/steps/updateProfileStatus.step.ts` | Status UPDATE |
| `common/profile/subpipeline/manage-profile-uploads.md` | Upload → ACTIVE (approve) |
| `common/profile/steps/updateQueue.step.ts` | Queue completion |
| `common/profile/subpipeline/record-admin-action.md` | History + review + audit |
| `common/profile/steps/sendNotifications.step.ts` | Owner notification |
| `common/profile/steps/setResponse.step.ts` | Response shape |
