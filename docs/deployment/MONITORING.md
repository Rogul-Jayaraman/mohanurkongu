# Monitoring Guide

## Current State

**No monitoring, logging aggregation, metrics, or alerting are configured.**

The system has:
- Morgan HTTP request logging (stdout, backend)
- BullMQ queue events (logged to console)
- Winston-like structured logging via `logger.ts`

## Recommended Setup

### Health Check Endpoint (Already Available)
```
GET /api/health
→ {"status":"ok","timestamp":"...","uptime":...}
```

### Suggested Additions

#### 1. Application Metrics (Prometheus)
Add a `/metrics` endpoint to the backend exposing:
- Request count, duration, error rate (per route)
- Active sessions count
- BullMQ queue depth (email, otp, audit queues)
- Database connection pool utilization
- Memory and CPU usage

#### 2. Log Aggregation (Grafana Loki + Promtail)
- Ship all container logs to Loki
- Create dashboards for error rates and request patterns

#### 3. Alerting
Alert on:
- `[5m] error_rate > 5%`
- BullMQ queue depth > 1000
- Health check failure (3 consecutive)
- Session revocation rate spike (possible attack)
- Memory > 80%

#### 4. Uptime Monitoring
- External uptime check on `https://<domain>/api/health` (every 60s)
- Synthetic transaction: register → login → refresh → logout

#### 5. Error Tracking (Sentry)
Integrate Sentry for:
- Unhandled exceptions
- API 5xx errors
- Rate limit triggers
- Auth failures

## Current Logging

Backend logs to stdout via `morgan` and `logger.ts`. Format:
```
[timestamp] [LEVEL] message { context }
```

Docker logs are accessible via:
```bash
docker-compose logs -f backend
docker-compose logs -f workers
docker-compose logs -f nginx
```

## Alerting Contacts (TBD)

| Severity | Contact Method | Response Time |
|---|---|---|
| P0 (Down) | Phone/Slack | 15 min |
| P1 (Degraded) | Slack | 1 hour |
| P2 (Non-critical) | Slack | Next business day |
