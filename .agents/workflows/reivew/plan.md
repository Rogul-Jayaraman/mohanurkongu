# MASTER AI GOVERNANCE WORKFLOW
## Architecture → Review → Trace → Validate → Recover → Implement → Release

Version: FINAL

---

# PURPOSE

Convert:

Generated Plan

↓

Architecture Review

↓

Forensic Validation

↓

Breakage Detection

↓

Runtime Verification

↓

Implementation

↓

Recovery

↓

Release

↓

Production Approval

Into ONE orchestrated workflow.

Goal:

Maximum correctness.

Minimum redesign.

Zero silent breakage.

Expert analysis.

Junior-friendly output.

---

# INPUTS

A → Existing Production System

B → Existing Workflow

C → Existing Contracts

D → Existing Architecture

E → Generated Plan

Optional:

F → Runtime Evidence

G → Logs

H → Monitoring

I → Existing Issues

J → DevOps

K → Constraints

L → User Parameters

---

# GLOBAL RULES

Never redesign.

Preserve:

workflow

contracts

uploads

ownership

rollback

deployment

security

monitoring

---

# STAGE 0 — SYSTEM INGESTION

Build:

Architecture Inventory

Contract Inventory

Workflow Registry

Runtime Registry

Infra Registry

State Registry

Ownership Registry

Generate:

System Snapshot

Dependency Graph

Current Diagrams

Gate:

Coverage ≥ 95%

Output:

BASELINE

---

# STAGE 1 — PLAN NORMALIZATION

Extract:

Changes

Assumptions

Unknowns

Dependencies

Generate:

Change Register

Unknown Register

Decision Inventory

Gate:

Unknown ≤ 15%

Output:

NORMALIZED PLAN

---

# STAGE 2 — MULTI ROLE ANALYSIS

Autonomously select required roles.

Possible Roles:

Architecture

Principal Engineering

Frontend

Backend

Database

Upload

Security

DevOps

Platform

SRE

QA

Recovery

Performance

Observability

Product

Workflow

Storage

Migration

ADR

Visualization

Documentation

Support

Junior DX

Generate:

Role Matrix

Role Outputs

Consensus

Gate:

Consensus ≥ 90%

Output:

ANALYSIS PACKAGE

---

# STAGE 3 — ARCHITECTURE GOVERNANCE

Review:

workflow

API

DB

frontend

uploads

storage

security

DevOps

monitoring

Generate:

Alignment Report

Compatibility Report

Blast Radius

Architecture Score

Gate:

Workflow ≥ 95

Output:

ARCHITECTURE REPORT

---

# STAGE 4 — FORENSIC REVIEW

Attempt to break proposal.

Search:

loops

races

cleanup bugs

ownership bugs

migration bugs

hidden coupling

Generate:

Root Cause Report

Failure Trees

Loophole Register

Confidence

Gate:

Confidence ≥ 85

Output:

FORENSIC REPORT

---

# STAGE 5 — EDGE CASE DETECTION

Detect:

all possible edge cases

Analyze:

unhandled inputs

state transitions

timeouts

retry boundaries

cleanup paths

permission gaps

Generate:

Edge Case Register

Gate:

Edge cases identified

Output:

EDGE CASE REPORT

---

# STAGE 6 — BREAKAGE DETECTION

Analyze:

Security

Performance

Load

DB Lookups

Scalability

Adaptability

Rate Limits

Cost

Recovery

DevEx

Detect:

silent breakage

future breakage

Output:

Breakage Register

Gate:

No P0

---

# STAGE 7 — CONTRACT VALIDATION

Validate:

DB

API

Frontend

Storage

Events

Jobs

Generate:

Contract Report

Gate:

Breakage = 0

Output:

COMPATIBILITY REPORT

---

# STAGE 8 — ERROR GOVERNANCE

Detect:

all failures

all user errors

admin errors

Generate:

English messages

Tamil messages

Recovery

Retry

Display rules

Output:

ERROR PACKAGE

Gate:

Coverage ≥ 95%

---

# STAGE 9 — RUNTIME SIMULATION

Simulate:

1

10

100

1000

peak

rollback

cleanup

migration

Generate:

Runtime Report

Load Report

Recovery Report

Gate:

Runtime ≥ 90

---

# STAGE 10 — IMPLEMENTATION GOVERNANCE

Generate:

Execution DAG

Migration

Rollback

Feature Flags

Monitoring

Release

Generate:

Implementation Blueprint

Gate:

Rollback exists

---

# STAGE 11 — DEVOPS GOVERNANCE

Validate:

Deploy

Capacity

Monitoring

Recovery

Secrets

Alerts

Generate:

Operations Package

Gate:

Ops ≥ 90

---

# STAGE 12 — VISUAL ARCHITECTURE (MANDATORY)

For EVERY issue generate:

High Level Diagram

Low Level Diagram

Component Diagram

Sequence Diagram

Request Diagram

State Diagram

Failure Diagram

Recovery Diagram

Upload Diagram

Storage Diagram

Deployment Diagram

Monitoring Diagram

Execution Diagram

Migration Diagram

Release Diagram

ASCII only.

Gate:

100% visualized

---

# STAGE 13 — JUNIOR DELIVERY MODE

Convert expert analysis.

Generate:

Explain Like Onboarding

File Map

Request Journey

Data Journey

Failure Journey

Deployment Journey

Do Not Touch

Implementation Notes

Gate:

Junior can implement safely

---

# STAGE 14 — RELEASE GOVERNANCE

Generate:

Release Plan

Rollback

Runbook

Checklist

Capacity

Alerts

Approval Conditions

Gate:

Release ≥ 90

---

# STAGE 15 — FINAL CONSENSUS

Combine:

ALL REPORTS

Generate:

Decision Matrix

Conflict Register

Confidence Matrix

Scores:

Architecture

Workflow

Security

Performance

DB

Load

Scalability

Recovery

Ops

DevEx

Weighted Score

---
# MASTER CHAT ORCHESTRATION WORKFLOW
## Architecture → Review → Trace → Validate → Recover → Implement → Release

Version: FINAL

Goal:

Execute ALL stages sequentially INSIDE CHAT.

Do NOT store files.

Do NOT create folders.

Do NOT require manual context transfer.

Maintain context automatically across stages.

Think deeply.

Explain clearly.

Deliver junior-friendly output.

---

# INPUT

Project Inputs:

<<PROJECT>>

Generated Plan:

<<PLAN>>

Optional:

<<ARCHITECTURE>>

<<LOGS>>

<<MONITORING>>

<<ISSUES>>

<<CONSTRAINTS>>

<<PARAMETERS>>

---

# EXECUTION MODE

Run stages automatically.

Each stage:

Consumes previous stage outputs.

Produces context.

Context remains in conversation.

Do NOT repeat discovery.

Do NOT discard findings.

Do NOT reset understanding.

---

# CONTEXT MEMORY RULE

Maintain these internally.

Never ask user to resend.

Context Objects:

PROJECT_CONTEXT

REVIEW_CONTEXT

FORENSIC_CONTEXT

BREAKAGE_CONTEXT

CONTRACT_CONTEXT

ERROR_CONTEXT

IMPLEMENTATION_CONTEXT

OPS_CONTEXT

VISUAL_CONTEXT

FINAL_CONTEXT

Rules:

Reuse evidence.

Reuse diagrams.

Reuse assumptions.

Analyze deltas only.

If contradiction:

return to previous stage.

---


# OUTPUT ORDER

1 Executive Summary

2 Project Understanding

3 Pipeline Review

4 Architecture Review

5 Forensic Findings

6 Breakage Register

7 Contract Report

8 Error Catalog

9 Runtime Report

10 Implementation Blueprint

11 DevOps Report

12 Architecture Diagrams

13 Role Matrix

14 Junior Guide

15 Migration Plan

16 Rollback Plan

17 Release Plan

18 Checklist

19 Confidence Matrix

20 Final Decision

21 Production Score

22 ADR

---


# HARD BLOCKERS

Workflow break

Contract break

Rollback missing

Silent failure

Security regression

Deployment regression

Monitoring missing

Upload lifecycle break

Ownership break

If detected:

STOP

Show blocker

Do not continue.

---

Rule:

Understand first.

Visualize second.

Review third.

Break fourth.

Validate fifth.

Implement sixth.

Release last.


# APPROVAL RULE

95+

GO

90–94

GO WITH CONDITIONS

<90

NO GO

Any:

workflow break

contract break

upload break

rollback missing

silent failure

security regression

ops regression

=

NO GO

---

Rule:

Think like Principal Engineers.

Deliver like Senior Engineers.

Explain like Tech Leads.

Implementable by Junior Developers.