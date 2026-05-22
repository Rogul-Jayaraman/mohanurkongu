# Architecture Reference (AI-Friendly)

> **Purpose**: Single-file reference for AI coding agents to understand, navigate, and safely modify this codebase. This document is optimized for LLM context ingestion.

---

## 1. SYSTEM OVERVIEW

```
Product: Mohanur Kongu Matrimony (மணமாலை) + Mandapam (மாளிகை) booking
Stack:  React 19 + Vite 6 + TanStack Query 5 + i18next   |   Express 5 + Prisma 6 + PostgreSQL 16 (Neon)
Deploy: Vercel (Frontend SPA + Backend Serverless Function)
```

### Directory Layout
```
/frontend/     — Vite SPA
/backend/      — Express serverless API
/docs/         — Engineering documentation (this file lives here as entry point)
```

### Key File Paths

| Purpose | Path |
|---|---|
| Frontend entry | `frontend/src/main.tsx` |
| App + Router | `frontend/src/App.tsx` |
| Axios instance | `frontend/src/lib/api.ts` |
| Auth context | `frontend/src/context/AuthContext.tsx` |
| i18n config | `frontend/src/i18n.ts` |
| Backend entry | `backend/src/index.ts` |
| Prisma schema | `backend/prisma/schema.prisma` |
| Prisma client | `backend/src/config/prisma.ts` |
| Error codes | `backend/src/utils/errors.ts` |
| Response helpers | `backend/src/utils/response.ts` |
| Auth middleware | `backend/src/middlewares/auth.ts` |
| Vercel frontend | `frontend/vercel.json` |
| Vercel backend | `backend/vercel.json` |
| API documentation | `backend/documentation/apis/` |

---

## 2. RENDERING MODEL

**CSR-only Single Page App.** No SSR, SSG, or ISR.

- All rendering happens in the browser
- `main.tsx` uses `createRoot(document.getElementById('root')!)`
- `index.html` is an empty shell `<div id="root"></div>`
- React Router handles all client-side navigation
- SEO via `MetadataManager` component (meta tags, Open Graph)

**Implications:**
- Blank screen until JS loads (mitigation: code splitting, lazy loading)
- No hydration mismatch bugs
- Simple static file deployment

---

## 3. STATE MANAGEMENT

### Three Layers

| Layer | Technology | What It Stores |
|---|---|---|
| **Global** | React Context (`AuthContext`, `LanguageContext`) | Auth state, language preference |
| **Server** | TanStack Query v5 | All API data (profiles, bookings, analytics) |
| **Local** | `useState` / `useReducer` | Form state, UI toggles, modal visibility |

### TanStack Query Configuration
```typescript
// frontend/src/App.tsx — QueryClient config
staleTime: 5 * 60 * 1000,         // 5 min before refetch
gcTime: 30 * 60 * 1000,           // 30 min garbage collection
refetchOnWindowFocus: false,
retry: false,
```

### Cache Invalidation Rules
- Login/logout: invalidate ALL queries
- Profile create/update: invalidate `['profiles', 'my']`, `['profiles', id]`
- Shortlist toggle: invalidate `['shortlist']`, `['profiles', 'browse']`
- Admin verification: invalidate `['profiles', 'verification']`, `['profiles', 'browse']`
- Booking create: invalidate `['mandapam', 'bookings']`, `['mandapam', 'calendar']`

### Auth State
- Token + user stored in `localStorage`
- `AuthContext` syncs localStorage → React state
- Axios interceptor attaches `Authorization: Bearer <token>`
- 401 response → auto-logout → redirect to login

---

## 4. COMPONENT ARCHITECTURE

### Organization
```
src/
├── api/             # API service modules (one per domain)
├── components/
│   ├── features/    # Domain feature components (auth, user, admin, maaligai, landing)
│   ├── forms/       # Form components (one per form)
│   ├── modals/      # Modal components
│   └── ui/          # Shared primitives (atoms, cards, forms, feedback, table, layout)
├── hooks/           # Custom hooks + TanStack Query hooks
│   ├── auth/
│   └── queries/
├── layout/          # Layout components per domain
├── pages/           # Route page components (thin — compose features + layouts)
└── locales/         # 48 i18n files (24 EN + 24 TA)
```

### Rules
- Pages import feature components. Feature components import UI components.
- UI components are stateless/presentational (props only)
- Feature components are smart (hooks, context, TanStack Query)
- Pages are thin — compose layouts + feature components
- NEVER import a feature component from a UI component
- NEVER put API calls directly in components — use hooks
- NEVER bypass TanStack Query for server data

---

## 5. ROUTING

```typescript
// frontend/src/App.tsx — React Router v7

Public:     / → LandingPage
            /maaligai/* → Maaligai pages (public info)
            /manamaalai/login, /signup, /forgot-password → Auth pages
Protected:  /manamaalai/dashboard, /browse-profiles, /shortlist, etc. → User pages
Admin:      /admin/dashboard, /admin/matrimony/*, /admin/mandapam/* → Admin pages
```

Protection via `<ProtectedRoute>` and `<PublicRoute>` wrapper components.

---

## 6. API ARCHITECTURE

### Base URL
- Development: `http://localhost:5001/api`
- Production: `https://mohanurkongubackend.vercel.app/api`
- Set via `VITE_API_URL` env var

### Response Format
```json
// Success: { success: true, data: {...}, message: "..." }
// Error:   { success: false, code: "ERROR_CODE", message: "...", statusCode: 400 }
// Paginated: { success: true, data: [...], pagination: { total, page, limit, totalPages } }
```

### Route Groups
| Prefix | Auth | Purpose |
|---|---|---|
| `/api/auth` | None | Login, signup, OTP |
| `/api/profiles` | Mixed | Profile CRUD, browse |
| `/api/shortlist` | authenticate | Shortlist toggle |
| `/api/dashboard` | authenticate | User dashboard |
| `/api/astrology` | None | Chart calculation |
| `/api/admin/matrimony` | authenticate + authorizeAdmin | Admin operations |
| `/api/admin/mandapam` | authenticate + authorizeAdmin | Mandapam management |
| `/api/admin/analytics` | authenticate + authorizeAdmin | Analytics |
| `/api/settings` | authenticate | User settings |
| `/health` | None | Health check |

### Request Lifecycle
```
Request → cors() → logger → Route → auth middleware (optional/required/admin)
→ Controller (validate, call service) → Service (business logic, Prisma) → Response
```

**Key rule**: Controllers are thin. Services contain ALL business logic. Services never access req/res.

---

## 7. DATABASE

### Models (9 total)
```
User 1──* Profile
Profile 1──1 Horoscope
Profile 1──* Shortlist
User 1──* PlanTransaction
Admin 1──* MandapamBooking
MandapamPackage 1──* MandapamBooking
BlockedDate (standalone)
RegistrationCounter (atomic counter for reg numbers)
AppSettings (key-value store)
```

### Prisma Client
```typescript
// backend/src/config/prisma.ts — Singleton pattern
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Key Constraints
- `Profile.regNo` — unique, district-based format (e.g., "CBE-2024-0001")
- `MandapamBooking(date, session)` — unique, prevents double-booking
- `Shortlist(profileId, userId)` — unique, prevents duplicate shortlists
- `BlockedDate.date` — unique, only one block reason per date

### Bilingual Database Pattern
All user-facing content stored as dual fields: `fieldEn`/`fieldTa`
(e.g., `fullnameEn`, `fullnameTa`, `nameEn`, `nameTa`, `featuresEn[]`, `featuresTa[]`)

---

## 8. AUTHENTICATION

### JWT-based (7-day expiry)
```
Login → bcrypt compare → jwt.sign({ userId, role, email }, JWT_SECRET, { expiresIn: '7d' })
→ Frontend stores token in localStorage → Axios interceptor adds Bearer header
```

### Middleware Chain
- `authenticate`: Required — verifies JWT, attaches `req.user`
- `authorizeAdmin`: Admin-only — checks `req.user.role === 'ADMIN'`
- `optionalAuthenticate`: Optional — populates `req.user` if token present

### Dual Auth Paths
- `/api/auth/login` — User login (email + password)
- `/api/auth/admin-login` — Admin login (separate Admins table)
- Registration: OTP sent to email → verify OTP → create account

---

## 9. ERROR HANDLING

### Error Codes
```typescript
UNAUTHORIZED (401), INVALID_TOKEN (401), FORBIDDEN (403),
NOT_FOUND (404), VALIDATION_ERROR (400), DUPLICATE_ENTRY (409),
BOOKING_CONFLICT (409), PLAN_LIMIT_REACHED (403),
OTP_EXPIRED (400), INVALID_OTP (400), INTERNAL_ERROR (500)
```

### Error Flow
```
Service throws AppError → Controller catches → next(error) → Central express handler
→ sendError(res, statusCode, code, message)
```

### Prisma Error Mapping
```
P2002 (unique) → 409 DUPLICATE_ENTRY
P2025 (not found) → 404 NOT_FOUND
P2003 (FK violation) → 400 VALIDATION_ERROR
```

---

## 10. ARCHITECTURE RULES (SAFE REFACTORING GUIDE)

These rules constrain what AI agents should NEVER do:

### NEVER Do These
1. ❌ Put business logic in controllers — use services
2. ❌ Access req/res in services — pass data as parameters
3. ❌ Call Prisma directly from controllers — wrap in services
4. ❌ Store API data in React useState — use TanStack Query
5. ❌ Create new PrismaClient instances — use the singleton
6. ❌ Use `$queryRawUnsafe` — use parameterized queries only
7. ❌ Hardcode strings in components — use `t('namespace:key')`
8. ❌ Add English-only DB fields — dual fields required (`fieldEn`/`fieldTa`)
9. ❌ Store JWT in cookies — use localStorage + Authorization header
10. ❌ Skip auth middleware on any non-public route
11. ❌ Expose stack traces in production API responses
12. ❌ Use `prisma migrate dev` in production — use `migrate deploy`

### DO These
1. ✅ Singleton PrismaClient (hot-reload safe)
2. ✅ Zod validation on all API inputs
3. ✅ Feature-based component organization
4. ✅ Proper HTTP status codes for errors
5. ✅ TanStack Query for all server state
6. ✅ i18next for all user-facing text
7. ✅ `Promise.all` for parallel independent queries
8. ✅ Pagination on all list endpoints (`take`/`skip`)

---

## 11. KEY NPM PACKAGES

### Frontend (key ones)
| Package | Purpose |
|---|---|
| react, react-dom | UI framework v19 |
| react-router-dom | Client-side routing v7 |
| @tanstack/react-query | Server state management v5 |
| axios | HTTP client |
| i18next, react-i18next | Internationalization |
| framer-motion | Animations |
| tailwindcss v4 | Styling |
| lucide-react | Icons |
| recharts | Admin charts |
| sonner | Toast notifications |
| @radix-ui/react-slider | Range slider |
| date-fns | Date formatting |

### Backend (key ones)
| Package | Purpose |
|---|---|
| express v5 | Web framework |
| @prisma/client, prisma | ORM |
| jsonwebtoken | JWT auth |
| bcryptjs | Password hashing |
| zod | Validation v4 |
| cloudinary | Image CDN |
| nodemailer | Email delivery |
| @swisseph/node | Vedic astrology engine |
| cors | CORS middleware |
| multer | File upload handling |

---

## 12. ENVIRONMENT VARIABLES

### Frontend (`VITE_` prefixed)
| Var | Example |
|---|---|
| `VITE_API_URL` | `http://localhost:5001/api` |
| `VITE_API_BASE_URL` | `http://localhost:5001` |
| `VITE_HOME_URL` | `http://localhost:3000` |

### Backend
| Var | Purpose |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection |
| `JWT_SECRET` | Token signing key |
| `CLOUDINARY_*` | Cloudinary credentials |
| `EMAIL_*` | Gmail SMTP credentials |
| `FRONTEND_URL` | CORS allowed origin |
| `NODE_ENV` | Environment mode |

---

## 13. BILINGUAL PATTERNS

### UI Text → i18next
```typescript
const { t } = useTranslation('auth')
t('auth:login.title')     // "Login" (en) / "உள்நுழைய" (ta)
t('common:save')           // "Save" / "சேமிக்க"
```

### User Content → Dual DB Fields
```typescript
const name = language === 'ta' ? profile.fullnameTa : profile.fullnameEn
```

### Transliteration
```typescript
// Google Input Tools API for English → Tamil transliteration
// Used in TransliteratingTextarea, PhoneticInput components
```

---

## 14. TESTING & QUALITY

### Current State
- **No testing framework** configured for frontend or backend
- Manual QA through development

### Test Commands (when added)
```bash
# Frontend (future)
cd frontend && vitest run

# Backend (future)
cd backend && jest --passWithNoTests
```

### Code Review Checklist
- [ ] Controllers are thin (no business logic)
- [ ] Services contain business logic
- [ ] Input validated with Zod on backend
- [ ] Proper auth middleware applied
- [ ] Mutations invalidate correct cache keys
- [ ] Translations added to both EN and TA files
- [ ] Dual DB fields used for user content
- [ ] Error codes returned (not generic 500)
- [ ] Pagination on list endpoints
- [ ] No N+1 queries (Prisma include used)

---

## 15. SECURITY QUICK REFERENCE

| Concern | Mitigation |
|---|---|
| SQL injection | Prisma ORM (parameterized queries) |
| XSS | React auto-escaping, no dangerouslySetInnerHTML |
| CSRF | Token in Authorization header (not cookies) |
| Password theft | bcryptjs (cost 10+) |
| Token theft | localStorage (XSS-dependent), input sanitization |
| Brute force | bcryptjs + future rate limiting |
| Data exposure | `select` limits fields in API responses |
| Privacy | Screenshot detection, disabled right-click on profile images |

---

## 16. PERFORMANCE SENSITIVE PATHS

| Endpoint | Load | Optimization |
|---|---|---|
| `GET /api/profiles/browse` | HIGH | Compound index, pagination, `select` only needed fields |
| `POST /api/astrology/calculate` | MEDIUM | Heavy WASM computation, consider caching results |
| `GET /api/admin/analytics` | MEDIUM | Multiple aggregate queries, cache for 5 min |
| `GET /api/admin/mandapam/calendar` | MEDIUM | Date range query, add index |
| `POST /api/auth/signup` | MEDIUM | Transaction with RegistrationCounter |
| `PATCH /api/profiles/:id` | LOW | Single row update, low frequency |

---

## 17. TROUBLESHOOTING COMMON ISSUES

| Issue | Check | Fix |
|---|---|---|
| API 401 | localStorage token exists? Token expired? | Re-login |
| API 500 | Backend logs, Prisma errors | Check error handler |
| Slow browse | Missing index? N+1 queries? | Add index, use `include` |
| DB connection | Prisma singleton? Pool exhaustion? | Singleton pattern, pooled connection |
| Cold start | First request after idle | Keep-alive pings (future) |
| Build fails | TypeScript errors? Prisma generate? | Fix types, run `prisma generate` |
| i18n not working | Namespace loaded? Key exists? | Check translation file structure |

---

*For detailed documentation, see individual files in `/docs/` directory.*
