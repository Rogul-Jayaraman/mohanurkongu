# Pipeline 4: profile-browse (Frontend)

> **For beginners**: Frontend side of searching profiles. Manages filter
> controls, pagination (infinite scroll), and displays results. Handles
> stale request cancellation.

## Purpose

Replaces the monolithic browse list in `BrowseProfiles.tsx` (768 lines). Handles cursor-based pagination with concurrent abort-safe requests, filter normalization (community → caste → subcaste cascading), search level gating (free users see limited results), and stale response detection via `AbortController`.

## Actor & Entry

| Route | URL Params | Role | Validation |
|---|---|---|---|
| `/manamaalai/browse` | query params supported | USER (any subscription level) | Applied search level gates |

**Allowed Roles:** `USER` (all subscription tiers)

## High-Level Architecture

```
  ┌─ /manamaalai/browse
  │  ProtectedRoute → USER
  ▼
  ┌───────────────────────────────────────────────────────────────────────┐
  │  BrowseProfiles.tsx (Orchestrator)                                     │
  │                                                                        │
  │  STATE: profiles[], cursor, hasMore, loading, error, filters,         │
  │         searchLevel ('BASIC' | 'PREMIUM' | 'VIP')                     │
  │  HOOKS: useProfileBrowse (pagination + abort), useFilterState         │
  │  ADAPTER: normalizeParams                                              │
  │                                                                        │
  │  ┌── onMount + filter change ───────────────────────────────┐         │
  │  │  S1. abortPrevRequest() (AbortController.signal)          │         │
  │  │  S2. normalizeFilterParams(filters) → apiParams           │         │
  │  │  S3. fetchBrowse(apiParams, cursor, signal)               │         │
  │  │  S4. mergeResults(mode: 'replace' | 'append')            │         │
  │  │  S5. updateCursor(hasMore, nextCursor)                   │         │
  │  └───────────────────────────────────────────────────────────┘         │
  │                                                                        │
  │  ┌── scroll / "Load More" ───────────────────────────────────┐        │
  │  │  S6. incrementCursor(nextCursor)                           │        │
  │  │  S7. fetchBrowse(apiParams, cursor, signal)               │        │
  │  │  S8. mergeResults('append')                                │        │
  │  └────────────────────────────────────────────────────────────┘        │
  │                                                                        │
  │  ┌── search level gate ──────────────────────────────────────┐        │
  │  │  S9. applySearchLevel(searchLevel, results) → gatedResults │        │
  │  │      BASIC:     max 3 results, no contact info             │        │
  │  │      PREMIUM:   max 50 results, fields visible             │        │
  │  │      VIP:       unlimited results, priority filtering     │        │
  │  └────────────────────────────────────────────────────────────┘        │
  └───────────────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture — Step by Step

---

### S1: abortPrevRequest

```
====================================================================================
S1: abortPrevRequest
────────────────────────────────────────────────────────────────────────────────────
Trigger: any filter change (community, caste, age range, etc.)

  // When filters change, we must abort any in-flight request to avoid
  // stale data overwriting newer results (race condition)

  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }
  abortControllerRef.current = new AbortController();

  ┌──────────────────────────────────────────────────────────────────────┐
  │  AbortController lifecycle:                                          │
  │  1. On mount: controllerRef.current = new AbortController()          │
  │  2. On filter change: abort previous, create new                     │
  │  3. Pass signal to fetchBrowse()                                     │
  │  4. On unmount: abort() for cleanup                                  │
  └──────────────────────────────────────────────────────────────────────┘

  On abort: catch AbortError silently (do not set error state for user)

Output: AbortController.signal ready for next request
```

---

### S2: normalizeFilterParams

```
====================================================================================
S2: normalizeFilterParams
────────────────────────────────────────────────────────────────────────────────────
Input: filters (component state)

  const apiParams = {
    community: filters.community,
    caste: filters.caste,
    subCaste: filters.subCaste || undefined,
    gender: filters.gender,
    ageMin: filters.ageMin,
    ageMax: filters.ageMax,
    heightMin: filters.heightMinId,
    heightMax: filters.heightMaxId,
    diet: filters.diet || undefined,
    maritalStatus: filters.maritalStatus || undefined,
    district: filters.district || undefined,
    education: filters.education || undefined,
    jobSector: filters.jobSector || undefined,
    monthlySalaryMin: filters.monthlySalaryMin,
    monthlySalaryMax: filters.monthlySalaryMax,
    searchTerm: filters.searchTerm || undefined,
  };

  // Strip undefined keys — API ignores them
  Object.keys(apiParams).forEach(k => {
    if (apiParams[k] === undefined) delete apiParams[k];
  });

Output: apiParams (clean object with only defined filters)
```

---

### S3: fetchBrowse

```
====================================================================================
S3: fetchBrowse
────────────────────────────────────────────────────────────────────────────────────
Input: apiParams, cursor (string | null), signal (AbortSignal)

  setLoading(true);

  try {
    const response = await browseProfiles(apiParams, cursor, signal);
    // GET /profiles/browse?community=X&caste=Y&cursor=abc123
    // Backend: returns { data: ProfileCard[], cursor: string | null }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      // Silently swallow — request was intentionally aborted
      return;
    }
    handleBrowseError(err);
  } finally {
    setLoading(false);
  }

  ┌─ browseError matrix ────────────────────────────────────────────────┐
  │  400 VALIDATION_ERROR → toast(translateError(err))                  │
  │  403 SEARCH_LEVEL_LIMIT → fall through to S9 (level limits apply)  │
  │  NETWORK_ERROR → toast('Unable to fetch profiles') + retry CTA     │
  │  default       → toast(getErrorMessage(err))                        │
  └──────────────────────────────────────────────────────────────────────┘

Output: response.data (ProfileCard[]) + response.cursor
```

---

### S4: mergeResults

```
====================================================================================
S4: mergeResults
────────────────────────────────────────────────────────────────────────────────────
Input: response.data, mode: 'replace' | 'append'

  if (mode === 'replace') {
    setProfiles(response.data);
  } else {
    setProfiles(prev => [...prev, ...response.data]);
  }

Output: updated profiles array
```

---

### S5: updateCursor

```
====================================================================================
S5: updateCursor
────────────────────────────────────────────────────────────────────────────────────
Input: response.cursor (string | null)

  setCursor(response.cursor);
  setHasMore(response.cursor !== null);

Output: cursor state ready for "Load More" / infinite scroll
```

---

### S6: load more

```
====================================================================================
S6: load more
────────────────────────────────────────────────────────────────────────────────────
Trigger: "Load More" button click (or scroll to bottom)

  if (!hasMore || loading) return;
  S1 (skip abort — keep existing results), S3 (with cursor), S4 (append), S5

Output: more profiles appended to list
```

---

### S7-S8: (same as S3-S5, append mode)

```
====================================================================================
S7: fetchBrowse (with cursor)
S8: mergeResults ('append')
────────────────────────────────────────────────────────────────────────────────────
  Same as S3-S4 but with existing cursor and append mode.
```

---

### S9: search level gate

```
====================================================================================
S9: search level gate
────────────────────────────────────────────────────────────────────────────────────
Input: searchLevel, results[]

  ┌──────────────────────────┬──────────────┬─────────────────────────────┐
  │ searchLevel              │ Max Results  │ Restrictions                │
  ├──────────────────────────┼──────────────┼─────────────────────────────┤
  │ BASIC (free)             │ 3            │ No contact info,            │
  │                          │              │ limited filters             │
  │ PREMIUM                  │ 50           │ Full visibility              │
  │ VIP                      │ unlimited    │ All filters, priority       │
  └──────────────────────────┴──────────────┴─────────────────────────────┘

  Gated results = results.slice(0, maxResults);
  Also conditionally hide contact info fields based on level.

Output: gatedResults (potentially truncated)
```

## Dependencies

| File | Role |
|---|---|
| `pages/user/BrowseProfiles.tsx` | Route page (re-export) |
| `components/features/user/BrowseProfiles.tsx` | Orchestrator component |
| `hooks/useProfileBrowse.ts` | Pagination + abort management |
| `adapters/profile.adapter.ts` | (not used directly, but shares types) |
| `api/profile.api.ts` | browseProfiles |
| `lib/errors.ts` | isAppError, getErrorMessage |
