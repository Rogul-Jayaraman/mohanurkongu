# Troubleshooting

> **For beginners**: When something breaks, start here. These are the most
> common issues and how to fix them. Always check logs first — they tell you
> exactly what's wrong.

## Quick Diagnostic Commands

```bash
cd /opt/mohanurkongu

# Are all containers running?
docker compose -f docker/docker-compose.prod.yml ps

# What does the backend say?
docker compose -f docker/docker-compose.prod.yml logs backend --tail=50

# What does nginx say?
docker compose -f docker/docker-compose.prod.yml logs nginx --tail=50

# Is the server reachable?
curl -I https://yourdomain.com

# Is the API healthy?
curl https://yourdomain.com/health

# How much disk space is left?
df -h
```

## Container Won't Start

### PORT_ALREADY_IN_USE — "port is already allocated"

Something else on the server is using port 80, 443, or 4000.

```bash
# Find what's using the port
sudo lsof -i :80

# Common culprits:
# - Apache/Nginx installed via apt (not Docker) → sudo systemctl stop apache2
# - Another Docker container → docker ps, find and stop it
# - Something from a previous failed Docker run
```

### Container exits immediately (no error)

The healthcheck is failing, so Docker keeps restarting.

```bash
# Check the container's exit message
docker compose -f docker/docker-compose.prod.yml logs postgres --tail=20

# Common cause: env_file path is wrong
# Check that backend/.env.prod exists and has correct DATABASE_URL
ls -la backend/.env.prod
```

### Container keeps restarting (CrashLoopBackOff)

```bash
# See the actual error
docker compose -f docker/docker-compose.prod.yml logs backend

# Common backend errors:
# "Missing required env var: JWT_ACCESS_SECRET"
#   → backend/.env.prod is missing this variable
# "Can't reach database at postgres:5432"
#   → postgres container isn't ready yet (wait 30s)
#   → DATABASE_URL has wrong host/port/password
```

## SSL / HTTPS Issues

### "Your connection is not private" / NET::ERR_CERT_AUTHORITY_INVALID

```bash
# Check if the certificate exists
docker compose -f docker/docker-compose.prod.yml exec nginx \
  ls -la /etc/letsencrypt/live/yourdomain.com/

# If empty, run the certbot command (see DEPLOYMENT_GUIDE.md Step 8)
```

### Certificate expired

Certbot auto-renews, but if the container was down for more than 30 days:

```bash
# Force renewal
docker compose -f docker/docker-compose.prod.yml exec nginx \
  certbot renew --force-renewal

docker compose -f docker/docker-compose.prod.yml exec nginx nginx -s reload
```

### HTTP redirects to HTTPS but never loads (redirect loop)

Check that `DOMAIN_NAME` is set correctly in `backend/.env.prod`. Nginx uses
it in the server_name directive.

```bash
grep DOMAIN_NAME backend/.env.prod
# Should be: DOMAIN_NAME=yourdomain.com
```

### Certbot fails with "No IP addresses found for yourdomain.com"

DNS hasn't propagated yet. Wait a few hours and try again.

```bash
# Check DNS
dig +short yourdomain.com
# Should show your server IP
```

## Database Issues

### "Connection refused" when backend tries to reach database

```bash
# Check if postgres container is healthy
docker compose -f docker/docker-compose.prod.yml ps postgres

# Check postgres logs
docker compose -f docker/docker-compose.prod.yml logs postgres --tail=30

# Common cause: DATABASE_URL in .env.prod has wrong host
# Must be: postgresql://user:password@postgres:5432/dbname
# (hostname is "postgres", the Docker service name, not "localhost")
```

### "Role does not exist" or "database does not exist"

PostgreSQL is running but the database/user hasn't been created yet. The
`POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` env vars should
auto-create them on first start — but only on the first run.

```bash
# If you changed these after first start, the volume has old data.
# Purge the volume and start fresh:
docker compose -f docker/docker-compose.prod.yml down
docker volume rm mohanurkongu_postgres_data
docker compose -f docker/docker-compose.prod.yml up -d postgres
# Wait 10s, then start everything else:
docker compose -f docker/docker-compose.prod.yml up -d
```

⚠️ **This deletes ALL database data.** Only do this on a fresh server or if
you have a recent backup.

## Storage / File Upload Issues

### Uploaded files return 404 when accessed

```bash
# Check if the storage bind mount is working (dynamic uploads)
docker compose -f docker/docker-compose.prod.yml exec backend ls -la /storage/media/

# Check static assets bind mount (brand images, videos)
docker compose -f docker/docker-compose.prod.yml exec nginx ls -la /media-mohanurkongu/

# If empty, check the host directories
ls -la /opt/mohanurkongu/storage/media/
ls -la /opt/mohanurkongu/media/

# Check nginx can read the files
docker compose -f docker/docker-compose.prod.yml exec nginx ls -la /storage/media/
docker compose -f docker/docker-compose.prod.yml exec nginx ls -la /media-mohanurkongu/
```

### "ENOSPC: no space left on device"

The server disk is full.

```bash
df -h                    # Check overall disk usage
du -sh storage/media/    # Check user upload file sizes
du -sh media/            # Check static asset sizes
du -sh backups/          # Check backup sizes

# Clean backups
rm /opt/mohanurkongu/backups/db_*.sql.gz
rm /opt/mohanurkongu/backups/media_*.tar.gz

# Remove unused Docker images
docker image prune -a -f

# Prune unused Docker volumes (CAREFUL — deletes orphan volumes)
docker volume prune -f
```

### Uploads fail silently (file doesn't appear)

Check the backend logs — the upload pipeline may be rejecting the file:

```bash
docker compose -f docker/docker-compose.prod.yml logs backend | grep upload
```

Common reasons:
- File too large (multer limit is 10MB by default)
- Wrong file type (only images allowed)
- `STORAGE_DIR` points to the wrong path

## Redis Issues

### "Could not connect to Redis at redis:6379"

```bash
# Check if redis is healthy
docker compose -f docker/docker-compose.prod.yml ps redis

# Check redis logs
docker compose -f docker/docker-compose.prod.yml logs redis --tail=20

# Verify the password in .env.prod matches redis config
# (Redis doesn't require a password by default — it's set in compose command)
```

### BullMQ jobs stuck in "waiting" and never execute

```bash
# Check that Redis is reachable from the backend
docker compose -f docker/docker-compose.prod.yml exec backend \
  node -e "const Redis=require('ioredis'); new Redis({host:'redis',port:6379,password:'...'}).ping().then(console.log)"

# Restart the backend to reset queue connections
docker compose -f docker/docker-compose.prod.yml restart backend
```

## Email/Notification Issues

### Emails not sending

All email goes through SMTP. In production, you need a real SMTP server
(Gmail SMTP, SendGrid, Mailgun, etc.).

```bash
# Check backend logs for SMTP errors
docker compose -f docker/docker-compose.prod.yml logs backend | grep -i smtp

# Check .env.prod has correct SMTP settings
grep SMTP backend/.env.prod
```

For testing, Mailpit is included in the stack — it captures all emails in a
web UI at `http://yourdomain.com:8025` (or just `:8025` locally).

## Common Docker Commands

```bash
# View logs for a specific container
docker compose -f docker/docker-compose.prod.yml logs backend -f

# Restart a single container (without rebuilding)
docker compose -f docker/docker-compose.prod.yml restart backend

# Rebuild and restart a single container
docker compose -f docker/docker-compose.prod.yml up -d --build backend

# Stop everything
docker compose -f docker/docker-compose.prod.yml down

# Stop everything AND delete volumes (deletes ALL data!)
docker compose -f docker/docker-compose.prod.yml down -v

# Execute a command inside a running container
docker compose -f docker/docker-compose.prod.yml exec backend sh

# Check resource usage
docker stats

# List all images and their sizes
docker image ls
```

## Getting Help

If the troubleshooting steps above don't resolve your issue:

1. Check all logs: `docker compose -f docker/docker-compose.prod.yml logs`
2. Include the full error message when asking for help
3. Mention what changed just before the issue (deploy? config change? DNS?)
