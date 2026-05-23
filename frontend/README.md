# Frontend — Mohanur Kongu Manamaalai

React 19 SPA with TypeScript, Tailwind CSS v4, and react-router v7.

---

## Getting Started

```bash
npm install
cp .env.example .env   # or create manually
npm run dev            # http://localhost:5173
```

**Required `.env` variables:**

```
VITE_API_URL=http://localhost:4000
VITE_TRANSLITERATE_API_URL=https://inputtools.google.com/request
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | `tsc --noEmit && vite build` |
| `npm run preview` | Preview production build |
| `npx tsc --noEmit` | TypeScript check only |

---

## Architecture

### Provider Nesting (in `App.tsx`)

```
<LanguageProvider>          ← i18n, t(), setLanguage(), lang state
  <CapsLockProvider>        ← global CapsLock keyup listener
    <AuthProvider>          ← auth state machine, login/logout/refresh
      <Toaster />           ← sonner toast notifications
      <RouterProvider />    ← react-router v7
```

### Auth State Machine

```
anonymous → login() → authenticated
         → otp_pending → register_pending → signup() → authenticated
authenticated → refresh failure → expired
authenticated → logout() → anonymous
```

Managed by `useAuth()` hook in `src/hooks/useAuth.tsx`.

### Route Structure

| Route | Layout | Access |
|-------|--------|--------|
| `/` | Landing | Public |
| `/maaligai/*` | MaaligaiLayout | Public |
| `/manamaalai/login` | AuthLayout | Public only |
| `/manamaalai/signup` | AuthLayout | Public only |
| `/manamaalai/forgot-password` | AuthLayout | Public only |
| `/manamaalai/*` | UserLayout | Authenticated USER |
| `/admin/login` | AuthLayout | Public only |
| `/admin/*` | AdminLayout | Authenticated ADMIN |

---

## Key Files

### API Layer

| File | Purpose |
|------|---------|
| `src/lib/api.ts` | Axios instance with auth interceptor + silent 401 refresh |
| `src/lib/errors.ts` | `AppError` class, `getErrorMessage()`, `isAppError()`, `getFieldError()` |
| `src/api/auth.api.ts` | All 12 auth endpoint functions with typed DTOs |

### Auth Context

| File | Purpose |
|------|---------|
| `src/hooks/useAuth.tsx` | `AuthProvider` + `useAuth()`. State machine, `login()`, `logout()`, `restoreSession()`, `refreshSession()` |
| `src/adapters/auth.adapter.ts` | Maps `BackendAccount` → `User`/`Admin`, localStorage helpers |

### Auth Components

| File | Purpose |
|------|---------|
| `src/components/features/auth/Login.tsx` | Login page (hero + form wrapper) |
| `src/components/forms/auth/LoginForm.tsx` | Self-contained login form |
| `src/components/features/auth/Signup.tsx` | Single-page signup form + OTP modal |
| `src/components/forms/auth/SignupForm.tsx` | 6 sub-form components (name, email, OTP, phone, password, terms, submit) |
| `src/components/modals/auth/OtpVerificationModal.tsx` | OTP verification modal (6-digit input + verify/resend) |
| `src/components/features/auth/ForgotPassword.tsx` | Multi-step password reset wizard |
| `src/components/forms/auth/ForgotPasswordForm.tsx` | Identify + Reset form components |

### Forms

| File | Purpose |
|------|---------|
| `src/components/forms/user/ChangePasswordForm.tsx` | Drawer for password change (calls real API) |

### Routing Guards

| File | Purpose |
|------|---------|
| `src/components/features/auth/ProtectedRoute.tsx` | Redirects unauthenticated users to login, wrong-role to dashboard |
| `src/components/features/auth/PublicRoute.tsx` | Redirects authenticated users to dashboard |

### i18n

| File | Purpose |
|------|---------|
| `src/i18n.ts` | i18next init (16 namespaces, en/ta) |
| `src/context/LanguageContext.tsx` | Language provider + `t()` + `translateError()` |
| `src/hooks/useTranslations.ts` | Alternative hook with configurable namespaces |
| `src/locales/index.ts` | Aggregates all locale TS files |

### Contexts

| File | Purpose |
|------|---------|
| `src/context/LanguageContext.tsx` | Language state, translation functions |
| `src/context/CapsLockContext.tsx` | Single global `keyup` listener for CapsLock state |

### Utilities

| File | Purpose |
|------|---------|
| `src/utils/validation.ts` | `validateLogin()`, `validateSignupStep()` |
| `src/utils/stubs.ts` | Placeholder data for routes not yet built on backend |
| `src/utils/formatName.ts` | `formatFullName()`, `getInitials()` |

---

## i18n Details

### Namespace Structure (16 namespaces)

| Namespace | Covers |
|-----------|--------|
| `common` | Shared labels (logout, save, verify, nav, profile, districts, days, etc.) |
| `auth` | Login, forgot password, transliteration |
| `signup` | Registration form, OTP, hero |
| `dashboard` | User dashboard, payment info, plans |
| `errors` | Validation messages, error codes |
| `myaccount` | Account details, membership, change password drawer |
| `myprofiles` | Profile listing |
| `browse` | Browse/search profiles |
| `shortlist` | Shortlist features |
| `profile_new` | Profile creation wizard |
| `adminLogin` | Admin login page |
| `adminLayout` | Admin sidebar/navigation |
| `adminMatrimony` | Admin matrimony management |
| `adminMandapam` | Admin mandapam management |
| `analytics` | Analytics dashboard |
| `landing` | Landing/home page |
| `maaligai` | Maaligai (hall booking) site |

### Dot-notation Resolution

Both `useLanguage()` and `useTranslations()` resolve keys like `errors.invalidCredentials` as:
1. Match against known namespace prefixes (`errors.`, `auth.`, `signup.`, `common.`, etc.)
2. Convert to `namespace:key` format (e.g., `errors:invalidCredentials`)
3. Fallback: try `common:fullKey`, then search all semantic namespaces

### Adding New Translations

1. Edit the appropriate namespace file in both `locales/en/` and `locales/ta/`
2. Ensure the key is exported with the correct name (e.g., `myAccountEn` in en, `myAccountTa` in ta)
3. The `locales/index.ts` auto-imports via the `resources` object

---

## Silent Token Refresh

In `src/lib/api.ts`:

1. On 401 response, check if refresh is already in-flight (`isRefreshing` flag).
2. If yes, queue the failed request.
3. If no, call `POST /auth/refresh` with `withCredentials: true` (sends httpOnly cookie).
4. On success: update `localStorage('token')`, replay queued requests.
5. On failure: clear `localStorage` (`token`, `user`), redirect to `/manamaalai/login`.

```typescript
// Key behavior in api.ts interceptor:
// - Queues concurrent 401s so only one refresh call is made
// - Uses raw axios (not the api instance) for the refresh call to avoid infinite loop
// - Redirects via window.location.href on refresh failure
```

---

## Component Conventions

- **Features** (`components/features/`): Page-level orchestrators. Manage state, call APIs, compose sub-components.
- **Forms** (`components/forms/`): Presentational form components. Receive callbacks via props. Some are self-contained (LoginForm), most are controlled.
- **Modals** (`components/modals/`): Overlay/drawer components using `createPortal` + `framer-motion` `AnimatePresence`.
- **UI** (`components/ui/`): Generic reusable components (inputs, buttons, cards, tables, layouts).

---

## Stubs vs Real APIs

| Feature | Status | File |
|---------|--------|------|
| Login | ✅ Real API | `auth.api.ts` → `authApi.login()` |
| Signup | ✅ Real API | `auth.api.ts` → `authApi.sendRegistrationOtp/verifyRegistrationOtp/signup` |
| Forgot Password | ✅ Real API | `auth.api.ts` → `authApi.sendPasswordResetOtp/verifyPasswordResetOtp/resetPassword` |
| Change Password | ✅ Real API | `auth.api.ts` → `authApi.changePassword()` |
| Profile refresh | ✅ Real API | `auth.api.ts` → `authApi.getProfile()` via `useAuth.restoreSession()` 