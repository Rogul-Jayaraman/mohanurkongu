# Pipeline 7: Calendar Block

> **For beginners**: Admins can block dates so no one can book them
> (maintenance, holidays, private events). This pipeline also handles
> unblocking dates.

## Purpose

Block or unblock dates on the mandapam calendar. BLOCK validates availability and inserts BLOCKED calendar entries with optional bilingual reason. UNBLOCK validates no active bookings exist and deletes entries. Replaces `BookingService.blockDates()` and `BookingService.unblockDates()`.

## Actor & Entry

| Route | Method | action |
|-------|--------|--------|
| `/admin/mandapam/calendar/block` | POST | `BLOCK` |
| `/admin/mandapam/calendar/unblock` | POST | `UNBLOCK` |

**Allowed Roles:** `ADMIN`

**Validation Schema:** `blockDatesSchema` (BLOCK) / `unblockDatesSchema` (UNBLOCK) — both require `dates: string[]` with regex `^\d{4}-\d{2}-\d{2}$`

## High-Level Architecture

```
  ┌─ POST /admin/mandapam/calendar/block ──────────────────────────────┐
  │  POST /admin/mandapam/calendar/unblock                             │
  │  ctx = { action: 'BLOCK' | 'UNBLOCK', dates: string[],           │
  │          reason?: LocalizedText }                                  │
  └────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  PipelineRunner.run([S1..S3], ctx)                                   │
  │                                                                       │
  │  S1. validateDates(ctx)                                              │
  │  ┌──────────────────────────────────────────────────────────────┐   │
  │  │  for each date in ctx.dates:                                 │   │
  │  │    if !date.match(/^\d{4}-\d{2}-\d{2}$/):                   │   │
  │  │      throw 400 INVALID_DATE_FORMAT                           │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  │                                                                       │
  │  $transaction (S2):                                                 │
  │  ┌──────────────────────────────────────────────────────────────┐   │
  │  │  BLOCK:                                                    │   │
  │  │  for each date:                                             │   │
  │  │    existing = SELECT * FROM mandapam_calendar_entry         │   │
  │  │               WHERE date = :date                            │   │
  │  │    if existing AND existing.status !== 'AVAILABLE':         │   │
  │  │      throw 409 DATE_ALREADY_BOOKED                          │   │
  │  │                                                              │   │
  │  │    INSERT mandapam_calendar_entry (date, status: 'BLOCKED', │   │
  │  │      reasonEn: ctx.reason?.en, reasonTa: ctx.reason?.ta)   │   │
  │  │                                                              │   │
  │  │  UNBLOCK:                                                  │   │
  │  │  for each date:                                             │   │
  │  │    entries = SELECT * FROM mandapam_calendar_entry          │   │
  │  │              WHERE date = :date                              │   │
  │  │    if any entry.status === 'FULLY_BOOKED':                   │   │
  │  │      throw 409 DATE_HAS_BOOKINGS                             │   │
  │  │    DELETE FROM mandapam_calendar_entry WHERE id IN (:ids)   │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  │                                                                       │
  │  S3. setCalendarResponse(ctx)                                        │
  │  ┌──────────────────────────────────────────────────────────────┐   │
  │  │  entries = SELECT * FROM mandapam_calendar_entry            │   │
  │  │            WHERE date BETWEEN :minDate AND :maxDate          │   │
  │  │            ORDER BY date ASC                                 │   │
  │  │  ctx.responseData = { entries }                             │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  └────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
                       { entries: CalendarEntry[] }
```

## Error Scenarios

| Scenario | Step | HTTP | Code |
|----------|------|------|------|
| Invalid date format | S1 | 400 | INVALID_DATE_FORMAT |
| Block already-blocked date | S2 (BLOCK) | 409 | DATE_ALREADY_BOOKED |
| Block already-booked date | S2 (BLOCK) | 409 | DATE_ALREADY_BOOKED |
| Unblock date with active bookings | S2 (UNBLOCK) | 409 | DATE_HAS_BOOKINGS |
