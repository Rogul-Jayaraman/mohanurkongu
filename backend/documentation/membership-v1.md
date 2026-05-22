# Membership Architecture

> **Version:** 1.0  
> **Scope:** Membership Plans, Discovery Control, Access Management, Quotas, Subscription Lifecycle  
> **Architecture Type:** Business + System Architecture  
> **Deployment Target:** Single Server (Hostinger VPS) → Future Scalable Deployment

---

## 1. Purpose

This document defines how membership operates across the platform.

### In Scope

- Profile discovery
- Profile access
- Usage quotas
- Feature availability
- Profile ownership capacity
- Subscription lifecycle

### Out of Scope

- Data ownership
- Profile lifecycle
- Profile visibility
- Profile status
- User account status

---

## 2. Architecture Principles

### Principle 1 — Membership Controls Access

Membership decides whether a user can perform an action. It **never** decides who owns data.

### Principle 2 — Discovery Must Be Layered

Profile access is separated into layers:

```
Browse → Open → Unlock
```

Users should discover first. Membership restrictions apply later in the flow.

### Principle 3 — Membership Never Deletes User Data

Expiry must **never** remove profiles, shortlists, or unlocked data. Membership only reduces access.

### Principle 4 — Configuration Over Hardcoding

Avoid plan-name-based conditionals like `if GOLD`. Use capabilities, limits, and rules instead.

### Principle 5 — Membership Is Independent

Membership must remain separate from profile, account, discovery, and storage.

---

## 3. System Architecture

Membership acts as an **authorization layer** between the user and the application.

```
USER
  │
  ▼
ACCOUNT
  │
  ▼
ACTIVE MEMBERSHIP
  │
  ▼
POLICY ENGINE
  │
  ▼
APPLICATION
```

| Component | Responsibility |
|-----------|---------------|
| Account | Identity |
| Membership | Plan rules |
| Policy Engine | Authorization decision |
| Application | Execution |

---

## 4. Discovery Architecture

Profile discovery has **three layers**, each with different permissions:

```
Browse ──► Open ──► Unlock
```

---

## 5. Browse Layer

**Purpose:** Discovery — users explore available profiles.

**Returns:** Card View

| Visible | Not Visible |
|---------|-------------|
| Photo | Family |
| Age | Horoscope |
| Location | Phone |
| Education | Email |
| Occupation | |

**Consumption:** Browse Capacity

Browse does **not** consume open quota.

### Flow

```
Browse Request
  │
  ▼
Policy Check
  │
  ▼
Capacity Check
  │
  ▼
Return Cards
```

**Example:**

| Metric | Value |
|--------|-------|
| Viewed | 34 / 50 |
| Remaining | 16 |

---

## 6. Open Layer

**Purpose:** Evaluate a specific profile.

**Returns:** Preview View

| Visible |
|---------|
| Family |
| Description |
| Basic Horoscope |

**Consumption:** Open Capacity

**Rule:** Consume only **once per profile** (deduplicated).

| Scenario | Consumption |
|----------|-------------|
| Open Profile A (first time) | 1 |
| Open Profile A (again) | 0 |
| Open Profile B (first time) | 1 |

### Flow

```
Open Profile
  │
  ▼
Already Opened?
  │
  ├── Yes → Return Preview (no consumption)
  │
  └── No  → Consume → Return Preview
```

---

## 7. Unlock Layer

**Purpose:** Premium access to full profile details.

**Returns:**

- Phone
- Email
- Full Horoscope
- Print

**Consumption:** No quota — gated by membership capability.

### Flow

```
Preview
  │
  ▼
Policy Check
  │
  ▼
Unlock
  │
  ▼
Return Full Access
```

---

## 8. Membership Capability Model

Membership controls the following dimensions:

| Capability | Description |
|------------|-------------|
| Browse Capacity | Number of profile cards viewable |
| Open Capacity | Number of profile previews |
| Search Capability | Filter scope and depth |
| Shortlist Capacity | Number of savable profiles |
| Profile Slots | Maximum simultaneous profiles |
| Contact Access | Phone / email visibility |
| Print Access | Print profile / horoscope |
| Duration | Membership validity period |

---

## 9. Membership Plan Matrix

| Capability | Bronze (Free) | Silver | Gold | Platinum |
|------------|---------------|--------|------|----------|
| Duration | Free | 3 Months | 6 Months | 12 Months |
| Browse Capacity | 50 | 100 | 200 | 400 |
| Open Capacity | 10 | 20 | 30 | Unlimited |
| View Details | No | Yes | Yes | Yes |
| Contact Access | No | No | No | Yes |
| Shortlist | 0 | 3 | 10 | Unlimited |
| Print | No | Profile | Profile + Horoscope | Profile + Horoscope |
| Search Capability | Basic | Extended | Advanced | Full |
| Profile Slots | 1 | 3 | 5 | 10 |

---

## 10. Profile Slot Architecture

Membership controls the **maximum simultaneous profiles**, not the total ever created.

### Slot Consumption

| Status | Consumes Slot? |
|--------|----------------|
| DRAFT | ✅ |
| PENDING | ✅ |
| ACTIVE | ✅ |
| ARCHIVED | ✅ |
| REJECTED | ❌ |
| DELETED | ❌ |

### Flow

```
Create Profile Request
  │
  ▼
Policy Engine
  │
  ▼
Capacity Check
  │
  ▼
Allow / Deny
```

**Example:**

| Metric | Value |
|--------|-------|
| Limit | 5 |
| Used | 3 |
| Available | 2 |

---

## 11. Shortlist Architecture

Membership controls **access** to shortlisted profiles, never ownership.

### States

| State | Meaning |
|-------|---------|
| `ACTIVE` | Accessible — within membership capacity |
| `LOCKED` | Saved but temporarily unavailable — upgrade required to access |

### Flow

```
Load Shortlist
  │
  ▼
Membership Check
  │
  ▼
Apply Capacity
  │
  ▼
Return (Active + Locked)
```

**Example:**

| Metric | Value |
|--------|-------|
| Saved | 10 |
| Allowed | 3 |
| Active | 3 |
| Locked | 7 |

---

## 12. Search Architecture

Search is **capability-based**, not plan-name-based.

### Available Filters by Capability

| Filter | Basic | Extended | Advanced | Full |
|--------|-------|----------|----------|------|
| Age | ✅ | ✅ | ✅ | ✅ |
| Location | ✅ | ✅ | ✅ | ✅ |
| Education | ❌ | ✅ | ✅ | ✅ |
| Occupation | ❌ | ✅ | ✅ | ✅ |
| Horoscope | ❌ | ❌ | ✅ | ✅ |
| Advanced filters | ❌ | ❌ | ❌ | ✅ |

### Flow

```
Search Request
  │
  ▼
Policy Check
  │
  ▼
Allowed Filters Applied
  │
  ▼
Return Results
```

---

## 13. Membership Expiry Architecture

Expiry **never removes data**. It only reduces access.

### Flow

```
Subscription Expired
  │
  ▼
Move to Free Plan
  │
  ▼
Recalculate Access
```

### Effects

| Changes | Preserved |
|---------|-----------|
| Reduce access | ✅ Profiles |
| Freeze creation | ✅ Shortlists |
| Lock features | ✅ History |

---

## 14. Upgrade Architecture

Upgrading expands capacity and unlocks features. No migration needed.

```
Bronze ──► Platinum
```

**Effects:**

- More capacity
- More features
- Unlock access
- No data migration

---

## 15. Downgrade Architecture

Downgrading preserves existing data but restricts future actions.

```
Platinum ──► Silver
```

**Effects:**

| Area | Behaviour |
|------|-----------|
| Existing data | Preserved |
| New creation | Restricted |
| Excess shortlists | Locked (not deleted) |
| Profile over limit | No deletion |

---

## 16. Admin Architecture

Administrators own membership configuration through a management interface.

### Flow

```
Admin
  │
  ▼
Plan Management
  │
  ▼
Publish
  │
  ▼
Users
```

### Admin Controls

- Duration
- Browse capacity
- Open capacity
- Search filters
- Shortlist limit
- Profile slots
- Print access
- Contact access

> No deployment required for plan changes.

---

## 17. Plan Lifecycle

Plans should **never mutate** once published. Changes create new versions.

```
Draft ──► Published ──► Active ──► Archived
```

### Versioning

Existing subscriptions remain tied to their plan version even when a new version is published.

```
Silver V1 (subscribed users stay on V1)
  │
  ├── Silver V2 (new subscribers)
  │
  └── Silver V1 users unaffected
```

---

## 18. Runtime Authorization Flow

Every protected action follows this pipeline:

```
Request
  │
  ▼
Membership Lookup
  │
  ▼
Policy Engine
  │
  ▼
Capability Check
  │
  ▼
Quota Check
  │
  ▼
Allow / Deny
```

### Protected Actions

| Action | Layer |
|--------|-------|
| Browse profiles | Browse |
| Open profile | Open |
| Search | Search |
| Shortlist | Shortlist |
| Create profile | Profile Slots |
| Reveal contact | Unlock |
| Print | Print |

---

## 19. Complete Runtime Architecture

```
USER
  │
  ▼
ACCOUNT
  │
  ▼
MEMBERSHIP
  │
  ▼
POLICY ENGINE
  │
  ├── Browse
  ├── Open
  ├── Search
  ├── Shortlist
  ├── Contact
  ├── Print
  └── Create Profile
  │
  ▼
APPLICATION
```

---

## 20. Final Engineering Rules

### Membership Controls

| Area | Controlled By Membership? |
|------|--------------------------|
| Access | ✅ |
| Quota | ✅ |
| Capability | ✅ |

### Membership Never Controls

| Area | Controlled By Membership? |
|------|--------------------------|
| Ownership | ❌ |
| Deletion | ❌ |
| Lifecycle | ❌ |

### Discovery Layers

```
Browse → Open → Unlock
```

### Quota Separation

```
Browse Capacity ≠ Open Capacity
```

### Expiry Behaviour

```
Reduce Access — Never Delete
```

---

*End of Document*
