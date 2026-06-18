# Profile Pipelines — Architecture Documentation

> **For beginners**: This page is the table of contents for all
> profile-related pipelines below. Each doc explains one operation
> (create profile, browse, shortlist, etc.) with diagrams and
> step-by-step details.

## Overview

This directory documents the pipeline architecture for all profile-related operations in Mohanurkongu. Each pipeline follows the composable-step pattern established in `backend/src/common/auth/` (PipelineRunner, typed PipelineContext, step functions).

## Pipeline Architecture

```
  Route  →  Controller  →  PipelineRunner.run(steps[], ctx)  →  Response
```

## Pipeline Index

| # | Pipeline | File | Replaces | Actor |
|---|----------|------|----------|-------|
| 1 | Profile Upsert | `profile-upsert.md` | `saveDraft()` + `createProfile()` | USER |
| 2 | Profile Draft | `profile-draft.md` | `resumeDraft()` + `deleteDraft()` | USER |
| 3 | Profile View | `profile-view.md` | `getProfile()` | USER/ADMIN |
| 4 | Profile Browse | `profile-browse.md` | `browseProfiles()` | USER |
| 5 | Profile Shortlist | `profile-shortlist.md` | `toggleShortlist()` + `fetchShortlisted()` | USER |
| 6 | Admin Profile List | `profile-admin-list.md` | `listProfiles()` | ADMIN |
| 7 | Admin Profile Update | `profile-admin-update.md` | `updateProfile()` | ADMIN |
| 8 | Admin Profile Archive | `profile-admin-archive.md` | `archiveProfile()` + `restoreProfile()` | ADMIN |
| 9 | Admin Profile Delete | `profile-admin-delete.md` | `deleteProfile()` | ADMIN |
| 10 | Verification Decision | `verification-decision.md` | `approveProfile()` + `rejectProfile()` | ADMIN |
| 11 | Verification Queue | `verification-queue.md` | `getQueue()` + `getStats()` | ADMIN |
| 12 | Profile Showcase | `profile-showcase.md` | `getShowcaseProfiles()` | PUBLIC (no auth) |
| 13 | My Profiles | `profile-my-profiles.md` | `getMyProfiles()` | USER |

## Composed Sub-Pipelines

| # | Sub-Pipeline | File | Used By |
|---|-------------|------|---------|
| A | Manage Profile Uploads | `subpipeline/manage-profile-uploads.md` | 2 (delete), 9, 10 |
| B | Record Admin Action | `subpipeline/record-admin-action.md` | 7, 8, 9, 10 |

## Shared Step Library

All pipelines reference steps from `backend/src/common/profile/steps/`. The shared step library includes:

| Step | Purpose | Used By Count |
|------|---------|---------------|
| permissionGate | Role × action policy check | 12 |
| resolveProfile | Load profile by ID (light or full JOIN) | 8 |
| validateIdFormat | UUID format validation | 1 |
| validateProfileData | Schema validation for upserts | 3 |
| checkDuplicate | Duplicate detection (gender + DOB) | 1 |
| checkProfileState | State machine transition validation | 7 |
| checkQueue | Verification queue entry validation | 2 |
| checkSelfApproval | Block self-approval | 1 |
| checkExistingShortlist | Shortlist dupe detection | 1 |
| membershipGate | Quota/capability checks (4 variants) | 4 |
| resolveUploadTokens | Upload token → UUID resolution | 3 |
| generateRegNo | Counter-based reg number generation | 1 |
| processImages | Photo/gallery association | 3 |
| writeSections | Profile section upserts (9 sub-tables) | 3 |
| createOrUpdateProfileRow | Profile row lifecycle | 1 |
| updateProfileStatus | Status-only UPDATE | 4 |
| deleteProfileCascade | 11-table CASCADE delete | 1 |
| softDelete | Status→DELETED soft delete | 1 |
| manageProfileUploads | Upload status transition management | 3 |
| recordAdminAction | History + review + audit combined | 5 |
| recordStateHistory | State transition logging | 7 |
| upsertVerificationQueue | Queue entry creation | 1 |
| updateQueue | Queue completion | 1 |
| sendNotifications | Email/push for verification actions | 4 |
| consumeOpenQuota | Profile view usage tracking | 1 |
| applyFieldGating | viewDetails tier field masking | 1 |
| fetchShortlistStatus | Bulk shortlist EXISTS check | 1 |
| formatProfileCard | Response shape (browse + shortlist) | 2 |
| formatMyProfileCard | My profiles card shape | 1 |
| formatAdminTable | Admin list row shape | 1 |
| formatQueueRows | Queue list row shape | 1 |
| formatShowcaseCards | Showcase card shape | 1 |
| clientFilter | Client-side text search | 1 |
| buildBrowseQuery | Browse SQL WHERE assembly | 1 |
| executeBrowseQuery | Cursor-based browse execution | 1 |
| buildListFilter | Admin list filter assembly | 1 |
| executeListQuery | Admin list query execution | 1 |
| executeMyProfilesQuery | Account-based profile list query | 1 |
| executeShowcaseQuery | Two parallel LIMIT-5 queries | 1 |
| executeQueueListQuery | Queue query + COUNT | 1 |
| executeStatsQuery | Stats aggregate query | 1 |
| setResponse | Standardized response formatting | 13 |
| toggleShortlistRow | Shortlist INSERT/DELETE | 1 |

## Transaction Boundaries

```
  PRE-TRANSACTION:   permissionGate, validateData, checkDuplicate,
                     checkState, membershipGate, resolveUploadTokens

  $transaction:      writeSections, processImages, manageProfileUploads,
                     recordAdminAction, recordStateHistory, updateQueue

  POST-TRANSACTION:  sendNotifications, setResponse
```

## Profile State Machine

```
     ┌──────────┐
     │  DRAFT   │ ◄── USER saves incomplete
     └────┬─────┘
          │ USER submits
          ▼
     ┌──────────┐
     │ PENDING  │ ◄── Awaits review
     └────┬─────┘
          │
     ┌────┴────┐
     │         │
     ▼         ▼
  ┌────────┐ ┌──────────┐
  │ ACTIVE │ │ REJECTED │ ◄── USER re-submits
  └───┬────┘ └──────────┘
      │ ADMIN archives
      ▼
  ┌──────────┐
  │ ARCHIVED │ ◄── ADMIN restores
  └────┬─────┘
       │ ADMIN deletes
       ▼
  ┌──────────┐
  │ DELETED  │
  └──────────┘
```
