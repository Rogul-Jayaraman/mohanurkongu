# Pipeline 3: Booking Settlement

> **For beginners**: Handles the payment side of bookings — starting
> settlement, processing payments, and handling refunds. Every money movement
> is recorded in the financial ledger.

## Purpose

Two-action settlement workflow for completing a booking's financial lifecycle. `start` initiates settlement (state → IN_PROGRESS, status → SETTLEMENT_PENDING). `complete` finalizes with damage/penalty/extra charges, optional discount, sets settlement COMPLETED and booking COMPLETED. Replaces `BookingService.settlementAction()`.

## Actor & Entry

| Route | Method |
|-------|--------|
| `/admin/mandapam/bookings/:id/settlement` | POST |

**Allowed Roles:** `ADMIN`

**Validation Schema:** `settlementActionSchema` (Zod) — `{ action: 'start' | 'complete', finalAmount?, charges?, notes? }`

## High-Level Architecture

```
  ┌─ POST /admin/mandapam/bookings/:id/settlement ─────────────────────┐
  │  ctx = { id, input: { action, finalAmount?, charges?, notes? },   │
  │          performedBy }                                             │
  └────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  PipelineRunner.run([S1..S10], ctx)                                  │
  │                                                                       │
  │  PRE-TRANSACTION (S1-S3):                                            │
  │  ┌──────────────────────────────────────────────────────────────┐   │
  │  │ S1. resolveBooking(ctx)                                      │   │
  │  │ S2. validateSettlementState(ctx)                             │   │
  │  │ S3. computeOutstanding(ctx)  ← charges - payments + refunds  │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  │                                                                       │
  │  $transaction (S4-S8):                                              │
  │  ┌──────────────────────────────────────────────────────────────┐   │
  │  │  BRANCH: action === 'start'                                  │   │
  │  │  ┌─────────────────────────────────────────────────────┐    │   │
  │  │  │ S4. upsertSettlement(ctx, 'START_SETTLEMENT')        │    │   │
  │  │  │     ├── UPSERT settlement (state: 'IN_PROGRESS')    │    │   │
  │  │  │     └── UPDATE booking SET status='SETTLEMENT_PENDING'│   │   │
  │  │  │                                                        │    │   │
  │  │  │ S5. recordTimelineEvent(ctx, 'SETTLEMENT_STARTED')    │    │   │
  │  │  └─────────────────────────────────────────────────────┘    │   │
  │  │                                                              │   │
  │  │  BRANCH: action === 'complete'                             │   │
  │  │  ┌─────────────────────────────────────────────────────┐    │   │
  │  │  │ S6. upsertSettlement(ctx, 'COMPLETE',                │    │   │
  │  │  │     { charges, finalAmount, notes, performedBy,     │    │   │
  │  │  │       outstanding: ctx.outstanding.outstanding })   │    │   │
  │  │  │     ├── INSERT financial_ledger for each charge     │    │   │
  │  │  │     ├── INSERT financial_ledger for discount        │    │   │
  │  │  │     ├── UPDATE settlement (state: 'COMPLETED')      │    │   │
  │  │  │     └── UPDATE booking SET status='COMPLETED'       │    │   │
  │  │  │                                                        │    │   │
  │  │  │ S7. recordTimelineEvent(ctx, 'SETTLEMENT_COMPLETED',   │    │   │
  │  │  │     { finalAmount, discount })                         │    │   │
  │  │  └─────────────────────────────────────────────────────┘    │   │
  │  │                                                              │   │
  │  │ S8. recordAuditLog(ctx, `SETTLEMENT_${action.toUpper()}`,  │   │
  │  │       ctx.input)                                            │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  │                                                                       │
  │  POST-TRANSACTION (S9):                                              │
  │  ┌──────────────────────────────────────────────────────────────┐   │
  │  │ S9. setMutationResponse(ctx)                                  │   │
  │  │     └── Prisma aggregate queries for charges/payments/refund  │   │
  │  │         Returns: { id, bookingNo, status, outstandingAmount } │   │
  │  └──────────────────────────────────────────────────────────────┘   │
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
Input:  ctx.id
Query:  Same as Booking Status S1 — full booking with all relations
Output: ctx.booking
====================================================================================
```

### S2: validateSettlementState

```
====================================================================================
S2: validateSettlementState  [PRE-TRANSACTION]
────────────────────────────────────────────────────────────────────────────────────
Input:  ctx.booking.status, ctx.input.action

Logic:
  ┌─ action === 'start' ──────────────────────────────────────────────┐
  │  if ctx.booking.status !== 'EVENT_COMPLETED':                     │
  │    throw 400 INVALID_SETTLEMENT_STATE                             │
  └────────────────────────────────────────────────────────────────────┘
  ┌─ action === 'complete' ───────────────────────────────────────────┐
  │  if ctx.booking.status !== 'SETTLEMENT_PENDING':                  │
  │    throw 400 INVALID_SETTLEMENT_STATE                             │
  └────────────────────────────────────────────────────────────────────┘

Output: none
====================================================================================
```

### S3: computeOutstanding

```
====================================================================================
S3: computeOutstanding  [PRE-TRANSACTION]
────────────────────────────────────────────────────────────────────────────────────
Input:  ctx.booking.ledgerEntries, ctx.booking.paymentEntries, ctx.booking.refundEntries

Computation:
  totalCharges   = Number(ledgerEntries.reduce((s, e) => s + Number(e.amount), 0))
  totalPayments  = Number(paymentEntries.reduce((s, e) => s + Number(e.amount), 0))
  totalRefunds   = Number(refundEntries.reduce((s, e) => s + Number(e.amount), 0))
  outstanding    = totalCharges - totalPayments + totalRefunds

Output: ctx.outstanding = { totalCharges, totalPayments, totalRefunds, outstanding }
====================================================================================
```

### S4 + S5: action === 'start'

```
====================================================================================
S4: upsertSettlement(ctx, 'START_SETTLEMENT')  [INSIDE $transaction]
────────────────────────────────────────────────────────────────────────────────────
Logic:
  tx.mandapamSettlement.upsert({
    where: { bookingId: ctx.id },
    update: { state: 'IN_PROGRESS' },
    create: { bookingId: ctx.id, state: 'IN_PROGRESS' }
  })

  tx.mandapamBooking.update({
    where: { id: ctx.id },
    data: { status: 'SETTLEMENT_PENDING' }
  })

S5: recordTimelineEvent(ctx, 'SETTLEMENT_STARTED', {})
  tx.mandapamBookingTimeline.create({
    data: { bookingId: ctx.id, event: 'SETTLEMENT_STARTED', metadata: {} }
  })
====================================================================================
```

### S6 + S7: action === 'complete'

```
====================================================================================
S6: upsertSettlement(ctx, 'COMPLETE', data)  [INSIDE $transaction]
────────────────────────────────────────────────────────────────────────────────────
Input:  data = { charges, finalAmount, notes, performedBy, outstanding }

Step A — Apply extra charges:
  for each charge in (data.charges ?? []):
    sourceMap = { damage: 'DAMAGE', penalty: 'PENALTY', extra: 'SERVICE' }
    tx.mandapamFinancialLedger.create({
      data: {
        bookingId: ctx.id,
        source: sourceMap[charge.type],
        description: charge.description,
        amount: charge.amount,
      }
    })

Step B — Apply discount (if finalAmount < outstanding):
  if data.finalAmount != null:
    discount = data.outstanding - data.finalAmount
    if discount > 0:
      tx.mandapamFinancialLedger.create({
        data: {
          bookingId: ctx.id,
          source: 'DISCOUNT',
          description: { en: 'Settlement discount applied', ta: 'தீர்வு தள்ளுபடி' },
          amount: -discount,
        }
      })
    if discount < 0:
      throw AppError(400, DISCOUNT_EXCEEDS_CHARGES, 'Discount exceeds outstanding charges')

Step C — Update settlement row:
  damageCharges   = (data.charges ?? []).filter(c => c.type === 'damage')
  penaltyCharges  = (data.charges ?? []).filter(c => c.type === 'penalty')
  extraCharges     = (data.charges ?? []).filter(c => c.type === 'extra')

  tx.mandapamSettlement.update({
    where: { bookingId: ctx.id },
    data: {
      state: 'COMPLETED',
      damageCharges: damageCharges.length ? damageCharges : undefined,
      penaltyCharges: penaltyCharges.length ? penaltyCharges : undefined,
      extraCharges: extraCharges.length ? extraCharges : undefined,
      finalAmount: data.finalAmount ?? null,
      settledAt: new Date(),
      settledBy: data.performedBy,
      notes: data.notes ?? null,
    }
  })

Step D — Complete the booking:
  tx.mandapamBooking.update({
    where: { id: ctx.id },
    data: { status: 'COMPLETED' }
  })

S7: recordTimelineEvent(ctx, 'SETTLEMENT_COMPLETED', metadata)
  discount = data.finalAmount != null ? data.outstanding - data.finalAmount : 0
  tx.mandapamBookingTimeline.create({
    data: {
      bookingId: ctx.id,
      event: 'SETTLEMENT_COMPLETED',
      metadata: { finalAmount: data.finalAmount, discount: Math.max(0, discount) }
    }
  })
====================================================================================
```

### S8: recordAuditLog

```
====================================================================================
S8: recordAuditLog  [INSIDE $transaction]
────────────────────────────────────────────────────────────────────────────────────
Input:  ctx.id, action = `SETTLEMENT_${action.toUpper()}`, ctx.input, ctx.performedBy

Logic:
  tx.mandapamAuditLog.create({
    data: {
      bookingId: ctx.id,
      action: `SETTLEMENT_${ctx.input.action.toUpperCase()}`,
      performedBy: ctx.performedBy,
      metadata: ctx.input,
    }
  })
====================================================================================
```

## Dependencies

| Step File | Role |
|-----------|------|
| `steps/resolve-booking.step.ts` | Shared |
| `steps/compute-outstanding.step.ts` | Shared |
| `steps/upsert-settlement.step.ts` | Shared: START_SETTLEMENT + COMPLETE sub-actions |
| `steps/insert-financial-ledger.step.ts` | Shared: DAMAGE/PENALTY/SERVICE/DISCOUNT entries |
| `steps/record-timeline-event.step.ts` | Shared |
| `steps/record-audit-log.step.ts` | Shared |
| `steps/set-booking-response.step.ts` | Shared |

## Error Scenarios

| Scenario | Step | HTTP | Code |
|----------|------|------|------|
| Booking not found | S1 | 404 | NOT_FOUND |
| Start from wrong state (not EVENT_COMPLETED) | S2 | 400 | INVALID_SETTLEMENT_STATE |
| Complete from wrong state (not SETTLEMENT_PENDING) | S2 | 400 | INVALID_SETTLEMENT_STATE |
| Discount exceeds charges | S6-B | 400 | DISCOUNT_EXCEEDS_CHARGES |
