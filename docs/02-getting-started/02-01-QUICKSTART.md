# Quickstart

> **For beginners**: This gets the app running on your computer in ~10 minutes.
> You need Node.js (to run the code) and Docker (to run the database + cache).
> Don't have Docker? Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) first.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       QUICKSTART FLOW                                  │
│                                                                         │
│   1. git clone                                                          │
│   2. Copy .env.example → .env                                           │
│   3. npm install (backend + frontend)                                   │
│   4. docker compose up -d db redis                                      │
│   5. npx prisma migrate dev                                             │
│   6. npx prisma db seed                                                 │
│   7. npm run dev                                                        │
│   8. Open http://localhost:5173                                         │
│                                                                         │
│   ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐     │
│   │ Clone│──▶│ .env │──▶│Install│──▶│Start │──▶│Migrate│──▶│  Run │     │
│   └──────┘   └──────┘   └──────┘   └──────┘   └──────┘   └──────┘     │
│                                                               │        │
│                                                               ▼        │
│                                                         ┌──────────┐   │
│                                                         │ Open App │   │
│                                                         └──────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- Node.js 20+
- Docker Desktop (for PostgreSQL + Redis)
- Git

## Steps

```bash
# 1. Clone
git clone <repo-url>
cd mohanurkongu

# 2. Environment
cp backend/.env.example backend/.env

# 3. Install dependencies
cd backend && npm install
cd ../frontend && npm install
cd ..

# 4. Start database + cache (PostgreSQL + Redis via Docker)
#    The -f flag tells Docker which compose file to use.
#    The -d flag runs containers in the background.
#    We start only 'db' (PostgreSQL) and 'redis' (session storage).
docker compose -f docker/docker-compose.dev.yml up -d postgres redis

# 5. Run database migrations
cd backend
npx prisma migrate dev

# 6. Seed sample data
npx prisma db seed

# 7. Start development servers
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
cd frontend && npm run dev
```

Open **http://localhost:5173** in your browser.

## Common Issues

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `ECONNREFUSED :5432` | PostgreSQL not running | `docker compose -f docker/docker-compose.dev.yml up -d postgres` |
| `PrismaClientInitializationError` | Migration not run | `npx prisma migrate dev` |
| Module not found | Dependencies missing | `npm install` |
| Port 3000 in use | Another process | Kill or change port in .env |
| Port 5173 in use | Another Vite instance | `npx kill-port 5173` |
| Empty DB | Seed not run | `npx prisma db seed` |
| Redis connection error | Redis not running | `docker compose -f docker/docker-compose.dev.yml up -d redis` |
| CORS error | Wrong API URL | Check `VITE_API_URL` in frontend .env |
| Login fails | Seed hasn't created accounts | Run seed again |
| Refresh token error | Cookie not sent | Use same browser tab, check devtools |

## Verify It Works

```bash
# Backend health check
curl http://localhost:3000/health
# → {"status":"ok","timestamp":"..."}

# List available tests (should be 100+)
cd backend && npm test -- --listTests | wc -l
```
