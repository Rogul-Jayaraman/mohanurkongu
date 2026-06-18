# Validation Rules

All field-level validations — what's accepted, what's rejected, and why.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DUAL VALIDATION ARCHITECTURE                        │
│                                                                         │
│   Frontend (Zod in forms)          Backend (Zod in DTOs)              │
│   ┌──────────────────────┐         ┌──────────────────────────┐       │
│   │ Instant feedback     │         │ Authoritative validation  │       │
│   │ Same rules as backend│         │ Cannot be bypassed        │       │
│   │ User-friendly messages│        │ Returns structured errors │       │
│   └──────────────────────┘         └──────────────────────────┘       │
│                                                                         │
│   Rule: Frontend validation is convenience. Backend validation is      │
│   security. Never trust the client.                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

## Common Rules

| Field | Rule | Example |
|-------|------|---------|
| email | Valid format, max 255 chars | `test@example.com` |
| password | 8-128 chars, 1 upper, 1 lower, 1 number, 1 special | `Password123!` |
| name | 2-100 chars, letters + spaces + hyphens | `Arun Kumar` |
| phone | 10 digits, optional country code | `9876543210` or `+919876543210` |
| age | 18-100 | `28` |
| height | 122-231 cm (integer) | `170` |
| weight | 30-250 kg (optional) | `70` |

## Matrimony Profile Fields

| Field | Validation | Required | Notes |
|-------|-----------|----------|-------|
| name | 2-100 chars, alphabetic | Yes | Trimmed on save |
| gender | MALE / FEMALE | Yes | Enum |
| dateOfBirth | Valid date, must be 18-100 years ago | Yes | Age computed from DOB |
| maritalStatus | UNMARRIED / DIVORCED / WIDOWED / SEPARATED | Yes | Enum |
| religion | HINDU / MUSLIM / CHRISTIAN / ... | Yes | Enum |
| motherTongue | TAMIL / ... | Yes | Enum |
| caste | Must exist in caste reference | Yes | Foreign key |
| kulam | 2-100 chars | No | Clan name |
| gotram | 2-100 chars | No | Lineage |
| rasi | MESHA-MEENA (12) | No | Zodiac |
| nakshatra | ASHWINI-REVATHI (27) | No | Birth star |
| dosham | YES / NO | No | Astrological flaw |
| height | 122-231 cm integer | Yes | In cm |
| weight | 30-250 kg integer | No | In kg |
| education | Must exist in education list | Yes | Highest degree |
| occupation | Must exist in occupation list | Yes | Job role |
| annualIncome | Positive integer | Yes | In INR |
| siblings | 0-20 integer | No | Number of siblings |
| about | Max 5000 chars | No | Free text |
| preferences.ageMin | 18-100 | Yes | Partner age range |
| preferences.ageMax | preferences.ageMin - 100 | Yes | Must be >= ageMin |
| preferences.heightMin | 122-231 | No | Partner height range |
| preferences.heightMax | preferences.heightMin - 231 | No | Must be >= heightMin |

## Booking Fields

| Field | Validation | Required |
|-------|-----------|----------|
| mandapamId | Valid UUID, active mandapam | Yes |
| checkIn | Date, today or future | Yes |
| checkOut | Date, after checkIn | Yes |
| guestCount | 1-10000 | Yes |
| addonIds | Array of valid UUIDs | No |
| totalAmount | Positive integer | Yes (server recalculates) |

## Zod Schema Structure

```
DTO (Zod Schema)
  ├── body: z.object({...})   ← Request body
  ├── params: z.object({...}) ← URL params
  └── query: z.object({...})  ← Query string

Validated by:
  ├── requireBody(schema)     ← Parses + validates req.body
  ├── requireParams(schema)   ← Parses + validates req.params
  └── requireQuery(schema)    ← Parses + validates req.query

On failure:
  400 Bad Request
  { error: { code: "VALIDATION_ERROR", details: [...field errors] } }
```

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Age exactly 18 | Accepted (inclusive) |
| Height 122 cm | Accepted (minimum) |
| Height 231 cm | Accepted (maximum) |
| Height 121 cm | Rejected (below minimum) |
| Password with emoji | Rejected (no emoji allowed in password) |
| Email with + alias | Accepted (`test+alias@example.com`) |
| Name with apostrophe | Accepted (`O'Brien`) |
| Phone with spaces | Stripped before validation |
| DOB Feb 29 on non-leap year | Rejected (invalid date) |
| ageMin = 25, ageMax = 24 | Rejected (min > max) |
| Empty about field | Accepted (optional) |
| about with 5001 characters | Rejected (exceeds max) |
