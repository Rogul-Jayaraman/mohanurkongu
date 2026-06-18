# Account Lifecycle

The account state machine — from registration to deletion.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ACCOUNT STATE MACHINE                                │
│                                                                         │
│                   ┌──────────────┐                                      │
│                   │   PENDING    │  ← Created on register              │
│                   └──────┬───────┘                                      │
│                          │                                              │
│                  email verified (OTP)                                   │
│                          │                                              │
│                          ▼                                              │
│                   ┌──────────────┐                                      │
│       ┌──────────▶│   ACTIVE     │◀────────────────┐                   │
│       │           └──────┬───────┘                  │                   │
│       │                  │                          │                   │
│       │        admin suspends           admin unsuspends               │
│       │                  │                          │                   │
│       │                  ▼                          │                   │
│       │           ┌──────────────┐                  │                   │
│       │           │  SUSPENDED   │──────────────────┘                   │
│       │           └──────┬───────┘                                      │
│       │                  │                                              │
│       │        user deletes                                             │
│       │                  │                                              │
│       │                  ▼                                              │
│       │           ┌──────────────┐                                      │
│       └───────────│   DELETED    │  (soft delete, 30-day purge)        │
│                   └──────────────┘                                      │
│                                                                         │
│   RESTRICTED TRANSITIONS (not allowed):                                │
│   PENDING → SUSPENDED  ✗         DELETED → ACTIVE  ✗                  │
│   PENDING → DELETED    ✗         DELETED → SUSPENDED  ✗               │
│   DELETED  → PENDING   ✗                                               │
└─────────────────────────────────────────────────────────────────────────┘
```

## Transitions

| From | To | Trigger | Who | Notes |
|------|----|---------|-----|-------|
| PENDING | ACTIVE | Email verified | System | OTP verification completes |
| ACTIVE | SUSPENDED | Admin action | Admin | Manual suspension |
| SUSPENDED | ACTIVE | Admin action | Admin | Manual unsuspension |
| ACTIVE | DELETED | User action | User | Soft delete |
| SUSPENDED | DELETED | User action | User | Allowed even when suspended |
| ACTIVE | PENDING | ✗ Not allowed | — | Cannot un-verify email |

## Business Rules

1. **Email uniqueness**: No two accounts can have the same email
2. **Password hashing**: Argon2id with salt (auto-generated)
3. **Login validation**: Inactive accounts (PENDING, SUSPENDED) cannot log in
4. **Deletion**: Soft delete — sets `deletedAt` timestamp, preserves data for 30 days then hard purge
5. **Account recovery**: Deleted accounts can be restored within 30 days
6. **Role immutability**: Role only changed by SUPER_ADMIN

## Required Fields for Registration

| Field | Validation | Required |
|-------|-----------|----------|
| email | Valid email format, max 255 chars | Yes |
| password | Min 8 chars, 1 upper, 1 lower, 1 number, 1 special | Yes |
| name | 2-100 chars, letters + spaces only | Yes |

## Edge Cases

| Scenario | Behavior | Why |
|----------|----------|-----|
| Register with existing email | 409 CONFLICT | Prevent duplicate accounts |
| Login with PENDING account | 403 FORBIDDEN | Email not verified |
| Login with SUSPENDED account | 403 FORBIDDEN with reason | Account under review |
| Login with DELETED account | 404 NOT FOUND | Account doesn't exist for auth |
| Delete account during active booking | Allowed (booking remains as orphan) | Booking is separate entity |
| Unsuspend account while profile is REJECTED | Account ACTIVE, profile still REJECTED | Each has own state machine |
| Concurrent login attempts | Both succeed (no lockout) | Lockout is OTP-specific, not login |
| JWT issued before suspension still valid | Invalidated on next use or max 15min | Token TTL limits exposure |
| Account deleted, re-register same email | Treated as completely new account | Soft-delete check on registration |
