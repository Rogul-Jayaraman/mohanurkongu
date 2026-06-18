# Frontend Profile Pipelines — Architecture Documentation

> **For beginners**: This page is the table of contents for all
> frontend profile pipelines below. Each doc mirrors a backend pipeline
> but shows the React side — components, forms, API calls, and caching.

## Overview

This directory documents the frontend pipeline architecture for all profile-related operations in Mohanurkongu. Each pipeline mirrors the structure of the backend pipeline docs (`../backend/manamaalai/`) but documents the **client-side flow**: component hierarchy, form-state initialization, client-side validation, adapter transformations, API calls, response handling, and error matrices.

## Architecture Layers

```
  Page (route entry)
    └─ Orchestrator Component (state machine)
         └─ Hooks (useProfileForm, useBrowseProfiles, etc.)
              └─ Adapters (formToDraft, draftToForm)
                   └─ API Layer (profile.api.ts, verification.api.ts)
                        └─ HTTP Client (api.ts, publicApi.ts)
                             └─ Axios (token injection + 401 retry)

  Error Handling: isAppError → isValidationError → fieldErrors / generalError / toast / upgrade CTA
  Persistence: IndexedDB (kongu_profile_draft) auto-save + restore
  Cancellation: AbortController for stale request handling
```

## Pipeline Index

| # | Pipeline | File | Replaces | Actor |
|---|----------|------|----------|-------|
| 1 | Profile Upsert | `profile-upsert.md` | `NewProfile.tsx` multi-step form orchestration | USER |
| 2 | Profile Draft | `profile-draft.md` | `resumeDraft()` + `deleteDraft()` UX | USER |
| 3 | Profile View | `profile-view.md` | `ProfileView.tsx` + field gating | USER |
| 4 | Profile Browse | `profile-browse.md` | `BrowseProfiles.tsx` + `useBrowseProfiles` | USER |
| 5 | Profile Shortlist | `profile-shortlist.md` | `Shortlist.tsx` + inline toggle | USER |
| 6 | Admin Profile List | `profile-admin-list.md` | `ProfileManagement.tsx` + `Admin ProfileView.tsx` | ADMIN |
| 7 | Admin Profile Update | `profile-admin-update.md` | `SectionEditModal` inline editing | ADMIN |
| 8 | Admin Profile Archive | `profile-admin-archive.md` | Archive/restore actions | ADMIN only |
| 9 | Admin Profile Delete | `profile-admin-delete.md` | Delete profile action | ADMIN only |
| 10 | Verification Decision | `verification-decision.md` | Approve/reject actions | ADMIN |
| 11 | Verification Queue | `verification-queue.md` | `ProfileVerification.tsx` + stats | ADMIN |
| 12 | Profile Showcase | `profile-showcase.md` | `MatrimonialProfiles` + `Dashboard` | PUBLIC / USER |
| 13 | My Profiles | `profile-my-profiles.md` | `MyProfiles.tsx` | USER |

## Shared Hook & Component Library

| Hook / Component | File | Purpose | Used By Pipelines |
|---|---|---|---|
| `useProfileForm` | `hooks/useProfileForm.ts` | Form state + IndexedDB restore + field update + auto-save | 1, 2 |
| `formToDraft` | `adapters/profile.adapter.ts` | Flat form → nested ProfileDraft | 1 |
| `draftToForm` | `adapters/profile.adapter.ts` | Nested ProfileDraft → flat form | 1, 2 |
| `validateStepAtNav` | `validation/profile-schema.ts` | Per-step field validation | 1 |
| `validateCreate` | `validation/profile-schema.ts` | All-steps final validation | 1 |
| `useBrowseProfiles` | `hooks/useProfileBrowse.ts` | Cursor pagination + AbortController + filter normalization | 4, 12 |
| `useToggleShortlist` | inline in BrowseProfiles | Optimistic toggle + revert on error | 5 |
| `isAppError` | `lib/errors.ts` | Type guard for AppError instances | ALL |
| `isValidationError` | `lib/errors.ts` | Type guard for VALIDATION_ERROR code | ALL |
| `getErrorMessage` | `lib/errors.ts` | Extract user-facing error text | ALL |
| `translateError` | `hooks/useTranslations` | Error code → i18n string | ALL |
| `ProtectedRoute` | `components/features/auth/ProtectedRoute.tsx` | Role-based route guarding | ALL |
| `ImageUploadDropzone` | inline in NewProfile | Compress + upload + set uploadId/Url | 1 |
| `AbortController` | built-in | Stale request cancellation | 4, 12 |

## Error Handling Pattern

```
  backend error response → axios interceptor → AppError(status, code, message, details)
                                                      │
                                  ┌─────────────────────┼─────────────────────┐
                                  ▼                     ▼                     ▼
                          isValidationError()    isAppError()           fallback
                                  │                     │                     │
                                  ▼                     ▼                     ▼
                          setFieldErrors()      translateError()      getErrorMessage()
                          per-field display     generalError state    toast fallback
```

## Generic Frontend State Machine

```
                    ┌──────────┐
                    │  IDLE    │ ◄── initial mount / reset
                    └────┬─────┘
                         │ user action
                         ▼
                  ┌──────────────┐
                  │  VALIDATING  │ ◄── validateStep or validateCreate
                  └──────┬───────┘
                   ┌─────┴──────┐
                   ▼            ▼
            ┌──────────┐  ┌─────────┐
            │ SUBMIT   │  │  ERROR  │ ◄── fieldErrors / validation toast
            │ TING     │  └─────────┘
            └────┬─────┘       │ retry
                 │ API call    ▼
                 ▼        ┌──────────┐
            ┌──────────┐  │VALIDATING│
            │ SUCCESS  │  │ (re-run) │
            │          │  └──────────┘
            │ navigate │
            │ or refetch│
            └──────────┘
```

## Error Code → Frontend UX Mapping

Backend error codes that each pipeline must handle on the frontend:

| Error Code | Pipeline(s) | Frontend UX |
|---|---|---|
| `VALIDATION_ERROR` | 1, 7 | `setFieldErrors` per-field (if `details[]` present) or toast |
| `DUPLICATE_PROFILE` | 1 | Toast: 'A profile with your DOB and gender already exists' |
| `MEMBERSHIP_SLOT_LIMIT` | 1 | Toast + [Upgrade] button |
| `UPLOAD_NOT_FOUND` | 1 | Toast + re-upload prompt |
| `UPLOAD_INVALID_STATUS` | 1 | Toast + re-upload prompt |
| `MEMBERSHIP_QUOTA_EXCEEDED` | 3 | UpgradeCTA banner + [Upgrade Now] button |
| `MEMBERSHIP_SEARCH_LEVEL` | 4 | ErrorState + [Upgrade] CTA when search level insufficient |
| `CANNOT_SHORTLIST_OWN` | 5 | Toast: 'You cannot shortlist your own profile' |
| `PROFILE_NOT_ACTIVE` | 5 | Toast: 'This profile is no longer available' |
| `MEMBERSHIP_SHORTLIST_LIMIT` | 5 | Toast + [Upgrade] CTA |
| `PROFILE_WRONG_STATUS` | 2, 8, 9 | Toast: status-specific message |
| `PROFILE_NOT_PENDING` | 7, 10 | Toast: 'Profile is no longer under review' |
| `QUEUE_ALREADY_PROCESSED` | 10 | Toast + refetch (another admin already reviewed) |
| `CANNOT_APPROVE_SELF` | 10 | Toast: 'You cannot approve your own profile' |
| `PROFILE_NOT_FOUND` | 2, 3, 6, 7, 8, 9, 10 | FullScreenError or silent filter-out |

## Relevant Files

| File | Role |
|---|---|
| `frontend/src/hooks/useProfileForm.ts` | Central form state + IndexedDB |
| `frontend/src/hooks/useProfileBrowse.ts` | Browse pagination + abort |
| `frontend/src/adapters/profile.adapter.ts` | Form↔Draft DTO transformations |
| `frontend/src/validation/profile-schema.ts` | Zod schemas + step validation |
| `frontend/src/api/profile.api.ts` | User-facing profile API wrappers |
| `frontend/src/api/verification.api.ts` | Admin verification API wrappers |
| `frontend/src/lib/api.ts` | Axios instance + 401 retry |
| `frontend/src/lib/errors.ts` | AppError, type guards, error helpers |
| `frontend/src/lib/indexeddb.ts` | IndexedDB draft persistence |
| `frontend/src/types/profile.ts` | Profile, ProfileCard, BrowseParams types |
