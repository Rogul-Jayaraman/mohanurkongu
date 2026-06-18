# Pipeline 4: Financial Transaction

> **For beginners**: Records individual payments and refunds against a booking.
> Every addition or removal of money gets logged here with a clear audit trail.

## Purpose

Unified pipeline for recording payments and refunds against a booking. Replaces `BookingService.addPayment()` and `BookingService.addRefund()`. Discriminated by `transactionType` — both flow through the same 5-step structure with different target tables.

## Actor & Entry

| Route | Method | transactionType |
|-------|--------|----------------|
| `/admin/mandapam/bookings/:id/payments` | POST | `PAYMENT` |
| `/admin/mandapam/bookings/:id/refunds` | POST | `REFUND` |

**Allowed Roles:** `ADMIN`

**Validation Schema:** `addPaymentSchema` (PAYMENT) or `addRefundSchema` (REFUND) — selected by route

## High-Level Architecture

```
  ┌─ POST .../payments  /  POST .../refunds ────────────────────────────┐
  │  ctx = { id, input, transactionType: 'PAYMENT' | 'REFUND',        │
  │          performedBy }                                             │
  └────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  PipelineRunner.run([S1..S5], ctx)                                   │
  │                                                                       │
  │  PRE-TRANSACTION (S1-S2):                                            │
  │  ┌──────────────────────────────────────────────────────────────┐   │
  │  │ S1. resolveBooking(ctx)                                     │   │
  │  │ S2. validateTransaction(ctx)                                │   │
  │  │     ├── PAYMENT: reject if booking is CANCELLED             │   │
  │  │     └── REFUND:  (no restriction)                           │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  │                                                                       │
  │  $transaction (S3-S4):                                              │
  │  ┌──────────────────────────────────────────────────────────────┐   │
  │  │ S3. insertFinancialTransaction(ctx)                          │   │
  │  │     ├── PAYMENT: INSERT mandapam_payment_ledger              │   │
  │  │     └── REFUND:  INSERT mandapam_refund_ledger               │   │
  │  │                                                               │   │
  │  │ S4. commitTransactionEvents(ctx)                             │   │
  │  │     ├── PAYMENT: recordTimeline('PAYMENT_RECEIVED')         │   │
  │  │     │           recordAudit('PAYMENT_ADDED')                │   │
  │  │     └── REFUND:  recordTimeline('REFUND_PROCESSED')         │   │
  │  │                 recordAudit('REFUND_ADDED')                 │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  │                                                                       │
  │  POST-TRANSACTION (S5):                                             │
  │  ┌──────────────────────────────────────────────────────────────┐   │
  │  │ S5. setMutationResponse(ctx)                                  │   │
  │  │     └── Prisma aggregate queries for charges/payments/refund  │   │
  │  │         Returns: { id, bookingNo, status, outstandingAmount } │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  └────────────────────────────────┬─────────────────────────────────────┘
                                    │
                                    ▼
              { booking: { id, bookingNo, status, outstandingAmount } }
```

## Low-Level Architecture — Step by Step

### S2: validateTransaction

```
====================================================================================
S2: validateTransaction  [PRE-TRANSACTION]
────────────────────────────────────────────────────────────────────────────────────
Input:  ctx.booking, ctx.transactionType, ctx.input

PAYMENT:
  if ctx.booking.status === 'CANCELLED':
    throw AppError(400, BOOKING_CANCELLED, 'Cannot add payment to cancelled booking')

REFUND:
  if !ctx.input.amount || ctx.input.amount <= 0:
    throw AppError(400, INVALID_AMOUNT, 'Refund amount must be positive')

Output: none
====================================================================================
```

### S3: insertFinancialTransaction

```
====================================================================================
S3: insertFinancialTransaction  [INSIDE $transaction]
────────────────────────────────────────────────────────────────────────────────────
Input:  ctx.id, ctx.transactionType, ctx.input

PAYMENT:
  tx.mandapamPaymentLedger.create({
    data: {
      bookingId: ctx.id,
      paymentType: ctx.input.paymentType,       // ADVANCE | INSTALLMENT | FINAL_PAYMENT
      paymentMethod: ctx.input.paymentMethod,   // CASH | UPI | BANK_TRANSFER | CARD | CHEQUE
      amount: ctx.input.amount,
    }
  })

REFUND:
  tx.mandapamRefundLedger.create({
    data: {
      bookingId: ctx.id,
      refundType: ctx.input.refundType,         // PARTIAL_REFUND | FULL_REFUND
      refundMethod: ctx.input.refundMethod,     // CASH | UPI | BANK_TRANSFER | CARD | CHEQUE
      amount: ctx.input.amount,
      reason: ctx.input.reason ?? null,
    }
  })

Output: none
====================================================================================
```

### S4: commitTransactionEvents

```
====================================================================================
S4: commitTransactionEvents  [INSIDE $transaction]
────────────────────────────────────────────────────────────────────────────────────
Input:  ctx.id, ctx.transactionType, ctx.input, ctx.performedBy

PAYMENT:
  tx.mandapamBookingTimeline.create({
    data: { bookingId: ctx.id, event: 'PAYMENT_RECEIVED',
      metadata: { type: ctx.input.paymentType, amount: ctx.input.amount } }
  })
  tx.mandapamAuditLog.create({
    data: { bookingId: ctx.id, action: 'PAYMENT_ADDED',
      performedBy: ctx.performedBy, metadata: ctx.input }
  })

REFUND:
  tx.mandapamBookingTimeline.create({
    data: { bookingId: ctx.id, event: 'REFUND_PROCESSED',
      metadata: { type: ctx.input.refundType, amount: ctx.input.amount } }
  })
  tx.mandapamAuditLog.create({
    data: { bookingId: ctx.id, action: 'REFUND_ADDED',
      performedBy: ctx.performedBy, metadata: ctx.input }
  })

Output: none
====================================================================================
```

## Dependencies

| Step File | Role |
|-----------|------|
| `steps/resolve-booking.step.ts` | Shared |
| `steps/record-timeline-event.step.ts` | Shared |
| `steps/record-audit-log.step.ts` | Shared |
| `steps/set-booking-response.step.ts` | Shared |

## Error Scenarios

| Scenario | Step | HTTP | Code |
|----------|------|------|------|
| Payment on cancelled booking | S2 | 400 | BOOKING_CANCELLED |
| Refund with zero/negative amount | S2 | 400 | INVALID_AMOUNT |
