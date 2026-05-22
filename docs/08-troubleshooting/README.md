# Troubleshooting Guides

## Index

| # | Issue | Severity | Affects |
|---|---|---|---|
| [01](./01-prisma-connection-pool.md) | Prisma Connection Pool Exhaustion | 🔴 Critical | Backend |
| [02](./02-hydration-issues.md) | React Hydration Issues | 🟡 Medium | Frontend |
| [03](./03-vercel-serverless-timeouts.md) | Vercel Serverless Timeouts | 🟡 Medium | Backend |
| [04](./04-authentication-failures.md) | Authentication Failures | 🔴 Critical | Both |
| [05](./05-slow-queries.md) | Slow Database Queries | 🟡 Medium | Backend |
| [06](./06-react-render-loops.md) | React Render Loops | 🟡 Medium | Frontend |
| [07](./07-memory-leaks.md) | Memory Leaks | 🟡 Medium | Frontend |
| [08](./08-api-bottlenecks.md) | API Bottlenecks | 🟡 Medium | Backend |

## Decision Trees

```mermaid
flowchart TD
    Problem["❗ Something is broken"] --> Identify{"Where?"}
    
    Identify -->|"Frontend issue"| Frontend
    Identify -->|"Backend issue"| Backend
    Identify -->|"Auth issue"| Auth
    Identify -->|"Slow response"| Perf
    
    Frontend --> F1{"Blank screen?"}
    F1 -->|Yes| Hydration["See: Hydration Issues #02"]
    F1 -->|No| F2{"Infinite re-render?"}
    F2 -->|Yes| Render["See: Render Loops #06"]
    F2 -->|No| F3{"Memory growing?"}
    F3 -->|Yes| Memory["See: Memory Leaks #07"]
    
    Backend --> B1{"Prisma errors?"}
    B1 -->|Yes| Pool["See: Connection Pool #01"]
    B1 -->|No| B2{"Timeout?"}
    B2 -->|Yes| Timeout["See: Serverless Timeouts #03"]
    B2 -->|No| B3{"Slow query?"}
    B3 -->|Yes| SlowQ["See: Slow Queries #05"]
    B3 -->|No| B4{"API slow?"}
    B4 -->|Yes| Bottleneck["See: API Bottlenecks #08"]
    
    Auth --> A1{"Can't login?"}
    A1 -->|Yes| AuthFail["See: Auth Failures #04"]
    A1 -->|No| A2{"Token expired?"}
    A2 -->|Yes| AuthFail
```

## Quick Reference

| Symptom | Most Likely Cause | First Check |
|---|---|---|
| Blank white page | JS bundle failed to load | Browser console → network tab |
| API returns 500 | Unhandled error | Backend logs |
| API returns 401 | Token expired/missing | localStorage token exists? |
| API returns 403 | Wrong user role | User has ADMIN role? |
| Slow browse page | Missing index or N+1 | Prisma query log |
| Cant create booking | Date+session conflict | Check existing bookings |
| OTP not received | Email config issue | Check EMAIL_* env vars |
| Image not loading | Cloudinary URL wrong | Check Cloudinary env vars |
