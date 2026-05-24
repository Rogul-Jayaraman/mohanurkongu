# Runbook

## Startup Sequence

### Full Stack (Docker)
```bash
cd docker
docker-compose -f docker-compose.prod.yml up -d
```

Expected startup order:
1. postgres (30s to initialize)
2. redis (2s)
3. backend (waits for postgres)
4. workers (waits for backend and redis)
5. frontend (waits for nothing, static build)
6. nginx (starts last, all upstreams must be ready)

### Verify Start
```bash
# All containers running?
docker-compose ps

# Backend healthy?
curl http://localhost:4000/api/health

# Frontend serving?
curl http://localhost:5173

# Nginx routing?
curl http://localhost/api/health
```

## Shutdown Sequence

### Graceful
```bash
cd docker
docker-compose -f docker-compose.prod.yml down
```

### Force (if stuck)
```bash
docker-compose -f docker-compose.prod.yml down --timeout 0
```

## Common Issues

### Database Connection Refused
```
Symptom: Backend logs "ECONNREFUSED :5432"
Fix: Wait for postgres to initialize (docker-compose logs -f postgres)
```

### Migration Failed
```
Symptom: Backend logs "P2010: Migration failed"
Fix:
  1. Check migration status: npx prisma migrate status
  2. If "baseline" migration missing: npx prisma migrate resolve --applied <migration-name>
  3. Check postgres logs: docker-compose logs postgres
```

### Redis Connection Refused
```
Symptom: BullMQ logs "connect ECONNREFUSED :6379"
Fix: docker-compose restart redis
```

### Port Conflicts
```
Symptom: "port is already allocated"
Fix:
  - Check which service is using the port: netstat -ano | findstr :PORT
  - Change port in docker-compose.yml or stop conflicting service
```

### Nginx 502 Bad Gateway
```
Symptom: All frontend routes show 502
Fix:
  1. Check backend status: docker-compose ps backend
  2. Check backend logs: docker-compose logs backend
  3. Restart backend: docker-compose restart backend
```

### BullMQ Queue Stuck
```
Symptom: Emails not sending, OTP not expiring
Fix:
  1. Check worker status: docker-compose ps workers
  2. Check worker logs: docker-compose logs workers
  3. Check Redis connectivity: docker-compose exec redis redis-cli ping
  4. Restart workers: docker-compose restart workers
```

## Recovery Procedures

### Database Recovery
```bash
# 1. Stop backend (prevents writes)
docker-compose stop backend workers

# 2. Restore from backup
docker-compose exec -T postgres psql -U postgres manamaalai < backup.sql

# 3. Restart services
docker-compose start backend workers
```

### Redis Recovery (with persistence configured)
```bash
# Redis will load from RDB/AOF on restart
docker-compose restart redis
```

## Emergency Contacts

| Role | Contact |
|---|---|
| Backend Lead | TBD |
| Frontend Lead | TBD |
| DevOps | TBD |
| Database Admin | TBD |
| Product Owner | TBD |
