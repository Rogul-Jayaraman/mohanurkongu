# Mohanurkongu Documentation

A matrimony (Manamaalai) + hall booking (Maaligai) platform — one codebase, two products.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        WHO SHOULD READ WHAT                         │
├─────────────────────────────────────────────────────────────────────┤
│  NEW DEVELOPER                                                      │
│    ┌─────────────────────────────────────────────────────────┐      │
│    │  01-overview/01-01-WHAT_IS_THIS.md                       │      │
│    │  02-getting-started/02-01-QUICKSTART.md                  │      │
│    │  04-development/04-01-BACKEND_CODEBASE_TOUR.md          │      │
│    └─────────────────────────────────────────────────────────┘      │
│                                                                     │
│  JUNIOR / MID DEVELOPER                                             │
│    ┌─────────────────────────────────────────────────────────┐      │
│   │  03-architecture/ (all 11 files — understand the system) │      │
│    │  04-development/04-03-HOW_TO_ADD_A_ROUTE.md              │      │
│    │  04-development/04-04-HOW_TO_ADD_A_PIPELINE.md           │      │
│    └─────────────────────────────────────────────────────────┘      │
│                                                                     │
│  SENIOR / ARCHITECT                                                │
│    ┌─────────────────────────────────────────────────────────┐      │
│    │  06-business-logic/ (state machines + edge cases)        │      │
│    │  05-pipelines/05-01-INDEX.md                             │      │
│    │  08-reference/ (config, error codes, API ref)            │      │
│    └─────────────────────────────────────────────────────────┘      │
│                                                                     │
│  DEVOPS / OPS                                                      │
│    ┌─────────────────────────────────────────────────────────┐      │
│    │  07-operations/ (deploy, monitor, backup, security)      │      │
│    │  03-architecture/03-10-DEPLOYMENT_TOPOLOGY.md            │      │
│    └─────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

## Reading Order

| # | Section | What You Will Learn |
|---|---------|-------------------|
| 01 | [Overview](01-overview/01-01-WHAT_IS_THIS.md) | What the system does, glossary, tech stack |
| 02 | [Getting Started](02-getting-started/02-01-QUICKSTART.md) | Clone, install, run tests in 10 minutes |
| 03 | [Architecture](03-architecture/03-01-SYSTEM_OVERVIEW.md) | System design, request lifecycle, pipeline pattern, DB schema, auth, caching, i18n, deployment, storage |
| 04 | [Development](04-development/04-01-BACKEND_CODEBASE_TOUR.md) | Codebase tours, how-to guides, patterns, error handling |
| 05 | [Pipeline Index](05-pipelines/05-01-INDEX.md) | Master index of all 61 pipeline files |
| 06 | [Business Logic](06-business-logic/06-01-ACCOUNT_LIFECYCLE.md) | State machines, business rules, edge cases |
| 07 | [Operations](07-operations/07-01-DEPLOYMENT_GUIDE.md) | Deploy, monitor, backup, security checklist |
| 08 | [Reference](08-reference/08-01-CONFIGURATION.md) | Config, error codes, API ref, feature matrix, limitations, modules |

## Quick Links

- **Pipeline docs** (61 files): [`05-pipelines/`](05-pipelines/05-01-INDEX.md) — indexed in section 05
- **Source code**: [`backend/`](../backend/), [`frontend/`](../frontend/)
- **Infrastructure**: [`docker/`](../docker/) — dev & prod compose files in `docker/`
