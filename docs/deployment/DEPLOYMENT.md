# Deployment Guide

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- PostgreSQL 16 (local dev or container)
- Redis 7 (local dev or container)

## Local Development

### 1. Clone and Install
```bash
git clone <repo-url>
cd Mohanurkongu
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 2. Configure Environment
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your local settings
```

### 3. Start Infrastructure (Docker)
```bash
cd docker
docker-compose up -d postgres redis
```

### 4. Run Migrations
```bash
cd backend
npx prisma migrate deploy
npx prisma db seed
```

### 5. Start Development Servers
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Workers
cd backend && npm run workers
```

The app will be available at `http://localhost:5173`.

## Full Docker (Dev)

```bash
cd docker
docker-compose up --build
```

This starts all services: postgres, redis, backend, frontend, nginx, workers.

## Production Build

### 1. Build Docker Images
```bash
cd docker
docker-compose -f docker-compose.prod.yml build
```

### 2. Deploy
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Run Migrations
```bash
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
docker-compose -f docker-compose.prod.yml exec backend npx prisma db seed
```

## Environment-Specific Config

| Environment | Command | Notes |
|---|---|---|
| Local (no Docker) | `npm run dev` (backend + frontend) | Requires local postgres + redis |
| Dev (Docker) | `docker-compose up` | Auto-restarts on file changes |
| Production | `docker-compose -f docker-compose.prod.yml up -d` | Multi-stage builds, PM2 |

## Health Check

```bash
curl http://localhost:4000/api/health
# {"status":"ok","timestamp":"...","uptime":...}
```

## Service Endpoints

| Service | Internal Port | External (Dev) | External (Prod) |
|---|---|---|---|
| Nginx | 80 | localhost:80 | 443 (HTTPS) |
| Frontend | 5173 | localhost:5173 | via Nginx |
| Backend | 4000 | localhost:4000 | via Nginx (/api) |
| PostgreSQL | 5432 | — | — |
| Redis | 6379 | — | — |
