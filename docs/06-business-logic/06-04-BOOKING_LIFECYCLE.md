# Booking Lifecycle

Hall booking state machine — from confirmation to settlement.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    BOOKING STATE MACHINE                               │
│                                                                         │
│                   ┌──────────────────┐                                  │
│                   │   CONFIRMED      │  ← Created, awaiting event      │
│                   └────────┬─────────┘                                  │
│                            │                                            │
│                    event date reached                                   │
│                            │                                            │
│                            ▼                                            │
│                   ┌──────────────────┐                                  │
│                   │  IN_PROGRESS     │  ← Event happening              │
│                   └────────┬─────────┘                                  │
│                            │                                            │
│                    settlement initiated                                 │
│                            │                                            │
│                            ▼                                            │
│                   ┌──────────────────┐                                  │
│                   │SETTLEMENT_PENDING│  ← Awaiting payment             │
│                   └────────┬─────────┘                                  │
│                            │                                            │
│               ┌────────────┼────────────┐                              │
│               │            │            │                              │
│               ▼            ▼            ▼                              │
│          ┌────────┐  ┌──────────┐  ┌──────────┐                       │
│          │COMPLETED│  │CANCELLED │  │ REFUNDED │                       │
│          │(success)│  │(no pay)  │  │(paid back)│                       │
│          └────────┘  └──────────┘  └──────────┘                       │
│                                                                         │
│                                                                         │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │             SETTLEMENT SUB-MACHINE                             │   │
│   │                                                                │   │
│   │   INITIATE ──▶ START ──▶ COMPLETE                             │   │
│   │                     │                                           │   │
│   │                     └──▶ FAILED ──▶ (retry or cancel)         │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │             TOKEN LIFECYCLE (booking payment tokens)           │   │
│   │                                                                │   │
│   │   ISSUE ──▶ CONSUME ──▶ REVERSE (if booking cancelled)       │   │
│   └────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│   RESTRICTED TRANSITIONS:                                              │
│   CONFIRMED → COMPLETED ✗      CANCELLED → COMPLETED ✗               │
│   COMPLETED → CANCELLED ✗      SETTLEMENT_PENDING → CONFIRMED ✗      │
└─────────────────────────────────────────────────────────────────────────┘
```

## Transitions

| From | To | Trigger |
|------|----|---------|
| CONFIRMED | IN_PROGRESS | Event date reached (cron or on access) |
| CONFIRMED | CANCELLED | User cancels before event |
| IN_PROGRESS | SETTLEMENT_PENDING | Event completed, settlement initiated |
| IN_PROGRESS | CANCELLED | Admin cancels during event |
| SETTLEMENT_PENDING | COMPLETED | Payment successful |
| SETTLEMENT_PENDING | CANCELLED | No payment, booking voided |
| SETTLEMENT_PENDING | REFUNDED | Payment made but refunded |
| CANCELLED | REFUNDED | Payment already made, now refunded |

## Business Rules

1. **No double-booking**: Calendar check prevents overlapping bookings for the same mandapam on the same date
2. **Cancellation window**: Free cancellation up to 48 hours before event
3. **Late cancellation**: Within 48 hours: 50% charge
4. **Settlement period**: Must settle within 7 days of event completion
5. **Token**: Booking token is required for settlement — consume on payment, reverse on refund

## Booking Validation Rules

| Field | Rule |
|-------|------|
| mandapamId | Must reference existing, active mandapam |
| checkIn | Must be today or future |
| checkOut | Must be after checkIn |
| addons | Must reference existing addons for this mandapam |
| totalAmount | Must match calculated price (server-validated) |

## Edge Cases

| Scenario | Behavior | Why |
|----------|----------|-----|
| Double-booking attempt (same mandapam, same date) | 409 CONFLICT — second booking rejected | Calendar block + $transaction |
| Cancel CONFIRMED booking | Allowed, calendar block released | User-initiated |
| Cancel IN_PROGRESS booking | Requires admin approval | Event already started |
| Cancel SETTLEMENT_PENDING booking | Allowed, but no refund (no payment yet) | No money exchanged |
| Cancel COMPLETED booking | Not allowed — booking is done | Final state |
| Settlement fails (payment declined) | Token reversed, retry available | User can retry within 7 days |
| Calendar date blocked by admin | New bookings can't be made, existing unaffected | Admin override |
| Settlement token expires | Must re-issue token | Token TTL |
| Event is today, mandapam double-booked | Second booking blocked at create | Calendar validation |
| Refund after COMPLETED | Manual process, marks as REFUNDED | Requires admin intervention |
| Payment processed but system crashed | Idempotency key prevents double charge | Payment gateway integration |
