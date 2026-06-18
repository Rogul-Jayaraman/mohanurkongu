# Pipeline 12: profile-showcase (Frontend)

> **For beginners**: Frontend side of the landing page showcase. Shows
> featured profiles without requiring login.

## Purpose

Dual-purpose display of featured profiles. Has two modes: **public** (unauthenticated landing page) and **authenticated** (dashboard). Public mode shows a limited set and prompts login. Authenticated mode shows personalized featured profiles.

## Actor & Entry

| Path | Auth | Role | Validation |
|---|---|---|---|
| `/` (root landing) | Public | None | — |
| `/manamaalai/dashboard` | Authenticated Sidebar link | USER | — |

**Allowed Roles:** `PUBLIC` (landing), `USER` (dashboard)

## High-Level Architecture

```
  ┌─ Route detection (isAuthenticated)
  │
  ├─ Public (landing page) ─────────────────────────────────────┐
  │  S1. fetchShowcaseProfiles('public')                        │
  │      → GET /profiles/showcase?scope=public                  │
  │  S2. render profile cards (3 max, no contact info)          │
  │  S3. CTA: "Sign up to view more" → /auth/signup            │
  └─────────────────────────────────────────────────────────────┘
  │
  ├─ Authenticated (dashboard) ─────────────────────────────────┐
  │  S4. fetchShowcaseProfiles('authenticated', token)          │
  │      → GET /profiles/showcase?scope=authenticated           │
  │  S5. render profile cards (up to 6, with shortlist toggle) │
  │  S6. scrollable carousel on mobile                          │
  └─────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture — Step by Step

---

### S1: fetchShowcaseProfiles (public)

```
====================================================================================
S1: fetchShowcaseProfiles (public)
────────────────────────────────────────────────────────────────────────────────────
Trigger: landing page mount

  try {
    const profiles = await getPublicShowcase();
    // GET /profiles/showcase (no auth)
    // Backend: returns 3 random ACTIVE profiles with limited fields
    setShowcaseProfiles(profiles);
  } catch (err) {
    // Showcase failure is non-critical — page still renders
    // Show placeholder cards or hide section
    console.error('Showcase load failed', err);
  }

Output: 3 profile cards rendered on landing page
```

---

### S4: fetchShowcaseProfiles (authenticated)

```
====================================================================================
S4: fetchShowcaseProfiles (authenticated)
────────────────────────────────────────────────────────────────────────────────────
Trigger: dashboard mount

  try {
    const profiles = await getUserShowcase();
    // GET /profiles/showcase (with auth header)
    // Backend: returns up to 6 personalized ACTIVE profiles
    setShowcaseProfiles(profiles);
  } catch (err) {
    ┌─ showcaseError matrix ────────────────────────────────────────────┐
    │  NETWORK_ERROR → hide showcase section silently                 │
    └───────────────────────────────────────────────────────────────────┘
  }

Output: Up to 6 profile cards with shortlist toggle
```

## Dependencies

| File | Role |
|---|---|
| `components/features/public/LandingPage.tsx` | Public showcase section |
| `components/features/user/Dashboard.tsx` | Authenticated showcase section |
| `api/profile.api.ts` | getPublicShowcase, getUserShowcase |
| `lib/errors.ts` | getErrorMessage |
