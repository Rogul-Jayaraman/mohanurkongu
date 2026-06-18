# Pipeline 2: Booking Status

> **For beginners**: Moves a booking through its lifecycle stages — confirmed,
> in progress, completed, or cancelled. Each transition has rules about what
> can change to what. Cancelling releases the calendar dates and reverses tokens.

## Purpose

Transition a booking through its 6-state machine with conditional cascading effects. Replaces `BookingService.updateStatus()`. On CANCELLED: releases calendar reservations and reverses tokens. On SETTLEMENT_PENDING: creates settlement row. All transitions record timeline + audit events.

## Actor & Entry

| Route | Method |
|-------|--------|
| `/admin/mandapam/bookings/:id/status` | PATCH |

**Allowed Roles:** `ADMIN`

**Validation Schema:** `updateBookingStatusSchema` (Zod) — `status: z.enum(['CONFIRMED', 'EVENT_IN_PROGRESS', 'EVENT_COMPLETED', 'SETTLEMENT_PENDING', 'COMPLETED', 'CANCELLED'])`

## Status State Machine

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
  │SETTLEMENT_PENDING  │ ← upsert settlement row (state: 'PENDING')
  └────────┬───────────┘
        ┌──┴──┐
        ▼     ▼
  ┌─────────┐ ┌───────────┐
  │COMPLETED│ │ CANCELLED │
  └─────────┘ └───────────┘
```

**VALID_TRANSITIONS:**
```
CONFIRMED:           → EVENT_IN_PROGRESS, CANCELLED
EVENT_IN_PROGRESS:   → EVENT_COMPLETED,   CANCELLED
EVENT_COMPLETED:     → SETTLEMENT_PENDING
SETTLEMENT_PENDING:  → COMPLETED, CANCELLED
COMPLETED:           → (terminal — no transitions)
CANCELLED:           → (terminal — no transitions)
```

## High-Level Architecture

```
  ┌─ PATCH /admin/mandapam/bookings/:id/status ────────────────────────┐
  │  ctx = { id, input: { status: 'CANCELLED' }, performedBy }        │
  └────────────────────────────────┬────────────────────────────────────┘
                                   │
                                   ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │  PipelineRunner.run([S1..S7], ctx)                                   │
  │                                                                       │
  │  PRE-TRANSACTION (S1-S2):                                            │
  │  ┌─────────────────────────────────────────────────────────────┐    │
  │  │ S1. resolveBooking(ctx)                                     │    │
  │  │ S2. validateStatusTransition(ctx)  ← VALID_TRANSITIONS map  │    │
  │  └─────────────────────────────────────────────────────────────┘    │
  │                                                                       │
  │  $transaction (S3-S6):                                              │
  │  ┌─────────────────────────────────────────────────────────────┐    │
  │  │ S3. updateBookingStatus(ctx, ctx.input.status)               │    │
  │  │                                                              │    │
  │  │ S4. IF status === 'CANCELLED' (conditional cascade):        │    │
  │  │     manageCalendarReservations(ctx, 'RELEASE')              │    │
  │  │     manageTokens(ctx, 'REVERSE')                            │    │
  │  │                                                              │    │
  │  │ S5. IF status === 'SETTLEMENT_PENDING' (conditional):       │    │
  │  │     upsertSettlement(ctx, 'INITIATE')                       │    │
  │  │                                                              │    │
  │  │ S6. commitStatusEvents(ctx)                                 │    │
  │  │     ├── recordTimelineEvent('STATUS_{newStatus}')            │    │
  │  │     └── recordAuditLog('STATUS_CHANGED', from→to)            │    │
  │  └─────────────────────────────────────────────────────────────┘    │
  │                                                                       │
  │  POST-TRANSACTION (S7):                                             │
  │  ┌─────────────────────────────────────────────────────────────┐    │
  │  │ S7. setMutationResponse(ctx)                                 │    │
  │  │     └── Prisma aggregate queries for charges/payments/refund │    │
  │  │         Returns: { id, bookingNo, status, outstandingAmount }│    │
  │  └─────────────────────────────────────────────────────────────┘    │
  └────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
              { booking: { id, bookingNo, status, outstandingAmount } }
```

## Low-Level Architecture — Step by Step

### S1: resolveBooking

```
====================================================================================
S1: resolveBooking  [PRE-TRANSACTION]
────────────────────────────────────────────────────────────────────────────────────
Input:  ctx.id (booking UUID)

Prisma query:
  booking = prisma.mandapamBooking.findUnique({
    where: { id },
    include: {
      packageSnapshot: true, addonSnapshots: true, calendarEntries: true,
      ledgerEntries: { orderBy: { createdAt: 'desc' } },
      paymentEntries: { orderBy: { createdAt: 'desc' } },
      refundEntries: { orderBy: { createdAt: 'desc' } },
      tokenEntries: true, settlement: true,
      timeline: { orderBy: { createdAt: 'asc' } },
      invoice: { include: { lines: true } },
    }
  })

  if !booking → throw AppError(404, NOT_FOUND, 'Booking not found')

Output: ctx.booking = booking (full booking with all relations)
====================================================================================
```

### S2: validateStatusTransition

```
====================================================================================
S2: validateStatusTransition  [PRE-TRANSACTION]
────────────────────────────────────────────────────────────────────────────────────
Input:  ctx.booking.status (current state), ctx.input.status (requested state)

VALID_TRANSITIONS = {
  CONFIRMED:           ['EVENT_IN_PROGRESS', 'CANCELLED'],
  EVENT_IN_PROGRESS:   ['EVENT_COMPLETED',   'CANCELLED'],
  EVENT_COMPLETED:     ['SETTLEMENT_PENDING'],
  SETTLEMENT_PENDING:  ['COMPLETED', 'CANCELLED'],
  COMPLETED:           [],
  CANCELLED:           [],
}

Logic:
  allowed = VALID_TRANSITIONS[ctx.booking.status] ?? []
  if !allowed.includes(ctx.input.status):
    throw AppError(400, INVALID_STATUS_TRANSITION,
      `Cannot transition from ${ctx.booking.status} to ${ctx.input.status}`)

Output: none
====================================================================================
```

### S3: updateBookingStatus

```
====================================================================================
S3: updateBookingStatus(ctx, ctx.input.status)  [INSIDE $transaction]
────────────────────────────────────────────────────────────────────────────────────
Input:  ctx.id, ctx.input.status

Logic:
  ctx._prevStatus = ctx.booking.status    ← saved for audit/timeline metadata

  tx.mandapamBooking.update({
    where: { id: ctx.id },
    data: { status: ctx.input.status }
  })

Output: ctx._prevStatus set (used by S6 for from→to metadata)
====================================================================================
```

### S4: CANCELLED cascade

```
====================================================================================
S4: IF status === 'CANCELLED'  [INSIDE $transaction]
────────────────────────────────────────────────────────────────────────────────────
Releases calendar and reverses tokens when a booking is cancelled.

manageCalendarReservations(ctx, 'RELEASE'):
  tx.mandapamCalendarEntry.updateMany({
    where: { bookingId: ctx.id },
    data: { status: 'AVAILABLE', bookingId: null }
  })

manageTokens(ctx, 'REVERSE'):
  tx.mandapamTokenConsumption.updateMany({
    where: { bookingId: ctx.id, state: 'CONSUMED' },
    data: { state: 'REVERSED', reversedAt: new Date() }
  })

Output: none
====================================================================================
```

### S5: SETTLEMENT_PENDING cascade

```
====================================================================================
S5: IF status === 'SETTLEMENT_PENDING'  [INSIDE $transaction]
────────────────────────────────────────────────────────────────────────────────────
Creates a settlement row in PENDING state when transitioning to settlement.

upsertSettlement(ctx, 'INITIATE'):
  tx.mandapamSettlement.upsert({
    where: { bookingId: ctx.id },
    update: { state: 'PENDING' },
    create: { bookingId: ctx.id, state: 'PENDING' }
  })

Output: none
====================================================================================
```

### S6: commitStatusEvents

```
====================================================================================
S6: commitStatusEvents  [INSIDE $transaction]
────────────────────────────────────────────────────────────────────────────────────
Input:  ctx.id, ctx._prevStatus, ctx.input.status, ctx.performedBy

Logic:
  tx.mandapamBookingTimeline.create({
    data: {
      bookingId: ctx.id,
      event: `STATUS_${ctx.input.status}`,
      metadata: { from: ctx._prevStatus, to: ctx.input.status }
    }
  })

  tx.mandapamAuditLog.create({
    data: {
      bookingId: ctx.id,
      action: 'STATUS_CHANGED',
      performedBy: ctx.performedBy,
      metadata: { from: ctx._prevStatus, to: ctx.input.status }
    }
  })

Output: none
====================================================================================
```

### S7: setMutationResponse

```
====================================================================================
S7: setMutationResponse  [POST-TRANSACTION]
────────────────────────────────────────────────────────────────────────────────────
Input:  ctx.id (bookingId)

Prisma queries (3 parallel aggregates):
  booking = prisma.mandapamBooking.findUnique({
    where: { id: bookingId },
    select: { id: true, status: true, bookingNo: true }
  })

  ledgerSum  = prisma.mandapamFinancialLedger.aggregate({
                 where: { bookingId }, _sum: { amount: true } })
  paymentSum = prisma.mandapamPaymentLedger.aggregate({
                 where: { bookingId }, _sum: { amount: true } })
  refundSum  = prisma.mandapamRefundLedger.aggregate({
                 where: { bookingId }, _sum: { amount: true } })

  charges = Number(ledgerSum._sum.amount || 0)
  payments = Number(paymentSum._sum.amount || 0)
  refunds = Number(refundSum._sum.amount || 0)

Output: ctx.responseData = {
  booking: {
    id: booking.id,
    bookingNo: booking.bookingNo,
    status: booking.status,
    outstandingAmount: charges - payments + refunds
  }
}
====================================================================================
```

## Dependencies

| Step File | Role |
|-----------|------|
| `steps/resolve-booking.step.ts` | Shared: load booking by ID |
| `steps/validate-status-transition.step.ts` | Pipeline-specific: VALID_TRANSITIONS check |
| `steps/update-booking-status.step.ts` | Shared: UPDATE status column |
| `steps/manage-calendar-reservations.step.ts` | Shared: RELEASE sub-action |
| `steps/manage-tokens.step.ts` | Shared: REVERSE sub-action |
| `steps/upsert-settlement.step.ts` | Shared: INITIATE sub-action |
| `steps/record-timeline-event.step.ts` | Shared: STATUS_{to} event |
| `steps/record-audit-log.step.ts` | Shared: STATUS_CHANGED audit |
| `steps/set-mutation-response.step.ts` | Shared: { id, bookingNo, status, outstandingAmount } via aggregates |

## Error Scenarios

| Scenario | Step | HTTP | Code |
|----------|------|------|------|
| Booking not found | S1 | 404 | NOT_FOUND |
| CONFIRMED → COMPLETED (skip intermediate) | S2 | 400 | INVALID_STATUS_TRANSITION |
| COMPLETED → any (terminal) | S2 | 400 | INVALID_STATUS_TRANSITION |
| CANCELLED → any (terminal) | S2 | 400 | INVALID_STATUS_TRANSITION |
| SETTLEMENT_PENDING → EVENT_IN_PROGRESS (backwards) | S2 | 400 | INVALID_STATUS_TRANSITION |

## Audit Events

| Event | Payload | When |
|-------|---------|------|
| `STATUS_CHANGED` | `{ from: oldStatus, to: newStatus }` | Any status transition |

## Testing Considerations

- **Full lifecycle test**: CONFIRMED → EVENT_IN_PROGRESS → EVENT_COMPLETED → SETTLEMENT_PENDING → COMPLETED
- **Cancellation test**: CONFIRMED → CANCELLED, verify calendar entries released and tokens reversed
- **Rollback test**: Verify no timeline or audit entry created if transaction fails
- **Terminal state test**: Verify COMPLETED and CANCELLED reject any further transitions
