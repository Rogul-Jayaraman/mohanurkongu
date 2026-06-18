# Pipeline 5: calendar (Frontend)

> **For beginners**: Frontend side of the availability calendar. Renders
> a grid showing which days/halls are booked, with date navigation.

## Purpose

Centralizes ALL calendar operations — 3 read variants (admin list, admin day detail, public list) and 2 write operations (block, unblock dates). Prior to this pipeline, calendar API calls were scattered across `HallAvailability.tsx` (admin), `HallAvailability.tsx` (public), and `ActionPanel.tsx` with inconsistent error handling.

**Backend Mirror:** `calendarViewPipeline` + `calendarDayPipeline` + `calendarPublicPipeline` + `calendarBlockPipeline`

## Actor & Entry

| Export | Used By | Role | API |
|---|---|---|---|
| `getAdminCalendarPipeline(from, to)` | `HallAvailability.tsx` (admin) | ADMIN | `adminGetCalendar()` |
| `getAdminCalendarDayPipeline(date)` | `ActionPanel.tsx` | ADMIN | `adminGetCalendarDay()` |
| `getPublicCalendarPipeline(from, to)` | `HallAvailability.tsx` (public) | PUBLIC | `getPublicCalendar()` |
| `blockDatesPipeline(dto)` | `BlockDatesModal.tsx`, `ActionPanel.tsx` | ADMIN | `adminBlockDates()` |
| `unblockDatesPipeline(dto)` | `ActionPanel.tsx` | ADMIN | `adminUnblockDates()` |

## High-Level Architecture

```
  ┌─────────────────────────────────────────────────────────────────┐
  │  calendar.pipeline.ts                                           │
  │                                                                 │
  │  ┌──────────────────┐  ┌───────────────────┐                   │
  │  │  READ OPS (3)    │  │  WRITE OPS (2)    │                   │
  │  │                  │  │                   │                   │
  │  │  adminList()     │  │  blockDates()     │                   │
  │  │  adminDay()      │  │  unblockDates()   │                   │
  │  │  publicList()    │  │                   │                   │
  │  │                  │  │  Pattern:          │                   │
  │  │  Pattern:         │  │   API → invalidate│                   │
  │  │   API → return   │  │   → return        │                   │
  │  └──────────────────┘  └───────────────────┘                   │
  └─────────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture — Step by Step

### Export 1: getAdminCalendarPipeline

```
getAdminCalendarPipeline(from?: string, to?: string)
│
│  INPUT:
│    from: 'YYYY-MM-DD' (default: today)
│    to:   'YYYY-MM-DD' (default: today + 90 days)
│
├── STEP 1: API CALL
│   ┌──────────────────────────────────────────────────────────────┐
│   │  execute-api.step.ts                                         │
│   │                                                              │
│   │  const response = await adminGetCalendar(from, to)           │
│   │  → GET /admin/mandapam/calendar?from=...&to=...             │
│   │  ← { entries: CalendarEntry[] }                              │
│   │                                                              │
│   │  Each CalendarEntry:                                         │
│   │  {                                                           │
│   │    date: string,         // "2026-06-15T00:00:00.000Z"      │
│   │    status: string,       // 'AVAILABLE'|'BLOCKED'            │
│   │                          // |'PARTIALLY_BOOKED'|'FULLY_BOOKED'
│   │    bookingIds?: string[],  // IDs of bookings on this date   │
│   │    reason?: { en, ta },    // block reason (if BLOCKED)      │
│   │  }                                                           │
│   └──────────────────────────────────────────────────────────────┘
│
└── RETURN: { entries }
```

### Export 2: getAdminCalendarDayPipeline

```
getAdminCalendarDayPipeline(date: string)
│
│  INPUT: date — 'YYYY-MM-DD'
│
├── STEP 1: API CALL
│   ┌──────────────────────────────────────────────────────────────┐
│   │  execute-api.step.ts                                         │
│   │                                                              │
│   │  const response = await adminGetCalendarDay(date)            │
│   │  → GET /admin/mandapam/calendar/2026-06-15                  │
│   │  ← { day: {                                                 │
│   │       status: string,                                        │
│   │       reason?: { en, ta },                                   │
│   │       bookings: [{                                           │
│   │         id, bookingNo, status,                               │
│   │         customerName: { en, ta },                             │
│   │         eventTitle: { en, ta },                               │
│   │         bookingConfig: { startDate, endDate?,                │
│   │                         startTime?, endTime?,                │
│   │                         durationHours? },                    │
│   │         bookingType, packageCode,                             │
│   │         packageSnapshot: { packageName, packagePrice },      │
│   │         totalCharges, totalPayments, totalRefunds,           │
│   │         paymentEntries: [{ amount, paymentType,              │
│   │                         paymentMethod }],                    │
│   │       }]                                                     │
│   │     }}                                                       │
│   └──────────────────────────────────────────────────────────────┘
│
└── RETURN: { day }
```

### Export 3: getPublicCalendarPipeline

```
getPublicCalendarPipeline(from?: string, to?: string)
│
├── STEP 1: API CALL
│   ┌──────────────────────────────────────────────────────────────┐
│   │  execute-api.step.ts (via publicApi — no auth token)        │
│   │                                                              │
│   │  const response = await getPublicCalendar(from, to)          │
│   │  → GET /mandapam/calendar?from=...&to=...                   │
│   │  ← { entries: { date: string, status: string }[],           │
│   │      month: string }                                         │
│   │                                                              │
│   │  Note: Public entries do NOT include bookingIds or           │
│   │  reason — only date + availability status                    │
│   └──────────────────────────────────────────────────────────────┘
│
└── RETURN: { entries, month }
```

### Export 4: blockDatesPipeline

```
blockDatesPipeline(dto: BlockDatesDto)
│
│  INPUT: { dates: string[], reason?: { en: string, ta: string } }
│
├── STEP 1: API CALL
│   ┌──────────────────────────────────────────────────────────────┐
│   │  execute-api.step.ts                                         │
│   │                                                              │
│   │  const res = await adminBlockDates(dto)                      │
│   │  → POST /admin/mandapam/calendar/block                      │
│   │  ← { entries: CalendarEntry[] } (with status: 'BLOCKED')    │
│   │                                                              │
│   │  Backend: calendarBlockPipeline(dto, 'BLOCK')               │
│   │    validateDates → checkAllDatesAvailable →                  │
│   │    forEach date: upsertCalendarEntry(BLOCKED) →              │
│   │    recordTimeline → recordAudit                             │
│   └──────────────────────────────────────────────────────────────┘
│
└── RETURN: { entries }
```

### Export 5: unblockDatesPipeline

```
unblockDatesPipeline(dto: UnblockDatesDto)
│
│  INPUT: { dates: string[] }
│
├── STEP 1: API CALL
│   ┌──────────────────────────────────────────────────────────────┐
│   │  execute-api.step.ts                                         │
│   │                                                              │
│   │  const res = await adminUnblockDates(dto)                    │
│   │  → POST /admin/mandapam/calendar/unblock                    │
│   │  ← { entries: CalendarEntry[] } (with status: 'AVAILABLE')  │
│   │                                                              │
│   │  Backend: calendarBlockPipeline(dto, 'UNBLOCK')             │
│   │    validateDates → checkAllDatesBlocked →                    │
│   │    checkNoActiveBookings → forEach date:                     │
│   │    updateCalendarEntry(AVAILABLE) →                          │
│   │    recordTimeline → recordAudit                             │
│   └──────────────────────────────────────────────────────────────┘
│
└── RETURN: { entries }
```

## React Query Hooks

```typescript
// useMandapamQueries.ts

// Admin calendar list (30s stale time)
export function useAdminCalendar(from?: string, to?: string) {
  return useQuery({
    queryKey: [...queryKeys.mandapam.calendar(), { from, to }],
    queryFn: () => getAdminCalendarPipeline(from, to),
    staleTime: 30_000,
  });
}

// Admin calendar day detail (30s stale)
export function useCalendarDay(date: string) {
  return useQuery({
    queryKey: queryKeys.mandapam.calendarDay(date),
    queryFn: () => getAdminCalendarDayPipeline(date),
    enabled: !!date,
    staleTime: 30_000,
  });
}

// Public calendar (60s stale — less frequent updates)
export function usePublicCalendar(from?: string, to?: string) {
  return useQuery({
    queryKey: ['mandapam', 'public', 'calendar', { from, to }],
    queryFn: () => getPublicCalendarPipeline(from, to),
    staleTime: 60_000,
  });
}

// useMandapamMutations.ts

// Block dates
export function useBlockDates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: BlockDatesDto) => blockDatesPipeline(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.mandapam.calendar() });
      toast.success('Dates blocked');
    },
    onError: (err) => showErrorToast(err),
  });
}

// Unblock dates (same pattern)
export function useUnblockDates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UnblockDatesDto) => unblockDatesPipeline(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.mandapam.calendar() });
      toast.success('Dates unblocked');
    },
    onError: (err) => showErrorToast(err),
  });
}
```

## Component Usage

```typescript
// HallAvailability.tsx (admin — simplified)
const { data: calendar } = useAdminCalendar(from, to);
// calendar.entries → render date grid

// ActionPanel.tsx (simplified)
const { data: dayDetail } = useCalendarDay(singleDate?.toISOString().split('T')[0]);
const blockDates = useBlockDates();
const unblockDates = useUnblockDates();

// Block
await blockDates.mutateAsync({ dates: datesToBlock, reason });

// Unblock
await unblockDates.mutateAsync({ dates: datesToUnblock });

// HallAvailability.tsx (public — simplified)
const { data: publicCal } = usePublicCalendar();
// publicCal.entries → render simplified grid
// publicCal.month → month label
```

## Error Matrix

| Export | HTTP | Backend Error Code | User Message |
|---|---|---|---|
| `blockDates` | 409 | `DATE_BLOCKED` | One or more dates already blocked |
| `blockDates` | 409 | `DATE_ALREADY_BOOKED` | One or more dates already booked |
| `unblockDates` | 400 | `INVALID_DATE_FORMAT` | Invalid date format |
| `unblockDates` | 409 | `DATE_HAS_BOOKINGS` | Cannot unblock — dates have active bookings |
| `blockDates` | 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |

## Relevant Source Files

| File | Role |
|---|---|
| `frontend/src/pipelines/mandapam/calendar.pipeline.ts` | Pipeline implementation |
| `frontend/src/api/mandapam.api.ts` | API functions (4 calendar + 2 block) |
| `frontend/src/queries/useMandapamQueries.ts` | Query hooks |
| `frontend/src/queries/useMandapamMutations.ts` | Mutation hooks |
| `frontend/src/components/features/admin/mandapam/availability/HallAvailability.tsx` | Admin calendar consumer |
| `frontend/src/components/features/admin/mandapam/ActionPanel.tsx` | Day detail + block/unblock consumer |
| `frontend/src/components/features/maaligai/HallAvailability.tsx` | Public calendar consumer |
| `frontend/src/components/modals/admin/BlockDatesModal.tsx` | Block modal consumer |
