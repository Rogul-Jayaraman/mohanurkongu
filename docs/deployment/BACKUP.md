# Backup Guide

## Database Backup

### Manual Backup
```bash
docker exec -t <postgres-container> pg_dump -U postgres manamaalai > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore
```bash
cat backup.sql | docker exec -i <postgres-container> psql -U postgres manamaalai
```

## Automated Backup (Not Configured)

Currently no automated backup is configured in Docker Compose. Recommended setup:

### Docker Compose Addition (production)
```yaml
services:
  db-backup:
    image: postgres:16-alpine
    environment:
      - POSTGRES_PASSWORD=postgres
    volumes:
      - ./backups:/backups
    command: >
      sh -c "while true; do
        pg_dump postgresql://postgres:postgres@postgres:5432/manamaalai > /backups/db_\$(date +%Y%m%d_%H%M%S).sql;
        sleep 86400;
      done"
    depends_on:
      - postgres
```

### Backup Retention
Recommended:
- Daily backups: 7 days retention
- Weekly backups: 4 weeks retention
- Monthly backups: 12 months retention

## Redis Persistence (Not Configured)

Redis is currently running with no persistence. Recommended:

```bash
# In Redis config or docker-compose:
redis-server --save 900 1 --save 300 10 --save 60 10000
```

This enables RDB snapshots every 15min (if 1 key changed), 5min (if 10), 1min (if 10000).

## RPO / RTO

| Metric | Current | Target |
|---|---|---|
| RPO (Recovery Point Objective) | Manual backup only | 1 hour |
| RTO (Recovery Time Objective) | Untested | 30 minutes |
