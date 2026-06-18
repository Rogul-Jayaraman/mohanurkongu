# Pipeline 4: booking-write (Frontend)

> **For beginners**: Frontend side of editing or canceling a booking.
> Handles the cancellation flow with reason input and confirmation.

## Purpose

Consolidates **all 6 booking mutation operations** (status update, settlement, payment, refund, addon attach, addon detach) into a single pipeline file. These 6 operations share the **identical execution pattern**: dispatch API call → invalidate cache → return. Merging them eliminates 5 redundant pipeline files.

**Backend Mirror:** `bookingStatusPipeline` + `bookingSettlementPipeline` + `financialTransactionPipeline` + `bookingAddonPipeline`

## Actor & Entry

| Export | Backend Route | Used By |
|---|---|---|
| `bookingStatusPipeline(id, dto)` | `PATCH /bookings/{id}/status` | `BookingManagement.tsx`, `CancelRefundModal` |
| `settlementPipeline(id, dto)` | `POST /bookings/{id}/settlement` | `BookingManagement.tsx` |
| `paymentPipeline(id, dto)` | `POST /bookings/{id}/payments` | `AddPaymentModal`, `CompleteBookingModal` |
| `refundPipeline(id, dto)` | `POST /bookings/{id}/refunds` | `CancelRefundModal` |
| `attachAddonPipeline(id, dto)` | `POST /bookings/{id}/addons` | `ViewBookingModal` |
| `detachAddonPipeline(bookingId, snapshotId)` | `DELETE /bookings/{id}/addons/{snapshotId}` | `ViewBookingModal` |

## High-Level Architecture

```
  Component (BookingManagement / Modal)
       │
       │  useUpdateStatus({ id, dto })
       │  useAddPayment({ id, dto })
       │  useAttachAddon({ id, dto })
       ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  React Query Mutation Hooks                                  │
  │  useMandapamMutations                                        │
  │                                                              │
  │  Each mutation:                                              │
  │    onSuccess: invalidate(['mandapam','bookings'])            │
  │               invalidate(['mandapam','bookings', id])        │
  │    onError:   showErrorToast(err)                            │
  └──────────────────────────┬──────────────────────────────────┘
                             │ delegates to
                             ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  bookingWritePipeline(action: BookingWriteAction)            │
  │                                                              │
  │  ┌──────────────┐    ┌──────────────┐    ┌───────────────┐  │
  │  │   DISPATCH   │───►│    API        │───►│   RETURN      │  │
  │  │  switch by   │    │  (6 routes)   │    │  { booking }  │  │
  │  │  action.type │    │              │    │               │  │
  │  └──────────────┘    └──────────────┘    └───────────────┘  │
  └─────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture — Step by Step

```
bookingWritePipeline action via discriminated union
│
│  INPUT: BookingWriteAction (discriminated union)
│
│  type BookingWriteAction =
│    { type: 'STATUS';        id: string; dto: UpdateStatusDto }
│    { type: 'SETTLEMENT';    id: string; dto: SettlementActionDto }
│    { type: 'PAYMENT';       id: string; dto: AddPaymentDto }
│    { type: 'REFUND';        id: string; dto: AddRefundDto }
│    { type: 'ATTACH_ADDON';  id: string; dto: AddAddonDto }
│    { type: 'DETACH_ADDON';  bookingId: string; snapshotId: string }
│
├── Phase 1: DISPATCH (route selector)
│   ┌──────────────────────────────────────────────────────────────┐
│   │  switch (action.type) {                                      │
│   │    case 'STATUS':                                            │
│   │      apiFn = () => adminUpdateBookingStatus(action.id,       │
│   │                                              action.dto)     │
│   │      // → PATCH /admin/mandapam/bookings/{id}/status        │
│   │      // Body: { status, notes? }                             │
│   │                                                              │
│   │    case 'SETTLEMENT':                                        │
│   │      apiFn = () => adminSettlementAction(action.id,          │
│   │                                       action.dto)            │
│   │      // → POST /admin/mandapam/bookings/{id}/settlement     │
│   │      // Body: { action, finalAmount?, charges?, notes? }    │
│   │                                                              │
│   │    case 'PAYMENT':                                           │
│   │      apiFn = () => adminAddPayment(action.id, action.dto)    │
│   │      // → POST /admin/mandapam/bookings/{id}/payments       │
│   │      // Body: { paymentType, paymentMethod, amount,         │
│   │      //         notes? }                                    │
│   │                                                              │
│   │    case 'REFUND':                                            │
│   │      apiFn = () => adminAddRefund(action.id, action.dto)     │
│   │      // → POST /admin/mandapam/bookings/{id}/refunds        │
│   │      // Body: { refundType, refundMethod, amount, reason? } │
│   │                                                              │
│   │    case 'ATTACH_ADDON':                                      │
│   │      apiFn = () => adminAddAddon(action.id, action.dto)      │
│   │      // → POST /admin/mandapam/bookings/{id}/addons         │
│   │      // Body: { addonId, amount, quantity?, units? }        │
│   │                                                              │
│   │    case 'DETACH_ADDON':                                      │
│   │      apiFn = () => adminRemoveAddon(action.bookingId,        │
│   │                                   action.snapshotId)         │
│   │      // → DELETE /admin/mandapam/bookings/{id}/addons/      │
│   │      //         {snapshotId}                                 │
│   │  }                                                           │
│   └──────────────────────────┬───────────────────────────────────┘
│
├── Phase 2: API CALL
│   ┌──────────────────────────────────────────────────────────────┐
│   │  execute-api.step.ts                                         │
│   │                                                              │
│   │  const response = await apiFn()                              │
│   │                                                              │
│   │  ← { booking: { id, bookingNo, status, outstandingAmount } }│
│   │     (minimal shape — full booking is refetched via cache    │
│   │      invalidation)                                          │
│   │                                                              │
│   │  Backend pipelines run:                                       │
│   │    STATUS → resolveBooking → updateBookingStatus →          │
│   │             manageCalendar(RELEASE) → manageTokens(REVERSE) │
│   │             → upsertSettlement → timeline → audit           │
│   │             → setMutationResponse (aggregate, not refetch)  │
│   │                                                              │
│   │    SETTLEMENT → resolveBooking → upsertSettlement           │
│   │                → insertFinancialLedger → timeline → audit   │
│   │                → setMutationResponse                        │
│   │                                                              │
│   │    PAYMENT → resolveBooking → insertPaymentLedger           │
│   │             → timeline → audit                               │
│   │             → setMutationResponse                           │
│   │                                                              │
│   │    REFUND → resolveBooking → insertRefundLedger             │
│   │            → timeline → audit                                │
│   │            → setMutationResponse                            │
│   │                                                              │
│   │    ATTACH_ADDON → resolveBooking → createAddonSnapshot      │
│   │                  → insertFinancialLedger → timeline → audit │
│   │                  → setMutationResponse                      │
│   │                                                              │
│   │    DETACH_ADDON → resolveBooking → deleteAddonSnapshot      │
│   │                  → insertFinancialLedger → timeline → audit │
│   │                  → setMutationResponse                      │
│   └──────────────────────────┬───────────────────────────────────┘
│
└── Phase 3: RETURN
    ┌──────────────────────────────────────────────────────────────┐
    │  return { booking: response.booking }                        │
    │                                                              │
    │  Cache invalidation happens in the mutation hook:           │
    │    invalidate(['mandapam', 'bookings'])                     │
    │    invalidate(['mandapam', 'bookings', id])                 │
    │    invalidate(['mandapam', 'calendar'])  // if status       │
    │                                              changed        │
    │                                                              │
    │  Optimistic update (useBookingWrite hook):                  │
    │    onMutate: snapshot cache, patch status + outstanding     │
    │    onError:  restore snapshot (ctx.prev)                    │
    │    onSuccess: invalidate (reconcile with real data)         │
    └──────────────────────────────────────────────────────────────┘
```

## React Query Hooks

All 6 mutation operations are consolidated into a single `useBookingWrite` hook with **optimistic updates**:

```typescript
// useMandapamMutations.ts (single consolidated hook)

export function useBookingWrite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BookingWriteInput) => bookingWritePipeline(input),

    onMutate: async (vars) => {
      // Snapshot current cache
      await qc.cancelQueries({ queryKey: queryKeys.mandapam.booking(vars.bookingId) });
      const prev = qc.getQueryData(queryKeys.mandapam.booking(vars.bookingId));

      // Optimistically patch status + outstandingAmount based on action
      qc.setQueryData(queryKeys.mandapam.booking(vars.bookingId), (old: any) => {
        if (!old?.booking) return old;
        let { status, outstandingAmount } = old.booking;

        switch (vars.action.type) {
          case 'payment':
            outstandingAmount = Math.max(0, outstandingAmount - amount);
            if (outstandingAmount === 0) status = 'COMPLETED';
            break;
          case 'status':
            if (vars.action.status === 'CANCELLED') outstandingAmount = 0;
            status = vars.action.status;
            break;
          // ... (refund, charge, settlement, addon all follow similar patterns)
        }

        return { ...old, booking: { ...old.booking, status, outstandingAmount } };
      });

      return { prev };  // ← for rollback on error
    },

    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: queryKeys.mandapam.booking(vars.bookingId)
      });
      qc.invalidateQueries({ queryKey: queryKeys.mandapam.bookings() });
      qc.invalidateQueries({ queryKey: queryKeys.mandapam.calendar() });
      toast.success('Booking updated');
    },

    onError: (err, vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(
        queryKeys.mandapam.booking(vars.bookingId), ctx.prev
      );
      toast.error(getErrorMessage(err));
    },
  });
}
```

## Component Usage

```typescript
// BookingManagement.tsx (simplified)
const updateStatus = useUpdateBookingStatus();
const addPayment = useAddPayment();
const settlement = useSettlementAction();

const handleCancel = async (booking: Booking) => {
  await updateStatus.mutateAsync({
    id: booking.id,
    dto: { status: 'CANCELLED', notes: reason },
  });
  refetch();
};

// AddPaymentModal.tsx (simplified)
const addPayment = useAddPayment();

const handleConfirm = async (amount: number, method: string) => {
  await addPayment.mutateAsync({
    id: booking.id,
    dto: {
      paymentType: 'INSTALLMENT',
      paymentMethod: method as PaymentMethod,
      amount,
    },
  });
  onClose();
};
```

## Error Matrix

| Export | HTTP | Backend Error Code | User Message |
|---|---|---|---|
| `STATUS` | 400 | `INVALID_STATUS_TRANSITION` | Cannot change to this status from current |
| `STATUS` | 400 | `BOOKING_CANCELLED` | Cannot modify cancelled booking |
| `STATUS` | 409 | `DATE_HAS_BOOKINGS` | Cannot cancel — calendar entries exist |
| `SETTLEMENT` | 400 | `INVALID_SETTLEMENT_STATE` | Settlement not allowed in current state |
| `SETTLEMENT` | 400 | `DISCOUNT_EXCEEDS_CHARGES` | Discount exceeds outstanding charges |
| `PAYMENT` | 400 | `BOOKING_CANCELLED` | Cannot add payment to cancelled booking |
| `PAYMENT` | 400 | `INVALID_AMOUNT` | Amount must be positive |
| `REFUND` | 400 | `BOOKING_CANCELLED` | Refund not allowed |
| `REFUND` | 400 | `INVALID_AMOUNT` | Amount must be positive |
| `ATTACH_ADDON` | 400 | `MANDAMAP_ADDON_INACTIVE` | Addon not available |
| `ATTACH_ADDON` | 400 | `ADDON_SNAPSHOT_NOT_FOUND` | Addon snapshot not found |
| `DETACH_ADDON` | 400 | `ADDON_SNAPSHOT_NOT_FOUND` | Addon snapshot not found |

## Relevant Source Files

| File | Role |
|---|---|
| `frontend/src/pipelines/mandapam/booking-write.pipeline.ts` | Pipeline implementation |
| `frontend/src/api/mandapam.api.ts` | All 6 HTTP functions |
| `frontend/src/queries/useMandapamMutations.ts` | Mutation hooks |
| `frontend/src/components/features/admin/mandapam/bookings/BookingManagement.tsx` | Primary consumer |
| `frontend/src/components/modals/admin/AddPaymentModal.tsx` | Payment consumer |
| `frontend/src/components/modals/admin/CompleteBookingModal.tsx` | Settlement consumer |
| `frontend/src/components/modals/admin/CancelRefundModal.tsx` | Status + refund consumer |
| `frontend/src/components/modals/admin/ViewBookingModal.tsx` | Addon consumer |
