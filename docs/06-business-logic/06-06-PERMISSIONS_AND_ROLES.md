# Permissions & Roles

Role hierarchy, guard middleware, and endpoint protection.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ROLE HIERARCHY                                       │
│                                                                         │
│   ANONYMOUS ──▶ USER ──▶ ADMIN ──▶ SUPER_ADMIN                        │
│                                                                         │
│   Each role inherits all permissions of roles to its left:              │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │  ANONYMOUS                                                    │     │
│   │  ├── Browse public profiles (limited fields)                 │     │
│   │   └── View halls                                                 │     │
│   │                                                                  │     │
│   │  USER (inherits ANONYMOUS)                                      │     │
│   │  ├── Create/manage own profile                                  │     │
│   │  ├── Browse all profiles (tier-limited)                         │     │
│   │  ├── Shortlist / express interest                               │     │
│   │  ├── Book halls                                                 │     │
│   │  └── Manage own bookings                                        │     │
│   │                                                                  │     │
│   │  ADMIN (inherits USER)                                           │     │
│   │  ├── Review/approve/reject profiles                             │     │
│   │  ├── Manage all bookings                                        │     │
│   │  ├── Manage halls + calendar                                    │     │
│   │  ├── View analytics                                             │     │
│   │  └── Suspend/unsuspend accounts                                 │     │
│   │                                                                  │     │
│   │  SUPER_ADMIN (inherits ADMIN)                                    │     │
│   │  ├── Create/manage admins                                       │     │
│   │  ├── System configuration                                        │     │
│   │  └── Delete any data                                             │     │
│   └──────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Guard Middleware

| Guard | What It Checks | Used On |
|-------|---------------|---------|
| `requireAuth` | Valid JWT access token in `Authorization` header | All authenticated endpoints |
| `optionalAuth` | Checks JWT but doesn't reject if missing | Public browse (shows more if authenticated) |
| `requireRole('ADMIN')` | `req.user.role === 'ADMIN' or 'SUPER_ADMIN'` | All admin routes: `/admin/*` |
| `requireRole('SUPER_ADMIN')` | `req.user.role === 'SUPER_ADMIN'` | User management, system config |
| `requireIpAllowlist` | `req.ip` is in configured allowlist | Admin routes in production |

## Endpoint Protection Matrix

```
┌──────────────────────────┬────────────┬──────────────┬────────────────┐
│ Endpoint                 │ Auth       │ Role         │ IP Restriction │
├──────────────────────────┼────────────┼──────────────┼────────────────┤
│ POST /api/auth/register  │ None       │ —            │ —              │
│ POST /api/auth/login     │ None       │ —            │ —              │
│ POST /api/auth/refresh   │ Cookie     │ —            │ —              │
│ POST /api/auth/otp/send  │ None*      │ —            │ —              │
│ GET /api/profiles        │ Optional   │ —            │ —              │
│ GET /api/profiles/:id    │ Optional   │ —            │ —              │
│ POST /api/profiles       │ Required   │ USER         │ —              │
│ PUT /api/profiles/:id    │ Required   │ USER (owner)  │ —              │
│ DELETE /api/profiles/:id │ Required   │ USER (owner)  │ —              │
│ GET /api/mandapams       │ Optional   │ —            │ —              │
│ POST /api/bookings       │ Required   │ USER          │ —              │
│ GET /admin/profiles      │ Required   │ ADMIN        │ ✅ Yes         │
│ PUT /admin/profiles/:id  │ Required   │ ADMIN        │ ✅ Yes         │
│ POST /admin/halls        │ Required   │ ADMIN        │ ✅ Yes         │
│ GET /admin/analytics     │ Required   │ ADMIN        │ ✅ Yes         │
│ GET /admin/users         │ Required   │ SUPER_ADMIN  │ ✅ Yes         │
│ POST /admin/users        │ Required   │ SUPER_ADMIN  │ ✅ Yes         │
└──────────────────────────┴────────────┴──────────────┴────────────────┘
```

## Data Ownership

| Entity | Owner | Admin Can | SUPER_ADMIN Can |
|--------|-------|-----------|-----------------|
| Profile | Creator account | Read, archive, approve/reject | Delete |
| Booking | Creator account | Read, cancel, modify | Delete |
| Account | User | Read, suspend/unsuspend | Read, delete |
| Mandapam | Admin | Full CRUD | Full CRUD |
| Analytics | — | Read | Read |

## Edge Cases

| Scenario | Behavior | Mitigation |
|----------|----------|-----------|
| Suspended user tries API call | requireAuth passes (token valid), but business logic rejects | Check status in pipeline |
| User accesses admin route directly | 403 Forbidden | requireRole guard before route handler |
| Deleted account's token still in use | Next API call: requireAuth → account not found → 401 | Token validation includes account status check |
| SUPER_ADMIN demotes own role | Not allowed — must have another SUPER_ADMIN | Role change audit log check |
| User edits another user's profile | requireAuth passes but ownership check fails | Controller validates `req.user.id === profile.accountId` |
| Rate limit bypasses auth guard | 429 returned before auth check | Rate limit is before requireAuth in middleware chain |
| IP allowlist mismatch | 403 before any auth check | requireIpAllowlist is first guard on admin routes |
| User deleted, admin tries to view | 404 (soft delete hides from normal queries) | Admin queries include deleted=False filter |
