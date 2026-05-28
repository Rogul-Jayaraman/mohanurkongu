# Image Upload Pipeline — Architecture

## Overview

The image upload pipeline handles file validation, processing, storage, and serving. Uploads are accepted at `POST /uploads`, processed through Sharp/WEBP conversion, stored on local disk, and served via `GET /media/:uploadId`. No direct file URLs are exposed to the client — only opaque upload IDs.

The pipeline follows a **process-and-store** pattern: the client uploads once immediately after file selection, gets back a `uploadId`, and later references that ID when saving/publishing the profile. Blobs and URLs never touch IndexedDB or the form state.

## Data Flow (Upload → Process → Store → Serve)

```
Browser                      Backend                          Disk
  │                            │                                │
  ├─ POST /uploads ───────────►│                                │
  │  (multipart: file+category)│                                │
  │                            ├─ multer.diskStorage() ────────►│
  │                            │  (writes to os.tmpdir())       │
  │                            │                                │
  │                            ├─ ImagePipelineService          │
  │                            │  ├─ ImageValidatorService      │
  │                            │  │  (magic bytes, MIME, res.)  │
  │                            │  ├─ HeicConverterService       │
  │                            │  │  (HEIC→PNG if needed)       │
  │                            │  └─ ImageProcessorService      │
  │                            │     (sharp: adaptive WEBP)     │
  │                            │                                │
  │                            ├─ StorageService                │
  │                            │  ├─ move to permanent dir      │
  │                            │  └─ create Upload row (DB)     │
  │                            │                                │
  │◄───────────────────────────┤                                │
  │  { uploadId }              │                                │
  │                            │                                │
  ── later (profile save/publish)                               │
  │                            │                                │
  ├─ POST /profiles/draft ────►│                                │
  │  { primaryUploadId: "..." }│                                │
  │                            ├─ UploadService                 │
  │                            │  transitionStatus(TEMP→DRAFT)  │
  │                            │                                │
  ── even later (view)                                          │
  │                            │                                │
  ├─ GET /media/:uploadId ────►│                                │
  │                            ├─ ownership check               │
  │                            ├─ stream file ─────────────────►│
  │◄───────────────────────────┤                                │
  │  <image bytes>             │                                │
```

## Upload Lifecycle

```
  TEMP ──(save draft)──► DRAFT ──(publish)──► ACTIVE
   │                                                │
   │ (24h cleanup)                                  │ (soft delete)
   ▼                                                ▼
  DELETED (hard)                             DELETED (soft, status only)
```

| Status | Meaning | Cleanup |
|--------|---------|---------|
| `TEMP` | Upload completed, not yet attached to any profile | Hard-deleted after 24h via `updatedAt` |
| `DRAFT` | Attached to a saved draft profile | Hard-deleted with draft (client action) |
| `ACTIVE` | Attached to a published profile | Soft-deleted (status only, files preserved) |
| `DELETED` | Published photo removed by user | Soft-delete; files retained for audit/recovery |

## Module Map

| Module | File | Responsibility |
|--------|------|----------------|
| **Upload Routes** | `upload.routes.ts` | Multer config (diskStorage), rate limiter (10/min), `POST /uploads` |
| **Upload Controller** | `upload.controller.ts` | Extract file + category from request, return `{ uploadId }` |
| **Upload Service** | `upload.service.ts` | Orchestrate pipeline, temp file cleanup, call storage service |
| **Image Pipeline** | `image-pipeline.service.ts` | Validate → HEIC convert → sharp process → return output |
| **Image Validator** | `image-validator.service.ts` | Magic bytes, MIME, extension, resolution (max 100MP) |
| **HEIC Converter** | `heic-converter.service.ts` | heic-convert library: HEIC/HEIF → PNG |
| **Image Processor** | `image-processor.service.ts` | Sharp: adaptive resize + WEBP encode per category |
| **Storage Service** | `storage.service.ts` | Upload lifecycle, status transitions, ownership-gated reads |
| **Storage Repository** | `storage.repository.ts` | Prisma queries for Upload model |
| **Local Storage** | `local-storage.service.ts` | `IStorageProvider` impl: read/write/delete/move/stream on disk |
| **Public ID Helper** | `public-id.helper.ts` | Generate `upl_xxxxxxxx` format IDs (base62, 8 chars) |
| **Media Routes** | `media.routes.ts` | `GET /media/:uploadId`, gated by `requireSession` |
| **Media Controller** | `media.controller.ts` | Stream image with Content-Type + Cache-Control |
| **Media Service** | `media.service.ts` | Thin wrapper around StorageService.getMediaUpload |
| **MediaImage** (Frontend) | `MediaImage.tsx` | Authenticated blob-fetch component; takes `uploadId`, returns `<img>` via object URL |

### IStorageProvider Interface

```typescript
interface IStorageProvider {
  upload(objectKey: string, sourceFilePath: string, mimeType: string): Promise<void>;
  delete(objectKey: string): Promise<void>;
  exists(objectKey: string): Promise<boolean>;
  move(sourceKey: string, destKey: string): Promise<void>;
  stream(objectKey: string): Promise<Readable>;
  getObjectPath(objectKey: string): string;
}
```

## Image Processing Config

| Category | Max Dimension | Format | Quality | Max Pixels | Use Case |
|----------|--------------|--------|---------|-----------|----------|
| `profiles` | 1800×2400 | WEBP | 90 | 4.32M | Profile portrait, sharp face detail |
| `gallery` | 2200 (adaptive) | WEBP | 90 | ~4.84M | Lifestyle photos, balanced quality |
| `horoscope` | 3000 (adaptive) | WEBP | 95 | ~9.00M | Chart images, max legibility |

**Scaling algorithm:** `scale = min(1, sqrt(maxPixels / currentPixels))`

For a 100MP input with category `profiles`: scale = sqrt(4.32M / 100M) ≈ 0.208 → ~2080×2080 output.

The output is always WEBP regardless of input format. HEIC/HEIF inputs are converted to PNG via `heic-convert` before entering the Sharp pipeline.

## Security

- **Magic byte validation** is mandatory and never skipped. Extension and MIME are cross-referenced but never trusted alone.
- **Max resolution:** 100 megapixels (any input exceeding this is rejected before Sharp allocates memory).
- **Ownership gating:** `GET /media/:uploadId` validates `req.accountId === upload.ownerAccountId`. Unauthorized returns 404 (not 403, to avoid leaking upload existence).
- **No public URLs:** `objectKey` is private. The only way to retrieve a file is through the authenticated `/media/:uploadId` endpoint.
- **Rate limited uploads:** 10 requests per minute per session on the upload route.
- **Storage outside public root:** Uploads are stored outside the web server's document root. Nginx never serves them directly.

## Database — Upload Model

```prisma
model Upload {
  id               String       @id @default(uuid()) @db.Uuid
  publicId         String       @unique @db.VarChar(16)     // upl_xxxxxxxx
  ownerAccountId   String       @db.Uuid
  objectKey        String                                    // private storage path
  originalFileName String
  mimeType         String                                    // always image/webp after pipeline
  extension        String
  size             Int
  checksum         String                                    // SHA-256 hex
  status           UploadStatus @default(TEMP)
  lastAccessedAt   DateTime?
  createdAt        DateTime     @default(now())
  updatedAt        DateTime     @updatedAt

  owner Account @relation(fields: [ownerAccountId], references: [id])

  rasiChartProfiles    ProfileHoroscope[]    @relation("RasiChart")
  navamsaChartProfiles ProfileHoroscope[]    @relation("NavamsaChart")
  primaryPhoto         ProfilePhoto?
  galleryPhotos        ProfileGalleryPhoto[]

  @@index([ownerAccountId])
  @@index([status])
  @@index([publicId])
  @@index([status, updatedAt])
  @@index([status, createdAt])
  @@index([status, lastAccessedAt])
  @@map("uploads")
}
```

## IndexedDB (Frontend)

Only upload IDs are stored in IndexedDB — never blobs, bytes, or object URLs:

```typescript
interface ProfileDraft {
  photos: {
    primaryUploadId: string | null;
    galleryUploadIds: string[];
  };
  horoscope: {
    rasiChartUploadId: string | null;
    navamsaChartUploadId: string | null;
  };
  // ...
}
```

Display URLs are derived at render time: use the `<MediaImage uploadId={uploadId} />` component which fetches the image as a blob via the authenticated Axios instance and renders it as an object URL.

## Cleanup Jobs

| Job | Schedule | Scope | Action |
|-----|----------|-------|--------|
| Temp cleanup | Every 1h | `status=TEMP` + `updatedAt < 24h ago` | Hard-delete file + DB row |
| Draft cleanup | Every 24h | Profiles `status=DRAFT` + `updatedAt < 30d ago` | Hard-delete profile + all uploads |

Both jobs use `hardDeleteMany()` which calls `StorageService.hardDeleteMany()` to coordinate file deletion + DB row deletion. The temp cleanup filter uses `updatedAt` (not `createdAt`) so that a long-running upload that happens to have an old `createdAt` isn't prematurely reaped.

## API Endpoints

### POST /uploads
Upload and process an image. Returns immediately after pipeline completes.

**Request:** `multipart/form-data`
- `file` — image file (JPG, PNG, WEBP, HEIC, HEIF)
- `category` — `profiles` | `gallery` | `horoscope`

**Response (201):**
```json
{ "uploadId": "uuid..." }
```

**Errors:** 400 (invalid file), 401 (unauthorized), 429 (rate limited)

### GET /media/:uploadId
Stream a processed image.

**Headers:**
- `Content-Type: image/webp`
- `Cache-Control: private, max-age=31536000`

**Errors:** 404 (not found or not owned)

### DELETE /uploads/:id
Delete an upload (hard delete for TEMP/DRAFT, soft delete for ACTIVE).

**Response (200):**
```json
{ "success": true }
```

## Rejected Decisions

| Issue | Reason |
|-------|--------|
| **Upload idempotency (checksum dedup)** | Duplicate TEMP uploads self-heal via 24h cleanup. Checksum dedup introduces stale-ID edge case. Not worth complexity. |
| **Crash-safe cleanup (file then DB)** | Millisecond window between file delete and DB row delete is acceptable risk. |
| **Quality iteration (hit file size target)** | Adaptive scale + fixed quality per category is simpler, faster, and predictable. No iterative encode loop. |
| **In-memory buffer (multer memoryStorage)** | Sharp pipeline reads from temp file path; memoryStorage risks OOM on large uploads. diskStorage is safer. |

## Known Limitations

- **No processing queue:** Concurrent large uploads compete for CPU during Sharp processing. Acceptable for initial scale (~10K users). Add BullMQ queue when needed.
- **HEIC decode performance:** `heic-convert` decode speed on the target Hostinger VM is untested. May need optimization or HEIC rejection.
- **No CDN:** Files are served directly from the Node.js process. For production at scale, serve from Nginx or add a CDN layer.
- **Single storage provider (local disk):** `IStorageProvider` interface is designed for S3/GCS migration but only the LocalStorageService implementation exists.
