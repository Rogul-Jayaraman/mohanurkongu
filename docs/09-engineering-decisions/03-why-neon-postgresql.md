# ADR-03: Why Neon PostgreSQL

## Context
Need PostgreSQL database that works with Vercel serverless functions. Requirements: serverless-compatible, good free tier, branching for development.

## Options Considered
| Option | Pros | Cons |
|---|---|---|
| **Neon** | Serverless-native, branching, generous free tier | Connection limits on free tier |
| Supabase | PostgreSQL + auth + storage | Overkill for this app, vendor lock-in |
| AWS RDS | Full control, any scale | Complex setup, no free tier |
| Railway | Simple, managed | More expensive per GB |
| PlanetScale (MySQL) | Serverless, branching | MySQL (no PostgreSQL features) |

## Decision
**Neon**. Purpose-built for serverless with connection pooling via PgBouncer. Database branching enables isolated dev/testing environments. Free tier sufficient for launch.

## Consequences
- ✅ Connection pooling built-in (pgBouncer compatible)
- ✅ Database branching for dev/staging
- ✅ 10GB storage on free tier
- ❌ 10 connection limit on free tier (requires careful pool management)
- ❌ Cold start for first connection after idle

## When to Revisit
- If connection limits become a bottleneck → upgrade to Scale plan or use pgBouncer
- If multi-region needed → consider AWS RDS or Aurora
