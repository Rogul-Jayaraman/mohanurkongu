# Frontend Codebase Tour

React SPA structure, component hierarchy, and current API completion status.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FRONTEND CODEBASE MAP                               │
│                                                                         │
│   frontend/src/                                                         │
│   ├── App.tsx                ← Provider nesting + router mount         │
│   ├── main.tsx               ← ReactDOM.createRoot entry              │
│   ├── i18n/                  ← 16 namespaces × 2 languages            │
│   │   ├── en/                ← English translation files              │
│   │   └── ta/                ← Tamil translation files                │
│   │                                                                     │
│   ├── components/            ← Reusable UI components                 │
│   │   ├── ui/                 ← Button, Input, Modal, Card, Table...   │
│   │   ├── Feature/           ← Product-specific (ProfileCard, etc.)   │
│   │   ├── Form/              ← Form components with validation        │
│   │   ├── Layout/            ← Header, Footer, Sidebar, PageShell     │
│   │   └── shared/            ← LoadingSpinner, ErrorDisplay, etc.     │
│   │                                                                     │
│   ├── hooks/                 ← React Query hooks + custom hooks       │
│   │   ├── useAuth.ts          ← Auth state + refresh logic            │
│   │   ├── useProfile.ts      ← Profile CRUD hooks                     │
│   │   ├── useBooking.ts      ← Booking hooks                          │
│   │   └── useTranslation.ts  ← i18n hook wrapper                      │
│   │                                                                     │
│   ├── pages/                 ← Page components (one per route)        │
│   │   ├── auth/              ← Login, Register, ForgotPassword         │
│   │   ├── manamaalai/        ← Profile list, detail, my profiles      │
│   │   ├── maaligai/          ← Mandapam list, detail, booking form    │
│   │   └── admin/             ← Dashboard, profile admin, booking adm  │
│   │                                                                     │
│   ├── services/              ← Axios API calls                        │
│   │   ├── api.ts             ← Axios instance with interceptors       │
│   │   ├── auth.service.ts    ← Auth API functions                     │
│   │   ├── profile.service.ts ← Profile API functions                  │
│   │   └── booking.service.ts ← Booking API functions                  │
│   │                                                                     │
│   ├── types/                 ← TypeScript type definitions            │
│   ├── utils/                 ← Helper functions                       │
│   └── routes/                ← Route definitions                      │
└─────────────────────────────────────────────────────────────────────────┘
```

## Provider Nesting (in `App.tsx`)

```
<LanguageProvider>         ← i18n context
  <CapsLockProvider>       ← Caps lock detection
    <AuthProvider>         ← Auth state + auto-refresh
      <ErrorBoundary>      ← Catches render errors
        <Suspense>          ← Loading fallback
          <BrowserRouter>   ← Client-side routing
            <Routes/>
          </BrowserRouter>
        </Suspense>
      </ErrorBoundary>
    </AuthProvider>
  </CapsLockProvider>
</LanguageProvider>
```

## Auth State Management

`AuthProvider` in `useAuth.ts` manages:
- **State**: `anonymous | authenticated | token_expired | logged_out`
- **Actions**: `login()`, `logout()`, `refreshToken()`
- On mount: checks for existing cookie → validates → sets state

## API Completion Status

| Area | Backend | Frontend |
|------|---------|----------|
| Auth (login, register, OTP, refresh) | ✅ Full | ✅ Full |
| Profile CRUD | ✅ Full | 🟡 Partial (view + browse done) |
| Profile browse + shortlist | ✅ Full | 🟡 Partial |
| Admin profile management | ✅ Full | ⬜ Stub only |
| Mandapam booking | ✅ Full | 🟡 Partial |
| Calendar view/block | ✅ Full | ⬜ Stub |
| Settlement/payment | ✅ Full | ⬜ Stub |
| Analytics | ✅ Full | ⬜ Stub |
| Admin dashboard | ✅ Full | ⬜ Stub |

## Key Frontend Libraries

| Library | How It's Used |
|---------|---------------|
| React Query | Every page that fetches data uses `useQuery`/`useMutation` |
| React Router | Route-based code splitting via `lazy()` + `Suspense` |
| i18next | Every user-facing string uses `t()` function |
| Zod | Form validation (reuses backend DTO shapes where possible) |
| Axios | Single instance with auth interceptor in `services/api.ts` |
