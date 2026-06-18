# Deployment Topology

Production infrastructure — Docker Compose with 7 containers.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PRODUCTION DEPLOYMENT TOPOLOGY                      │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │                     INTERNET                                 │     │
│   │                         │                                    │     │
│   │                    ┌────┴────┐                               │     │
│   │                    │  :443   │                               │     │
│   └────────────────────┼─────────┼───────────────────────────────┘     │
│                        │         │                                      │
│   ┌────────────────────┼─────────┼───────────────────────────────┐     │
│   │     DOCKER NETWORK │         │                               │     │
│   │                    ▼         ▼                               │     │
│   │  ┌──────────────────────────────────────┐                   │     │
│   │  │  NGINX (Reverse Proxy)              │                   │     │
│   │  │  Ports: 80→443                      │                   │     │
│   │  │  Routes: /api/* → app:3000          │                   │     │
│   │  │          /* → frontend:80           │                   │     │
│   │  │  SSL: TLSv1.2/1.3, HSTS, OCSP      │                   │     │
│   │  │  Rate limit: 100/min per IP        │                   │     │
│   │  └──────────────┬──────────────────────┘                   │     │
│   │                 │                                          │     │
│   │          ┌──────┴──────┐                                   │     │
│   │          ▼              ▼                                   │     │
│   │  ┌──────────────┐ ┌──────────────┐                        │     │
│   │  │  APP         │ │  FRONTEND    │                        │     │
│   │  │  (Node 20)   │ │  (Nginx)     │                        │     │
│   │  │  :3000       │ │  :80         │                        │     │
│   │  │  Express     │ │  React build │                        │     │
│   │  └──────┬───────┘ └──────────────┘                        │     │
│   │         │                                                  │     │
│   │         ├────────────────────┐                             │     │
│   │         │                    │                             │     │
│   │         ▼                    ▼                             │     │
│   │  ┌──────────────┐   ┌──────────────┐                      │     │
│   │  │  POSTGRES    │   │  REDIS       │                      │     │
│   │  │  (16)        │   │  (7)         │                      │     │
│   │  │  :5432       │   │  :6379       │                      │     │
│   │  │  Volume: db  │   │  Volume: rds │                      │     │
│   │  └──────────────┘   └──────────────┘                      │     │
│   │                                                           │     │
│   │  ┌──────────────┐   ┌──────────────┐                      │     │
│   │  │  WORKER      │   │  CERTBOT     │                      │     │
│   │  │  (Node 20)   │   │  (alpine)    │                      │     │
│   │  │  BullMQ proc │   │  SSL renew   │                      │     │
│   │  │  No HTTP     │   │  Volume: ssl │                      │     │
│   │  └──────────────┘   └──────────────┘                      │     │
│   └──────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Container Details

| Container | Image | Ports | Volumes | Depends On |
|-----------|-------|-------|---------|------------|
| nginx | nginx:alpine | 80, 443 | ssl_certs, nginx_conf | app, frontend, certbot |
| app | node:20-alpine | 3000 | .env, media | db, redis |
| frontend | nginx:alpine | 80 | react_build | — |
| db | postgres:16 | 5432 | pgdata | — |
| redis | redis:7-alpine | 6379 | redis_data | — |
| worker | node:20-alpine | — | .env | db, redis |
| certbot | certbot/certbot | — | ssl_certs | — |

## Environment File Chain

```
.env (base, not in git)
  └── .env.production (production overrides, git-safe)
        └── secrets (Vault / manual)
```

## SSL Flow

```
1. certbot requests cert from Let's Encrypt
2. Nginx reloads to include new cert
3. Certbot renews automatically (weekly cron in container)
4. On renewal failure: nginx continues with existing cert, alert sent
```

## Network Isolation

| Network | Containers | Accessibility |
|---------|-----------|---------------|
| `frontend` | nginx, frontend | Internet → nginx only |
| `backend` | app, worker, db, redis | nginx → app only |
| `internal` | db, redis | No external access |

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Server reboot | `restart: unless-stopped` on all containers |
| DB container restarts | App retries connection with exponential backoff |
| Redis goes down | App degrades gracefully (cache miss to DB) |
| Cert renewal fails | Nginx uses existing cert; alert sent; retry next day |
| Disk full on volume | Health check alerts; logs are rotated |
| Deployment during active users | Blue-green via Docker Compose scaling: `docker compose up -d --scale app=2 --no-deps` |
| Health check failure | Container restarts via `healthcheck` directive |
