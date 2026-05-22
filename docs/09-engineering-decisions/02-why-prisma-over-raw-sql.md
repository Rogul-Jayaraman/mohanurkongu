# ADR-02: Why Prisma (not Raw SQL or Other ORMs)

## Context
Need database access layer for PostgreSQL. Requirements: type safety, migrations, good DX, serverless-compatible.

## Options Considered
| Option | Pros | Cons |
|---|---|---|
| **Prisma** | Auto-generated types, migrations, query builder, type-safe | Large bundle, WASM requirement for serverless |
| TypeORM | Mature, DataMapper pattern | Complex decorators, slower development |
| Drizzle ORM | Lightweight, SQL-like API | Newer, smaller ecosystem |
| Kysely | Type-safe SQL builder | No migrations, no relations |
| Raw SQL (pg driver) | Fastest, full control | No types, error-prone migrations |

## Decision
**Prisma ORM**. The type safety (generated from schema) prevents an entire class of bugs. Migrations are declarative and reversible. The query builder covers 95% of use cases.

## Consequences
- ✅ Auto-generated TypeScript types from schema
- ✅ Declarative migrations (version-controlled)
- ✅ Type-safe queries — impossible to typo column names
- ❌ Prisma client adds ~15MB to serverless bundle
- ❌ Complex queries sometimes need raw SQL escape hatch

## When to Revisit
- If serverless bundle size becomes critical → evaluate Drizzle ORM
- If Prisma's query builder limits complex aggregation needs
