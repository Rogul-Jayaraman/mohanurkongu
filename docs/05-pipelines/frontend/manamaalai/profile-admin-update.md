# Pipeline 7: profile-admin-update (Frontend)

> **For beginners**: Frontend side of admin editing a profile. Inline
> editing modals with validation and error handling.

## Purpose

Inline edit of a profile from the admin list detail panel. Admin modifies a subset of profile fields (PENDING status only) and submits a partial update. The editor opens as a modal over the detail panel.

## Actor & Entry

| Trigger | Source | Role | Validation |
|---|---|---|---|
| Click "Edit" in admin detail panel | Admin profile list detail | ADMIN | `profile.status === 'PENDING'` |

**Allowed Roles:** `ADMIN`

## High-Level Architecture

```
  ┌─ Admin detail panel → [Edit] button
  │  Guard: profile.status !== 'PENDING'
  │    └─ disabled with tooltip "Only PENDING profiles can be edited"
  ▼
  ┌───────────────────────────────────────────────────────────────────────┐
  │  AdminEditProfileModal.tsx                                             │
  │                                                                        │
  │  STATE: formData, saving, errors                                       │
  │  INPUT: profile (immutable reference)                                  │
  │                                                                        │
  │  ┌── onOpen ────────────────────────────────────────────────┐         │
  │  │  S1. transformProfileToForm(profile) → formData           │         │
  │  │  S2. render editable fields (subset: name, contact,       │         │
  │  │      community, status fields)                           │         │
  │  └───────────────────────────────────────────────────────────┘         │
  │                                                                        │
  │  ┌── handleSave ─────────────────────────────────────────────┐        │
  │  │  S3. validateEdit(formData) → errors[]                     │        │
  │  │  S4. buildPartialPayload(formData) → Partial<Profile>      │        │
  │  │  S5. adminUpdateProfile(profileId, payload)               │        │
  │  │      → PATCH /admin/profiles/:id                          │        │
  │  │  S6. onSuccessCallback (refresh list, close modal)        │        │
  │  │  S7. onError → errorModal                                 │        │
  │  └────────────────────────────────────────────────────────────┘        │
  └───────────────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture — Step by Step

---

### S1: transformProfileToForm

```
====================================================================================
S1: transformProfileToForm
────────────────────────────────────────────────────────────────────────────────────
Input: profile (from admin detail)

  formData = {
    firstNameEn: profile.translations.find(t => t.language === 'EN')?.firstName,
    lastNameEn: profile.translations.find(t => t.language === 'EN')?.lastName,
    mobile: profile.mobile,
    email: profile.email,
    communityName: profile.community?.name,
    casteName: profile.community?.caste?.name,
    // ... editable fields
  };

Output: formData (flat object for the modal form)
```

---

### S2: render editable fields

```
====================================================================================
S2: render editable fields
────────────────────────────────────────────────────────────────────────────────────
  Modal form sections:
  - Basic Info: firstName, lastName, gender, dob (locked, display only)
  - Contact: mobile, email
  - Community: community, caste (dropdowns)
  - Kula: kulam, kuladeivam (text inputs)

  Locked fields display as read-only text (not inputs).

Output: Editable form rendered in modal
```

---

### S3: validateEdit

```
====================================================================================
S3: validateEdit
────────────────────────────────────────────────────────────────────────────────────
  const errors = validateAdminEdit(formData);
  // Uses subset of profile-schema fields

  if (Object.keys(errors).length > 0) {
    setFieldErrors(errors);
    toast.error(t(Object.values(errors)[0]));
    return false;
  }
  return true;

Output: boolean pass/fail
```

---

### S4-S5: partial update

```
====================================================================================
S4: buildPartialPayload
S5: adminUpdateProfile API
────────────────────────────────────────────────────────────────────────────────────
Input: formData

  const payload = {
    translations: [
      { language: 'EN', firstName: formData.firstNameEn, lastName: formData.lastNameEn },
      { language: 'TA', firstName: formData.firstNameTa, lastName: formData.lastNameTa }
    ],
    mobile: formData.mobile,
    email: formData.email,
    communityId: formData.communityId,
    casteId: formData.casteId,
    kulam: formData.kulam,
    kuladeivamEn: formData.kuladeivamEn,
    kuladeivamTa: formData.kuladeivamTa,
  };

  setSaving(true);
  try {
    await adminUpdateProfile(profileId, payload);
    // PATCH /admin/profiles/:id
    // Backend: validates, updates, returns updated Profile
  } catch (err) {
    handleUpdateError(err);
  } finally {
    setSaving(false);
  }

  ┌─ updateError matrix ────────────────────────────────────────────────┐
  │  400 VALIDATION_ERROR → setFieldErrors(err.details)                 │
  │  400 PROFILE_NOT_PENDING → toast('This profile is no longer in     │
  │                            PENDING status and cannot be edited')    │
  │  404 NOT_FOUND → toast('Profile not found')                        │
  │  403 FORBIDDEN → toast('You do not have permission')               │
  │  NETWORK_ERROR → toast(getErrorMessage(err))                       │
  └──────────────────────────────────────────────────────────────────────┘

Output: Profile updated, modal closed, list refreshed
```

## Dependencies

| File | Role |
|---|---|
| `components/features/admin/AdminEditProfileModal.tsx` | Modal component |
| `api/verification.api.ts` | adminUpdateProfile |
| `validation/profile-schema.ts` | validateAdminEdit |
| `lib/errors.ts` | isAppError, getErrorMessage |
