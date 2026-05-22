# Troubleshooting: Vercel Serverless Timeouts

## Symptoms
- API returns 504 after ~10 seconds
- `FUNCTION_INVOCATION_TIMEOUT` in Vercel logs
- Backend logs show query completed but response not sent

## Root Causes

| Cause | Scenario |
|---|---|
| **Heavy Prisma query** | Full table scan, missing index, no limit |
| **Cold start delay** | Function spun down, takes 2-10s to initialize |
| **Async operation not awaited** | Missing `await` on Prisma/external call |
| **External API timeout** | Cloudinary or email service slow |
| **Response not sent** | Controller error path doesn't call `sendSuccess/sendError` |

## Debugging Steps

```bash
# 1. Check Vercel function logs
# Vercel Dashboard → Backend → Logs
# Look for: "FUNCTION_INVOCATION_TIMEOUT" or duration > 9s

# 2. Add timing logs
console.time('query')
const result = await prisma.profile.findMany(...)
console.timeEnd('query')

# 3. Check Prisma query plan
await prisma.$queryRaw`EXPLAIN ANALYZE ${query}`

# 4. Verify all async operations are awaited
# Search for: Prisma calls without await
```

## Fix

### Fix 1: Optimize Queries
```typescript
// Add pagination (limit)
const profiles = await prisma.profile.findMany({
    take: 50,  // Always limit!
    where: { /* ... */ },
})
```

### Fix 2: Reduce Cold Start
```bash
# Add keep-alive pings (via cron-job.org or similar):
# GET https://mohanurkongubackend.vercel.app/health
# Every 5 minutes
```

### Fix 3: Move Heavy Work to Background
```typescript
// For long-running tasks (future):
// Instead of in-request processing:
const result = await heavyComputation(input)

// Use background job:
const job = await queue.add('heavy-task', input)
return { jobId: job.id }
```

## Prevention

- ✅ Always add `take`/`limit` to list queries
- ✅ Add timing logs to catch slow operations
- ✅ Use `Promise.all` for parallel independent queries
- ✅ Keep serverless function bundle small
- ✅ Warm functions with keep-alive pings
