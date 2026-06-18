# Pipeline 2: booking-list (Frontend)

> **For beginners**: Frontend side of listing bookings. Paginated table
> with filters (status, date range) and date-based status highlighting.

## Purpose

Replaces the manual `useState` + `useEffect` + `fetchBookings()` pattern in `BookingManagement.tsx`. Fetches a paginated list of bookings with filters, handles the `sendPaginated` response shape (backend fix required), enriches bookings with computed `outstanding` field, and caches results via React Query.

## Actor & Entry

| Route | Entry Component | Role | Validation |
|---|---|---|---|
| `/admin/mandapam/bookings` | `BookingManagement.tsx` | ADMIN | `BookingFilters` schema via Zod |

**Backend Mirror:** `bookingListPipeline` (Prisma query with includes + `_outstanding` enrichment)

## High-Level Architecture

```
  BookingManagement.tsx
       │
       │  useBookingList({ page, limit, status, search })
       ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  React Query Hook                                            │
  │  useMandapamQueries.useBookingList(filters)                   │
  │                                                              │
  │  queryKey: ['mandapam', 'bookings', filters]                 │
  │  staleTime: 10_000ms (auto-refresh for booking updates)      │
  │                                                              │
  │  Returns: { data, isLoading, error, refetch }                │
  └──────────────────────────┬──────────────────────────────────┘
                             │ delegates to
                             ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  listBookingsPipeline(filters?: BookingFilters)              │
  │                                                              │
  │  ┌──────────────┐    ┌──────────────┐    ┌────────────────┐  │
  │  │ BUILD PARAMS │    │    API        │    │   RESHAPE      │  │
  │  │ normalize    │───►│  GET          │───►│  unwrap pagi-  │  │
  │  │ defaults     │    │  /bookings    │    │  nated wrapper │  │
  │  └──────────────┘    └──────────────┘    └────────────────┘  │
  │                                                              │
  │  ┌────────────────┐                                          │
  │  │   ENRICH       │──► return { bookings: Booking[],        │
  │  │  compute       │          meta: PaginationMeta }          │
  │  │  outstanding   │                                          │
  │  └────────────────┘                                          │
  └─────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture — Step by Step

```
listBookingsPipeline(filters?: BookingFilters)
│
│  INPUT: BookingFilters (optional)
│  {
│    page?:       number,      (default: 1)
│    limit?:      number,      (default: 10)
│    status?:     string,      (e.g. 'CONFIRMED', 'CANCELLED')
│    search?:     string,      (customer name, booking no, phone)
│    from?:       string,      (date range start YYYY-MM-DD)
│    to?:         string,      (date range end YYYY-MM-DD)
│    sortBy?:     string,
│    sortOrder?:  'asc' | 'desc',
│  }
│
├── Phase 1: BUILD PARAMS
│   ┌──────────────────────────────────────────────────────────────┐
│   │  Normalize filter defaults:                                  │
│   │    page  = filters.page   ?? 1                               │
│   │    limit = filters.limit  ?? 10                              │
│   │                                                              │
│   │  Only include non-empty filter values in query params:       │
│   │    if (status && status !== 'All') params.status = status    │
│   │    if (search?.trim())       params.search = search.trim()   │
│   └──────────────────────────────────────────────────────────────┘
│
├── Phase 2: API CALL
│   ┌──────────────────────────────────────────────────────────────┐
│   │  execute-api.step.ts                                         │
│   │                                                              │
│   │  const response = await adminListBookings(filters)           │
│   │                                                              │
│   │  → GET /admin/mandapam/bookings?page=1&limit=10             │
│   │    Headers: Authorization: Bearer <token>                    │
│   │                                                              │
│   │  ⚠ CRITICAL: Response shape depends on backend controller:   │
│   │                                                              │
│   │  CURRENT (sendPaginated):                                    │
│   │    { success: true, data: [...], meta: { total, page,       │
│   │      limit, totalPages } }                                   │
│   │    → Interceptor returns: [...] (raw array)                  │
│   │    → Frontend expects { bookings, meta } — MISMATCH         │
│   │                                                              │
│   │  REQUIRED (Phase 1 backend fix):                             │
│   │    sendSuccess(res, {                                        │
│   │      bookings: result.bookings,                              │
│   │      meta: { total: result.total, page: result.page,         │
│   │              limit: result.limit,                            │
│   │              totalPages: result.totalPages }                 │
│   │    })                                                        │
│   │    → Interceptor returns: { bookings, meta } ✓              │
│   └──────────────────────────┬───────────────────────────────────┘
│
├── Phase 3: RESHAPE (handle paginated wrapper)
│   ┌──────────────────────────────────────────────────────────────┐
│   │  // Handle both response formats during migration:          │
│   │  if (Array.isArray(response)) {                              │
│   │    // Old format — sendPaginated array unwrap               │
│   │    ctx.bookings = response                                   │
│   │    ctx.meta = { total: response.length, page: 1,            │
│   │               limit: response.length, totalPages: 1 }       │
│   │  } else {                                                   │
│   │    ctx.bookings = response.bookings                          │
│   │    ctx.meta = response.meta                                  │
│   │  }                                                           │
│   └──────────────────────────────────────────────────────────────┘
│
├── Phase 4: ENRICH
│   ┌──────────────────────────────────────────────────────────────┐
│   │  Compute derived fields for each booking:                    │
│   │                                                              │
│   │  ctx.bookings = ctx.bookings.map(booking => ({               │
│   │    ...booking,                                               │
│   │    // Use _outstanding from pipeline if available            │
│   │    // otherwise compute client-side                          │
│   │    outstanding: booking._outstanding ?? computeOutstanding(  │
│   │      booking.ledgerEntries,                                  │
│   │      booking.paymentEntries,                                 │
│   │      booking.refundEntries,                                  │
│   │    ),                                                        │
│   │  }))                                                          │
│   │                                                              │
│   │  where computeOutstanding =                                   │
│   │    charges - payments + refunds                               │
│   └──────────────────────────────────────────────────────────────┘
│
└── Phase 5: RETURN
    ┌──────────────────────────────────────────────────────────────┐
    │  return {                                                    │
    │    bookings: ctx.bookings,  // Booking[]                     │
    │    meta: ctx.meta,          // { total, page, limit,         │
    │  }                           //   totalPages }              │
    └──────────────────────────────────────────────────────────────┘
```

## React Query Hook

```typescript
// useMandapamQueries.ts
export function useBookingList(filters: BookingFilters) {
  return useQuery({
    queryKey: [...queryKeys.mandapam.bookings(), filters],
    queryFn: () => listBookingsPipeline(filters),
    staleTime: 10_000,  // 10s — auto-refresh after mutations
    select: (data) => ({
      bookings: data.bookings,
      meta: data.meta,
      totalPages: Math.max(1, Math.ceil(data.meta.total / data.meta.limit)),
    }),
  });
}
```

## Component Usage

```typescript
// BookingManagement.tsx (after migration)
const [filters, setFilters] = useState<BookingFilters>({
  page: 1, limit: 10, status: 'All', search: '',
});

const { data, isLoading, error, refetch } = useBookingList(filters);

// data.bookings → BookingsTable
// data.meta → pagination
// refetch → after mutation success
```

## Error Matrix

| HTTP | Backend Error Code | User-Facing Message |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Invalid filter parameters |
| 401 | `AUTH_UNAUTHORIZED` | Session expired — redirects to login |
| 500 | `INTERNAL_ERROR` | Could not load bookings |

## Relevant Source Files

| File | Role |
|---|---|
| `frontend/src/pipelines/mandapam/booking-list.pipeline.ts` | Pipeline implementation |
| `frontend/src/api/mandapam.api.ts:adminListBookings` | HTTP layer |
| `frontend/src/queries/useMandapamQueries.ts` | Query hook |
| `frontend/src/queries/queryKeys.ts` | Cache key definition |
| `frontend/src/components/features/admin/mandapam/bookings/BookingManagement.tsx` | Consumer |
| `frontend/src/components/features/admin/mandapam/bookings/BookingsTable.tsx` | Data display |
