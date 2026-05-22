# Profile Status Architecture

> **Version:** 1.0  
> **Scope:** Profile Lifecycle, Visibility, Moderation & Availability  
> **Architecture Type:** Business State Architecture  
> **Deployment:** Single Server (Hostinger VPS)

---

## 1. Purpose

This document defines how profile status operates across the entire system.

### In Scope

- Profile creation lifecycle
- Profile publishing
- Verification workflow
- Profile retirement
- Account suspension
- Public discoverability
- Matching eligibility
- Profile availability
- Admin moderation

### Out of Scope

- Upload architecture
- Draft storage implementation
- Database schema
- File management
- Profile creation implementation

---

## 2. Architecture Principles

The architecture follows five core rules.

### Rule 1 — Single Responsibility

Each status controls only **one** concern.

```
Account    → Access
Profile    → Lifecycle
Visibility → Discoverability
```

### Rule 2 — No Duplicate Statuses

Avoid having verification, lifecycle, approval, and publication across separate fields. The profile lifecycle should own all profile transitions.

### Rule 3 — Visibility Is Not Lifecycle

Visibility only controls **private** vs **public** display. It should not control approval.

### Rule 4 — Account Owns Profiles

Suspending an account automatically affects its profiles. Profiles should never need individual updates when an account is suspended.

### Rule 5 — Compute Availability Dynamically

Do **not** store computed states like `MATCHABLE` or `HIDDEN`. Calculate them dynamically at query time.

---

## 3. System Architecture

Three domains govern profile status:

```
ACCOUNT
   │
   ▼
PROFILE
   │
   ▼
VISIBILITY
```

**Full resolution chain:**

```
User
  │
  ▼
Account State
  │
  ▼
Profile State
  │
  ▼
Visibility State
  │
  ▼
Availability Resolution
  │
  ▼
Discovery / Matching
```

---

## 4. Account Domain

### Responsibility

Controls user access. The account acts as the parent — profiles inherit account restrictions.

### States

| State | Description |
|-------|------------|
| `ACTIVE` | Account operational. Profiles continue normally. |
| `SUSPENDED` | Account restricted. All profiles become unavailable. |

### Behaviour

| State | Editable | Visible | Matchable |
|-------|----------|---------|-----------|
| ACTIVE | ✅ | ✅ (per profile) | ✅ (per profile) |
| SUSPENDED | ❌ | ❌ | ❌ |

> **Important:** Account state overrides profile state. No profile updates are allowed while suspended.

### State Flow

```
ACTIVE ──► SUSPENDED ──► ACTIVE
```

---

## 5. Profile Domain

### Responsibility

Controls the profile lifecycle from creation through deletion.

### States

| State | Meaning |
|-------|---------|
| `DRAFT` | Profile created but incomplete. Editable, private, not matchable. |
| `PENDING` | Submitted for moderation. Locked, private, awaiting verification. |
| `ACTIVE` | Approved. Eligible for matching, discoverable. |
| `REJECTED` | Verification permanently failed. Read-only, no edit, no resubmit. |
| `ARCHIVED` | Intentionally retired (e.g., match found, marriage completed). Preserved, recoverable, not matchable. |
| `DELETED` | Permanently removed. Terminal state. |

### State Details

#### DRAFT

- Editable
- Private
- Not matchable
- Example: Save Draft

#### PENDING

- Locked (no edits)
- Private
- Waiting verification
- Example: Create Profile → submitted for admin review

#### ACTIVE

- Eligible for matching
- Discoverable in search results

#### REJECTED

- Read-only
- No editing or resubmission
- Admin-controlled
- Remains rejected until admin action

#### ARCHIVED

- Preserved (data retained)
- Recoverable
- Not matchable
- Restore path: `ARCHIVED → ACTIVE`
- Archive is intentional — not suspension, not rejection

#### DELETED

- Unavailable
- Terminal state (no recovery)

---

## 6. Visibility Domain

### Responsibility

Controls profile discoverability only. Visibility does **not** affect lifecycle.

### States

| State | Meaning | Matchable | Searchable |
|-------|---------|-----------|------------|
| `PRIVATE` | Profile hidden | No | No |
| `PUBLIC` | Profile visible | Yes | Yes |

**PRIVATE applies when:**

- Profile is in DRAFT or PENDING status
- Profile is ARCHIVED
- User manually hides the profile

---

## 7. Availability Resolution Engine

Availability is **never stored** — it is calculated dynamically on every request.

### Resolution Rule

```
IF  Account  = ACTIVE
AND Profile  = ACTIVE
AND Visibility = PUBLIC
THEN Matchable
ELSE Hidden
```

### Resolution Table

| Account | Profile | Visibility | Result |
|---------|---------|------------|--------|
| ACTIVE | ACTIVE | PUBLIC | **Matchable** |
| ACTIVE | ACTIVE | PRIVATE | Hidden |
| ACTIVE | DRAFT | PUBLIC | Hidden |
| ACTIVE | PENDING | PUBLIC | Hidden |
| ACTIVE | REJECTED | PUBLIC | Hidden |
| ACTIVE | ARCHIVED | PUBLIC | Hidden |
| SUSPENDED | ACTIVE | PUBLIC | Hidden |
| SUSPENDED | any | any | Hidden |

---

## 8. Profile Lifecycle

### Draft Creation

```
LOCAL ──► DRAFT
```

### Submission

```
DRAFT ──► PENDING
```

### Approval

```
PENDING ──► ACTIVE
```

### Rejection

```
PENDING ──► REJECTED
```

### Archive

```
ACTIVE ──► ARCHIVED
```

### Restore

```
ARCHIVED ──► ACTIVE
```

### Delete

```
ANY ──► DELETED
```

---

## 9. Complete State Diagram

```
LOCAL
  │
  ▼
DRAFT
  │
  ▼
PENDING
  ├──► ACTIVE
  │       │
  │       ├──► ARCHIVED ──► ACTIVE
  │       │
  │       └──► DELETED
  │
  ├──► REJECTED
  │       │
  │       └──► DELETED
  │
  └──► DELETED
```

---

## 10. Account Override Flow

The account state overrides all profile-level states.

```
ACTIVE ──► SUSPENDED
              │
              ▼
      All Profiles Hidden
              │
              ▼
      ACTIVE (restored)
              │
              ▼
      Profiles Restore
```

> No profile state records are changed during suspension — only the computed availability changes.

---

## 11. Runtime Resolution Flow

Every request follows this resolution pipeline:

```
Request
  │
  ▼
Load Account
  │
  ▼
Load Profile
  │
  ▼
Load Visibility
  │
  ▼
Resolve Availability
  │
  ▼
Return Response
```

### Resolution Logic (Pseudocode)

```
if account.status == SUSPENDED:
    return HIDDEN

if profile.status == ACTIVE AND visibility == PUBLIC:
    return MATCHABLE

return HIDDEN
```

---

## 12. Discovery Flow

### Public Discovery

```
Profiles
  │
  ▼
Availability Engine
  │
  ▼
Matchable Profiles only
  │
  ▼
Search / Recommendations
```

### Admin Discovery

Admins can view profiles in **all** states for moderation purposes.

### Owner Discovery

Users can view their **own** profiles regardless of state.

---

## 13. Business Rules

| State | Editable | Matchable | Discoverable | Notes |
|-------|----------|-----------|--------------|-------|
| DRAFT | ✅ | ❌ | ❌ | Incomplete, being created |
| PENDING | ❌ | ❌ | ❌ | Awaiting admin verification |
| ACTIVE | ✅ | ✅ | ✅ | Fully operational |
| REJECTED | ❌ | ❌ | ❌ | Final — admin action required to change |
| ARCHIVED | ❌ | ❌ | ❌ | User-retired, recoverable |
| DELETED | ❌ | ❌ | ❌ | Terminal — cannot be recovered |
| SUSPENDED | ❌ | ❌ | ❌ | Account-level restriction |

---

## 14. Final Architecture Summary

### Stored State

Three values are persisted:

```
ACCOUNT   (ACTIVE | SUSPENDED)
PROFILE   (DRAFT | PENDING | ACTIVE | REJECTED | ARCHIVED | DELETED)
VISIBILITY (PRIVATE | PUBLIC)
```

### Calculated Result

Two values are computed at runtime:

```
MATCHABLE
HIDDEN
```

### Key Principle

> **Store the source of truth. Compute the derived state.**

---

*End of Document*
