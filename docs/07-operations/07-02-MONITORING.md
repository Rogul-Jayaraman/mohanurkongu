# Monitoring

How the system is monitored — health endpoints, error tracking, and observability.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MONITORING ARCHITECTURE                             │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐     │
│ │                      SENTRY (Error Tracking)                    │     │
│ │   ┌────────────────────────────────────────────────────────┐   │     │
│ │   │ Backend errors → Sentry DSN → Grouped by error code    │   │     │
│ │   │ Frontend errors → Sentry DSN → Grouped by component    │   │     │
│ │   │ Alerts: P1 (critical) → email/Slack                    │   │     │
│ │   └────────────────────────────────────────────────────────┘   │     │
│ └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐     │
│ │                      LOGGING (Pino)                            │     │
│ │   ┌────────────────────────────────────────────────────────┐   │     │
│ │   │ Backend: pino with terminal colors + structured JSON    │   │     │
│ │   │ Every request logged: method, path, status, duration   │   │     │
│ │   │ Errors include: error code, stack trace, request ID    │   │     │
│ │   │ Docker: docker compose logs -f app                      │   │     │
│ │   └────────────────────────────────────────────────────────┘   │     │
│ └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐     │
│ │                      HEALTH ENDPOINTS                          │     │
│ │   ┌────────────────────────────────────────────────────────┐   │     │
│ │   │ GET /health    → { status, timestamp }                 │   │     │
│ │   │ GET /health/db  → { db: "ok", latencyMs }             │   │     │
│ │   │ GET /health/redis → { redis: "ok", latencyMs }        │   │     │
│ │   │ GET /metrics   → Prometheus metrics (if configured)     │   │     │
│ │   └────────────────────────────────────────────────────────┘   │     │
│ └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐     │
│ │                      QUEUE MONITORING                          │     │
│ │   ┌────────────────────────────────────────────────────────┐   │     │
│ │   │ Bull Board UI: /admin/queues                          │   │     │
│ │   │ Shows: waiting, active, completed, failed, delayed    │   │     │
│ │   │ Actions: retry failed, clean completed, pause/resume   │   │     │
│ │   └────────────────────────────────────────────────────────┘   │     │
│ └──────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Health Checks

```bash
# Basic health
curl http://localhost:3000/health
# {"status":"ok","timestamp":"2026-06-18T12:00:00.000Z"}

# Database check
curl http://localhost:3000/health/db
# {"db":"ok","latencyMs":3}

# Redis check
curl http://localhost:3000/health/redis
# {"redis":"ok","latencyMs":1}
```

## Docker Healthchecks

Each container has a `healthcheck` in `docker/docker-compose.prod.yml`:

| Container | Check | Interval |
|-----------|-------|----------|
| mkm-backend | `curl -f http://localhost:4000/health` | 30s |
| mkm-postgres | `pg_isready -U $$POSTGRES_USER` | 10s |
| mkm-redis | `redis-cli ping` | 10s |
| mkm-redis-cache | `redis-cli -p 6380 ping` | 10s |

## Alerts

| Severity | Trigger | Channel |
|----------|---------|---------|
| P1 Critical | 5xx errors > 1% in 5 minutes | Email + Slack |
| P2 High | Health check fails 3x | Email |
| P3 Medium | Failed queue jobs > 10 | Dashboard |
| P4 Low | Cert renewal approaching (14 days) | Email |

## Log Viewing

```bash
# All containers
docker compose logs -f

# Backend only
docker compose -f docker/docker-compose.prod.yml logs -f backend

# Last 100 lines with timestamps
docker compose -f docker/docker-compose.prod.yml logs --tail=100 -t backend

# Search for errors
docker compose -f docker/docker-compose.prod.yml logs backend | grep ERROR
```
