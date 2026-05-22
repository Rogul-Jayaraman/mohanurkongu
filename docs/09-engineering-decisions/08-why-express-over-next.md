# ADR-08: Why Express (Separate Backend) over Next.js API Routes

## Context
Need backend API with middleware, validation, service layer, and database access. Frontend is a separate SPA.

## Options Considered
| Option | Pros | Cons |
|---|---|---|
| **Express (separate backend)** | Clear separation, independent scaling, familiar | Two deployments, CORS configuration |
| Next.js API routes | Same deployment, no CORS | Ties backend to frontend framework |
| Fastify | Faster than Express, built-in validation | Less ecosystem, team unfamiliar |
| Hono | Ultra-lightweight, edge-ready | Newer, smaller ecosystem |

## Decision
**Express 5** as a separate backend project. The frontend (Vite SPA) and backend (Express API) are independently deployable on Vercel. This separation provides clear ownership boundaries and independent scaling.

## Consequences
- ✅ Frontend and backend can scale independently
- ✅ Backend can be tested independently
- ✅ Clear separation of concerns (no mixing API and UI code)
- ❌ Two Vercel projects to manage
- ❌ CORS configuration needed
- ❌ Double deployment for full-stack changes

## When to Revisit
- If deployment complexity becomes burdensome → consider monorepo with single Vercel project
- If API performance needs to improve → consider Fastify or Hono
