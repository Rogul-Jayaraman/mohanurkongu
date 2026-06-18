# Pipeline 3: booking-read (Frontend)

> **For beginners**: Frontend side of viewing a single booking's details.
> Fetches booking data and renders a read-only detail page.

## Purpose

Consolidates two simple read operations under the booking domain: fetching a single booking by ID and validating a booking token number. Both follow the identical "API call → return" pattern with no write side effects.

**Backend Mirror:** `bookingGetPipeline` + `tokenValidatePipeline`

## Actor & Entry

| Export | Used By | Role |
|---|---|---|
| `getBookingPipeline(id)` | `ViewBookingModal.tsx` | ADMIN |
| `validateTokenPipeline(token)` | `useBookingForm.ts` (debounced) | ADMIN |

## High-Level Architecture

```
  ┌─────────────────────────────────────────────────────────────┐
  │  booking-read.pipeline.ts                                    │
  │                                                              │
  │    getBookingPipeline(id)                                     │
  │      │                                                       │
  │      │  useBooking(id)                                        │
  │      ▼                                                       │
  │  ┌──────────┐    ┌──────────┐    ┌────────────────────────┐ │
  │  │   API    │───►│ TRANSFORM│───►│  return { booking }    │ │
  │  │ GET      │    │ (compute │    │                        │ │
  │  │ /bookings│    │ outstand)│    │                        │ │
  │  └──────────┘    └──────────┘    └────────────────────────┘ │
  │                                                              │
  │    validateTokenPipeline(tokenNumber)                        │
  │      │                                                       │
  │      │  useTokenValidation(token)                            │
  │      ▼                                                       │
  │  ┌──────────┐    ┌────────────────────────────────────────┐ │
  │  │   API    │───►│  return { valid, availableTokens }    │ │
  │  │ POST     │    │                                        │ │
  │  │ validate │    │                                        │ │
  │  └──────────┘    └────────────────────────────────────────┘ │
  └─────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture — Step by Step

### Export 1: getBookingPipeline(id)

```
getBookingPipeline(id: string)
│
│  INPUT: id — Booking UUID
│
├── Phase 1: API CALL
│   ┌──────────────────────────────────────────────────────────────┐
│   │  execute-api.step.ts                                         │
│   │                                                              │
│   │  const response = await adminGetBooking(id)                  │
│   │                                                              │
│   │  → GET /admin/mandapam/bookings/{id}                        │
│   │    Headers: Authorization: Bearer <token>                    │
│   │                                                              │
│   │  ← 200 { success: true, data: { booking: Booking } }        │
│   │    (interceptor unwraps → { booking: Booking })              │
│   │                                                              │
│   │  Backend: bookingGetPipeline(id) → prisma with includes:    │
│   │    packageSnapshot: true,                                    │
│   │    ledgerEntries: { orderBy: createdAt },                    │
│   │    paymentEntries: { orderBy: createdAt },                   │
│   │    refundEntries: { orderBy: createdAt },                    │
│   │    settlement: true,                                         │
│   │    timeline: { orderBy: createdAt, take: 1 },               │
│   │    bookingAddonSnapshots: { include: { addon: true } }      │
│   └──────────────────────────┬───────────────────────────────────┘
│
├── Phase 2: RETURN (no transform needed)
│   ┌──────────────────────────────────────────────────────────────┐
│   │  // Backend now precomputes financial summary fields        │
│   │  // No client-side reduce() calls needed                    │
│   │  return { booking: response.booking }                       │
│   └──────────────────────────────────────────────────────────────┘
│
└──  Response shape (from backend):
    ┌──────────────────────────────────────────────────────────────┐
    │  {                                                          │
    │    ...booking,                                              │
    │    totalCharges: number,       ← sum of all ledger entries  │
    │    totalPayments: number,      ← sum of payment entries     │
    │    totalRefunds: number,       ← sum of refund entries      │
    │    outstandingAmount: number,  ← totalCharges - totalPayments│
    │                                + totalRefunds               │
    │  }                                                           │
    │                                                              │
    │  Backend: bookingGetPipeline computes these via reduce()     │
    │  before caching/receiving — replaces _outstanding (private)  │
    └──────────────────────────────────────────────────────────────┘

### Outstanding Computation

The backend now precomputes `totalCharges`, `totalPayments`, `totalRefunds`,
and `outstandingAmount` in both `bookingGetPipeline` and `bookingListPipeline`.
No client-side reduce() or manual calculation is needed.

The `BookingDetailView` and all modals use these fields with a safe fallback:
```
totalCharges = booking.totalCharges ?? ledgerEntries.reduce(...)
totalPayments = booking.totalPayments ?? paymentEntries.reduce(...)
totalRefunds = booking.totalRefunds ?? refundEntries.reduce(...)
outstanding = booking.outstandingAmount ?? (totalCharges - totalPayments + totalRefunds)
```

Components that previously had 4 separate reduce() calls now use the
precomputed values directly, reducing client-side computation.

### Export 2: validateTokenPipeline(tokenNumber)

```
validateTokenPipeline(tokenNumber: string)
│
│  INPUT: tokenNumber — string (e.g. "ROYAL-001")
│
├── Phase 1: API CALL
│   ┌──────────────────────────────────────────────────────────────┐
│   │  execute-api.step.ts                                         │
│   │                                                              │
│   │  const result = await adminValidateToken(tokenNumber)        │
│   │                                                              │
│   │  → POST /admin/mandapam/bookings/validate-token             │
│   │    Headers: Authorization: Bearer <token>                    │
│   │    Body: { tokenNumber }                                     │
│   │                                                              │
│   │  ← 200 { success: true, data: { valid: boolean,             │
│   │                              availableTokens: number } }     │
│   │    (interceptor unwraps → { valid, availableTokens })        │
│   │                                                              │
│   │  Backend: tokenValidatePipeline(tokenNumber) →               │
│   │    verify token exists, not consumed, has capacity           │
│   └──────────────────────────────────────────────────────────────┘
│
└── Phase 2: RETURN
    ┌──────────────────────────────────────────────────────────────┐
    │  return result  // { valid, availableTokens }               │
    └──────────────────────────────────────────────────────────────┘
```

## React Query Hooks

```typescript
// useMandapamQueries.ts

// Single booking fetch (enabled only when id is provided)
export function useBooking(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.mandapam.booking(id!),
    queryFn: () => getBookingPipeline(id!),
    enabled: !!id,
    staleTime: 30_000,  // 30s — booking details don't change frequently
  });
}

// Token validation (debounced, enabled only after minimum length)
export function useTokenValidation(token: string | undefined) {
  return useQuery({
    queryKey: [...queryKeys.mandapam.all, 'token-validation', token],
    queryFn: () => validateTokenPipeline(token!),
    enabled: !!token && token.length >= 4,
    staleTime: 5_000,  // 5s — re-validate if token field changes
  });
}
```

## Component Usage

```typescript
// ViewBookingModal.tsx (simplified)
const { data, isLoading } = useBooking(selectedBooking?.id);

// data.booking → render full booking details

// useBookingForm.ts (simplified — already uses useQuery!)
const debouncedToken = useDebounce(tokenNumber, 400);
const { data: tokenValidation } = useTokenValidation(
  debouncedToken.length >= 4 ? debouncedToken : undefined
);
```

## Error Matrix

| Export | HTTP | Error Code | Message |
|---|---|---|---|
| `getBookingPipeline` | 404 | `MANDAMAP_BOOKING_NOT_FOUND` | Booking not found |
| `getBookingPipeline` | 500 | `INTERNAL_ERROR` | Could not load booking details |
| `validateTokenPipeline` | 400 | `INVALID_TOKEN` | Token number is invalid |
| `validateTokenPipeline` | 400 | `INSUFFICIENT_TOKENS` | No tokens available for this number |

## Relevant Source Files

| File | Role |
|---|---|
| `frontend/src/pipelines/mandapam/booking-read.pipeline.ts` | Pipeline implementation |
| `frontend/src/api/mandapam.api.ts:adminGetBooking` | HTTP: booking fetch |
| `frontend/src/api/mandapam.api.ts:adminValidateToken` | HTTP: token validation |
| `frontend/src/queries/useMandapamQueries.ts` | Query hooks |
| `frontend/src/queries/queryKeys.ts` | Cache keys |
| `frontend/src/components/modals/admin/ViewBookingModal.tsx` | Consumer: booking |
| `frontend/src/components/modals/admin/booking/useBookingForm.ts` | Consumer: token |
