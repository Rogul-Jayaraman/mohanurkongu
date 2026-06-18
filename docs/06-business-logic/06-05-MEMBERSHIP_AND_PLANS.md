# Membership & Plans

Freemium tier system — BRONZE, SILVER, GOLD, PLATINUM — with per-plan capabilities.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MEMBERSHIP PLAN HIERARCHY                           │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │   BRONZE    │  Free tier, basic browsing                     │     │
│   │   SILVER    │  More filters, more shortlists                 │     │
│   │   GOLD      │  Premium filters, contact visibility           │     │
│   │   PLATINUM  │  Everything unlocked, priority support          │     │
│   └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
│   Capabilities increase with each tier:                                 │
│                                                                         │
│   ┌──────────────────────┬──────┬──────┬──────┬─────────┐            │
│   │ Capability           │BRONZE│SILVER│ GOLD │PLATINUM │            │
│   ├──────────────────────┼──────┼──────┼──────┼─────────┤            │
│   │ Daily profile views  │  10  │  50  │ 200  │ UNLIM   │            │
│   │ Daily shortlists     │   5  │  20  │ 100  │ UNLIM   │            │
│   │ Express interest/mo  │   3  │  15  │  60  │ UNLIM   │            │
│   │ Advanced filters     │  ❌  │  ✅  │  ✅  │  ✅     │            │
│   │ Photo visibility     │  ❌  │  ❌  │  ✅  │  ✅     │            │
│   │ Contact info access  │  ❌  │  ❌  │  ❌  │  ✅     │            │
│   │ Priority support     │  ❌  │  ❌  │  ❌  │  ✅     │            │
│   │ Ad-free              │  ❌  │  ✅  │  ✅  │  ✅     │            │
│   │ Profile showcase     │  ❌  │  ❌  │  ❌  │  ✅     │            │
│   │ Hide online status   │  ❌  │  ❌  │  ✅  │  ✅     │            │
│   └──────────────────────┴──────┴──────┴──────┴─────────┘            │
└─────────────────────────────────────────────────────────────────────────┘
```

## Capability Resolution

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CAPABILITY RESOLUTION FLOW                          │
│                                                                         │
│   User action (e.g., browse profiles)                                 │
│         │                                                               │
│         ▼                                                               │
│   Does user have ACTIVE membership?                                    │
│   ├── YES → Check plan tier → Check daily limit → Allow/Block         │
│   └── NO  → Assign BRONZE (free tier) → Check daily limit → Allow/Block │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │  Limit check:                                                  │     │
│   │  Today's count >= plan limit ?  BLOCK : ALLOW                 │     │
│   │                                                              │     │
│   │  Block response: 403 MEMBERSHIP_LIMIT_REACHED                 │     │
│   │  Shows: "Upgrade to continue browsing"                       │     │
│   └──────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Plan Pricing (Illustrative)

| Plan | Price (month) | Price (year) |
|------|--------------|--------------|
| BRONZE | Free | Free |
| SILVER | ₹499 | ₹4,999 |
| GOLD | ₹999 | ₹9,999 |
| PLATINUM | ₹1,999 | ₹19,999 |

## Membership States

| State | Meaning |
|-------|---------|
| ACTIVE | Plan benefits available |
| EXPIRED | Past end date — reverts to BRONZE |
| CANCELLED | User cancelled — benefits until end date |

## Edge Cases

| Scenario | Behavior | Why |
|----------|----------|-----|
| View limit reached mid-browse | Page shows remaining from count — last few may fail with 403 | Hard limit per session |
| Upgrade mid-cycle | New plan takes effect immediately, prorated billing | Instant access to upgraded features |
| Downgrade mid-cycle | New plan takes effect at end of current billing period | User gets what they paid for |
| Membership expires during login | LoginPipeline step 4 checks → reverts to BRONZE | Graceful degradation |
| BRONZE user tries premium filter | 403 — filter option greyed out in UI | Don't show unusable controls |
| Concurrent sessions sharing limit | Limit is per account, counted server-side | Race-safe via DB writes |
| Membership auto-renew fails | 3 retry attempts, then EXPIRED | Grace period before downgrade |
| User has no membership record | Treated as BRONZE with default limits | Always return capabilities |
| Showcase limit reached | Oldest showcase removed, new one added | First-in-first-out |
| PLATINUM user tries deleted profile | 404 — not found (membership doesn't bypass deletion) | Separate concerns |
