# Pipeline 5: Booking Addon

> **For beginners**: Add or remove extras (catering, decorations, etc.) to
> an existing booking. Adjusts the total cost and logs the change.

## Purpose

Attach or detach addon services to/from a booking. ATTACH creates an addon snapshot + financial ledger entry (+amount). DETACH removes the snapshot + inserts negative adjustment (-amount). Replaces `BookingService.addAddon()` and `BookingService.removeAddon()`.

## Actor & Entry

| Route | Method | action |
|-------|--------|--------|
| `/admin/mandapam/bookings/:id/addons` | POST | `ATTACH` |
| `/admin/mandapam/bookings/:id/addons/:snapshotId` | DELETE | `DETACH` |

**Allowed Roles:** `ADMIN`

**Validation Schema:** `addAddonSchema` (for ATTACH) — `{ addonId, amount, quantity?, units? }`

## High-Level Architecture

```
  ┌─ POST /bookings/:id/addons  (ATTACH)  ──────────────────────────────┐
  │  DELETE /bookings/:id/addons/:snapshotId  (DETACH)                  │
  │  ctx = { id, action, input?, snapshotId?, performedBy }             │
  └────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
  ┌───────────────────────────────────────────────────────────────────────┐
  │  PipelineRunner.run([S1..S5], ctx)                                    │
  │                                                                        │
  │  PRE-TRANSACTION (S1-S2):                                             │
  │  ┌───────────────────────────────────────────────────────────────┐   │
  │  │ S1. resolveBooking(ctx)                                      │   │
  │  │                                                               │   │
  │  │ S2a. ATTACH: resolveAddon(ctx)                               │   │
  │  │   └── SELECT addon + translations WHERE id AND status=true   │   │
  │  │       if !addon → 400 MANDAPAM_ADDON_INACTIVE               │   │
  │  │                                                               │   │
  │  │ S2b. DETACH: resolveAddonSnapshot(ctx)                      │   │
  │  │   └── SELECT snapshot WHERE id=snapshotId AND bookingId=id  │   │
  │  │       if !snapshot → 404 ADDON_SNAPSHOT_NOT_FOUND           │   │
  │  └───────────────────────────────────────────────────────────────┘   │
  │                                                                        │
  │  $transaction (S3):                                                   │
  │  ┌───────────────────────────────────────────────────────────────┐   │
  │  │ S3a. ATTACH:                                                │   │
  │  │   INSERT mandapam_booking_addon_snapshot                      │   │
  │  │   SELECT insertFinancialLedger(ADDON, +totalAmount)           │   │
  │  │   recordTimelineEvent('ADDON_ADDED')                         │   │
  │  │                                                               │   │
  │  │ S3b. DETACH:                                                │   │
  │  │   DELETE mandapam_booking_addon_snapshot                     │   │
  │  │   SELECT insertFinancialLedger(ADJUSTMENT, -totalAmount)     │   │
  │  └───────────────────────────────────────────────────────────────┘   │
  │                                                                        │
  │  POST-TRANSACTION (S4):                                              │
  │  ┌───────────────────────────────────────────────────────────────┐   │
  │  │ S4. setMutationResponse(ctx)                                  │   │
  │  │     └── Prisma aggregate queries for charges/payments/refund  │   │
  │  │         Returns: { id, bookingNo, status, outstandingAmount } │   │
  │  └───────────────────────────────────────────────────────────────┘   │
  └────────────────────────────────┬───────────────────────────────────────┘
                                    │
                                    ▼
              { booking: { id, bookingNo, status, outstandingAmount } }
```

## Low-Level Architecture — Step by Step

### S2 (ATTACH): resolveAddon

```
====================================================================================
S2a: resolveAddon  [PRE-TRANSACTION]
────────────────────────────────────────────────────────────────────────────────────
Input:  ctx.input.addonId

Prisma query:
  addon = prisma.mandapamAddonService.findUnique({
    where: { id: ctx.input.addonId },
    include: { translations: true }
  })

  if !addon || !addon.status:
    throw AppError(400, MANDAPAM_ADDON_INACTIVE, 'Addon not available')

Output: ctx.addon = { id, enName, taName, pricingType, supportsQuantity }
  enName = addon.translations.find(t => t.language === 'EN')?.name ?? ''
  taName = addon.translations.find(t => t.language === 'TA')?.name ?? ''
====================================================================================
```

### S2 (DETACH): resolveAddonSnapshot

```
====================================================================================
S2b: resolveAddonSnapshot  [PRE-TRANSACTION]
────────────────────────────────────────────────────────────────────────────────────
Input:  ctx.snapshotId

Prisma query:
  snapshot = prisma.mandapamBookingAddonSnapshot.findUnique({
    where: { id: ctx.snapshotId }
  })

  if !snapshot || snapshot.bookingId !== ctx.id:
    throw AppError(404, ADDON_SNAPSHOT_NOT_FOUND, 'Addon snapshot not found')

Output: ctx.snapshot = full snapshot row (amount, quantity, units, pricingType, addonName)
====================================================================================
```

### S3 (ATTACH): processAttach

```
====================================================================================
S3a: ATTACH addon  [INSIDE $transaction]
────────────────────────────────────────────────────────────────────────────────────
Input:  ctx.id, ctx.input, ctx.addon

Computation:
  quantity    = ctx.input.quantity ?? 1
  units       = ctx.input.units ?? 1
  totalAmount = ctx.input.amount * quantity * units

Step A — Create addon snapshot:
  tx.mandapamBookingAddonSnapshot.create({
    data: {
      bookingId: ctx.id,
      addonId: ctx.input.addonId,
      addonName: { en: ctx.addon.enName, ta: ctx.addon.taName },
      pricingType: ctx.addon.pricingType,
      quantity: ctx.input.quantity ?? null,
      units: ctx.input.units ?? null,
      amount: ctx.input.amount,
    }
  })

Step B — Create financial ledger entry:
  insertFinancialLedger(ctx, 'ADDON', {
    en: `Addon: ${ctx.addon.enName} Rs.${ctx.input.amount} x ${quantity} x ${units}`,
    ta: `கூடுதல்: ${ctx.addon.taName}`
  }, totalAmount)

Step C — Create timeline event:
  tx.mandapamBookingTimeline.create({
    data: {
      bookingId: ctx.id,
      event: 'ADDON_ADDED',
      metadata: { addonId: ctx.input.addonId }
    }
  })

Output: none
====================================================================================
```

### S3 (DETACH): processDetach

```
====================================================================================
S3b: DETACH addon  [INSIDE $transaction]
────────────────────────────────────────────────────────────────────────────────────
Input:  ctx.id, ctx.snapshot

Computation:
  negativeAmount = -(Number(ctx.snapshot.amount) * (ctx.snapshot.quantity ?? 1) * (ctx.snapshot.units ?? 1))

Step A — Delete addon snapshot:
  tx.mandapamBookingAddonSnapshot.delete({
    where: { id: ctx.snapshot.id }
  })

Step B — Create financial adjustment:
  insertFinancialLedger(ctx, 'ADJUSTMENT', {
    en: 'Addon removed',
    ta: 'கூடுதல் அகற்றப்பட்டது'
  }, negativeAmount)

Output: none
====================================================================================
```

## Dependencies

| Step File | Role |
|-----------|------|
| `steps/resolve-booking.step.ts` | Shared |
| `steps/insert-financial-ledger.step.ts` | Shared: ADDON + ADJUSTMENT entries |
| `steps/record-timeline-event.step.ts` | Shared |
| `steps/set-booking-response.step.ts` | Shared |

## Error Scenarios

| Scenario | Step | HTTP | Code |
|----------|------|------|------|
| Addon not found / inactive | S2a | 400 | MANDAPAM_ADDON_INACTIVE |
| Snapshot not found / wrong booking | S2b | 404 | ADDON_SNAPSHOT_NOT_FOUND |
