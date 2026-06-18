# Pipeline 6: Booking List

> **For beginners**: Lists bookings with filters, pagination, and computed
> totals (charges, payments, outstanding amount). Read-only — no data changes.

## Purpose

Paginated, filterable booking list with computed outstanding amounts and response metadata. Read-only pipeline. Replaces `BookingRepository.findMany()` + `enrichWithOutstanding()`.

## Actor & Entry

| Route | Method |
|-------|--------|
| `/admin/mandapam/bookings` | GET |

**Allowed Roles:** `ADMIN`

**Validation Schema:** `bookingFiltersSchema` (Zod) — `{ search?, status?, packageCode?, dateFrom?, dateTo?, page: 1, limit: 20 }`

## High-Level Architecture

```
  ┌─ GET /admin/mandapam/bookings?search=&status=&page=1&limit=20 ─────┐
  │  ctx = { filters: { search?, status?, page, limit } }              │
  └────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  PipelineRunner.run([S1..S3], ctx)                                   │
  │                                                                       │
  │  S1. buildListQuery(ctx)                                             │
  │  ┌──────────────────────────────────────────────────────────────┐   │
  │  │  Assemble Prisma WHERE from ctx.filters:                     │   │
  │  │  ┌────────────────────────────────────────────────────────┐  │   │
  │  │  │ status:      → WHERE status = :status                  │  │   │
  │  │  │ packageCode: → WHERE packageCode = :code               │  │   │
  │  │  │ search:      → WHERE OR:                              │  │   │
  │  │  │                customerName.en CONTAINS :search        │  │   │
  │  │  │                customerName.ta CONTAINS :search        │  │   │
  │  │  │                eventTitle.en CONTAINS :search          │  │   │
  │  │  │                eventTitle.ta CONTAINS :search          │  │   │
  │  │  │                bookingNo CONTAINS :search              │  │   │
  │  │  │                customerPhone CONTAINS :search          │  │   │
  │  │  └────────────────────────────────────────────────────────┘  │   │
  │  │  Compute skip = (page - 1) * limit                          │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  │                                                                       │
  │  S2. executeListQuery(ctx)                                           │
  │  ┌──────────────────────────────────────────────────────────────┐   │
  │  │  [bookings, total] = Promise.all([                         │   │
  │  │    prisma.mandapamBooking.findMany({                       │   │
  │  │      where,                                                │   │
  │  │      include: { packageSnapshot: true, settlement: true }, │   │
  │  │      orderBy: { createdAt: 'desc' },                       │   │
  │  │      skip, take: limit                                     │   │
  │  │    }),                                                     │   │
  │  │    prisma.mandapamBooking.count({ where })                 │   │
  │  │  ])                                                         │   │
  │  │                                                              │   │
  │  │  // Separate aggregation queries (avoids loading full       │   │
  │  │  // entry arrays — 4x data reduction for large lists)       │   │
  │  │  bookingIds = bookings.map(b => b.id)                      │   │
  │  │  [ledgerAgg, paymentAgg, refundAgg] = Promise.all([        │   │
  │  │    mandapamFinancialLedger.groupBy({                       │   │
  │  │      by: ['bookingId'],                                    │   │
  │  │      where: { bookingId: { in: bookingIds } },             │   │
  │  │      _sum: { amount: true }                                │   │
  │  │    }),                                                     │   │
  │  │    mandapamPaymentLedger.groupBy({ ... same ... }),        │   │
  │  │    mandapamRefundLedger.groupBy({ ... same ... })          │   │
  │  │  ])                                                         │   │
  │  │  ledgerMap = new Map(ledgerAgg.map(r=>[r.bookingId,        │   │
  │  │                                    Number(r._sum.amount)]))│   │
  │  └──────────────────────────────────────────────────────────────┘   │
  │                                                                       │
  │  S3. setListResponse(ctx)                                            │
  │  ┌──────────────────────────────────────────────────────────────┐   │
  │  │  for each booking:                                           │   │
  │  │    totalCharges   = ledgerMap.get(b.id) ?? 0                │   │
  │  │    totalPayments  = paymentMap.get(b.id) ?? 0               │   │
  │  │    totalRefunds   = refundMap.get(b.id) ?? 0                │   │
  │  │    booking.totalCharges = totalCharges                      │   │
  │  │    booking.totalPayments = totalPayments                    │   │
  │  │    booking.totalRefunds = totalRefunds                      │   │
  │  │    booking.outstandingAmount = totalCharges -               │   │
  │  │                              totalPayments + totalRefunds   │   │
  │  │                                                              │   │
  │  │  ctx.responseData = {                                       │   │
  │  │    bookings, total, page, limit,                            │   │
  │  │    totalPages: Math.ceil(total / limit)                     │   │
  │  │  }                                                           │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  └────────────────────────────────┬──────────────────────────────────────┘
                                    │
                                    ▼
            { bookings: [], total, page, limit, totalPages }
```

## Dependencies

| Step File | Role |
|-----------|------|
| `steps/compute-outstanding.step.ts` | Shared: _outstanding enrichment per row |
