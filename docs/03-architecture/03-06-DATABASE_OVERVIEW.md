# Database Overview

The data model covers two product domains (matrimony + hall booking) with 50 tables and 32 enums.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ENTITY RELATIONSHIP OVERVIEW                        │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │                ACCOUNT DOMAIN                                  │     │
│   │                                                              │     │
│   │   Account ──has──▶ Profile ──has──▶ Preference              │     │
│   │     │                  │                                      │     │
│   │     │                  ├──has──▶ Education                    │     │
│   │     │                  ├──has──▶ Occupation                   │     │
│   │     │                  ├──has──▶ Photo                       │     │
│   │     │                  ├──has──▶ Address                     │     │
│   │     │                  ├──has──▶ FamilyInfo                  │     │
│   │     │                  └──has──▶ Sibling                     │     │
│   │     │                                                         │     │
│   │     └──has──▶ Session ──has──▶ Token                        │     │
│   │              └──has──▶ AuditLog                              │     │
│   └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │              MATRIMONY DOMAIN (Manamaalai)                    │     │
│   │                                                              │     │
│   │   Profile ────◀── Shortlist ────▶ Profile (many-to-many)    │     │
│   │   Profile ────◀── Interest ─────▶ Profile                    │     │
│   │   Profile ────has──▶ Membership (plan + expiry)              │     │
│   └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │              BOOKING DOMAIN (Maaligai)                       │     │
│   │                                                              │     │
│   │   Mandapam ──has──▶ CalendarEntry ──belongs──▶ Booking      │     │
│   │   Booking ──has──▶ Settlement ──has──▶ Payment              │     │
│   │   Booking ──has──▶ Addon                                   │     │
│   │   Booking ──has──▶ FinancialTransaction                     │     │
│   │   Booking ──has──▶ Token                                    │     │
│   └──────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Key Tables

| Table | Description | Key Fields |
|-------|-------------|-----------|
| Account | User login credentials | email, passwordHash, status, role |
| Profile | Matrimony profile | name, age, height, kulam, gotram, rasi, nakshatra, dosham, status |
| Preference | Matchmaking preferences | ageRange, heightRange, kulam, nakshatra |
| Membership | Plan subscription | plan, startDate, endDate, status |
| Mandapam | Bookable hall | name, capacity, price, amenities |
| MandapamBooking | Hall reservation | checkIn, checkOut, status, totalAmount |
| CalendarEntry | Date-level blocking | date, isAvailable, reason |
| Settlement | Payment settlement | amount, method, status, settledAt |
| Token | Booking tokens | code, status, bookingId, expiresAt |
| AuditLog | All state changes | entityType, entityId, action, oldState, newState |

## Enum Reference

All 32 enums with their values:

| Enum | Values |
|------|--------|
| AccountStatus | PENDING, ACTIVE, SUSPENDED, DELETED |
| AccountRole | ADMIN, USER, SUPER_ADMIN |
| ProfileStatus | DRAFT, PENDING, ACTIVE, REJECTED, ARCHIVED, DELETED, LAPSED |
| MembershipPlan | BRONZE, SILVER, GOLD, PLATINUM |
| MembershipStatus | ACTIVE, EXPIRED, CANCELLED |
| BookingStatus | CONFIRMED, IN_PROGRESS, SETTLEMENT_PENDING, COMPLETED, CANCELLED, REFUNDED |
| OTPStatus | PENDING, VERIFIED, EXPIRED, CANCELLED, ARCHIVED, PURGED |
| TokenStatus | ISSUED, CONSUMED, REVERSED, EXPIRED |
| SettlementMethod | CASH, BANK_TRANSFER, CARD, UPI |
| Rasi | MESHA, VRISHABA, MIDHUNA, KATAKA, SIMMA, KANNI, TULA, VRISHCHIKA, DHANUS, MAKARA, KUMBHA, MEENA |
| Nakshatram | ASHWINI, BHARANI, KARTHIKAI, ROHINI, MRIGASHIRSHA, THIRUVATHIRAI, PUNARPOOSAM, POOSAM, AYILYAM, MAKAM, POORAM, UTHTHIRAM, ATHAM, CHITHIRAI, SWATHI, VISAKAM, ANUSHAM, KETTAI, MULA, POORADAM, UTHTHIRADAM, THIRUVONAM, AVITTAM, SADHAYAM, POORATTATHI, UTHTHIRATTATHI, REVATHI |
| Dosham | YES, NO |
| ... | (and 21 more) |

## Migration Strategy

```bash
# Create a migration after schema change
npx prisma migrate dev --name describe_change

# Apply to production
npx prisma migrate deploy

# Reset local DB
npx prisma migrate reset

# View current state
npx prisma studio  # Opens on :5555
```

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Migration fails in production | `prisma migrate resolve --rolled-back` then fix + retry |
| Concurrent writes to same record | Prisma $transaction + retry on P2034 (write conflict) |
| Enum change | Prisma creates new migration with ALTER TYPE ... ADD VALUE |
| Large dataset migration | Use `prisma migrate deploy` with batch processing |
| Foreign key constraint fails | Transaction ensures atomicity; error handling in pipeline |
