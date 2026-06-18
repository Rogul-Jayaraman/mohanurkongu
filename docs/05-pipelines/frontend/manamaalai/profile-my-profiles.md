# Pipeline 13: profile-my-profiles (Frontend)

> **For beginners**: Frontend side of "My Profiles" page. Lists the
> user's profiles with status badges and quick actions.

## Purpose

User's profile management page showing all their created profiles with status badges and context-sensitive action buttons. Supports search by regNo/name, and in-page delete with confirmation for deletable statuses.

## Actor & Entry

| Route | URL Params | Role | Validation |
|---|---|---|---|
| `/manamaalai/my-profiles` | `?search=` | USER | — |

**Allowed Roles:** `USER`

## High-Level Architecture

```
  ┌─ /manamaalai/my-profiles
  │  ProtectedRoute → USER
  ▼
  ┌──────────────────────────────────────────────────────────────────────────┐
  │  MyProfiles.tsx (Orchestrator)                                            │
  │                                                                           │
  │  STATE: profiles[], loading, searchTerm, deleteConfirmation              │
  │  HOOKS: useMyProfiles                                                     │
  │                                                                           │
  │  ┌── onMount ──────────────────────────────────────────────────┐         │
  │  │  S1. fetchMyProfiles() → GET /profiles/my                    │         │
  │  └───────────────────────────────────────────────────────────────┘         │
  │                                                                           │
  │  ┌── render ────────────────────────────────────────────────────┐        │
  │  │  S2. findSearchMatch(profiles, searchTerm) → filtered list    │        │
  │  │  S3. profileCard(profile) → statusBadge + actionButtons      │        │
  │  │      statusBadge: DRAFT (gray), PENDING (yellow),            │        │
  │  │                  ACTIVE (green), EXPIRED (red),               │        │
  │  │                  REJECTED (orange), ARCHIVED (blue)           │        │
  │  │      actionButtons: per status (see decision matrix below)   │        │
  │  └────────────────────────────────────────────────────────────────┘       │
  │                                                                           │
  │  ┌── handleAction(profile, action) ────────────────────────────┐         │
  │  │  S4. match action to pipeline:                               │         │
  │  │      EDIT   → navigate(`/new-profile?id=${id}`)              │         │
  │  │      VIEW   → navigate(`/profile/${id}`)                    │         │
  │  │      DELETE → openDeleteConfirm(profileId)                  │         │
  │  │      RESUME → navigate(`/new-profile?draft=${id}`)          │         │
  │  │      REACTIVATE → navigate(`/new-profile?id=${id}`)        │         │
  │  └────────────────────────────────────────────────────────────────┘       │
  │                                                                           │
  │  ┌── handleDelete ────────────────────────────────────────────┐          │
  │  │  S5. deleteMyProfile(profileId) → DELETE /profiles/:id      │          │
  │  │  S6. removeFromList(profileId)                             │          │
  │  │  S7. onDeleteError → deleteErrorMatrix                    │          │
  │  └──────────────────────────────────────────────────────────────┘          │
  └──────────────────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture — Step by Step

---

### S1: fetchMyProfiles

```
====================================================================================
S1: fetchMyProfiles
────────────────────────────────────────────────────────────────────────────────────
Input: none

  setLoading(true);
  try {
    const profiles = await getMyProfiles();
    // GET /profiles/my
    // Backend: returns array of user's profiles with all statuses
    setProfiles(profiles);
  } catch (err) {
    ┌─ listError matrix ────────────────────────────────────────────────┐
    │  NETWORK_ERROR → showErrorState() with retry CTA                  │
    └────────────────────────────────────────────────────────────────────┘
  } finally {
    setLoading(false);
  }

Output: profiles[] state set
```

---

### S2: search filter

```
====================================================================================
S2: search filter
────────────────────────────────────────────────────────────────────────────────────
Input: searchTerm, profiles[]

  if (!searchTerm) return profiles;

  const term = searchTerm.toLowerCase();
  return profiles.filter(p =>
    p.regNo?.toLowerCase().includes(term) ||
    p.translations?.some(t =>
      t.firstName?.toLowerCase().includes(term) ||
      t.lastName?.toLowerCase().includes(term)
    )
  );

Output: filtered list
```

---

### S3: status-based action buttons

```
====================================================================================
S3: status-based action buttons
────────────────────────────────────────────────────────────────────────────────────
Input: profile.status

  ┌──────────────┬─────────────────────────────────────────────────────┐
  │ Status       │ Action Buttons                                     │
  ├──────────────┼─────────────────────────────────────────────────────┤
  │ DRAFT        │ [Edit] [Delete]  (resume editing, or discard)      │
  │ PENDING      │ [View] [Delete]  (cannot edit, view status)        │
  │ ACTIVE       │ [View]           (live profile, limited actions)   │
  │ EXPIRED      │ [Resume] [Delete] (re-activate with form)          │
  │ REJECTED     │ [View] [Delete]  (view rejection reason)           │
  │ ARCHIVED     │ [View]           (read-only, no delete)            │
  │ DELETED      │ (not shown — filtered out)                         │
  └──────────────┴─────────────────────────────────────────────────────┘

Output: Card rendered with appropriate action buttons
```

---

### S5: deleteMyProfile

```
====================================================================================
S5: deleteMyProfile API
────────────────────────────────────────────────────────────────────────────────────
Input: profileId

  setDeleting(true);
  try {
    await deleteMyProfile(profileId);
    // DELETE /profiles/:id
    // Backend: validates status is DRAFT | PENDING | EXPIRED | REJECTED
    //          then marks as DELETED
    setProfiles(prev => prev.filter(p => p.id !== profileId));
    toast.success('Profile deleted');
  } catch (err) {
    handleDeleteError(err);
  } finally {
    setDeleting(false);
  }

  ┌─ deleteError matrix ────────────────────────────────────────────────┐
  │  400 CANNOT_DELETE → toast('This profile cannot be deleted in its   │
  │                       current status')                               │
  │  404 NOT_FOUND     → toast('Profile not found') + remove from list  │
  │  NETWORK_ERROR     → toast(getErrorMessage(err))                    │
  └──────────────────────────────────────────────────────────────────────┘

Output: Profile removed from list
```

## Dependencies

| File | Role |
|---|---|
| `components/features/user/MyProfiles.tsx` | Orchestrator component |
| `api/profile.api.ts` | getMyProfiles, deleteMyProfile |
| `lib/errors.ts` | isAppError, getErrorMessage |
