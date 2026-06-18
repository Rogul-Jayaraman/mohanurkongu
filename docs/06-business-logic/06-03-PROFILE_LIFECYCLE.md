# Profile Lifecycle

The matrimony profile state machine — from draft to deletion.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PROFILE STATE MACHINE                               │
│                                                                         │
│                    ┌──────────────┐                                     │
│                    │    DRAFT     │  ← Created by user, incomplete      │
│                    └──────┬───────┘                                     │
│                           │                                             │
│                   user submits for review                               │
│                           │                                             │
│                           ▼                                             │
│                    ┌──────────────┐                                     │
│            ┌──────▶│   PENDING    │  ← Under admin review              │
│            │       └──────┬───────┘                                     │
│            │              │                                             │
│            │    ┌─────────┼─────────┐                                   │
│            │    │         │         │                                   │
│            │    ▼         ▼         ▼                                   │
│            │ ┌────────┐ ┌────────┐ ┌──────────┐                        │
│            │ │ ACTIVE │ │REJECTED│ │ ARCHIVED │                        │
│            │ └───┬────┘ └────────┘ └──────────┘                        │
│            │     │                          ▲                            │
│            │     │         archive          │                            │
│            │     └──────────────────────────┘                            │
│            │                                                            │
│            │     ┌──────────────┐                                       │
│            │     │   DELETED    │                                       │
│            └─────│ (soft, 30d) │                                       │
│                  └──────────────┘                                       │
│                                                                         │
│   EXTRA STATE:  LAPSED (when membership expires)                       │
│   ACTIVE → LAPSED (can't browse, profile hidden)                       │
│   LAPSED → ACTIVE (renew membership)                                   │
│                                                                         │
│   RESTRICTED TRANSITIONS:                                              │
│   DRAFT → ACTIVE  ✗       REJECTED → ACTIVE (user must resubmit) ✗   │
│   DELETED → ACTIVE ✗      ARCHIVED → ACTIVE ✗                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Transitions

| From | To | Trigger | Who |
|------|----|---------|-----|
| DRAFT | PENDING | User submits | User |
| PENDING | ACTIVE | Admin approves | Admin |
| PENDING | REJECTED | Admin rejects | Admin |
| PENDING | ARCHIVED | Admin archives | Admin |
| ACTIVE | DRAFT | User edits | User (reverts to draft on edit) |
| ACTIVE | ARCHIVED | Admin archives | Admin |
| ACTIVE | DELETED | User deletes | User |
| ACTIVE | LAPSED | Membership expires | System |
| LAPSED | ACTIVE | Membership renewed | System |
| DRAFT | DELETED | User deletes | User |
| REJECTED | DRAFT | User resubmits | User |
| ARCHIVED | PENDING | Admin restores | Admin |

## Visibility Rules

| State | Owner can see | Admin can see | Public can see |
|-------|--------------|---------------|----------------|
| DRAFT | ✅ Full | ✅ Full | ❌ Hidden |
| PENDING | ✅ Full | ✅ Full | ❌ Hidden |
| ACTIVE | ✅ Full | ✅ Full | ✅ Limited* |
| REJECTED | ✅ Full | ✅ Full | ❌ Hidden |
| ARCHIVED | ✅ Full | ✅ Full | ❌ Hidden |
| DELETED | ❌ Gone | ⚠️ Audit only | ❌ Gone |
| LAPSED | ✅ Limited | ✅ Full | ❌ Hidden |

*Public sees only: name, age, height, location, photos (not contact details)

## Membership Gating by State

| Feature | DRAFT | PENDING | ACTIVE | LAPSED |
|---------|-------|---------|--------|--------|
| Edit profile | ✅ | ✅ | ✅ | ✅ |
| Browse profiles | ❌ | ❌ | ✅ (tier-limited) | ❌ |
| Shortlist | ❌ | ❌ | ✅ | ❌ |
| Express interest | ❌ | ❌ | ✅ (tier-limited) | ❌ |
| View contact info | ❌ | ❌ | ✅ (tier-limited) | ❌ |

## Edge Cases

| Scenario | Behavior | Why |
|----------|----------|-----|
| Delete LAPSED profile | Allowed — DELETED state reached directly | User can always delete |
| Admin approves during user edit | Pipeline handles — edit still in progress | PRE-phase locking |
| Reject with reason | Reason stored in audit_log, shown to user | User knows why |
| Auto-archive dormant profiles | Background job: ACTIVE + no login > 1 year → ARCHIVED | Data hygiene |
| Delete profile with active shortlists | Shortlists remain (orphaned) | Shortlist is separate entity |
| Profile deleted, shortlisted by others | Shortlist entry becomes orphan (profile shown as "Deleted User") | User privacy |
| Archived profile shortlisted again | Admin must restore first | Prevent stale interactions |
| Same user creates second profile | 409 CONFLICT | One profile per account |
| User edits ACTIVE profile | Reverts to DRAFT, must resubmit | Ensure admin reviews changes |
