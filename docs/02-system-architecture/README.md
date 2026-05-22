# System Architecture Overview

## Layered Architecture

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        Browser[Browser SPA]
    end
    
    subgraph CDN["CDN / Edge"]
        VercelEdge[Vercel Edge Network]
    end
    
    subgraph Frontend["Frontend Application (Vite SPA)"]
        Router[React Router 7]
        Pages[Pages]
        Features[Feature Components]
        UI[UI Components]
        Hooks[Custom Hooks]
        API[API Service Modules]
        Query[TanStack Query]
        Context[React Context]
        i18n["i18next (EN/TA)"]
    end
    
    subgraph Backend["Backend (Express 5 Serverless)"]
        Middleware[Middleware Chain]
        Controllers[Controllers]
        Services[Services]
        Validators[Zod Validators]
        Prisma[Prisma ORM]
    end
    
    subgraph External["External Services"]
        Neon[(Neon PostgreSQL)]
        Cloudinary[Cloudinary CDN]
        GMail[Gmail SMTP]
        GoogleTrans[Google Transliterate API]
    end
    
    subgraph AuthLayer["Auth Layer"]
        JWT[JWT Token]
        BCrypt[bcryptjs]
        OTP[Email OTP]
    end
    
    Browser --> VercelEdge
    VercelEdge --> Router
    
    Router --> Pages
    Pages --> Features
    Features --> UI
    Features --> Hooks
    Hooks --> API
    API --> Query
    Hooks --> Context
    Pages --> i18n
    
    API -->|HTTP/JSON| Middleware
    
    Middleware --> Controllers
    Controllers --> Services
    Services --> Prisma
    Services --> Validators
    Services --> Cloudinary
    Services --> GMail
    Prisma --> Neon
    
    Controllers --> AuthLayer
```

## Request Lifecycle

```mermaid
sequenceDiagram
    participant B as Browser
    participant V as Vite/React
    participant Q as TanStack Query
    participant A as Axios
    participant M as Middleware
    participant C as Controller
    participant S as Service
    participant P as Prisma
    participant D as Database
    
    B->>V: User Action
    V->>Q: useQuery / useMutation
    Q->>A: API Call
    A->>M: HTTP Request
    
    Note over M: cors → logger → auth → validation
    
    M->>M: Validate JWT (if protected)
    M->>M: Attach req.user
    
    M->>C: Next()
    C->>C: Parse & validate input (Zod)
    C->>S: Call service method
    
    S->>S: Business logic
    S->>S: Transaction handling
    S->>P: Prisma query
    P->>D: SQL
    D-->>P: Result
    P-->>S: Data
    
    alt Error Occurs
        S-->>C: Throw AppError
        C-->>A: ErrorResponse { code, message, status }
    else Success
        S-->>C: Result
        C-->>A: SuccessResponse { data, message }
    end
    
    A-->>Q: Parsed Response
    Q-->>Q: Cache Update
    Q-->>V: Re-render
    V-->>B: UI Update
```

## Where Each Concern Lives

| Concern | Location | Why |
|---|---|---|
| Input Validation | **Frontend**: form validation in components<br>**Backend**: Zod schemas in `validators/` | Defense in depth — frontend for UX, backend for security |
| Business Logic | **`src/services/`** | Controllers are thin; services contain all rules |
| DB Access | **`prisma.$queryRaw` / `prisma.model.findMany`** in services | Repository pattern through Prisma — never raw SQL in controllers |
| Auth Enforcement | **`middlewares/auth.ts`** + route-level guards | Centralized, never forgotten |
| Error Formatting | **`utils/errors.ts`** + `utils/response.ts` | Consistent API responses everywhere |
| File Upload | **`cloudinary.service.ts`** + signed upload from frontend | Server-side signature, client-side upload for performance |
| Translation | **`locales/{en,ta}/`** — i18next namespaces | Runtime language switching without page reload |
| Caching | **TanStack Query** (frontend) + Prisma (query cache) | No Redis yet — see scalability docs |

## Data Flow — Key Paths

### Matrimony Profile Flow
```
User fills form → ProfileService.createProfile()
  → Zod validation
  → Generate regNo (atomic district counter)
  → Create Profile with Horoscope
  → Upload photos (Cloudinary signed URL)
  → Set status=DRAFT / PENDING
  → Admin verifies → status=ACTIVE
  → Visible in browse results
```

### Mandapam Booking Flow
```
Admin creates booking → MandapamBookingService.createBooking()
  → Validate date+session uniqueness
  → Validate package exists & active
  → Create booking with snapshot pricing
  → Track payment status
  → Block calendar slot
```

### Authentication Flow
```
Login → AuthService.login()
  → Find user by email
  → Compare bcrypt hash
  → Generate JWT (7d expiry)
  → Return { token, user }
  → Frontend stores in localStorage
  → Axios interceptor attaches Authorization header
```

## Anti-Patterns & Rules

| Rule | Rationale |
|---|---|
| **Controllers must NOT contain business logic** | Testing becomes impossible; logic duplication |
| **Services must NOT call other services directly** | Use controller orchestration or event bus (future) |
| **Frontend must NOT bypass TanStack Query** | Manual fetch/state leads to cache inconsistency |
| **API modules must NOT contain URL strings** | All URLs in env vars or config constants |
| **Translations must NOT be hardcoded in components** | Always use `useTranslation()` or `t()` |
| **DB queries must NOT be in controllers** | Every query should be wrapped in a service method |
| **Auth checks must NOT rely on frontend alone** | Backend enforces all auth; frontend is UX-only |

## Debugging Considerations

- Use `loggerMiddleware` ANSI output to trace requests in real-time
- TanStack Query Devtools in dev mode for cache inspection
- Prisma's `log: ['query']` for SQL debugging (dev only)
- Check `VITE_API_URL` is correct for the environment
- Serverless cold starts cause initial latency on first request after idle
