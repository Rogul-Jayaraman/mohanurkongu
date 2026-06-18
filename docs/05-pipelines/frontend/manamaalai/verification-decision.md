# Pipeline 10: verification-decision (Frontend)

> **For beginners**: Frontend side of approve/reject actions. Admin
> reviews a profile and makes a decision. Handles success, error, and
> race conditions.

## Purpose

ADMIN action to approve or reject a profile from the verification queue detail view. Handles self-approval guard (admin cannot approve their own profile), double-process guard (already verified), and decision submission with optional comment.

## Actor & Entry

| Trigger | Source | Role | Validation |
|---|---|---|---|
| Click decision CTA in queue detail | Verification queue | ADMIN | Self-approval guard, double-process guard |

**Allowed Roles:** `ADMIN`

## High-Level Architecture

```
  ┌─ Queue detail → DecisionBar at bottom
  │  Contains: [Approve] [Reject] buttons
  ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │  DecisionBar.tsx                                                        │
  │                                                                         │
  │  STATE: decision, comment, submitting, confirmOpen                     │
  │                                                                         │
  │  ┌── handleDecision(type) ─────────────────────────────────┐           │
  │  │  S1. guardSelfApproval(type, profile, currentUser)       │           │
  │  │      ┌─ creatorMatch → toast('You cannot approve your   │           │
  │  │      │                  own profile') + return           │           │
  │  │      └─ pass → continue                                │           │
  │  │                                                          │           │
  │  │  S2. guardDoubleProcess(profile.status)                  │           │
  │  │      ┌─ already processed → toast('This profile has     │           │
  │  │      │   already been verified') + return               │           │
  │  │      └─ pass → continue                                │           │
  │  │                                                          │           │
  │  │  S3. openConfirmDialog(type) — show reason textarea     │           │
  │  └──────────────────────────────────────────────────────────┘           │
  │                                                                         │
  │  ┌── handleConfirm ─────────────────────────────────────────┐          │
  │  │  S4. submitDecision(profileId, { type, comment })         │          │
  │  │      → POST /verification/queue/:id/verify               │          │
  │  │  S5. onSuccess → refresh queue, close detail             │          │
  │  │  S6. onError   → decisionErrorMatrix                     │          │
  │  └────────────────────────────────────────────────────────────┘          │
  └──────────────────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture — Step by Step

---

### S1: guardSelfApproval

```
====================================================================================
S1: guardSelfApproval
────────────────────────────────────────────────────────────────────────────────────
Input: decision type, profile, currentUser

  if (type === 'APPROVE' && profile.createdById === currentUser.id) {
    toast.error('You cannot approve your own profile');
    return false;  // block further action
  }

  return true;

Output: boolean — blocks self-approval with error toast
```

---

### S2: guardDoubleProcess

```
====================================================================================
S2: guardDoubleProcess
────────────────────────────────────────────────────────────────────────────────────
Input: profile.status

  const PROCESSED_STATUSES = ['ACTIVE', 'REJECTED', 'ARCHIVED', 'DELETED'];

  if (PROCESSED_STATUSES.includes(profile.status)) {
    toast('This profile has already been processed');
    return false;
  }

  return true;

Output: boolean — blocks re-processing with info toast
```

---

### S3: openConfirmDialog

```
====================================================================================
S3: openConfirmDialog
────────────────────────────────────────────────────────────────────────────────────
Input: decision type

  Modal renders:
  - Title: "Approve / Reject Profile"
  - Comment textarea (optional, but suggested)
  - Decision summary (regNo, name)
  - [Cancel] [Confirm {type}] buttons

Output: Dialog visible, awaiting user confirmation
```

---

### S4: submitDecision API

```
====================================================================================
S4: submitDecision API
────────────────────────────────────────────────────────────────────────────────────
Input: profileId, { type, comment }

  setSubmitting(true);
  try {
    await submitVerificationDecision(profileId, { type, comment });
    // POST /verification/queue/:id/verify
    // Backend:
    //   type=APPROVE → status ACTIVE, stageQueue.resolve
    //   type=REJECT → status REJECTED, reason in verification_history
    //   type=SEND_BACK → status DRAFT, verification_history entry
    toast.success(
      type === 'APPROVE' ? 'Profile approved' :
      type === 'REJECT' ? 'Profile rejected' :
      'Profile sent back'
    );
    onDecisionSuccess();
  } catch (err) {
    handleDecisionError(err);
  } finally {
    setSubmitting(false);
  }

  ┌─ decisionError matrix ────────────────────────────────────────────────┐
  │  400 PROFILE_NOT_PENDING →                                           │
  │    toast('This profile is no longer pending verification')            │
  │    + close dialog + refresh                                           │
  │                                                                       │
  │  400 SELF_APPROVAL →                                                 │
  │    toast.error('You cannot approve your own profile')                 │
  │                                                                       │
  │  409 ALREADY_VERIFIED →                                              │
  │    toast('This profile has already been verified')                    │
  │    + close dialog + refresh (re-fetch shows updated status)          │
  │                                                                       │
  │  403 FORBIDDEN → toast('You do not have permission to verify')       │
  │                                                                       │
  │  404 NOT_FOUND → toast('Verification queue entry not found')         │
  │                                                                       │
  │  NETWORK_ERROR → toast(getErrorMessage(err))                         │
  └───────────────────────────────────────────────────────────────────────┘

Output: Decision processed, queue refreshed
```

## Dependencies

| File | Role |
|---|---|
| `components/features/admin/DecisionBar.tsx` | Decision action bar |
| `components/features/admin/DecisionConfirmDialog.tsx` | Confirmation with comment |
| `api/verification.api.ts` | submitVerificationDecision |
| `lib/errors.ts` | isAppError, getErrorMessage |
