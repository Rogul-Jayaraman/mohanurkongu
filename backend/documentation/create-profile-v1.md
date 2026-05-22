# Profile Creation Architecture

> **Version:** 1.0  
> **Deployment:** Hostinger VPS (Single Server)

---

## 1. Overview

This document defines the architecture for Profile Creation with the following capabilities:

- Multi-step profile creation
- Temporary file uploads
- Save Draft support
- Abandoned profile cleanup
- Horoscope/Jadagam generation or upload
- File replacement support
- Low DB load
- Low storage usage
- Future scalability

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React |
| Backend | Express |
| Database | PostgreSQL |
| Storage | Local Server Storage |
| Hosting | Hostinger VPS |

---

## 2. System Architecture

```
USER
  │
  ▼
React Frontend
  │
  ▼
Express Backend
  │
  ▼
PostgreSQL ───── Local Storage
```

### Server Structure

```
/app
  /frontend
  /backend
  /storage
    /uploads
      /temp
      /profiles
      /gallery
      /horoscope
  /postgres
```

---

## 3. Architecture Principles

### Principle 1 — Profile Is Created Only When User Decides

A profile does not exist automatically. It is created only when the user explicitly takes one of these actions:

- **Save Draft**
- **Create Profile**

### Principle 2 — Upload Files Immediately

Files are uploaded instantly upon selection, but remain **temporary** until attached to a profile.

### Principle 3 — Browser Owns Creation State

During profile creation, **IndexedDB** is the **source of truth**. The database is not continuously updated.

### Principle 4 — Draft Is Explicit

A draft exists **only** if the user clicks **Save Draft**. Otherwise, no persistent record is created.

---

## 4. Database Design

### Profiles

Stores actual profile data.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `reg_no` | String | Nullable; generated on activation |
| `status` | Enum | `DRAFT`, `ACTIVE`, `DELETED` |
| `profile_data` | JSONB | Form data payload |
| `created_at` | Timestamp | Auto-generated |
| `updated_at` | Timestamp | Auto-updated |

**Status values:**

```
DRAFT   → Profile saved but not yet active
ACTIVE  → Profile live and visible
DELETED → Profile removed
```

**Example:**

| id | status | reg_no |
|----|--------|--------|
| 1 | DRAFT | NULL |
| 2 | ACTIVE | MAT001 |

### Uploads

Stores upload metadata.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | Primary key |
| `path` | String | File path on local storage |
| `status` | Enum | `TEMP`, `DRAFT`, `ACTIVE` |
| `created_at` | Timestamp | Auto-generated |
| `updated_at` | Timestamp | Auto-updated |

**Status values:**

```
TEMP   → Uploaded but not attached to any profile
DRAFT  → Attached to a draft profile
ACTIVE → Attached to an active profile
```

**Example:**

| id | path | status |
|----|------|--------|
| 15 | `temp/p.jpg` | TEMP |

### Profile Uploads

Maps profiles to uploads (join table).

| Field | Type |
|-------|------|
| `profile_id` | UUID |
| `upload_id` | UUID |

---

## 5. Profile Creation Flow

```
Open Create
     │
     ▼
  Fill Form
     │
     ▼
 Upload Files
     │
     ▼
   Review
     │
     ▼
  Decision
 ┌───┼───┐
 ▼   ▼   ▼
Draft Create Leave
```

---

## 6. Local Form Architecture

Form data stays entirely in the browser during creation.

**Storage:** IndexedDB

**Data structure:**

```
{
  basic:    { ... },
  family:   { ... },
  partner:  { ... },
  photos:   [uploadId, ...],
  horoscope: { mode, data, uploadId }
}
```

**Flow:**

```
User Input → React State → IndexedDB
```

> **No database writes occur during form filling.**

---

## 7. Upload Architecture

Files upload immediately upon selection.

**Storage path:** `/storage/uploads/temp/`

**Flow:**

```
Select File
     │
     ▼
Lock Upload Slot
     │
     ▼
   Upload
     │
     ▼
Receive uploadId
     │
     ▼
Store uploadId
     │
     ▼
Unlock Slot
```

**Frontend stores:** `photos = [uploadId, uploadId, ...]`

---

## 8. Upload Replacement Architecture

When a user replaces an existing uploaded file:

```
Select New File
     │
     ▼
   LOCK
     │
     ▼
Upload New File
     │
     ▼
  SUCCESS
     │
     ▼
Delete Old File
     │
     ▼
Store New uploadId
     │
     ▼
  UNLOCK
```

> **Rule:** Never delete the old file before the new upload succeeds.

---

## 9. Upload Delete Flow

```
Delete Upload
     │
     ▼
 Delete File (storage)
     │
     ▼
Delete Upload Metadata (DB)
     │
     ▼
Remove Local Reference (IndexedDB)
```

---

## 10. Horoscope Architecture

### Supported Modes

| Mode | Description |
|------|------------|
| `CREATE` | Generate horoscope data via astrology engine |
| `UPLOAD` | Upload a horoscope document/image |

> Only one mode can be active at a time.

### Structure

```json
{
  "mode": "CREATE" | "UPLOAD",
  "data":  { ... },    // present when mode=CREATE
  "uploadId": "uuid"   // present when mode=UPLOAD
}
```

### Create Mode

```
Generate Horoscope → Store Response
```

### Upload Mode

```
Upload File → Store uploadId
```

### Switching Modes

**Create → Upload:**

```
Delete Generated Data
     │
     ▼
   Upload File
     │
     ▼
Store uploadId
```

**Upload → Create:**

```
Delete Upload
     │
     ▼
  Generate
     │
     ▼
Store Response
```

> **Rule:** Only one mode survives at any time.

---

## 11. Review Architecture

Review reads only from local state. No database calls are made.

```
IndexedDB + Preview URLs
     │
     ▼
     Render
```

---

## 12. Save Draft Architecture

Triggered manually by the user.

```
Collect Local State
     │
     ▼
 Create Profile (status = DRAFT)
     │
     ▼
Attach Uploads (status = DRAFT)
```

**Result:**

| Field | Value |
|-------|-------|
| `status` | DRAFT |
| `reg_no` | NULL |

---

## 13. Resume Draft Architecture

```
Open Draft
     │
     ▼
Load Profile
     │
     ▼
Load Uploads
     │
     ▼
Restore Local State (IndexedDB)
     │
     ▼
  Continue
```

---

## 14. Create Profile (Publish) Architecture

Triggered manually by the user.

```
   Validate
     │
     ▼
Create Profile
     │
     ▼
Generate RegNo
     │
     ▼
Attach Uploads
     │
     ▼
Profile → ACTIVE
Uploads → ACTIVE
     │
     ▼
Clear Local State
```

**Result:**

```
DRAFT     ──►  ACTIVE
reg_no: NULL ──►  MAT000001
```

---

## 15. Delete Draft Architecture

```
Delete Draft
     │
     ▼
Get Uploads
     │
     ▼
Delete Files (storage)
     │
     ▼
Delete Upload Metadata (DB)
     │
     ▼
Delete Profile (DB)
```

**Deletion order:**

1. **Storage** — Delete physical files
2. **Uploads** — Delete upload metadata
3. **Profile** — Delete profile record

---

## 16. Abandoned Profile Cleanup

### Scenario

A user uploads files but leaves without saving or creating a profile. No profile record exists, but orphaned `TEMP` files remain in storage.

### Cleanup Job

Runs **daily** as a scheduled task.

**Target:** Uploads with `status = TEMP` AND `updated_at > 24 hours`.

### Flow

```
Find TEMP uploads older than 24h
     │
     ▼
Delete physical files (storage)
     │
     ▼
Delete upload metadata (DB)
```

> **Safety:** Only `TEMP` uploads are deleted. `DRAFT` and `ACTIVE` uploads are never touched.

---

## 17. State Machine

### Profile States

```
LOCAL ──► DRAFT ──► ACTIVE ──► DELETED
```

### Upload States

```
TEMP ──► DRAFT ──► ACTIVE ──► DELETED
```

---

## 18. Runtime Architecture

```
User
  ├── Fill Form
  ├── Upload File(s)
  ├── Generate Horoscope
  ├── Navigate Steps
  │
  ▼
 Review
  │
  ▼
 Decision
  │
  ├── Save Draft
  │     Profile → DRAFT
  │     Upload → DRAFT
  │
  ├── Create
  │     Profile → ACTIVE
  │     Upload → ACTIVE
  │     Generate RegNo
  │
  └── Leave
        Cleanup TEMP uploads (>24h)
```

---

## 19. Performance Characteristics

### DB Writes

| Action | Writes |
|--------|--------|
| Typing / navigation | 0 |
| Upload file | 1 |
| Save Draft | 1 |
| Create Profile | 1 |

### Storage

- No duplicate files are stored
- Old files are deleted on replacement
- Temporary files are garbage-collected daily

### Cleanup

- Batch delete operations
- Scheduled daily via cron

### Goals

| Metric | Target |
|--------|--------|
| DB Load | Low |
| Storage Waste | Minimal |
| Operations | Simple, atomic |
| Architecture | Horizontally scalable |

---

*End of Document*
