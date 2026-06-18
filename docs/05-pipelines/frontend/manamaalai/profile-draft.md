# Pipeline 2: profile-draft (Frontend)

> **For beginners**: Frontend side of resuming or deleting a draft.
> Handles loading saved data from IndexedDB and showing the draft
> management UI.

## Purpose

Handles the draft resume and delete actions for the EXPIRED confirmation dialog in `ProfileView.tsx`. When a profile's status is EXPIRED, the user sees a dialog with two CTAs: **Resume** (navigates to form with restored data) and **Delete** (deletes expired profile). The actions are duplicated from `MyProfiles` but need to work from the detail view context.

## Actor & Entry

| Route | Trigger | Role | Validation |
|---|---|---|---|
| `/manamaalai/profile/:id` → dialog | EXPIRED status guard in `ProfileView` | USER | Status must be `EXPIRED` |

**Allowed Roles:** `USER`

## High-Level Architecture

```
  ┌─ ProfileView (EXPIRED guard)
  │  ResumeCTA ─┐    DeleteCTA ─┐
  │             ▼                ▼
  │  ┌─────────────────┐  ┌───────────────────────┐
  │  │ resumeDraft(id)  │  │ deleteExpired(id)     │
  │  │ → POST profiles/ │  │ → DELETE profiles/    │
  │  │   draft/:id      │  │   expired/:id         │
  │  └────────┬─────────┘  └──────────┬────────────┘
  │           │                        │
  │           ▼                        ▼
  │  Navigate /new-profile?id=...  Navigate /my-profiles
  │  (hydrates from server draft)  (profile removed)
  └───────────────────────────────────────────────────
```

## Low-Level Architecture — Step by Step

---

### S1: detect EXPIRED status

```
====================================================================================
S1: detect EXPIRED status
────────────────────────────────────────────────────────────────────────────────────
Trigger: on mount in ProfileView

  if (profile.status === 'EXPIRED') {
    showExpiredDialog = true;
    return { showDialog: true, profileId: profile.id, deletedAt: profile.deletedAt };
  }

  If deletedAt is > 30 days, hide delete button (TTL expired on backend).

Output: showExpiredDialog state = true
```

---

### S2: handleResume

```
====================================================================================
S2: handleResume
────────────────────────────────────────────────────────────────────────────────────
Input: profileId

  setResuming(true);
  try {
    await resumeDraft(profileId);
    // POST /profiles/draft/:id
    // Backend: resets status to DRAFT, re-uses existing profile
    navigate(`/manamaalai/new-profile?id=${profileId}`);
  } catch (err) {
    handleResumeError(err);
  } finally {
    setResuming(false);
  }

  ┌─ resumeError matrix ────────────────────────────────────────────────┐
  │  404 NOT_FOUND → toast('Profile no longer available')               │
  │  400 BAD_REQUEST → toast('Unable to resume this draft')             │
  │  NETWORK_ERROR → toast(getErrorMessage(err))                        │
  └──────────────────────────────────────────────────────────────────────┘

Output: Navigated to form with draft restored (server hydration via S2 in profile-upsert)
```

---

### S3: handleDeleteExpired

```
====================================================================================
S3: handleDeleteExpired
────────────────────────────────────────────────────────────────────────────────────
Input: profileId

  setDeleting(true);
  try {
    await deleteExpired(profileId);
    // DELETE /profiles/expired/:id  (soft-delete, idempotent)
    // Backend: marks as DELETED if status == EXPIRED
    navigate('/manamaalai/my-profiles');
  } catch (err) {
    handleDeleteError(err);
  } finally {
    setDeleting(false);
  }

  ┌─ deleteError matrix ────────────────────────────────────────────────┐
  │  404 NOT_FOUND → toast('This profile was already removed') +       │
  │                  navigate('/my-profiles')                            │
  │  400 BAD_REQUEST → toast('Only expired profiles can be deleted')    │
  │  NETWORK_ERROR → toast(getErrorMessage(err))                        │
  └──────────────────────────────────────────────────────────────────────┘

Output: Navigated to /my-profiles
```

## Dependencies

| File | Role |
|---|---|
| `components/features/user/ProfileView.tsx` | EXPIRED dialog rendering |
| `api/profile.api.ts` | resumeDraft, deleteExpired |
| `lib/errors.ts` | getErrorMessage, isAppError |
