# Pipeline Index

> **For beginners**: This page is the master catalog of all 61 pipeline
> documentation files. Each pipeline doc explains one specific operation
> (login, create booking, edit profile, etc.) step by step. If you're
> new, start with the **Where to Start** table below.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PIPELINE CATALOG (61 files)                         │
│                                                                             │
│   ┌─────────────────┬──────────────────┬──────────────────┬────────────────┐│
│   │ BACKEND AUTH    │ BACKEND MANDAPAM │ BACKEND MANAMA-  │ FRONTEND       ││
│   │ (9 files)       │ (12 files)       │ LAI (17 files)   │ (23 files)     ││
│   ├─────────────────┼──────────────────┼──────────────────┼────────────────┤│
│   │ login           │ booking-create   │ profile-upsert   │ auth-arch      ││
│   │ register        │ booking-status   │ profile-draft    │ (1 doc)        ││
│   │ otp             │ booking-settle   │ profile-view     │                ││
│   │ refresh         │ booking-addon    │ profile-browse   │ manamaalai     ││
│   │ reset-password  │ booking-list     │ profile-shortlist│ (14 files)     ││
│   │ change-password │ fin-transaction  │ profile-admin-*  │                ││
│   │ membership      │ calendar-view    │ (list/update/    │ mandapam       ││
│   │                 │ calendar-block   │  archive/delete) │ (8 files)      ││
│   │                 │ catalog-entity   │ verification-*   │                ││
│   │                 │ package-update   │ (decision/queue) │                ││
│   │                 │ token-validate   │ profile-showcase │                ││
│   │                 │                  │ my-profiles      │                ││
│   │                 │                  │ subpipeline/ (2) │                ││
│   └─────────────────┴──────────────────┴──────────────────┴────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## What is a Pipeline?

A **pipeline** is a step-by-step walkthrough of what happens when a user
does something. Think of it as a recipe:

```
User clicks "Login"
        │
        ▼
   ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
   │ Validate  │ ──► │ Check    │ ──► │ Generate │ ──► │ Send     │
   │ input     │     │ password │     │ tokens   │     │ response │
   └──────────┘     └──────────┘     └──────────┘     └──────────┘
```

Each step shows:
- **What** happens (validation, DB query, external API call)
- **Errors** that can occur (wrong password, expired token, duplicate data)
- **Business rules** applied (rate limits, membership gates, soft deletes)

## Where to Start

| You want to... | Start here |
|---|---|
| See how auth works (login, register, OTP) | [`backend/auth/`](backend/auth/README.md) |
| See how hall booking works (create, list, settle) | [`backend/mandapam/`](backend/mandapam/README.md) |
| See how matrimony profiles work (upsert, browse, verify) | [`backend/manamaalai/`](backend/manamaalai/README.md) |
| See frontend (React) pages for profiles | [`frontend/manamaalai/`](frontend/manamaalai/README.md) |
| See frontend pages for hall booking | [`frontend/mandapam/`](frontend/mandapam/README.md) |
| Understand the big picture architecture | [`03-03-PIPELINE_ARCHITECTURE.md`](../03-architecture/03-03-PIPELINE_ARCHITECTURE.md) |
| Understand business rules (membership, lifecycle) | [`06-` Business Logic docs](../06-business-logic/) |
| Add a new pipeline to the codebase | [`04-04-HOW_TO_ADD_A_PIPELINE.md`](../04-development/04-04-HOW_TO_ADD_A_PIPELINE.md) |

## Complete File Catalog

### Backend Auth (9 files)

Files: `backend/auth/`

| File | Description |
|------|-------------|
| [login-pipeline.md](backend/auth/login-pipeline.md) | Log in with email + password, returns tokens |
| [register-pipeline.md](backend/auth/register-pipeline.md) | Create a new account with profile basics |
| [otp-pipeline.md](backend/auth/otp-pipeline.md) | Send & verify OTP for email/phone confirmation |
| [refresh-pipeline.md](backend/auth/refresh-pipeline.md) | Refresh expired access tokens |
| [reset-password-pipeline.md](backend/auth/reset-password-pipeline.md) | Reset forgotten password via email |
| [change-password-pipeline.md](backend/auth/change-password-pipeline.md) | Change password while logged in |
| [membership-pipeline.md](backend/auth/membership-pipeline.md) | Upgrade/downgrade/view membership plan |
| [implementation-plan.md](backend/auth/implementation-plan.md) | Planning doc — auth refactor architecture |
| [README.md](backend/auth/README.md) | Group index with pipeline table |

### Backend Mandapam (12 files)

Files: `backend/mandapam/`

| File | Description |
|------|-------------|
| [booking-create-pipeline.md](backend/mandapam/booking-create-pipeline.md) | Create a hall booking (12+ steps) |
| [booking-status-pipeline.md](backend/mandapam/booking-status-pipeline.md) | Update booking status (confirm/cancel/complete) |
| [booking-settlement-pipeline.md](backend/mandapam/booking-settlement-pipeline.md) | Financial settlement flow |
| [booking-addon-pipeline.md](backend/mandapam/booking-addon-pipeline.md) | Add/remove add-on services to a booking |
| [booking-list-pipeline.md](backend/mandapam/booking-list-pipeline.md) | List bookings with filters and pagination |
| [calendar-view-pipeline.md](backend/mandapam/calendar-view-pipeline.md) | View hall availability calendar |
| [calendar-block-pipeline.md](backend/mandapam/calendar-block-pipeline.md) | Block/unblock dates on calendar |
| [catalog-entity-pipeline.md](backend/mandapam/catalog-entity-pipeline.md) | Browse hall/showcase catalog |
| [financial-transaction-pipeline.md](backend/mandapam/financial-transaction-pipeline.md) | Record financial transactions |
| [package-update-pipeline.md](backend/mandapam/package-update-pipeline.md) | Update hall pricing packages |
| [token-validate-pipeline.md](backend/mandapam/token-validate-pipeline.md) | Validate booking tokens for offline access |
| [README.md](backend/mandapam/README.md) | Group index with pipeline table |

### Backend Manamaalai (15 pipeline docs + 2 subpipelines + 1 impl plan + 1 README = 19 files)

Files: `backend/manamaalai/`

#### Core Profile Pipelines

| File | Description |
|------|-------------|
| [profile-upsert.md](backend/manamaalai/profile-upsert.md) | Create/update profile (17 steps, the biggest one) |
| [profile-draft.md](backend/manamaalai/profile-draft.md) | Resume or delete a saved draft |
| [profile-view.md](backend/manamaalai/profile-view.md) | View a profile (field-gated by membership) |
| [profile-browse.md](backend/manamaalai/profile-browse.md) | Search profiles with filters |
| [profile-shortlist.md](backend/manamaalai/profile-shortlist.md) | Add/remove shortlisted profiles |
| [profile-my-profiles.md](backend/manamaalai/profile-my-profiles.md) | List own profiles with status |
| [profile-showcase.md](backend/manamaalai/profile-showcase.md) | Landing page featured profiles |

#### Admin Pipelines

| File | Description |
|------|-------------|
| [profile-admin-list.md](backend/manamaalai/profile-admin-list.md) | Admin view all profiles |
| [profile-admin-update.md](backend/manamaalai/profile-admin-update.md) | Admin edit any profile field |
| [profile-admin-archive.md](backend/manamaalai/profile-admin-archive.md) | Admin archive/restore profiles |
| [profile-admin-delete.md](backend/manamaalai/profile-admin-delete.md) | Admin soft-delete profiles |

#### Verification Pipelines

| File | Description |
|------|-------------|
| [verification-queue.md](backend/manamaalai/verification-queue.md) | View profiles awaiting review |
| [verification-decision.md](backend/manamaalai/verification-decision.md) | Approve or reject a profile |

#### Supporting Files

| File | Description |
|------|-------------|
| [subpipeline/manage-profile-uploads.md](backend/manamaalai/subpipeline/manage-profile-uploads.md) | Shared upload cleanup logic |
| [subpipeline/record-admin-action.md](backend/manamaalai/subpipeline/record-admin-action.md) | Shared audit trail logic |
| [implementation-plan.md](backend/manamaalai/implementation-plan.md) | Planning doc — profile refactor architecture |
| [README.md](backend/manamaalai/README.md) | Group index with pipeline table |

### Frontend Auth (1 file)

| File | Description |
|------|-------------|
| [frontend-architecture.md](frontend/auth/frontend-architecture.md) | All auth frontend flows (login/register/OTP UI) |

### Frontend Manamaalai (14 files)

Files: `frontend/manamaalai/`

Each mirrors a backend profile pipeline on the React side.

| File | Description |
|------|-------------|
| [profile-upsert.md](frontend/manamaalai/profile-upsert.md) | Multi-step profile form with IndexedDB draft save |
| [profile-draft.md](frontend/manamaalai/profile-draft.md) | Resume/delete draft UI |
| [profile-view.md](frontend/manamaalai/profile-view.md) | Profile detail page rendering |
| [profile-browse.md](frontend/manamaalai/profile-browse.md) | Search results with infinite scroll |
| [profile-shortlist.md](frontend/manamaalai/profile-shortlist.md) | Shortlist toggle with optimistic UI |
| [profile-my-profiles.md](frontend/manamaalai/profile-my-profiles.md) | My Profiles page with status badges |
| [profile-showcase.md](frontend/manamaalai/profile-showcase.md) | Landing page featured profiles |
| [profile-admin-list.md](frontend/manamaalai/profile-admin-list.md) | Admin profile table UI |
| [profile-admin-update.md](frontend/manamaalai/profile-admin-update.md) | Admin inline editing modals |
| [profile-admin-archive.md](frontend/manamaalai/profile-admin-archive.md) | Admin archive/restore UI |
| [profile-admin-delete.md](frontend/manamaalai/profile-admin-delete.md) | Admin delete confirmation flow |
| [verification-queue.md](frontend/manamaalai/verification-queue.md) | Verification queue page UI |
| [verification-decision.md](frontend/manamaalai/verification-decision.md) | Approve/reject action UI |
| [README.md](frontend/manamaalai/README.md) | Group index |

### Frontend Mandapam (8 files)

Files: `frontend/mandapam/`

Each mirrors a backend maaligai pipeline on the React side.

| File | Description |
|------|-------------|
| [booking-create-pipeline.md](frontend/mandapam/booking-create-pipeline.md) | Booking creation multi-step form |
| [booking-list-pipeline.md](frontend/mandapam/booking-list-pipeline.md) | Booking list with filters |
| [booking-read-pipeline.md](frontend/mandapam/booking-read-pipeline.md) | Single booking detail view |
| [booking-write-pipeline.md](frontend/mandapam/booking-write-pipeline.md) | Edit/cancel booking UI |
| [calendar-pipeline.md](frontend/mandapam/calendar-pipeline.md) | Availability calendar grid |
| [package-pipeline.md](frontend/mandapam/package-pipeline.md) | Package selection UI |
| [catalog-entity-pipeline.md](frontend/mandapam/catalog-entity-pipeline.md) | Hall catalog browsing UI |
| [README.md](frontend/mandapam/README.md) | Group index |

---

## Pipeline Naming Convention

File names vary by subdirectory to match original developer conventions:

| Subdirectory | Pattern | Example |
|---|---|---|
| `backend/auth/` | `*-pipeline.md` | `login-pipeline.md` |
| `backend/mandapam/` | `*-pipeline.md` | `booking-create-pipeline.md` |
| `backend/manamaalai/` | `*.md` | `profile-upsert.md` |
| `frontend/auth/` | `frontend-architecture.md` | one file |
| `frontend/manamaalai/` | `*.md` | `profile-upsert.md` |
| `frontend/mandapam/` | `*-pipeline.md` | `calendar-pipeline.md` |
