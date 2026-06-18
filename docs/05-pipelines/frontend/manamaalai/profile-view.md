# Pipeline 3: profile-view (Frontend)

> **For beginners**: Frontend side of viewing a profile. Fetches data,
> applies field gating based on membership tier, and renders the profile
> detail page.

## Purpose

Replaces the monolithic detail rendering in `ProfileView.tsx` (1348 lines). Handles invitation-to-chat quota enforcement, field-level role gating (self vs admin vs public), inline edit readiness check, and 4 distinct UI states: skeleton loading, full detail, gallery carousel (lightbox), and error.

## Actor & Entry

| Route | URL Params | Role | Validation |
|---|---|---|---|
| `/manamaalai/profile/:id` | `:id` (profile ID) | USER, ADMIN (role-gated fields) | `profile.status` must be non-deleted |

**Allowed Roles:** `USER`, `ADMIN` (renders with role-gated field visibility)

## High-Level Architecture

```
  ┌─ /manamaalai/profile/:id
  │  ProtectedRoute (any authenticated role)
  ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │  ProfileView.tsx (Orchestrator)                                         │
  │                                                                         │
  │  STATE: profile, loading, error, lightboxOpen, lightboxIndex,          │
  │         inviteSent, canInvite                                           │
  │  HOOKS: useProfileView, useLightbox, useInviteQuota                    │
  │                                                                         │
  │  ┌── onMount ────────────────────────────────────────────────────┐    │
  │  │  S1. fetchProfile(id) → GET /profiles/:id                      │    │
  │  │  S2. checkInviteQuota(currentUserId) → GET /quotas/invites    │    │
  │  │  S3. determineRole(user, profile) → viewerRole                 │    │
  │  └─────────────────────────────────────────────────────────────────┘    │
  │                                                                         │
  │  ┌── render gallery ─────────────────────────────────────────────┐     │
  │  │  S4. imageGallery(photos) → grid + lightbox                   │     │
  │  └────────────────────────────────────────────────────────────────┘     │
  │                                                                         │
  │  ┌── field gating logic ─────────────────────────────────────────┐     │
  │  │  S5. fieldVisibility(profile, viewerRole) → visibilityMap     │     │
  │  │      ┌──────────────────────────────────────────────────┐     │     │
  │  │      │ viewerRole │ visibleFields                        │     │     │
  │  │      ├────────────┼──────────────────────────────────────┤     │     │
  │  │      │ self       │ ALL fields (including hidden for      │     │     │
  │  │      │            │ 3rd-party, edit actions)             │     │     │
  │  │      │ admin      │ ALL fields, admin actions             │     │     │
  │  │      │ admin      │ ALL fields, admin actions (archive)   │     │     │
  │  │      │ public     │ Visible fields only, invite CTA       │     │     │
  │  │      └──────────────────────────────────────────────────┘     │     │
  │  └────────────────────────────────────────────────────────────────┘     │
  │                                                                         │
  │  ┌── handleInvite ──────────────────────────────────────────────┐     │
  │  │  S6. inviteToChat(profileId) → POST /chats/invite            │     │
  │  │      ┌─ quota exceeded → toast with Upgrade CTA             │     │
  │  │      └─ success → setInviteSent(true), decrement quota      │     │
  │  └────────────────────────────────────────────────────────────────┘     │
  └──────────────────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture — Step by Step

---

### S1: fetchProfile

```
====================================================================================
S1: fetchProfile
────────────────────────────────────────────────────────────────────────────────────
Input: profileId from URL params

  setLoading(true);
  try {
    const response = await getProfileById(profileId);
    // GET /profiles/:id
    // Backend: returns full profile (field-level gating)
    //          includes profile.photos, translations, horoscope, partnerPref
    setProfile(response);
  } catch (err) {
    handleProfileError(err);
  } finally {
    setLoading(false);
  }

  ┌─ fetchProfile error matrix ─────────────────────────────────────────┐
  │  404 NOT_FOUND → showNotFound() (full error page with illustration)  │
  │                  Children: "This profile does not exist or has been  │
  │                            removed."                                 │
  │                  CTA: "Browse Profiles" → /manamaalai/browse         │
  │                                                                      │
  │  403 FORBIDDEN → showForbidden() with upgrade CTA                   │
  │                  "Upgrade your plan to view this profile"            │
  │                  CTA: "View Plans" → /manamaalai/plans               │
  │                                                                      │
  │  NETWORK_ERROR → showErrorState() with retry CTA                    │
  │  default       → showErrorState(getErrorMessage(err))               │
  └──────────────────────────────────────────────────────────────────────┘

Output: profile state set, or error page rendered
```

---

### S2: checkInviteQuota

```
====================================================================================
S2: checkInviteQuota
────────────────────────────────────────────────────────────────────────────────────
Input: currentUserId

  try {
    const quota = await getInviteQuota();
    // GET /quotas/invites
    // Returns: { total, used, remaining, plan }
    if (quota.remaining <= 0) {
      setCanInvite(false);
      setQuotaPlan(quota.plan);
    }
  } catch {
    // Quota check failure is non-critical; allow invite attempt
    // Error will surface in handleInvite
  }

Output: canInvite flag and quota info
```

---

### S3: determineRole

```
====================================================================================
S3: determineRole
────────────────────────────────────────────────────────────────────────────────────
Input: currentUser, profile

  let viewerRole: 'self' | 'admin' | 'public';

  if (profile.createdBy === currentUser.id) viewerRole = 'self';
  else if (currentUser.role === 'ADMIN') viewerRole = 'admin';
  else viewerRole = 'public';

Output: viewerRole used for field gating
```

---

### S4: imageGallery (lightbox)

```
====================================================================================
S4: imageGallery
────────────────────────────────────────────────────────────────────────────────────
Input: profile.photos (primary + gallery array)

  ┌── Lightbox state machine ─────────────────────────────────────────────┐
  │  closed → tap gallery image → open(sourceIndex) → lightbox renders   │
  │  open → tap overlay / Escape → close                                 │
  │  open → tap left/right arrow → navigate(prev/next)                   │
  │  open → tap delete (self only) → confirm delete image                │
  └───────────────────────────────────────────────────────────────────────┘

Output: Lightbox component rendered or dismissed
```

---

### S5: fieldVisibility

```
====================================================================================
S5: fieldVisibility
────────────────────────────────────────────────────────────────────────────────────
Input: profile, viewerRole

  For 'self': return all fields
  For 'admin': return all fields + admin actions
  For 'public':
    return VISIBLE_FIELDS map — predefined set of allowed fields
    Hide: private contact info, horoscope details (unless shared)

  Rendered sections: Basic Info, Community, Family, Assets, Partner Preference,
                     Horoscope (conditional), Gallery, Actions (role-dependent)

  ┌─ Role-based actions ─────────────────────────────────────────────────┐
  │  self:     Edit, Delete (my-profiles behavior per status)            │
  │  admin:    Archive, Delete, View Audit, Edit                        │
  │  admin:    Archive, Delete, View Audit, Edit                        │
  │  public:   Send Invite, Shortlist (heart toggle)                   │
  └──────────────────────────────────────────────────────────────────────┘

Output: visibilityMap: Record<string, boolean> for each section
```

---

### S6: handleInvite

```
====================================================================================
S6: handleInvite
────────────────────────────────────────────────────────────────────────────────────
Input: profileId

  setInviting(true);
  try {
    await inviteToChat(profileId);
    // POST /chats/invite
    setInviteSent(true);
  } catch (err) {
    ┌─ inviteError matrix ───────────────────────────────────────────────┐
    │  403 INVITE_QUOTA_EXCEEDED → toast.error(                          │
    │    'You have reached your invitation limit.') +                    │
    │    [Upgrade] CTA → navigate('/manamaalai/plans')                   │
    │                                                                     │
    │  409 ALREADY_INVITED → toast('You already sent an invitation to   │
    │                       this profile')                                │
    │                                                                     │
    │  400 SELF_INVITE → toast.error('You cannot invite yourself')       │
    │                                                                     │
    │  NETWORK_ERROR → toast(getErrorMessage(err))                       │
    └─────────────────────────────────────────────────────────────────────┘
  } finally {
    setInviting(false);
  }

Output: invite sent or quota upgrade CTA shown
```

## Dependencies

| File | Role |
|---|---|
| `components/features/user/ProfileView.tsx` | Orchestrator component |
| `hooks/useProfileForm.ts` | (not used here, but shares types) |
| `api/profile.api.ts` | getProfileById |
| `api/verification.api.ts` | getInviteQuota, inviteToChat |
| `lib/errors.ts` | isAppError, getErrorMessage |
