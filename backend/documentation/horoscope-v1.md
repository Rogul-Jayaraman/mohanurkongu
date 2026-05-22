# Horoscope Module Architecture

> **Scope:** Horoscope Generation, Upload, Rendering, Switching, Runtime Flow  
> **Architecture Type:** Module Architecture (Independent Component)

---

## 1. Purpose

This document defines how the Horoscope Module operates.

The module supports two ways to provide horoscope data:

```
CREATE
  OR
UPLOAD
```

The goal is to maintain a single unified astrology structure regardless of how the horoscope is obtained.

### In Scope

- Horoscope generation
- Upload handling
- Response structure
- Frontend state
- Rendering
- Runtime execution
- Mode switching

### Out of Scope

- Profile creation
- Draft handling
- Membership
- Storage implementation
- Database design

---

## 2. Architecture Principles

### Principle 1 — Horoscope Module Is Independent

The horoscope module should only:

```
Receive → Calculate / Upload → Return Result
```

It should **not** save, know about profiles, or manage drafts.

### Principle 2 — Single Active Source

Only one horoscope source can exist at a time.

| Allowed | Not Allowed |
|---------|-------------|
| `CREATE` | `CREATE` + `UPLOAD` |
| `UPLOAD` | |

### Principle 3 — Rendering Must Be Read-Only

The frontend should **never** calculate horoscope data. It should only:

```
Read → Map → Display
```

---

## 3. Module Architecture

```
USER
  │
  ▼
HOROSCOPE MODULE
  ├── CREATE
  └── UPLOAD
  │
  ▼
NORMALIZED OUTPUT
  │
  ▼
RENDER
```

| Component | Responsibility |
|-----------|---------------|
| Create | Generate horoscope from birth details |
| Upload | Accept and store existing horoscope |
| Renderer | Display the horoscope output |

---

## 4. Horoscope Modes

Two modes are supported.

### CREATE

User provides birth details and the system generates the horoscope.

| Input | Type |
|-------|------|
| Date of Birth | `YYYY-MM-DD` |
| Time of Birth | `HH:MM` |
| Location | lat/lon + display name |

**Result:** Structured horoscope data (JSON)

### UPLOAD

User provides an image or PDF of an existing horoscope.

| Input | Type |
|-------|------|
| Image | File |
| PDF | File |

**Result:** Uploaded file reference

---

## 5. CREATE Mode — Runtime Flow

```
User enters DOB, Time, Location
  │
  ▼
  Generate
  │
  ▼
  API (POST /api/horoscope/generate)
  │
  ▼
  Calculation
  │
  ▼
  Response
  │
  ▼
Frontend State
```

---

## 6. Generation Endpoint

**Endpoint:** `POST /api/horoscope/generate`

### Request Body

```json
{
  "dateOfBirth": "1995-06-15",
  "timeOfBirth": "14:30",
  "location": {
    "displayName": "Coimbatore, India",
    "latitude": 11.0168,
    "longitude": 76.9558
  }
}
```

### Response Structure

The response contains 7 sections:

```
{
  input,          ← Echo of request
  meta,           ← Calculation metadata
  lagna,          ← Ascendant
  lagnaNavamsa,   ← D9 Ascendant
  planets[],      ← 9 grahas
  houses[],       ← 12 bhavas
  summary         ← Quick reference
}
```

---

## 7. Horoscope Calculation Pipeline

```
Input (DOB, Time, Location)
  │
  ▼
Astronomical Processing
  │
  ▼
Time Conversion
  │
  ▼
Sidereal Adjustment (Ayanamsa)
  │
  ▼
Planet Positions (Grahas)
  │
  ▼
House Calculation (D1 Rasi)
  │
  ▼
Navamsa Calculation (D9)
  │
  ▼
Summary
```

### Detailed Pipeline

```
DOB
  │
  ▼
Julian Day
  │
  ▼
Timezone (geo-tz from lat/lon)
  │
  ▼
Ayanamsa (Lahiri)
  │
  ▼
Graha Positions (Swiss Ephemeris)
  │
  ▼
D1 House Placement (Whole Sign)
  │
  ▼
D9 Navamsa Positions
  │
  ▼
Nakshatra + Pada
  │
  ▼
Summary
```

---

## 8. Response Architecture

### `input` — Original Input Snapshot

| Field | Type |
|-------|------|
| `dateOfBirth` | string |
| `timeOfBirth` | string |
| `location` | `{ displayName, latitude, longitude }` |

### `meta` — Calculation Metadata

| Field | Type | Description |
|-------|------|-------------|
| `ayanamsa` | number | Lahiri precession value |
| `julianDay` | number | Julian day number |
| `timezone` | string | IANA timezone string |

### `lagna` — Ascendant

| Field | Range | Description |
|-------|-------|-------------|
| `signIndex` | 0–11 | Zodiac sign index |
| `longitude` | 0–30 | Degree within sign |
| `nakshatraIndex` | 0–26 | Nakshatra index |
| `pada` | 1–4 | Nakshatra quarter |

### `lagnaNavamsa` — D9 Ascendant

| Field | Range |
|-------|-------|
| `signIndex` | 0–11 |
| `longitude` | 0–360 |

### `planets[]` — 9 Grahas

Each planet (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu):

| Field | Range | Description |
|-------|-------|-------------|
| `name` | string | Planet name |
| `longitude` | 0–360 | Full sidereal longitude |
| `signIndex` | 0–11 | Sign occupied |
| `degree` | 0–30 | Degree within sign |
| `house` | 1–12 | House in D1 chart |
| `nakshatraIndex` | 0–26 | Nakshatra index |
| `pada` | 1–4 | Pada within nakshatra |
| `navamsaSignIndex` | 0–11 | Sign in D9 chart |
| `navamsaHouse` | 1–12 | House in D9 chart |

### `houses[]` — 12 Bhavas

Each house:

| Field | Range | Description |
|-------|-------|-------------|
| `number` | 1–12 | House number |
| `signIndex` | 0–11 | Sign occupying this house |
| `planets` | string[] | Planets in this house |

### `summary` — Quick Display

| Field | Description |
|-------|-------------|
| `rasiSignIndex` | Moon's sign (Rasi) |
| `lagnaSignIndex` | Ascendant sign (Lagnam) |
| `nakshatraIndex` | Moon's nakshatra (Star) |
| `nakshatraPada` | Moon's pada |
| `ayanamsa` | Formatted ayanamsa string |
| `locationName` | Birth location display name |

---

## 9. Frontend State Architecture

The generated horoscope is stored **without transformation** — the complete API response is persisted.

### State Structure

```
astrology
  ├── mode: "CREATE" | "UPLOAD"
  ├── generatedAt: ISO timestamp
  ├── horoscopeJson: { ... }     ← full API response (CREATE mode)
  ├── filePath: string           ← uploaded file path (UPLOAD mode)
  ├── birthTime: string
  ├── birthPlaceName: string
  ├── birthLatitude: number
  ├── birthLongitude: number
  ├── timezone: string
  └── ayanamsa: number
```

> **Rule:** Store the complete response. No normalization or transformation.

---

## 10. Rendering Architecture

Rendering must **never calculate** — it only maps stored data to display values.

### Flow

```
horoscopeJson
  │
  ▼
Lookup Tables (SIGNS, NAKSHATRAS, PLANETS)
  │
  ▼
Display
```

### Examples

**Sign lookup:**

| Input | Map | Output (EN) | Output (TA) |
|-------|-----|-------------|-------------|
| `signIndex: 0` | `SIGNS[0]` | Aries | மேஷம் |
| `signIndex: 4` | `SIGNS[4]` | Leo | சிம்மம் |

**Planet rendering:**

| Input | Map | Output (TA) |
|-------|-----|-------------|
| `name: "Sun"` | `PLANETS_TAMIL["Sun"]` | சூரியன் |
| `name: "Moon"` | `PLANETS_TAMIL["Moon"]` | சந்திரன் |

**Nakshatra rendering:**

| Input | Map | Output (EN) |
|-------|-----|-------------|
| `nakshatraIndex: 0` | `NAKSHATRAS[0]` | Ashwini |
| `nakshatraIndex: 13` | `NAKSHATRAS[13]` | Chitra |

---

## 11. Upload Mode — Runtime Flow

```
User selects horoscope file
  │
  ▼
  Upload
  │
  ▼
  Validate
  │
  ▼
  Store
  │
  ▼
Return file path
  │
  ▼
Frontend State
```

### Resulting State

```
astrology
  ├── mode: "UPLOAD"
  └── filePath: "/uploads/horoscope/abc123.pdf"
```

> No JSON data is stored in UPLOAD mode.

---

## 12. Mode Switching Architecture

Only **one mode survives** at any time. Switching replaces the previous mode entirely.

### CREATE → UPLOAD

```
Current: mode=CREATE, horoscopeJson={...}
  │
  ▼
Remove generated data (horoscopeJson)
  │
  ▼
Store upload reference (filePath)
  │
  ▼
Result: mode=UPLOAD, filePath="..."
```

### UPLOAD → CREATE

```
Current: mode=UPLOAD, filePath="..."
  │
  ▼
Delete uploaded file
  │
  ▼
Generate new horoscope
  │
  ▼
Result: mode=CREATE, horoscopeJson={...}
```

### State Transition Diagram

```
CREATE ──► REPLACE ──► UPLOAD

UPLOAD ──► REPLACE ──► CREATE
```

---

## 13. Error Handling

| Scenario | Behaviour |
|----------|-----------|
| Invalid DOB | Reject with validation error |
| Invalid time | Reject with validation error |
| Invalid location | Reject with validation error |
| Generation failure | Allow retry |
| Upload failure | Allow retry |
| Mode switch failure | Keep existing mode — no data loss |

---

## 14. Complete Runtime Architecture

```
USER
  │
  ▼
HOROSCOPE MODULE
  │
  ├── CREATE
  │     │
  │     Generate (POST /api/horoscope/generate)
  │     │
  │     ▼
  │   Response
  │
  └── UPLOAD
        │
        Upload File
        │
        ▼
      File Path
  │
  ▼
NORMALIZED RESULT
  │
  ▼
FRONTEND STATE (astrology)
  │
  ▼
RENDER (lookup + display)
```

---

## 15. Final Engineering Rules

| Rule | Guideline |
|------|-----------|
| **Generation** | Pure calculation — no side effects |
| **Response** | Immutable — never modify after receipt |
| **Rendering** | Read-only — never calculate |
| **Frontend** | Store the entire response, no normalization |
| **Mode** | Single active mode only |
| **Switch** | Replace previous — no merge |
| **Lookup** | UI responsibility (arrays, not calculation) |

---

*End of Document*
