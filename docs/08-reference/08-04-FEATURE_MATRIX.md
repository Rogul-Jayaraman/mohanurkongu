# Feature Matrix

Implementation status of all features across backend and frontend.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    STATUS LEGEND                                       │
│                                                                         │
│   ✅ = Fully implemented and tested                                    │
│   🟡 = Partially implemented (some endpoints or UI states missing)     │
│   ⬜ = Stub only (placeholder, no real logic)                         │
│   ❌ = Not started                                                     │
│   N/A = Not applicable                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

## Authentication

| Feature | Backend | Frontend | Notes |
|---------|---------|----------|-------|
| Register | ✅ | ✅ | Full OTP verification flow |
| Login | ✅ | ✅ | With refresh token rotation |
| OTP Send | ✅ | ✅ | 60s cooldown, 3/min limit |
| OTP Verify | ✅ | ✅ | 5 max attempts, hard lockout |
| Token Refresh | ✅ | ✅ | Automatic via Axios interceptor |
| Logout | ✅ | ✅ | Clears cookies + session |
| Password Reset | ✅ | 🟡 | Email flow done, UI needs completion |
| Change Password | ✅ | 🟡 | Authenticated flow done |
| Forgot Password | 🟡 | 🟡 | Backend supports, frontend partial |

## Profiles (Manamaalai)

| Feature | Backend | Frontend | Notes |
|---------|---------|----------|-------|
| Create Profile | ✅ | ✅ | 17-step upsert pipeline |
| View Profile | ✅ | ✅ | Tier-gated field visibility |
| Browse Profiles | ✅ | 🟡 | Cursor pagination done, UI needs filter controls |
| Update Profile | ✅ | 🟡 | Upsert pipeline supports edit |
| Delete Profile | ✅ | ❌ | Soft delete with 30d purge |
| Shortlist | ✅ | 🟡 | Toggle implemented, list view partial |
| Express Interest | 🟡 | ❌ | Contract defined, not wired |
| Showcase Profile | ✅ | ❌ | Backend pipeline done |
| Profile Photos | ✅ | 🟡 | Upload done, gallery UI partial |
| Admin List | ✅ | ⬜ | All admin CRUD done backend |
| Admin Approve/Reject | ✅ | ⬜ | Status change pipeline done |
| Admin Archive | ✅ | ⬜ | Archive pipeline done |
| Admin Delete | ✅ | ⬜ | Delete pipeline done |
| Verification Decision | ✅ | ⬜ | 10-step decision pipeline |

## Hall Booking (Maaligai)

| Feature | Backend | Frontend | Notes |
|---------|---------|----------|-------|
| List Mandapams | ✅ | 🟡 | Catalog pipeline done |
| View Mandapam Detail | ✅ | 🟡 | With calendar embed |
| Create Booking | ✅ | 🟡 | 12-step pipeline with token |
| Cancel Booking | ✅ | ❌ | State machine transitions |
| View Bookings | ✅ | 🟡 | List + detail |
| Calendar View | ✅ | ⬜ | 3-step calendar pipeline |
| Calendar Block | ✅ | ⬜ | Admin block/unblock |
| Settlement | ✅ | ❌ | 10-step settlement pipeline |
| Financial Transactions | ✅ | ❌ | 5-step fin-tx pipeline |
| Token Validate | ✅ | ❌ | Token lifecycle |
| Package Update | ✅ | ❌ | Admin updates package |
| Admin Booking List | ✅ | ⬜ | Admin listing |
| Admin Booking Status | ✅ | ⬜ | Status modifications |

## Membership

| Feature | Backend | Frontend | Notes |
|---------|---------|----------|-------|
| Plan Gating | ✅ | 🟡 | Full resolution logic |
| Plan Display | ✅ | 🟡 | Tier info shown |
| Upgrade Flow | 🟡 | ❌ | Contract defined |
| Auto-renew | ❌ | ❌ | Future feature |
| Trial Period | ❌ | ❌ | Future feature |

## Administration

| Feature | Backend | Frontend | Notes |
|---------|---------|----------|-------|
| Dashboard | ✅ | ⬜ | Analytics queries ready |
| User Management | ✅ | ❌ | SUPER_ADMIN only |
| Role Management | ✅ | ❌ | SUPER_ADMIN only |
| Audit Log View | ✅ | ❌ | Backend query ready |

## System

| Feature | Backend | Frontend | Notes |
|---------|---------|----------|-------|
| Health Check | ✅ | N/A | `/health`, `/health/db`, `/health/redis` |
| Error Tracking | ✅ | ✅ | Sentry on both |
| Rate Limiting | ✅ | N/A | Global + per-route |
| IP Allowlisting | ✅ | N/A | Admin routes in production |
| CSP Headers | ✅ | N/A | Hardened via helmet |
| SSL/TLS | ✅ | N/A | Nginx + Certbot |
| i18n (en+ta) | N/A | 🟡 | 16 namespaces, ~70% coverage |
| Bull Queue | ✅ | ⬜ | Background jobs, Bull Board UI |
