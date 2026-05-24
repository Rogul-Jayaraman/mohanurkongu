# Recovery Plan

## RTO / RPO Targets

| Metric | Current | Target |
|---|---|---|
| RTO (Recovery Time Objective) | Untested | 30 minutes |
| RPO (Recovery Point Objective) | No automated backup | 1 hour |

## Recovery Scenarios

### Scenario A: Database Corruption

**Detection:** Backend 500 errors on all requests, error logs show database errors.

**Recovery Steps:**
1. Stop backend + workers to prevent further corruption
2. Identify last known good backup
3. Restore database from backup
4. Review recent migration history — if migration caused corruption, create revert migration
5. Start backend + workers
6. Verify health check + auth flow (register + login)
7. Identify data loss window and manually restore from application logs if possible

### Scenario B: Redis Data Loss

**Detection:** BullMQ jobs disappear, session lookups fail, email queue empty.

**Recovery Steps:**
1. BullMQ jobs are ephemeral — most are not critical (email queues can be re-triggered)
2. Sessions are stored in PostgreSQL, not Redis — no impact
3. Restart Redis. Workers will reconnect automatically.
4. If persistence enabled: Redis loads RDB/AOF on restart automatically.
5. Verify email worker, background worker reconnect.

### Scenario C: Full System Outage

**Detection:** All services down (host failure, power outage, etc.)

**Recovery Steps:**
1. Verify host system is operational
2. Verify Docker is running
3. Start all services: `docker-compose -f docker-compose.prod.yml up -d`
4. Wait for all containers to pass health checks
5. Verify database integrity
6. Run `prisma migrate deploy` if needed
7. Verify all services are operational

### Scenario D: Security Breach

**Detection:** Suspicious activity detected (mass login attempts, unusual session patterns, data exfiltration)

**Recovery Steps:**
1. **Isolate** — take the system offline or behind restricted access
2. **Investigate** — review logs, identify breach vector
3. **Contain** — rotate all secrets (JWT secrets, database password, SMTP credentials)
4. **Eradicate** — revoke ALL sessions (mass `UPDATE sessions SET revokedAt = NOW()`)
5. **Restore** — restore from backup if data integrity compromised
6. **Patch** — fix vulnerability
7. **Monitor** — increased monitoring for 72 hours post-recovery

## Communication Plan

| Severity | Who to Notify | How | Timeframe |
|---|---|---|---|
| Critical (full outage) | Engineering Lead, Product Owner | Phone/Slack | Immediate |
| High (partial outage) | Engineering Lead | Slack | 15 min |
| Medium (degraded) | Engineering Team | Slack | 1 hour |
| Low (non-functional feature) | Post in team channel | Slack | Same day |
