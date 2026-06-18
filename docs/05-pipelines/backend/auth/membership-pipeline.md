# Membership Pipeline

> **For beginners**: Manages membership plans (BRONZE/SILVER/GOLD/PLATINUM).
> When you upgrade, your new capabilities are saved as a "snapshot." When you
> browse profiles, the system checks your plan's limits from this snapshot.

## Purpose

Manage user membership capabilities and admin subscription operations. The Membership system follows a **capability snapshot pattern**: when a subscription is created or changed, the plan's capabilities are snapshotted into the subscription row. At runtime, capabilities are resolved from the snapshot (plus dynamic usage data) into a `CapabilitySnapshot` object. Guard functions consume this snapshot to authorize feature access.

## Architecture Overview

The Membership system consists of several sub-pipelines:

```
MembershipModule
├── ResolveCapabilitiesPipeline  — Builds capability snapshot for an account
├── AssignSubscriptionPipeline   — Admin assigns a new plan to an account
├── CancelSubscriptionPipeline   — Admin cancels (or reverts) a subscription
└── Guards                       — Feature-level authorization checks
```

## Core Data Model: CapabilitySnapshot

```typescript
type CapabilitySnapshot = {
  planCode: MembershipPlanCode;     // BRONZE | SILVER | GOLD | PLATINUM
  planName: string;                 // Display name
  openLimit: number;                // -1 = unlimited
  openRemaining: number;            // -1 = unlimited
  shortlistLimit: number;           // -1 = unlimited
  profileSlotLimit: number;         // -1 = unlimited
  viewDetails: ViewDetails;         // BASIC | EXTENDED | ADVANCED | FULL
  printProfile: boolean;
  printHoroscope: boolean;
  searchLevel: SearchLevel;         // BASIC | EXTENDED | ADVANCED | FULL
  isActive: boolean;
  expiresAt: Date | null;           // null = never expires
};
```

**The -1 convention**: A value of -1 for numeric limits means "unlimited/unrestricted."

## ResolveCapabilitiesPipeline

### High-Level Flow

```
                    ┌──────────────────┐
                    │ resolveCapabilities(accountId)  │
                    └────────┬─────────┘
                             │
                             ▼
               ┌─────────────────────────┐
               │  Is membership enabled? │
               └──────────┬──────────────┘
                          │
                    ┌─────┴─────┐
                    ▼           ▼
               (NO) YES    (YES) NO
                    │           │
                    ▼           ▼
          ┌────────────────┐  ┌──────────────────┐
          │ Return FULL     │  │ Has active       │
          │ ACCESS snapshot │  │ subscription?    │
          │ (all -1, FULL)  │  └────────┬─────────┘
          └────────────────┘           │
                                  ┌────┴────┐
                                  ▼         ▼
                             (NO) YES  (YES) NO
                                  │         │
                                  ▼         ▼
                         ┌────────────┐  ┌──────────────────┐
                         │ Build from  │  │ Return BRONZE    │
                         │ subscription│  │ default (10      │
                         │ snapshot +  │  │ opens, BASIC)    │
                         │ usage data  │  └──────────────────┘
                         └────────────┘
```

### Low-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ resolveCapabilities(accountId)                                                  │
│ ─────────────────────────────                                                   │
│                                                                                 │
│ Step 1: Check toggle                                                           │
│ ─────────────────────                                                          │
│   setting = systemSetting.findUnique({ key: 'membership_enabled' })            │
│   if setting?.value !== 'true':                                                │
│     return FULL_ACCESS_CAPS {                                                  │
│       planCode: 'BRONZE', planName: 'Full Access',                             │
│       openLimit: -1, openRemaining: -1, shortlistLimit: -1,                    │
│       profileSlotLimit: -1, viewDetails: 'FULL',                               │
│       printProfile: true, printHoroscope: true,                                │
│       searchLevel: 'FULL', isActive: true, expiresAt: null                     │
│     }                                                                          │
│                                                                                 │
│ Step 2: Find subscription                                                      │
│ ──────────────────────────                                                     │
│   sub = subscription.findFirst({                                               │
│     where: { accountId, status: 'ACTIVE' },                                   │
│     orderBy: { createdAt: 'desc' }                                             │
│   })                                                                           │
│                                                                                 │
│ Step 3: No subscription → return BRONZE defaults                              │
│ ─────────────────────────────────────────────                                 │
│   if !sub:                                                                    │
│     bronze = membershipPlan.findUnique({ code: 'BRONZE' })                   │
│     if !bronze: return null                                                   │
│     return BRONZE_DEFAULT_CAPS {                                               │
│       planCode: 'BRONZE', planName: 'Bronze',                                 │
│       openLimit: 10, openRemaining: 10,                                       │
│       shortlistLimit: 0, profileSlotLimit: 1,                                 │
│       viewDetails: 'BASIC', printProfile: false, printHoroscope: false,       │
│       searchLevel: 'BASIC', isActive: true, expiresAt: null                   │
│     }                                                                          │
│                                                                                 │
│ Step 4: Subscription exists → build from snapshot                              │
│ ─────────────────────────────────────────────────────                         │
│   usage = membershipUsage.findUnique({ where: { accountId } })                │
│   openUsed = usage?.openUsed ?? 0                                              │
│   openLimit = sub.snapshotOpenLimit                                            │
│   openRemaining = openLimit < 0 ? -1 : Math.max(0, openLimit - openUsed)      │
│                                                                                 │
│   return {                                                                      │
│     planCode: sub.snapshotPlanCode,                                             │
│     planName: sub.snapshotPlanName,                                             │
│     openLimit,                                                                  │
│     openRemaining,                                                              │
│     shortlistLimit: sub.snapshotShortlistLimit,                                 │
│     profileSlotLimit: sub.snapshotProfileSlotLimit,                             │
│     viewDetails: sub.snapshotViewDetails,                                       │
│     printProfile: sub.snapshotPrintProfile,                                     │
│     printHoroscope: sub.snapshotPrintHoroscope,                                 │
│     searchLevel: sub.snapshotSearchLevel,                                       │
│     isActive: sub.status === 'ACTIVE',                                          │
│     expiresAt: sub.expiresAt,                                                   │
│   }                                                                              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## AssignSubscriptionPipeline

### Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ assignSubscription(adminId, accountId, planId, options?)                        │
│ ───────────────────────────────────────────────                                 │
│                                                                                 │
│ Step 1: Validate plan                                                          │
│ ──────────────────────                                                         │
│   plan = membershipPlan.findUnique({ where: { id: planId } })                  │
│   if !plan → throw 404 MEMBERSHIP_PLAN_NOT_FOUND                                │
│   if plan.status !== 'ACTIVE' → throw 400 MEMBERSHIP_PLAN_INACTIVE              │
│                                                                                 │
│ Step 2: Validate account                                                       │
│ ─────────────────────────                                                      │
│   account = account.findUnique({ where: { id: accountId } })                   │
│   if !account → throw 404 ACCOUNT_NOT_FOUND                                     │
│                                                                                 │
│ Step 3: Cancel current active subscription (if any)                            │
│ ────────────────────────────────────────────────────────                      │
│   subscription.updateMany({                                                     │
│     where: { accountId, status: 'ACTIVE' },                                   │
│     data: { status: 'CANCELLED' }                                              │
│   })                                                                            │
│                                                                                 │
│ Step 4: Create new subscription                                                │
│ ────────────────────────────────────                                           │
│   now = new Date()                                                              │
│   expiresAt = plan.durationDays > 0                                            │
│     ? new Date(now + plan.durationDays * 86400000)                             │
│     : null                                                                      │
│                                                                                 │
│   return subscription.create({                                                  │
│     data: {                                                                     │
│       accountId, planId: plan.id, status: 'ACTIVE',                            │
│       startedAt: now, expiresAt,                                                │
│       assignedByAdminId: adminId,                                               │
│       paymentMethod: options?.paymentMethod,                                    │
│       // Snapshot ALL capability fields from plan:                              │
│       snapshotPlanCode: plan.code,                                              │
│       snapshotPlanName: plan.displayName,                                       │
│       snapshotDisplayPrice: plan.displayPrice,                                  │
│       snapshotDurationDays: plan.durationDays,                                  │
│       snapshotOpenLimit: plan.openLimit,                                        │
│       snapshotShortlistLimit: plan.shortlistLimit,                              │
│       snapshotProfileSlotLimit: plan.profileSlotLimit,                          │
│       snapshotViewDetails: plan.viewDetails,                                    │
│       snapshotPrintProfile: plan.printProfile,                                  │
│       snapshotPrintHoroscope: plan.printHoroscope,                              │
│       snapshotSearchLevel: plan.searchLevel,                                    │
│       notes: options?.notes || null,                                            │
│     },                                                                          │
│   })                                                                            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Why Snapshot Pattern?**
- The plan's capabilities are COPIED into the subscription at creation time
- Future changes to the plan definition do NOT affect existing subscriptions
- Historical accuracy: we know exactly what the user was entitled to at the time of subscription
- The snapshots are read-heavy but never change after creation (immutable historical record)

## CancelSubscriptionPipeline

### Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ cancelSubscription(adminId, accountId, action: 'cancel' | 'revert')             │
│ ───────────────────────────────────────────────────────────                     │
│                                                                                 │
│ Step 1: Validate account                                                       │
│ ─────────────────────────                                                      │
│   account = account.findUnique({ where: { id: accountId } })                   │
│   if !account → throw 404 ACCOUNT_NOT_FOUND                                     │
│                                                                                 │
│ Step 2: Find current active subscription                                       │
│ ─────────────────────────────────────────────                                  │
│   currentSub = subscription.findFirst({                                         │
│     where: { accountId, status: 'ACTIVE' },                                   │
│     orderBy: { createdAt: 'desc' }                                              │
│   })                                                                            │
│   if !currentSub → throw 400 SUBSCRIPTION_NOT_FOUND                             │
│                                                                                 │
│ Step 3: Cancel current subscription                                            │
│ ──────────────────────────────────────                                        │
│   subscription.updateMany({                                                     │
│     where: { accountId, status: 'ACTIVE' },                                   │
│     data: { status: 'CANCELLED' }                                              │
│   })                                                                            │
│                                                                                 │
│ Step 4: Determine replacement                                                  │
│ ────────────────────────────────────                                          │
│   if action === 'revert':                                                      │
│     ── Find previous cancelled subscription (not current, not yet expired)     │
│     ── if not found → throw 400 NO_REVERTABLE_SUBSCRIPTION                     │
│     ── Create new subscription with PREVIOUS plan's snapshots                  │
│     ── Note: "Reverted from {currentPlan} by admin"                            │
│   else:  /* action === 'cancel' */                                            │
│     ── Find BRONZE plan                                                        │
│     ── if not found → throw 500 MEMBERSHIP_PLAN_NOT_FOUND                      │
│     ── Create subscription with BRONZE plan's snapshots                        │
│     ── Note: "Cancelled from {currentPlan} by admin"                           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Revert vs Cancel

| Action | Use Case | Result |
|--------|----------|--------|
| `cancel` | Remove a paid plan | User gets BRONZE (free) plan |
| `revert` | Rollback a mistaken assignment | User gets their previous plan back |

The revert action looks for a previously cancelled subscription whose `expiresAt` hasn't passed yet. This allows rolling back to a plan that was force-cancelled by a new assignment.

## Membership Guards

Guard functions are lightweight wrappers around `resolveCapabilities`:

### `checkOpenQuota(accountId)` → `{ allowed, remaining }`

```
  caps = resolveCapabilities(accountId)
  if !caps || caps.openLimit < 0 → { allowed: true, remaining: -1 }
  return { allowed: caps.openRemaining > 0, remaining: caps.openRemaining }
```

**Called before:** Viewing a profile for the first time (opens count toward limit)

### `consumeOpenQuota(accountId, profileId)` → void

```
  1. Check if profileOpen record already exists (dedup)
  2. If not:
     - Create profileOpen record
     - Upsert membershipUsage openUsed += 1
```

**Called after:** Profile opened, to decrement the remaining quota

### `checkViewDetails(accountId, minLevel)` → `boolean`

```
  caps = resolveCapabilities(accountId)
  levels = ['BASIC', 'EXTENDED', 'ADVANCED', 'FULL']
  return indexOf(caps.viewDetails) >= indexOf(minLevel)
```

Hierarchy: `BASIC < EXTENDED < ADVANCED < FULL`. This allows checking "does user have at least EXTENDED view?"

**Called before:** Returning detailed profile information in API responses

### `checkPrintAccess(accountId, type)` → `boolean`

```
  caps = resolveCapabilities(accountId)
  return type === 'profile' ? caps.printProfile : caps.printHoroscope
```

### `checkShortlistLimit(accountId)` → `{ allowed, current, limit }`

```
  caps = resolveCapabilities(accountId)
  if !caps || caps.shortlistLimit < 0 → { allowed: true, current: 0, limit: -1 }
  current = shortlist.count({ where: { accountId } })
  return { allowed: current < caps.shortlistLimit, current, limit: caps.shortlistLimit }
```

**Called before:** Adding a profile to shortlist

### `checkProfileSlotLimit(accountId)` → `{ allowed, current, limit }`

```
  caps = resolveCapabilities(accountId)
  if !caps || caps.profileSlotLimit < 0 → { allowed: true, current: 0, limit: -1 }
  current = profile.count({ where: { accountId, currentStatus: { in: [DRAFT, PENDING, ACTIVE, ARCHIVED] } } })
  return { allowed: current < caps.profileSlotLimit, current, limit: caps.profileSlotLimit }
```

**Called before:** Creating a new profile

### `getSearchLevel(accountId)` → `string`

```
  caps = resolveCapabilities(accountId)
  return caps?.searchLevel ?? 'BASIC'
```

**Used in:** Search queries to limit results based on user's search level

## Route Composition

Membership routes use the three-router pattern:

| Router | Routes | Purpose |
|--------|--------|---------|
| `userRouter` | `GET /membership/plans` | List active plans (user-facing content filtering) |
| `userRouter` | `GET /membership/my-subscription` | Current user's subscription |
| `userRouter` | `GET /membership/capabilities` | Current user's capability snapshot |
| `userRouter` | `GET /membership/billing-overview` | Combined billing info |
| `adminRouter` | `GET /admin/membership/plans` | All plans (including inactive) |
| `adminRouter` | `PATCH /admin/membership/plans/:id` | Update a plan definition |
| `adminRouter` | `GET /admin/membership/settings` | Get membership toggle |
| `adminRouter` | `PATCH /admin/membership/settings` | Toggle membership system on/off |
| `adminRouter` | `POST /admin/membership/subscriptions` | Assign a plan to user |
| `adminRouter` | `POST /admin/membership/subscriptions/:accountId/cancel` | Cancel/plan |
| `adminRouter` | `GET /admin/membership/subscriptions` | List all subscriptions (paginated) |
| `adminRouter` | `GET /admin/membership/subscriptions/:accountId/history` | User's subscription history |

## Membership Toggle

The `membership_enabled` system setting acts as a global kill switch:

- **Enabled** (`value = 'true'`): Users see only their subscription's capabilities; BRONZE is the default free plan
- **Disabled** (`value = 'false'` or missing): All users get FULL ACCESS (all capabilities unlimited, full view details, full search)
- This allows the business to launch without membership gating and enable it later

The toggle is checked on every `resolveCapabilities` call (reads from DB), so disabling takes effect immediately without restart.

## Error Scenarios

| Scenario | Sub-pipeline | HTTP | Code |
|----------|--------------|------|------|
| Plan not found | assign | 404 | MEMBERSHIP_PLAN_NOT_FOUND |
| Plan inactive | assign | 400 | MEMBERSHIP_PLAN_INACTIVE |
| Account not found | assign/cancel | 404 | ACCOUNT_NOT_FOUND |
| No active subscription | cancel | 400 | SUBSCRIPTION_NOT_FOUND |
| No previous subscription to revert | cancel (revert) | 400 | NO_REVERTABLE_SUBSCRIPTION |
| BRONZE plan not found on cancel | cancel | 500 | MEMBERSHIP_PLAN_NOT_FOUND |

## Audit Events

| Event | Admin ID | Target | When |
|-------|----------|--------|------|
| `SUBSCRIPTION_ASSIGNED` | adminId | accountId | Plan assigned |
| `SUBSCRIPTION_CANCELLED` | adminId | accountId | Plan cancelled |
| `MEMBERSHIP_SETTING_UPDATED` | adminId | — | Membership toggle changed |

## Testing Considerations

- **Membership disabled test**: Toggle off, verify all users get full access
- **Capability resolution test**: Create subscription → resolve capabilities → verify snapshot values match plan
- **Open quota test**: Open profiles → verify `openRemaining` decrements → reach limit → `checkOpenQuota` returns false
- **Shortlist limit test**: Add profiles to shortlist → reach limit → verify guard returns false
- **Profile slot test**: Create profiles → reach limit → verify guard returns false
- **Cancel → BRONZE fallback test**: Cancel GOLD → verify user gets BRONZE capabilities
- **Revert test**: Assign GOLD → assign PLATINUM → revert → verify GOLD capabilities restored
- **Cross-user test**: Verify one user's capabilities don't affect another's
- **Plan update test**: Update plan definition → existing subscriptions still use snapshotted values; new assignments use new values
- **Paginated subscription list**: Test cursor-based pagination, verify hasMore flag
- **Concurrent assignment test**: Assign two plans simultaneously → second cancels first

## Performance Characteristics

| Aspect | Expected |
|--------|----------|
| P50 latency (resolve) | ~15ms (2 reads) |
| P50 latency (assign) | ~30ms (2 reads + 1-2 writes) |
| P99 latency | ~100ms |
| DB queries (resolve) | 2 (setting + subscription + usage) |
| DB queries (assign) | 3 (plan + account + write) |
| Caching | None currently (snapshot reads from DB each time) |
