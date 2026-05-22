# Query Optimization

## Common Query Patterns

### Browse Profiles (Most Critical Query)
```typescript
async function getBrowseProfiles(filters: BrowseFilters) {
    const where: Prisma.ProfileWhereInput = {
        status: 'ACTIVE',
        adminVerified: 'ACCEPTED',
    }
    
    // Dynamic filter building
    if (filters.gender) where.gender = filters.gender
    if (filters.ageMin || filters.ageMax) {
        where.age = {
            ...(filters.ageMin && { gte: filters.ageMin }),
            ...(filters.ageMax && { lte: filters.ageMax }),
        }
    }
    if (filters.district) where.currentDistrict = filters.district
    // ... more filters
    
    return prisma.profile.findMany({
        where,
        select: profileMinSelect,        // Only needed fields
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 50),       // Max 50 per page
        skip: (page - 1) * limit,
    })
}
```

### N+1 Prevention Checklist

| Scenario | ✅ Correct Approach | ❌ Wrong Approach |
|---|---|---|
| Profile + User | `include: { user: { select: {...} } }` | Fetch user separately for each profile |
| Profile + Horoscope | `include: { horoscope: true }` | Nested loop fetching |
| Booking + Package | `include: { package: true }` | Manual package lookup |
| User + Profiles | `include: { profiles: true }` | Multiple user queries |

### Batch Queries
```typescript
// ✅ GOOD: Single query with batch
const profiles = await prisma.profile.findMany({
    where: { id: { in: profileIds } },  // Batch by IDs
})

// ❌ BAD: Sequential queries
for (const id of profileIds) {
    const profile = await prisma.profile.findUnique({ where: { id } })
}
```

## COUNT Optimization

```typescript
// ✅ GOOD: Use count for pagination
const total = await prisma.profile.count({ where })

// ✅ GOOD: Use separate count query (parallel with data query)
const [data, total] = await Promise.all([
    prisma.profile.findMany({ where, skip, take }),
    prisma.profile.count({ where }),
])

// ❌ BAD: Loading all records just to count
const all = await prisma.profile.findMany({ where })
const total = all.length  // Don't do this!
```

## Avoiding Full Table Scans

| Query Pattern | Risk | Solution |
|---|---|---|
| `WHERE textField LIKE '%term%'` | Full scan | PostgreSQL full-text search |
| `ORDER BY RANDOM()` | Full scan | Accept deterministic order |
| `WHERE nullableCol IS NOT NULL` | Full scan (if low selectivity) | Index only if needed |
| Missing WHERE clause | Full scan | Always add WHERE for list queries |

## Raw SQL When Necessary

```typescript
// When Prisma's query builder is insufficient:
// 1. Complex aggregations
// 2. Full-text search
// 3. Window functions
// 4. Recursive CTEs

// Always use parameterized template literals:
const results = await prisma.$queryRaw`
    SELECT p.*, u.fullname_en
    FROM "Profile" p
    JOIN "User" u ON u.id = p.user_id
    WHERE p.status = 'ACTIVE'
    AND p.admin_verified = 'ACCEPTED'
    ORDER BY p.created_at DESC
    LIMIT ${limit}
    OFFSET ${skip}
`
```

## Query Performance Checklist

| Check | Tool | Frequency |
|---|---|---|
| Slow queries (>100ms) | Prisma `log: ['query']` | Development |
| Missing indexes | `EXPLAIN ANALYZE` | Per new feature |
| N+1 patterns | Manual code review | Per PR |
| Full table scans | Neon console → Query analysis | Weekly |
| Connection pool usage | Neon dashboard | Daily |
| Long-running transactions | `pg_stat_activity` | On incident |

## What NOT To Do

- ❌ Do NOT use `select: *` when you only need specific fields
- ❌ Do NOT fetch related data in loops — use Prisma `include` or batch queries
- ❌ Do NOT use `$queryRawUnsafe` with string interpolation — SQL injection risk
- ❌ Do NOT skip pagination on list endpoints — always implement `take`/`skip`
- ❌ Do NOT use `offset` for paginating very large datasets (>10K rows) — use cursor-based
- ❌ Do NOT run heavy analytical queries on the primary database — use a read replica (future)
