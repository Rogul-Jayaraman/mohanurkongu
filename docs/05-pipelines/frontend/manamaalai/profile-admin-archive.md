# Pipeline 8: profile-admin-archive (Frontend)

> **For beginners**: Frontend side of archiving or restoring profiles.
> Confirmation dialogs and success/error feedback.

## Purpose

Hard archive for an admin to remove a profile from public browse while retaining data for audit purposes. ADMIN-only action triggered from admin detail panel.

## Actor & Entry

| Trigger | Source | Role | Validation |
|---|---|---|---|
| Click "Archive" in admin detail panel | Admin profile list detail | ADMIN only | `currentUser.role === 'ADMIN'` |

**Allowed Roles:** `ADMIN` only

## High-Level Architecture

```
  ┌─ Admin detail panel → [Archive] button
  │  Guard: currentUser.role !== 'ADMIN' → disabled
  ▼
  ┌──────────────────────────────────────────────────────┐
  │  ConfirmationDialog                                  │
  │  "Are you sure you want to archive profile {regNo}? │
  │  This will remove it from public view."              │
  │                                                      │
  │  [Cancel]  [Archive]                                 │
  └──────────────────────────────┬───────────────────────┘
                                 │
  ┌── handleConfirm ────────────▼────────────────────────┐
  │  S1. validateStatusForArchive(profile.status)         │
  │  S2. archiveProfile(profileId) → PATCH /admin/       │
  │                              profiles/:id/archive    │
  │  S3. onSuccess → refresh list, close detail          │
  │  S4. onError   → errorModal                          │
  └──────────────────────────────────────────────────────┘
```

## Low-Level Architecture — Step by Step

---

### S1: validate status for archive

```
====================================================================================
S1: validate status for archive
────────────────────────────────────────────────────────────────────────────────────
Input: profile.status

  const ARCHIVEABLE_STATUSES = ['ACTIVE', 'PENDING', 'DRAFT', 'EXPIRED'];

  if (!ARCHIVEABLE_STATUSES.includes(profile.status)) {
    toast.error('This profile cannot be archived in its current status');
    return false;  // do not open confirm dialog
  }

  return true;

Output: boolean pass/fail → open confirm dialog or abort
```

---

### S2: archiveProfile API

```
====================================================================================
S2: archiveProfile API
────────────────────────────────────────────────────────────────────────────────────
Input: profileId, reason (optional, from dialog textarea)

  setArchiving(true);
  try {
    await archiveProfile(profileId, reason);
    // PUT /admin/profiles/:id/archive
    // Backend: sets status = ARCHIVED, logs action, removes from browse
  } catch (err) {
    handleArchiveError(err);
  } finally {
    setArchiving(false);
  }

  ┌─ archiveError matrix ────────────────────────────────────────────────┐
  │  400 CANNOT_ARCHIVE → toast('Profile cannot be archived in          │
  │                       {currentStatus} status')                       │
  │  404 NOT_FOUND     → toast('Profile not found')                     │
  │  403 FORBIDDEN     → toast('Only administrators can archive')       │
  │  NETWORK_ERROR     → toast(getErrorMessage(err))                    │
  └──────────────────────────────────────────────────────────────────────┘

Output: Profile archived, list refreshed
```

## Dependencies

| File | Role |
|---|---|
| `components/features/admin/ArchiveConfirmDialog.tsx` | Confirmation dialog with optional reason |
| `api/verification.api.ts` | archiveProfile |
| `lib/errors.ts` | isAppError, getErrorMessage |
