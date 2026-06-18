# Pipeline 1: Booking Create

> **For beginners**: This is the most complex operation — creating a hall
> booking. It handles dates, addons, pricing, calendar reservation, payment
> tokens, and audit records — all in one atomic transaction (all or nothing).

## Purpose

Creates a new booking with an atomic transaction. Replaces `BookingCreateService.create()` — the most complex operation in the system. Handles package resolution, calendar validation, addon snapshots, financial ledger entries, token consumption/issuance, advance payment, timeline events, and audit logging. Supports both NORMAL_BOOKING and TOKEN_BOOKING methods.

## Actor & Entry

| Route | Method | Rate Limiter |
|-------|--------|-------------|
| `/admin/mandapam/bookings` | POST | `adminMutationLimiter` (60/window) |

**Allowed Roles:** `ADMIN` (via `requireSession` + `requireRole('ADMIN')`)

**Validation Schema:** `createBookingSchema` (Zod)
- HOURLY booking: requires `bookingConfig.startTime`, `bookingConfig.endTime`, `endTime > startTime`
- TOKEN_BOOKING: requires `tokenNumber`
- Both addon formats supported: `addons[]` (new) and `addonIds[]` + `addonQuantities` (legacy)

## High-Level Architecture

```
  ┌─ POST /admin/mandapam/bookings ──────────────────────────────────────┐
  │  ctx = { id: undefined, input: validated CreateBookingDto,           │
  │          performedBy: req.account.sub }                               │
  └────────────────────────────────┬──────────────────────────────────────┘
                                    │
                                    ▼
  ┌───────────────────────────────────────────────────────────────────────┐
  │  PipelineRunner.run([S1..S10], ctx)                                    │
  │                                                                         │
  │  PRE-TRANSACTION (S1-S3):                                              │
  │  ┌───────────────────────────────────────────────────────────────┐    │
  │  │ S1. resolveActivePackage(ctx)  ← bookingType → package+price  │    │
  │  │ S2. generateBookingNo(ctx)     ← atomic counter → KTM-XXXX    │    │
  │  │ S3. buildReservations(ctx)     ← dates + CalendarReservation[]│    │
  │  └───────────────────────────────────────────────────────────────┘    │
  │                                                                         │
  │  $transaction (S4-S10):                                                │
  │  ┌───────────────────────────────────────────────────────────────┐    │
  │  │ S4. manageCalendarReservations(ctx, 'VALIDATE')                │    │
  │  │     └── Time slot conflict detection against existing entries  │    │
  │  │                                                                │    │
  │  │ S5. insertBookingRowWithSnapshot(ctx)                         │    │
  │  │     ├── INSERT mandapam_booking                               │    │
  │  │     ├── INSERT mandapam_booking_package_snapshot              │    │
  │  │     └── IF NORMAL_BOOKING: INSERT financial_ledger (PACKAGE)  │    │
  │  │                                                                │    │
  │  │ S6. processAddonSelections(ctx)                               │    │
  │  │     ├── for each addon: INSERT addon_snapshot                 │    │
  │  │     └── for each addon: INSERT financial_ledger (ADDON)       │    │
  │  │                                                                │    │
  │  │ S7. manageCalendarReservations(ctx, 'CREATE')                  │    │
  │  │     └── INSERT calendar_entry for each reservation            │    │
  │  │                                                                │    │
  │  │ S8. manageTokens(ctx, 'CONSUME' | 'ISSUE')                   │    │
  │  │     ├── TOKEN_BOOKING → CONSUME from parent booking           │    │
  │  │     └── NORMAL_BOOKING + tokenCount > 0 → ISSUE to booking   │    │
  │  │                                                                │    │
  │  │ S9. processAdvancePayment(ctx)                                │    │
  │  │     └── IF advanceAmount > 0: INSERT payment_ledger (ADVANCE) │    │
  │  │                                                                │    │
  │  │ S10. commitBookingEvents(ctx)                                 │    │
  │  │      ├── recordTimelineEvent(ctx, 'BOOKING_CREATED')          │    │
  │  │      └── recordAuditLog(ctx, 'BOOKING_CREATED')               │    │
  │  └───────────────────────────────────────────────────────────────┘    │
  │                                                                         │
  │  POST-TRANSACTION: omitted — returns minimal shape directly            │
  └────────────────────────────────┬───────────────────────────────────────┘
                                    │
                                    ▼
                  { booking: { id, bookingNo, status: 'CONFIRMED' } }
                  (frontend redirects to detail page for full data)
```

## Low-Level Architecture — Step by Step

### S1: resolveActivePackage

```
====================================================================================
S1: resolveActivePipeline  [PRE-TRANSACTION]
────────────────────────────────────────────────────────────────────────────────────
Input:  ctx.input.bookingType ('HOURLY' | 'ONE_DAY' | 'TWO_DAY')

Prisma query:
  pkg = prisma.mandapamPackage.findFirst({
    where: { bookingType: mapping[bookingType], status: true }
  })
  // Mapping: 'HOURLY' → 'HOURLY', 'ONE_DAY'/'TWO_DAY' → 'DAY_BASED'

  if !pkg → 400 MANDAPAM_PACKAGE_INACTIVE

  pricing = prisma.mandapamPackagePricing.findFirst({
    where: { packageId: pkg.id, isActive: true },
    orderBy: { createdAt: 'desc' }
  })

  if !pricing → 400 MANDAMAP_PACKAGE_NO_PRICING

  translations = prisma.mandapamPackageTranslation.findMany({
    where: { packageId: pkg.id }
  })

  packageName = {
    en: translations.find(t=>t.language==='EN')?.displayName ?? pkg.code,
    ta: translations.find(t=>t.language==='TA')?.displayName ?? pkg.code
  }

  version = floor(max(pkg.updatedAt.getTime(), pricing.updatedAt.getTime()) / 1000)

Output: ctx.package = {
          id, code: pkg.code,
          bookingType: pkg.bookingType,
          durationType: pkg.durationType,
          durationValue: pkg.durationValue,
          pricingAmount: Number(pricing.amount),
          currencyCode: pricing.currencyCode,
          pricingType: pricing.pricingType,
          packageName, version,
          tokenCount: PACKAGE_TOKEN_MAP[pkg.code] ?? 0
        }

PACKAGE_TOKEN_MAP = { STANDARD: 0, ROYAL: 1, GRAND: 2 }

Edge Cases:
  - No active package for bookingType → 400 (all three packages must exist)
  - Package exists but no active pricing → 400 (pricing must be configured)
  - Package code not in PACKAGE_TOKEN_MAP → defaults to 0 tokens
====================================================================================
```

### S2: generateBookingNo

```
====================================================================================
S2: generateBookingNo  [PRE-TRANSACTION]
────────────────────────────────────────────────────────────────────────────────────
Input:  none

Logic:  (atomic counter — runs before main transaction)
  counter = prisma.counter.upsert({
    where: { prefix: 'KTM' },
    update: { counter: { increment: 1 } },
    create: { prefix: 'KTM', counter: 1 }
  })

Output: ctx.bookingNo = 'KTM-' + String(counter.counter).padStart(4, '0')

Edge Cases:
  - First booking → 'KTM-0001'
  - Counter increments even if main transaction rolls back → acceptable (no gap-free requirement)
====================================================================================
```

### S3: buildReservations

```
====================================================================================
S3: buildReservations  [PRE-TRANSACTION]
────────────────────────────────────────────────────────────────────────────────────
Input:  ctx.input.bookingType, ctx.input.bookingConfig
        { startDate, endDate?, startTime?, endTime?, durationHours? }

Logic:
  ┌─ HOURLY ────────────────────────────────────────────────────────────┐
  │  dates = [startDate]                                                │
  │  reservations = [{                                                  │
  │    date: new Date(startDate + 'T00:00:00.000Z'),                    │
  │    startTime, endTime                                               │
  │  }]                                                                 │
  │  // Hourly bookings occupy partial time slots (PARTIALLY_BOOKED)    │
  └──────────────────────────────────────────────────────────────────────┘
  ┌─ ONE_DAY ───────────────────────────────────────────────────────────┐
  │  dates = [startDate]                                                │
  │  reservations = [{ date: new Date(startDate + 'T00:00:00.000Z') }] │
  │  // Full day = no startTime/endTime → status FULLY_BOOKED           │
  └──────────────────────────────────────────────────────────────────────┘
  ┌─ TWO_DAY ───────────────────────────────────────────────────────────┐
  │  dates = [startDate, endDate]                                       │
  │  reservations = dates.map(d => ({ date: new Date(d) }))            │
  │  // Each day is FULLY_BOOKED                                        │
  └──────────────────────────────────────────────────────────────────────┘

Output: ctx.dates = string[] (YYYY-MM-DD array for calendar operations)
        ctx.reservations = CalendarReservation[] (for validation + creation)
====================================================================================
```

### S4: manageCalendarReservations (VALIDATE)

```
====================================================================================
S4: manageCalendarReservations(ctx, 'VALIDATE')  [INSIDE $transaction]
────────────────────────────────────────────────────────────────────────────────────
Input:  ctx.reservations

Logic:
  for each reservation r:
    entries = tx.mandapamCalendarEntry.findMany({ where: { date: r.date } })

    if entries.length === 0 → continue

    for each entry:
      if entry.status === 'BLOCKED':
        throw 409 DATE_BLOCKED, `Date is blocked`
      if entry.status === 'FULLY_BOOKED':
        throw 409 DATE_ALREADY_BOOKED, `Date is fully booked`
      if !r.startTime || !r.endTime:
        throw 409 TIME_CONFLICT, `Full day not available — has hourly bookings`
      if entry.startTime && entry.endTime:
        newStart = r.startTime, newEnd = r.endTime
        existingStart = entry.startTime, existingEnd = entry.endTime
        if newStart < existingEnd && newEnd > existingStart:
          throw 409 TIME_CONFLICT, `Time slot conflicts`

     Edge Cases:
       - No existing entries → date is AVAILABLE, pass through
       - PARTIALLY_BOOKED + full-day reservation → reject (can't book full day on partial day)
       - Time overlap: uses half-open interval check [start, end) overlap
====================================================================================
```

### S5: insertBookingRowWithSnapshot

```
====================================================================================
S5: insertBookingRowWithSnapshot  [INSIDE $transaction]
────────────────────────────────────────────────────────────────────────────────────
Input:  ctx.bookingNo, ctx.package, ctx.input, ctx.performedBy

Logic:
  booking = tx.mandapamBooking.create({
    data: {
      bookingNo: ctx.bookingNo,
      customerId: ctx.performedBy,
      customerName: ctx.input.customerName,       ← { en, ta }
      customerPhone: ctx.input.customerPhone,
      customerEmail: ctx.input.customerEmail ?? null,
      eventTitle: ctx.input.eventTitle,            ← { en, ta }
      eventAddress: ctx.input.eventAddress ?? Prisma.skip,
      status: 'CONFIRMED',
      bookingMethod: ctx.input.bookingMethod,
      bookingType: ctx.input.bookingType,
      eventType: ctx.input.eventType ?? 'OTHER',
      packageCode: ctx.package.code,
      bookingConfig: ctx.input.bookingConfig,      ← JSON
      notes: null,
      createdBy: ctx.performedBy,
    }
  })

  // Snapshot — frozen copy of selected package
  tx.mandapamBookingPackageSnapshot.create({
    data: {
      bookingId: booking.id,
      packageId: ctx.package.id,
      packageCode: ctx.package.code,
      packageName: ctx.package.packageName,       ← { en, ta }
      packagePrice: ctx.package.pricingAmount,
      packageVersion: ctx.package.version,
    }
  })

  // Package charge — only for NORMAL_BOOKING
  if ctx.input.bookingMethod !== 'TOKEN_BOOKING':
    amount = ctx.input.bookingType === 'HOURLY' && ctx.input.bookingConfig.durationHours
      ? ctx.package.pricingAmount * ctx.input.bookingConfig.durationHours
      : ctx.package.pricingAmount

    isHourly = ctx.input.bookingType === 'HOURLY' && ctx.input.bookingConfig.durationHours
    description = isHourly
      ? { en: `Package charge (${ctx.package.pricingAmount} x ${ctx.input.bookingConfig.durationHours}h)`,
          ta: `தொகுப்பு கட்டணம் (${ctx.package.pricingAmount} x ${ctx.input.bookingConfig.durationHours}h)` }
      : { en: 'Package charge', ta: 'தொகுப்பு கட்டணம்' }

    tx.mandapamFinancialLedger.create({
      data: { bookingId: booking.id, source: 'PACKAGE', description, amount }
    })

Output: ctx.id = booking.id

Computation Detail:
  HOURLY + durationHours: amount = pricingAmount x durationHours   ← pro-rated
  HOURLY + no durationHours: amount = pricingAmount                ← flat hourly rate
  ONE_DAY/TWO_DAY: amount = pricingAmount                          ← fixed package price
  TOKEN_BOOKING: no package charge entry                           ← prepaid via tokens
====================================================================================
```

### S6: processAddonSelections

```
====================================================================================
S6: processAddonSelections  [INSIDE $transaction]
────────────────────────────────────────────────────────────────────────────────────
Input:  ctx.id, ctx.input.addons[] (new format) OR ctx.input.addonIds[] (legacy)

Resolution:
  if ctx.input.addons?.length:
    selections = ctx.input.addons      // [{ addonId, amount, quantity?, units? }]
  else:
    selections = ctx.input.addonIds.map(id => ({
      addonId: id,
      amount: 0,
      quantity: (ctx.input.addonQuantities ?? {})[id] ?? 1
    }))

  if selections.length === 0 → return (skip)

  addonIds = selections.map(s => s.addonId)
  addons = tx.mandapamAddonService.findMany({
    where: { id: { in: addonIds }, status: true },
    include: { translations: true }
  })

  if addons.length !== addonIds.length:
    throw 400 MANDAPAM_ADDON_INACTIVE

  addonMap = new Map(addons.map(a => [a.id, a]))

  for each selection:
    addon = addonMap.get(selection.addonId)
    enName = addon.translations.find(t=>t.language==='EN')?.name ?? ''
    taName = addon.translations.find(t=>t.language==='TA')?.name ?? ''
    pricingType = addon.pricingType ?? 'PER_EVENT'

    quantity = selection.quantity ?? 1
    units = selection.units ?? 1
    totalAmount = selection.amount * quantity * units

    // Snapshot
    tx.mandapamBookingAddonSnapshot.create({
      data: {
        bookingId: ctx.id,
        addonId: addon.id,
        addonName: { en: enName, ta: taName },
        pricingType,
        quantity: selection.quantity ?? null,
        units: selection.units ?? null,
        amount: selection.amount,
      }
    })

    // Financial ledger
    descParts = [enName]
    if selection.amount > 0: descParts.push(`₹${selection.amount}`)
    if (selection.quantity ?? 1) > 1: descParts.push(`x ${selection.quantity}`)
    if (selection.units ?? 1) > 1: descParts.push(`x ${selection.units}${pricingType==='PER_HOUR'?'h':'d'}`)

    tx.mandapamFinancialLedger.create({
      data: {
        bookingId: ctx.id,
        source: 'ADDON',
        description: { en: `Addon: ${descParts.join(' ')}`, ta: `கூடுதல்: ${taName}` },
        amount: totalAmount,
      }
    })

Output: none

Edge Cases:
  - Legacy addonIds[] format: auto-converts to addons[] with amount=0 and quantity from map
  - Addon with amount=0: snapshot created with zero-value ledger entry
  - Addon not found or inactive: full transaction rolls back
====================================================================================
```

### S7: manageCalendarReservations (CREATE)

```
====================================================================================
S7: manageCalendarReservations(ctx, 'CREATE')  [INSIDE $transaction]
────────────────────────────────────────────────────────────────────────────────────
Input:  ctx.id (bookingId), ctx.reservations

Logic:
  for each reservation r:
    existing = tx.mandapamCalendarEntry.findFirst({
      where: { date: r.date, bookingId: ctx.id }
    })
    if existing → continue (idempotent — skip duplicate)

    isFullDay = !r.startTime && !r.endTime

    tx.mandapamCalendarEntry.create({
      data: {
        date: r.date,
        startTime: r.startTime ? timeToDate(r.date, r.startTime) : null,
        endTime: r.endTime ? timeToDate(r.date, r.endTime) : null,
        status: isFullDay ? 'FULLY_BOOKED' : 'PARTIALLY_BOOKED',
        bookingId: ctx.id,
      }
    })

Helper:
  timeToDate(date, time): new Date(date) with hours/minutes from time string pushed to UTC

Output: none
====================================================================================
```

### S8: manageTokens

```
====================================================================================
S8: manageTokens(ctx, 'ISSUE' | 'CONSUME')  [INSIDE $transaction]
────────────────────────────────────────────────────────────────────────────────────
Input:  ctx.id, ctx.input.bookingMethod, ctx.package.tokenCount, ctx.input.tokenNumber?

ISSUE (NORMAL_BOOKING):
  if ctx.package.tokenCount <= 0 → return
  tx.mandapamTokenConsumption.create({
    data: { bookingId: ctx.id, tokens: ctx.package.tokenCount, state: 'ISSUED' }
  })

CONSUME (TOKEN_BOOKING):
  tokenCount = PACKAGE_TOKEN_MAP[ctx.package.code] ?? 0
  if tokenCount <= 0 || !ctx.input.tokenNumber → return

  parent = tx.mandapamBooking.findUnique({
    where: { bookingNo: ctx.input.tokenNumber },
    include: { tokenEntries: true }
  })
  if !parent → throw 400 INVALID_TOKEN

  issued   = sum(parent.tokenEntries.filter(e=>e.state==='ISSUED').map(e=>e.tokens))
  consumed = sum(parent.tokenEntries.filter(e=>e.state==='CONSUMED').map(e=>e.tokens))
  reversed = sum(parent.tokenEntries.filter(e=>e.state==='REVERSED').map(e=>e.tokens))
  available = issued - consumed - reversed

  if available < tokenCount → throw 400 INSUFFICIENT_TOKENS

  // Consume oldest ISSUED entries first
  toConsume = tokenCount
  for entry in parent.tokenEntries sorted by consumedAt asc:
    if toConsume <= 0 → break
    if entry.state === 'ISSUED':
      consumeNow = min(toConsume, entry.tokens)
      tx.mandapamTokenConsumption.update({
        where: { id: entry.id },
        data: { state: 'CONSUMED' }
      })
      toConsume -= consumeNow

  // Record consumption on current booking
  tx.mandapamTokenConsumption.create({
    data: { bookingId: ctx.id, tokens: tokenCount, state: 'CONSUMED' }
  })

Computation:
  Available tokens = Total ISSUED - Total CONSUMED - Total REVERSED
  ROYAL → 1 token consumed, GRAND → 2 tokens consumed, STANDARD → 0 tokens consumed

Edge Cases:
  - NORMAL_BOOKING with STANDARD package: tokenCount=0 → skip
  - TOKEN_BOOKING without tokenNumber → skip (validated at schema level)
  - Parent booking has insufficient tokens → 400, full rollback
====================================================================================
```

### S9: processAdvancePayment

```
====================================================================================
S9: processAdvancePayment  [INSIDE $transaction]
────────────────────────────────────────────────────────────────────────────────────
Input:  ctx.id, ctx.input.advanceAmount, ctx.input.paymentMethod

Logic:
  if !ctx.input.advanceAmount || ctx.input.advanceAmount <= 0 → return

  tx.mandapamPaymentLedger.create({
    data: {
      bookingId: ctx.id,
      paymentType: 'ADVANCE',
      paymentMethod: ctx.input.paymentMethod ?? 'CASH',
      amount: ctx.input.advanceAmount,
    }
  })

Output: none
====================================================================================
```

### S10: commitBookingEvents

```
====================================================================================
S10: commitBookingEvents  [INSIDE $transaction]
────────────────────────────────────────────────────────────────────────────────────
Input:  ctx.id, ctx.package, ctx.input, ctx.performedBy

Logic:
  tx.mandapamBookingTimeline.create({
    data: {
      bookingId: ctx.id,
      event: 'BOOKING_CREATED',
      metadata: {
        packageCode: ctx.package.code,
        bookingType: ctx.input.bookingType,
        amount: ctx.package.pricingAmount
      }
    }
  })

  tx.mandapamAuditLog.create({
    data: {
      bookingId: ctx.id,
      action: 'BOOKING_CREATED',
      performedBy: ctx.performedBy,
      metadata: { dto: JSON.parse(JSON.stringify(ctx.input)) }
    }
  })

Output: none
====================================================================================
```
### S11: Response (implicitly omitted)

```

====================================================================================
S11: Response  [POST-TRANSACTION — omitted]
────────────────────────────────────────────────────────────────────────────────────
The booking-create pipeline does NOT run a post-transaction response step.

Instead, ctx.id and ctx.bookingNo (set during S5) are used to return:
  { booking: { id: ctx.id, bookingNo: ctx.bookingNo, status: 'CONFIRMED' } }

Rationale:
  - The frontend immediately redirects to the detail page after creation
  - Fetching the full booking is wasteful — the detail page query handles it
  - This eliminates one full DB query per booking creation (~12 table joins)
====================================================================================
```

## Dependencies

| Step File | Role |
|-----------|------|
| `steps/resolve-active-package.step.ts` | Pipeline-specific: resolve active package + pricing by bookingType |
| `steps/generate-booking-no.step.ts` | Pipeline-specific: atomic KTM-XXXX counter |
| `steps/build-reservations.step.ts` | Pipeline-specific: compute date range + CalendarReservation[] |
| `steps/manage-calendar-reservations.step.ts` | Shared: VALIDATE + CREATE sub-actions |
| `steps/manage-tokens.step.ts` | Shared: ISSUE + CONSUME sub-actions |
| `steps/insert-financial-ledger.step.ts` | Shared: PACKAGE + ADDON ledger entries |
| `steps/record-timeline-event.step.ts` | Shared: BOOKING_CREATED event |
| `steps/record-audit-log.step.ts` | Shared: BOOKING_CREATED audit |
| _(response built inline from ctx.id / ctx.bookingNo)_ | No post-transaction step; returns minimal shape directly |

## Error Scenarios

| Scenario | Step | HTTP | Code |
|----------|------|------|------|
| No active package for bookingType | S1 | 400 | MANDAPAM_PACKAGE_INACTIVE |
| No active pricing for package | S1 | 400 | MANDAMAP_PACKAGE_NO_PRICING |
| Date blocked | S4 | 409 | DATE_BLOCKED |
| Date fully booked | S4 | 409 | DATE_ALREADY_BOOKED |
| Time slot conflict | S4 | 409 | TIME_CONFLICT |
| Full day on partially booked date | S4 | 409 | TIME_CONFLICT |
| Addon not found or inactive | S6 | 400 | MANDAPAM_ADDON_INACTIVE |
| Token source booking not found | S8 | 400 | INVALID_TOKEN |
| Insufficient tokens | S8 | 400 | INSUFFICIENT_TOKENS |

## Audit Events

| Event | Payload | When |
|-------|---------|------|
| `BOOKING_CREATED` | `{ dto: CreateBookingDto }` | Successful booking creation |

## Testing Considerations

- **HOURLY booking with time overlap**: Create two bookings with overlapping times on same date → second should 409
- **TOKEN_BOOKING with insufficient tokens**: Try to consume more tokens than available → 400
- **TOKEN_BOOKING with invalid token number**: Use non-existent bookingNo → 400
- **NORMAL_BOOKING token issuance**: Verify token_consumption row created with state='ISSUED'
- **Advance payment test**: Verify payment_ledger row created with correct amount
- **Addon selection test**: Verify both addon_snapshot and financial_ledger rows created
- **Rollback test**: Force error mid-transaction (e.g., invalid addonId) → verify NO partial rows
- **Race condition**: Two concurrent booking creates for same date/time → second should 409
