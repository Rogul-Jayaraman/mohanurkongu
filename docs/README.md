# Mohanur Kongu Manamaalai — Engineering Documentation

**Domain:** Matrimony + Mandapam (marriage hall booking) platform for the Kongu Vellalar community.

**Repository:** `Mohanurkongu` — monorepo (backend + frontend + workers)

**Status:** Pre-production | Auth module connected | All other modules use stubs

## Quick Links

- [CREATE_NEW_PROFILE](./features/CREATE_NEW_PROFILE.md) — Complete profile creation workflow (7-step wizard, draft save/resume, upload lifecycle, publish)
- [PROJECT_OVERVIEW](./PROJECT_OVERVIEW.md) — Goals, domain, team, lifecycle
- [SYSTEM_OVERVIEW](./SYSTEM_OVERVIEW.md) — High-level architecture
- [MODULES](./MODULES.md) — Module breakdown with status
- [FEATURE_MATRIX](./FEATURE_MATRIX.md) — Feature-by-feature implementation status
- [BUSINESS_RULES](./BUSINESS_RULES.md) — State machines, validation, permissions
- [KNOWN_LIMITATIONS](./KNOWN_LIMITATIONS.md) — Gaps, stubs, unimplemented paths
- [architecture/](./architecture/) — Context, component, sequence, deployment diagrams
- [BOOKING_ARCHITECTURE](./architecture.md) — Booking system architecture (20 diagrams)
- [config/ENVIRONMENT.md](./config/ENVIRONMENT.md) — Environment variables reference
- [deployment/](./deployment/) — Deployment, rollback, backup, monitoring, runbook
- [database/](./database/) — Schema, ERD, data rules, migration guide
- [api/](./api/) — OpenAPI spec, error reference, Postman collection
- [quality/](./quality/) — Bug reports, regression matrix, risk register
- [incidents/](./incidents/) — Incident history, postmortems, recovery plans
- [adr/](./adr/) — Architecture Decision Records
- [architecture/CACHE_ARCHITECTURE](./architecture/CACHE_ARCHITECTURE.md) — 3-layer cache (Redis + React Query + DB) with permission isolation
- [features/CACHE_MUTATIONS](./features/CACHE_MUTATIONS.md) — Cache mutation feature workflow (which mutations invalidate which keys)

## Documentation Coverage

| Category | Coverage | Missing |
|---|---|---|
| Architecture | 100% | — |
| Caching | 100% | — (Phase 0-1 in progress) |
| API Contracts | 100% (auth) | 0% (profiles, admin, mandapam — no backend) |
| Database | 100% | — |
| Deployment | 90% | CI/CD pipeline TBD |
| Config/Env | 100% | — |
| Quality/Bugs | 100% | — |
| Incidents | 100% | — |
| ADRs | 100% | — |
