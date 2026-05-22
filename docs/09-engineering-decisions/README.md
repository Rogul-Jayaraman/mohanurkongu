# Engineering Decision Records (ADRs)

## Overview

This section documents **why** every major architectural decision was made. Each ADR follows the standard format:

- **Context**: What was the situation
- **Options**: What was considered
- **Decision**: What was chosen
- **Consequences**: What tradeoffs resulted
- **Future**: When this decision might be revisited

## Index

| # | Decision | Key Rationale |
|---|---|---|
| [01](./01-why-react-and-vite.md) | Why React 19 + Vite 6 | Fast iteration, component model, ecosystem |
| [02](./02-why-prisma-over-raw-sql.md) | Why Prisma ORM | Type safety, migration management, DX |
| [03](./03-why-neon-postgresql.md) | Why Neon PostgreSQL | Serverless-native, branching, free tier |
| [04](./04-why-vercel.md) | Why Vercel | SPA hosting, serverless backend, GitHub integration |
| [05](./05-why-feature-based-architecture.md) | Why Feature-Based Architecture | Scalability, team autonomy, discoverability |
| [06](./06-why-tanstack-query.md) | Why TanStack Query | Server state management, caching, deduplication |
| [07](./07-why-i18next.md) | Why i18next | Mature bilingual support, namespace organization |
| [08](./08-why-express-over-next.md) | Why Express (not Next.js API routes) | Separation of concerns, independent scaling |
| [09](./09-why-jwt-over-sessions.md) | Why JWT (not session-based auth) | Stateless, serverless-friendly, simple |
