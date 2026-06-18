# Pipeline 5: profile-shortlist (Frontend)

> **For beginners**: Frontend side of shortlisting profiles. Toggle
> shortlist with optimistic UI update (instant feedback, syncs in
> background).

## Purpose

Manages the shortlist (favorites) toggle on profile cards and the paginated shortlist list page. Optimistic UI updates for heart icon toggle with rollback on failure. The list page supports cursor-based pagination matching the browse pattern.

## Actor & Entry

| Route | URL Params | Role | Validation |
|---|---|---|---|
| `/manamaalai/my-profiles` (inline toggle) | — | USER | Must not be self-profile |
| `/manamaalai/shortlist` | — | USER | — |

**Allowed Roles:** `USER`

## High-Level Architecture

```
  ┌─ Toggle (inline, any profile card)      ┌─ /manamaalai/shortlist
  │                                         │
  S1. checkNotSelf(profileId, userId)       S1. loadShortlist(cursor?)
  S2. optimisticHeartToggle(newState)        S2. paginate results
  S3. addToShortlist / removeFromShortlist   S3. handleRemove inline
  S4. rollback on error
  │                                         │
  └─ Updates heart UI immediately ──────────┘
```

## Low-Level Architecture — Step by Step

---

### S1: optimistic toggle (from profile card)

```
====================================================================================
S1: optimistic toggle
────────────────────────────────────────────────────────────────────────────────────
Trigger: user clicks heart icon on any ProfileCard

  Guard: if (profileId === currentUser.profileId) {
    toast('You cannot shortlist your own profile');
    return;
  }

  const newState = !currentlyShortlisted;

  // OPTIMISTIC: update UI immediately
  updateCardShortlistState(profileId, newState);

  try {
    if (newState) {
      await addToShortlist(profileId);   // POST /profiles/:id/shortlist
    } else {
      await removeFromShortlist(profileId); // DELETE /profiles/:id/shortlist
    }
  } catch (err) {
    // ROLLBACK: revert to previous state
    updateCardShortlistState(profileId, !newState);
    handleToggleError(err);
  }

  ┌─ shortlistError matrix ──────────────────────────────────────────────┐
  │  404 NOT_FOUND → toast('This profile no longer exists')              │
  │  400 SELF_SHORTLIST → toast('You cannot shortlist yourself')         │
  │  409 ALREADY_SHORTLISTED (add) → silently update state to true      │
  │  409 NOT_SHORTLISTED (remove) → silently update state to false      │
  │  NETWORK_ERROR → toast('Action failed, please try again')            │
  └──────────────────────────────────────────────────────────────────────┘

Output: Icon toggled (with rollback on error)
```

---

### S2: loadShortlist list

```
====================================================================================
S2: loadShortlist
────────────────────────────────────────────────────────────────────────────────────
Trigger: /manamaalai/shortlist mount

  setLoading(true);
  try {
    const response = await getShortlist(cursor);
    // GET /profiles/shortlist?cursor=abc
    // Backend: returns { data: ProfileCard[], cursor: string | null }
    setProfiles(response.data);
    setCursor(response.cursor);
    setHasMore(response.cursor !== null);
  } catch (err) {
    ┌─ listError matrix ─────────────────────────────────────────────────┐
    │  404 NOT_FOUND → showEmptyState('No shortlisted profiles yet')     │
    │  NETWORK_ERROR → showErrorState() with retry CTA                   │
    └─────────────────────────────────────────────────────────────────────┘
  } finally {
    setLoading(false);
  }

Output: Shortlist displayed with pagination controls
```

## Dependencies

| File | Role |
|---|---|
| `components/features/user/ShortlistSection.tsx` | Inline toggle wrapper |
| `api/profile.api.ts` | addToShortlist, removeFromShortlist, getShortlist |
| `lib/errors.ts` | isAppError, getErrorMessage |
