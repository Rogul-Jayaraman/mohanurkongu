# Sub-Pipeline B: record-admin-action

> **For beginners**: Shared logic for recording the audit trail whenever
> an admin does something — state history, review notes, and system audit
> log. Used by multiple admin pipelines.

## Purpose

A composed step reused by 5 parent pipelines to write the three-record audit trail that every admin action requires: a state history entry, a review entry with note, and a system audit log. Eliminates duplicated code across profile-admin-update, profile-admin-archive, profile-admin-delete, and verification-decision.

## Used By

| Parent Pipeline | action Value | fromStatus | toStatus |
|----------------|-------------|-----------|----------|
| profile-admin-update (Pipeline 7) | `UPDATE` | PENDING | PENDING |
| profile-admin-archive (Pipeline 8) | `ARCHIVE` | ACTIVE | ARCHIVED |
| profile-admin-archive.restore (Pipeline 8) | `RESTORE` | ARCHIVED | ACTIVE |
| profile-admin-delete (Pipeline 9) | `DELETE` | any non-deleted | DELETED |
| verification-decision.approve (Pipeline 10) | `APPROVED` | PENDING | ACTIVE |
| verification-decision.reject (Pipeline 10) | `REJECTED` | PENDING | REJECTED |

## Architecture

```
  ┌──────────────────────────────────────────────────────────────────┐
  │  recordAdminAction(ctx)                                           │
  │                                                                   │
  │  INSIDE $transaction (parent provides tx):                        │
  │                                                                   │
  │  ┌── S1: INSERT profile_state_history ─────────────────────┐    │
  │  │  profileId, actorId, fromStatus, toStatus                 │    │
  │  └──────────────────────────────────────────────────────────┘    │
  │                                                                   │
  │  ┌── S2: INSERT profile_reviews ───────────────────────────┐    │
  │  │  profileId, actorId, action, note                         │    │
  │  └──────────────────────────────────────────────────────────┘    │
  │                                                                   │
  │  ┌── S3: INSERT audit_log ────────────────────────────────┐    │
  │  │  actorId, actionType, targetType, targetId, description │    │
  │  └──────────────────────────────────────────────────────────┘    │
  └──────────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture

---

### S1: recordStateHistory

```
====================================================================================
S1: recordStateHistory
────────────────────────────────────────────────────────────────────────────────────
Append-only state transition log (each status change creates a new row).

INSERT INTO profile_state_history (profile_id, changed_by_account_id, from_status, to_status)
VALUES (:profileId, :actorId, :fromStatus, :toStatus)

Input: { profileId, actorId, fromStatus?, toStatus }
WRITE: profile_state_history (INSERT)
```

---

### S2: recordReviewEntry

```
====================================================================================
S2: recordReviewEntry
────────────────────────────────────────────────────────────────────────────────────
Action→review.action mapping:
  ┌─────────────┬──────────────┐
  │ action      │ reviewValue  │
  ├─────────────┼──────────────┤
  │ UPDATE      │ 'UPDATE'     │
  │ ARCHIVE     │ 'ARCHIVE'    │
  │ RESTORE     │ 'RESTORE'    │
  │ DELETE      │ 'DELETE'     │
  │ APPROVED    │ 'APPROVED'   │
  │ REJECTED    │ 'REJECTED'   │
  └─────────────┴──────────────┘

INSERT INTO profile_reviews (profile_id, reviewed_by_account_id, action, note, created_at)
VALUES (:profileId, :actorId, :action, :note ?? null, NOW())

Input: { profileId, actorId, action, note? }
WRITE: profile_reviews (INSERT)
```

---

### S3: recordAuditLog

```
====================================================================================
S3: recordAuditLog
────────────────────────────────────────────────────────────────────────────────────
Description generation:
  ┌─────────────┬────────────────────────────────────────────────────┐
  │ action      │ description                                        │
  ├─────────────┼────────────────────────────────────────────────────┤
  │ UPDATE      │ 'Admin updated profile sections'                   │
  │ ARCHIVE     │ 'Admin archived profile' + (note ? ': ' + note)    │
  │ RESTORE     │ 'Admin restored profile from archive'              │
  │ DELETE      │ 'Admin deleted profile' + (note ? ': ' + note)     │
  │ APPROVED    │ 'Admin approved verification'                      │
  │ REJECTED    │ 'Admin rejected verification' + (note ? ': ' + nt) │
  └─────────────┴────────────────────────────────────────────────────┘

INSERT INTO audit_log (actor_id, action_type, target_type, target_id, description, created_at)
VALUES (:actorId, :action + '_PROFILE', 'PROFILE', :profileId, :description, NOW())

Input: { actorId, action, profileId, note? }
WRITE: audit_log (INSERT)
```

## Interface

```
  recordAdminAction(ctx: {
    profileId: string,
    actorId: string,
    fromStatus?: string,
    toStatus: string,
    action: 'UPDATE' | 'ARCHIVE' | 'RESTORE' | 'DELETE' | 'APPROVED' | 'REJECTED',
    note?: string,
  }): Promise<void>
```

## Dependencies

| File | Role |
|------|------|
| `prisma/schema.prisma` | `profile_state_history`, `profile_reviews`, `audit_log` models |
