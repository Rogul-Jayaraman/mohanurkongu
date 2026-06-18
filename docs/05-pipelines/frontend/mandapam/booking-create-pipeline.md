# Pipeline 1: booking-create (Frontend)

> **For beginners**: Frontend side of creating a hall booking. Multi-step
> form (hall selection, date, add-ons, payment) with validation at
> each step before submitting to the backend.

## Purpose

Replaces the inline `adminCreateBooking()` call scattered across `BookingModal.tsx` and `NewBooking.tsx`. Orchestrates validation, API submission, response transformation, and cache invalidation in a single pipeline. Mirrors backend `bookingCreatePipeline` (10-step Prisma pipeline).

## Actor & Entry

| Route | Entry Component | Role | Validation |
|---|---|---|---|
| `/admin/mandapam/new-booking` | `NewBooking.tsx` | ADMIN | `zodResolver(bookingFormSchema)` via react-hook-form |
| BookingModal (admin booking form) | `BookingModal.tsx` | ADMIN | `zodResolver(bookingFormSchema)` |

**Backend Mirror:** `bookingCreatePipeline` (12-step pipeline: resolveActivePackage → generateBookingNo → buildReservations → validate calendar → create booking → createPackageSnapshot → createLedger → createAddonSnapshots → createAddonLedger → manageCalendar → manageTokens → createPayment → recordTimeline + audit)

## High-Level Architecture

```
  Component (BookingModal / NewBooking)
       │
       │  useCreateBooking().mutateAsync(dto)
       ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  React Query Mutation Hook                                   │
  │  useMandapamMutations.useCreateBooking()                     │
  │                                                              │
  │  onSuccess: invalidate(['mandapam','bookings'])             │
  │             invalidate(['mandapam','calendar'])              │
  │  onError:   showErrorToast(err)                              │
  └──────────────────────────┬──────────────────────────────────┘
                             │ delegates to
                             ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  bookingCreatePipeline(dto: CreateBookingDto)                │
  │                                                              │
  │  ┌──────────────┐    ┌──────────────┐    ┌────────────────┐  │
  │  │ VALIDATE     │    │    API       │    │   TRANSFORM     │  │
  │  │ (optional    │───►│  POST        │───►│  enrich +      │  │
  │  │  Zod check)  │    │  /bookings   │    │  map to type   │  │
  │  └──────────────┘    └──────────────┘    └────────────────┘  │
  └─────────────────────────────────────────────────────────────┘
                             │
                             ▼
                    { booking: Booking }
```

## Low-Level Architecture — Step by Step

```
bookingCreatePipeline(dto: CreateBookingDto)
│
│  INPUT: CreateBookingDto
│  {
│    customerName:     { en: string, ta: string },
│    customerPhone:    string,
│    customerEmail?:   string,
│    eventTitle:       { en: string, ta: string },
│    eventAddress?:    { en: string, ta: string },
│    bookingType:      'HOURLY' | 'ONE_DAY' | 'TWO_DAY',
│    eventType:        EventType,
│    bookingMethod:    'NORMAL_BOOKING' | 'TOKEN_BOOKING',
│    bookingConfig:    { startDate, endDate?, startTime?,
│                        endTime?, durationHours? },
│    addonIds?:        string[],
│    addonQuantities?: Record<string, number>,
│    addons?:          AddonSelectionDto[],
│    tokenNumber?:     string,
│    tokenNumber2?:    string,
│    advanceAmount?:   number,
│    paymentMethod?:   'CASH' | 'UPI' | 'BANK_TRANSFER' |
│                      'CARD' | 'CHEQUE',
│    notes?:           string,
│  }
│
├── Phase 1: VALIDATE
│   ┌──────────────────────────────────────────────────────────────┐
│   │  Note: Validation already happens client-side via            │
│   │  react-hook-form + zodResolver(bookingFormSchema)            │
│   │  This phase is optional for the pipeline itself.             │
│   │                                                              │
│   │  Optional Zod re-validation on submission:                   │
│   │    const parsed = createBookingSchema.safeParse(dto)         │
│   │    if (!parsed.success) throw PipelineAbortError(...)        │
│   └──────────────────────────────────────────────────────────────┘
│
├── Phase 2: API CALL
│   ┌──────────────────────────────────────────────────────────────┐
│   │  execure-api.step.ts                                         │
│   │                                                              │
│   │  const response = await adminCreateBooking(dto)              │
│   │                                                              │
│   │  → POST /admin/mandapam/bookings                             │
│   │    Headers: Authorization: Bearer <token>                    │
│   │    Body:    CreateBookingDto (full)                          │
│   │                                                              │
│   │  ← 201 { success: true, data: { booking: Booking } }        │
│   │    (interceptor unwraps → { booking: Booking })               │
│   │                                                              │
│   │  Backend pipeline runs:                                      │
│   │    bookingCreatePipeline(dto, performedBy)                   │
│   │      PRE:   resolveActivePackage, generateBookingNo,        │
│   │             buildReservations                                │
│   │      TX:    manageCalendar(VALIDATE), create booking,        │
│   │             createPackageSnapshot, createFinancialLedger,    │
│   │             createAddonSnapshots+Ledger,                     │
│   │             manageCalendar(CREATE), manageTokens(CONSUME),  │
│   │             createPayment, recordTimeline, recordAudit      │
│   │      POST:  setBookingResponse → { booking }                │
│   └──────────────────────────┬───────────────────────────────────┘
│                              │
│          On HTTP error ┌─────▼──────┐
│          ← 400/404     │  Pipeline  │──→ toast.error()
│          ← 409         │  Abort     │
│          ← 500         └────────────┘
│
├── Phase 3: TRANSFORM
│   ┌──────────────────────────────────────────────────────────────┐
│   │  Optional response enrichment:                               │
│   │                                                              │
│   │  // Map backend booking to frontend Booking type             │
│   │  ctx.booking = {                                             │
│   │    ...response.booking,                                       │
│   │    // Compute derived fields if not returned by backend      │
│   │    outstanding: computeOutstanding(                          │
│   │      response.booking.ledgerEntries,                         │
│   │      response.booking.paymentEntries,                        │
│   │      response.booking.refundEntries,                         │
│   │    ),                                                        │
│   │  }                                                            │
│   └──────────────────────────────────────────────────────────────┘
│
└── Phase 4: RETURN
    ┌──────────────────────────────────────────────────────────────┐
    │  return { booking: ctx.booking }                              │
    │                                                              │
    │  Note: useCreateBooking() mutation hook handles cache        │
    │  invalidation after success:                                 │
    │    invalidate(['mandapam','bookings'])                       │
    │    invalidate(['mandapam','calendar'])                       │
    └──────────────────────────────────────────────────────────────┘
```

## React Query Hook

```typescript
// useMandapamMutations.ts
export function useCreateBooking() {
  const qc = useQueryClient();
  const { t } = useTranslation('adminMandapam');

  return useMutation({
    mutationFn: (dto: CreateBookingDto) => bookingCreatePipeline(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.mandapam.bookings() });
      qc.invalidateQueries({ queryKey: queryKeys.mandapam.calendar() });
      toast.success(t('bookings.createdToast'));
    },
    onError: (err) => showErrorToast(err),
  });
}
```

## Component Usage

```typescript
// BookingModal.tsx (simplified)
const createBooking = useCreateBooking();

const handleSubmit = async (formData: BookingFormData) => {
  try {
    const dto = formToCreateBookingDto(formData);
    const { booking } = await createBooking.mutateAsync(dto);
    onClose();
    onRefresh();
  } catch { /* handled by hook onError */ }
};
```

## Error Matrix

| HTTP | Backend Error Code | User-Facing Message |
|---|---|---|
| 400 | `MANDAMAP_PACKAGE_NOT_FOUND` | Selected package not found |
| 400 | `MANDAMAP_PACKAGE_INACTIVE` | Package is no longer active |
| 400 | `MANDAMAP_PACKAGE_NO_PRICING` | Package has no active pricing |
| 400 | `MANDAPAM_ADDON_INACTIVE` | One or more addons not available |
| 400 | `INVALID_TOKEN` | Token number is invalid |
| 400 | `INSUFFICIENT_TOKENS` | Token already consumed |
| 400 | `INVALID_DATE_FORMAT` | Invalid date format |
| 409 | `DATE_BLOCKED` | Selected date is blocked |
| 409 | `DATE_ALREADY_BOOKED` | Date is already fully booked |
| 409 | `TIME_CONFLICT` | Time slot overlaps with existing booking |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests, try again later |
| 500 | `INTERNAL_ERROR` | Something went wrong |

## Relevant Source Files

| File | Role |
|---|---|
| `frontend/src/pipelines/mandapam/booking-create.pipeline.ts` | Pipeline implementation |
| `frontend/src/pipelines/mandapam/steps/execute-api.step.ts` | API call step |
| `frontend/src/pipelines/mandapam/steps/handle-error.step.ts` | Error handler |
| `frontend/src/api/mandapam.api.ts:adminCreateBooking` | HTTP layer |
| `frontend/src/queries/useMandapamMutations.ts` | Mutation hook |
| `frontend/src/components/modals/admin/booking/BookingModal.tsx` | Consumer (admin) |
| `frontend/src/components/features/user/NewBooking.tsx` | Consumer (user/admin) |
