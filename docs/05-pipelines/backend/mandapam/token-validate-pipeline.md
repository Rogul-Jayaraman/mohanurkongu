# Pipeline 9: Token Validate

> **For beginners**: Checks if a booking token number is valid and how many
> tokens are available. Tokens are like prepaid credits used for bookings.
> Read-only — no data changes.

## Purpose

Validates a token number by checking the source booking's token ledger. Computes available tokens as `ISSUED - CONSUMED - REVERSED`. Read-only pipeline. Replaces `TokenLedgerService.validateToken()`.

## Actor & Entry

| Route | Method |
|-------|--------|
| `/admin/mandapam/bookings/validate-token` | POST |

**Allowed Roles:** `ADMIN`

**Validation Schema:** `validateTokenSchema` — `{ tokenNumber: string }`

## High-Level Architecture

```
  ┌─ POST /admin/mandapam/bookings/validate-token ─────────────────────┐
  │  ctx = { tokenNumber: 'KTM-0042' }                                 │
  └────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │  PipelineRunner.run([S1..S3], ctx)                                   │
  │                                                                       │
  │  S1. querySourceBooking(ctx)                                         │
  │  ┌──────────────────────────────────────────────────────────────┐   │
  │  │  booking = prisma.mandapamBooking.findFirst({                │   │
  │  │    where: { bookingNo: ctx.tokenNumber },                    │   │
  │  │    include: { tokenEntries: true }                           │   │
  │  │  })                                                           │   │
  │  │                                                               │   │
  │  │  if !booking:                                                │   │
  │  │    ctx.tokenResult = { valid: false, availableTokens: 0 }    │   │
  │  │    return (skip to S3)                                       │   │
  │  │                                                               │   │
  │  │  ctx.sourceBooking = booking                                 │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  │                                                                       │
  │  S2. computeAvailableTokens(ctx)                                     │
  │  ┌──────────────────────────────────────────────────────────────┐   │
  │  │  entries = ctx.sourceBooking.tokenEntries                    │   │
  │  │                                                               │   │
  │  │  issued   = entries                                           │   │
  │  │    .filter(e => e.state === 'ISSUED')                        │   │
  │  │    .reduce((s, e) => s + e.tokens, 0)                        │   │
  │  │                                                               │   │
  │  │  consumed = entries                                           │   │
  │  │    .filter(e => e.state === 'CONSUMED')                      │   │
  │  │    .reduce((s, e) => s + e.tokens, 0)                        │   │
  │  │                                                               │   │
  │  │  reversed = entries                                           │   │
  │  │    .filter(e => e.state === 'REVERSED')                      │   │
  │  │    .reduce((s, e) => s + e.tokens, 0)                        │   │
  │  │                                                               │   │
  │  │  available = issued - consumed - reversed                    │   │
  │  │                                                               │   │
  │  │  ctx.tokenResult = {                                         │   │
  │  │    valid: available > 0,                                     │   │
  │  │    availableTokens: Math.max(0, available)                   │   │
  │  │  }                                                            │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  │                                                                       │
  │  S3. setTokenResponse(ctx)                                           │
  │  ┌──────────────────────────────────────────────────────────────┐   │
  │  │  ctx.responseData = ctx.tokenResult                          │   │
  │  └──────────────────────────────────────────────────────────────┘   │
  └────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
                    { valid: boolean, availableTokens: number }
```

## Low-Level — Computation Detail

```
====================================================================================
S2: computeAvailableTokens
────────────────────────────────────────────────────────────────────────────────────
Token State Machine:
  ISSUED   → Token was created (from NORMAL_BOOKING with ROYAL/GRAND package)
  CONSUMED → Token was used (by TOKEN_BOOKING referencing this booking)
  REVERSED → Token was returned (when referenced booking was CANCELLED)

Formula:
  Available = SUM(ISSUED.tokens) - SUM(CONSUMED.tokens) - SUM(REVERSED.tokens)

Examples:
  - ROYAL booking (1 token issued, 0 consumed, 0 reversed) → available: 1
  - ROYAL booking (1 issued, 1 consumed, 0 reversed)       → available: 0
  - ROYAL booking (1 issued, 1 consumed, 1 reversed)       → available: 0
  - STANDARD booking (0 tokens issued)                     → available: 0
  - Non-existent bookingNo                                  → valid: false, available: 0
====================================================================================
```

## Dependencies

None (all steps are pipeline-specific)
