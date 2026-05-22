# ADR-04: Why Vercel

## Context
Need hosting for both frontend SPA and backend Express API. Requirements: easy deployment from GitHub, free tier, good performance.

## Options Considered
| Option | Pros | Cons |
|---|---|---|
| **Vercel** | SPA + serverless, GitHub integration, generous free tier | Serverless limitations (timeout, cold start) |
| Netlify | Similar to Vercel, good for static | Serverless functions less mature |
| AWS S3 + Lambda | Full control, any scale | Complex setup, higher cognitive load |
| Render | Simple, persistent services | No serverless (always-on costs) |
| Railway | All-in-one platform | More expensive, smaller community |

## Decision
**Vercel** for both frontend (static SPA) and backend (serverless function). Tight GitHub integration means auto-deploy on push. The SPA rewrite config (`vercel.json`) handles client-side routing.

## Consequences
- ✅ Auto-deploy from GitHub (zero-config)
- ✅ Free tier for both frontend and backend
- ✅ Edge CDN for frontend assets
- ❌ Serverless cold starts (~1-5s)
- ❌ 10s function timeout (Hobby plan)
- ❌ Limited concurrent executions (1000 Hobby)

## When to Revisit
- If cold start latency becomes unacceptable → Vercel Pro with Provisioned Concurrency
- If function timeout is too restrictive → extract heavy tasks to external worker
