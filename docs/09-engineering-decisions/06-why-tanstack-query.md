# ADR-06: Why TanStack Query (React Query)

## Context
Need server state management for API data. Requirements: caching, deduplication, background refetch, optimistic updates.

## Options Considered
| Option | Pros | Cons |
|---|---|---|
| **TanStack Query** | Automatic caching, deduplication, DevTools | Adds ~12KB to bundle |
| SWR | Similar to TanStack Query | Less feature-rich |
| Zustand + manual fetch | Lightweight | No caching, dedup, or refetch |
| Redux Toolkit + RTK Query | Full-featured | Heavy (~30KB), complex |
| Context + useEffect | Built-in | No caching, prop drilling, re-render issues |

## Decision
**TanStack Query v5**. It automatically handles caching, request deduplication, background refetching, and cache invalidation. DevTools enable debugging query state.

## Consequences
- ✅ Automatic cache management (no manual state for API data)
- ✅ Request deduplication (same query from multiple components = 1 API call)
- ✅ Cache invalidation on mutation success
- ✅ Background refetch for data freshness
- ❌ Additional bundle size (~12KB)
- ❌ Learning curve for query keys and cache invalidation patterns

## When to Revisit
- If bundle size becomes critical and manual caching is acceptable → SWR
- If needing normalized cache (like Apollo) → consider RTK Query
