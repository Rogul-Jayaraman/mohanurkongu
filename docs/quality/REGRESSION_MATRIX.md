# Regression Matrix

## Auth Module Test Matrix

| Test Case | Endpoint | BUG | Expected Fix Impact |
|---|---|---|---|
| Registration with valid email | send-otp | BUG-CRIT-001 | OTP should be queued + delivered |
| Registration with email mismatch | signup | BUG-CRIT-002 | Should reject mismatched email |
| Use verification token as access token | verify-otp + /me | BUG-CRIT-003 | Should be rejected (different secret) |
| Registration welcome sent | signup | BUG-CRIT-004 | Welcome email queued |
| Concurrent refresh (2 parallel) | refresh | BUG-HIGH-001 | Only 1 should succeed |
| Password change stale session | change-password | BUG-HIGH-002 | Old sessions should fail after change |
| Brute force refresh | refresh | BUG-HIGH-003 | Rate limited after N requests |
| Brute force logout | logout | BUG-HIGH-003 | Rate limited after N requests |
| Email link click | send-otp → email | BUG-HIGH-004 | Link should navigate to correct page |
| Admin login without portal param | login | BUG-MED-004 | Should default to USER, reject admin |
| Admin login response fields | login | BUG-ADMIN-001 | Should include name, email, phone, etc. |
| Admin route access | admin/* | BUG-ADMIN-003 | requireRole should block non-ADMIN |
| Refresh cookie on public /auth/* | refresh | BUG-MED-001 | Cookie should not be sent |

## Modules Requiring Full Regression (When Implemented)

| Module | Tests Needed |
|---|---|
| Profile CRUD | Create, read, update, delete, ownership, validation |
| Profile photo upload | Format, size, count, ownership |
| Browse/search | Filters, pagination, permission (plan-based) |
| Shortlist | Add, remove, list, max count |
| Interest | Send, accept, reject, withdraw |
| Mandapam CRUD | Create, read, update, delete |
| Mandapam availability | Calendar, date range, slot management |
| Mandapam booking | Create, confirm, cancel, payment, conflict |
| Admin verification | Approve, reject, re-verify |
| Admin users | List, suspend, delete, role change |
| Admin analytics | Stats accuracy, date range, permissions |
