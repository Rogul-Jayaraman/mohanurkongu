# Frontend Architecture

React SPA structure, provider nesting, auth state machine, and component conventions.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PROVIDER NESTING (App.tsx)                          │
│                                                                         │
│   <LanguageProvider>              ← i18n (English + Tamil)             │
│     <CapsLockProvider>           ← Detects Caps Lock state            │
│       <AuthProvider>             ← Auth state + refresh logic         │
│         <ErrorBoundary>          ← Catches render errors             │
│           <Suspense fallback=     ← Loading spinner                   │
│           </Suspense>                                                  │
│             <BrowserRouter>                                         │
│               <Routes>           ← 65+ route definitions             │
│                 ...                                                    │
│               </Routes>                                                │
│             </BrowserRouter>                                           │
│           </Suspense>                                                  │
│         </ErrorBoundary>                                               │
│       </AuthProvider>                                                  │
│     </CapsLockProvider>                                                │
│   </LanguageProvider>                                                  │
│                                                                         │
│   LAYER RESPONSIBILITIES:                                              │
│   ┌──────────┬────────────────────────────────────────────────────┐   │
│   │ Provider │ What It Does                                       │   │
│   ├──────────┼────────────────────────────────────────────────────┤   │
│   │ Language │ Sets t() function, detects locale, manages switch  │   │
│   │ Auth     │ Tracks user session, auto-refreshes tokens         │   │
│   │ Query    │ React Query — caches server state, invalidates     │   │
│   │ Router   │ Client-side routing + route params                 │   │
│   └──────────┴────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Auth State Machine

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND AUTH STATE MACHINE                       │
│                                                                         │
│                   ┌──────────────┐                                      │
│                   │  ANONYMOUS   │                                      │
│                   └──────┬───────┘                                      │
│                          │ login success                                 │
│                          ▼                                              │
│                   ┌──────────────┐                                      │
│     ┌────────────▶│AUTHENTICATED │◀──────────────────┐                 │
│     │             └──────┬───────┘                    │                 │
│     │                    │                            │                 │
│     │  401 on API call   │  refresh success           │  refresh ok    │
│     │  (token expired)   │                            │                 │
│     │                    ▼                            │                 │
│     │             ┌──────────────┐                    │                 │
│     │             │TOKEN_EXPIRED │────────────────────┘                 │
│     │             └──────┬───────┘                                      │
│     │                    │ refresh fails                                 │
│     │                    ▼                                              │
│     │             ┌──────────────┐                                      │
│     └─────────────│   LOGGED_OUT │                                      │
│                   └──────────────┘                                      │
│                                                                         │
│   States:                                                               │
│   - ANONYMOUS: No session, no user data                                │
│   - AUTHENTICATED: Valid JWT, user data loaded                         │
│   - TOKEN_EXPIRED: Access token expired, trying refresh                │
│   - LOGGED_OUT: User logged out or refresh failed                     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Route Structure

```
frontend/src/
  routes/
    auth/           ← /auth/login, /auth/register, /auth/forgot-password
    manamaalai/     ← /profiles, /profiles/:id, /shortlist, /my-profiles
    maaligai/       ← /mandapams, /mandapams/:id, /my-bookings
    admin/          ← /admin/dashboard, /admin/profiles/*, /admin/mandapam/*
    shared/         ← /about, /contact, /terms
    public/         ← Landing pages
```

## Component Conventions

```
components/
  ui/               ← Reusable primitives (Button, Input, Modal, Card, Table)
  Feature/          ← Product-specific (LoginForm, ProfileCard, BookingCalendar)
  Form/             ← Form components with validation
  Layout/           ← Header, Footer, Sidebar, PageShell
  shared/           ← Cross-cutting (LoadingSpinner, ErrorDisplay, EmptyState)
```

### Pattern

| Convention | Example | Description |
|-----------|---------|-------------|
| Feature/ | `ProfileCard` | Product-specific, reusable component |
| Form/ | `LoginForm` | Form with Zod validation + error display |
| ui/ | `Button` | Generic UI primitive |
| Layout/ | `PageShell` | Page wrapper with sidebar + header |
| shared/ | `ErrorDisplay` | Cross-cutting utility component |

## Key Frontend Libraries

| Library | Purpose |
|---------|---------|
| React Query | Server state caching, auto-refetch, optimistic updates |
| React Router | Client routing with nested layouts |
| i18next | Internationalization (16 namespaces) |
| Zod | Form validation (shared types with backend) |
| Axios | HTTP client with interceptors for auth |

## Edge Cases

| Scenario | Handling |
|----------|----------|
| User opens app, session expired | AuthProvider checks cookie → 401 on first API call → redirect to login |
| Two tabs, logout in one | Second tab's next API call gets 401 → redirect to login |
| Refresh token also expired | 401 → clear all state → redirect to login with return URL |
| API returns 429 (rate limit) | Axios interceptor shows toast, retries after delay |
| Network offline | React Query stale data shown if available; else OfflineState |
