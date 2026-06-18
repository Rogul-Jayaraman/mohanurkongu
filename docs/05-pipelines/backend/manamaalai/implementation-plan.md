# Profile Pipelines Implementation Plan

> **For beginners**: This is a planning document — it maps out how the
> profile system was refactored from old monolithic code into the current
> pipeline architecture. Useful for understanding design decisions.

## Overview

This plan converts the gap analysis between the current monolithic profile implementation (~8000+ combined lines across NewProfile.tsx, ProfileView.tsx, BrowseProfiles.tsx) and the 13-pipeline architecture documented in `pipelines/frontend/profiles/` and `pipelines/profiles/`.

**Key architectural changes:**
1. Backend: Add claim/unclaim, audit trail, enhanced stats endpoints
2. Frontend: Extract monolithic components into hook-driven orchestrator pattern
3. Frontend: Add error-code-specific UX for all 17 documented error codes
4. Frontend: Add role-based field gating (self/admin/public)
5. Frontend: Add search level gates, invite quota, abort controllers

**Current state (line counts):**
- `NewProfile.tsx` (component): 1321 lines — monolithic 7-step form
- `ProfileView.tsx` (component): 1279 lines — monolithic detail view
- `BrowseProfiles.tsx` (component): 346 lines — partially refactored
- Backend admin-profiles: ADMIN-only with audit trail support

---

## Phase 0: Pre-work & Dependency Verification

**Goal:** Confirm all building blocks exist before creating pipelines.

| What | File | Status |
|------|------|--------|
| Prisma Client singleton | `backend/src/database/prisma.ts` | ✅ Exists |
| AppError class | `backend/src/common/errors/AppError.ts` | ✅ Exists |
| ErrorCodes constants | `backend/src/common/errors/ErrorCodes.ts` | ✅ Exists (needs additions) |
| role.guard.ts (ADMIN) | `backend/src/common/guards/role.guard.ts` | ✅ Exists (ADMIN-only guard) |
| requireAuth middleware | `backend/src/common/middleware/requireAuth.ts` | ✅ Exists |
| Rate limiter factory | `backend/src/modules/shared/rateLimiter.ts` | ✅ Exists |
| Audit event helpers | `backend/src/common/utils/audit.ts` | ✅ Exists |
| Prisma schema (profiles) | `backend/prisma/schema.prisma` | ✅ VERIFIER role removed — ADMIN only |
| IndexedDB hooks | `frontend/src/lib/indexeddb.ts` | ✅ Exists |
| AppError type guards | `frontend/src/lib/errors.ts` | ✅ Exists |
| Axios interceptor | `frontend/src/lib/api.ts` | ⚠️ Needs AbortError handling |
| useAuth context | `frontend/src/hooks/useAuth.tsx` | ✅ Exists |
| Profile types | `frontend/src/types/profile.ts` | ⚠️ Needs expansion |
| Adapters | `frontend/src/adapters/profile.adapter.ts` | ⚠️ Needs admin adapters |
| Validation schema | `frontend/src/validation/profile-schema.ts` | ⚠️ Needs admin validation |

---

## Phase 1: Admin Route Guard Consolidation

**Note:** The VERIFIER role was briefly introduced then removed. All admin routes now use `requireRole('ADMIN')` — a single ADMIN role handles all verification, profile management, archive/restore/delete operations. The VERIFIER role enum value has been removed from the schema.

All admin routes are guarded with `requireRole('ADMIN')`:
  - `admin-verification.routes.ts` — all endpoints use `requireRole('ADMIN')`
  - `admin-profiles.routes.ts` — all endpoints use `requireRole('ADMIN')`

---

## Phase 2: New Backend Endpoints

### Task 2.1: Add audit trail endpoint

```
New file: backend/src/modules/admin-profiles/dto/ (if not exists)

 Endpoint: GET /admin/profiles/:id/audit
 Guard: requireRole('ADMIN')

Backend service method: getAuditTrail(profileId) → {
  stateHistory: ProfileStateHistory[]  (last 50, ordered desc)
  reviews: ProfileReview[]             (last 10, ordered desc)
  queue: VerificationQueue | null       (current queue entry)
}

Implementation in admin-profiles.repository.ts:
  findAuditTrail(profileId) → Prisma query with:
    profileStateHistory: { where: { profileId }, orderBy: { createdAt: 'desc' }, take: 50 },
    profileReviews: { where: { profileId }, orderBy: { createdAt: 'desc' }, take: 10 },
    verificationQueue: { where: { profileId, status: 'PENDING' } }

Response shape:
  GET /admin/profiles/:id/audit → {
    success: true,
    data: {
      stateHistory: [{ from, to, changedBy, changedAt, reason }],
      reviews: [{ adminName, decision, comment, createdAt }],
      queue: { stage, assignedTo, priority, createdAt } | null
    }
  }
```

**Note:** This is a separate endpoint from the detail endpoint. The detail endpoint (`GET /admin/profiles/:id`) returns the full profile; the audit endpoint returns history. Frontend calls both in parallel.

---

### Task 2.2: Add claim/unclaim endpoints

```
Change file: backend/src/modules/admin-verification/admin-verification.routes.ts

Add routes:
  POST /admin/verification/:id/claim     → controller.claim
  POST /admin/verification/:id/unclaim   → controller.unclaim

  Guard: requireRole('ADMIN')

Controller methods (admin-verification.controller.ts):
  claim(ctx) {
    const profileId = ctx.params.id;
    const adminId = ctx.account.id;
    await this.adminVerificationService.claimQueue(profileId, adminId);
    return sendSuccess(res, { claimed: true });
  }

  unclaim(ctx) {
    const profileId = ctx.params.id;
    const adminId = ctx.account.id;
    await this.adminVerificationService.unclaimQueue(profileId, adminId);
    return sendSuccess(res, { claimed: false });
  }

Service methods (admin-verification.service.ts):
  claimQueue(profileId, adminId):
    - Check queue entry exists and status is PENDING
    - Check queue entry.reviewedBy is null
    - Update queue entry: reviewedBy = adminId, status = 'IN_REVIEW' (or keep PENDING)
    - Write profile_state_history entry
    - Write admin_audit_event

  unclaimQueue(profileId, adminId):
    - Check queue entry exists and reviewedBy === adminId
    - Update queue entry: reviewedBy = null
    - Write admin_audit_event

Repository methods (admin-verification.repository.ts):
  findQueueEntry(profileId) → verification_queue row
  updateQueueEntry(id, data) → updated queue entry
```

---

### Task 2.3: Expand verification stats

```
Change file: backend/src/modules/admin-verification/admin-verification.repository.ts

  getQueueStats() → {
    pendingTotal: number,
    pendingToday: number,       // submitted today
    approvedToday: number,      // approved today
    rejectedToday: number,      // rejected today
    avgReviewTimeHours: number  // 30-day rolling average
  }

Implementation:
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [pendingTotal, pendingToday, approvedToday, rejectedToday] =
    await Promise.all([
      prisma.profile.count({ where: { currentStatus: 'PENDING' } }),
      prisma.profile.count({
        where: { currentStatus: 'PENDING', createdAt: { gte: today } }
      }),
      prisma.verificationQueue.count({
        where: { decision: 'APPROVED', decidedAt: { gte: today } }
      }),
      prisma.verificationQueue.count({
        where: { decision: 'REJECTED', decidedAt: { gte: today } }
      })
    ]);

  // avgReviewTimeHours: average time between queue.createdAt and queue.decidedAt
  // for entries decided in the last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const avgResult = await prisma.verificationQueue.aggregate({
    _avg: { reviewTimeMinutes: true },
    where: { decidedAt: { gte: thirtyDaysAgo }, decision: { not: null } }
  });
  const avgReviewTimeHours = (avgResult._avg.reviewTimeMinutes ?? 0) / 60;

```

---

### Task 2.4: Add sort + filter improvements to admin profiles list

```
Change file: backend/src/modules/admin-profiles/admin-profiles.controller.ts

  list(req) params:
    Current: page, limit, search, status
    Add:     sortBy (createdAt | updatedAt | regNo),
             sortOrder (asc | desc),
             communityId,
             regNo (exact match),
             createdAtFrom, createdAtTo

Change file: backend/src/modules/admin-profiles/admin-profiles.repository.ts

  findAll(params) with new filters:
    where: {
      ...(params.search && {
        OR: [
          { regNo: { contains: params.search } },
          { translations: { some: { firstName: { contains: params.search } } } },
          { account: { email: { contains: params.search } } },
        ]
      }),
      ...(params.status && { currentStatus: params.status }),
      ...(params.communityId && { communityId: params.communityId }),
      ...(params.regNo && { regNo: params.regNo }),
      ...(params.createdAtFrom && { createdAt: { gte: params.createdAtFrom } }),
      ...(params.createdAtTo && { createdAt: { lte: params.createdAtTo } }),
    },
    orderBy: { [params.sortBy || 'createdAt']: params.sortOrder || 'desc' }
```

---

### Task 2.5: Write profile_reviews for all admin actions

```
Change file: backend/src/modules/admin-profiles/admin-profiles.service.ts

For each admin action (update, archive, restore, delete), add a profile_reviews entry:

  await prisma.profileReview.create({
    data: {
      profileId,
      reviewerId: adminId,
      decision: 'UPDATE' | 'ARCHIVE' | 'RESTORE' | 'DELETE',
      comment: reason || `${action} by admin`,
    }
  });

Currently only verification approve/reject write to profile_reviews. This ensures
the audit trail is complete for all admin actions.
```

---

### Task 2.6: Add sendNotification for archive/restore/delete

```
Change file: backend/src/modules/admin-profiles/admin-profiles.service.ts

After archive/restore/delete, enqueue a notification:

  await notificationService.sendProfileNotification({
    type: 'PROFILE_ARCHIVED' | 'PROFILE_RESTORED' | 'PROFILE_DELETED',
    profileId,
    accountId: profile.createdById,
    reason: reason || undefined,
  });

  Note: notificationService may need a new method or use the existing email.queue.ts.
  If notification infrastructure doesn't support profile notifications yet,
  add a new queue worker or inline email send.
```

---

## Phase 3: Frontend Hook Extraction

### Task 3.1: Create useProfileView hook

```
New file: frontend/src/hooks/useProfileView.ts

Purpose: Extract all data-fetching, role-determination, and capability logic
  from the 1279-line ProfileView.tsx into a clean hook.

Public API:
  const {
    profile,              // Profile | null
    loading,              // boolean
    error,                // AppError | null (not just boolean)
    viewerRole,           // 'self' | 'admin' | 'public'
    capabilities,         // CapabilitySnapshot | null
    inviteQuota,          // { remaining: number, total: number } | null
    inviteSent,           // boolean
    shortlisted,          // boolean (current state for this profile)
    lightboxOpen,         // boolean
    lightboxIndex,        // number
    handleInvite,         // () => Promise<void>
    handleToggleShortlist,// () => Promise<void>
    handleLightboxOpen,   // (index: number) => void
    handleLightboxClose,  // () => void
    handleRetry,          // () => void
  } = useProfileView(profileId);

Internal flow:
  S1. Create AbortController on mount, abort on unmount
  S2. fetchProfile(profileId, signal) → GET /profiles/:id
  S3. checkInviteQuota(signal) → GET /quotas/invites (parallel with S4)
  S4. checkShortlistStatus(profileId, signal) → GET /profiles/shortlisted (parallel with S3)
  S5. determineRole(currentUser, profile) → self | admin | public
  S6. determineCapabilities(currentUser) → BASIC | EXTENDED | ADVANCED | FULL
  S7. On error: set typed error (NOT_FOUND, FORBIDDEN, NETWORK_ERROR)
  S8. On 403 FORBIDDEN: set error with upgradeCTA path
  S9. On 404 NOT_FOUND: set error with browseProfilesCTA path

Error handling per pipeline (profile-view.md S1):
  ┌─────────────────────┬────────────────────────────────────────────────┐
  │ 404 NOT_FOUND       → error type: 'NOT_FOUND' with browse CTA       │
  │ 403 FORBIDDEN       → error type: 'FORBIDDEN' with upgrade CTA      │
  │ NETWORK_ERROR       → error type: 'NETWORK_ERROR' with retry CTA    │
  │ default             → error type: 'UNKNOWN' with generic message    │
  └─────────────────────┴────────────────────────────────────────────────┘
```

---

### Task 3.2: Create useImageUpload hook

```
New file: frontend/src/hooks/useImageUpload.ts

Purpose: Extract image compression + upload logic from NewProfile.tsx (currently
  inline in Step6Gallery section).

Public API:
  const {
    uploadImage,          // (file: File, fieldName: string) => Promise<UploadResult>
    deleteImage,          // (uploadId: string) => Promise<void>
    isUploading,          // boolean
    uploadProgress,       // number (0-100)
    uploadError,          // string | null
    abortUpload,          // () => void
  } = useImageUpload();

Internal flow:
  S1. compressImage(file) → canvas pipeline (max 1800px, WebP Q85, ≤3MB)
  S2. uploadFile(formData) with AbortController
  S3. Return { uploadId, url }
  S4. On error: map to specific error codes (413, NETWORK_ERROR)
```

---

### Task 3.3: Extract step components from NewProfile

```
New files under: frontend/src/components/features/user/form-steps/

  Step1Personal.tsx       (from NewProfile.tsx lines 804-865)
  Step2Combined.tsx       (from NewProfile.tsx lines 871-910)
  Step3Family.tsx         (from NewProfile.tsx lines 916-986)
  Step4Assets.tsx         (from NewProfile.tsx lines 992-1032)
  Step5Horoscope.tsx      (from NewProfile.tsx lines 253-429)
  Step6Gallery.tsx        (from NewProfile.tsx lines 1044-1269)
  Step7Review.tsx         (from NewProfile.tsx lines 1275-1410)
  index.ts                (re-exports all steps)

Each step receives typed props:
  { formData, fieldErrors, touchedFields, onUpdateField, onBlurField, language }

The main NewProfile orchestrator (remainder, ~280 lines) imports and renders
the current step component based on `currentStep`.
```

---

### Task 3.4: Extract section components from ProfileView

```
New files under: frontend/src/components/features/user/profile-sections/

  ProfileHeaderSection.tsx      (from ProfileView.tsx lines 132-288)
  StatusReasonsSection.tsx      (from ProfileView.tsx lines 293-335)
  PersonalSection.tsx           (from ProfileView.tsx lines 340-416)
  CommunitySection.tsx          (from ProfileView.tsx lines 421-508)
  ProfessionalSection.tsx       (from ProfileView.tsx lines 513-578)
  FamilySection.tsx             (from ProfileView.tsx lines 583-694)
  AssetsSection.tsx             (from ProfileView.tsx lines 699-755)
  PartnerPreferenceSection.tsx  (from ProfileView.tsx lines 760-842)
  ContactSection.tsx            (from ProfileView.tsx lines 847-878)
  HoroscopeSection.tsx          (from ProfileView.tsx lines 882-978)
  GallerySection.tsx            (from ProfileView.tsx lines 983-1040)
  LockedSectionUpgrade.tsx      (from ProfileView.tsx lines 1045-1056)
  ActionBar.tsx                 — NEW — role-gated action buttons
  index.ts                      (re-exports all sections)

ActionBar renders per viewerRole:
  ┌────────────┬─────────────────────────────────────────────────────┐
  │ self       → [Edit] [Delete] (navigates to my-profiles)          │
  │ admin      → [Archive] [Delete] [Edit] [View Audit]              │
  │ admin      → [Archive] [Delete] [Edit] [View Audit]              │
  │ public     → [Send Invite] [Shortlist] (heart toggle)            │
  └────────────┴─────────────────────────────────────────────────────┘

The ProfileView orchestrator's remaining code (~200 lines) imports sections
and passes profile data + visibility flags.
```

---

## Phase 4: Frontend Error Handling & Role Gating

### Task 4.1: Add error-code-specific handling to all components

```
Change files:
  frontend/src/hooks/useProfileView.ts
  frontend/src/components/features/user/NewProfile.tsx
  frontend/src/hooks/useProfileBrowse.ts
  frontend/src/components/features/user/BrowseProfiles.tsx
  frontend/src/components/features/user/MyProfiles.tsx
  frontend/src/components/features/user/Shortlist.tsx

Pattern for all catch blocks (replace generic toast):
  catch (err) {
    if (!isAppError(err)) {
      toast.error(getErrorMessage(err));
      return;
    }

    // AppError with errorCode
    switch (err.code) {
      case 'VALIDATION_ERROR':
        if (isValidationError(err)) {
          setFieldErrors(err.details);  // per-field errors
        } else {
          toast.error(t(err.code));     // generic validation toast
        }
        break;

      case 'DUPLICATE_PROFILE':
        toast.error(t('myprofiles:duplicate_profile'));
        break;

      case 'MEMBERSHIP_SLOT_LIMIT_REACHED':
        toast.error(t('profile_new:slot_limit'));
        // Show upgrade CTA button
        setShowUpgradeCTA(true);
        break;

      case 'UPLOAD_NOT_FOUND':
        toast.error(t('profile_new:upload_not_found'));
        break;

      case 'INVITE_QUOTA_EXCEEDED':
        toast.error(t('profile_view:quota_exceeded'));
        setShowUpgradeCTA(true);
        break;

      case 'SELF_INVITE':
        toast.error(t('profile_view:self_invite'));
        break;

      case 'ALREADY_INVITED':
        toast.info(t('profile_view:already_invited'));
        break;

      // etc. for all 17 documented error codes

      default:
        toast.error(getErrorMessage(err));
    }
  }
```

---

### Task 4.2: Add role determination to ProfileView

```
Integrated into useProfileView hook (Task 3.1):

  viewerRole = determineRole(currentUser, profile);

  determineRole(user, profile):
    if (profile.createdBy === user.id) return 'self';
    // VERIFIER role was removed — only ADMIN remains
    if (user.roles?.includes('ADMIN')) return 'admin';
    return 'public';

  visibilityMap = computeFieldVisibility(viewerRole):
    ┌────────────┬──────────────────────────────────────────────────┐
    │ self       → ALL fields visible                               │
    │ admin      → ALL fields visible + admin actions               │
    │ public     → VISIBLE_FIELDS only (no contact, no horoscope   │
    │              unless shared), invite/shortlist CTAs            │
    └────────────┴──────────────────────────────────────────────────┘
```

---

### Task 4.3: Add invite functionality

```
Integrated into useProfileView hook:

  handleInvite:
    S1. guard: if (viewerRole !== 'public') return  // only public can invite
    S2. guard: if (inviteSent) return                 // already sent
    S3. guard: if (inviteQuota.remaining <= 0) {
      toast.error + upgrade CTA; return
    }
    S4. POST /chats/invite (api call)
    S5. On success: setInviteSent(true), decrement local quota
    S6. On error: error matrix per profile-view.md S6

  Requires new API functions in frontend/src/api/profile.api.ts:
    getInviteQuota() → GET /quotas/invites
    inviteToChat(profileId) → POST /chats/invite
```

---

### Task 4.4: Add search level gate to BrowseProfiles

```
Change file: frontend/src/hooks/useProfileBrowse.ts

  Add to return value: searchLevel: 'BASIC' | 'PREMIUM' | 'VIP'

  In the component:
    const MAX_RESULTS = {
      BASIC: 3,
      PREMIUM: 50,
      VIP: Infinity,
    };

    const gatedProfiles = profiles.slice(0, MAX_RESULTS[searchLevel]);

    if (searchLevel === 'BASIC' && profiles.length > 3) {
      showUpgradeCTA = true;  // render upgrade banner below results
    }
```

---

### Task 4.5: Add AbortController support to all API functions

```
Change file: frontend/src/api/profile.api.ts

  Add AbortSignal parameter to:
    browseProfiles(params, cursor?, signal?)
    fetchProfile(id, signal?)
    fetchMyProfiles(signal?)
    resumeDraft(id, signal?)

Change file: frontend/src/lib/api.ts

  Add AbortError handling in response interceptor:
    if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') {
      return Promise.reject(error);  // pass through silently
    }
```

---

## Phase 5: Frontend Verification Queue & Admin Pages

### Task 5.1: Create verification queue page

```
New file: frontend/src/components/features/admin/matrimony/ProfileVerification.tsx
Route:   /admin/matrimony/verification

Components:
  StatsBar.tsx              — 5-card stats dashboard (pending, today, approved, rejected, avg time)
  AdminProfileCard          — from ProfileCard.tsx, renders profile card with:
                              adminActions.onView → navigate to detail
                              adminActions.onAudit → open AuditPanel slide-over
  AuditPanel.tsx            — slide-over modal with Status History and Reviews tabs
  EmptyState                — shown when queue is empty

Note: Claim/unclaim buttons were removed from the verification queue page.
      Backend claim endpoints still exist under ADMIN guard but are not exposed in the UI.
      The Audit button is rendered inside AdminProfileCard via adminActions.onAudit prop.
```

---

### Task 5.2: Create admin profile list enhancements

```
Change file: frontend/src/components/features/admin/matrimony/ProfileManagement.tsx

Add:
  - Filter sidebar (gender, status, community, age range)
  - Sort controls (createdAt, updatedAt, regNo)
  - Audit trail panel in detail view
  - Role-gated actions (ADMIN-only)

AdminProfileCard (ProfileCard.tsx):
  AdminActions interface:
    onAccept?: (id: string) => void  — approve button (shown in queue preview only)
    onReject?: (id: string) => void  — reject button (shown in queue preview only)
    onView?: (id: string) => void    — "View Details" button (always shown)
    onAudit?: (id: string) => void   — "Audit" button (shown when provided, inside card)

  Audit button appears next to View Details when onAudit is provided.
  Invokes AuditPanel slide-over on click.

AuditPanel (AuditPanel.tsx):
  - Fetches GET /admin/profiles/:id/audit on open
  - State history timeline (from → to with colored badges)
  - Reviews list (verifier name, decision, comment, timestamp)
  - Queue status bar (assignedTo, priority, queuedAt)
```

---

### Task 5.3: Add proper error UIs for specific errors

```
New component: frontend/src/components/ui/feedback/

  NotFoundPage.tsx       — "Profile not found" with browse CTA
  ForbiddenPage.tsx      — "Upgrade to view" with plan CTA
  NetworkErrorPage.tsx   — "Connection failed" with retry CTA

Used by ProfileView when useProfileView returns typed error.
```

---

## Phase 6: Type Definitions & Adapters

### Task 6.1: Expand type definitions

```
Change file: frontend/src/types/profile.ts

Add:
  ProfileDraft type (move from indexeddb.ts):
    { basic, community, professional, family, horoscope, photos,
      assets, partnerPreference, translations, updatedAt }

  QueueItem:
    { id, regNo, name, stage, priority, age, claimedBy, claimStatus, status }
    claimStatus: 'unclaimed' | 'claimed_by_me' | 'claimed'

  AuditTrail:
    { stateHistory: StateHistoryEntry[], reviews: ReviewEntry[], queue: QueueEntry | null }
    StateHistoryEntry: { from, to, changedBy, changedAt, reason }
    ReviewEntry: { adminName, decision, comment, createdAt }

  InviteQuota:
    { total, used, remaining, plan }

  AdminProfileCard:
    { id, regNo, name, status, createdAt, updatedAt, community, createdBy }

  Remove: [key: string]: any from Profile type
```

---

### Task 6.2: Add admin adapters

```
Change file: frontend/src/adapters/profile.adapter.ts

Add:
  profileToAdminEditForm(profile) → flat form shape for admin edit modal
  adminEditFormToPayload(formData) → Partial<Profile> for PATCH endpoint
  draftToProfileResponse(draft) → form state shape (for resumeDraft)

Consider splitting into:
  adapters/profile.adapter.ts        — user-facing adapters
  adapters/admin-profile.adapter.ts  — admin-facing adapters
```

---

### Task 6.3: Add admin validation schema

```
Change file: frontend/src/validation/profile-schema.ts

Add:
  validateAdminEdit(formData) → field errors
    - firstName, lastName: minLength(2)
    - mobile: valid phone format
    - email: valid email format
    - communityId, casteId: positive integers

  validateBrowseParams(params) → field errors
    - ageMin ≤ ageMax
    - heightMinId ≤ heightMaxId
    - valid enum values for gender, diet, etc.
```

---

## Phase 7: Feature Parity — Frontend Admin Components

### Task 7.1: Create AdminEditProfileModal (profile-admin-update pipeline)

```
New file: frontend/src/components/features/admin/AdminEditProfileModal.tsx

Props: { profile, onSave, onCancel }
State: formData, saving, fieldErrors

Flow:
  S1. profileToAdminEditForm(profile) → formData
  S2. Render editable fields (name, contact, community)
  S3. validateAdminEdit(formData) → errors
  S4. adminEditFormToPayload(formData) → payload
  S5. adminUpdateProfile(profileId, payload) → PATCH
  S6. On success → onSave()

Error matrix per profile-admin-update.md:
  ┌────────────────────┬───────────────────────────────────────────────┐
  │ VALIDATION_ERROR   → setFieldErrors(err.details)                   │
  │ PROFILE_NOT_PENDING → toast + close modal                          │
  │ 404 NOT_FOUND      → toast + close modal                           │
  │ 403 FORBIDDEN      → toast.error                                   │
  └────────────────────┴───────────────────────────────────────────────┘
```

---

### Task 7.2: Create ArchiveConfirmDialog (profile-admin-archive pipeline)

```
New file: frontend/src/components/features/admin/ArchiveConfirmDialog.tsx

Props: { profile, onArchive, onCancel }
State: archiving, reason

Flow:
  S1. Guard: profile.status in ARCHIVEABLE_STATUSES
  S2. Reason textarea (optional)
  S3. archiveProfile(profileId, reason) → POST /admin/profiles/:id/archive
```

---

### Task 7.3: Create DeleteConfirmDialog (profile-admin-delete pipeline)

```
New file: frontend/src/components/features/admin/DeleteConfirmDialog.tsx

Two-step confirmation:
  Step 1: "Are you sure?"
  Step 2: "Type DELETE to confirm" (text input must match "DELETE")

Flow:
  S1. deleteProfile(profileId) → POST /admin/profiles/:id/delete
  S2. On 404: idempotent — toast + remove from list
```

---

### Task 7.4: Link admin pages to new components

```
Update frontend/src/pages/admin/matrimony/Profiles.tsx to use:
  - AuditTrailPanel in detail view
  - AdminEditProfileModal for edit actions
  - ArchiveConfirmDialog for archive actions
  - DeleteConfirmDialog for delete actions

Update frontend/src/pages/admin/matrimony/ProfileDetails.tsx to use:
  - DecisionBar + DecisionConfirmDialog
  - (This is the admin detail page, separate from user ProfileView)
```

---

## Phase 8: Cleanup & Testing

### Task 8.1: Remove console.log from production code

```
frontend/src/api/profile.api.ts:
  Remove console.log from saveDraft(), resumeDraft(), createProfile()
```

---

### Task 8.2: Write integration tests

```
backend/src/tests/integration/:
  Add tests for:
    - ADMIN role access to admin endpoints
    - Claim/unclaim flow
    - Audit trail endpoint
    - Enhanced stats endpoint

frontend/src/tests/:
  Add tests for:
    - useProfileView hook (mock API)
    - useImageUpload hook (mock canvas + API)
    - Error matrix mapping for all 17 error codes
    - Role determination logic
```

---

### Task 8.3: Update API layer return types

```
Change file: frontend/src/api/profile.api.ts

  Replace all `as any` casts with proper types:
    fetchProfile(id): Promise<Profile>
    browseProfiles(...): Promise<{ data: ProfileCard[], cursor: string | null }>
    createProfile(payload): Promise<Profile>
    saveDraft(payload): Promise<{ id: string }>
    resumeDraft(id): Promise<ProfileDraft>

  Add signal parameter support to all fetch functions.
```

---

## Dependency Graph

```
Phase 0 (Dependency Check)
  │
  ▼
Phase 1 (Admin Route Guards) ───────────────────┐
  │                                              │
  ▼                                              │
Phase 2 (New Backend Endpoints) ───────────────┐│
  │ 2.1 Audit Trail                              ││
  │ 2.2 Claim/Unclaim                            ││
  │ 2.3 Enhanced Stats                           ││
  │ 2.4 Sort & Filters                           ││
  │ 2.5 Profile Reviews                          ││
  │ 2.6 Notifications                            ││
  │                                              ││
  ├──────────────────────────────────────────────┘│
  ▼                                               ▼
Phase 3 (Frontend Hooks) ──────────── Phase 5 (Frontend Admin)
  3.1 useProfileView                     5.1 Verification Queue
  3.2 useImageUpload                     5.2 Admin List Enhancements
  3.3 Step Components Extraction         5.3 Error UIs
  3.4 Section Components Extraction
        │
        ▼
Phase 4 (Error Handling & Roles) ─── Phase 6 (Types & Adapters)
  4.1 Error-code-specific UX            6.1 Type Definitions
  4.2 Role determination                6.2 Admin Adapters
  4.3 Invite functionality              6.3 Admin Validation
  4.4 Search level gates
  4.5 AbortController support
        │
        ▼
Phase 7 (Frontend Admin Components) ──── Phase 8 (Cleanup & Tests)
  7.1 AdminEditProfileModal              8.1 Remove console.log
  7.2 ArchiveConfirmDialog               8.2 Integration tests
  7.3 DeleteConfirmDialog                8.3 API return types
  7.4 Link admin pages
```

## Migration Notes

### ReviewAction enum values

The `ReviewAction` enum in `prisma/schema.prisma` defines 6 values used by admin profile operations:

| Value | Used By |
|-------|---------|
| `APPROVED` | verification-queue approve |
| `REJECTED` | verification-queue reject |
| `UPDATE` | profile-admin-update (PUT /admin/profiles/:id) |
| `ARCHIVE` | profile-admin-archive |
| `RESTORE` | profile-admin-archive.restore |
| `DELETE` | profile-admin-delete |

**Adding new values to an existing enum** requires a database migration:

```sql
ALTER TYPE "ReviewAction" ADD VALUE 'UPDATE';
ALTER TYPE "ReviewAction" ADD VALUE 'ARCHIVE';
ALTER TYPE "ReviewAction" ADD VALUE 'RESTORE';
ALTER TYPE "ReviewAction" ADD VALUE 'DELETE';
```

Or include them via Prisma migration: `npx prisma migrate dev --name <name>`.

### FK naming drift

If Prisma reports FK constraint name drift between migration history and the database (e.g., `Removed foreign key on columns (accountId)` / `Added foreign key on columns (accountId)`), the database constraint names differ from what the migration file created. To fix:

1. Identify the mismatched FKs by running `prisma migrate dev --create-only`
2. Drop the existing FKs and recreate them with the names from the last applied migration
3. Then create the new migration as normal

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Frontend refactoring breaks existing functionality | HIGH | Ship backend changes first. Refactor frontend in feature-flagged components with parallel old code until validated |
| Claim/unclaim UI removed from profile cards | LOW | Claim/unclaim buttons removed from ProfileVerification. Backend endpoints still exist under ADMIN guard |
| ProfileView extraction accidentally removes features | HIGH | Write component tests BEFORE extracting. Verify all 1279 lines are covered |
| IndexedDB schema change breaks existing user drafts | LOW | Schema is the same; no migration needed |
| Auth interceptor clashes with AbortError handling | MEDIUM | Test aborted requests specifically — ensure interceptor doesn't re-throw AppError for aborted requests |
| Notification infrastructure missing | MEDIUM | Defer to separate task if email worker doesn't support profile notifications yet |
