# Mohanur Kongu Matrimony & Mandapam — Engineering Documentation

> **Production-grade technical blueprint** for a bilingual (EN/TA) full-stack matrimony and temple hall booking platform.

| Section | Description | Audience |
|---|---|---|
| [01 — Product & Business](./01-product-and-business/README.md) | What the product does, workflows, business rules, user types | All |
| [02 — System Architecture](./02-system-architecture/README.md) | High-level layered architecture, request lifecycle, data flow | All |
| [02a — Frontend Architecture](./02-system-architecture/01-frontend-architecture.md) | SPA rendering, routing, build pipeline | Frontend |
| [02b — Backend Architecture](./02-system-architecture/02-backend-architecture.md) | Express serverless, controller/service/repository pattern | Backend |
| [02c — Database Architecture](./02-system-architecture/03-database-architecture.md) | ER diagram, Prisma models, relationships | Full-stack |
| [02d — Auth Architecture](./02-system-architecture/04-auth-architecture.md) | JWT flow, OTP, RBAC, dual auth paths | Full-stack |
| [02e — Deployment Architecture](./02-system-architecture/05-deployment-architecture.md) | Vercel, Neon, env management | DevOps |
| [03 — Frontend Engineering](./03-frontend/README.md) | Deep frontend docs (8 sub-sections) | Frontend |
| [04 — Backend Engineering](./04-backend/README.md) | Deep backend docs (7 sub-sections) | Backend |
| [05 — Database Engineering](./05-database/README.md) | Schema, indexes, migrations, optimization | Full-stack |
| [06 — DevOps & Deployment](./06-devops/README.md) | Vercel, Neon, environment management | DevOps |
| [07 — Scalability](./07-scalability/README.md) | Caching, queues, scaling trajectory | Senior |
| [08 — Troubleshooting](./08-troubleshooting/README.md) | Debugging guides for known failure modes (8 guides) | All |
| [09 — Engineering Decisions](./09-engineering-decisions/README.md) | ADRs — why every architectural choice was made (9 records) | Senior |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | **AI-friendly** condensed single-file reference | AI Agents |
| [Backend API Docs](../backend/documentation/apis/) | API contracts (request/response shapes) | Full-stack |

## Quick Start

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && npm install && npx prisma generate && npm run dev
```

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 6, React Router 7 |
| State | TanStack React Query 5 + React Context |
| Styling | Tailwind CSS v4, MUI (limited), Framer Motion |
| i18n | i18next + react-i18next (24 EN + 24 TA files) |
| Backend | Express 5, TypeScript, ts-node |
| ORM | Prisma 6 |
| Database | PostgreSQL 16 (Neon.tech serverless) |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Email | Nodemailer (Gmail SMTP) |
| Media | Cloudinary |
| Astrology | Swiss Ephemeris (swisseph-wasm) |
| Hosting | Vercel (Frontend SPA + Backend serverless) |
