# Neon PostgreSQL Configuration

## Neon Architecture

```mermaid
flowchart LR
    subgraph Neon["Neon Platform"]
        Compute["Compute Endpoint<br/>(read-write)"]
        Storage["Storage Layer<br/>(branchable)"]
        Pooler["PgBouncer Pooler"]
    end
    
    subgraph Connections["Connection Paths"]
        Direct["Direct: psql postgresql://..."]
        Pooled["Pooled: postgresql://...?pgbouncer=true"]
        Serverless["Prisma: via @prisma/adapter-neon"]
    end
    
    Vercel["Vercel Serverless"] --> Pooled
    Local["Local Dev"] --> Direct
    Prisma["Prisma Client"] --> Pooler
    Pooler --> Compute
    Compute --> Storage
```

## Connection Pooling with Neon

### Why Neon Pooling Matters

Serverless functions create short-lived connections. Without pooling, each function invocation opens a new connection, exhausting Neon's connection limit (10 on free tier, 100 on scale).

### Connection String Formats

```bash
# Direct connection (local dev, long-running processes)
DATABASE_URL="postgresql://user:pass@ep-name.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

# Pooled connection (serverless/Vercel)
DATABASE_URL="postgresql://user:pass@ep-name.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"

# Prisma adapter connection (recommended for serverless)
DATABASE_URL="postgresql://user:pass@ep-name.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
# With @prisma/adapter-neon + @neondatabase/serverless
```

### Pool Configuration (Future)

```typescript
import { Pool, neonConfig } from '@neondatabase/serverless'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,           // Max connections in pool
    idleTimeoutMillis: 30000,  // Close idle connections after 30s
    connectionTimeoutMillis: 10000,  // Fail after 10s
})
```

## Connection Limits

| Plan | Max Connections | Pooled Connections | Recommended For |
|---|---|---|---|
| Free | 10 | 5 | Development, light usage |
| Launch | 25 | 20 | Production (current) |
| Scale | 100+ | 50+ | High traffic |

## Monitoring

```bash
# Check active connections
SELECT * FROM pg_stat_activity WHERE datname = 'neondb';

# Check connection count
SELECT count(*) FROM pg_stat_activity WHERE datname = 'neondb';

# Check long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;
```

## Common Issues

### Connection Pool Exhaustion
**Symptom**: `Error: too many connections for database`
**Causes**: Multiple Prisma instances, no pooling in serverless, connection leaks
**Fix**: Singleton Prisma client, use pooled connection string, add `@prisma/adapter-neon`

### Idle Connection Timeout
**Symptom**: `Error: Connection terminated unexpectedly`
**Cause**: Neon closes idle connections after 5 minutes
**Fix**: Prisma auto-reconnects; implement connection retry

## What NOT To Do

- ❌ Do NOT use the direct connection string in serverless environments — use pooled
- ❌ Do NOT create new PrismaClient instances on every request — use singleton
- ❌ Do NOT exceed Neon's connection limit — configure pooling appropriately
- ❌ Do NOT run heavy analytical queries on the primary compute endpoint
- ❌ Do NOT disable SSL — `sslmode=require` is mandatory for Neon
