# Pipeline 11: verification-queue (Frontend)

> **For beginners**: Frontend side of the verification queue page. Shows
> pending profiles with stats and navigation to review each one.

## Purpose

Verification queue list page for ADMINs. Shows profiles awaiting verification with pagination, quick stats dashboard (counts by stage), and admin controls (view details, audit) per card. Supports client-side sort by name or date.

## Actor & Entry

| Route | URL Params | Role | Validation |
|---|---|---|---|
| `/manamaalai/admin/verification-queue` | query params (filters) | ADMIN | — |

**Allowed Roles:** `ADMIN`

## High-Level Architecture

```
  ┌─ /manamaalai/admin/verification-queue
  │  ProtectedRoute → ADMIN
  ▼
  ┌──────────────────────────────────────────────────────────────────────────┐
  │  VerificationQueue.tsx (Orchestrator)                                     │
  │                                                                           │
  │  STATE: profiles[], stats, loading                                       │
  │  HOOKS: ProfileVerification (inline, no separate hook file)               │
  │                                                                           │
  │  ┌── onMount ───────────────────────────────────────────────────┐        │
  │  │  S1. fetchQueueStats() → GET /verification/stats              │        │
  │  │      Returns: { pendingTotal, pendingToday, approvedToday,    │        │
  │  │                rejectedToday, avgReviewTimeHours }            │        │
  │  │  S2. fetchQueueList(search?) → GET /verification/queue       │        │
  │  │      Returns: { profiles: QueueItem[] }                       │        │
  │  └────────────────────────────────────────────────────────────────┘        │
  │                                                                           │
  │  ┌── rendering ─────────────────────────────────────────────────┐        │
  │  │  S3. StatsBar(stats) — 5 card grid at top of page             │        │
  │  │  S4. AdminProfileCard grid — 2-column card layout:           │        │
  │  │      profile photo, name, regNo, age, details                 │        │
  │  │      Admin controls: View Details, Audit buttons              │        │
  │  │  S5. clientSort(sortBy: 'name'|'date') — local sort           │        │
  │  │       without API call                                        │        │
  │  └────────────────────────────────────────────────────────────────┘        │
  │                                                                           │
  │  ┌── admin actions (inside AdminProfileCard) ─────────────────┐          │
  │  │  S6. handleView(profileId) — navigate to profile detail      │          │
  │  │  S7. handleAudit(profileId) — open AuditPanel slide-over     │          │
  │  └──────────────────────────────────────────────────────────────┘          │
  └──────────────────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture — Step by Step

---

### S1: fetchQueueStats

```
====================================================================================
S1: fetchQueueStats
────────────────────────────────────────────────────────────────────────────────────
Input: none

  try {
    const stats = await getVerificationStats();
    // GET /verification/stats
    // Backend: returns aggregation of queue by stage
    // { total: 150, pending: 80, inReview: 45, completed: 25 }
    setStats(stats);
  } catch (err) {
    // Stats failure is non-critical — queue still loads
    console.error('Failed to fetch stats', err);
    setStats(null);
  }

Output: StatsCards rendered at top (or null state)
```

---

### S2: fetchQueueList

```
====================================================================================
S2: fetchQueueList
────────────────────────────────────────────────────────────────────────────────────
Input: cursor (optional, null for first page)

  setLoading(true);
  try {
    const response = await getVerificationQueue(cursor);
    // GET /verification/queue?cursor=abc
    // Backend: returns paginated QueueItem[] with:
    //   { id, regNo, name, stage, priority, age, claimedBy, status }
    setProfiles(prev => cursor ? [...prev, ...response.data] : response.data);
    setCursor(response.cursor);
    setHasMore(response.cursor !== null);
  } catch (err) {
    ┌─ queueError matrix ──────────────────────────────────────────────────┐
    │  403 FORBIDDEN → toast('You do not have access to the queue')        │
    │  NETWORK_ERROR → toast('Unable to load verification queue') + retry │
    └──────────────────────────────────────────────────────────────────────┘
  } finally {
    setLoading(false);
  }

Output: Queue table populated
```

---

### S3: StatsCards

```
====================================================================================
S3: StatsCards
────────────────────────────────────────────────────────────────────────────────────
Input: stats object

  ┌─────────────────────────────────────────────────────────────────────────┐
  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
  │  │  Total   │  │ Pending  │  │In Review │  │Completed │               │
  │  │   150    │  │   80     │  │   45     │  │   25     │               │
  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘               │
  └─────────────────────────────────────────────────────────────────────────┘

  Each card: label, count, color accent (red=pending, yellow=in review, green=completed)

Output: 4-card stats grid
```

---

### S4: QueueTable

```
====================================================================================
S4: QueueTable
────────────────────────────────────────────────────────────────────────────────────
Input: items[]

  Table columns:
  ┌────────┬───────┬───────┬──────────┬─────┬──────────────┬──────────────┐
  │ regNo  │ Name  │ Stage │ Priority │ Age │ Claim Status │ Actions      │
  ├────────┼───────┼───────┼──────────┼─────┼──────────────┼──────────────┤
  │ MK001  │ John  │ 2/3   │ HIGH     │ 3d  │ Unclaimed    │ [Claim]      │
  │ MK002  │ Jane  │ 1/3   │ MEDIUM   │ 7d  │ Claimed by X │ [Unclaim]    │
  └────────┴───────┴───────┴──────────┴─────┴──────────────┴──────────────┘

  Claim status badge colors: Unclaimed (gray), Claimed by You (green), Claimed (blue)
  Click row → open detail panel

Output: Paginated table rendered
```

---

### S5: clientSort

```
====================================================================================
S5: clientSort
────────────────────────────────────────────────────────────────────────────────────
Input: sortBy ('priority' | 'age')

  const sorted = [...items].sort((a, b) => {
    if (sortBy === 'priority') {
      const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return order[a.priority] - order[b.priority];
    }
    if (sortBy === 'age') {
      return b.age - a.age;  // oldest first
    }
    return 0;
  });

  // Pure client-side sort — no API call
  // Applied after each fetch

Output: Reordered items
```

---

### S6: claimProfile

```
====================================================================================
S6: claimProfile
────────────────────────────────────────────────────────────────────────────────────
Input: profileId

  try {
    await claimProfile(profileId);
    // POST /verification/queue/:id/claim
    // Backend: assigns queue entry to current admin
    setProfiles(prev => prev.map(p =>
      p.id === profileId
        ? { ...p, claimedBy: currentUser.name, claimStatus: 'CLAIMED' }
        : p
    ));
  } catch (err) {
    ┌─ claimError matrix ──────────────────────────────────────────────────┐
  │  409 ALREADY_CLAIMED → toast('This profile was claimed by another   │
  │                        admin') + refresh row                         │
    │  400 CLAIM_LIMIT → toast('You have reached your claim limit')       │
    │  NETWORK_ERROR → toast(getErrorMessage(err))                        │
    └──────────────────────────────────────────────────────────────────────┘
  }

Output: Row updated with claim status
```

---

### S9: unclaimProfile

```
====================================================================================
S9: unclaimProfile
────────────────────────────────────────────────────────────────────────────────────
Input: profileId

  try {
    await unclaimProfile(profileId);
    // POST /verification/queue/:id/unclaim
    // Backend: removes assignment, returns to unclaimed pool
    setProfiles(prev => prev.map(p =>
      p.id === profileId
        ? { ...p, claimedBy: null, claimStatus: 'UNCLAIMED' }
        : p
    ));
  } catch (err) {
    ┌─ unclaimError matrix ────────────────────────────────────────────────┐
    │  400 NOT_CLAIMED → toast('This profile was not claimed by you')      │
    │  NETWORK_ERROR → toast(getErrorMessage(err))                        │
    └──────────────────────────────────────────────────────────────────────┘
  }

Output: Row updated, profile returned to pool
```

## Dependencies

| File | Role |
|---|---|
| `pages/admin/matrimony/Verification.tsx` | Route page (renders ProfileVerification) |
| `components/features/admin/matrimony/ProfileVerification.tsx` | Orchestrator |
| `components/features/admin/matrimony/ProfileCard.tsx` | AdminProfileCard (with onView, onAudit actions) |
| `components/features/admin/matrimony/AuditPanel.tsx` | Audit trail modal |
| `api/verification.api.ts` | fetchVerificationQueue, fetchVerificationStats, fetchAuditTrail |
| `lib/errors.ts` | isAppError, getErrorMessage |
