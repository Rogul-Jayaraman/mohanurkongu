# Production-Grade Cache + Mutation Architecture Audit & Implementation

You are acting as a Principal Software Engineer + Distributed Systems Architect + Security Engineer + API Platform Architect + Performance Engineer.

Your responsibility is to design and implement a complete caching + mutation architecture for an existing production application.

---

# Critical Constraints

This is an EXISTING LIVE CODEBASE.

You MUST:

- NEVER break existing features
- Preserve backward compatibility
- Maintain existing API contracts unless migration is absolutely required
- Avoid downtime
- Avoid performance regressions
- Avoid stale/security-sensitive data exposure
- Avoid introducing hidden state bugs
- Keep implementation incremental and rollback-safe
- Preserve scalability
- Preserve adaptability
- Preserve reusability
- Preserve maintainability
- Preserve security
- Preserve observability

You are NOT allowed to redesign unrelated systems.

Any architecture change must include:

- reasoning
- risks
- migration path
- rollback plan
- testing strategy
- production impact

---

# Existing Context

Current state:

- Caching = NOT implemented
- Auth/account flows already implemented
- Admin auth may still be incomplete
- Existing production architecture already exists:
  - Frontend
  - Backend APIs
  - Database
  - Authentication
  - Existing business logic
  - Existing deployment pipeline

Goal:

Introduce:

- API caching
- Mutation architecture
- Invalidation
- Consistency controls
- Performance improvements
- Cache observability
- Safe production rollout

WITHOUT breaking current behavior.

---

# Phase 0 — Deep Architecture Audit (MANDATORY)

Analyze the ENTIRE codebase.

Generate:

## Current System Map

Map:

- Request lifecycle
- Routing
- Middleware chain
- Auth flow
- Session flow
- Service layer
- Database access
- ORM structure
- Transaction boundaries
- Event systems
- Queue systems
- Shared utilities
- State ownership
- Existing response contracts

Generate diagrams.

---

## Endpoint Inventory

Create:

| Endpoint | Domain | Method | Read/Write | Auth | Cacheable |
|----------|--------|--------|------------|------|----------|

Document:

- dependencies
- downstream effects
- ownership

---

## Data Classification

Classify every endpoint:

### NEVER CACHE

Examples:

- OTP
- Login
- Refresh Token
- Password Reset
- Session Validation
- Admin Sensitive Data
- Security Events
- Payments
- Mutations

---

### PRIVATE CACHE

Examples:

- Profile
- Dashboard
- Preferences
- User Metadata

---

### SHARED CACHE

Examples:

- Lookup Data
- Calendar
- Public Metadata
- Configuration

Generate:

| Endpoint | Cache Type | TTL | Invalidation |
|----------|------------|-----|-------------|

---

# Phase 1 — Cache Architecture

Design a complete cache system.

Architecture:

Client
↓
CDN (if exists)
↓
API
↓
L1 Cache
↓
L2 Distributed Cache
↓
Database

Document:

- ownership
- expiration
- consistency
- eviction

---

## Multi-Level Cache

L1:
- Process Memory
- Ultra Low TTL

L2:
- Distributed Cache

L3:
- Database

Document:

- read order
- fallback strategy
- invalidation strategy

---

## Cache Patterns

Choose per endpoint:

### Cache Aside

Read:
Cache
↓
DB
↓
Cache

---

### Read Through

Cache controls DB access.

---

### Write Through

Mutation
↓
Cache
↓
DB

---

### Write Behind

ONLY if safe.

---

### Stale While Revalidate

Serve stale safely.

---

### Single Flight

Prevent:

- cache stampede
- duplicate DB calls
- request storms

Generate decision table.

---

# Phase 2 — Mutation Architecture

Audit ALL mutations.

Generate:

| Mutation | Transaction | Side Effects | Cache Impact |

For each mutation:

Validation
↓
Authorization
↓
Transaction
↓
DB Commit
↓
Events
↓
Cache Invalidation
↓
Response

Rules:

NEVER:

- update cache before DB commit
- invalidate before transaction success
- mix sync/async ownership

---

## Mutation Recovery

Handle:

- partial failure
- retries
- rollback
- duplicated requests

Implement:

- idempotency
- retry policy
- dead letter handling

---

# Phase 3 — Cache Key Registry

Create strict naming.

Format:

env:domain:resource:scope:version:id

Examples:

prod:user:profile:v1:123

Rules:

- deterministic
- tenant safe
- versionable
- collision resistant

Generate:

| Key | Owner | TTL | Invalidation |

---

# Phase 4 — Security Review

Perform full cache security audit.

Detect:

- cache poisoning
- stale authorization
- privilege leakage
- tenant leakage
- JWT exposure
- session leakage
- replay attacks
- timing attacks

Rules:

NEVER CACHE:

- tokens
- secrets
- sessions
- OTP
- permissions

Require:

- isolation
- scoped invalidation
- encryption where necessary

Generate threat model.

---

# Phase 5 — Performance Engineering

Benchmark current system.

Measure:

Baseline:

- P50
- P95
- P99
- DB latency
- CPU
- memory
- throughput

Target:

Cache Hit:
>90%

P95:
<150ms

Generate:

- bottleneck report
- optimization opportunities
- benchmark comparison

---

# Phase 6 — Resilience

Define behavior for:

- cache outage
- cache corruption
- invalidation failure
- stale reads
- DB overload

Implement:

- timeout
- circuit breaker
- retry
- degradation strategy
- fallback logic

Generate decision matrix.

---

# Phase 7 — Observability

Add:

Metrics:

- cache_hit
- cache_miss
- invalidation_count
- rebuild_count
- latency

Tracing:

request
→ cache
→ db

Logging:

cache_hit
cache_miss
cache_write
cache_rebuild
cache_error

Alerts:

- hit ratio collapse
- memory pressure
- latency spikes

---

# Phase 8 — Testing

Generate:

Unit Tests

Integration Tests

Contract Tests

Mutation Tests

Load Tests

Chaos Tests

Race Tests

Concurrency Tests

Verify:

- stale data
- invalidation correctness
- cache rebuild
- auth isolation

---

# Phase 9 — Safe Rollout

Use Feature Flags ONLY.

Stages:

Stage 1:
Shadow Mode

Stage 2:
Read Cache

Stage 3:
Selective Endpoints

Stage 4:
Mutation Invalidation

Stage 5:
Full Rollout

Support:

- instant rollback
- endpoint disable
- emergency kill switch

---

# Deliverables

Generate:

1. Current Architecture Audit
2. Endpoint Inventory
3. Cache Opportunity Matrix
4. Mutation Dependency Graph
5. Cache Key Registry
6. Security Audit
7. Benchmark Report
8. Rollout Plan
9. Rollback Plan
10. Test Strategy
11. Monitoring Strategy
12. Final Architecture Diagram
13. Production Readiness Checklist

---

# Implementation Rules

Code MUST:

- preserve API contracts
- preserve existing behavior
- avoid over-abstraction
- avoid over-caching
- support horizontal scaling
- support future event-driven evolution

For EVERY change provide:

- Why
- Risk
- Migration impact
- Rollback
- Tests
- Monitoring

If uncertain:

DO NOT IMPLEMENT.

Document assumptions first.

Success Criteria:

- Zero functional regressions
- Measurable performance gains
- Secure cache boundaries
- Consistent mutations
- Production-safe rollout
- Scalable architecture