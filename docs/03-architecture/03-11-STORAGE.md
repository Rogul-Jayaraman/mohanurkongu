# Storage Architecture

> **For beginners**: This page explains how the app stores and serves both
> dynamic user uploads (profile photos, horoscope charts, gallery) and
> static brand assets (logos, venue photos, videos). Dynamic uploads live
> under `storage/` and are served at `/mohanur_kongu_manamaalai/`. Static
> assets live under `media/` and are served at `/mohanur_kongu/`. Both are
> served directly by nginx — nothing bundled by Vite.

## Overview

The project has two distinct storage categories:

| Category | Directory | Git | URL Prefix | Example |
|----------|-----------|-----|------------|---------|
| **Static brand assets** | `media/` | Gitignored | `/mohanur_kongu/` | `/mohanur_kongu/logo.webp` |
| **Dynamic user uploads** | `storage/` | Gitignored | `/mohanur_kongu_manamaalai/` | `/mohanur_kongu_manamaalai/profiles/2026/06/upl_xxx.webp` |

- **Static assets** are developer-controlled images & videos (logos, venue photos, brand images). They are synced to the server via `rsync` on deploy and served read-only by nginx at `/mohanur_kongu/...`.
- **Dynamic uploads** are user-uploaded files via the API. They follow a state machine (TEMP → ACTIVE → DELETED) and are served by nginx at `/mohanur_kongu_manamaalai/...`.

The storage system for dynamic uploads uses a **pluggable provider pattern**
— currently only local filesystem storage is implemented, but the interface
supports adding S3, GCS, or Azure in the future.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     STORAGE DATA FLOW                                │
│                                                                     │
│  Client POST /uploads                                               │
│    │                                                                │
│    ▼                                                                │
│  Multer → temp file in OS tmpdir                                    │
│    │                                                                │
│    ▼                                                                │
│  Image Pipeline (validate → resize → convert to WebP)               │
│    │                                                                │
│    ▼                                                                │
│  LocalStorageService.upload() → <STORAGE_DIR>/<objectKey>           │
│    │                                                                │
│    ▼                                                                │
│  Upload DB record created (status=TEMP)                             │
│    │                                                                │
│    ▼  (profile attaches the upload)                                 │
│  TEMP → ATTACHED → ACTIVE                                           │
│    │                                   (user deletes)               │
│    ▼                                        │                      │
│  Cleanup jobs ──────────────────────────────┘                      │
│    │  TEMP >24h → DELETED                                           │
│    │  DELETE_PENDING >48h → DELETED                                 │
│    │  DRAFT profiles >30d → hard-delete                             │
└─────────────────────────────────────────────────────────────────────┘
```

## File Organization on Disk (Dynamic Uploads)

User-uploaded files are stored under `<STORAGE_DIR>` organized by category,
year, and month. (See the [Static Brand Assets](#static-brand-assets-media)
section for the `media/` layout.)

```
<STORAGE_DIR>/
  profiles/
    2026/
      06/
        upl_a1b2c3d4e5f6.webp
        upl_f6e5d4c3b2a1.webp
  gallery/
    2026/
      06/
        upl_112233445566.webp
  horoscope/
    2026/
      06/
        upl_778899aabbcc.webp
```

**objectKey format**: `<category>/<YYYY>/<MM>/<uploadToken>.webp`

| Part | Description |
|------|-------------|
| `category` | One of: `profiles`, `gallery`, `horoscope` |
| `YYYY` | 4-digit year (UTC) of upload |
| `MM` | 2-digit month (UTC, zero-padded) |
| `uploadToken` | `upl_` prefix + 12 random hex chars |
| `.webp` | All images converted to WebP format |

### Storage Provider Interface

```typescript
interface IStorageProvider {
  upload(filePath: string, objectKey: string, mimeType: string): Promise<string>;
  delete(objectKey: string): Promise<void>;
  exists(objectKey: string): Promise<boolean>;
}
```

Only one implementation exists: `LocalStorageService` which reads/writes to
`appConfig.storageDir`. To add cloud storage, implement this interface and
swap the provider in `src/app.ts`.

## Upload Lifecycle (State Machine)

```
TEMP ──→ ATTACHED ──→ ACTIVE
  │                     │
  │                     ▼
  │              DELETE_PENDING ──→ DELETED
  │                                   │
  └──→ DELETED                        │
                                      ▼
                              Hard-deleted from DB
                              (draft profile cleanup only)
```

| Status | Meaning | What happens |
|--------|---------|-------------|
| **TEMP** | Just uploaded, not attached to anything | Cleaned after 24 hours |
| **ATTACHED** | Linked to a profile/photo but not yet visible | Promoted to ACTIVE when profile is approved |
| **ACTIVE** | Visible on the site | User can request deletion |
| **DELETE_PENDING** | User asked to delete (soft-delete) | File removed after 48-hour grace period |
| **DELETED** | File deleted from disk, DB row kept | Terminal state |

## Cleanup Jobs

Four background jobs run in the Node process (long-lived `setInterval` loops).

| Job | Interval | What it cleans | Action |
|-----|----------|----------------|--------|
| `cleanup-temp-uploads.job` | 60 min | TEMP uploads older than 24h | Delete file from disk → DB status=DELETED |
| `cleanup-deleted-uploads.job` | 30 min | DELETE_PENDING older than 48h | Delete file from disk → DB status=DELETED |
| `cleanup-draft-profiles.job` | 24 h | DRAFT profiles older than 30 days | Delete files + hard-delete DB rows |
| `cleanup-bullmq.job` | 30 sec | BullMQ job queue memory pressure | Remove completed/failed jobs from Redis |

Failed file deletions are retried up to 5 times. If all attempts fail, the
upload is marked as `cleanupAbandonedAt` and no longer retried.

## Static Brand Assets (`media/`)

Static assets (logos, venue photos, brand images, videos) live in `media/`
at the project root. These are developer-controlled and synced to the server
via `rsync` on deploy — they never go through git or Vite.

```
<project-root>/
  media/
    logo.webp
    landing.mp4
    office-bearers/
      2026-group.webp
      2026-president.webp
    venue/
      exterior.webp
      dining.webp
    gallery/
      hall-1.webp
      hall-2.webp
    qr/
      manamaalai-qr.webp
```

All images must be WebP format. Video files (mp4) stay in a `videos/` folder.

### Serving (nginx — all environments)

```
location /mohanur_kongu/ {
    alias /media-mohanurkongu/;
    expires 365d;
    add_header Cache-Control "public, immutable";
}
```

URL `https://example.com/mohanur_kongu/logo.webp` → file at
`/media-mohanurkongu/logo.webp`.

### Serving (Express — local dev without Docker)

```typescript
if (appConfig.isDev) {
  app.use('/mohanur_kongu', express.static(mediaDir, { maxAge: '1y' }));
}
```

Added in `src/app.ts` for non-Docker local development only. In Docker dev or
production, nginx handles all requests for this prefix.

## Dynamic User Uploads (`storage/`)

User-uploaded files follow the state machine and lifecycle described above.
They are stored under `<STORAGE_DIR>` organized by category, year, and month.

### Serving (nginx — production & Docker dev)

```
location /mohanur_kongu_manamaalai/ {
    alias /storage/media/;
    expires 365d;
    add_header Cache-Control "public, immutable";
}

location /mohanur_kongu_manamaalai/by-token/ {
    rewrite ^/mohanur_kongu_manamaalai/by-token/(.+)$ /media/by-token/$1 break;
    proxy_pass http://backend;
}
```

URL `https://example.com/mohanur_kongu_manamaalai/profiles/2026/06/upl_xxx.webp`
→ file at `/storage/media/profiles/2026/06/upl_xxx.webp`.

### Serving (Express — local dev without Docker)

```typescript
if (appConfig.isDev) {
  app.use('/mohanur_kongu_manamaalai', express.static(appConfig.storageDir, { maxAge: '1y' }));
  app.use('/mohanur_kongu_manamaalai/by-token/:uploadToken', ...);
}
```

The `/by-token/` sub-route resolves an `uploadToken` to the actual file path
in the database and serves the file. This allows the frontend to reference
uploads by short token during the upload flow.

## Host Storage Layout

Both compose files use bind mounts from the project root:

```
<project-root>/
  media/                   ← static brand assets (gitignored)
    logo.webp
    landing.mp4
    venue/
    office-bearers/
    gallery/
    qr/

  storage/                 ← user uploads (gitignored)
    media/
      profiles/
      gallery/
      horoscope/

Docker:
  nginx:     - ../media:/media-mohanurkongu:ro    # static assets (read-only)
             - ../storage:/storage:ro              # uploads (read-only)
  backend:   - ../storage:/storage                 # uploads (write)
```

Nginx serves both directories read-only. The backend has write access only
to `storage/` (for user uploads). Static assets are pre-placed in `media/`
and never modified by the application.

You can browse files directly on the server:

```bash
ls -la /opt/mohanurkongu/media/               # Static assets
ls -la /opt/mohanurkongu/storage/media/        # User uploads
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `STORAGE_DIR` | `<project>/../storage/media` | Root directory for dynamic upload files |

When running with Docker, `STORAGE_DIR=/storage/media` (set in compose
files). When running locally without Docker, it defaults to `storage/media`
alongside the `backend/` directory.

## Upload Pipeline

```
POST /uploads  (multipart, max 10 MB, images only)
  │
  ├─ Multer: writes to OS temp dir
  ├─ ImageValidator: extension + MIME + magic bytes + sharp metadata
  ├─ HeicConverter: HEIC/HEIF → PNG
  ├─ ImageProcessor: resize per category + convert to WebP
  ├─ StorageService.createFromPipeline:
  │    ├─ LocalStorageService.upload() → copies file to STORAGE_DIR
  │    └─ StorageRepository.create() → DB record (status=TEMP)
  └─ Temp cleanup: delete multer temp + pipeline temp dir
```

### Image Processing Per Category

| Category | Max Width | Max Height | Max Dimension | WebP Quality |
|----------|-----------|------------|---------------|--------------|
| profiles | 1800 | 2400 | — | 90 |
| gallery | — | — | 2200 | 90 |
| horoscope | — | — | 3000 | 95 |

All images are rotated EXIF-aware, resized with `fit: 'inside'` (no
enlargement), and saved as WebP with `effort: 4`.

## Database Model

The `Upload` model in Prisma tracks every file:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `uploadToken` | `upl_<12hex>` | Human-friendly lookup token |
| `ownerAccountId` | UUID | Who uploaded it |
| `objectKey` | String | Relative path: `profiles/2026/06/upl_xxx.webp` |
| `originalFileName` | String | Original filename |
| `mimeType` | String | `image/webp` (always WebP after pipeline) |
| `size` | Int | File size in bytes |
| `checksum` | String | SHA-256 hex |
| `status` | Enum | TEMP / ATTACHED / ACTIVE / DELETE_PENDING / DELETED |
| `width` / `height` | Int? | Image dimensions |
| `cleanupAttempts` | Int | Failed delete attempts (max 5) |
| `cleanupLastError` | Text? | Last failure message |
| `cleanupAbandonedAt` | DateTime? | When retries were exhausted |
| `deletedAt` | DateTime? | When it was marked deleted |

### Relations

- `Upload` → `ProfilePhoto` (via `primaryUploadId`)
- `Upload` → `ProfileGalleryPhoto` (via `uploadId`)
- `Upload` → `ProfileHoroscope` (as `rasiChartUploadId` or `navamsaChartUploadId`)

## Key Design Decisions

1. **No direct file deletion** — Users mark uploads for deletion (status
   `DELETE_PENDING`), and a background job physically removes them after 48
   hours. This allows recovery if the user changes their mind.

2. **DB records are never hard-deleted** (except draft profiles) — the
   `DELETED` status row stays for audit trail and potential data recovery.

3. **All images become WebP** — the pipeline converts every uploaded image
   to WebP regardless of input format (JPEG, PNG, HEIC). This reduces
   storage and bandwidth at the cost of losing the original format.

4. **Static assets are not bundled by Vite** — brand images and videos live
   in `media/` at the project root and are served directly by nginx. This
   avoids binary bloat in git and keeps builds fast.

5. **Two distinct URL prefixes** — `/mohanur_kongu/` for static brand assets
   and `/mohanur_kongu_manamaalai/` for dynamic user uploads. This provides
   clear separation for caching policies, access control, and monitoring.

6. **Bind mounts, not named volumes** — both `media/` and `storage/`
   directories are bind-mounted from the host, making files accessible
   without `docker exec` and easy to back up.
