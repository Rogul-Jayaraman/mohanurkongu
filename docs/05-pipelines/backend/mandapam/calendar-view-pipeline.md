# Pipeline 8: Calendar View

> **For beginners**: A read-only pipeline that shows calendar availability.
> Month overview shows which dates are booked or free. Day detail shows
> full booking info for a specific date.

## Purpose

Unified calendar query pipeline. Two modes: `mode='list'` returns status-only entries for a date range (month overview), `mode='detail'` returns a single day's full booking data with computed financial totals (calendar day view). Replaces `BookingService.getCalendarDay()` and `BookingService.getCalendarEntries()`.

## Actor & Entry

| Route | Method | mode |
|-------|--------|------|
| `/admin/mandapam/calendar?from=&to=` | GET | `list` |
| `/admin/mandapam/calendar/:date` | GET | `detail` |
| `/mandapam/calendar?from=&to=` (PUBLIC) | GET | `list` (no auth) |

**Roles:** `ADMIN` for admin routes, none for public

## High-Level Architecture

```
  ┌─ GET /admin/mandapam/calendar?from=...&to=...  (mode: list) ───────┐
  │  GET /admin/mandapam/calendar/2026-06-15        (mode: detail)     │
  │  GET /mandapam/calendar?from=...&to=...         (mode: list, public)│
  │                                                                     │
  │  ctx = { from?, to?, date?, mode: 'list' | 'detail',              │
  │          isPublic?: boolean }                                       │
  └────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  PipelineRunner.run([S1..S3], ctx)                                   │
  │                                                                       │
  │  S1. queryCalendarEntries(ctx)                                       │
  │  ┌──────────────────────────────────────────────────────────────┐   │
  │  │  mode='list':                                                │   │
  │  │    SELECT FROM mandapam_calendar_entry                       │   │
  │  │    WHERE date BETWEEN :from AND :to                          │   │
  │  │    ORDER BY date ASC                                         │   │
  │  │    (no includes — lightweight status-only query)             │   │
  │  │                                                               │   │
  │  │  mode='detail':                                              │   │
  │  │    SELECT FROM mandapam_calendar_entry                       │   │
  │  │    WHERE date = :date                                        │   │
  │  │      INCLUDE booking (with paymentEntries, refundEntries,    │   │
  │  │              ledgerEntries, settlement, packageSnapshot)     │   │
  │  │    (returns all entries for that date — possibly multiple)   │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  │                                                                       │
  │  S2. enrichCalendarDetail(ctx)  [mode='detail' only]                │
  │  ┌──────────────────────────────────────────────────────────────┐   │
  │  │  for each booking in entries:                                │   │
  │  │    booking.totalCharges   = SUM(booking.ledger.amount)       │   │
  │  │    booking.totalPayments  = SUM(booking.payment.amount)      │   │
  │  │    booking.totalRefunds   = SUM(booking.refund.amount)       │   │
  │  │    booking._outstanding   = charges - payments + refunds     │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  │                                                                       │
  │  S3. setCalendarViewResponse(ctx)                                    │
  │  ┌──────────────────────────────────────────────────────────────┐   │
  │  │  mode='list':                                              │   │
  │  │    ├── ADMIN: { entries: [{ id, date, status, reason,     │   │
  │  │    │                  bookingId? }] }                      │   │
  │  │    └── PUBLIC: { entries: [{ date, status }],            │   │
  │  │                  month: from.substring(0,7) }             │   │
  │  │                                                           │   │
  │  │  mode='detail':                                           │   │
  │  │    mainEntry = entries[0] ?? { status: 'AVAILABLE' }     │   │
  │  │    response = { day: {                                   │   │
  │  │      status: mainEntry.status,                            │   │
  │  │      date: ctx.date,                                      │   │
  │  │      reason: mainEntry.reasonEn                          │   │
  │  │        ? { en: mainEntry.reasonEn, ta: mainEntry.reasonTa }│   │
  │  │        : null,                                            │   │
  │  │      bookings: entries.filter(e => e.booking).map(b => ({ │   │
  │  │        ...b.booking,                                      │   │
  │  │        totalCharges: b.totalCharges,                      │   │
  │  │        totalPayments: b.totalPayments,                    │   │
  │  │        totalRefunds: b.totalRefunds                       │   │
  │  │      }))                                                   │   │
  │  │    } }                                                     │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  └────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
           { entries: [] } | { day: { status, date, reason, bookings } }
```

## Dependencies

| Step File | Role |
|-----------|------|
| `steps/compute-outstanding.step.ts` | Shared: booking totals for detail mode |
