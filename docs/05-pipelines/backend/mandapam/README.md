# Maaligai Pipelines — Architecture Documentation

> **For beginners**: This page is the table of contents for all hall booking
> pipelines below. Each doc explains one operation (create booking, process
> payment, check calendar, etc.) with diagrams and step-by-step details.

## Overview

The Mohanurkongu Maaligai (Mandapam) module uses a **pipeline architecture** for all booking, calendar, financial, and catalog operations. Each pipeline is a linear sequence of composable steps executed by `PipelineRunner`. This eliminates the monolithic `MandapamService` (288 lines) and `BookingService` (338 lines), standardizes error handling across all 14 API routes, and makes the booking lifecycle auditable and extensible.

## Architecture Principles

1. **Single Responsibility per Step** — Each step function does exactly one thing (e.g., `resolveBooking`, `validateStatusTransition`, `manageTokens`). Steps are pure functions with no side effects beyond their return value and thrown errors.

2. **Context Object** — All pipeline steps share a typed `PipelineContext` that accumulates data as it flows through steps. Steps add properties, check properties set by previous steps, and throw `AppError` on failure.

3. **Transaction Boundaries** — Every pipeline explicitly delineates:
   - **PRE-TRANSACTION**: Validation, permission gates, data preparation, read queries
   - **$transaction**: All write operations (atomic commit/rollback via Prisma)
   - **POST-TRANSACTION**: Response formatting, refetching fresh state

4. **Shared Step Library** — Common operations (resolve booking, record timeline/audit, manage calendar/tokens, settlement lifecycle) are extracted into 11 shared steps under `steps/`. No step is duplicated across pipelines.

5. **State Machine Enforcement** — Booking status transitions are governed by `VALID_STATUS_TRANSITIONS` map. The `updateBookingStatus` shared step validates every transition. Settlement has its own two-action state machine (INITIATE → START_SETTLEMENT → COMPLETE).

## Pipeline Index

| # | Pipeline | File | Replaces | Transaction Complexity |
|---|----------|------|----------|----------------------|
| 1 | Booking Create | `booking-create-pipeline.md` | `BookingCreateService.create()` | 10+ DB ops — **HIGH** — returns `{ id, bookingNo, status }` only |
| 2 | Booking Status | `booking-status-pipeline.md` | `BookingService.updateStatus()` | 4-6 DB ops — returns `{ id, bookingNo, status, outstandingAmount }` |
| 3 | Booking Settlement | `booking-settlement-pipeline.md` | `BookingService.settlementAction()` | 6+ DB ops — returns `{ id, bookingNo, status, outstandingAmount }` |
| 4 | Financial Transaction | `financial-transaction-pipeline.md` | `BookingService.addPayment()` + `addRefund()` | 3 DB ops — returns `{ id, bookingNo, status, outstandingAmount }` |
| 5 | Booking Addon | `booking-addon-pipeline.md` | `BookingService.addAddon()` + `removeAddon()` | 4 DB ops — returns `{ id, bookingNo, status, outstandingAmount }` |
| 6 | Booking List | `booking-list-pipeline.md` | `BookingRepository.findMany()` + enrichment | Read pipeline — uses Prisma `groupBy` aggregation, returns `totalCharges`/`totalPayments`/`totalRefunds`/`outstandingAmount` |
| 7 | Calendar Block | `calendar-block-pipeline.md` | `BookingService.blockDates()` + `unblockDates()` | 2-3 DB ops |
| 8 | Calendar View | `calendar-view-pipeline.md` | `BookingService.getCalendarDay()` + `getCalendarEntries()` | Read pipeline (list/detail modes) |
| 9 | Token Validate | `token-validate-pipeline.md` | `TokenLedgerService.validateToken()` | Read pipeline |
| 10 | Package Update | `package-update-pipeline.md` | `MandapamService.updatePackage()` | 4+ table upserts |
| 11 | Catalog Entity | `catalog-entity-pipeline.md` | `MandapamService` facility + addon CRUD | 2-3 table ops |

## Shared Step Library

All pipelines reference steps from `steps/`. The shared step library includes:

| Step | Purpose | Used By (Pipeline) |
|------|---------|-------------------|
| `resolveBooking` | Load booking by ID with all relations | 2, 3, 4, 5 |
| `updateBookingStatus` | UPDATE status with transition validation | 2, 3 |
| `computeOutstanding` | charges - payments + refunds computation | 3, 6 |
| `setBookingResponse` | Legacy full `{ booking }` response (pre-refinement) | — (replaced by `setMutationResponse`) |
| `setMutationResponse` | Lightweight `{ id, bookingNo, status, outstandingAmount }` via Prisma aggregate | 2, 3, 4, 5 |
| `recordTimelineEvent` | INSERT booking_timeline entry | 1, 2, 3, 4, 5 |
| `recordAuditLog` | INSERT audit_log entry | 1, 2, 3, 4 |
| `manageCalendarReservations` | VALIDATE / CREATE / RELEASE calendar entries | 1, 2 |
| `manageTokens` | ISSUE / CONSUME / REVERSE token lifecycle | 1, 2 |
| `upsertSettlement` | INITIATE / START_SETTLEMENT / COMPLETE settlement | 2, 3 |
| `insertFinancialLedger` | INSERT financial_ledger line item | 1, 3, 5 |
| `entityCrudWithTranslations` | Generic CREATE/UPDATE/DELETE/LIST for catalog entities | 11 |

## Transaction Boundaries

```
  PRE-TRANSACTION:   resolveBooking, validateStatusTransition, computeOutstanding,
                     validateSettlementState, buildReservations, validateDates,
                     resolveActivePackage, generateBookingNo

  $transaction:      updateBookingStatus, manageCalendarReservations,
                     manageTokens, upsertSettlement, insertFinancialLedger,
                     recordTimelineEvent, recordAuditLog, entityCrudWithTranslations

  POST-TRANSACTION:  setMutationResponse, setListResponse, setCalendarResponse,
                     setCalendarViewResponse, setTokenResponse, setPackageResponse,
                     setEntityResponse
                     (booking-create omits response step — returns minimal `{ id, bookingNo, status }` directly)
```

## Error Code Reference

| Code | HTTP | Meaning |
|------|------|---------|
| `NOT_FOUND` | 404 | Booking or entity not found |
| `MANDAPAM_PACKAGE_NOT_FOUND` | 404 | Package not found |
| `MANDAPAM_PACKAGE_INACTIVE` | 400 | No active package for booking type |
| `MANDAMAP_PACKAGE_NO_PRICING` | 400 | Package has no active pricing |
| `MANDAPAM_FACILITY_NOT_FOUND` | 404 | Facility not found |
| `MANDAPAM_ADDON_NOT_FOUND` | 404 | Addon not found |
| `MANDAPAM_ADDON_INACTIVE` | 400 | Addon not available |
| `ADDON_SNAPSHOT_NOT_FOUND` | 404 | Addon snapshot not found |
| `INVALID_STATUS_TRANSITION` | 400 | Illegal booking status change |
| `INVALID_SETTLEMENT_STATE` | 400 | Settlement action not allowed in current state |
| `BOOKING_CANCELLED` | 400 | Cannot add payment to cancelled booking |
| `DATE_BLOCKED` | 409 | Date is blocked |
| `DATE_ALREADY_BOOKED` | 409 | Date already fully booked |
| `DATE_HAS_BOOKINGS` | 409 | Date has active bookings (cannot unblock) |
| `TIME_CONFLICT` | 409 | Time slot overlaps with existing booking |
| `INVALID_TOKEN` | 400 | Token source booking not found |
| `INSUFFICIENT_TOKENS` | 400 | Not enough tokens available |
| `DISCOUNT_EXCEEDS_CHARGES` | 400 | Discount amount exceeds outstanding charges |
| `INVALID_AMOUNT` | 400 | Amount must be positive |
| `INVALID_DATE_FORMAT` | 400 | Date must be YYYY-MM-DD |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |

## Booking Status State Machine

```
      ┌───────────┐
      │ CONFIRMED │─────────────→──────────┐
      └─────┬─────┘                        │
            │                              ▼
            ▼                        ┌───────────┐
      ┌──────────────────┐           │ CANCELLED │ ← releases calendar, reverses tokens
      │EVENT_IN_PROGRESS │           └───────────┘
      └────────┬─────────┘
               │
               ▼
      ┌──────────────────┐
      │ EVENT_COMPLETED  │
      └────────┬─────────┘
               │
               ▼
      ┌────────────────────┐
      │SETTLEMENT_PENDING  │ ← creates settlement row (state: 'PENDING')
      └────────┬───────────┘
            ┌──┴──┐
            ▼     ▼
      ┌─────────┐ ┌───────────┐
      │COMPLETED│ │ CANCELLED │
      └─────────┘ └───────────┘
      (terminal)  (terminal)
```

## Proposed File Structure

```
backend/src/modules/mandapam/
├── mandapam.controller.ts         ← stays thin (creates ctx → calls pipeline)
├── mandapam.service.ts            ← REMOVED (logic migrated to pipelines)
├── mandapam.routes.ts             ← unchanged (maps routes → controller methods)
│
├── pipelines/
│   ├── booking-create.pipeline.ts
│   ├── booking-status.pipeline.ts
│   ├── booking-settlement.pipeline.ts
│   ├── financial-transaction.pipeline.ts
│   ├── booking-addon.pipeline.ts
│   ├── booking-list.pipeline.ts
│   ├── calendar-block.pipeline.ts
│   ├── calendar-view.pipeline.ts
│   ├── token-validate.pipeline.ts
│   ├── package-update.pipeline.ts
│   └── catalog-entity.pipeline.ts
│
├── steps/
│   ├── context.types.ts                  ← PipelineContext interface
│   ├── resolve-booking.step.ts
│   ├── update-booking-status.step.ts
│   ├── compute-outstanding.step.ts
│   ├── set-booking-response.step.ts      ← Legacy (kept for backward compat)
│   ├── set-mutation-response.step.ts     ← Lightweight aggregate-based response for mutations
│   ├── record-timeline-event.step.ts
│   ├── record-audit-log.step.ts
│   ├── manage-calendar-reservations.step.ts
│   ├── manage-tokens.step.ts
│   ├── upsert-settlement.step.ts
│   ├── insert-financial-ledger.step.ts
│   └── entity-crud-with-translations.step.ts
│
├── dto/
│   ├── mandapam.dto.ts
│   └── public-mandapam.dto.ts
│
└── public/                           ← empty (public endpoints use shared steps)
```
