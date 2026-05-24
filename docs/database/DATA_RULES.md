# Data Rules

## Integrity Rules

### Primary Keys
- All tables use UUID v4 as primary keys
- Generated via `gen_random_uuid()` at DB level
- Exception: `counter` table uses VARCHAR(50) PK

### Foreign Keys
| FK | Source | Target | On Delete | On Update |
|---|---|---|---|---|
| credentials.accountId | credentials | accounts.id | CASCADE | CASCADE |
| sessions.accountId | sessions | accounts.id | CASCADE | CASCADE |
| verifications.accountId | verifications | accounts.id | SET NULL | CASCADE |
| accounts.membershipId | accounts | plans.id | SET NULL | CASCADE |

### Unique Constraints
- `accounts.email` — unique
- `accounts.accountNo` — unique
- `credentials.accountId` — one credential per account
- `sessions.tokenHash` — unique (SHA-256 of refresh token)
- `roles.name` — unique
- `plans.name`, `plans.code` — unique

### Partial Unique Indexes
- `credentials (accountId, isActive) WHERE isActive = true` — ensures only one active credential per account

## Data Retention

| Entity | Retention | Cleanup |
|---|---|---|
| Sessions | 7 days (configurable via `SESSION_EXPIRY_DAYS`) | Background job `expireSession` runs hourly |
| Verifications | 5 minutes (OTP expiry) | Background job `expireOtp` runs hourly |
| Anonymous accounts | 7 days (DISABLED) | Background job `purgeAnon` runs daily (currently disabled) |
| Old accounts | 365 days | Background job `archiveOld` runs daily |
| Deleted accounts | Soft delete (`isDeleted`, `deletedAt`) | Not auto-purged |

## Validation Rules

### accounts
| Field | Rule | Source |
|---|---|---|
| email | Must match `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` | auth.validation.ts |
| phone | Optional, pattern validated | auth.validation.ts |
| name | Min 2, max 100 chars | auth.validation.ts |
| password | Min 6 chars | auth.validation.ts |

### verifications
| Field | Rule | Source |
|---|---|---|
| code | SHA-256(plainOTP) | auth.service.ts |
| OTP | Exactly 5 digits (string) | auth.validation.ts |
| attempts | Max 5 per verification | auth.service.ts |
| expiresAt | NOW() + 5 min for OTP | auth.service.ts |

## Ownership Rules

| Table | Owner | Access |
|---|---|---|
| accounts | Self | SELECT/UPDATE by own accountId only |
| credentials | Account owner | Service layer, not directly exposed |
| sessions | Account owner | Service layer via tokenHash lookup |
| verifications | Requestor | Service layer via target lookup |

## Seed Data

### roles (4 rows)
```sql
ANON, USER, ADMIN, SUPER_ADMIN
```

### plans
Defined in `prisma/seed.ts` — includes pricing, duration, feature flags.

### counter
```sql
('accountNo', 10000)  -- Start account numbers at MKM10000
```

**Note:** Seed script does NOT create any admin user account. A production admin must be created manually or via a separate script.

## Missing Integrity Rules

- No constraint prevents creating a `USER` account with `portal=ADMIN` in login (BUG-MED-004 is application-level)
- No check constraint ensures `expiresAt > createdAt` on sessions/verifications
- No trigger enforces `usedAt <= expiresAt` on verifications
- No unique constraint prevents duplicate active sessions per device fingerprint (intentional — multi-device login supported)
