# Incident History

**Note:** This is a pre-production system. No production incidents have occurred.

The following are **known design flaws** that would become incidents in production. Each is documented with a hypothetical incident timeline and resolution based on the current codebase analysis.

---

## INC-001: OTP Not Delivered (Hypothetical)

| Field | Value |
|---|---|
| **Status** | Open (pre-production) |
| **Severity** | Critical |
| **Bug Reference** | BUG-CRIT-001 |

**Hypothetical Timeline:**
- Users attempt registration → receive success message for OTP send → never receive email
- Password reset also broken
- Blocking all new user acquisition and password recovery

**Root Cause:** `enqueueOtpEmail()` defined but never called from auth service.

**Resolution:** Wire `enqueueOtpEmail()` into `sendRegistrationOtp()` and `sendPasswordResetOtp()`.

**Prevention:** Code review should verify that queue enqueue calls match their downstream consumers. Automated integration test should verify email queue has a job after OTP send.

---

## INC-002: Verification Token = Access Token (Hypothetical)

| Field | Value |
|---|---|
| **Status** | Open (pre-production) |
| **Severity** | Critical |
| **Bug Reference** | BUG-CRIT-003 |

**Hypothetical Timeline:**
- User completes email verification, receives JWT
- JWT signed with `JWT_ACCESS_SECRET`
- User passes token to `GET /auth/me` → succeeds (because `requireAuth` uses `JWT_ACCESS_SECRET`)
- Full account data exposed using verification token

**Root Cause:** `signAccessToken()` reused for verification tokens.

**Resolution:** Add `JWT_VERIFICATION_SECRET` and `signVerificationToken()` function.

**Prevention:** JWT secrets must be unique per purpose. Add TypeScript type guards preventing cross-use of token types.

---

## INC-003: Email Mismatch Signup (Hypothetical)

| Field | Value |
|---|---|
| **Status** | Open (pre-production) |
| **Severity** | Critical |
| **Bug Reference** | BUG-CRIT-002 |

**Hypothetical Timeline:**
- Attacker verifies OTP for email `attacker@gmail.com`
- Signs up with `victim@example.com`
- Account created under victim's email, verified status applied
- Victim cannot register (email taken), attacker controls the account

**Root Cause:** No email-match check between signup DTO and verified OTP target.

**Resolution:** Compare `dto.email` against decoded `verification.target` before creating account.

**Prevention:** Unit test must verify that signup with different email than verified one is rejected.
