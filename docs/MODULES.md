# Modules

## Auth Module

| Attribute | Value |
|---|---|
| **Purpose** | User registration, authentication, session management, password management |
| **Owner** | Backend team |
| **Status** | EXECUTED (with known bugs) |
| **Entrypoints** | `POST /auth/send-otp`, `POST /auth/verify-otp`, `POST /auth/signup`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/logout-all`, `POST /auth/forgot-password`, `POST /auth/verify-password-otp`, `POST /auth/reset-password`, `POST /auth/change-password`, `GET /auth/me`, `GET /health` |
| **Dependencies** | Prisma (PostgreSQL), Redis (BullMQ), JWT utils, Argon2id, Email templates |
| **Files** | `auth.routes.ts`, `auth.controller.ts`, `auth.service.ts`, `auth.validation.ts` |
| **Bugs** | BUG-CRIT-001, BUG-CRIT-002, BUG-CRIT-003, BUG-CRIT-004, BUG-HIGH-001, BUG-HIGH-002, BUG-HIGH-003, BUG-HIGH-004 |

### Endpoint List

| Method | Path | Auth | Rate Limit | Status |
|---|---|---|---|---|
| POST | /auth/send-otp | No | Yes (10/15m) | EXECUTED |
| POST | /auth/verify-otp | No | Yes (10/15m) | EXECUTED |
| POST | /auth/signup | No | Yes (10/15m) | EXECUTED |
| POST | /auth/login | No | Yes (10/15m) | EXECUTED |
| POST | /auth/refresh | Yes | MISSING | EXECUTED |
| POST | /auth/logout | Yes | MISSING | EXECUTED |
| POST | /auth/logout-all | Yes | Yes (5/15m) | EXECUTED |
| POST | /auth/forgot-password | No | Yes (5/15m) | EXECUTED |
| POST | /auth/verify-password-otp | No | Yes (10/15m) | EXECUTED |
| POST | /auth/reset-password | No | No | EXECUTED |
| POST | /auth/change-password | Yes | Yes (5/15m) | EXECUTED |
| GET | /auth/me | Yes | No | EXECUTED |
| GET | /health | No | No | EXECUTED |

---

## Account Module

| Attribute | Value |
|---|---|
| **Purpose** | Account management (change password, update profile) |
| **Owner** | Backend team |
| **Status** | PARTIAL — `AccountService.changePassword()` defined but never called |
| **Entrypoints** | None. `AuthService.changePassword()` bypasses AccountService and uses Prisma directly |
| **Dependencies** | Prisma |
| **Files** | `account.service.ts` (dead code) |

---

## Session Module

| Attribute | Value |
|---|---|
| **Purpose** | Refresh token rotation, revocation, session management |
| **Owner** | Backend team |
| **Status** | EXECUTED (with known bug) |
| **Entrypoints** | Called by AuthService (rotateSession, revoke, revokeAll) |
| **Dependencies** | Prisma |
| **Files** | `session.service.ts`, `session.repository.ts` |
| **Bugs** | BUG-HIGH-001 (concurrent rotation race) |

---

## Profile Module

| Attribute | Value |
|---|---|
| **Purpose** | Matrimony profile CRUD, photo management, horoscope data |
| **Owner** | Backend team |
| **Status** | NOT IMPLEMENTED — zero files in module |
| **Entrypoints** | None |
| **Frontend** | All profile pages use stubs |
| **Database** | Schema defines `profiles`, `profiles_photos`, `profiles_education`, `profiles_profession`, `profiles_family`, `profiles_horoscope`, `profiles_partner_preferences` |

---

## Mandapam Module

| Attribute | Value |
|---|---|
| **Purpose** | Marriage hall listing, availability, packages, bookings |
| **Owner** | Backend team |
| **Status** | NOT IMPLEMENTED — zero files in module |
| **Entrypoints** | None |
| **Frontend** | All mandapam pages use stubs |
| **Database** | Schema defines `mandapams`, `mandapam_packages`, `mandapam_bookings`, `mandapam_events`, `mandapam_photos`, `mandapam_amenities`, `mandapam_availability` |

---

## Admin Module

| Attribute | Value |
|---|---|
| **Purpose** | Dashboard, analytics, profile verification, user management, membership management, system settings |
| **Owner** | Backend team |
| **Status** | NOT IMPLEMENTED — zero files in module |
| **Entrypoints** | None. `requireRole('ADMIN')` guard defined but never imported |
| **Frontend** | All admin pages use `stubFetch*` functions from `utils/stubs.ts` |
| **Database** | Schema defines indices/constraints but no admin-specific tables |

---

## Notification / Email Module

| Attribute | Value |
|---|---|
| **Purpose** | Email delivery via BullMQ queue, template rendering |
| **Owner** | Backend team |
| **Status** | EXECUTED but UNUSED in execution paths |
| **Entrypoints** | `enqueueOtpEmail()`, `enqueueWelcomeEmail()` — defined but NEVER CALLED |
| **Dependencies** | Redis, BullMQ, Handlebars templates |
| **Files** | `email.queue.ts`, `email.worker.ts`, `email.renderer.ts`, `email.templates/`, `email.types.ts` |
| **Bugs** | BUG-CRIT-001, BUG-CRIT-004, BUG-HIGH-004 |

---

## Worker Module

| Attribute | Value |
|---|---|
| **Purpose** | Email delivery, OTP expiry, session expiry, audit logging, data purging |
| **Owner** | Backend team |
| **Status** | EXECUTED |
| **Entrypoints** | BullMQ workers instantiated in `index.ts` |
| **Files** | `email.worker.ts`, `otp.worker.ts`, `audit.worker.ts`, `background.worker.ts`, `index.ts` |

## Background Jobs

| Job | Schedule | Action |
|---|---|---|
| expireOtp | Every 1h | DELETE verifications WHERE expiresAt < NOW() AND usedAt = null |
| expireSession | Every 1h | UPDATE sessions SET revokedAt = NOW() WHERE expiresAt < NOW() AND revokedAt = null |
| purgeAnon (DISABLED) | Every 24h | DELETE accounts WHERE role = ANON and older than 7 days |
| archiveOld | Every 24h | Archive accounts older than 365 days |

---

## Maaligai Module

| Attribute | Value |
|---|---|
| **Purpose** | Static content pages (landing, about, facilities, gallery, contact, packages, hall availability) |
| **Owner** | Frontend team |
| **Status** | EXECUTED (static/frontend only, no backend dependency) |
| **Entrypoints** | Route group at `/maaligai/*` |
| **Files** | `frontend/src/pages/maaligai/`, `frontend/src/layout/maaligai/` |
