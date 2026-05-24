# Entity Relationship Diagram

## In-Use Tables (Currently Populated)

```
┌─────────────────────────────────────┐
│              accounts               │
├─────────────────────────────────────┤
│ PK id                    UUID       │──┐
│    accountNo             VARCHAR(12)│  │
│    email                 VARCHAR(255)│  │
│    phone                 VARCHAR(20) │  │
│    name                  VARCHAR(100)│  │
│    passwordHash          VARCHAR(255)│  │
│    avatar                TEXT        │  │
│    tokenVersion          INTEGER     │  │
│    timezone              VARCHAR(50) │  │
│    language              VARCHAR(10) │  │
│ FK membershipId          UUID       │──┼────────┐
│    membershipExpiresAt   TIMESTAMPTZ│  │        │
│    lastLoginAt           TIMESTAMPTZ│  │        │
│    lastLoginIp           VARCHAR(45) │  │        │
│    isActive              BOOLEAN    │  │        │
│    isVerified            BOOLEAN    │  │        │
│    isDeleted             BOOLEAN    │  │        │
│    deletedAt             TIMESTAMPTZ│  │        │
│    createdAt             TIMESTAMPTZ│  │        │
│    updatedAt             TIMESTAMPTZ│  │        │
└─────────────────────────────────────┘  │        │
          │                              │        │
          │ 1:1                          │        │
          ▼                              │        │
┌─────────────────────────────────────┐  │        │
│            credentials              │  │        │
├─────────────────────────────────────┤  │        │
│ PK id                    UUID       │  │        │
│ FK accountId             UUID       │◀─┘        │
│    passwordHash          TEXT       │           │
│    passwordHint          VARCHAR(255)│           │
│    lastChangedAt         TIMESTAMPTZ│           │
│    isActive              BOOLEAN    │           │
│    createdAt             TIMESTAMPTZ│           │
│    updatedAt             TIMESTAMPTZ│           │
└─────────────────────────────────────┘           │
                                                   │
          │ 1:N                                   │
          ▼                                       │
┌─────────────────────────────────────┐           │
│              sessions               │           │
├─────────────────────────────────────┤           │
│ PK id                    UUID       │           │
│ FK accountId             UUID       │◀──────────┘
│    tokenHash             VARCHAR(255)│           │
│    ipHash                VARCHAR(255)│           │
│    userAgentHash         VARCHAR(255)│           │
│    fingerprint           VARCHAR(255)│           │
│    deviceName            VARCHAR(255)│           │
│    deviceLocation        VARCHAR(255)│           │
│    lastUsedAt            TIMESTAMPTZ│           │
│    expiresAt             TIMESTAMPTZ│           │
│    revokedAt             TIMESTAMPTZ│           │
│    createdAt             TIMESTAMPTZ│           │
│    updatedAt             TIMESTAMPTZ│           │
└─────────────────────────────────────┘           │
                                                   │
          │ 1:N                                   │
          ▼                                       │
┌─────────────────────────────────────┐           │
│            verifications            │           │
├─────────────────────────────────────┤           │
│ PK id                    UUID       │           │
│ FK accountId             UUID       │◀──────────┘ (nullable)
│    target                VARCHAR(255)│           │
│    type                  VARCHAR(50) │           │
│    code                  VARCHAR(255)│           │
│    attempts              INTEGER    │           │
│    maxAttempts           INTEGER    │           │
│    expiresAt             TIMESTAMPTZ│           │
│    usedAt                TIMESTAMPTZ│           │
│    metadata              JSONB      │           │
│    createdAt             TIMESTAMPTZ│           │
│    updatedAt             TIMESTAMPTZ│           │
└─────────────────────────────────────┘
                                                   
┌─────────────────────┐     ┌─────────────────────┐
│       roles         │     │       plans         │
├─────────────────────┤     ├─────────────────────┤
│ PK id       UUID    │     │ PK id       UUID    │
│    name     VARCHAR │     │    name     VARCHAR │
│    desc     TEXT    │     │    code     VARCHAR │
│    perms    JSONB   │     │    price    DECIMAL │
│    created  TS      │     │    duration INTEGER│
└─────────────────────┘     └─────────────────────┘
                                      │
                                      │ 1:N
                                      ▼
                              ┌─────────────────────┐
                              │     counter         │
                              ├─────────────────────┤
                              │ PK id VARCHAR      │
                              │    seq   BIGINT    │
                              └─────────────────────┘
```

## Not-In-Use Tables (Schema Defined, No Data)

```
accounts 1:N profiles 1:1 photos, education, profession, family, horoscope, partner_preferences
profiles 1:N interests, shortlists

mandapams 1:N packages, photos, amenities, availability
mandapams 1:N bookings 1:N events, history
```

## Relationships Summary

| From | To | Type | Via |
|---|---|---|---|
| accounts | credentials | 1:1 | accountId |
| accounts | sessions | 1:N | accountId |
| accounts | verifications | 1:N | accountId (nullable) |
| accounts | plans | N:1 | membershipId |
| accounts | roles | N:M | (via role field, not relation table) |
| accounts | profiles | 1:N | accountId |
| profiles | profiles_photos | 1:N | profileId |
| profiles | profiles_education | 1:1 | profileId |
| profiles | profiles_profession | 1:1 | profileId |
| profiles | profiles_family | 1:1 | profileId |
| profiles | profiles_horoscope | 1:1 | profileId |
| profiles | profiles_partner_preferences | 1:1 | profileId |
| profiles | profiles_interests | 1:N | profileId |
| profiles | profiles_shortlists | 1:N | profileId |
| mandapams | mandapam_packages | 1:N | mandapamId |
| mandapams | mandapam_bookings | 1:N | mandapamId |
| mandapams | mandapam_photos | 1:N | mandapamId |
| mandapams | mandapam_amenities | 1:N | mandapamId |
| mandapams | mandapam_availability | 1:N | mandapamId |
| mandapam_bookings | mandapam_events | 1:N | bookingId |
| mandapam_bookings | mandapam_booking_history | 1:N | bookingId |

## Normalization

- **3NF:** All in-use tables satisfy 3NF. No transitive dependencies.
- **4NF:** In-use tables satisfy 4NF (no multi-valued dependencies).
- **Not-in-use tables** designed for 3NF but not validated with real data.
