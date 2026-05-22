# Troubleshooting: Prisma Connection Pool Exhaustion

## Symptoms
- `Error: Too many clients already`
- `Error: Cannot enqueue Query after invoking quit`
- API endpoints hang or return 503
- Backend logs show repeated connection errors

## Root Causes

| Cause | Scenario |
|---|---|
| **Multiple PrismaClient instances** | Hot-reload creates new instances without destroying old ones |
| **No connection pooling in serverless** | Each serverless invocation opens a new connection |
| **Neon free tier limit (10 conns)** | Exceeded by concurrent requests |
| **Connection leaks** | Transactions not closed, long-running queries hold connections |

## Debugging Steps

```bash
# 1. Check active connections in Neon
# Run via Prisma or psql:
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;

# 2. Check if Prisma singleton is working
# config/prisma.ts — verify globalThis pattern is correct

# 3. Check connection string
# For serverless, use pooled connection:
# postgresql://...@ep-name.region.aws.neon.tech/neondb?sslmode=require&pgbouncer=true
```

## Fix

### Fix 1: Ensure Prisma Singleton
```typescript
// backend/src/config/prisma.ts
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
})
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Fix 2: Use Pooled Connection for Serverless
```bash
# Add ?pgbouncer=true to DATABASE_URL for Vercel deployments
DATABASE_URL="postgresql://...@ep-name.neon.tech/neondb?sslmode=require&pgbouncer=true"
```

### Fix 3: Reduce Connection Limit
```typescript
// Future: Configure Prisma pool size
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
    // Prisma doesn't expose pool config directly
    // Use @prisma/adapter-neon for connection limiting
})
```

## Prevention

- ✅ Singleton PrismaClient pattern
- ✅ Pooled connection string for serverless
- ✅ Monitor connection count in Neon dashboard
- ✅ Set up alerts for connection usage > 80%
- ✅ Use `@prisma/adapter-neon` for proper serverless pooling (future)

## See Also
- [Neon Connection Pooling](../06-devops/02-neon-postgresql.md)
- [Backend Performance](../04-backend/05-performance.md)
