# Database Documentation

## Overview

**Database:** PostgreSQL 16
**ORM:** Prisma
**Connection:** `DATABASE_URL` environment variable
**Migrations:** Managed via `prisma migrate`

## Schema Status

| Table | Status | Purpose |
|---|---|---|
| `accounts` | IN USE | User accounts |
| `credentials` | IN USE | Auth credentials (password hashes) |
| `sessions` | IN USE | Refresh token sessions |
| `verifications` | IN USE | OTP verification records |
| `roles` | SEEDED ONLY | Role enums (ANON, USER, ADMIN, SUPER_ADMIN) |
| `plans` | SEEDED ONLY | Membership plans |
| `counter` | SEEDED ONLY | Auto-increment ID generator |
| `profiles` | NOT IN USE | Matrimony profiles |
| `profiles_photos` | NOT IN USE | Profile photos |
| `profiles_education` | NOT IN USE | Education details |
| `profiles_profession` | NOT IN USE | Profession details |
| `profiles_family` | NOT IN USE | Family details |
| `profiles_horoscope` | NOT IN USE | Horoscope data |
| `profiles_partner_preferences` | NOT IN USE | Partner preference filter |
| `profiles_interests` | NOT IN USE | Interest expressions |
| `profiles_shortlists` | NOT IN USE | Shortlists |
| `mandapams` | NOT IN USE | Marriage halls |
| `mandapam_packages` | NOT IN USE | Hall packages |
| `mandapam_bookings` | NOT IN USE | Hall bookings |
| `mandapam_events` | NOT IN USE | Booking events |
| `mandapam_photos` | NOT IN USE | Hall photos |
| `mandapam_amenities` | NOT IN USE | Hall amenities |
| `mandapam_availability` | NOT IN USE | Hall availability calendar |
| `mandapam_booking_history` | NOT IN USE | Booking history |
| `mandapam_translations` | NOT IN USE | Translations |
| `communities` | NOT IN USE | Community groups |
| `community_denominations` | NOT IN USE | Sub-communities |
| `translations` | NOT IN USE | Static translations |
| `devices` | NOT IN USE | Device registry |

## In-Use Tables Detail

### accounts

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK, default gen_random_uuid() | |
| accountNo | VARCHAR(12) | UNIQUE, NOT NULL | Human-readable account number |
| email | VARCHAR(255) | UNIQUE, NOT NULL | |
| phone | VARCHAR(20) | NULLABLE | |
| name | VARCHAR(100) | NOT NULL | Display name |
| passwordHash | VARCHAR(255) | NOT NULL | Argon2id hash |
| avatar | TEXT | DEFAULT '' | URL to avatar |
| tokenVersion | INTEGER | DEFAULT 0, NOT NULL | Incremented on password change |
| timezone | VARCHAR(50) | DEFAULT 'Asia/Kolkata' | |
| language | VARCHAR(10) | DEFAULT 'ta' | |
| membershipId | UUID | FK → plans.id, NULLABLE | Current plan |
| membershipExpiresAt | TIMESTAMPTZ | NULLABLE | Plan expiry |
| lastLoginAt | TIMESTAMPTZ | NULLABLE | |
| lastLoginIp | VARCHAR(45) | NULLABLE | |
| isActive | BOOLEAN | DEFAULT true, NOT NULL | Soft delete flag |
| isVerified | BOOLEAN | DEFAULT false, NOT NULL | Email verified? |
| isDeleted | BOOLEAN | DEFAULT false, NOT NULL | |
| deletedAt | TIMESTAMPTZ | NULLABLE | |
| createdAt | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL | |
| updatedAt | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL | |

**Indexes:** `PK (id)`, `UNIQUE (accountNo)`, `UNIQUE (email)`, `idx_accounts_membership_id`

### credentials

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| accountId | UUID | FK → accounts.id, UNIQUE, NOT NULL | One credential per account |
| passwordHash | TEXT | NOT NULL | Argon2id |
| passwordHint | VARCHAR(255) | NULLABLE | |
| lastChangedAt | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL | |
| isActive | BOOLEAN | DEFAULT true | |
| createdAt | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL | |
| updatedAt | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL | |

**Indexes:** `PK (id)`, `UNIQUE (accountId)`, `UNIQUE (accountId, isActive)` (partial)

### sessions

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| accountId | UUID | FK → accounts.id, NOT NULL | |
| tokenHash | VARCHAR(255) | UNIQUE, NOT NULL | SHA-256 of refresh token |
| ipHash | VARCHAR(255) | NOT NULL | SHA-256 of IP |
| userAgentHash | VARCHAR(255) | NOT NULL | SHA-256 of UA |
| fingerprint | VARCHAR(255) | NOT NULL | SHA-256 of IP+UA+Accept |
| deviceName | VARCHAR(255) | NULLABLE | |
| deviceLocation | VARCHAR(255) | NULLABLE | |
| lastUsedAt | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL | |
| expiresAt | TIMESTAMPTZ | DEFAULT NOW()+7d, NOT NULL | |
| revokedAt | TIMESTAMPTZ | NULLABLE | |
| createdAt | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL | |
| updatedAt | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL | |

**Indexes:** `PK (id)`, `UNIQUE (tokenHash)`, `idx_sessions_account_id`, `idx_sessions_expires_at`

### verifications

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| accountId | UUID | NULLABLE | Only for authenticated flows |
| target | VARCHAR(255) | NOT NULL | Email or phone |
| type | VARCHAR(50) | NOT NULL | registration, password-reset, email-change |
| code | VARCHAR(255) | NOT NULL | SHA-256 of OTP |
| attempts | INTEGER | DEFAULT 0, NOT NULL | |
| maxAttempts | INTEGER | DEFAULT 5 | |
| expiresAt | TIMESTAMPTZ | NOT NULL | |
| usedAt | TIMESTAMPTZ | NULLABLE | |
| metadata | JSONB | NULLABLE | |
| createdAt | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL | |
| updatedAt | TIMESTAMPTZ | DEFAULT NOW(), NOT NULL | |

**Indexes:** `PK (id)`, `idx_verifications_target_type`, `idx_verifications_expires_at`

### roles

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| name | VARCHAR(50) | UNIQUE, NOT NULL | ANON, USER, ADMIN, SUPER_ADMIN |
| description | TEXT | NULLABLE | |
| permissions | JSONB | NULLABLE | Not used in code |
| createdAt | TIMESTAMPTZ | DEFAULT NOW() | |

**Seed data:** 4 rows (ANON, USER, ADMIN, SUPER_ADMIN)

### plans

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK | |
| name | VARCHAR(100) | UNIQUE, NOT NULL | |
| code | VARCHAR(50) | UNIQUE, NOT NULL | |
| description | TEXT | NULLABLE | |
| durationDays | INTEGER | NOT NULL | |
| price | DECIMAL(10,2) | NOT NULL | |
| maxProfiles | INTEGER | DEFAULT 1 | |
| maxPhotos | INTEGER | DEFAULT 5 | |
| canBrowse | BOOLEAN | DEFAULT true | |
| canExpressInterest | BOOLEAN | DEFAULT false | |
| canViewHoroscope | BOOLEAN | DEFAULT false | |
| canViewContact | BOOLEAN | DEFAULT false | |
| priority | INTEGER | DEFAULT 0 | Sort order |
| isActive | BOOLEAN | DEFAULT true | |
| metadata | JSONB | NULLABLE | |
| createdAt | TIMESTAMPTZ | DEFAULT NOW() | |

**Seed data:** Plans defined but not documented here.

### counter

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | VARCHAR(50) | PK | Counter name (e.g., 'accountNo') |
| sequenceValue | BIGINT | DEFAULT 1, NOT NULL | Current value |
| createdAt | TIMESTAMPTZ | DEFAULT NOW() | |

**Seed data:** One row for account number counter.

## Not-In-Use Tables (Schema Only)

The following tables are defined in `schema.prisma` but have zero rows, zero backend routes, and zero service layer code:

- `profiles` (14 columns: id, accountId, name, gender, dob, religion, caste, subcaste, motherTongue, maritalStatus, about, isActive, createdAt, updatedAt)
- `profiles_photos` (7 columns)
- `profiles_education` (9 columns)
- `profiles_profession` (8 columns)
- `profiles_family` (11 columns)
- `profiles_horoscope` (14 columns)
- `profiles_partner_preferences` (14 columns)
- `profiles_interests` (11 columns)
- `profiles_shortlists` (5 columns)
- `mandapams` (15 columns)
- `mandapam_packages` (13 columns)
- `mandapam_bookings` (17 columns)
- `mandapam_events` (10 columns)
- `mandapam_photos` (6 columns)
- `mandapam_amenities` (8 columns)
- `mandapam_availability` (8 columns)
- `mandapam_booking_history` (14 columns)
- `mandapam_translations` (6 columns)
- `communities` (8 columns)
- `community_denominations` (5 columns)
- `translations` (8 columns)
- `devices` (10 columns)

## Migration History

Located in `backend/prisma/migrations/`. Migration files are timestamp-prefixed. Run via:

```bash
cd backend/
npx prisma migrate deploy    # apply pending migrations
npx prisma migrate dev       # dev migration (creates new)
npx prisma generate           # regenerate Prisma client
```
