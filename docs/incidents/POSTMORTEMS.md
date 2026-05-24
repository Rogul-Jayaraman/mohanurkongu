# Postmortems

## Pre-Production Postmortem: Auth Module Architecture Review

### Summary
The auth module was designed with correct architectural patterns (JWT + refresh rotation, Argon2id, device fingerprinting, BullMQ queues) but has critical implementation gaps in the execution path where services interact with downstream systems.

### What Went Wrong

1. **Missing function calls:** Queue enqueue functions were defined with proper interfaces but never integrated into service layer. The auth service `sendRegistrationOtp` method generates OTP, stores it, but never calls the email queue. This suggests the service layer and notification layer were built in parallel and never connected.

2. **Secret reuse:** `JWT_ACCESS_SECRET` was used for both access tokens and verification tokens. Likely caused by copy-paste from an existing `signAccessToken` call without creating a separate function for verification tokens.

3. **Missing validation:** Signup does not verify the email matches the verified OTP's target. The decoded token has the `target` field available but it's never compared against `dto.email`.

### Timeline

| Time | Event |
|---|---|
| Sprint 1 | Auth routes, controller, service, validation created |
| Sprint 1 | Email queue, worker, renderer created (separate workstream) |
| Sprint 2 | Integration — queue never connected to service |
| Sprint 2 | JWT utils created; signAccessToken overloaded for verification |
| Code Review | Integration gap missed (services reviewed in isolation) |
| Pre-Prod Audit | All 4 critical bugs discovered |

### Action Items

| Action | Owner | Status |
|---|---|---|
| Wire enqueueOtpEmail into auth service | Backend | Open |
| Wire enqueueWelcomeEmail into signup | Backend | Open |
| Add JWT_VERIFICATION_SECRET + signVerificationToken | Backend | Open |
| Add email-match check in signup | Backend | Open |
| Add integration test: OTP send → email queue has job | QA | Open |
| Add integration test: signup rejects email mismatch | QA | Open |
| Add integration test: verification token rejected by /auth/me | QA | Open |

### Lessons Learned

1. **Integration points must be verified at code review:** Function definitions in module A and callsites in module B should be reviewed together.
2. **Each token purpose needs its own secret:** JWT secrets must never be reused across different token types.
3. **Cross-field validation is easy to miss when fields are added at different times:** The `target` field in verification record was added before signup DTO's email — they were never connected.

### What We're Doing Differently

- Adding integration test requirement for every cross-module interaction
- Introducing JWT type-safety (separate functions per token purpose)
- Adding pre-commit hook that checks for unused queue enqueue functions
- Adding cross-field validation checklist to signup code review
