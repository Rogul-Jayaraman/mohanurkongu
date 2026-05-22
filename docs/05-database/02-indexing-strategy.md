# Indexing Strategy

## Index Reference

Every index in the schema exists for a specific reason. Here's the complete rationale:

### Profile Indexes

| Index | Columns | Query Pattern | Why It Exists |
|---|---|---|---|
| `gender_status_verified` | `gender, status, adminVerified` | Browse profiles: "Show me ACTIVE, ACCEPTED FEMALE profiles" | Primary browse query — every profile list starts here |
| `currentDistrict` | `currentDistrict` | "Show profiles from Coimbatore" | Location filter in browse |
| `kulam` | `kulam` | "Show profiles from Gounder community" | Community filter |
| `age` | `age` | "Show profiles age 22-30" | Age range filter |
| `salaryMonthly` | `salaryMonthly` | "Show profiles with salary > 50K" | Salary filter |
| `height` | `height` | "Show profiles height 150-170cm" | Height range filter |
| `dosham` | `dosham` | "Show profiles with/without dosham" | Astrology filter |
| `rasi` | `rasi` | "Show profiles with MESHA rasi" | Astrology filter |
| `maritalStatus` | `maritalStatus` | "Show never married profiles" | Marital status filter |
| `star` | `star` | "Show profiles with ASHWINI nakshatra" | Star filter |
| `diet` | `diet` | "Show vegetarian profiles" | Diet filter |
| `userId` | `userId` | "Show MY profiles" | User-owned profile queries |

### Query Patterns

```prisma
// Most common browse query — uses gender_status_verified COMPOUND index
const profiles = await prisma.profile.findMany({
    where: {
        gender: 'FEMALE',
        status: 'ACTIVE',
        adminVerified: 'ACCEPTED',
        // Additional filters use their own indexes
        currentDistrict: 'COIMBATORE',    // index
        kulam: 'KONGU_VELLALAR',          // index
        age: { gte: 22, lte: 30 },        // index
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    skip: 0,
})
```

### Why Compound Index for `(gender, status, adminVerified)`?

This is the **most important index** in the application. The browse profiles query ALWAYS filters by:
1. Gender (user selects bride/groom)
2. Status (must be ACTIVE)
3. Admin verified (must be ACCEPTED)

A compound index on these three columns means PostgreSQL can satisfy the WHERE clause with a single index scan, rather than scanning + filtering.

### Shortlist Indexes

| Index | Columns | Why |
|---|---|---|
| `userId` | `userId` | "Get all shortlisted profiles for this user" |
| `profileId_userId` | `profileId, userId` (UNIQUE) | Prevents duplicate shortlists |

### MandapamBooking Indexes

| Index | Columns | Why |
|---|---|---|
| `date_session` | `date, session` (UNIQUE) | **Critical**: prevents double-booking of same hall on same session |
| `date` | `date` | Calendar queries: "Show ALL bookings on this date" |
| `paymentStatus` | `paymentStatus` | Admin finance queries: "Show all unpaid bookings" |
| `createdBy` | `createdBy` | "Show bookings created by this admin" |

### Other Indexes

| Model | Index | Why |
|---|---|---|
| `User` | `email` (UNIQUE) | Login lookup |
| `User` | `phone` (UNIQUE) | Phone lookup |
| `User` | `customId` (UNIQUE) | Display ID lookup |
| `BlockedDate` | `date` (UNIQUE) | Only one block reason per date |
| `RegistrationCounter` | `districtCode` (PK) | Atomic counter lookup |

## Missing Indexes Check

Are there any common queries NOT covered by current indexes?

| Query | Covered? | Risk |
|---|---|---|
| "Profiles from a specific city" | ✅ (currentDistrict) | Low — city is less common filter |
| "Profiles with specific education" | ❌ | Low — educationDetails is text field, not filtered often |
| "Profiles created this week" | ❌ | Medium — admin dashboard query using `createdAt` |
| "Profiles ordered by regNo" | ❌ | Low — not a regular query pattern |
| "Booking by contact phone" | ❌ | Low — admin searches by phone rarely |

### Recommended Addition: `createdAt` Index on Profile

```prisma
// Add if admin dashboard queries are slow:
@@index([createdAt])
// Needed for: "Show recent profiles" and "Profiles created this week"
```

## Index Performance Rules

| Rule | Reason |
|---|---|
| Index columns used in WHERE first | PostgreSQL uses indexes for filtering, not sorting |
| Compound index order matters | Put high-selectivity columns first (gender > status > adminVerified) |
| Don't index boolean/low-cardinality columns alone | `isActive` on its own rarely helps — combine with other filters |
| Index foreign keys | Every FK should have an index (already done via `@@index`) |
| Monitor index size | Indexes add write overhead and storage cost |

## Query Analysis Tools

```bash
# Prisma query logging (development)
# backend/src/config/prisma.ts
const prisma = new PrismaClient({ 
    log: ['query', 'info', 'warn', 'error'] 
})

# Manual EXPLAIN ANALYZE via Prisma
await prisma.$queryRaw`EXPLAIN ANALYZE SELECT * FROM "Profile" WHERE ...`
```

## What NOT To Do

- ❌ Do NOT add indexes "just in case" — each index adds write overhead
- ❌ Do NOT use `@unique` on nullable columns — PostgreSQL allows multiple NULLs
- ❌ Do NOT index columns that are never filtered or sorted
- ❌ Do NOT create indexes on text/blob columns without hash or prefix limits
- ❌ Do NOT add indexes without first checking `EXPLAIN ANALYZE` output
- ❌ Do NOT remove existing indexes without confirming no queries depend on them
