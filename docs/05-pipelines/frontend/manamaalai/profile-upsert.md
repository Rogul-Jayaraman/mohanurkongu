# Pipeline 1: profile-upsert (Frontend)

> **For beginners**: Frontend side of creating/editing a profile. Manages
> the multi-step form, auto-saves drafts to IndexedDB, validates each step,
> and submits to the backend upsert pipeline.

## Purpose

Replaces the multi-step form orchestration in `NewProfile.tsx` (1414 lines). Manages the complete create/draft lifecycle: IndexedDB auto-persist, 7-step client-side validation wizard, image upload with compression, adapter transformations (form ProfileDraft), and dual submission paths (DRAFT save vs PENDING submit). Each step is a distinct function call in the orchestrator's event handler chain.

## Actor & Entry

| Route (Page) | URL Params | Role | Validation |
|---|---|---|---|
| `/manamaalai/new-profile` | `?draft=:id`, `?id=:id`, `?new` | USER | `profile-schema.ts` |

**Allowed Roles:** `USER` (via `ProtectedRoute`)

**Validation Schemas:**
- Step validation: `STEP_REQUIRED_FIELDS[1..7]` — each step has required fields
- Navigation validation: `validateStepAtNav(step, formData)` — per-step field checks
- Final validation: `validateCreate(formData)` — all 7 steps, returns flat errors

**Persistence:** IndexedDB store `kongu_profile_draft` key `profile_draft` (singleton key `current`)

## High-Level Architecture

```
  ┌─ /manamaalai/new-profile[?draft=:id|?id=:id|?new]
  │  ProtectedRoute → USER only
  ▼
  ┌──────────────────────────────────────────────────────────────────────────┐
  │  NewProfile.tsx (Orchestrator)                                            │
  │                                                                           │
  │  STATE: currentStep(1-7), touchedFields, stepErrors, fieldErrors,        │
  │         isSavingDraft, isSubmitting, isUploading                         │
  │  HOOKS: useProfileForm, useIndexedDB, useFileUpload                     │
  │  ADAPTER: formToDraft / draftToForm                                      │
  │                                                                           │
  │  ┌── onMount ───────────────────────────────────────────────────────┐   │
  │  │  S1. parseUrlParams                                                │   │
  │  │  S2. hydrateState (IndexedDB | server draft | defaults)           │   │
  │  └────────────────────────────────────────────────────────────────────┘   │
  │                                                                           │
  │  ┌── handleNext(currentStep) ──────────────────────────────────────┐    │
  │  │  S3. markTouched(STEP_REQUIRED_FIELDS[step])                     │    │
  │  │  S4. validateStepOnNav(step, formData) → { fieldErrors }        │    │
  │  │      ┌─ errors → setFieldErrors + toast(firstError) ───────────┐│    │
  │  │      └─ pass  → currentStep++ ─────────────────────────────────┘│    │
  │  └──────────────────────────────────────────────────────────────────┘    │
  │                                                                           │
  │  ┌── autoSave (useEffect on [currentStep, isDirty]) ───────────────┐    │
  │  │  S5. persistToIndexedDB                                           │    │
  │  │      formToDraft(formDataRef) → indexedDBStorage.saveDraft()     │    │
  │  └──────────────────────────────────────────────────────────────────┘    │
  │                                                                           │
  │  ┌── handleImageUpload(fieldName, file) ──────────────────────────┐     │
  │  │  S6. compressImage (1800px max, WebP Q85, ≤3MB)                │     │
  │  │  S7. uploadFile() → POST /uploads                              │     │
  │  │  S8. setFormData({ [fieldName + 'Id']: uploadId, url })        │     │
  │  └──────────────────────────────────────────────────────────────────┘     │
  │                                                                           │
  │  ┌── handleSaveDraft ─────────────────────────────────────────────┐     │
  │  │  S9.  formToDraft(formData) → ProfileDraft                      │     │
  │  │  S10. saveDraft(payload) → POST /profiles/draft                │     │
  │  │  S11. indexedDBStorage.clearDraft()                             │     │
  │  │  S12. navigate('/manamaalai/my-profiles')                       │     │
  │  │  └─ error → saveErrorMatrix                                   │     │
  │  └──────────────────────────────────────────────────────────────────┘     │
  │                                                                           │
  │  ┌── handleSubmit ────────────────────────────────────────────────┐     │
  │  │  S13. validateCreate(formData) → string[]                       │     │
  │  │  S14. if errors → setStepErrors, toast, return                  │     │
  │  │  S15. formToDraft(formData) → ProfileDraft                     │     │
  │  │  S16. createProfile({ ...draft, agreedToTerms })                │     │
  │  │       → POST /profiles/create                                   │     │
  │  │  S17. indexedDBStorage.clearDraft()                             │     │
  │  │  S18. navigate('/manamaalai/my-profiles')                       │     │
  │  │  └─ error → submitErrorMatrix                                  │     │
  │  └──────────────────────────────────────────────────────────────────┘     │
  │                                                                           │
  │  ┌── Step Components (presentational) ────────────────────────────┐     │
  │  │  Step1Personal → TextFields + Selects + DistrictPicker          │     │
  │  │  Step2Combined → CommunitySelect + CareerForm                   │     │
  │  │  Step3Family   → FatherSection + MotherSection + Siblings      │     │
  │  │  Step4Assets   → PropertyForm + PartnerPrefForm                │     │
  │  │  Step5Horoscope→ MethodSelector + AutoForm / UploadForm        │     │
  │  │  Step6Gallery  → UploadDropzone × 5                             │     │
  │  │  Step7Review   → Readonly summary + terms checkbox             │     │
  │  └──────────────────────────────────────────────────────────────────┘     │
  └──────────────────────────────────────────────────────────────────────────┘
                               │
                        Profile Created or Draft Saved
```

## Low-Level Architecture — Step by Step

---

### S1: parseUrlParams

```
====================================================================================
S1: parseUrlParams
────────────────────────────────────────────────────────────────────────────────────
Input: window.location.search

  const params = new URLSearchParams(window.location.search);
  const draftId = params.get('draft');    // IndexedDB key
  const serverId = params.get('id');      // Server draft ID
  const isNew = params.get('new');        // Force fresh form

  ┌──────────┬────────────────────────────────────────────┐
  │ Param    │ Behavior                                   │
  ├──────────┼────────────────────────────────────────────┤
  │ draft    │ Resume from IndexedDB draft by key         │
  │ id       │ Resume from server draft via resumeDraft() │
  │ new      │ Skip all restore, use DEFAULT_FORM_DATA    │
  │ none     │ Auto-restore from IndexedDB singleton      │
  └──────────┴────────────────────────────────────────────┘

Output: ctx = { restoreSource: 'indexeddb' | 'server' | 'fresh' | 'auto', restoreId?: string }
```

---

### S2: hydrateState

```
====================================================================================
S2: hydrateState
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.restoreSource, ctx.restoreId

  ┌─ restoreSource == 'indexeddb' ───────────────────────────────────────┐
  │  const draft = await indexedDBStorage.getDraft(restoreId);           │
  │  formData = { ...DEFAULT_FORM_DATA, ...draftToForm(draft) };         │
  └──────────────────────────────────────────────────────────────────────┘

  ┌─ restoreSource == 'server' ──────────────────────────────────────────┐
  │  try {                                                                │
  │    const response = await resumeDraft(serverId);                      │
  │    formData = { ...DEFAULT_FORM_DATA, ...draftToForm(response) };     │
  │  } catch {                                                            │
  │    console.error('Draft resume failed');                              │
  │    formData = DEFAULT_FORM_DATA;  // silent fallback                  │
  │  }                                                                    │
  └──────────────────────────────────────────────────────────────────────┘

  ┌─ restoreSource == 'auto' ───────────────────────────────────────────┐
  │  useProfileForm.useEffect auto-restores from IndexedDB singleton    │
  │  if draft found: formData = { ...DEFAULT_FORM_DATA,                  │
  │                                 ...draftToForm(draft) }              │
  └──────────────────────────────────────────────────────────────────────┘

  ┌─ restoreSource == 'fresh' ──────────────────────────────────────────┐
  │  formData = DEFAULT_FORM_DATA;                                       │
  └──────────────────────────────────────────────────────────────────────┘

Output: ctx.formData = merged form state ready for render
```

---

### S3: markTouched

```
====================================================================================
S3: markTouched
────────────────────────────────────────────────────────────────────────────────────
Input: currentStep, STEP_REQUIRED_FIELDS

  const newTouched = new Set(touchedFields);
  STEP_REQUIRED_FIELDS[currentStep].forEach(f => newTouched.add(f));
  setTouchedFields(newTouched);

  ┌──────────────────────────────────────────────────────────────────────┐
  │  Step 1: firstNameEn, lastNameEn, gender, dob, diet, height,        │
  │          weight, profileFor, maritalStatus, bloodGroup,             │
  │          currentDistrict, currentTaluk, nativeDistrict,             │
  │          nativeTaluk                                                │
  │  Step 2: kulam, kuladeivamEn (or kuladeivamTa)                     │
  │  Step 3: fatherNameEn, motherNameEn, noOfBrothers, noOfSisters     │
  │  Step 4: residence, ageMin, ageMax, heightMinId, heightMaxId       │
  │  Step 5: (horoscope mode-dependent)                                 │
  │  Step 6: (none — gallery optional)                                  │
  │  Step 7: agreedToTerms                                              │
  └──────────────────────────────────────────────────────────────────────┘

Output: touchedFields set triggers async field validation
```

---

### S4: validateStepOnNav

```
====================================================================================
S4: validateStepOnNav
────────────────────────────────────────────────────────────────────────────────────
Input: currentStep, formData

  const errors = validateStepAtNav(currentStep, formData);

  ┌──────────────────────────────────────────────────────────────────────┐
  │  Each field validated against Zod schema from profile-schema.ts:     │
  │  - firstNameEn: minLength(2), nameRegex (Latin chars only)          │
  │  - gender: must be valid GENDER enum                                │
  │  - dob: parseable ISO date, age computed 21-40                      │
  │  - diet: valid DIET enum                                            │
  │  - heightId: > 0 (0 = not specified, allowed)                       │
  │  - currentTaluk/nativeTaluk: if district is 'OTHER', switches to    │
  │    city/state/country validation instead                            │
  │  - Step 4: validates ageMin ≤ ageMax, heightMinId ≤ heightMaxId     │
  │  - Step 5: if horoscope.mode == 'GENERATED': star, rasi, lagnam    │
  │    required; if 'UPLOADED': chartUploadIds optional                 │
  └──────────────────────────────────────────────────────────────────────┘

  if (Object.keys(errors).length > 0) {
    setFieldErrors(errors);
    toast.error(t(Object.values(errors)[0]));  // show first error
    return false;  // do NOT advance
  }

  return true;  // advance step

Output: field errors set + toast shown, or step advanced
```

---

### S5: persistToIndexedDB (auto-save)

```
====================================================================================
S5: persistToIndexedDB
────────────────────────────────────────────────────────────────────────────────────
Trigger: useEffect on [currentStep, isDirty]
Guard: only when isDirty == true

  const draft = formToDraft(formDataRef.current);
  await indexedDBStorage.saveDraft(draft);
  indexedDBStorage.update(draft);  // sync in-memory copy

  ┌─ formToDraft transformation ──────────────────────────────────────────┐
  │  input: flat form shape (formData)                                     │
  │  output: nested ProfileDraft {                                         │
  │    basic: { profileFor, gender, dob, diet, bloodGroup, height,         │
  │             weight, complexion, maritalStatus,                         │
  │             currentDistrict, currentTaluk, currentCity,                │
  │             currentState, currentCountry, ... },                       │
  │    community: { community, caste, kulam },                             │
  │    professional: { education, jobSector, jobDetail, companyName,       │
  │                    jobLocation, monthlySalary },                       │
  │    family: { fatherAlive, fatherName, fatherJob, fatherSalary,        │
  │              motherAlive, motherName, motherJob, motherSalary,         │
  │              noOfBrother, noOfSister },                                │
  │    horoscope: { mode, rasi, nakshatra, lagna, rasiChartUploadId,     │
  │                 navamsaChartUploadId, horoscopeJson },                │
  │    photos: { primaryUploadId, primaryUploadUrl,                       │
  │              galleryUploadIds, galleryUploadUrls },                    │
  │    assets: { landEn, landTa, residenceType, otherAssetsEn,            │
  │              otherAssetsTa, vehicle },                                 │
  │    partnerPreference: { ageMin, ageMax, heightMinId, heightMaxId,     │
  │                         monthlySalary, expectationNoteEn,             │
  │                         preferredLocationEn, preferredLocationTa },   │
  │    translations: [                                                    │
  │      { language:'EN', firstName, lastName, kuladeivam,               │
  │        fatherName, motherName, jobLocation },                         │
  │      { language:'TA', firstName, lastName, kuladeivam,               │
  │        fatherName, motherName, jobLocation }                          │
  │    ],                                                                  │
  │    updatedAt: Date.now()                                              │
  │  }                                                                     │
  └───────────────────────────────────────────────────────────────────────┘

Output: IndexedDB updated silently
```

---

### S6: compressImage

```
====================================================================================
S6: compressImage
────────────────────────────────────────────────────────────────────────────────────
Input: file: File (from file input)

  ┌── Canvas resize pipeline ──────────────────────────────────────────┐
  │  const img = await loadImage(file);                                 │
  │  let { width, height } = img;                                       │
  │  if (width > 1800 || height > 1800) {                               │
  │    const ratio = Math.min(1800/width, 1800/height);                 │
  │    width *= ratio; height *= ratio;                                  │
  │  }                                                                   │
  │                                                                      │
  │  let quality = 0.85;                                                 │
  │  let blob: Blob | null = null;                                       │
  │  // Binary search quality(0.1-1.0) until size ≤ 3MB                 │
  │  for (let i = 0; i < 8; i++) {                                      │
  │    blob = await canvasToWebPBlob(canvas, quality);                   │
  │    if (blob.size <= 3 * 1024 * 1024) break;                         │
  │    quality -= 0.1;                                                   │
  │  }                                                                   │
  │                                                                      │
  │  Output: compressed = new File([blob], file.name, { type: 'webp' });│
  └──────────────────────────────────────────────────────────────────────┘

Output: compressed File object (WebP, ≤3MB, max 1800px)
```

---

### S7: uploadFile

```
====================================================================================
S7: uploadFile
────────────────────────────────────────────────────────────────────────────────────
Input: compressed File

  const formData = new FormData();
  formData.append('file', compressed);

  try {
    const { uploadId, url } = await uploadFile(formData);
    // POST /uploads (multipart/form-data)
  } catch (err) {
    ┌─ error matrix ───────────────────────────────────────────┐
    │  413 PayloadTooLarge → toast('Image too large, max 3MB') │
    │  Network 0           → toast('Upload failed, retry')     │
    └──────────────────────────────────────────────────────────┘
  }

Output: { uploadId: string, url: string }
```

---

### S8: updateFormState

```
====================================================================================
S8: updateFormState
────────────────────────────────────────────────────────────────────────────────────
Input: fieldName (e.g. 'primaryUpload'), uploadId, url

  setFormData(prev => ({
    ...prev,
    [fieldName + 'Id']: uploadId,
    [fieldName + 'Url']: url
  }));

  Supported field names: primaryUpload, rasiChartUpload,
  navamsaChartUpload, galleryUpload[]

Output: formData updated with upload reference
```

---

### S9: formToDraft

```
====================================================================================
S9: formToDraft
────────────────────────────────────────────────────────────────────────────────────
Input: formData (flat shape)

  Identical transformation to S5 (persistToIndexedDB → formToDraft).
  Produces the nested API payload shape ProfileDraft.

Output: ctx.profileDraft = nested object ready for API
```

---

### S10: saveDraft API

```
====================================================================================
S10: saveDraft API
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.profileDraft

  setSavingDraft(true);
  try {
    await saveDraft(profileDraft);
    // POST /profiles/draft
    // Backend: targetStatus = DRAFT, no duplicate check, no slot check
  } catch (err) {
    handleSaveError(err);
  } finally {
    setSavingDraft(false);
  }

  ┌─ saveError matrix ──────────────────────────────────────────────────┐
  │  400 VALIDATION_ERROR → toast(translateError(err))                  │
  │  401/403             → redirect to login (handled by axios interceptor) │
  │  NETWORK_ERROR       → toast('Save failed, please retry')           │
  │  default             → toast(getErrorMessage(err))                  │
  └──────────────────────────────────────────────────────────────────────┘

Output: Draft saved on server
```

---

### S11: clearIndexedDB

```
====================================================================================
S11: clearIndexedDB
────────────────────────────────────────────────────────────────────────────────────
  await indexedDBStorage.clearDraft();

Output: IndexedDB draft storage cleared (fresh state for next profile)
```

---

### S12: navigateToMyProfiles

```
====================================================================================
S12: navigateToMyProfiles
────────────────────────────────────────────────────────────────────────────────────
  navigate('/manamaalai/my-profiles');

Output: User redirected to profile list
```

---

### S13: validateCreate

```
====================================================================================
S13: validateCreate
────────────────────────────────────────────────────────────────────────────────────
Input: formData

  const allErrors: string[] = validateCreate(formData);
  // Runs validateStepAtNav for ALL 7 steps
  // Collects ALL errors into a flat array (not stopping at first)

  if (allErrors.length > 0) {
    setStepErrors(allErrors);
    toast.error(t(allErrors[0]));
    return false;  // abort submission
  }

  return true;  // proceed to submit

Output: boolean — pass or fail
```

---

### S14: createProfile API

```
====================================================================================
S14: createProfile API
────────────────────────────────────────────────────────────────────────────────────
Input: ctx.profileDraft + agreedToTerms

  setSubmitting(true);
  try {
    const payload = { ...profileDraft, agreedToTerms: formData.agreedToTerms };
    delete payload.updatedAt;  // adapter field, not sent to API
    await createProfile(payload);
    // POST /profiles/create
    // Backend: targetStatus = PENDING, duplicate check, slot check,
    //          regNo generation, upsertVerificationQueue
  } catch (err) {
    handleSubmitError(err);
  } finally {
    setSubmitting(false);
  }

  ┌─ submitError matrix ────────────────────────────────────────────────┐
  │  400 VALIDATION_ERROR →                                             │
  │    if err.details (array):                                           │
  │      for each { field, message }: setFieldErrors[field] = message    │
  │    else: toast('Please check your inputs')                           │
  │                                                                      │
  │  409 DUPLICATE_PROFILE →                                            │
  │    toast('A profile with your date of birth and gender already      │
  │           exists. You cannot create duplicates.')                    │
  │                                                                      │
  │  403 MEMBERSHIP_SLOT_LIMIT_REACHED →                                │
  │    toast.error('You have reached your profile slot limit.') +       │
  │    [Upgrade] → navigate('/manamaalai/plans')                        │
  │                                                                      │
  │  404 UPLOAD_NOT_FOUND →                                             │
  │    toast('Some uploads were not found. Please re-upload images.')   │
  │                                                                      │
  │  403 AUTH_FORBIDDEN (upload ownership) →                            │
  │    toast('Upload ownership error. Please re-upload.')               │
  │                                                                      │
  │  400 UPLOAD_INVALID_STATUS →                                        │
  │    toast('Some uploads are in an invalid state. Re-upload.')        │
  │                                                                      │
  │  NETWORK_ERROR → toast('Connection failed. Please try again.')      │
  │  default       → toast(getErrorMessage(err))                        │
  └──────────────────────────────────────────────────────────────────────┘

Output: Profile created (PENDING) or error displayed
```

---

### S15-S18: (same as S11-S12)

```
====================================================================================
S15: clearIndexedDB
S16: navigateToMyProfiles
────────────────────────────────────────────────────────────────────────────────────
  Same as S11-S12. IndexedDB cleared, user navigated to /my-profiles.
```

## Dependencies

| File | Role |
|---|---|
| `pages/user/NewProfile.tsx` | Route page (re-export) |
| `components/features/user/NewProfile.tsx` | Orchestrator component |
| `hooks/useProfileForm.ts` | Form state + IndexedDB restore |
| `adapters/profile.adapter.ts` | formToDraft, draftToForm |
| `validation/profile-schema.ts` | STEP_REQUIRED_FIELDS, validateStepAtNav, validateCreate |
| `api/profile.api.ts` | saveDraft, createProfile, resumeDraft, uploadFile |
| `lib/indexeddb.ts` | IndexedDB CRUD |
| `lib/errors.ts` | isAppError, getErrorMessage, translateError |
