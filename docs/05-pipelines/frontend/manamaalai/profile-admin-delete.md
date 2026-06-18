# Pipeline 9: profile-admin-delete (Frontend)

> **For beginners**: Frontend side of admin deleting a profile.
> Confirmation flow with reason input and cache invalidation.

## Purpose

Hard delete (soft-delete actually, marking as DELETED status) for ADMINs only. Irreversible action from the user's perspective, requiring double confirmation. Different from the EXPIRED delete in `profile-draft` — this is an admin-initiated delete on any status.

## Actor & Entry

| Trigger | Source | Role | Validation |
|---|---|---|---|
| Click "Delete" in admin detail panel | Admin profile list detail | ADMIN only | Double confirmation |

**Allowed Roles:** `ADMIN` only

## High-Level Architecture

```
  ┌─ Admin detail panel → [Delete] button
  │  Guard: currentUser.role !== 'ADMIN' → hidden entirely
  ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │  DeleteConfirmDialog (step 1)                                    │
  │  "Are you sure you want to delete profile {regNo}?"             │
  │  "This action cannot be undone. The user will lose all data."    │
  │                                                                  │
  │  [Cancel]  [Continue]                                            │
  └──────────────────────────────┬───────────────────────────────────┘
                                 │
  ┌──────────────────────────────▼───────────────────────────────────┐
  │  DeleteConfirmDialog (step 2 — escalation)                       │
  │  "Type DELETE to confirm:"                                       │
  │  [________]                                                      │
  │                                                                  │
  │  [Cancel]  [Delete (disabled until input matches "DELETE")]     │
  └──────────────────────────────┬───────────────────────────────────┘
                                 │
  ┌── handleConfirm ────────────▼────────────────────────────────────┐
  │  S1. deleteProfile(profileId) → DELETE /admin/profiles/:id       │
  │  S2. onSuccess → refresh list, close panel, toast success        │
  │  S3. onError   → errorToast                                      │
  └──────────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture — Step by Step

---

### S1: deleteProfile API

```
====================================================================================
S1: deleteProfile API
────────────────────────────────────────────────────────────────────────────────────
Input: profileId (from selected profile in admin list)

  setDeleting(true);
  try {
    await deleteProfile(profileId);
    // DELETE /admin/profiles/:id
    // Backend: sets status = DELETED, removes from all indices
    //          Notify user via notification system
    toast.success('Profile deleted successfully');
    onDeleteSuccess();
  } catch (err) {
    handleDeleteError(err);
  } finally {
    setDeleting(false);
  }

  ┌─ deleteError matrix ────────────────────────────────────────────────┐
  │  404 NOT_FOUND → toast('Profile not found') + remove from list      │
  │                  (idempotent: profile already removed)               │
  │                                                                      │
  │  403 FORBIDDEN → toast('Only administrators can delete profiles')    │
  │                                                                      │
  │  400 CANNOT_DELETE → toast('This profile cannot be deleted in its   │
  │                       current status')                               │
  │                                                                      │
  │  NETWORK_ERROR → toast(getErrorMessage(err))                        │
  └──────────────────────────────────────────────────────────────────────┘

Output: Profile removed, list refreshed
```

## Dependencies

| File | Role |
|---|---|
| `components/features/admin/DeleteConfirmDialog.tsx` | Two-step confirmation dialog |
| `api/verification.api.ts` | deleteProfile |
| `lib/errors.ts` | isAppError, getErrorMessage |
