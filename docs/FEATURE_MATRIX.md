# Feature Matrix

## Matrimony

| Feature | Frontend | Backend | Status |
|---|---|---|---|
| User registration | Login page, Signup form | Auth routes connected | EXECUTED* |
| Email/OTP verification | OTP input component | OTP endpoints connected | BROKEN* |
| User login | Login page | Auth routes connected | EXECUTED* |
| Password reset | ForgotPassword page | Auth routes connected | EXECUTED* |
| Profile creation | NewProfile page (stubs) | Not implemented | BROKEN |
| Profile viewing | ProfileView page (stubs) | Not implemented | BROKEN |
| Profile editing | MyProfiles page (stubs) | Not implemented | BROKEN |
| Photo upload | NewProfile page (stubs) | Not implemented | BROKEN |
| Horoscope data | Horoscope components | Not implemented | BROKEN |
| Browse profiles | BrowseProfiles page (stubs) | Not implemented | BROKEN |
| Shortlist | Shortlist page (stubs) | Not implemented | BROKEN |
| Interest expression | Not implemented | Not implemented | UNUSED |
| Matching algorithm | Not implemented | Not implemented | UNUSED |
| Community filters | BrowseProfiles page (stubs) | Not implemented | BROKEN |
| Plan upgrade | ComingSoon page | Not implemented | BROKEN |

## Mandapam

| Feature | Frontend | Backend | Status |
|---|---|---|---|
| Hall listing | MaaligaiHome (static) | Not implemented | EXECUTED (static) |
| Hall details | Static pages | Not implemented | EXECUTED (static) |
| Gallery | GalleryPage (static) | Not implemented | EXECUTED (static) |
| Availability calendar | MaaligaiHallAvailability (stubs) | Not implemented | BROKEN |
| Package listing | PackagesPage (static) | Not implemented | EXECUTED (static) |
| Booking | Not implemented | Not implemented | UNUSED |
| Admin: Packages CRUD | Packages page (stubs) | Not implemented | BROKEN |
| Admin: Availability | Availability page (stubs) | Not implemented | BROKEN |
| Admin: Bookings | Bookings page (stubs) | Not implemented | BROKEN |

## Admin

| Feature | Frontend | Backend | Status |
|---|---|---|---|
| Admin login | AdminLogin page | /auth/login (portal=ADMIN) | EXECUTED* |
| Dashboard stats | Dashboard page (stubs) | Not implemented | BROKEN |
| Profile verification | Verification page (stubs) | Not implemented | BROKEN |
| User management | Users page (stubs) | Not implemented | BROKEN |
| Profile management | Profiles page (stubs) | Not implemented | BROKEN |
| Membership management | Membership page (stubs) | Not implemented | BROKEN |
| Analytics | Analytics page (stubs) | Not implemented | BROKEN |
| System settings | Settings page (stubs) | Not implemented | BROKEN |

## Infrastructure

| Feature | Status | Notes |
|---|---|---|
| Email sending | BROKEN | Queue/worker exist but never called |
| OTP delivery | BROKEN | BUG-CRIT-001 |
| Session rotation | EXECUTED* | BUG-HIGH-001 (race condition) |
| Rate limiting | PARTIAL | Missing on refresh, logout, reset-password |
| i18n (en/ta) | EXECUTED | 16 namespaces |
| Background jobs | EXECUTED | Expire OTP, sessions; purge anon; archive old |
| Audit logging | EXECUTED | Worker wired to audit queue |
| Health check | EXECUTED | GET /health |
| Docker Compose | EXECUTED | Dev + prod configurations |
| Nginx reverse proxy | EXECUTED | Templates configured |
| CI/CD | NOT IMPLEMENTED | No pipeline scripts |

* = Known bugs affect this feature
