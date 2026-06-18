# Pipeline 6: profile-admin-list (Frontend)

> **For beginners**: Frontend side of the admin profile management page.
> Table view with filters, search, and status indicators.

## Purpose

Admin list page for managing all profiles. Supports filter sidebar (gender, status, community, age range), sort controls, pagination (cursor-based), and audit trail detail mode for individual profiles.

## Actor & Entry

| Route | URL Params | Role | Validation |
|---|---|---|---|
| `/manamaalai/admin/profiles` | query params (filters persist) | ADMIN | — |

**Allowed Roles:** `ADMIN`

## High-Level Architecture

```
  ┌─ /manamaalai/admin/profiles
  │  ProtectedRoute → ADMIN
  ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │  AdminProfileList.tsx (Orchestrator)                                    │
  │                                                                         │
  │  STATE: profiles[], cursor, hasMore, searchTerm, filters (multi),      │
  │         sort, selectedProfile(for audit), showFilters                  │
  │  HOOKS: useAdminProfileList                                            │
  │                                                                         │
  │  ┌── onMount + filter/sort change ───────────────────────────┐        │
  │  │  S1. normalizeFilterParams(filters) → apiParams            │        │
  │  │  S2. fetchAdminList(apiParams, sort, cursor)              │        │
  │  │  S3. mergeResults('replace')                              │        │
  │  │  S4. updateCursor                                         │        │
  │  └────────────────────────────────────────────────────────────┘        │
  │                                                                         │
  │  ┌── profile click → detail mode ────────────────────────────┐        │
  │  │  S5. fetchProfileDetail(profileId)                         │        │
  │  │  S6. fetchAuditTrail(profileId)                            │        │
  │  │      ├─ state_history (status changes with timestamps)    │        │
  │  │      ├─ reviews (admin comments + decisions)           │        │
  │  │      └─ queue (current verification queue entries)        │        │
  │  │  S7. renderDetailPanel(profile, audit)                    │        │
  │  └────────────────────────────────────────────────────────────┘        │
  │                                                                         │
  │  ┌── actions ───────────────────────────────────────────────┐         │
  │  │  ADMIN: Edit, Archive, Delete, View Audit                 │         │
  │  └────────────────────────────────────────────────────────────┘         │
  │                                                                         │
  │  ┌── filter controls ────────────────────────────────────────┐        │
  │  │  - Gender (enum checkboxes)                                │        │
  │  │  - Status (multi-select: PENDING, ACTIVE, EXPIRED, ...)    │        │
  │  │  - Community (select dropdown, cascading caste)           │        │
  │  │  - Age range (min/max inputs)                              │        │
  │  │  - Search (regNo, name, mobile)                           │        │
  │  │  - Sort by (createdAt, updatedAt, status)                 │        │
  │  └────────────────────────────────────────────────────────────┘        │
  └──────────────────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture — Step by Step

---

### S1: normalizeFilterParams

```
====================================================================================
S1: normalizeFilterParams
────────────────────────────────────────────────────────────────────────────────────
Input: filters (component state), sort

  const apiParams = {
    ...(filters.gender?.length && { gender: filters.gender.join(',') }),
    ...(filters.status?.length && { status: filters.status.join(',') }),
    ...(filters.community && { community: filters.community }),
    ...(filters.ageMin && { ageMin: filters.ageMin }),
    ...(filters.ageMax && { ageMax: filters.ageMax }),
    ...(filters.searchTerm && { search: filters.searchTerm }),
    sortBy: sort.field,
    sortOrder: sort.order,  // 'asc' | 'desc'
  };

  // Strip undefined keys
  Object.keys(apiParams).forEach(k => {
    if (apiParams[k] === undefined) delete apiParams[k];
  });

Output: apiParams ready for API
```

---

### S2: fetchAdminList

```
====================================================================================
S2: fetchAdminList
────────────────────────────────────────────────────────────────────────────────────
Input: apiParams, cursor

  setLoading(true);
  try {
    const response = await getAdminProfiles(apiParams, cursor);
    // GET /admin/profiles?gender=...&status=...&cursor=abc
    // Backend: returns { data: ProfileAdminCard[], cursor: string | null }
  } catch (err) {
    ┌─ listError matrix ──────────────────────────────────────────────────┐
    │  400 VALIDATION_ERROR → toast(translateError(err))                  │
    │  403 FORBIDDEN → toast('You do not have permission')               │
    │  NETWORK_ERROR → toast('Unable to load profiles') + retry CTA      │
    └──────────────────────────────────────────────────────────────────────┘
  } finally {
    setLoading(false);
  }

Output: profiles[] state set
```

---

### S3: mergeResults

```
====================================================================================
S3: mergeResults
────────────────────────────────────────────────────────────────────────────────────
  setProfiles(response.data);
  setCursor(response.cursor);
  setHasMore(response.cursor !== null);

Output: List updated
```

---

### S5-S6: fetch audit trail

```
====================================================================================
S5: fetchProfileDetail
S6: fetchAuditTrail (combined)
────────────────────────────────────────────────────────────────────────────────────
Input: profileId

  setSelectedProfileLoading(true);
  try {
    const [profile, audit] = await Promise.all([
      getAdminProfileDetail(profileId),
      getAuditTrail(profileId),
    ]);

    // getAuditTrail: GET /admin/profiles/:id/audit
    // Returns: {
    //   stateHistory: { from, to, changedBy, changedAt, reason }[],
    //   reviews: { adminName, decision, comment, createdAt }[],
    //   queue: { stage, assignedTo, priority } | null
    // }

    setSelectedProfile({ profile, audit });
  } catch (err) {
    ┌─ auditError matrix ────────────────────────────────────────────┐
    │  404 NOT_FOUND → toast('Profile not found')                     │
    │  NETWORK_ERROR → toast('Could not load profile details')       │
    └─────────────────────────────────────────────────────────────────┘
  } finally {
    setSelectedProfileLoading(false);
  }

Output: detail panel populated with profile data + audit trail
```

---

### S7: renderDetailPanel

```
====================================================================================
S7: renderDetailPanel
────────────────────────────────────────────────────────────────────────────────────
  Sections:
  ┌─ Header ────────────────────────────────────────────────────────┐
  │  regNo, status badge, createdBy, createdAt                      │
  └─────────────────────────────────────────────────────────────────┘
  ┌─ Summary ───────────────────────────────────────────────────────┐
  │  Name, Age, Gender, Community, District                         │
  └─────────────────────────────────────────────────────────────────┘
  ┌─ Audit Trail ───────────────────────────────────────────────────┐
  │  State History:                                                 │
  │    DRAFT → PENDING (2024-01-15, by User )                      │
  │    PENDING → ACTIVE (2024-01-16, by Admin)                    │
  │  Reviews:                                                       │
  │    Admin: Approved (comment: "All documents verified")          │
  │  Queue: Stage 2 of 3, assigned to Admin                        │
  └─────────────────────────────────────────────────────────────────┘
  ┌─ Actions (role-gated) ──────────────────────────────────────────┐
  │  [Edit] [Archive] [Delete] ← ADMIN only                        │
  │  [Edit] [Archive] [Delete] [View Audit] ← ADMIN                │
  │  [View Full Profile] ← both                                    │
  └─────────────────────────────────────────────────────────────────┘

Output: Detail slide-over or side panel rendered
```

## Dependencies

| File | Role |
|---|---|
| `pages/admin/ProfileList.tsx` | Route page |
| `hooks/useAdminProfileList.ts` | Filter state, pagination, audit fetch |
| `api/verification.api.ts` | getAdminProfiles, getAdminProfileDetail, getAuditTrail |
| `lib/errors.ts` | isAppError, getErrorMessage |
