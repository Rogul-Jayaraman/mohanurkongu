# Detailed Setup

> **For beginners**: This guide explains every step in detail — what each
> command does, why you need it, and how to fix things if they go wrong.
> If you just want to get running fast, use the [Quickstart](02-01-QUICKSTART.md) instead.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SETUP WORKFLOW (DETAILED)                            │
│                                                                         │
│   ┌─────────┐                                                           │
│   │PREREQS  │  Node 20, Docker, Git, VS Code                           │
│   └────┬────┘                                                           │
│        ▼                                                                │
│   ┌─────────┐                                                           │
│   │CLONE    │  git clone <url> && cd mohanurkongu                      │
│   └────┬────┘                                                           │
│        ▼                                                                │
│   ┌─────────┐                                                           │
│   │ENV      │  backend/.env.example → backend/.env                     │
│   │         │  frontend/.env.example → frontend/.env (if exists)       │
│   └────┬────┘                                                           │
│        ▼                                                                │
│   ┌─────────┐                                                           │
│   │INSTALL  │  npm install (backend + frontend separately)             │
│   └────┬────┘                                                           │
│        ▼                                                                │
│   ┌─────────┐                                                           │
│   │DOCKER   │  docker compose -f docker/docker-compose.dev.yml up -d    │
│   │         │  → PostgreSQL on :5433                                   │
│   │         │  → Redis (session) on :6379                              │
│   │         │  → Redis (cache) on :6380                                │
│   └────┬────┘                                                           │
│        ▼                                                                │
│   ┌─────────┐                                                           │
│   │DB SETUP │  npx prisma migrate dev                                  │
│   │         │  npx prisma db seed                                      │
│   └────┬────┘                                                           │
│        ▼                                                                │
│   ┌─────────┐                                                           │
│   │RUN DEV  │  backend: npm run dev (port 3000)                        │
│   │         │  frontend: npm run dev (port 5173)                       │
│   └────┬────┘                                                           │
│        ▼                                                                │
│   ┌─────────┐                                                           │
│   │VERIFY   │  http://localhost:5173  │  curl /health                   │
│   └─────────┘                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Prerequisites

1. **Node.js 20+** — [Download](https://nodejs.org/)
   ```bash
   node --version  # Should be ≥20.x
   ```

2. **Docker Desktop** — [Download](https://www.docker.com/products/docker-desktop/)
   ```bash
   docker --version
   docker compose version
   ```

3. **Git** — [Download](https://git-scm.com/)
   ```bash
   git --version
   ```

4. **VS Code** (recommended) with extensions:
   - ESLint
   - Prettier
   - Prisma

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_ACCESS_SECRET` | ✅ Yes | — | Signs access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | ✅ Yes | — | Signs refresh tokens (min 32 chars) |
| `JWT_VERIFICATION_SECRET` | ✅ Yes | — | Signs email verification tokens |
| `JWT_RESET_SECRET` | ✅ Yes | — | Signs password reset tokens |
| `COOKIE_SECRET` | ✅ Yes | — | Signs session cookies (min 32 chars) |
| `DATABASE_URL` | ✅ Yes | `localhost:5433` | PostgreSQL connection string |
| `REDIS_QUEUE_HOST` | ⬜ No | `localhost` | Redis host for job queue |
| `REDIS_CACHE_HOST` | ⬜ No | `localhost` | Redis host for cache |
| `SMTP_HOST` | ⬜ No | `localhost` | SMTP server (Mailpit in dev) |
| `CORS_ORIGIN` | ⬜ No | `http://localhost:5173` | Allowed CORS origins |
| `APP_URL` | ⬜ No | `http://localhost:5173` | Public frontend URL |
| `SENTRY_DSN` | ⬜ No | — | Sentry error tracking (optional) |

See [Configuration Reference](../08-reference/08-01-CONFIGURATION.md) for the full list of all optional vars.

### Frontend (`frontend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | ✅ Yes | `http://localhost:4000` | Backend API base URL |

## Docker Setup

> **For beginners**: Docker runs the services your app needs to talk to —
> a database (PostgreSQL) to store data, and Redis to remember login
> sessions and cache things. All configs live in `docker/`.

There are two compose files:
- `docker/docker-compose.dev.yml` — for local development (auto-restart, hot-reload)
- `docker/docker-compose.prod.yml` — for production (optimized builds, SSL)

```bash
# Start all Docker services for development:
docker compose -f docker/docker-compose.dev.yml up -d

# The -f flag picks which compose file to use.
# The -d flag runs containers in the background (not blocking your terminal).

# Check what's running:
docker compose -f docker/docker-compose.dev.yml ps

# See logs:
docker compose -f docker/docker-compose.dev.yml logs -f
```

## Database Setup

```bash
cd backend

# Run migrations (creates tables from Prisma schema)
npx prisma migrate dev

# Seed (inserts sample data for testing)
npx prisma db seed

# Verify (opens browser-based DB viewer on :5555)
npx prisma studio
```

## Running

```bash
# Terminal 1: Backend (listens on http://localhost:3000)
cd backend
npm run dev

# Terminal 2: Frontend (Vite dev server on http://localhost:5173)
cd frontend
npm run dev
```

## Stopping

```bash
# Stop dev servers: Ctrl+C in each terminal

# Stop Docker containers (data is preserved)
docker compose -f docker/docker-compose.dev.yml down

# Stop + delete volumes (wipes DB + Redis data — use with caution!)
docker compose -f docker/docker-compose.dev.yml down -v
```
