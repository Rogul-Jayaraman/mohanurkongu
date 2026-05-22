# Request Lifecycle

## Complete Request Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant V as Vercel Edge
    participant E as Express App
    participant M as Middleware Chain
    participant R as Router
    participant A as Auth Middleware
    participant VLD as Zod Validator
    participant CTRL as Controller
    participant SVC as Service
    participant DB as Prisma + Neon
    
    C->>V: HTTP Request
    V->>E: Route to /api/...
    
    Note over E: src/index.ts
    
    E->>M: cors()
    M->>M: loggerMiddleware
    
    Note over M: Logs: METHOD /path → Status → Duration
    
    M->>R: Route matching
    
    alt Protected Route
        R->>A: authenticate middleware
        A->>A: Extract Bearer token
        A->>A: jwt.verify(token, JWT_SECRET)
        A->>A: Attach decoded to req.user
        A-->>R: next()
    end
    
    alt Admin Route
        R->>A: authorizeAdmin middleware
        A->>A: Check req.user.role === 'ADMIN'
        A-->>R: next()
    end
    
    R->>CTRL: Controller.handle()
    
    Note over CTRL: Controller is THIN
    
    CTRL->>VLD: Validate req.body / req.query
    VLD-->>CTRL: Parsed + validated data
    
    CTRL->>SVC: Service.method(validatedData, req.user)
    
    Note over SVC: Service contains ALL business logic
    
    SVC->>SVC: Business rules / calculations
    
    SVC->>DB: prisma.model.findMany/create/update
    
    Note over DB: SQL queries to Neon PostgreSQL
    
    DB-->>SVC: Prisma results
    SVC-->>CTRL: Transformed result
    
    alt Error Path
        SVC-->>CTRL: throw AppError
        CTRL->>CTRL: next(error)
        CTRL->>E: Error handler middleware
        E-->>C: { success: false, code, message, statusCode }
    else Success Path
        CTRL-->>C: { success: true, data, message }
    end
```

## Layer Responsibilities

| Layer | File | Responsibility | What NOT To Do |
|---|---|---|---|
| **Entry** | `src/index.ts` | Express app setup, middleware registration, route mounting | Don't put routes inline — use route files |
| **Middleware** | `middlewares/auth.ts`, `middlewares/logger.ts` | Request pre-processing: auth, logging, CORS | Don't put business logic here |
| **Router** | `routes/*.ts` | Map HTTP verb + path → controller | Don't add logic, don't call services directly |
| **Controller** | `controllers/*.ts` | Parse request, call service, send response | Don't put business logic, don't query DB |
| **Validator** | `utils/validators/*.ts` | Zod schema validation | Don't handle auth, don't access DB |
| **Service** | `services/*.ts` | ALL business logic, transaction handling, external calls | Don't access req/res, don't format HTTP responses |
| **Prisma** | `config/prisma.ts` | Database ORM client | Don't bypass via raw SQL unless necessary |
| **Utils** | `utils/*.ts` | Error formatting, response helpers | Don't contain business logic |

## Data Transformation Chain

```mermaid
flowchart LR
    subgraph Input["Input Processing"]
        Raw["Raw request body/query"] --> Zod["Zod parse"]
        Zod --> Validated["Validated + typed data"]
        Zod -->|Error| ZodErr["ZodError → 400 response"]
    end
    
    subgraph Business["Business Logic"]
        Validated --> ServiceMethod["Service method"]
        ServiceMethod --> Process["Process data"]
        Process --> Prisma["Prisma query"]
        Prisma --> DBResult["Database result"]
        DBResult --> Transform["Transform to API shape"]
    end
    
    subgraph Output["Output Processing"]
        Transform --> Controller["Controller receives result"]
        Controller --> Response["sendSuccess(res, data)"]
        Response --> JSON["JSON response"]
    end
```

## Error Propagation

```mermaid
flowchart TD
    Service["Service throws AppError"] -->|next(error)| Controller
    Prisma["Prisma error"] -->|catch| Service["Service wraps in AppError"]
    Zod["Zod validation fail"] -->|return 400| Controller["Controller returns early"]
    
    Controller --> ErrorHandler["Express error handler (index.ts)"]
    ErrorHandler --> Format{"Error type?"}
    Format -->|AppError| Known["Known error → sendError(code, message, status)"]
    Format -->|PrismaError| PrismaE["Prisma error → generic message (hide details)"]
    Format -->|Unknown| Unknown["Unknown → 500 Internal Server Error"]
    
    Known --> Prod{"Production?"}
    PrismaE --> Prod
    Unknown --> Prod
    Prod -->|Yes| Safe["Safe message (no stack trace)"]
    Prod -->|No| Verbose["Verbose (with stack trace)"]
```

## Debugging the Request Lifecycle

| Issue | Check |
|---|---|
| Request not reaching controller | Middleware threw before controller (check auth) |
| Wrong data in response | Check service transformation, not Prisma |
| Slow response | Check Prisma query time (enable query logging) |
| 401 when authenticated | Token expired, wrong JWT_SECRET, malformed header |
| 403 on admin route | User role is not ADMIN |
| 400 with no details | Zod validation failed — check request body shape |
| 500 with no details | Unhandled error — check server logs |
