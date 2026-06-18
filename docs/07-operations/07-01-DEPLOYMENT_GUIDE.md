# Deployment Guide

> **For beginners**: This guide walks step-by-step from buying a server to
> having the app live on the internet. Everything runs in Docker on a single
> machine — no cloud services, no Kubernetes, no external databases. All
> config and secrets are carefully separated so nothing sensitive gets
> committed to git.

## Architecture Overview

```
                      ┌──────────────────────┐
                      │     Internet          │
                      └──────┬───────────────┘
                             │ ports 80, 443
                             ▼
                     ┌───────────────┐
                     │    Nginx      │◀── certbot (auto SSL renew)
                     │  (reverse     │
                     │   proxy)      │
                     └───┬───┬───────┘
                    ┌────┘   └────┐
                    ▼             ▼
             ┌──────────┐  ┌──────────┐
             │  Backend  │  │ Frontend │
             │ (Node.js) │  │ (nginx   │
             │  :4000    │  │  static) │
             └──┬───┬────┘  └──────────┘
          ┌─────┘   └─────┐
          ▼               ▼
   ┌──────────┐    ┌──────────┐
   │PostgreSQL│    │  Redis   │
   │ (:5432)  │    │ (:6379)  │
   └──────────┘    └──────────┘
```

All services run on **one server**. The backend serves the API, the frontend
serves static files, and nginx routes traffic between them. Media files are
stored on the host filesystem via a bind mount — no S3, no cloud storage.

## Prerequisites

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| VPS (Hostinger) | 2 vCPU, 2GB RAM, 50GB SSD | 4 vCPU, 4GB RAM |
| OS | Ubuntu 22.04 / Debian 12 | Ubuntu 24.04 |
| Docker | 24+ | Latest |
| Domain | A record pointing to server IP | Both `@` and `www` |
| Ports open | 22 (SSH), 80 (HTTP), 443 (HTTPS) | Same |

## Step 1: Initial Server Setup

```bash
# SSH into your server (replace with your server IP)
ssh root@your-server-ip

# Update everything
apt update && apt upgrade -y

# Set hostname
hostnamectl set-hostname mohanurkongu

# Create a non-root user
adduser deploy
usermod -aG sudo deploy

# Copy your SSH key
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

### Firewall (UFW)

```bash
# Only open what's needed
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp          # SSH
ufw allow 80/tcp          # HTTP (for certbot challenge)
ufw allow 443/tcp         # HTTPS
ufw --force enable

# Verify
ufw status verbose
```

### Disable root password login (SSH hardening)

```bash
sed -i 's/^PermitRootLogin yes/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
sed -i 's/^#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd
```

Now log out and reconnect as `deploy`:

```bash
ssh deploy@your-server-ip
```

## Step 2: Install Docker

```bash
# Install Docker using the official convenience script
curl -fsSL https://get.docker.com | sh

# Add your user to the docker group (so you don't need sudo)
sudo usermod -aG docker $USER

# Log out and back in for the group change to take effect
exit
```

SSH back in, then verify:

```bash
ssh deploy@your-server-ip
docker --version          # Should print version
docker compose version    # Should print version (plugin, not standalone)
```

## Step 3: Clone the Repository

```bash
sudo mkdir -p /opt/mohanurkongu
sudo chown deploy:deploy /opt/mohanurkongu
cd /opt/mohanurkongu

git clone https://github.com/your-org/mohanurkongu.git .
# or if using SSH:
# git clone git@github.com:your-org/mohanurkongu.git .
```

## Step 4: DNS Setup

At your domain registrar, create these A records pointing to your server IP:

| Type | Name | Value |
|------|------|-------|
| A | `@` | `<server-ip>` |
| A | `www` | `<server-ip>` |

This makes `https://yourdomain.com` and `https://www.yourdomain.com` both
point to your server. DNS propagation can take 5 minutes to 24 hours.

## Step 5: Create Production Environment File

```bash
cp backend/.env.example backend/.env.prod
nano backend/.env.prod   # or vim, or any editor
```

Replace every `CHANGE_ME` with real values. Here's what each variable means:

### Required (will crash without these)

| Variable | What it is | Where to get it |
|----------|------------|-----------------|
| `POSTGRES_USER` | Database username | Choose one (e.g. `mohanurkongu`) |
| `POSTGRES_PASSWORD` | Database password | Generate with `openssl rand -base64 32` |
| `POSTGRES_DB` | Database name | Choose one (e.g. `mohanurkongu`) |
| `DATABASE_URL` | Full connection string | `postgresql://USER:PASSWORD@postgres:5432/DB_NAME` |
| `JWT_ACCESS_SECRET` | Signs access tokens | `openssl rand -base64 64` |
| `JWT_REFRESH_SECRET` | Signs refresh tokens | `openssl rand -base64 64` |
| `COOKIE_SECRET` | Encrypts cookies | `openssl rand -base64 32` |
| `REDIS_QUEUE_PASSWORD` | Redis for BullMQ | Generate a strong password |
| `REDIS_CACHE_PASSWORD` | Redis for caching | Can be same or different |
| `DOMAIN_NAME` | Your domain | e.g. `matrimony.mohanurkongu.com` |
| `CERTBOT_EMAIL` | For Let's Encrypt | Your email address |

### Optional (safe defaults exist)

| Variable | Default | What it does |
|----------|---------|--------------|
| `NODE_ENV` | `production` | Leave as is |
| `PORT` | `4000` | Backend port (must match compose) |
| `HOST` | `0.0.0.0` | Listen on all interfaces |
| `CORS_ORIGIN` | `http://localhost:5173` | Set to your domain, e.g. `https://yourdomain.com` |
| `LOG_LEVEL` | `info` | Log verbosity |
| `SMTP_HOST` | `mailpit` | SMTP server (mailpit in Docker) |
| `SMTP_PORT` | `1025` | SMTP port |
| `SMTP_USER` | - | SMTP username (leave blank for mailpit) |
| `SMTP_PASS` | - | SMTP password (leave blank for mailpit) |
| `SENTRY_DSN` | - | Sentry error tracking URL |
| `STORAGE_DIR` | `/storage/media` | Where uploads are saved (must match compose) |

### Security note on env_file

All secrets come from `backend/.env.prod` at container runtime. The compose
file uses `env_file:` — this means Docker injects the vars when the container
starts. They are never baked into the image.

The compose file also sets a few non-secret vars (like `NODE_ENV` and
`STORAGE_DIR`) in the `environment:` section. This is fine because those are
infrastructure paths, not secrets — but `DATABASE_URL` and other passwords
**must never** appear in `environment:`.

## Step 6: Create Data Directories

```bash
mkdir -p /opt/mohanurkongu/storage/media
mkdir -p /opt/mohanurkongu/media
```

### User uploads (`storage/`)

The compose file bind-mounts `../storage:/storage` into the containers. All
uploaded files live here, accessible directly on the host:

```
/opt/mohanurkongu/
  storage/
    media/
      profiles/    ← Profile photos
      gallery/     ← Gallery images
      horoscope/   ← Horoscope PDFs
```

### Static brand assets (`media/`)

The compose file bind-mounts `../media:/media-mohanurkongu:ro` into nginx.
Static assets (logos, venue photos, videos) are placed here and **synced via
rsync** from your development machine — they are not in git:

```bash
# From your local machine:
rsync -avz media/ deploy@your-server:/opt/mohanurkongu/media/
```

```
/opt/mohanurkongu/
  media/
    logo.webp          ← Brand logo
    landing.mp4        ← Hero video
    venue/             ← Venue photos
    office-bearers/    ← Office bearer group photos
    gallery/           ← Venue gallery
    qr/                ← QR codes
```

## Step 7: Build and Deploy

```bash
cd /opt/mohanurkongu

# Pull latest code (skip on first deploy)
git pull

# Build images and start everything
docker compose -f docker/docker-compose.prod.yml up -d --build

# Check all containers are running
docker compose -f docker/docker-compose.prod.yml ps

# Expected output:
#   mkm-postgres   running
#   mkm-redis      running
#   mkm-redis-cache running
#   mkm-mailpit    running
#   mkm-backend    running
#   mkm-frontend   running
#   mkm-nginx      running
#   mkm-certbot    running

# Run database migrations
docker compose -f docker/docker-compose.prod.yml exec backend \
  npx prisma migrate deploy

# Seed the database (first time only)
docker compose -f docker/docker-compose.prod.yml exec backend \
  npx prisma db seed
```

### What each container does

| Container | Image | Purpose |
|-----------|-------|---------|
| `mkm-postgres` | `postgres:16-alpine` | Main database |
| `mkm-redis` | `redis:7-alpine` | BullMQ job queue |
| `mkm-redis-cache` | `redis:7-alpine` | API response cache |
| `mkm-mailpit` | `axllent/mailpit` | Email test server (dev/staging) |
| `mkm-backend` | Built from `docker/backend/Dockerfile` | API server |
| `mkm-frontend` | Built from `docker/frontend/Dockerfile` | Static file server |
| `mkm-nginx` | Built from `docker/nginx/Dockerfile` | Reverse proxy + SSL |
| `mkm-certbot` | `certbot/certbot:v2` | Auto-renews SSL certs |

## Step 8: SSL Certificate (First Time Only)

The nginx container is configured to accept certbot challenges at
`/.well-known/acme-challenge/`. After step 7, nginx is already running on
port 80 — so certbot can verify domain ownership immediately.

```bash
# Get the certificate
docker compose -f docker/docker-compose.prod.yml exec nginx \
  certbot certonly --webroot -w /var/www/certbot \
  -d yourdomain.com -d www.yourdomain.com \
  --email you@email.com --agree-tos --no-eff-email

# Reload nginx to pick up the new certificate
docker compose -f docker/docker-compose.prod.yml exec nginx nginx -s reload
```

After this, the `certbot` container auto-renews every 12 hours. It monitors
the cert expiry and re-requests 30 days before expiration. You don't need to
touch it again.

### Behind the scenes

1. nginx serves `/.well-known/acme-challenge/` from `/var/www/certbot`
2. certbot places a token file there
3. Let's Encrypt checks the token via HTTP (port 80)
4. If verified, certbot saves certs to `/etc/letsencrypt/`
5. nginx reads certs from there and starts serving HTTPS

## Step 9: Verify Everything

```bash
# Health endpoint
curl https://yourdomain.com/health
# → {"status":"ok","timestamp":"2026-06-18T12:00:00.000Z"}

# Database health
curl https://yourdomain.com/health/db
# → {"db":"ok","latencyMs":3}

# Check SSL
curl -I https://yourdomain.com
# Look for: HTTP/2 200, Strict-Transport-Security header

# Check nginx error logs
docker compose -f docker/docker-compose.prod.yml logs nginx
```

## Step 10: Set Up Automated Backups

Add these to your server's crontab (`crontab -e`):

```cron
# Database backup — daily at 2 AM, keep 30 days
0 2 * * * cd /opt/mohanurkongu && docker compose -f docker/docker-compose.prod.yml exec -T postgres pg_dump -U mohanurkongu mohanurkongu | gzip > /opt/mohanurkongu/backups/db_$(date +\%F).sql.gz && find /opt/mohanurkongu/backups/ -name 'db_*.sql.gz' -mtime +30 -delete

# Media backup (user uploads + static assets) — daily at 3 AM, keep 90 days
0 3 * * * cd /opt/mohanurkongu && tar -czf /opt/mohanurkongu/backups/media_$(date +\%F).tar.gz storage/ media/ && find /opt/mohanurkongu/backups/ -name 'media_*.tar.gz' -mtime +90 -delete
```

## Step 11: Updating the App

```bash
cd /opt/mohanurkongu

# Pull new code
git pull

# Rebuild and restart (only changed images are rebuilt)
docker compose -f docker/docker-compose.prod.yml up -d --build

# Run any new database migrations
docker compose -f docker/docker-compose.prod.yml exec backend \
  npx prisma migrate deploy
```

Docker caches layers — if only backend code changed, only the backend image is
rebuilt. Frontend and nginx images are reused.

## Step 12: Rollback

```bash
cd /opt/mohanurkongu

# Stop everything
docker compose -f docker/docker-compose.prod.yml down

# Go back to a previous commit
git log --oneline -10          # Find the commit to revert to
git checkout <previous-commit-hash>

# Rebuild and start
docker compose -f docker/docker-compose.prod.yml up -d --build
```

## Files That Stay on the Server (not in git)

```
backend/.env.prod           ← Production secrets (gitignored)
storage/                    ← Uploaded media files (gitignored)
media/                      ← Static brand assets (gitignored)
backups/                    ← Database dumps (created by cron)
```

Everything else comes from the repository.

## Key Principles

1. **No secrets in git** — `.env.prod` is gitignored. Only `.env.example`
   (with `CHANGE_ME` placeholders) is committed.
2. **No `${VAR}` in compose files** — All secrets come from `env_file:` at
   container runtime. The compose file is safe to commit.
3. **No cloud dependencies** — Everything runs on one server. No S3, no
   external databases, no managed Redis.
4. **Self-contained compose files** — No `extends:` chains. Dev and prod
   compose files are independent.
5. **Bind mount for storage** — Files are on the host filesystem, accessible
   without `docker exec`. Easy to back up with `tar` or `rsync`.
6. **Single server** — Frontend, backend, database, and cache all on one
   machine. Simpler to manage, fewer failure points.
