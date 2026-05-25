# Create New Profile — Complete Documentation

## Table of Contents

1. [Overview](#overview)
2. [Data Model](#data-model)
3. [State Machines](#state-machines)
4. [7-Step Form Wizard](#7-step-form-wizard)
5. [Backend API Reference](#backend-api-reference)
6. [IndexedDB Offline Draft Persistence](#indexeddb-offline-draft-persistence)
7. [Upload Lifecycle](#upload-lifecycle)
8. [End-to-End Flow](#end-to-end-flow)
9. [Validation Rules](#validation-rules)
10. [Error Codes Reference](#error-codes-reference)
11. [Module Architecture & File Map](#module-architecture--file-map)
12. [Cleanup Jobs](#cleanup-jobs)

---

## Overview

The "Create New Profile" feature is a 7-step form wizard that allows registered users to create their matrimony profile. It supports:

- **Offline draft persistence** via IndexedDB (auto-save on step change, manual save, page unload)
- **Server-side draft save/resume** (upsert-based, no data loss on partial fills)
- **Photo upload** with image pipeline processing (resize, checksum)
- **Idempotent publish** (double-click safe via PublishLog)
- **Hard delete** for drafts, **soft delete** for published profiles
- **1 profile per account** (enforced by `@unique` on `accountId`)
- **Bilingual** (English + Tamil) via ProfileTranslation

### Key Principles

| Principle | Implementation |
|---|---|
| No DB writes while typing | IndexedDB is the real-time source of truth |
| Profile created only on publish | Draft save = upsert; publish = ACTIVE |
| Uploads happen immediately | TEMP status on upload, transitioned on draft save / publish |
| Single transaction | All multi-row ops in `prisma.$transaction` |
| Idempotent publish | `PublishLog` with unique `idempotencyKey` |
| Owner-only access | All endpoints verify `req.account.sub` matches ownership |

---

## Data Model

### Profile (`profiles`)

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | Auto-generated |
| accountId | UUID | UNIQUE, FK → accounts | 1:1 with Account |
| regNo | VARCHAR | UNIQUE, nullable | Format: `{prefix}-{padded}`; set on publish |
| currentStatus | ProfileStatus | NOT NULL | DRAFT, ACTIVE, INACTIVE, DELETED |
| visibility | Visibility | NOT NULL | PUBLIC, PRIVATE |
| activatedAt | TIMESTAMPTZ | nullable | Set on publish |
| archivedAt | TIMESTAMPTZ | nullable | Set on soft delete |

### Profile Sections (all 1:1 with Profile, cascade delete)

| Table | Key Fields |
|---|---|
| `profile_basic` | profileForId, gender, dob, diet, bloodGroup, heightId, weight, complexion, maritalStatus, currentLocationId, nativeLocationId |
| `profile_communities` | communityId, casteId, kulamId |
| `profile_professional` | education, jobSectorId, jobDetail, jobLocation, monthlySalary, salaryCurrency, companyName |
| `profile_family` | fatherAlive, fatherName, fatherJob, fatherSalary, motherAlive, motherName, motherJob, motherSalary, noOfBrother, noOfSister |
| `profile_horoscopes` | mode, birthTime, birthPlace, birthLat, birthLong, timezone, ayanamsa, rasiId, nakshatraId, lagnaId, rasiChartUploadId, navamsaChartUploadId, horoscopeJson |
| `profile_photos` | primaryUploadId (FK → uploads) |
| `profile_assets` | land, residenceType, otherAssets, vehicle |
| `partner_preferences` | ageMin, ageMax, heightMinId, heightMaxId, monthlySalary, expectationNote, preferredLocation |
| `profile_translations` | language (EN/TA), firstName, lastName, kuladeivam, fatherName, motherName, jobLocation |

### ProfileTranslation (`profile_translations`)

- Composite unique: `(profileId, language)`
- Two rows per profile (EN + TA)
- Each row stores: firstName, lastName, kuladeivam, fatherName, motherName, jobLocation
- Publish requires EN translation with firstName set

### Upload (`uploads`)

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| publicId | VARCHAR(16) | UNIQUE | Short readable ID for URLs |
| ownerAccountId | UUID | FK → accounts | Owner-only access during TEMP/DRAFT |
| objectKey | String | | Filesystem path (relative to uploadDir) |
| originalFileName | String | | User's original filename |
| mimeType | String | | e.g., image/jpeg |
| extension | String | | e.g., jpg |
| size | Int | | Bytes |
| checksum | String | | SHA-256 of processed image |
| status | UploadStatus | | TEMP → DRAFT → ACTIVE → DELETED |
| lastAccessedAt | TIMESTAMPTZ | nullable | Updated on media access |

Indexed by: `[ownerAccountId]`, `[status]`, `[publicId]`, `[status, updatedAt]`, `[status, createdAt]`, `[status, lastAccessedAt]`

### PublishLog (`publish_logs`)

| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| idempotencyKey | UUID | UNIQUE — prevents double publish |
| profileId | UUID | FK → profiles |
| regNo | String | Registration number assigned on publish |
| accountId | UUID | FK → accounts |
| createdAt | TIMESTAMPTZ | |

### ProfileStateHistory (`profile_state_history`)

Records every status transition with changedBy, fromStatus, toStatus, reason, optional JSON metadata.

### Supporting Reference Tables

These are seeded with reference data used by ProfileBasic and related sections:

| Table | Purpose | Seeded Rows |
|---|---|---|
| `profile_fors` | Who the profile is for | 5 (MYSELF, SON, DAUGHTER, etc.) |
| `heights` | Height options in cm | 110 |
| `job_sectors` | Employment sectors | 7 |
| `communities` | Community groups | 1 (Kongu Vellalar) |
| `castes` | Caste within community | 1 |
| `kulams` | Family clan/kulams | 60 |
| `risis` | Zodiac signs (Rasi) | 12 |
| `nakshatras` | Birth stars | 27 |
| `lagnas` | Ascendants | 12 |
| `districts` | Tamil Nadu districts | 39 |
| `taluks` | Sub-districts | 312 |

---

## State Machines

### Profile Status

```
                    ┌─────────┐
                    │  DRAFT  │
                    └────┬────┘
                         │ publish
                         ▼
                    ┌─────────┐
           ┌───────│ ACTIVE  │────────┐
           │       └─────────┘        │
           │ admin action              │ user archive
           ▼                           ▼
     ┌──────────┐              ┌──────────┐
     │ INACTIVE │              │ DELETED  │ (soft delete)
     └──────────┘              └──────────┘
```

- **DRAFT**: Created via `POST /profiles/draft` (upsert). Not visible to other users. Hard-deleted on request or after 30 days.
- **ACTIVE**: Created via `POST /profiles/publish`. Visible to other users, assigned regNo.
- **INACTIVE**: Admin action (not yet implemented in API).
- **DELETED**: Soft delete via `DELETE /profiles/:id`. Status set, `archivedAt` timestamped. Not visible.

### Upload Status

```
TEMP ──→ DRAFT ──→ ACTIVE ──→ DELETED
  │         │
  └── deleted ──┘          (if draft deleted)
```

- **TEMP**: Immediately after upload. Deleted after 24h by cleanup job.
- **DRAFT**: Transitioned from TEMP when draft is saved with these uploads attached.
- **ACTIVE**: Transitioned from DRAFT when profile is published.
- **DELETED**: Transitioned from ACTIVE when profile is soft-deleted. Cannot be deleted if already ACTIVE (rejected by service).

---

## 7-Step Form Wizard

### Steps Overview

| Step | Route Tab | Sections Affected |
|---|---|---|
| 1 | **Personal Details** | Basic (profileFor, gender, dob, diet, bloodGroup, height, weight, complexion, maritalStatus), Translations (firstName, lastName — EN/TA) |
| 2 | **Community & Professional** | Community (communityId, casteId, kulamId), Professional (education, jobSectorId, jobDetail, companyName, monthlySalary) |
| 3 | **Family** | Family (fatherAlive, fatherName, fatherJob, fatherSalary, motherAlive, etc.) |
| 4 | **Assets** | Assets (land, residenceType, otherAssets, vehicle) |
| 5 | **Horoscope** | Horoscope (mode, rasiId, nakshatraId, lagnaId, birthTime, birthPlace, chart uploads) |
| 6 | **Gallery** | Photos (primaryUploadId, galleryUploadIds) |
| 7 | **Review & Submit** | All sections displayed for final review; publish trigger |

### UI Entry Points

| Route | Purpose |
|---|---|
| `/manamaalai/new-profile` | Create new profile (fresh) |
| `/manamaalai/new-profile?draft=<draftId>` | Resume existing draft from server |
| `/manamaalai/my-profiles` | Dashboard listing all profiles; "Complete" button links to resume |

### Frontend State Management

1. **`useProfileForm`** (`frontend/src/hooks/useProfileForm.ts`):
   - Manages form data as `Partial<Profile>` state
   - Auto-restores from IndexedDB on mount (via `useIndexedDB`)
   - Exposes `persistDraft()` for saving to IndexedDB
   - Exposes `restoreDraft(serverData)` for server-side draft resume
   - Input formatting auto-applies title case / sentence case per field

2. **`useIndexedDB`** (`frontend/src/hooks/useIndexedDB.ts`):
   - Hydrates from IndexedDB on mount
   - Persists on `beforeunload` (page close/refresh)
   - `persistDraft()` is called on: step change + form is dirty, manual "Save as Draft" click
   - NOT called on per-field change (performance)

3. **IndexedDB Schema** (`frontend/src/lib/indexeddb.ts`):
   - Database: `kongu_profile_draft` (version 1)
   - Store: `profile_draft` with key `'current'`
   - Key path: `id` (always `'current'`)
   - One entry per user (singleton)

### Adapter Layer (`frontend/src/adapters/profile.adapter.ts`)

**`formToDraft(formData)`** → transforms form state to `ProfileDraft` for IndexedDB:

```
formData.firstNameEn → translations[EN].firstName
formData.firstNameTa → translations[TA].firstName
formData.fatherIsLate → family.fatherAlive = !fatherIsLate
formData.astrology.mode → horoscope.mode
formData.astrology.birthTime → horoscope.birthTime
formData.rasiId → horoscope.rasiId
formData.primaryUploadId → photos.primaryUploadId
formData.galleryUploadIds → photos.galleryUploadIds
... (all 90+ field mappings)
```

**`draftToForm(draft)`** → restores form state from IndexedDB draft:

```  
translations[EN].firstName → firstNameEn
translations[TA].firstName → firstNameTa
family.fatherAlive → fatherIsLate = !fatherAlive
horoscope.mode → astrology.mode
... (reverse mapping)
```

---

## Backend API Reference

### POST /profiles/draft

Save or update a draft profile (upsert by account). All fields optional — partial saves supported.

**Auth:** Required (Bearer token)
**Request Body:** See [Save Draft DTO Schema](#save-draft-dto-schema)
**Response (200):**
```json
{
  "success": true,
  "data": { "profileId": "uuid" }
}
```

**Flow:**
1. Upsert profile row (finds or creates for this account)
2. Validate upload ownership (if uploadIds provided)
3. Within transaction: upsert each section (basic, community, professional, family, horoscope, photos, assets, partnerPreference, translations)
4. Create initial state history entry (if first save)
5. Transition uploads from TEMP → DRAFT

### GET /profiles/draft/:id

Resume a draft by ID (must own the draft).

**Auth:** Required (Bearer token)
**Response (200):**
```json
{
  "success": true,
  "data": {
    "basic": { "profileFor": "1", "gender": "MALE", ... },
    "community": { "communityId": 1, "casteId": 1, "kulamId": null },
    "professional": { "education": "BE", "jobSectorId": 1, ... },
    "family": { "fatherAlive": true, ... },
    "horoscope": { "mode": "MANUAL", ... },
    "photos": { "primaryUploadId": "uuid", "galleryUploadIds": ["uuid"] },
    "assets": { "landEn": null, ... },
    "partnerPreference": { "ageMin": 21, ... },
    "translations": [
      { "language": "EN", "firstName": "John", ... },
      { "language": "TA", "firstName": "ஜான்", ... }
    ]
  }
}
```

### POST /profiles/publish

Publish a draft profile (make it active).

**Auth:** Required (Bearer token)
**Rate Limit:** 3 per minute
**Request Body:**
```json
{
  "draftId": "uuid",
  "idempotencyKey": "uuid",
  "agreedToTerms": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "regNo": "MKM-000001",
    "profileId": "uuid",
    "alreadyPublished": false
  }
}
```

**Publish Validation (all required):**
- Profile exists and is DRAFT status
- `profile_basic` row exists
- `profile_communities` row exists
- `profile_photos` row with `primaryUploadId` set
- EN translation with `firstName` set

**Flow:**
1. Load draft with all publish-critical sections
2. Validate all required data present
3. Generate registration number from Counter table
4. Transaction: check idempotency (skip if already published), update status to ACTIVE, set regNo + activatedAt, create state history, create PublishLog
5. Post-transaction: transition uploads from DRAFT → ACTIVE

### DELETE /profiles/draft/:id

Permanently delete a draft and all associated upload files.

**Auth:** Required (Bearer token)
**Response:** 204 No Content

**Flow:**
1. Load draft with photo + horoscope upload IDs
2. Transaction: hard-delete all upload files from disk, hard-delete upload rows, hard-delete profile row (cascade deletes all sections)

### DELETE /profiles/:id

Soft-delete an active profile.

**Auth:** Required (Bearer token)
**Response:** 204 No Content

**Flow:**
1. Load active profile
2. Update status to DELETED, set archivedAt
3. Create state history
4. Transition uploads from ACTIVE → DELETED

### POST /uploads

Upload a file (image only) for a profile.

**Auth:** Required (Bearer token)
**Rate Limit:** 10 per minute
**Request:** `multipart/form-data`
- `file` (single file, required)
- `category` (optional, one of: `profiles`, `gallery`, `horoscope`; default: `profiles`)
**Response (201):**
```json
{
  "success": true,
  "data": { "uploadId": "uuid" }
}
```

**Flow:**
1. Multer stores file to temp directory
2. ImagePipelineService processes (resize, checksum, rename)
3. StorageService.createFromPipeline creates upload row with TEMP status
4. Temp file cleaned up

### DELETE /uploads/:id

Delete an upload (only if not ACTIVE).

**Auth:** Required (Bearer token)
**Response:** 200 OK

**Rules:**
- Only the owner can delete
- ACTIVE status → rejected (400)
- DELETED status → rejected (400)
- Hard deletes file from disk + DB row

### GET /files/:objectKey

Serve uploaded files statically.

**Auth:** Required (Bearer token)
**Response:** File stream with correct MIME type

**Access Control:**
- DELETED → 404
- TEMP/DRAFT → only owner can access
- ACTIVE → anyone authenticated can access

---

## Save Draft DTO Schema

The `saveDraftSchema` (Zod) accepts partial data for all sections:

```typescript
{
  basic?: {
    profileFor?: string | null,       // "1", "2", ...
    gender?: string | null,           // "MALE" | "FEMALE" | "OTHER"
    dob?: string | null,              // ISO date string
    diet?: string | null,             // "VEGETARIAN" | "NON_VEGETARIAN" | ...
    bloodGroup?: string | null,       // "A_POSITIVE" | ...
    height?: number | null,           // ID from heights table
    weight?: number | null,
    complexion?: string | null,       // "FAIR" | "WHEATISH" | ...
    maritalStatus?: string | null,    // "NEVER_MARRIED" | ...
    currentDistrict?: string | null,
    currentTaluk?: string | null,
    currentCityEn?: string | null,
    currentCityTa?: string | null,
    currentStateEn?: string | null,
    currentStateTa?: string | null,
    currentCountryEn?: string | null,
    currentCountryTa?: string | null,
    nativeDistrict?: string | null,
    nativeTaluk?: string | null
  } | null,
  community?: {
    communityId?: number | null,
    casteId?: number | null,
    kulamId?: number | null
  } | null,
  professional?: {
    education?: string | null,
    jobSectorId?: number | null,
    jobDetail?: string | null,
    companyName?: string | null,
    jobLocationEn?: string | null,
    jobLocationTa?: string | null,
    monthlySalary?: number | null
  } | null,
  family?: {
    fatherAlive?: boolean,
    fatherName?: string | null,
    fatherJob?: string | null,
    fatherSalary?: number | null,
    motherAlive?: boolean,
    motherName?: string | null,
    motherJob?: string | null,
    motherSalary?: number | null,
    noOfBrother?: number | null,
    noOfSister?: number | null
  } | null,
  horoscope?: {
    mode?: string | null,
    birthTime?: string | null,
    birthPlace?: string | null,
    rasiId?: number | null,
    nakshatraId?: number | null,
    lagnaId?: number | null,
    rasiChartUploadId?: string | null,
    navamsaChartUploadId?: string | null,
    horoscopeJson?: any | null
  } | null,
  photos?: {
    primaryUploadId?: string | null,
    galleryUploadIds?: string[]
  } | null,
  assets?: {
    landEn?: string | null,
    landTa?: string | null,
    residenceType?: string | null,
    otherAssetsEn?: string | null,
    otherAssetsTa?: string | null,
    vehicle?: string | null
  } | null,
  partnerPreference?: {
    ageMin?: number | null,
    ageMax?: number | null,
    heightMinId?: number | null,
    heightMaxId?: number | null,
    monthlySalary?: number | null,
    expectationNoteEn?: string | null,
    expectationNoteTa?: string | null,
    preferredLocationEn?: string | null,
    preferredLocationTa?: string | null
  } | null,
  translations?: [{
    language: "EN" | "TA",
    firstName?: string | null,
    lastName?: string | null,
    kuladeivam?: string | null,
    fatherName?: string | null,
    motherName?: string | null,
    jobLocation?: string | null
  }]
}
```

Note: `currentLocationId` and `nativeLocationId` are currently not persisted from draft — the adapter passes `currentDistrict`/`currentTaluk` as strings, but the service only stores location IDs. This is a known gap.

---

## IndexedDB Offline Draft Persistence

### Purpose

IndexedDB serves as the **real-time source of truth** during form fill. It prevents data loss on browser crashes, accidental closes, or navigation away from the form.

### Architecture

```
┌───────────────────────────────────────────────────┐
│                    Browser                         │
│                                                    │
│  Form State (useProfileForm)                       │
│       │                                            │
│       ├── step change ──────┐                      │
│       ├── "Save Draft" btn ─┤                      │
│       └── page unload ──────┘                      │
│                            ▼                       │
│                     useIndexedDB                   │
│                          │                         │
│                          ▼                         │
│                   IndexedDB                        │
│              (kongu_profile_draft)                 │
│                                                    │
│  On mount: hydrate ← IndexedDB                     │
│  On change: persist → IndexedDB (selected events)  │
│  On publish success: clear IndexedDB               │
└───────────────────────────────────────────────────┘
```

### Persist Triggers

| Trigger | Description | Why |
|---|---|---|
| Step change + form is dirty | User moves between wizard steps | Captures progress after completing a step |
| "Save as Draft" button | Explicit user action | User wants to stop and come back later |
| `beforeunload` event | Page close/refresh | Last-resort save to prevent data loss |
| Per-field change | **NOT triggered** | Would be too slow (IndexedDB write per keystroke) |

### Lifecycle

1. **Mount**: `useIndexedDB.hydrate()` reads IndexedDB → data available as `ProfileDraft` → `draftToForm()` restores form state
2. **Editing**: Form state held in React state only. No IndexedDB writes during typing.
3. **Step change**: `persistDraft()` called → `formToDraft()` transforms form → `useIndexedDB.update()` → `persist()` → IndexedDB write
4. **Manual save**: Same as step change, plus calls `POST /profiles/draft` server API
5. **Page unload**: `beforeunload` handler → IndexedDB write (synchronous guard)
6. **Publish success**: `clearDraft()` → IndexedDB entry deleted
7. **New profile start**: No draft in IndexedDB → fresh `DEFAULT_FORM_DATA`

---

## Upload Lifecycle

```
File Upload
    │
    ▼
┌────────┐   POST /uploads
│  TEMP  │──────────────────→ Multer → ImagePipeline → StorageRepository.create()
└───┬────┘                        │                        │
    │                             │                        ▼
    │                             │              Upload row created
    │                             │              status = TEMP
    │                             │              objectKey = processed path
    │                             │              checksum = SHA-256
    │                             │
    │                             ▼
    │                    Temp file deleted
    │
    ├── Save Draft ───────────────────→ StorageService.bulkTransitionStatus(TEMP → DRAFT)
    │
    ├── Delete Upload ────────────────→ StorageService.delete()
    │                                      Hard delete file + row (only if not ACTIVE)
    │
    └── Publish ──────────────────────→ StorageService.bulkTransitionStatus(DRAFT → ACTIVE)
    │
    └── Delete Active ────────────────→ StorageService.bulkTransitionStatus(ACTIVE → DELETED)
    │
    └── Cleanup (24h) ────────────────→ Hard delete TEMP files + rows older than 24h
```

### Upload Validation

| Check | Rule |
|---|---|
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp` |
| Allowed extensions | `jpg`, `jpeg`, `png`, `webp` |
| Blocked extensions | `svg`, `html`, `htm`, `exe`, `bat`, `cmd`, `sh`, `js`, `zip` |
| Max file size | 5 MB |
| Multer storage | Disk (temp directory) |

### Image Pipeline

The `ImagePipelineService` processes uploaded images:
1. Validates image integrity
2. Resizes to configured dimensions (per category: profiles, gallery, horoscope)
3. Computes SHA-256 checksum of processed image
4. Generates objectKey (relative path within uploadDir)
5. Returns: mimeType, size, checksum, objectKey

---

## End-to-End Flow

### New Profile Creation

```
User                          Frontend                          Backend                      IndexedDB
 │                              │                                 │                            │
 ├─ Navigate to /new-profile ──→│                                 │                            │
 │                              ├─ hydrate() ────────────────────────────────────────────────→│
 │                              │←─ null (no draft) ──────────────────────────────────────────│
 │                              │                                 │                            │
 │  Fill Step 1 (Personal)      │                                 │                            │
 │◄═══════════════════════════►│ form state in React             │                            │
 │                              │                                 │                            │
 ├─ Click "Next" to Step 2 ───→│                                 │                            │
 │                              ├─ persistDraft() ──────────────────────────────────────────→│
 │                              │←─ saved ────────────────────────────────────────────────────│
 │                              │                                 │                            │
 │  Fill Steps 2-6            │                                 │                            │
 │◄═══════════════════════════►│ persistDraft on each step      │                            │
 │                              │                                 │                            │
 ├─ Upload Photo ──────────────→│ POST /uploads (FormData) ──────→│                            │
 │                              │                                 ├─ upload.single('file')      │
 │                              │                                 ├─ ImagePipeline.execute()     │
 │                              │                                 ├─ StorageRepository.create() │
 │                              │                                 │←─ { uploadId }              │
 │                              │←─ { uploadId } ─────────────────│                            │
 │                              │                                 │                            │
 ├─ Click "Save as Draft" ────→│                                 │                            │
 │                              ├─ formToDraft(formData)          │                            │
 │                              ├─ POST /profiles/draft ─────────→│                            │
 │                              │                                 ├─ repo.upsertProfile()      │
 │                              │                                 ├─ validate upload ownership │
 │                              │                                 ├─ $transaction: upsert all  │
 │                              │                                 │   sections                  │
 │                              │                                 ├─ bulkTransition(TEMP→DRAFT)│
 │                              │                                 │←─ { profileId }            │
 │                              │←─ { profileId } ───────────────│                            │
 │                              ├─ persistDraft() ──────────────────────────────────────────→│
 │                              │                                 │                            │
 │  Close browser mid-way      │                                 │                            │
 │                              ├─ beforeunload ────────────────────────────────────────────→│
 │                              │                                 │                            │
 │  Reopen /new-profile        │                                 │                            │
 │                              ├─ hydrate() ────────────────────────────────────────────────→│
 │                              │←─ draft data ───────────────────────────────────────────────│
 │                              ├─ draftToForm(draft)             │                            │
 │  Form restored!             │                                 │                            │
 │                              │                                 │                            │
 ├─ Navigate to                │                                 │                            │
 │  /new-profile?draft=123   │                                 │                            │
 │                              ├─ GET /profiles/draft/123 ──────→│                            │
 │                              │                                 ├─ load full profile         │
 │                              │                                 │←─ draft sections           │
 │                              │←─ sections ────────────────────│                            │
 │                              ├─ draftToForm(sections)          │                            │
 │  Server draft restored!    │                                 │                            │
 │                              │                                 │                            │
 ├─ Click "Create Profile"    │                                 │                            │
 │  (Step 7 Review)           │                                 │                            │
 │                              ├─ POST /profiles/publish ───────→│                            │
 │                              │                                 ├─ validate required fields  │
 │                              │                                 ├─ generateRegNo()           │
 │                              │                                 ├─ $transaction:             │
 │                              │                                 │   - check idempotency      │
 │                              │                                 │   - update→ACTIVE          │
 │                              │                                 │   - create PublishLog      │
 │                              │                                 │   - create state history   │
 │                              │                                 ├─ bulkTransition(DRAFT→ACTIVE)
 │                              │                                 │←─ { regNo, profileId }    │
 │                              │←─ { regNo, profileId } ────────│                            │
 │                              ├─ clear IndexedDB ──────────────────────────────────────────→│
 │                              │                                 │                            │
 │  Redirect to /my-profiles  │                                 │                            │
```

### Resume Flow (from MyProfiles)

```
User                          Frontend                      Backend
 │                              │                              │
 ├─ Click "Complete" on draft ─→│                              │
 │  (href: /new-profile?draft=X)│                              │
 │                              │                              │
 │  NewProfile mounts           │                              │
 │                              ├─ hydrate() from IndexedDB    │
 │                              ├─ read ?draft=X from query    │
 │                              ├─ GET /profiles/draft/X ─────→│
 │                              │                              ├─ findFirst(id, accountId, DRAFT)
 │                              │                              ├─ reverseMap all sections
 │                              │←─ sections data ────────────│
 │                              │                              │
 │                              ├─ draftToForm(sections)       │
 │                              ├─ setFormData(restored)       │
 │                              ├─ persistDraft() to IndexedDB │
 │  Form populated with saved data                            │
```

---

## Validation Rules

### Publish Validation (backend)

The `ProfileService.publish()` checks these prerequisites before allowing publish:

| Check | Error Code | Condition |
|---|---|---|
| Profile exists and is DRAFT | `PROFILE_NOT_FOUND` | `findFirst(id, accountId, DRAFT)` |
| Basic section exists | `PROFILE_MISSING_BASIC` | `profile.basic != null` |
| Community section exists | `PROFILE_MISSING_COMMUNITY` | `profile.community != null` |
| Primary photo uploaded | `PROFILE_MISSING_PHOTO` | `profile.photo?.primaryUploadId != null` |
| EN translation with firstName | `PROFILE_MISSING_DEFAULT_TRANSLATION` | `enTranslation?.firstName != null` |

### Upload Validation (backend)

| Check | Error | Filter |
|---|---|---|
| No file | `UPLOAD_INVALID_TYPE` | `!file` |
| File too large | `UPLOAD_TOO_LARGE` | `file.size > 5MB` |
| Blocked extension | `UPLOAD_INVALID_TYPE` | ext in `svg, html, htm, exe, bat, cmd, sh, js, zip` |
| Unsupported extension | `UPLOAD_INVALID_TYPE` | ext not in `jpg, jpeg, png, webp` |
| Unsupported MIME | `UPLOAD_INVALID_TYPE` | mime not in `image/jpeg, image/png, image/webp` |

### Ownership Validation

All draft/profile operations verify `req.account.sub` matches the resource owner:
- Profile owner → `profile.accountId === accountId`
- Upload owner → `upload.ownerAccountId === accountId`
- Upload ownership validated for all uploads referenced in a draft save

---

## Error Codes Reference

### Profile Error Codes

| HTTP | Code | When |
|---|---|---|
| 404 | `PROFILE_NOT_FOUND` | Draft or profile not found / not owned |
| 400 | `PROFILE_MISSING_BASIC` | Publish attempted without basic section |
| 400 | `PROFILE_MISSING_COMMUNITY` | Publish attempted without community section |
| 400 | `PROFILE_MISSING_PHOTO` | Publish attempted without primary photo |
| 400 | `PROFILE_MISSING_DEFAULT_TRANSLATION` | Publish attempted without EN firstName |
| 400 | `PROFILE_ALREADY_ACTIVE` | (reserved) |
| 403 | `AUTH_FORBIDDEN` | Upload ownership mismatch |
| 400 | `VALIDATION_ERROR` | Request body fails Zod schema |
| 429 | `RATE_LIMIT_EXCEEDED` | Publish rate limit hit (3/min) |

### Upload Error Codes

| HTTP | Code | When |
|---|---|---|
| 400 | `UPLOAD_INVALID_TYPE` | No file / blocked extension / unsupported MIME |
| 400 | `UPLOAD_TOO_LARGE` | File exceeds 5MB limit |
| 404 | `UPLOAD_NOT_FOUND` | Upload ID not found |
| 403 | `AUTH_FORBIDDEN` | Not the upload owner |
| 400 | `UPLOAD_ACTIVE` | Attempt to delete ACTIVE upload |
| 400 | `UPLOAD_DELETED` | Attempt to delete already-deleted upload |
| 400 | `UPLOAD_INVALID_STATUS` | Status transition mismatch (bulk ops) |
| 429 | `RATE_LIMIT_EXCEEDED` | Upload rate limit hit (10/min) |

---

## Module Architecture & File Map

### Backend Modules

```
modules/
├── profile/
│   ├── profile.routes.ts       # Route definitions (5 endpoints)
│   ├── profile.controller.ts   # Express request handlers
│   ├── profile.service.ts      # Business logic (saveDraft, resumeDraft, publish, delete)
│   ├── profile.repository.ts   # Prisma queries (upsertProfile, findFullById, etc.)
│   └── dto/
│       ├── save-draft.dto.ts   # Zod schema for draft save
│       └── publish.dto.ts      # Zod schema for publish
│
├── upload/
│   ├── upload.routes.ts        # Route definitions (POST/DELETE)
│   ├── upload.controller.ts    # Request handlers
│   ├── upload.service.ts       # Upload orchestration
│   ├── upload.validator.ts     # File validation (mime, extension, size)
│   └── public-id.helper.ts     # Short public ID generator
│
└── storage/
    ├── storage.service.ts      # Orchestration (createFromPipeline, delete, transition, bulk)
    ├── storage.repository.ts   # Upload row CRUD
    └── providers/
        ├── storage-provider.interface.ts  # IStorageProvider contract
        └── local-storage.service.ts       # Disk-based implementation
```

### Frontend Files

```
frontend/src/
├── api/
│   └── profile.api.ts          # 7 API client functions (uploadFile, deleteUpload, saveDraft, resumeDraft, publishProfile, deleteDraft, deleteProfile)
│
├── adapters/
│   └── profile.adapter.ts      # formToDraft() + draftToForm() transforms
│
├── lib/
│   └── indexeddb.ts            # IndexedDB wrapper (openDB, getDraft, saveDraft, clearDraft)
│
├── hooks/
│   ├── useIndexedDB.ts         # React hook (hydrate, persist, update, clear)
│   └── useProfileForm.ts       # Form state management + IndexedDB integration
│
└── components/features/user/
    └── NewProfile.tsx           # 7-step form wizard (1158+ lines)
```

### Cleanup Jobs

```
backend/src/jobs/
├── cleanup-temp-uploads.job.ts   # Hourly: TEMP > 24h, batch 100
└── cleanup-draft-profiles.job.ts  # Daily: DRAFT > 30d, batch 100
```

---

## Cleanup Jobs

### Temp Upload Cleanup (`cleanup-temp-uploads.job.ts`)

| Property | Value |
|---|---|
| Schedule | Every 60 minutes |
| Target | Uploads with `status = TEMP` AND `createdAt < 24h ago` AND `lastAccessedAt < 24h ago` |
| Batch Size | 100 rows |
| Action | Delete file from disk → delete DB row |
| Startup | Runs immediately on job initialization |

### Draft Profile Cleanup (`cleanup-draft-profiles.job.ts`)

| Property | Value |
|---|---|
| Schedule | Every 24 hours |
| Target | Profiles with `currentStatus = DRAFT` AND `updatedAt < 30 days ago` |
| Batch Size | 100 profiles |
| Action | For each draft: collect upload IDs → delete files from disk → transaction: delete upload rows + delete profile row (cascade deletes all sections) |
| Startup | Runs immediately on job initialization |

### Job Lifecycle

Both jobs:
- Use `setInterval` for scheduling (simple, no external scheduler)
- Listen for `SIGTERM` / `SIGINT` for graceful shutdown
- Log cleanup count via `logger.info()` (only when rows cleaned)
- Process in batches to avoid long-running transactions

---

## Known Gaps & Limitations

| Gap | Impact |
|---|---|
| **Current location not persisted** | `reverseMapBasic()` always sets location fields to `null`. Location data saved during saveDraft but not returned during resumeDraft. |
| **No "list my profiles" endpoint** | `GET /profiles/my` does not exist. MyProfiles page uses stub. |
| **No multi-draft support** | Repository uses `findFirst` — one draft + one active per account max. |
| **Query param mismatch** | MyProfiles links to `?id=` but NewProfile reads `?draft=` query parameter. |
| **No S3/R2/MinIO provider** | Only `LocalStorageService` implemented. |
| **No admin restore endpoint** | Soft-deleted profiles cannot be restored via API. |
| **No partial draft PATCH** | Draft updates always replace full sections (no partial field update). |
| **Translation Tamil fields not mapped** | `jobLocationTa`, `landTa`, etc. saved via API but set to null on resume. |
