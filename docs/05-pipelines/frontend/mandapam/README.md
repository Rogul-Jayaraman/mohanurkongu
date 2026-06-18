# Frontend Mandapam Pipelines — Architecture Documentation

> **For beginners**: This page is the table of contents for all frontend
> hall-booking pipelines below. Each doc mirrors a backend pipeline
> but shows the React UI components and API interactions.

## Overview

This directory documents the frontend pipeline architecture for all mandapam (hall booking) operations in Mohanurkongu. Each pipeline mirrors the **backend pipeline** (`../backend/mandapam/`) but documents the **client-side flow**: component hierarchy, React Query integration, API call orchestration, response transformation, cache invalidation, and error handling.

The architecture eliminates manual `useState` + `useEffect` patterns across 15+ components by introducing a **7-pipeline layer** that delegates to shared steps, which are consumed by React Query hooks.

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 1: Pages (React Router Routes)                                   │
│                                                                         │
│  Admin:                                                                  │
│  /admin/mandapam/bookings        → BookingManagement                    │
│  /admin/mandapam/new-booking     → NewBooking (shared with user)        │
│  /admin/mandapam/packages        → PackageManagement                    │
│  /admin/mandapam/calendar        → HallAvailability (admin)             │
│  /admin/mandapam/facilities      → FacilityGrid                        │
│  /admin/mandapam/addons          → AddonGrid                           │
│                                                                         │
│  Public:                                                                 │
│  /maaligai/packages              → Packages (public)                    │
│  /maaligai/availability          → HallAvailability (public)            │
│  /manamaalai/mandapam/book       → NewBooking (shared form)             │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │ composes
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 2: Feature Components & Modals (15+ files)                       │
│                                                                         │
│  BookingManagement.tsx    (279 lines)   ActionPanel.tsx    (594 lines) │
│  BookingsTable.tsx        (290 lines)   HallAvailability   (297 lines) │
│  BookingModal.tsx         (812 lines)   Packages.tsx       (421 lines) │
│  PackageManagement.tsx    (280 lines)   NewBooking.tsx     (627 lines) │
│  FacilityGrid/FacilityModal            AddonGrid/AddonModal            │
│  AddPaymentModal (252L)  CompleteBookingModal (270L)                   │
│  CancelRefundModal (277L)  ViewBookingModal (276L)  BlockDatesModal    │
│  useBookingForm.ts (168L)                                              │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │ consumes
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 3: React Query Hooks                                             │
│                                                                         │
│  useMandapamQueries.ts      — 13 useQuery wrappers                      │
│    (useBookingList, useBooking, useAdminPackages, useFacilities,        │
│     useAddons, useAdminCalendar, useCalendarDay, usePublicCalendar,     │
│     usePublicPackages, usePublicFacilities, usePublicAddons,            │
│     useTokenValidation)                                                 │
│                                                                         │
│  useMandapamMutations.ts    — 12 useMutation wrappers                   │
│    (useCreateBooking, useUpdateStatus, useAddPayment, useAddRefund,    │
│     useSettlementAction, useAttachAddon, useDetachAddon,               │
│     useBlockDates, useUnblockDates, useUpdatePackage,                   │
│     useDeletePackageFunction, useCreateFacility, ...)                   │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │ delegates to
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 4: Pipeline Layer (7 files, 30 exports)                          │
│                                                                         │
│  Each pipeline is an async function that calls runSteps(steps, ctx)     │
│  following the canonical PipelineRunner pattern from lib/pipeline/.     │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  booking-create.pipeline.ts     1 export (complex write)        │   │
│  │  booking-list.pipeline.ts       1 export (paginated read)       │   │
│  │  booking-read.pipeline.ts       2 exports (simple read)         │   │
│  │  booking-write.pipeline.ts      6 exports (simple write)        │   │
│  │  calendar.pipeline.ts           5 exports (mixed read+write)    │   │
│  │  package.pipeline.ts            5 exports (mixed read+write)    │   │
│  │  catalog-entity.pipeline.ts    10 exports (mixed read+write)    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │ calls
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  LAYER 5: API Layer (mandapam.api.ts)                                   │
│                                                                         │
│  20 HTTP functions organized by domain:                                 │
│    Admin Packages (4): adminGetAllPackages, adminGetPackageById,        │
│                       adminUpdatePackage, adminDeletePackageFunction    │
│    Admin Facilities (4): adminGetAllFacilities, adminCreateFacility,   │
│                          adminUpdateFacility, adminDeleteFacility      │
│    Admin Addons (4):    adminGetAllAddons, adminCreateAddon,           │
│                         adminUpdateAddon, adminDeleteAddon             │
│    Public (5):          getPublicCatalog, getPublicPackages,           │
│                         getPublicFacilities, getPublicAddons,          │
│                         getPublicCalendar                              │
│    Bookings (10):       adminListBookings, adminGetBooking,            │
│                         adminCreateBooking, adminUpdateBookingStatus,  │
│                         adminAddPayment, adminAddRefund,               │
│                         adminAddAddon, adminRemoveAddon,               │
│                         adminSettlementAction, adminValidateToken      │
│    Calendar (4):        adminGetCalendar, adminGetCalendarDay,         │
│                         adminBlockDates, adminUnblockDates             │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │ sends HTTP via
                            ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  LAYER 6: API Client (lib/api.ts + lib/publicApi.ts)                    │
  │                                                                         │
  │  api.ts (admin):     axios instance with Bearer token + 401 retry      │
  │  publicApi.ts:        axios instance without auth (for public routes)   │
  │                                                                         │
  │  Response unwrap pattern (both):                                        │
  │    Backend: { success: true, data: { ... } }                            │
  │    Interceptor returns: body.data → { ... }                             │
  │                                                                         │
  │  Error handling:                                                        │
  │    publicApi.ts interceptor now throws AppError (status, code, message) │
  │    instead of a plain Error with extra properties — compatible with     │
  │    isAppError() / getErrorMessage() in lib/errors.ts                   │
  └─────────────────────────────────────────────────────────────────────────┘
```

## Pipeline Index

| # | Pipeline File | Exports | Backend Mirror | Flow Type | Complexity |
|---|---|---|---|---|---|
| 1 | `booking-create-pipeline.md` | `bookingCreatePipeline(dto)` | `bookingCreatePipeline` | Complex (validate→api→transform) | **HIGH** |
| 2 | `booking-list-pipeline.md` | `listBookingsPipeline(filters)` | `bookingListPipeline` | Paginated read | MEDIUM |
| 3 | `booking-read-pipeline.md` | `getBookingPipeline(id)`, `validateTokenPipeline(token)` | `bookingGetPipeline` + `tokenValidatePipeline` | Simple read | LOW |
| 4 | `booking-write-pipeline.md` | `bookingStatusPipeline`, `settlementPipeline`, `paymentPipeline`, `refundPipeline`, `attachAddonPipeline`, `detachAddonPipeline` | `bookingStatus` + `bookingSettlement` + `financialTransaction` + `bookingAddon` | Simple write (dispatch) | LOW |
| 5 | `calendar-pipeline.md` | `getAdminCalendarPipeline`, `getAdminCalendarDayPipeline`, `getPublicCalendarPipeline`, `blockDatesPipeline`, `unblockDatesPipeline` | `calendarView` + `calendarDay` + `calendarPublic` + `calendarBlock` | Mixed read+write | LOW |
| 6 | `package-pipeline.md` | `listAdminPackagesPipeline`, `getAdminPackagePipeline`, `listPublicPackagesPipeline`, `updatePackagePipeline`, `deleteFunctionPipeline` | controller handlers + `packageUpdate` + `packageDeleteFunction` | Mixed read+write | LOW |
| 7 | `catalog-entity-pipeline.md` | `listFacilities`, `createFacility`, `updateFacility`, `deleteFacility`, `listPublicFacilities`, `listAddons`, `createAddon`, `updateAddon`, `deleteAddon`, `listPublicAddons` | `catalogEntityPipeline` | Mixed CRUD (2 entities) | LOW |

## Pipeline Context Types

```typescript
// context.types.ts
import type { PipelineContext } from '@/lib/pipeline/types';
import type {
  Booking, MandapamPackage, MandapamFacility,
  MandapamAddon, CalendarEntry
} from '@/types/mandapam';

export interface MandapamFrontendContext extends PipelineContext {
  id?: string;
  booking?: Booking;
  packages?: MandapamPackage[];
  package?: MandapamPackage;
  facilities?: MandapamFacility[];
  facility?: MandapamFacility;
  addons?: MandapamAddon[];
  addon?: MandapamAddon;
  calendarEntries?: CalendarEntry[];
  calendarDay?: unknown;
  valid?: boolean;
  availableTokens?: number;
  deleted?: boolean;
  meta?: { total: number; page: number; limit: number; totalPages: number };
}
```

## Shared Step Library

| Step | Purpose | Used By |
|---|---|---|
| `execute-api.step.ts` | Calls an API function, wraps response into context | ALL |
| `handle-error.step.ts` | Catches AppError, converts to PipelineAbortError + toast | ALL |
| `invalidate-cache.step.ts` | Invalidates React Query cache keys after mutations | booking-write, calendar, package, catalog-entity |

## Optimistic Updates (Booking Writes)

The `useBookingWrite` hook in `useMandapamMutations.ts` implements optimistic updates via `onMutate`:

1. **Snapshot**: saves the previous booking detail cache
2. **Patch**: immediately updates `status` and `outstandingAmount` in the cached booking based on action type:
   - `payment`: reduces `outstandingAmount` by amount; if 0, sets status to `COMPLETED`
   - `refund`: increases `outstandingAmount` by amount
   - `charge`: increases `outstandingAmount` by amount
   - `status`: sets new status; if `CANCELLED`, zeros `outstandingAmount`
   - `settlement`: sets status; if `complete`, zeros `outstandingAmount`
   - `addon`: increases `outstandingAmount` by amount
3. **Rollback**: on error, restores the snapshot via `ctx.prev`
4. **Finalize**: on success, invalidates cache keys (triggers refetch with real data)

This eliminates the visual "flash" when waiting for the server response — the UI updates instantly and reconciles on refetch.

## Cache Invocation Map

Each mutation invalidates specific cache keys after success:

```
Booking Mutation:
  invalidate: ['mandapam', 'bookings'], ['mandapam', 'bookings', id]
  also:       ['mandapam', 'calendar']  (if status changes affect availability)

Calendar Mutation:
  invalidate: ['mandapam', 'calendar'], ['mandapam', 'calendar', date]

Package Mutation:
  invalidate: ['mandapam', 'packages'], ['mandapam', 'packages', id]

Catalog Mutation:
  invalidate: ['mandapam', 'facilities']  (for facility changes)
  invalidate: ['mandapam', 'addons']      (for addon changes)
```

## Error Code → Frontend UX Mapping

| Error Code | Pipeline(s) | Frontend UX |
|---|---|---|
| `VALIDATION_ERROR` | 1, 4 | Toast with field details |
| `BOOKING_CANCELLED` | 4 | Toast: 'Cannot modify cancelled booking' |
| `INVALID_STATUS_TRANSITION` | 4 | Toast: 'Invalid status change' |
| `INVALID_SETTLEMENT_STATE` | 4 | Toast: 'Settlement not allowed in current state' |
| `DATE_BLOCKED` | 1 | Toast: 'Selected date is blocked' |
| `DATE_ALREADY_BOOKED` | 1 | Toast: 'Date already fully booked' |
| `TIME_CONFLICT` | 1 | Toast: 'Time slot overlaps with existing booking' |
| `INVALID_TOKEN` | 1, 3 | Toast: 'Invalid token number' |
| `INSUFFICIENT_TOKENS` | 1 | Toast: 'Not enough tokens available' |
| `DISCOUNT_EXCEEDS_CHARGES` | 4 | Toast: 'Discount exceeds outstanding' |
| `MANDAPAM_PACKAGE_NOT_FOUND` | 6 | Toast: 'Package not found' |
| `MANDAPAM_PACKAGE_INACTIVE` | 1 | Toast: 'No active package for this booking type' |
| `MANDAPAM_FACILITY_NOT_FOUND` | 7 | Toast: 'Facility not found' |
| `MANDAPAM_ADDON_INACTIVE` | 1, 4 | Toast: 'Addon not available' |
| `DATE_HAS_BOOKINGS` | 5 | Toast: 'Cannot unblock — date has active bookings' |

## Relevant Source Files

| File | Role |
|---|---|
| `frontend/src/pipelines/mandapam/context.types.ts` | Shared context types |
| `frontend/src/pipelines/mandapam/run-pipeline.ts` | PipelineRunner re-export |
| `frontend/src/pipelines/mandapam/steps/execute-api.step.ts` | Generic API call step |
| `frontend/src/pipelines/mandapam/steps/handle-error.step.ts` | Error handler |
| `frontend/src/pipelines/mandapam/steps/invalidate-cache.step.ts` | Cache invalidation |
| `frontend/src/api/mandapam.api.ts` | All 20 API functions |
| `frontend/src/lib/pipeline/Pipeline.ts` | PipelineRunner class |
| `frontend/src/lib/pipeline/types.ts` | PipelineContext base |
| `frontend/src/types/mandapam.ts` | Domain types (Booking, Package, etc.) |
| `frontend/src/queries/queryKeys.ts` | Extended with mandapam keys |
| `frontend/src/queries/useMandapamQueries.ts` | All useQuery hooks |
| `frontend/src/queries/useMandapamMutations.ts` | All useMutation hooks |
