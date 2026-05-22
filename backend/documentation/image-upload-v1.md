# Image Upload Processing Architecture

> **Version:** 1.0  
> **Scope:** Client-side image processing, compression, normalization, upload execution  
> **Applies To:** Profile Photo, Gallery Photos, Horoscope Images  
> **Architecture Type:** Runtime Upload Pipeline  
> **Compatible With:** Existing TEMP → DRAFT → ACTIVE upload lifecycle

---

## 1. Purpose

This document defines how image uploads are processed before being sent to the server.

The objective is to support:

```
Large phone images (2K / 4K / 8K)
  │
  ▼
Consistent upload format
  │
  ▼
3–5 MB upload size
  │
  ▼
Minimal visible quality loss
```

---

## 2. Goals

### Functional Goals

- Support large mobile images
- Reduce upload bandwidth
- Reduce storage usage
- Preserve image quality
- Preserve horoscope readability
- Produce predictable output

### Engineering Goals

- Single upload pipeline
- Unified image format
- Deterministic output
- Minimal browser memory usage
- Compatible with temporary upload architecture

---

## 3. Architecture Principles

### Principle 1 — Resize Before Compression

Never compress large images directly.

| ❌ Wrong | ✅ Correct |
|----------|------------|
| `4000×3000 → quality=70` | `4000×3000 → Resize → Encode` |

Reducing unnecessary pixels produces better quality than aggressive compression.

### Principle 2 — Normalize Upload Format

All uploads should be converted to a unified internal format.

```
Internal Format: WEBP
```

**Benefits:**
- Consistent behaviour
- Predictable compression
- Smaller storage footprint
- Simplified rendering

### Principle 3 — Target Final Size

Optimization should target a **final upload size**, not a compression percentage.

### Principle 4 — Preserve Visual Quality

Quality degradation must remain visually insignificant. Images should appear unchanged after upload.

---

## 4. Runtime Upload Pipeline

```
User Select
  │
  ▼
Validate
  │
  ▼
Preview
  │
  ▼
Decode
  │
  ▼
Analyze
  │
  ▼
Normalize Format
  │
  ▼
Calculate Target Resolution
  │
  ▼
Resize
  │
  ▼
Encode
  │
  ▼
Quality Gate
  │
  ▼
Upload
  │
  ▼
Receive uploadId
  │
  ▼
Store uploadId
```

---

## 5. Stage 1 — Select

The user selects an image from their device.

**Example input:**

| Property | Value |
|----------|-------|
| Filename | `IMG_4432.HEIC` |
| Size | 18 MB |
| Resolution | 4032 × 3024 |

The upload slot becomes **locked** upon selection.

---

## 6. Stage 2 — Validate

Validation occurs before any processing begins.

### Allowed Formats

| Extension | MIME |
|-----------|------|
| `jpg` | `image/jpeg` |
| `jpeg` | `image/jpeg` |
| `png` | `image/png` |
| `webp` | `image/webp` |
| `heic` | `image/heic` |

### Rejected Formats

| Extension | Reason |
|-----------|--------|
| `pdf` | Not an image |
| `gif` | No animation support |
| `svg` | Vector, not raster |

### Validation Checks

```
exists → mime → size
```

On failure:

```
unlock slot → show error
```

---

## 7. Stage 3 — Preview

A preview is generated **immediately** for instant feedback.

```
URL.createObjectURL(file)
```

**UI state:** `Selected... Optimizing...`

> At this stage, nothing has been uploaded yet.

---

## 8. Stage 4 — Decode

Decode the image into raw pixel data.

```
Input      Output
HEIC    →  Pixel Buffer
PNG     →  Pixel Buffer
JPG     →  Pixel Buffer
WEBP    →  Pixel Buffer
```

After this step, the original file format no longer matters.

---

## 9. Stage 5 — Analyze

Extract metadata from the decoded image.

### Read

| Property | Example |
|----------|---------|
| `width` | 4032 |
| `height` | 3024 |
| `size` | 18 MB |

### Compute

| Derived | Formula |
|---------|---------|
| Megapixels | `width × height / 1,000,000` |
| Aspect ratio | `width / height` |

---

## 10. Stage 6 — Normalize Format

Convert the decoded image to the unified internal format.

```
PNG → WEBP
HEIC → WEBP
JPG → WEBP
```

**Result:** Consistent processing for all inputs.

---

## 11. Stage 7 — Calculate Target Resolution

Resize dimensions are calculated dynamically based on target upload size.

### Formula

```
targetPixels = originalPixels × (targetSize / originalSize)

scale = √(targetPixels / originalPixels)

newWidth  = width  × scale
newHeight = height × scale
```

### Example

| Input | Value |
|-------|-------|
| Original | 4032 × 3024 (18 MB) |
| Target | 4 MB |
| Scale | `√(4 / 18) = 0.47` |
| Output | **1895 × 1421** |

---

## 12. Stage 8 — Resize

Resize using high-quality resampling.

| Algorithm | Recommendation |
|-----------|---------------|
| **Lanczos** | ✅ Recommended |
| Bicubic | ⚠️ Fallback |
| Bilinear | ❌ Avoid |
| Nearest | ❌ Avoid |

**Reason:** Preserve details, reduce artefacts.

---

## 13. Stage 9 — Encode

Encode the resized image to the target format.

| Parameter | Value |
|-----------|-------|
| Format | WEBP |
| Quality | 90 |
| Minimum | 88 |

> Never reduce quality aggressively.

**Example output:**

```
1900 × 1420 → WEBP Q90 → 4 MB
```

---

## 14. Stage 10 — Quality Gate

Verify the optimisation result meets quality standards.

### Checks

- Compressed size
- Resolution
- Compression ratio

### Rejection Threshold

```
Reject if: compressed < 25% of original
Accept if: compressed ≈ target (3–5 MB)
```

| Scenario | Verdict |
|----------|---------|
| 18 MB → 700 KB | ❌ Reject (too aggressive) |
| 18 MB → 4 MB | ✅ Accept |

---

## 15. Upload Execution

The optimised image is uploaded to the server.

```
POST /upload
```

### Server Processing

```
Validate
  │
  ▼
Generate UUID
  │
  ▼
Store as TEMP
  │
  ▼
Create Upload Metadata
```

**Storage path:** `/storage/uploads/temp/`

### Response

```json
{
  "id": "upload_123"
}
```

---

## 16. Persist Upload Reference

Only the `uploadId` is stored on the frontend.

**Storage:** IndexedDB

### Examples

| Context | Key |
|---------|-----|
| Profile photo | `photos.profile` |
| Gallery images | `photos.gallery[]` |
| Horoscope (CREATE) | `horoscope.horoscopeJson` (embedded) |
| Horoscope (UPLOAD) | `horoscope.filePath` |

> **Rule:** Store `uploadId` only. Never store image blobs in IndexedDB.

---

## 17. Memory Cleanup

Immediately release memory after upload completes.

### Cleanup Actions

- Close bitmap handle
- Clear canvas context
- Revoke `objectURL` via `URL.revokeObjectURL()`

**Purpose:** Prevent browser crashes from memory exhaustion.

---

## 18. Example Runtime

### Input

| Property | Value |
|----------|-------|
| File | `IMG_8877.PNG` |
| Resolution | 4000 × 3000 |
| Size | 18 MB |

### Pipeline

```
Validate    ✅ PNG accepted
Preview     URL created
Decode      Raw pixel buffer
Normalize   → WEBP
Resize      Lanczos → 1895 × 1421
Encode      WEBP Q90
Quality     4.2 MB ✅ (within 3–5 MB target)
Upload      HTTP 200
uploadId    "upload_abc123"
```

### Stored Result

```
/storage/uploads/temp/uuid.webp
```

---

## 19. Final Engineering Rules

| Rule | Guideline |
|------|-----------|
| Upload | Immediate — no waiting for form completion |
| Preview | Show before optimisation begins |
| Format | WEBP — unified across all inputs |
| Resize | Adaptive — calculated from target size |
| Compression | Minimal — preserve visual quality |
| Storage | TEMP first — attached to profile later |
| Frontend | Store `uploadId` only — never raw blobs |
| Quality | Preserve visuals — reject over-aggressive compression |

### Summary

```
Large Image
  │
  ▼
Adaptive Resize (target: 3–5 MB)
  │
  ▼
WEBP Q90
  │
  ▼
Upload
  │
  ▼
uploadId
```

---

*End of Document*
