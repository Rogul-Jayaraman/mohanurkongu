# Troubleshooting: Slow Database Queries

## Symptoms
- List endpoints take > 1 second
- Prisma query log shows > 200ms queries
- Dashboard/analytics pages load slowly
- `EXPLAIN ANALYZE` shows sequential scans

## Root Causes

| Cause | Detection |
|---|---|
| **Missing index** | `EXPLAIN ANALYZE` shows `Seq Scan` instead of `Index Scan` |
| **N+1 queries** | Multiple sequential queries in a loop |
| **No pagination** | Query returns thousands of rows |
| **Large OFFSET** | Deep pagination with `skip: 10000` |
| **Unoptimized JOIN** | Missing FK indexes, wrong join order |
| **Inefficient filter order** | Non-selective filter first in WHERE |

## Diagnostic Steps

```bash
# 1. Enable Prisma query logging
# In config/prisma.ts:
log: ['query', 'info', 'warn', 'error']

# This logs every SQL query with duration

# 2. Use EXPLAIN ANALYZE
await prisma.$queryRaw`EXPLAIN ANALYZE 
    SELECT * FROM "Profile" 
    WHERE gender = 'FEMALE' 
    AND status = 'ACTIVE'
    AND admin_verified = 'ACCEPTED'
    LIMIT 20`

# 3. Check Neon Query Analysis
# Neon Console → Query Analysis → Slow queries
```

## Fix Patterns

### Fix 1: Add Missing Index
```prisma
@@index([yourColumn])  // Add to schema.prisma
// Then: npx prisma migrate dev --name add-index
```

### Fix 2: Add Pagination
```typescript
// Always paginate list endpoints:
const profiles = await prisma.profile.findMany({
    take: Math.min(limit, 50),  // Never return unlimited
    skip: (page - 1) * limit,
})
```

### Fix 3: Fix N+1
```typescript
// ❌ BAD:
const profiles = await prisma.profile.findMany()
for (const p of profiles) {
    const user = await prisma.user.findUnique({ where: { id: p.userId } })
}

// ✅ GOOD:
const profiles = await prisma.profile.findMany({
    include: { user: { select: { fullnameEn: true } } }
})
```

### Fix 4: Use Cursor Pagination (for deep pages)
```typescript
// Instead of OFFSET for deep pagination:
const profiles = await prisma.profile.findMany({
    take: 20,
    cursor: { id: lastSeenId },
    skip: 1,  // Skip the cursor itself
})
```

## Prevention
- ✅ Index all WHERE/JOIN/ORDER BY columns
- ✅ Always paginate list endpoints
- ✅ Use `select` to fetch only needed fields
- ✅ Monitor Prisma query logs in development
- ✅ Review `EXPLAIN ANALYZE` for new complex queries
