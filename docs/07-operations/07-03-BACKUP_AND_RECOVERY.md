# Backup & Recovery

> **For beginners**: Regular backups protect against data loss. We back up four
> things: the database (pg_dump), uploaded files (tar from bind mount), static
> brand assets (tar from bind mount), and SSL certs (auto-renewed). Everything
> runs on one server at /opt/mohanurkongu/.

## What to Back Up

| Data | Location | Method | Criticality |
|------|----------|--------|-------------|
| PostgreSQL | Docker volume `postgres_data` | `pg_dump` via `docker exec` | 🔴 Critical — contains all user data |
| Uploaded media (user) | `../storage/media/` (bind mount) | `tar` or `rsync` | 🟡 Important — user photos |
| Static brand assets | `../media/` (bind mount) | `tar` or `rsync` | 🟡 Important — brand images, replaced on deploy |
| Redis queues | Docker volume `redis_data` | RDB dump | 🟢 Low — can be re-generated |
| SSL certs | Docker volumes `cert_data`, `cert_www` | Auto-renewed | 🟢 Low — certbot re-fetches |
| Env secrets | `backend/.env.prod` | Manual backup | 🔴 Critical — must keep safe |

## Database Backup

### One-time backup

```bash
cd /opt/mohanurkongu

docker compose -f docker/docker-compose.prod.yml exec -T postgres \
  pg_dump -U mohanurkongu mohanurkongu | gzip > backup_2026-06-18.sql.gz
```

The `-T` flag makes the exec session non-TTY, which is required for piping
output. Without it, `pg_dump` fails with "the input device is not a TTY".

### Restore from backup

```bash
gunzip -c backup_2026-06-18.sql.gz | \
  docker compose -f docker/docker-compose.prod.yml exec -T postgres \
  psql -U mohanurkongu mohanurkongu
```

### Automated daily backup (cron)

Add to your crontab (`crontab -e`):

```cron
0 2 * * * cd /opt/mohanurkongu && docker compose -f docker/docker-compose.prod.yml exec -T postgres pg_dump -U mohanurkongu mohanurkongu | gzip > /opt/mohanurkongu/backups/db_$(date +\%F).sql.gz && find /opt/mohanurkongu/backups/ -name 'db_*.sql.gz' -mtime +30 -delete 2>&1 | logger -t db-backup
```

| Part | What it does |
|------|-------------|
| `0 2 * * *` | Runs daily at 2 AM |
| `pg_dump ... \| gzip` | Creates compressed SQL dump |
| `> backups/db_2026-06-18.sql.gz` | Saves to project directory |
| `find ... -mtime +30 -delete` | Deletes backups older than 30 days |
| `2>&1 \| logger -t db-backup` | Logs output to syslog |

## Media Backup

Both `storage/` (user uploads) and `media/` (static brand assets) live on
host bind mounts, so backing them up is a simple `tar` command — no Docker
needed.

### One-time backup

```bash
tar -czf media_backup_2026-06-18.tar.gz storage/ media/
```

### Automated daily backup (cron)

```cron
0 3 * * * cd /opt/mohanurkongu && tar -czf /opt/mohanurkongu/backups/media_$(date +\%F).tar.gz storage/ media/ && find /opt/mohanurkongu/backups/ -name 'media_*.tar.gz' -mtime +90 -delete 2>&1 | logger -t media-backup
```

### Restore media

```bash
cd /opt/mohanurkongu
tar -xzf media_backup_2026-06-18.tar.gz
```

This restores both `storage/` and `media/` directories.

### Offsite media sync (optional)

For extra safety, sync to another server or cloud storage:

```bash
rsync -avz /opt/mohanurkongu/storage/ backup@backup-server:/backups/mohanurkongu/storage/
rsync -avz /opt/mohanurkongu/media/ backup@backup-server:/backups/mohanurkongu/media/
```

## Redis

Redis data (queues and cache) is persisted to disk via AOF + RDB. It survives
container restarts. For disaster recovery, Redis can be re-populated from
scratch — queues will re-process, cache will warm up naturally.

### Manual backup (optional)

```bash
# Trigger a save inside the container
docker compose -f docker/docker-compose.prod.yml exec redis redis-cli SAVE

# Copy the dump file from the volume
sudo cp /var/lib/docker/volumes/mohanurkongu_redis_data/_data/dump.rdb \
  /opt/mohanurkongu/backups/redis_$(date +%F).rdb
```

## SSL Certificates

SSL certs are stored in Docker volumes `cert_data` and `cert_www`. The
certbot container renews them automatically every 12 hours. You generally
don't need to back these up — Let's Encrypt will re-issue them on a new
server.

If the cert volumes are lost:

```bash
# nginx will fall back to HTTP
# Re-run the certbot command to get new certificates
docker compose -f docker/docker-compose.prod.yml exec nginx \
  certbot certonly --webroot -w /var/www/certbot \
  -d yourdomain.com -d www.yourdomain.com \
  --email you@email.com --agree-tos --no-eff-email

docker compose -f docker/docker-compose.prod.yml exec nginx nginx -s reload
```

## Disaster Recovery Scenarios

### Scenario A: Accidental data deletion (soft)

A user accidentally deleted their profile or an admin removed the wrong entry.

1. Identify what was deleted and when
2. Find a database backup taken before the deletion:

```bash
ls -l /opt/mohanurkongu/backups/db_*.sql.gz
```

3. Restore the relevant table from the backup into a temp database, extract
   the missing rows, and insert them back.

### Scenario B: Database corruption

```bash
cd /opt/mohanurkongu

# 1. Stop the backend (keep postgres running)
docker compose -f docker/docker-compose.prod.yml stop backend

# 2. Restore database from latest backup
gunzip -c /opt/mohanurkongu/backups/db_latest.sql.gz | \
  docker compose -f docker/docker-compose.prod.yml exec -T postgres \
  psql -U mohanurkongu mohanurkongu

# 3. Restart backend
docker compose -f docker/docker-compose.prod.yml start backend

# 4. Verify
curl https://yourdomain.com/health/db
```

### Scenario C: Full server loss

The VPS is unrecoverable — you need to set up a new one from scratch.

```bash
# 1. Provision a new VPS (same specs)
# 2. Run Steps 1-4 from the Deployment Guide (server setup, Docker, clone repo)
# 3. Restore .env.prod from your personal backup (password manager, vault, etc.)
# 4. Copy backups to the new server

# On the OLD server (if accessible):
rsync -avz /opt/mohanurkongu/backups/ deploy@new-server:/opt/mohanurkongu/backups/
rsync -avz /opt/mohanurkongu/storage/ deploy@new-server:/opt/mohanurkongu/storage/
rsync -avz /opt/mohanurkongu/media/ deploy@new-server:/opt/mohanurkongu/media/

# 5. Start postgres with empty data
docker compose -f docker/docker-compose.prod.yml up -d postgres

# 6. Restore database
gunzip -c /opt/mohanurkongu/backups/db_latest.sql.gz | \
  docker compose -f docker/docker-compose.prod.yml exec -T postgres \
  psql -U mohanurkongu mohanurkongu

# 7. Restore media files
tar -xzf /opt/mohanurkongu/backups/media_latest.tar.gz -C /opt/mohanurkongu/

# 8. Start everything
docker compose -f docker/docker-compose.prod.yml up -d

# 9. Point DNS to the new server IP
# 10. Re-run SSL certbot setup
docker compose -f docker/docker-compose.prod.yml exec nginx \
  certbot certonly --webroot -w /var/www/certbot \
  -d yourdomain.com -d www.yourdomain.com \
  --email you@email.com --agree-tos --no-eff-email

docker compose -f docker/docker-compose.prod.yml exec nginx nginx -s reload
```

### Scenario D: .env.prod lost

The `backend/.env.prod` file was accidentally deleted or corrupted.

If you have a backup (password manager, vault, or offline copy), restore it:

```bash
# Restore from your personal backup
# Then restart affected containers
docker compose -f docker/docker-compose.prod.yml up -d --force-recreate backend nginx
```

If you have **no backup**, you need to regenerate secrets. This will invalidate
all existing sessions, tokens, and encrypted cookies — users will need to
log in again:

```bash
cp backend/.env.example backend/.env.prod
# Edit with new values — see DEPLOYMENT_GUIDE.md Step 5
# for which variables to regenerate
nano backend/.env.prod
```

### Scenario E: Disk space full

Uploaded files and database dumps can fill the disk. The cron backup scripts
auto-delete old files, but if something went wrong:

```bash
# Check disk usage
df -h

# See what's using space in the project
du -sh /opt/mohanurkongu/storage/
du -sh /opt/mohanurkongu/media/
du -sh /opt/mohanurkongu/backups/

# Clean old database backups manually
find /opt/mohanurkongu/backups/ -name 'db_*.sql.gz' -mtime +30 -delete

# Clean old media backups
find /opt/mohanurkongu/backups/ -name 'media_*.tar.gz' -mtime +90 -delete

# Remove unused Docker images
docker image prune -a -f
```

## Backup Retention Summary

| Backup Type | Retention | Frequency | Storage |
|-------------|-----------|-----------|---------|
| PostgreSQL dump | 30 days | Daily | ~500MB per dump |
| Media files (user uploads + static assets) | 90 days | Daily | ~200MB per archive |
| Redis dump | — (volume persists) | On restart | ~50MB |
| SSL certs | 90 days (auto-renewed) | Every 12h check | ~10KB |

## Recommended Folder Structure for Backups

```
/opt/mohanurkongu/
  backups/
    db_2026-06-18.sql.gz       ← Auto-cleaned after 30 days
    db_2026-06-19.sql.gz
    media_2026-06-18.tar.gz    ← Auto-cleaned after 90 days
    media_2026-06-19.tar.gz
    redis_2026-06-18.rdb       ← Manual only
...
```
