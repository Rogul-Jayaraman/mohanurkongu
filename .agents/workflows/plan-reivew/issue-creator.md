# Production Recovery Team + Staff Engineer + Release Governance Council

## INPUT

A → Original Workflow  
B → Current Production Architecture  
C → Review Findings  
D → Generated Architecture  

Your job is NOT redesign.

Your job is:

- Convert approved review findings into executable work
- Preserve validated workflows
- Preserve production contracts
- Preserve rollout safety
- Preserve rollback capability
- Preserve operational continuity

Only implement validated changes.

Reject speculative improvements.

---

# PRIMARY OBJECTIVE

Transform architecture review output into:

- Safe implementation backlog
- Incremental rollout plan
- Production migration plan
- Recovery procedures
- Release readiness plan

WITHOUT changing:

- Existing workflow
- Existing business logic
- Existing contracts
- Existing ownership rules
- Existing upload lifecycle
- Existing frontend behavior
- Existing operational model

If a proposed implementation alters validated behavior:

STOP.

Generate:

# CHANGE REJECTION REPORT

Do not continue.

---

# PHASE 0 — IMPLEMENTATION DISCOVERY

Before creating fixes:

Extract:

## Existing Runtime

- Current request flow
- Service interaction
- Upload lifecycle
- Cleanup lifecycle
- Deployment path
- Runtime dependencies

---

## Existing Contracts

Extract:

- API contracts
- Event contracts
- Storage contracts
- Frontend contracts
- Worker contracts

---

## Existing Operations

Extract:

- Deployment flow
- Monitoring
- Logging
- Alerting
- Recovery
- Rollback

---

Generate:

### Runtime Dependency Graph

### Current Execution Flow

### Ownership Map

### Release Dependency Map

### Critical Runtime Paths

DO NOT MODIFY.

---

# PHASE 0.5 — CHANGE SAFETY ANALYSIS (MANDATORY)

For EACH identified issue determine:

## Root Cause

Evidence:

- Logs
- Metrics
- Workflow
- Runtime path

---

## Existing Behavior

Document current production behavior.

---

## Target Behavior

Document intended fixed behavior.

Must preserve:

- User experience
- Existing contracts
- Existing ownership

---

## Affected Workflow

Map:

- Entry
- Processing
- Exit

---

## User Impact

Measure:

- Latency
- Errors
- UX changes
- Availability

---

## Compatibility

Classify:

- Fully Backward Compatible
- Requires Migration
- Breaking
- Unsafe

---

## Safety Decision

- APPROVED
- APPROVED WITH FLAG
- BLOCKED

---

# PHASE 1 — ISSUE EXTRACTION

Generate issues ONLY if:

✓ Validated  
✓ Reproducible  
✓ Observable  
✓ Migration-safe  
✓ Rollback-safe  

Reject:

- Opinion
- Preference
- Premature optimization
- Style changes
- Framework churn
- Unsupported assumptions

For EACH approved issue:

Generate:

## Issue ID

## Evidence

## Reproduction Steps

## Failure Domain

## Trigger Conditions

## Blast Radius

## Existing Mitigation

## Final Decision

---

Generate:

# APPROVED ISSUE REGISTER

---

Generate:

# REJECTED ISSUE REGISTER

Include:

Reason:

- Not validated
- Not reproducible
- High migration risk
- Workflow conflict
- Operational risk

---

# PHASE 2 — IMPLEMENTATION SAFETY

For EACH approved solution analyze:

## Breaking Changes

- Yes / No

---

## Affected APIs

List:

- Endpoint
- Request
- Response

---

## Affected Schema

List:

- Tables
- Columns
- Indexes
- Constraints

---

## Affected Components

- Frontend
- Backend
- Upload
- Storage
- Worker
- Infrastructure

---

## Runtime Impact

Estimate:

- CPU
- RAM
- IO
- Network
- DB

---

## Rollback Plan

Define:

- Trigger
- Steps
- Recovery time

---

## Feature Flag Need

Classify:

- Required
- Recommended
- Not Needed

---

## Migration Strategy

Choose:

- Expand → Migrate → Contract
- Dual Write
- Shadow Read
- Parallel Run
- No Migration

---

## Monitoring Needed

Define:

Metrics:

- Errors
- Throughput
- Latency
- Queue
- Cache
- DB
- Uploads

---

## Deployment Strategy

Choose:

- Canary
- Rolling
- Blue/Green
- One-shot

---

# PHASE 3 — EXECUTION PLAN

Generate executable backlog.

For EACH item:

## Issue

## Fix

## Implementation Steps

## Dependencies

## Validation Steps

## Success Metrics

## Rollback

---

Generate:

# IMPLEMENTATION BACKLOG

Columns:

| Priority | Issue | Work | Owner | Estimate | Risk |

Rules:

P0 → Production Risk  
P1 → Stability  
P2 → Performance  
P3 → Cleanup  

---

Generate:

# EXECUTION ORDER

Rules:

No dependent task starts early.

---

Generate:

# RELEASE CHECKLIST

Before deploy verify:

- Contracts pass
- Migration tested
- Rollback tested
- Monitoring ready
- Alerting enabled
- Capacity validated
- Feature flags ready
- Backups available

---

# PHASE 4 — CHANGE IMPACT

Generate matrix:

| Change | Direct Impact | Indirect Impact | Risk | Severity | Owner | Release Window |

Analyze:

- Frontend
- Backend
- Uploads
- Storage
- Auth
- Jobs
- Cache
- Search
- Cleanup
- Monitoring
- Analytics
- Admin

Generate:

## Operational Risk Register

Include:

- Detection
- Mitigation
- Escalation

---

Generate:

## Production Verification Plan

After release verify:

### Functional

- Workflow success
- Upload success
- Editing success

### Technical

- CPU
- RAM
- DB
- Errors

### Business

- Conversion
- Latency
- Availability

---

# PHASE 5 — RELEASE GOVERNANCE

Answer:

Does implementation preserve:

- Workflow
- Business intent
- Ownership
- Contracts
- Upload lifecycle
- Security
- Rollback
- Operability
- Observability
- Cost control

If ANY answer = NO

STOP.

Generate:

# RELEASE BLOCKER REPORT

Do not approve.

---

# FINAL OUTPUT

## Executive Summary

---

## Approved Issues

Only executable items.

---

## Rejected Issues

With evidence.

---

## Implementation Backlog

Ordered execution.

---

## Migration Plan

Step-by-step.

---

## Rollback Plan

Recovery procedure.

---

## Monitoring Plan

Dashboards + alerts.

---

## Release Readiness

Score:
X / 100

---

## Final Approval

Decision:

- READY FOR IMPLEMENTATION
- READY WITH CONDITIONS
- BLOCKED

Approval requires:

✓ Zero silent frontend breakage  
✓ Backward compatibility maintained  
✓ Upload lifecycle preserved  
✓ Rollback validated  
✓ Monitoring ready  
✓ Migration reversible  
✓ Production operability preserved  
✓ No hidden infrastructure cost  

If any fail:

FINAL RESULT = BLOCKED