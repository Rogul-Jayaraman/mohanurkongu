# Frontend Architecture — Auth Pipeline Integration

> **For beginners**: This massive document connects the frontend (React
> components you see on screen) to the backend pipelines. Every auth
> flow — login, register, OTP, refresh, logout — maps to a specific
> backend pipeline documented in `05-pipelines/backend/auth/`.

## Overview

The frontend auth architecture mirrors the backend's three-router composition and pipeline-first design. Every authentication flow on the UI maps one-to-one to a backend pipeline — login maps to LoginPipeline, register maps to RegisterPipeline, refresh maps to RefreshPipeline, etc. The frontend handles **presentation, client-side validation, and redirect logic** while the backend owns **all security decisions, token issuance, and role enforcement**.

This document covers every frontend auth flow as an architecture diagram, showing how React components, API modules, the auth context, and the API client interceptor work together — and how each maps to its backend pipeline.

---

## Component Layer Map

The frontend auth system is organized into 7 distinct layers. Each layer has a specific responsibility, and data flows down through the layers (page → feature → form → API) and back up (API response → auth context → redirect).

```
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 1: Pages (React Router Routes)                               │
│                                                                     │
│  LoginPage         /manamaalai/login                                 │
│  AdminLoginPage    /admin/login                                      │
│  SignupPage        /manamaalai/signup                                │
│  ForgotPasswordPage /manamaalai/forgot-password                     │
│  DashboardPages    /manamaalai/dashboard/*, /admin/dashboard/*      │
└───────────────────────┬─────────────────────────────────────────────┘
                        │ composes
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 2: Feature Components (composition + orchestration)          │
│                                                                     │
│  LoginFormWrapper           AdminLoginFormWrapper                   │
│  SignupFormWrapper          ForgotPasswordFormWrapper                │
│  SignupHero                 LoginHero                                │
│  ProtectedRoute             PublicRoute                              │
│  OtpVerificationModal                                                │
│  MatrimonialProfiles                                                 │
└───────────────────────┬─────────────────────────────────────────────┘
                        │ renders
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 3: Form Components (UI + field state)                        │
│                                                                     │
│  LoginForm                AdminLoginForm                            │
│  SignupNameForm           SignupEmailForm                           │
│  SignupPhoneForm          SignupPasswordForm                        │
│  SignupTermsForm          SignupSubmitForm                          │
│  ForgotPasswordIdentifyForm  ForgotPasswordResetForm                │
└───────────────────────┬─────────────────────────────────────────────┘
                        │ calls
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 4: API Modules (typed API functions)                         │
│                                                                     │
│  auth.api.ts          admin.api.ts          membership.api.ts      │
│  login()              adminLogin()          listPlans()             │
│  register()           adminRefresh()        getMySubscription()     │
│  refresh()            adminLogout()         getMyCapabilities()     │
│  logout()             adminGetProfile()     getBillingOverview()    │
│  sendRegistrationOtp()                                              │
│  verifyRegistrationOtp()                                            │
│  sendPasswordResetOtp()                                             │
│  verifyPasswordResetOtp()                                           │
│  resetPassword()                                                    │
│  changePassword()                                                   │
│  getProfile()                                                       │
└───────────────────────┬─────────────────────────────────────────────┘
                        │ sends via
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 5: API Client (Axios instance + interceptors)                │
│                                                                     │
│  lib/api.ts                                                         │
│  ┌─ Request interceptor: attach Bearer token + Accept-Language     │
│  ├─ Response interceptor: unwrap { success, data } or throw        │
│  └─ Error interceptor: catch 401 → refresh queue → retry/redirect │
└───────────────────────┬─────────────────────────────────────────────┘
                        │ updates
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 6: Auth Infrastructure (state + adapters)                    │
│                                                                     │
│  hooks/useAuth.tsx — AuthProvider + AuthContext                     │
│    ├─ login(accessToken, role?) → fetch profile → store session    │
│    ├─ logout() → POST logout → clear memory → hard redirect        │
│    ├─ restoreSession() → try refresh → decode JWT → fetch profile │
│    ├─ refreshSession() → POST /auth/refresh                        │
│    └─ adminRefreshSession() → POST /admin/auth/refresh             │
│                                                                     │
│  adapters/auth.adapter.ts                                          │
│    ├─ decodeJwtPayload(token) → { sub, roles, ... }                │
│    ├─ storeSession(token, account) → User | Admin                  │
│    └─ clearSession() → memory cleanup                              │
│                                                                     │
│  lib/session.ts — in-memory token store                            │
│    ├─ getAccessToken()                                              │
│    ├─ setAccessToken(token)                                         │
│    └─ clearAccessToken()                                            │
└───────────────────────┬─────────────────────────────────────────────┘
                        │ enforced by
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 7: Route Guards                                              │
│                                                                     │
│  ProtectedRoute — checks isAuthenticated + allowedRole              │
│    ├─ Not authenticated → redirect to login page                    │
│    └─ Wrong role → redirect to own dashboard                        │
│                                                                     │
│  PublicRoute — redirects authenticated users to dashboard           │
│    ├─ Authenticated USER → /manamaalai/dashboard                    │
│    └─ Authenticated ADMIN → /admin/dashboard                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow — Full Login Sequence

This shows the end-to-end flow from user clicking "Sign In" to landing on the dashboard. Every step is labeled with the component responsible and the backend pipeline invoked.

```
LoginForm                             AuthContext              API Client             Backend
(component)                           (useAuth)                (api.ts)               (server)
    │                                    │                        │                      │
    │  User fills identifier + password  │                        │                      │
    │  validateLogin(client-side)        │                        │                      │
    │  ├── identifier: string            │                        │                      │
    │  ├── password: string              │                        │                      │
    │  └── Both valid? YES               │                        │                      │
    │                                    │                        │                      │
    ├── authApi.login({identifier,       │                        │                      │
    │     password}) ────────────────────┼────────────────────►───┼── POST /auth/login ──┼──► LoginPipeline
    │                                    │                        │                      │   (portal: USER)
    │◄── 200 ───────────────────────────┼────────────────────◄───┼◄── { accessToken,    ◄──┼── SessionService
    │     { accessToken, sessionId }    │                        │      sessionId }      │      .createSession()
    │                                    │                        │                      │
    ├── auth.login(accessToken) ─────────┼──►                     │                      │
    │                                    │                        │                      │
    │                                    ├── setAccessToken(token)──► session.ts memory  │
    │                                    │                        │                      │
    │                                    ├── decodeJwtPayload(    │                      │
    │                                    │     accessToken)       │                      │
    │                                    │   └── { sub, roles:    │                      │
    │                                    │         ['USER'] }     │                      │
    │                                    │   └── isAdmin = false  │                      │
    │                                    │                        │                      │
    │                                    ├── authApi.getProfile() ──►── GET /account/me ──►── ResolveCapabilities
    │                                    │                        │                      │
    │                                    │◄── { account,         ◄──┼◄── BackendAccount ◄──┼── (capabilities attach)
    │                                    │      capabilities }    │                      │
    │                                    │                        │                      │
    │                                    ├── storeSession(token,  │                      │
    │                                    │     account)           │                      │
    │                                    │   └── mapAccountToUser(│                      │
    │                                    │         token, acc)    │                      │
    │                                    │       → User {         │                      │
    │                                    │           id: sub,     │                      │
    │                                    │           role: 'USER',│                      │
    │                                    │           membership,  │                      │
    │                                    │           ...          │                      │
    │                                    │         }              │                      │
    │                                    │                        │                      │
    │                                    └── setState({           │                      │
    │                                          status:            │                      │
    │                                          'authenticated',   │                      │
    │                                          user: User,        │                      │
    │                                          token              │                      │
    │                                        })                   │                      │
    │                                    │                        │                      │
    │◄── navigate('/manamaalai/          │                        │                      │
    │     dashboard')                    │                        │                      │
```

This pattern is important because it shows how the frontend **never handles password verification, token generation, or role assignment**. The backend LoginPipeline handles all security-sensitive work, and the frontend simply consumes the issued access token and fetches the profile using it. If the backend pipeline returns 401 (whether for invalid credentials, wrong portal, or suspended account), the frontend shows the error message without needing to know the specific reason.

---

## Data Flow — Full Registration Sequence

Registration is unique because the backend **expressly does not return tokens**. The RegisterPipeline returns only `{ accountId, email }` with HTTP 201, and the frontend redirects to login. This enforces Principle #5: users must explicitly authenticate after registration.

```
SignupFormWrapper                        API Client                Backend
(component + modal)                      (api.ts)                  (server)
    │                                       │                         │
    │  ===== OTP SEND =====                  │                         │
    │                                       │                         │
    ├── User enters email                   │                         │
    ├── Click "Send OTP"                    │                         │
    ├── authApi.sendRegistrationOtp(        │                         │
    │     { email }) ──────────────────────►──► POST /auth/           │
    │                                       │     registration/otp ──►──► SendOtpStep
    │                                       │                         │   ├── generateOTP(6-digit)
    │                                       │                         │   ├── hashOTP()
    │                                       │                         │   ├── save AccountVerification
    │                                       │                         │   │   { purpose: REGISTER }
    │                                       │                         │   └── send email
    │◄── null (200) ◄───────────────────────◄──◄──────────────────────◄── (no sensitive data)
    │                                       │                         │
    │  Timer starts (60s)                   │                         │
    │  OtpVerificationModal opens           │                         │
    │                                       │                         │
    │  ===== OTP VERIFY =====               │                         │
    │                                       │                         │
    │  User enters 6-digit OTP in modal     │                         │
    ├── authApi.verifyRegistrationOtp(      │                         │
    │     { email, otp }) ─────────────────►──► POST /auth/           │
    │                                       │     registration/otp/   │
    │                                       │     verify ───────────►──► VerifyOtpStep
    │                                       │                         │   ├── hash input OTP
    │                                       │                         │   ├── compare with DB hash
    │                                       │                         │   ├── check expiry, max attempts
    │                                       │                         │   ├── mark AccountVerification
    │                                       │                         │   │   → VERIFIED
    │                                       │                         │   └── create RegistrationSession
    │                                       │                         │       (short-lived JWT)
    │◄── { verificationToken } ◄────────────◄──◄──────────────────────◄── (JWT token)
    │                                       │                         │
    │  Modal closes, email shows "Verified" │                         │
    │                                       │                         │
    │  ===== FORM COMPLETION =====          │                         │
    │                                       │                         │
    │  User fills:                          │                         │
    │  ├── name (bilingual EN + TA)         │                         │
    │  ├── phone (optional)                 │                         │
    │  ├── password + confirm               │                         │
    │  └── terms accepted                   │                         │
    │                                       │                         │
    │  validateSignupStep(client-side)       │                         │
    │                                       │                         │
    │  ===== REGISTER =====                  │                         │
    │                                       │                         │
    ├── authApi.register({                  │                         │
    │     verificationToken,                │                         │
    │     firstNameEn, lastNameEn,          │                         │
    │     firstNameTa, lastNameTa,          │                         │
    │     phone,                            │                         │
    │     password                          │                         │
    │   }) ───────────────────────────────►──► POST /auth/register ──►──► RegisterPipeline (10 steps)
    │                                       │                         │
    │                                       │                         │   1. Validate verificationToken JWT
    │                                       │                         │   2. Check RegistrationSession not used
    │                                       │                         │   3. Check email uniqueness
    │                                       │                         │   4. Hash password (argon2)
    │                                       │                         │   5. Create Account
    │                                       │                         │   6. Create AccountCredential
    │                                       │                         │   7. Create AccountRole (USER)
    │                                       │                         │   8. Create free Subscription
    │                                       │                         │      (capability snapshot)
    │                                       │                         │   9. Mark RegistrationSession as used
    │                                       │                         │  10. Enqueue audit event
    │                                       │                         │
    │◄── 201 { accountId, email } ◄─────────◄──◄──────────────────────◄── ⚠ NO accessToken
    │                                       │                         │  ⚠ NO sessionId
    │  ⚠ Response is IGNORED beyond error   │                         │  ⚠ NO set-cookie
    │  ⚠ No token stored in memory          │                         │
    │                                       │                         │
    └── navigate('/manamaalai/login')       │                         │
        (user must now authenticate)
```

The key design constraint here is that **the frontend never receives tokens from registration**. This prevents accidental auto-login and forces the user to go through the login flow, which includes the role gate and capability resolution. The `register()` function in `auth.api.ts` should return `Promise<{ accountId: string; email: string }>` (not `LoginResponse`), and `SignupFormWrapper` correctly ignores the response body beyond error handling.

---

## Flow-by-Flow Architecture Diagrams

Each flow below follows the same pattern: a step-by-step ASCII diagram with explanations of the key decisions, error paths, and how the flow maps to its backend pipeline.

---

### Flow 1: Auth Init / Session Restore

On every page load (excluding public pages), the `AuthProvider` tries to restore the user's session. This flow is triggered by `useEffect` in the provider and uses a chain of attempts: first check in-memory token, then try cookie-based refresh.

```
App mounts
    │
    ▼
┌──────────────────────────────────────────────────────────────────┐
│  AuthProvider useEffect()                                         │
│                                                                   │
│  const publicPaths = [                                            │
│    '/manamaalai/login',                                           │
│    '/manamaalai/signup',                                          │
│    '/manamaalai/forgot-password',                                 │
│    '/admin/login'                                                 │
│  ];                                                              │
│                                                                   │
│  if (publicPaths.includes(location.pathname)) {                    │
│    setLoading(false);   ◄── Skip restore, let PublicRoute handle  │
│    return;                                                        │
│  }                                                                │
│                                                                   │
│  restoreSession();                                                │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  restoreSession()                                                 │
│                                                                   │
│  1. Guard: if (restoringRef.current) return false                 │
│     ◄── Prevents concurrent restores on re-renders               │
│                                                                   │
│  2. setLoading(true)                                              │
│                                                                   │
│  3. Check in-memory token:                                        │
│     ├── token = getAccessToken() // from session.ts              │
│     │                                                             │
│     ├── TOKEN EXISTS?                                             │
│     │   │                                                         │
│     │   YES ──────────────────────────────────────────────────┐  │
│     │   ├── decodeJwtPayload(token)                             │  │
│     │   ├── isAdmin = payload.roles.includes('ADMIN')           │  │
│     │   ├── account = isAdmin                                   │  │
│     │   │   ? GET /admin/account/me                             │  │
│     │   │   : GET /account/me                                   │  │
│     │   ├── storeSession(token, account) → User | Admin         │  │
│     │   ├── setState({ authenticated, user, token })            │  │
│     │   └── return true                                         │  │
│     │                                                           │  │
│     NO ─────────────────────────────────────────────────────┐  │  │
│     │   (token may have been cleared, or first load)         │  │  │
│     │                                                       │  │  │
│     ├── Try user refresh: refreshSession()                   │  │  │
│     │   └── POST /auth/refresh (via httpOnly cookie)         │  │  │
│     │       ├── 200 → { accessToken }                        │  │  │
│     │       │   └── setAccessToken(accessToken)              │  │  │
│     │       │   └── token = accessToken                      │  │  │
│     │       └── 401 → try admin refresh                      │  │  │
│     │           └── POST /admin/auth/refresh                 │  │  │
│     │               ├── 200 → { accessToken }                │  │  │
│     │               │   └── setAccessToken(accessToken)      │  │  │
│     │               │   └── token = accessToken              │  │  │
│     │               └── 401 → anonymous                      │  │  │
│     │                   ├── clearAccessToken()                │  │  │
│     │                   ├── setState({ anonymous, null, })    │  │  │
│     │                   └── return false                      │  │  │
│     │                                                       │  │  │
│     │   ◄── Double refresh: ADMIN users have httpOnly        │  │  │
│     │        cookie set by /admin/auth/login, which is       │  │  │
│     │        path-scoped. User refresh fails, admin          │  │  │
│     │        refresh succeeds.                               │  │  │
│     │                                                       │  │  │
│     └── decodeJwtPayload(token) → role → fetch profile      │  │  │
│         └── storeSession → setState ──┘                      │  │
│                                                              │  │
│  4. On any error in the above chain (catch block):           │  │
│     ├── Try user refresh again                               │  │
│     │   └── Failed? Try admin refresh again                  │  │
│     │       └── Succeeded? → fetch profile → restore         │  │
│     └── Both failed?                                         │  │
│         ├── clearAccessToken()                               │  │
│         └── setState({ status: 'expired' })                  │  │
│                                                              │  │
│  5. finally: restoringRef.current = false; loading = false   │  │
└──────────────────────────────────────────────────────────────┘──┘
```

#### Why the double refresh exists

The double refresh (user refresh → admin refresh fallback) exists because the backend sets refresh cookies on **different paths** (`/auth` for user, `/admin/auth` for admin). A browser visiting `/manamaalai/*` sends cookies set on `/auth`, but not those on `/admin/auth`, and vice versa. So:

- A USER visiting `/manamaalai/dashboard` → sends `/auth` cookie → user refresh works
- An ADMIN visiting `/admin/dashboard` → sends `/admin/auth` cookie → user refresh fails (no cookie) → admin refresh succeeds (cookie present)
- A USER visiting `/admin/login` → sends no auth cookies (public page) → both fail → stays anonymous

#### Future optimization

The double refresh can be eliminated by caching the last known role in `localStorage['auth_role']`. On restore, read the role first and hit the correct refresh endpoint directly:

```
On login/register:
  localStorage.setItem('auth_role', role || 'USER')

On restore:
  const role = localStorage.getItem('auth_role');
  const endpoint = role === 'ADMIN'
    ? POST /admin/auth/refresh
    : POST /auth/refresh;
  // Single call, no fallback needed
```

---

### Flow 2: User Login

The user login flow is the most common entry point. It validates credentials client-side, sends them to the backend LoginPipeline, and on success stores the session and redirects to the user dashboard.

```
LoginForm (/manamaalai/login)
    │
    │  User fills identifier + password fields
    │  Form state managed by local useState
    │
    ├── handleChange(): clears field errors on edit
    │
    ▼
handleSubmit(e)
    │
    ├── setGeneralError(null)
    │
    ├── validateLogin(formData)
    │   ├── Returns Record<keyof LoginData, string>
    │   ├── Checks: identifier not empty, password ≥ 6 chars
    │   └── Errors? → setFieldErrors(errors), STOP
    │
    ├── setIsPending(true) → show spinner, disable button
    │
    ├── authApi.login({ identifier, password })
    │   │
    │   ▼  (api.ts interceptor adds Content-Type and timeout)
    │   │
    │   POST /auth/login ────────────────────────────────► Backend LoginPipeline
    │       Body: { identifier, password }                    portal: { role: 'USER' }
    │       Credentials: none (public route)
    │                                                        Steps:
    │                                                         1. resolveCredential(ctx)
    │                                                            ├── find by email
    │                                                            └── find by phone
    │                                                         2. verifyPassword(ctx)
    │                                                            ├── argon2 compare
    │                                                            └── fail → AUTH_INVALID_CREDENTIALS (401)
    │                                                         3. checkAccountState(ctx)
    │                                                            ├── currentState === SUSPENDED?
    │                                                            │   → AUTH_ACCOUNT_SUSPENDED (403)
    │                                                            └── lockedUntil > now?
    │                                                                → AUTH_ACCOUNT_LOCKED (429)
    │                                                         4. roleGate(ctx)
    │                                                            ├── ctx.account.roles includes 'USER'?
    │                                                            └── no → AUTH_PORTAL_MISMATCH (401)
    │                                                         5. resolveCapabilities(ctx)
    │                                                            ├── find active subscription
    │                                                            └── build CapabilitySnapshot
    │                                                         6. createSession(ctx)
    │                                                            ├── SessionService.createSession()
    │                                                            ├── accessToken (15m)
    │                                                            └── refreshToken cookie (7d, /auth path)
    │                                                         7. setRefreshCookie(ctx)
    │                                                         8. enqueueAuditEvent(ctx)
    │
    │◄── 200 ──────────────────────────────────────────────────
    │    { accessToken, sessionId }
    │    Set-Cookie: refreshToken=...; Path=/auth; HttpOnly; Secure
    │
    ├── On SUCCESS:
    │   └── auth.login(accessToken)  ← no role arg, auto-detect from JWT
    │       │
    │       ▼  (useAuth.login)
    │       ├── setAccessToken(accessToken) → session.ts
    │       ├── decodeJwtPayload(accessToken)
    │       │   └── { sub, roles: ['USER'] }
    │       │       └── isAdmin = false
    │       ├── authApi.getProfile()
    │       │   └── GET /account/me
    │       │       Authorization: Bearer <accessToken>
    │       ├── storeSession(accessToken, account)
    │       │   └── mapAccountToUser(token, account) → User
    │       │       Uses roles.includes('ADMIN') for type mapping
    │       └── setState({
    │             status: 'authenticated',
    │             user: User,
    │             token: accessToken
    │           })
    │
    │
    ├── On ERROR 401 (e.g., AUTH_PORTAL_MISMATCH):
    │   └── toast.error(translateError(err))
    │       ├── API interceptor does NOT attempt refresh
    │       │   (401 has no Authorization header — no token to refresh)
    │       └── User stays on login page, sees "Unauthorized"
    │           ◄── This is correct: the user may have an ADMIN account
    │               and should go to /admin/login
    │
    ├── On ERROR 401 (AUTH_INVALID_CREDENTIALS):
    │   └── toast.error("Invalid email or password")
    │       User stays on login page
    │
    └── finally: setIsPending(false)
             │
             ▼
       navigate('/manamaalai/dashboard')
```

#### Why login uses `auth.login(accessToken)` without a role argument

The `useAuth.login()` function accepts an optional `role` parameter. In the user login flow, no role is passed — the function decodes the JWT to discover the role. This is intentional because:

- The JWT payload contains `roles: string[]` signed by the server
- The `storeSession()` adapter reads `roles.includes('ADMIN')` to determine the user type
- This prevents the client from overriding the server's role assignment

In contrast, the admin login flow passes `'ADMIN'` explicitly because the admin login result includes a `role` field directly, and we want to call `GET /admin/account/me` immediately (rather than guessing the endpoint from the JWT).

---

### Flow 3: Admin Login

Admin login is structurally identical to user login but routes to a different API endpoint and passes the `'ADMIN'` role explicitly. The backend LoginPipeline enforces that the account has the ADMIN role through the same `roleGate` step — configured with a different portal config.

```
AdminLoginForm (/admin/login)
    │
    │  User fills identifier + password fields
    │  Note: AdminLoginForm has a "Back to User Login" link
    │
    ▼
handleSubmit()
    │
    ├── validateLogin(formData)
    │   └── Also checks requiredRole: 'ADMIN' (type-level hint)
    │
    ├── adminApi.adminLogin({ identifier, password })
    │   │
    │   ▼
    │   POST /admin/auth/login ────────────────────────────► Backend LoginPipeline
    │       Body: { identifier, password }                    portal: { role: 'ADMIN' }
    │                                                         Steps (same pipeline):
    │                                                         ┌─ 1-3: same as user login
    │                                                         ├─ 4. roleGate(ctx)
    │                                                         │   ├── ctx.account.roles includes 'ADMIN'?
    │                                                         │   └── no → AUTH_PORTAL_MISMATCH (401)
    │                                                         ├─ 5-6: same (createSession)
    │                                                         └─ 7. setRefreshCookie(ctx)
    │                                                               Set-Cookie: Path=/admin/auth
    │
    │◄── 200 ──────────────────────────────────────────────────
    │    { accessToken, accountId, role: 'ADMIN', sessionId }
    │    Set-Cookie: refreshToken=...; Path=/admin/auth; HttpOnly
    │
    ├── auth.login(accessToken, 'ADMIN')  ← role passed explicitly
    │   │
    │   ▼
    │   ├── setAccessToken(accessToken)
    │   ├── adminApi.adminGetProfile()
    │   │   └── GET /admin/account/me  ← different endpoint from user login
    │   ├── storeSession(accessToken, account)
    │   │   └── roles.includes('ADMIN') → true → mapAccountToAdmin()
    │   │       → Admin { role: 'ADMIN', ... }
    │   └── setState({ authenticated, user: Admin, token })
    │
    │
    ├── On ERROR 401 (AUTH_PORTAL_MISMATCH):
    │   └── "Unauthorized" — user is a regular USER, should use /manamaalai/login
    │
    └── navigate('/admin/dashboard')
```

#### Key difference from user login

| Aspect | User Login | Admin Login |
|--------|-----------|-------------|
| API endpoint | POST /auth/login | POST /admin/auth/login |
| `auth.login()` role arg | Not passed (auto-detect) | `'ADMIN'` (explicit) |
| Profile endpoint | GET /account/me | GET /admin/account/me |
| Adapter mapping | `mapAccountToUser()` | `mapAccountToAdmin()` |
| Refresh cookie path | `/auth` | `/admin/auth` |
| Navigate to | /manamaalai/dashboard | /admin/dashboard |
| Backend portal config | `{ role: 'USER' }` | `{ role: 'ADMIN' }` |

---

### Flow 4: Registration (OTP + Register)

Registration is the most complex frontend flow because it involves a multi-step form with OTP verification, a modal for OTP entry, and a final registration call that produces no tokens. The flow is split into three phases: OTP Send, OTP Verify, and Registration.

```
SignupFormWrapper
    │
    │  ================== PHASE 1: FORM FILL ==================
    │
    │  Name section:
    │  ├── SignupNameForm (first name) — bilingual with auto-transliteration
    │  │   └── Handles both EN and TA fields through onChange
    │  └── SignupNameForm (last name) — same pattern
    │
    │  Email section:
    │  ├── SignupEmailForm
    │  │   ├── Input + "Send OTP" button
    │  │   ├── isValidEmail check: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    │  │   └── After OTP verified: shows green checkmark + "Verified"
    │  │
    │  Phone section (optional):
    │  │   └── SignupPhoneForm — simple text input with country code
    │  │
    │  Password section:
    │  │   └── SignupPasswordForm — password + confirm with strength indicator
    │  │
    │  Terms section:
    │  │   └── SignupTermsForm — checkbox for acceptance
    │  │
    │  Submit section:
    │      └── SignupSubmitForm — submit button with validation
    │
    │  ================== PHASE 2: OTP SEND ==================
    │
    handleSendOTP()
    │   ├── Guard: if (!isValidEmail) return
    │   ├── setGeneralError(null)
    │   ├── setIsSendingOtp(true)
    │   │
    │   ├── authApi.sendRegistrationOtp({ email })
    │   │   │
    │   │   ▼
    │   │   POST /auth/registration/otp ───────────────────► Backend OtpPipeline.send
    │   │       Body: { email }                                (purpose: REGISTER)
    │   │       Steps:
    │   │        1. validateRateLimit(ctx)
    │   │           └── check cooldown for email
    │   │        2. checkExistingAccount(ctx)
    │   │           └── email already registered? → AUTH_EMAIL_EXISTS (409)
    │   │        3. generateOTP(ctx)
    │   │           └── 6-digit numeric OTP
    │   │        4. hashOTP(ctx)
    │   │           └── SHA-256 hash
    │   │        5. saveVerification(ctx)
    │   │           └── AccountVerification { purpose: REGISTER, state: PENDING }
    │   │        6. sendOTP(ctx)
    │   │           └── email to user
    │   │
    │   │◄── null (200)  (no sensitive data in response)
    │   │
    │   ├── setIsOTPSent(true)
    │   ├── setIsOtpModalOpen(true)  ← modal opens
    │   ├── setOtpTimer(60), setCanResend(false)
    │   │
    │   └── On ERROR (e.g., AUTH_OTP_COOLDOWN):
    │       └── setGeneralError(translateError)
    │
    │  ================== PHASE 3: OTP VERIFY ==================
    │
    OtpVerificationModal (component)
    │   ├── Displays: email, 6-digit OTP inputs, resend timer
    │   ├── Props: isOTPVerified, verifyIsPending, error, etc.
    │   │
    │   ├── handleVerifyOTP()
    │   │   ├── Guard: if (!otpValue || otpValue.length !== 6) return
    │   │   │
    │   │   ├── authApi.verifyRegistrationOtp({ email, otp })
    │   │   │   │
    │   │   │   ▼
    │   │   │   POST /auth/registration/otp/verify ─────────► Backend OtpPipeline.verify
    │   │   │       Body: { email, otp }
    │   │   │       Steps:
    │   │   │        1. findVerification(ctx)
    │   │   │        2. hashAndCompare(ctx)
    │   │   │           ├── SHA-256(input) === stored hash?
    │   │   │           └── no → AUTH_OTP_INVALID (400) or
    │   │   │                                AUTH_OTP_MAX_ATTEMPTS (429)
    │   │   │        3. checkExpiry(ctx)
    │   │   │           └── expired → AUTH_OTP_EXPIRED (410)
    │   │   │        4. markVerified(ctx)
    │   │   │           └── AccountVerification.state = VERIFIED
    │   │   │        5. createVerificationToken(ctx)
    │   │   │           └── RegistrationSession + short-lived JWT (5m)
    │   │   │
    │   │   │◄── { verificationToken }
    │   │   │       ← JWT token valid for 5 minutes, single-use
    │   │   │
    │   │   ├── setVerificationToken(result.verificationToken)
    │   │   ├── setIsOTPVerified(true)
    │   │   ├── setIsOtpModalOpen(false)
    │   │   └── toast.success("Verified")
    │   │
    │   ├── handleResendOTP()
    │   │   ├── Same as send but with cooldown check
    │   │   └── Resets timer to 60s
    │   │
    │   └── handleCloseOtpModal()
    │       ├── Modal closes
    │       └── If not verified: resets OTP state
    │
    │  ================== PHASE 4: SUBMIT ==================
    │
    handleSubmit()
    │   ├── Guard: if (!isOTPVerified) → show "Verify email first"
    │   │
    │   ├── validateSignupStep(1, formData)  ← full form validation
    │   │   ├── firstNameEn: required, 2-50 chars
    │   │   ├── lastNameEn: required, 2-50 chars
    │   │   ├── email: required, valid format
    │   │   ├── password: required, min 8 chars, strength check
    │   │   ├── confirmPassword: must match password
    │   │   └── termsAccepted: must be true
    │   │
    │   ├── Errors? → setErrors(translated), STOP
    │   │
    │   ├── setIsSigningUp(true)
    │   │
    │   ├── const { confirmPassword, termsAccepted, ...cleanData }
    │   ├── authApi.register({ ...cleanData, verificationToken })
    │   │   │
    │   │   ▼
    │   │   POST /auth/register ───────────────────────────► Backend RegisterPipeline
    │   │       Body: {                                      (10 steps)
    │   │         verificationToken,                         1. validateVerificationToken(ctx)
    │   │         firstNameEn, lastNameEn,                   2. checkEmailUniqueness(ctx)
    │   │         firstNameTa, lastNameTa,                   3. hashPassword(ctx) — argon2
    │   │         phone,                                    4. createAccount(ctx)
    │   │         password                                  5. createCredential(ctx)
    │   │       }                                           6. assignRole(ctx) — USER
    │   │                                                   7. assignFreeSubscription(ctx)
    │   │                                                   8. markSessionUsed(ctx)
    │   │                                                   9. enqueueAuditEvent(ctx)
    │   │                                                  10. buildResponse(ctx)
    │   │
    │   │◄── 201 { accountId, email }
    │   │    ⚠ NO accessToken in response
    │   │    ⚠ NO Set-Cookie header
    │   │
    │   └── navigate('/manamaalai/login')
    │       ◄── User must now explicitly log in
    │           This enforces that registration does not auto-authenticate
    │           and the role gate runs before the first session
    │
    │
    ├── On ERROR 409 (AUTH_EMAIL_EXISTS):
    │   └── "An account with this email already exists"
    │
    ├── On ERROR 400 (AUTH_REGISTRATION_SESSION_INVALID):
    │   └── "Verification expired. Please start over."
    │       → User must re-verify OTP
    │
    └── On field-level validation from backend:
        └── setErrors({ field: translatedMessage })
```

#### Why the OTP flow is shared between Register and Reset Password

Both registration and password reset use the **same** `SendOtpStep` and `VerifyOtpStep` internally, differing only in the `purpose` parameter (`REGISTER` vs `RESET_PASSWORD`). On the frontend, the API calls are also structurally identical:

```
sendRegistrationOtp(email)  → POST /auth/registration/otp
sendPasswordResetOtp(email) → POST /auth/password/otp

verifyRegistrationOtp(email, otp) → POST /auth/registration/otp/verify → { verificationToken }
verifyPasswordResetOtp(email, otp) → POST /auth/password/otp/verify    → { resetToken }
```

The difference is only in the token type returned: `verificationToken` (for registration) vs `resetToken` (for password reset). The frontend type system captures this distinction.

---

### Flow 5: Forgot Password (OTP + Reset)

The forgot password flow is a 4-step wizard implemented as a single component with animated transitions between steps. It reuses the same OTP pattern as registration but culminates in a password reset rather than account creation.

```
ForgotPasswordForm
    │
    │  State machine: currentStep ∈ { 'IDENTIFY', 'VERIFY', 'RESET', 'SUCCESS' }
    │
    │  ================== STEP 1: IDENTIFY ==================
    │
    │  currentStep === 'IDENTIFY'
    │
    │  ForgotPasswordIdentifyForm
    │  ├── Email input field
    │  ├── Client-side validation (non-empty, valid format)
    │  │
    │  └── handleIdentify()
    │      ├── POST /auth/password/otp ───────────────────► Backend SendOtpStep
    │      │   Body: { email }                               (purpose: RESET_PASSWORD)
    │      │   (same implementation as registration OTP,     (same step, different purpose)
    │      │    but checks account exists)
    │      │
    │      │◄── null (200)
    │      │
    │      ├── Transition: currentStep → 'VERIFY'
    │      └── Start OTP timer (60s)
    │
    │  ================== STEP 2: VERIFY ==================
    │
    │  currentStep === 'VERIFY'
    │
    │  OTPInput (6-digit, numeric only)
    │  ├── Timer display with resend option
    │  │
    │  └── handleVerify()
    │      ├── POST /auth/password/otp/verify ───────────► Backend VerifyOtpStep
    │      │   Body: { email, otp }                        (purpose: RESET_PASSWORD)
    │      │                                                (creates ResetSession instead
    │      │◄── { resetToken }                               of RegistrationSession)
    │      │       ← short-lived JWT for password reset
    │      │
    │      └── Transition: currentStep → 'RESET'
    │
    │  ================== STEP 3: RESET ==================
    │
    │  currentStep === 'RESET'
    │
    │  ForgotPasswordResetForm
    │  ├── New password + confirm password
    │  ├── Password strength indicator
    │  │
    │  └── handleReset()
    │      ├── Client-side validation (min 8 chars, match confirm)
    │      │
    │      ├── POST /auth/password/reset ─────────────────► Backend ResetPasswordPipeline
    │      │   Body: { resetToken, password }
    │      │                                               Steps:
    │      │                                                1. validateResetToken(ctx)
    │      │                                                   ├── decode JWT
    │      │                                                   └── check ResetSession not used
    │      │                                                2. hashPassword(ctx) — argon2
    │      │                                                3. updatePassword(ctx)
    │      │                                                4. incrementTokenVersion(ctx)
    │      │                                                   └── invalidates ALL sessions
    │      │                                                5. revokeAllSessions(ctx)
    │      │                                                6. markResetSessionUsed(ctx)
    │      │                                                7. enqueueAuditEvent(ctx)
    │      │
    │      │◄── { message }
    │      │
    │      └── Transition: currentStep → 'SUCCESS'
    │
    │  ================== STEP 4: SUCCESS ==================
    │
    │  currentStep === 'SUCCESS'
    │
    │  Success message: "Password reset successfully"
    │  └── navigate('/manamaalai/login')
    │      ◄── Must log in with new password
    │          All previous sessions are revoked (tokenVersion bump)
    │          Any stale refresh tokens will fail rotation
    │
    │
    │  Error handling:
    │  ├── AUTH_RESET_SESSION_INVALID (400): reset token expired/used
    │  │   → Transition back to IDENTIFY ("Start over")
    │  ├── AUTH_OTP_EXPIRED (410): OTP timed out
    │  │   → Stay on VERIFY, show "Code expired", allow resend
    │  └── AUTH_OTP_MAX_ATTEMPTS (429): too many attempts
    │      → Transition back to IDENTIFY ("Too many attempts, start over")
```

#### Why tokenVersion is bumped

The `ResetPasswordPipeline` increments the account's `tokenVersion` and revokes all sessions. This means:

1. Any existing access tokens become invalid (the `requireSession` middleware checks `tokenVersion` match)
2. Any existing refresh tokens are rejected (they reference the old version)
3. The user must log in from scratch with their new password
4. If an attacker had stolen an old session, it's now useless

The `ChangePasswordPipeline` also bumps `tokenVersion` but **keeps the current session** (since the request came from an authenticated user with a valid access token).

---

### Flow 6: Change Password (Authenticated)

The change password flow is for authenticated users who want to update their password while staying logged in. It's simpler than reset password because the user is already authenticated.

```
Dashboard / Settings page
    │
    │  User fills currentPassword + newPassword
    │  Client-side validation:
    │    ├── currentPassword: required
    │    ├── newPassword: min 8 chars, strength check
    │    └── confirmPassword: must match newPassword
    │
    ▼
authApi.changePassword({ currentPassword, newPassword })
    │
    ▼  (api.ts interceptor adds Authorization header)
    │
POST /auth/password/change
    Authorization: Bearer <accessToken>
    Body: { currentPassword, newPassword }
    │
    ▼
Backend ChangePasswordPipeline
    Steps:
    1. resolveAccountFromSession(ctx)
       └── Decode accessToken → accountId
    2. verifyCurrentPassword(ctx)
       └── argon2 compare with stored hash
       └── fail → AUTH_INVALID_CREDENTIALS (401)
    3. hashNewPassword(ctx) — argon2
    4. updatePassword(ctx)
    5. incrementTokenVersion(ctx)
       └── All OTHER sessions revoked
       └── Current session KEPT (this request is the current context)
    6. enqueueAuditEvent(ctx)
    │
    ▼
{ message } (200)
    │
    ▼
Toast.success("Password changed")
User continues browsing
    │
    │  ◄── No redirect needed. Current session remains valid.
    │      Other devices/sessions will need to re-authenticate.
    │
    │  Note: If the user has the page open in another tab,
    │  that tab's access token is now invalid (tokenVersion mismatch).
    │  Their next API call will return 401 → interceptor tries refresh
    │  → refresh fails (tokenVersion mismatch) → redirected to login.
```

---

### Flow 7: Token Refresh (Interceptor)

The token refresh mechanism is entirely transparent to React components. The `api.ts` Axios interceptor handles it automatically. This is the most architecturally important flow because it ensures seamless session renewal without disrupting the user experience.

```
Any API call (e.g., GET /account/me)
    │
    ▼
┌──────────────────────────────────────────────────────────────────┐
│  Request Interceptor (before request is sent)                    │
│                                                                  │
│  const token = getAccessToken(); // from session.ts             │
│  if (token && config.headers) {                                  │
│    config.headers.Authorization = `Bearer ${token}`;            │
│  }                                                               │
│  config.headers['Accept-Language'] = localStorage.getItem(       │
│    'language'                                                    │
│  ) || 'en';                                                      │
└──────────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────────────────┐
│  Response Interceptor (on response received)                     │
│                                                                  │
│  if (response.data?.success === true)                            │
│    return response.data.data  ← unwrap { success, data }        │
│                                                                  │
│  if (response.data?.success === false)                           │
│    throw new AppError(status, code, message, details)            │
│                                                                  │
│  return response.data  ← passthrough for non-wrapped responses  │
└──────────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────────────────┐
│  Error Interceptor (on 401 error)                                │
│                                                                  │
│  if (error.response.status === 401) {                            │
│    const originalRequest = error.config;                         │
│                                                                  │
│    // Guard: Already retried? Then redirect to login             │
│    if (originalRequest._retry) {                                 │
│      clearAccessToken();                                         │
│      window.location.href = /* appropriate login */              │
│      throw error;                                                │
│    }                                                             │
│                                                                  │
│    // Guard: No Authorization header? Can't refresh              │
│    if (!originalRequest.headers?.Authorization) {                │
│      throw error;  // Let caller handle                          │
│    }                                                             │
│                                                                  │
│    // Mark as retrying                                            │
│    originalRequest._retry = true;                                │
│    isRefreshing = true;                                          │
│                                                                  │
│    // === SELECT REFRESH ENDPOINT ===                            │
│    // Current: URL-based                                         │
│    const isAdmin = originalRequest.url.startsWith('/admin');     │
│    const refreshUrl = isAdmin                                   │
│      ? 'POST /admin/auth/refresh'                               │
│      : 'POST /auth/refresh';                                     │
│                                                                  │
│    // === PERFORM REFRESH ===                                    │
│    try {                                                         │
│      const resp = await axios.post(refreshUrl, {},               │
│        { withCredentials: true });                                │
│                                                                  │
│      const newToken = resp.data.data.accessToken;                │
│      setAccessToken(newToken);                                   │
│      processQueue(null, newToken);                               │
│                                                                  │
│      // Retry the original failed request                       │
│      originalRequest.headers.Authorization = `Bearer ${newToken}`│
│      return api(originalRequest);                                │
│    } catch (refreshError) {                                     │
│      processQueue(refreshError);                                 │
│      clearAccessToken();                                         │
│      window.location.href = isAdmin                              │
│        ? '/admin/login'                                          │
│        : '/manamaalai/login';                                    │
│      throw refreshError;                                         │
│    } finally {                                                   │
│      isRefreshing = false;                                       │
│    }                                                             │
│  }                                                               │
│                                                                  │
│  // Non-401 errors: unwrap and throw as AppError                │
└──────────────────────────────────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────────────────────────────────┐
│  Request Queue (for concurrent requests)                         │
│                                                                  │
│  While a refresh is in progress, all OTHER 401 responses         │
│  are queued:                                                     │
│                                                                  │
│  let failedQueue: { resolve, reject }[] = [];                   │
│  const MAX_QUEUE_SIZE = 50;                                      │
│                                                                  │
│  if (isRefreshing) {                                             │
│    return new Promise((resolve, reject) => {                     │
│      if (failedQueue.length < MAX_QUEUE_SIZE) {                   │
│        failedQueue.push({ resolve, reject });                     │
│      } else {                                                    │
│        reject(new AppError(401, 'AUTH_TOKEN_INVALID',            │
│          'Session expired'));                                     │
│      }                                                           │
│    }).then((token) => {                                          │
│      originalRequest.headers.Authorization = `Bearer ${token}`;  │
│      return api(originalRequest);                                │
│    });                                                           │
│  }                                                               │
│                                                                  │
│  // processQueue(null, newToken) replays all queued requests     │
│  // processQueue(error) rejects all queued requests              │
└──────────────────────────────────────────────────────────────────┘

EXAMPLE: Three concurrent requests, all with expired tokens

Time ────────────────────────────────────────────────────────────────►

GET /profile (expired) ──────┐
GET /messages (expired) ─────┤
GET /matches (expired) ──────┘
                              │
                              ▼
                    Interceptor catches 401 × 3
                              │
                              ├── 1st: isRefreshing = false
                              │   ├── Mark _retry = true
                              │   ├── POST /auth/refresh (cookie)
                              │   └── isRefreshing = true
                              │
                              ├── 2nd: isRefreshing = true
                              │   └── Push to queue
                              │
                              └── 3rd: isRefreshing = true
                                  └── Push to queue
                              │
                              ▼
                    Refresh succeeds → new token
                              │
                              ├── setAccessToken(newToken)
                              ├── processQueue(null, newToken)
                              │   ├── Resolve 2nd request
                              │   │   └── Replay with new token
                              │   └── Resolve 3rd request
                              │       └── Replay with new token
                              └── Retry 1st request with new token
                              │
                              ▼
                    All three requests complete successfully
```

#### Why the refresh uses URL prefix detection

The current implementation uses `originalRequest.url.startsWith('/admin')` to determine the refresh endpoint. This works because:

- Requests to `/admin/*` (admin profile, admin routes) have the admin cookie
- Requests to `/auth/*`, `/account/*`, `/membership/*`, etc. have the user cookie
- The browser only sends cookies matching the cookie's `Path` attribute

**Future optimization**: Replace URL prefix detection with a module-level `_lastAuthRole` variable:

```
let _lastAuthRole: 'USER' | 'ADMIN' | null = null;

// Set on login:
_lastAuthRole = role || (decodeJwtPayload(token).roles.includes('ADMIN') ? 'ADMIN' : 'USER');

// Set on restore:
_lastAuthRole = decoded.roles.includes('ADMIN') ? 'ADMIN' : 'USER';

// Set on logout:
_lastAuthRole = null;

// Use in interceptor:
const refreshUrl = _lastAuthRole === 'ADMIN'
  ? '/admin/auth/refresh'
  : '/auth/refresh';
```

This eliminates the double-refresh pattern in `restoreSession()` and is more reliable than URL matching.

---

### Flow 8: Logout

Logout clears both the client-side state (memory) and the server-side session (DB + cookie).

```
Logout button (clicked by user on any protected page)
    │
    ▼
useAuth.logout()
    │
    ├── Determine endpoint from current user role:
    │   const isAdmin = state.user?.role === 'ADMIN';
    │
    ├── try {
    │   if (isAdmin) {
    │     await adminApi.adminLogout()
    │     // POST /admin/auth/logout
    │     // Backend: revoke session, clear cookie (Set-Cookie: max-age=0)
    │   } else {
    │     await authApi.logout()
    │     // POST /auth/logout
    │     // Backend: revoke session, clear cookie
    │   }
    │ } catch {
    │   // Graceful: token may already be invalid (e.g., expired)
    │   // Continue with client-side cleanup
    │ }
    │
    ├── clearAccessToken()  // session.ts: _accessToken = null
    ├── clearSession()      // auth.adapter.ts: no-op (memory only)
    │
    ├── setState({
    │     status: 'anonymous',
    │     user: null,
    │     token: null
    │   })
    │
    └── window.location.href =
          isAdmin ? '/admin/login' : '/manamaalai/login';
          // Hard redirect (not navigate) to ensure complete state reset
```

#### Why hard redirect (`window.location.href`) instead of `navigate()`

The logout uses `window.location.href` instead of React Router's `navigate()` because:

1. **Complete state reset**: A hard reload ensures all React state, context, and memoized values are wiped. Using `navigate()` might leave stale state in lazy-loaded modules or component trees.
2. **Clean component tree**: Auth pages (login) are in a different router branch. A hard redirect creates a clean component tree without any protected components lingering in memory.
3. **Interceptor reset**: The `isRefreshing` flag in `api.ts` is reset on page load. A soft navigation would not reset this.
4. **Security**: Ensures no cached protected data remains in the React tree for a subsequent user who shares the device.

---

### Flow 9: Route Guards

Route guards are React components that wrap routes to enforce authentication and authorization. They are the frontend's mirror of the backend's three-router composition.

```
Browser navigates to a URL
    │
    ▼
React Router matches the route tree
    │
    ┌────────────────────────────────────────────────────────────────┐
    │  Route Decision Tree                                            │
    │                                                                  │
    │  URL: /manamaalai/login                                         │
    │     │                                                            │
    │     ├── Wrapped in PublicRoute? ── YES                          │
    │     │   ├── AuthProvider.loading?                                │
    │     │   │   └── YES → Render spinner                             │
    │     │   │   └── NO  → isAuthenticated?                          │
    │     │   │       ├── YES → user.role?                            │
    │     │   │       │   ├── ADMIN → Navigate('/admin/dashboard')    │
    │     │   │       │   └── USER  → Navigate('/manamaalai/dashboard')│
    │     │   │       └── NO  → Render LoginPage                    │
    │     │                                                            │
    │  URL: /manamaalai/dashboard                                      │
    │     │                                                            │
    │     ├── Wrapped in ProtectedRoute? ── YES (allowedRole: 'USER') │
    │     │   ├── AuthProvider.loading?                                │
    │     │   │   └── YES → Render spinner                             │
    │     │   │   └── NO  → isAuthenticated?                          │
    │     │   │       ├── NO → Navigate('/manamaalai/login')          │
    │     │   │       └── YES → user.role === 'USER'?                 │
    │     │   │           ├── NO → Navigate('/admin/dashboard')       │
    │     │   │           └── YES → Render Dashboard                 │
    │     │                                                            │
    │  URL: /admin/dashboard                                           │
    │     │                                                            │
    │     ├── Wrapped in ProtectedRoute? ── YES (allowedRole: 'ADMIN')│
    │     │   ├── AuthProvider.loading?                                │
    │     │   │   └── YES → Render spinner                             │
    │     │   │   └── NO  → isAuthenticated?                          │
    │     │   │       ├── NO → Navigate('/admin/login')               │
    │     │   │       └── YES → user.role === 'ADMIN'?                │
    │     │   │           ├── NO → Navigate('/manamaalai/dashboard')  │
    │     │   │           └── YES → Render AdminDashboard            │
    │     │                                                            │
    │  URL: /manamaalai/forgot-password                                │
    │     │                                                            │
    │     └── Wrapped in PublicRoute? ── YES                          │
    │         ├── isAuthenticated?                                    │
    │         │   ├── YES → Navigate to dashboard                     │
    │         │   └── NO  → Render ForgotPasswordPage                │
    └────────────────────────────────────────────────────────────────┘
```

#### ProtectedRoute component logic (Pseudocode)

```
<ProtectedRoute allowedRole='USER'>
    if (loading) return <Spinner />
    if (!isAuthenticated) {
        const loginPath = location.pathname.startsWith('/admin')
            ? '/admin/login'
            : '/manamaalai/login';
        return <Navigate to={loginPath} state={{ from: location }} />
    }
    if (allowedRole && user.role !== allowedRole) {
        const dashboardPath = user.role === 'ADMIN'
            ? '/admin/dashboard'
            : '/manamaalai/dashboard';
        return <Navigate to={dashboardPath} />
    }
    return children || <Outlet />
</ProtectedRoute>
```

#### PublicRoute component logic (Pseudocode)

```
<PublicRoute>
    if (loading) return <Spinner />
    if (isAuthenticated) {
        const dashboardPath = user.role === 'ADMIN'
            ? '/admin/dashboard'
            : '/manamaalai/dashboard';
        return <Navigate to={dashboardPath} />
    }
    return children || <Outlet />
</PublicRoute>
```

#### How it mirrors the backend three-router composition

| Router | Backend | Frontend |
|--------|---------|----------|
| Public | `publicRouter` (no guards) | Routes wrapped in `PublicRoute` or no guard |
| User | `userRouter` (`requireSession`) | `/manamaalai/*` routes wrapped in `ProtectedRoute(USER)` |
| Admin | `adminRouter` (`requireSession` + `requireRole('ADMIN')`) | `/admin/*` routes wrapped in `ProtectedRoute(ADMIN)` |

---

### Flow 10: Membership Resolution

Membership capabilities are resolved after login and checked at every protected action point. The frontend fetches capabilities via the API and uses them to gate UI features.

```
User authenticates (login/restore completed)
    │
    ▼
Protected page mounts (e.g., Dashboard, Search Profiles)
    │
    ├── Component calls membershipApi.getMyCapabilities()
    │   │
    │   ▼
    │   GET /membership/my-capabilities
    │   Authorization: Bearer <accessToken>
    │       │
    │       ▼
    │   Backend ResolveCapabilitiesPipeline
    │   Steps:
    │     1. Resolve account from session (accessToken → accountId)
    │     2. Find active subscription:
    │        ├── Subscription with status === 'ACTIVE'?
    │        │   └── Yes → read snapshot fields
    │        └── No → fallback to FREE plan defaults:
    │            { openLimit: 5, shortlistLimit: 10,
    │              profileSlotLimit: 1, viewDetails: 'HIDE',
    │              printProfile: false, printHoroscope: false,
    │              searchLevel: 'BASIC' }
    │     3. Build CapabilitySnapshot from subscription or FREE plan
    │     4. Return { capabilities }
    │
    │◄── { capabilities: CapabilitySnapshot }
    │
    ├── UI renders based on capabilities:
    │   ├── viewDetails === 'FULL' → show contact info button
    │   ├── viewDetails === 'BASIC' → show "Upgrade to view" badge
    │   ├── viewDetails === 'HIDE' → hide contact entirely
    │   ├── openLimit === -1 → "Unlimited" badge
    │   ├── openLimit > 0 → "X/Y opens remaining" counter
    │   ├── searchLevel === 'PREMIUM' → show advanced filters
    │   └── etc.
    │
    └── Guards check snapshot at action points:
        │
        ├── User clicks "View Full Profile"
        │   ├── checkViewDetails(snapshot, 'FULL')
        │   │   ├── snapshot.viewDetails === 'FULL' → allow
        │   │   └── else → 403, show upgrade modal
        │
        ├── User clicks "Send Interest" (opens a profile)
        │   ├── checkOpenLimit(snapshot, currentOpenUsed)
        │   │   ├── snapshot.openLimit === -1 → allow (unlimited)
        │   │   ├── currentOpenUsed < snapshot.openLimit → allow
        │   │   └── else → 403, show limit reached message
        │
        └── User tries to add another profile
            ├── checkProfileSlotLimit(snapshot, currentProfileCount)
            │   ├── snapshot.profileSlotLimit === -1 → allow
            │   ├── currentProfileCount < snapshot.profileSlotLimit → allow
            │   └── else → 403, show upgrade CTA

    ┌──────────────────────────────────────────────────────────────────┐
    │  FUTURE OPTIMIZATION: MembershipProvider Context                  │
    │                                                                  │
    │  Goal: Avoid refetching capabilities on every page mount.         │
    │                                                                  │
    │  Design:                                                          │
    │  ┌────────────────────────────────────────────────────────────┐  │
    │  │ <MembershipProvider>                                        │  │
    │  │   Fetches capabilities on mount (if authenticated)          │  │
    │  │   Caches CapabilitySnapshot in React context                 │  │
    │  │   Provides refresh() to invalidate cache on plan change     │  │
    │  │   Guards read from context instead of calling API           │  │
    │  │   AuthProvider.login() also sets initial capabilities        │  │
    │  │ </MembershipProvider>                                       │  │
    │  └────────────────────────────────────────────────────────────┘  │
    │                                                                  │
    │  Context shape:                                                  │
    │  {                                                               │
    │    capabilities: CapabilitySnapshot | null,                      │
    │    loading: boolean,                                             │
    │    refresh: () => Promise<void>,                                 │
    │    error: AppError | null                                        │
    │  }                                                               │
    │                                                                  │
    │  Invalidated when:                                               │
    │  ├── User subscribes/upgrades → refresh() called                 │
    │  ├── Subscription expires → next guard check fails → refetch    │
    │  └── Session restored → capabilities refetched with profile     │
    └──────────────────────────────────────────────────────────────────┘
```

#### Why capabilities are fetched separately from login

While the login pipeline internally resolves capabilities (for the response), the frontend fetches them via a separate API call (`GET /membership/my-capabilities`). This is intentional:

1. **Separation of concerns**: Login handles auth; membership handles capabilities. The login response doesn't need to carry membership data.
2. **Freshness**: Capabilities can change (subscription upgraded, expired, etc.) without requiring re-authentication.
3. **Granular caching**: Capabilities can be cached and invalidated independently of the auth session.
4. **Fallback context**: If login didn't return capabilities (e.g., legacy accounts), the explicit fetch ensures they're always available.

---

## State Management Distribution

This table shows where each piece of state lives, why it's there, and what manages it.

| State Variable | Owner | Scope | Persistence | Reason |
|---------------|-------|-------|-------------|--------|
| `_accessToken` | `session.ts` (module-level let) | Global (module singleton) | Memory only | Never persisted — risk of XSS. Session restore uses httpOnly cookie |
| `status` | `AuthContext` | AuthProvider subtree | Memory only | Derived from session state; re-derived on each mount |
| `user` / `Admin` | `AuthContext` | AuthProvider subtree | Memory only | Contains PII (email, name, phone) — never persisted |
| `token` (state copy) | `AuthContext` | AuthProvider subtree | Memory only | Redundant with `session.ts` — exists for reactivity (useState triggers re-renders) |
| `loading` | `AuthContext` | AuthProvider subtree | Memory only | Guards against flash-of-unauthenticated-content during restore |
| `formData` (identifier, password, etc.) | Local `useState` in form components | Per component instance | Memory only | Form state is ephemeral — lost on navigation |
| `errors` (field-level) | Local `useState` in form components | Per component instance | Memory only | Validation state is ephemeral |
| `generalError` | Local `useState` in form components | Per component instance | Memory only | Error display state is ephemeral |
| `otpTimer` | Local `useState` in SignupFormWrapper / ForgotPasswordForm | Per component instance | Memory only | OTP resend countdown is ephemeral |
| `isOTPVerified` | Local `useState` in SignupFormWrapper | Per component instance | Memory only | Verification is session-relative |
| `verificationToken` / `resetToken` | Local `useState` in SignupFormWrapper / ForgotPasswordForm | Per component instance | Memory only | One-time tokens, never persisted |
| `language` | `LanguageContext` | Global | `localStorage` | User preference, should survive page reloads |
| `isRefreshing` | Module-level let in `api.ts` | Global (module singleton) | Memory only | Refresh queue guard — reset on page load |
| `failedQueue` | Module-level array in `api.ts` | Global (module singleton) | Memory only | Pending request queue — empty on page load |
| `_lastAuthRole` (future) | Module-level let in `api.ts` | Global (module singleton) | Memory only | Refresh endpoint selector — derived from login/restore |
| `auth_role` (future) | `localStorage` | Global | `localStorage` | Restore optimization — avoids double refresh for ADMIN |

---

## API Module → Backend Pipeline Mapping

Every frontend API call maps to exactly one backend pipeline or service method. This table documents every auth-related API function, its HTTP method and path, the pipeline it invokes, and the shape of the response.

| Frontend API Call | HTTP | Path | Backend Pipeline / Service | Response Shape |
|---|---|---|---|---|
| `authApi.login()` | POST | /auth/login | LoginPipeline (portal: USER) | `{ accessToken: string, sessionId: string }` |
| `adminApi.adminLogin()` | POST | /admin/auth/login | LoginPipeline (portal: ADMIN) | `{ accessToken: string, accountId: string, role: 'ADMIN', sessionId: string }` |
| `authApi.register()` | POST | /auth/register | RegisterPipeline (10 steps) | `{ accountId: string, email: string }` — 201, NO tokens |
| `authApi.refresh()` | POST | /auth/refresh | RefreshPipeline | `{ accessToken: string }` |
| `adminApi.adminRefresh()` | POST | /admin/auth/refresh | RefreshPipeline | `{ accessToken: string }` |
| `authApi.logout()` | POST | /auth/logout | SessionService.revoke() | `null` |
| `adminApi.adminLogout()` | POST | /admin/auth/logout | SessionService.revoke() | `null` |
| `authApi.logoutAll()` | POST | /auth/logout-all | SessionService.revokeAll() | `null` |
| `authApi.sendRegistrationOtp()` | POST | /auth/registration/otp | OtpPipeline.send(purpose: REGISTER) | `null` |
| `authApi.verifyRegistrationOtp()` | POST | /auth/registration/otp/verify | OtpPipeline.verify(purpose: REGISTER) | `{ verificationToken: string }` |
| `authApi.sendPasswordResetOtp()` | POST | /auth/password/otp | OtpPipeline.send(purpose: RESET_PASSWORD) | `null` |
| `authApi.verifyPasswordResetOtp()` | POST | /auth/password/otp/verify | OtpPipeline.verify(purpose: RESET_PASSWORD) | `{ resetToken: string }` |
| `authApi.resetPassword()` | POST | /auth/password/reset | ResetPasswordPipeline | `{ message: string }` |
| `authApi.changePassword()` | POST | /auth/change-password | ChangePasswordPipeline | `{ message: string }` |
| `authApi.getProfile()` | GET | /account/me | ResolveCapabilitiesPipeline | `BackendAccount` |
| `adminApi.adminGetProfile()` | GET | /admin/account/me | ResolveCapabilitiesPipeline | `BackendAccount` |
| `membershipApi.getMyCapabilities()` | GET | /membership/my-capabilities | ResolveCapabilitiesPipeline | `{ capabilities: CapabilitySnapshot }` |
| `membershipApi.getMySubscription()` | GET | /membership/my-subscription | ResolveCapabilitiesPipeline | `{ subscription: SubscriptionInfo \| null, capabilities: CapabilitySnapshot }` |
| `membershipApi.listPlans()` | GET | /membership/plans | Direct DB (no pipeline) | `{ plans: MembershipPlan[] }` |
| `membershipApi.getBillingOverview()` | GET | /membership/billing-overview | ResolveCapabilitiesPipeline | `BillingOverview` |

---

## Key Design Rules

These rules govern every decision in the frontend auth architecture.

### Rule 1: No tokens from register

The `SignupFormWrapper` calls `authApi.register()` and **immediately navigates to login** regardless of the response. The response contains only `{ accountId, email }` — no access token, no refresh cookie. The user must explicitly authenticate through the login flow, ensuring the role gate and capability resolution run before the first session.

**Why**: Prevents silent auto-login. Ensures the user knows their credentials work before entering the protected area. Also prevents edge cases where registration OTP verification tokens could be confused with session tokens.

### Rule 2: 401 triggers refresh, not logout

The `api.ts` interceptor catches all 401 responses and attempts token refresh before giving up. This includes `AUTH_PORTAL_MISMATCH` (401) — when a USER hits an admin endpoint — which flows through the same recovery path. Only when the refresh itself fails does the interceptor redirect to login.

**Why**: Unifies error handling. Whether the token is expired, the role is wrong, or the session was revoked (e.g., from another device), the interceptor tries one recovery path. The user never sees a "Session expired" toast for transient 401s.

### Rule 3: Role determines the refresh endpoint

The interceptor uses `originalRequest.url.startsWith('/admin')` to choose between `/auth/refresh` and `/admin/auth/refresh`. This is because the backend sets refresh cookies on different paths (`/auth` vs `/admin/auth`), and the browser only sends cookies matching the path.

**Why**: Cookie path isolation prevents an attacker with access to the user cookie from using it on admin endpoints. The cookie is scoped to its portal.

### Rule 4: Two layers of role enforcement

The backend enforces roles through `requireRole('ADMIN')` middleware (at the router level) and `roleGate` step in the LoginPipeline. The frontend enforces roles through `ProtectedRoute` with the `allowedRole` prop.

**Why**: Defense in depth. Even if a user manipulates frontend routing, the backend will reject unauthorized requests with 401. Even if a frontend bug exposes an admin route, the guard check prevents unauthorized rendering.

### Rule 5: Login sources truth from JWT

When `useAuth.login(accessToken)` is called without a role argument, it decodes the JWT payload to determine roles. The `storeSession()` adapter reads `roles.includes('ADMIN')` from the JWT to choose the correct user type mapping.

**Why**: The JWT is signed by the server and contains the authoritative role assignment. The frontend should never guess or infer roles from URL paths or form data.

### Rule 6: Logout uses hard redirect

Logout clears in-memory state and performs `window.location.href = <login>` instead of React Router's `navigate()`.

**Why**: Ensures complete state cleanup. All React state, context values, memoized data, and component trees are destroyed on hard reload. The `isRefreshing` flag in `api.ts` resets. This prevents stale session artifacts from surviving in memory.

---

## File Gap Summary

The current frontend is fully aligned with the pipeline architecture with one minor type fix needed and two optional optimizations.

| File | Status | Gap | Impact |
|------|--------|-----|--------|
| `auth.api.ts:66` `register()` return type | ⚠️ Fix needed | Returns `Promise<LoginResponse>` → should be `Promise<{ accountId: string; email: string }>` | Type-level only. No runtime impact since `SignupFormWrapper` ignores the response body. Fix prevents incorrect usage in future code. |
| `api.ts:87` URL prefix detection | ✅ Works correctly | Uses `url.startsWith('/admin')` for refresh endpoint selection | Reliable in practice but fragile if new admin prefixes are added. |
| `useAuth.tsx:106` `restoreSession()` | ✅ Works correctly | Tries user refresh first, then admin fallback | ADMIN users incur one failed refresh per page load before succeeding. |
| `api.ts` `_lastAuthRole` optimization | 🚀 Future | Add module-level var to avoid URL prefix detection | Eliminates brittle URL matching. Single source of truth for role. |
| `useAuth.tsx` localStorage role cache | 🚀 Future | Store last known role in `localStorage['auth_role']` | Eliminates double refresh on restore. Single API call for ADMIN users. |
| All other files (18 frontend files) | ✅ Fully aligned | No changes needed | — |

#### Current return type (to fix):

```typescript
// auth.api.ts — current (works but wrong type)
export function register(dto: SignupDto): Promise<LoginResponse> {
  return api.post('/auth/register', dto);
}

// auth.api.ts — should be:
export function register(dto: SignupDto): Promise<{ accountId: string; email: string }> {
  return api.post('/auth/register', dto);
}
```

#### Future optimization implementation plan:

```
// lib/api.ts — add module-level role tracker
let _lastAuthRole: 'USER' | 'ADMIN' | null = null;

// hooks/useAuth.tsx — save role on login
const login = async (accessToken: string, role?: string) => {
  const payload = decodeJwtPayload(accessToken);
  _lastAuthRole = role === 'ADMIN' || payload.roles.includes('ADMIN') ? 'ADMIN' : 'USER';
  localStorage.setItem('auth_role', _lastAuthRole);
  // ... rest of login
};

// lib/api.ts — use _lastAuthRole instead of URL prefix
const refreshUrl = _lastAuthRole === 'ADMIN'
  ? `${API_BASE}/admin/auth/refresh`
  : `${API_BASE}/auth/refresh`;
```
