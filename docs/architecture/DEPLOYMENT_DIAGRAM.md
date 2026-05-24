# Deployment Diagram

## Production Topology (docker-compose.prod.yml)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Internet                                    │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Nginx (Reverse Proxy)                            │
│                                                                     │
│  Port 80 (HTTP → redirect HTTPS)     Port 443 (HTTPS)              │
│                                                                     │
│  Routes:                                                            │
│  /api/*          → backend:4000                                     │
│  /health         → backend:4000                                     │
│  /socket.io/*    → UNIMPLEMENTED                                    │
│  /*              → frontend:5173 (served as static)                 │
│                                                                     │
│  Rate: 100 req/s | Client Body: 10MB | Proxy Timeout: 60s         │
│  SSL: managed externally (no certbot in compose)                    │
└─────────────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────────┐
            ▼               ▼                    ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  Frontend        │ │  Backend         │ │  Workers         │
│  (React SPA)     │ │  (Express 5)     │ │  (BullMQ)        │
│                  │ │                  │ │                  │
│  Port: 5173      │ │  Port: 4000      │ │  Port: (none)    │
│  Build: Vite     │ │  Node: 20-alpine │ │  Node: 20-alpine │
│  Serve: nginx    │ │  PM2: started    │ │  PM2: started    │
│  Environment:    │ │  Environment:    │ │  Environment:    │
│  .env            │ │  .env            │ │  .env            │
└──────────────────┘ └──────────────────┘ └──────────────────┘
                            │                    │
                            └────────┬───────────┘
                                     ▼
                    ┌─────────────────────────────────────┐
                    │            Redis 7                   │
                    │                                     │
                    │  Port: 6379                         │
                    │  No password (internal network)     │
                    │  No persistence (RDB/AOF disabled)  │
                    │  No sentinel/cluster (single node)  │
                    │                                     │
                    │  BullMQ queues:                     │
                    │  email.queue, otp.queue,            │
                    │  audit.queue, background.queue      │
                    └─────────────────────────────────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────────────┐
                    │         PostgreSQL 16                │
                    │                                     │
                    │  Port: 5432                         │
                    │  User: postgres                    │
                    │  Password: postgres (dev default)  │
                    │  Database: manamaalai              │
                    │                                     │
                    │  Volume: postgres_data              │
                    │  No auth exposed                    │
                    │  No replication                     │
                    │  No backup volume                   │
                    └─────────────────────────────────────┘
```

## Dev Topology (docker-compose.yml)

```
Same as production but:
- Frontend in dev mode (Vite HMR on port 5173)
- Backend in dev mode (tsx watch on port 4000)
- PostgreSQL same
- Redis same
- Nginx with WebSocket support for Vite HMR via /socket.io/* (UNUSED)
```

## Network Layout

```
Network: app-network (bridge)
All containers on same network.
PostgreSQL and Redis NOT exposed to host.
Nginx port 80:443 exposed to host.
Frontend port 5173 exposed to host (dev only).
Backend port 4000 exposed to host (dev only).
```

## Build Process

```
1. npm install (root)
2. npm run build (frontend: Vite build → dist/)
3. npm run build (backend: tsc)
4. Docker build:
   - frontend: node:20-alpine → copy package.json, install, vite build
   - backend: node:20-alpine → copy package.json, install, tsc build
5. docker-compose up -d
```
