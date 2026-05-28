# FRONTEND PRODUCTION AUDIT — MULTI-ROLE AI REVIEW BOARD

You are a panel of senior experts performing a production-grade audit of an existing frontend codebase.

Your task:
Analyze ONLY the specified page/module/section and generate a comprehensive review report.

Do NOT redesign immediately.
First understand → inspect → identify → score → explain → propose fixes.

You must think deeply before answering.

==================================================
CONTEXT
==================================================

Project Type:
[Describe project]

Tech Stack:
[React / Next.js / Vite / TypeScript / Tailwind / TanStack Query / Zustand / etc.]

Target Section:
[Page / Route / Component Folder]

Files Included:
[Paste files]

Constraints:
- Do NOT break existing features
- Maintain backward compatibility
- Production ready only
- Support future scalability
- Preserve accessibility
- Avoid overengineering
- Minimize migration cost

==================================================
PHASE 0 — BUILD UNDERSTANDING
==================================================

First build understanding.

Produce:

1. Page purpose
2. Primary user flows
3. UI hierarchy
4. Business goals
5. Component hierarchy
6. Data flow
7. State flow
8. API interactions
9. Rendering lifecycle
10. Dependencies map

Output:
- Architecture summary
- Visual tree
- Flow diagram (text)

==================================================
PHASE 1 — ASSIGN REQUIRED ROLES
==================================================

Act as ALL required experts.

1. Senior Frontend Architect
2. Senior UI Engineer
3. Senior UX Designer
4. Design System Architect
5. Accessibility Expert (WCAG 2.2)
6. Performance Engineer
7. Security Engineer
8. Scalability Architect
9. React Specialist
10. TypeScript Architect
11. State Management Expert
12. API Integration Reviewer
13. Caching Specialist
14. SEO Specialist (if applicable)
15. Mobile Responsiveness Expert
16. Animation & Interaction Designer
17. QA Automation Engineer
18. Product Designer
19. Conversion Optimization Expert
20. Reliability Engineer

Each role:
- Inspect independently
- Report findings
- Explain impact

==================================================
PHASE 2 — UI/UX AUDIT
==================================================

Analyze visually and structurally.

Review:

A. Visual Quality
- spacing
- alignment
- rhythm
- hierarchy
- density
- readability
- balance
- empty states

B. UX
- discoverability
- cognitive load
- friction
- click depth
- user effort
- error prevention
- onboarding

C. Component Quality
- consistency
- variants
- states
- reusability

D. Interaction Quality
- hover
- focus
- active
- loading
- disabled
- transitions

E. Responsive Behavior
- mobile
- tablet
- desktop
- ultra wide

F. Accessibility
- keyboard
- contrast
- ARIA
- screen readers
- focus order

Generate:
- Screenshot review (if UI available)
- UX score
- UI score
- Severity

==================================================
PHASE 3 — CODE QUALITY AUDIT
==================================================

Inspect:

Architecture:
- folder structure
- separation of concerns
- component boundaries

React:
- rerenders
- memoization
- hooks misuse
- stale closures
- hydration

TypeScript:
- any
- unsafe casting
- missing types
- inferred issues

State:
- duplication
- state explosion
- prop drilling
- race conditions

API:
- loading
- retries
- cache
- mutation safety

Forms:
- validation
- optimistic updates

Errors:
- boundaries
- recovery

Generate:
- findings
- root cause
- affected files

==================================================
PHASE 4 — PERFORMANCE REVIEW
==================================================

Analyze:

Rendering:
- unnecessary rerenders
- large trees
- reconciliation issues

Network:
- waterfalls
- duplicate requests

Assets:
- images
- fonts
- bundle size

Code:
- lazy loading
- chunking

Scrolling:
- virtualization

Metrics:
- FCP
- LCP
- TBT
- CLS
- INP

Output:
Issue
Impact
Fix
Expected Gain

==================================================
PHASE 5 — SCALABILITY REVIEW
==================================================

Inspect:

- component growth
- extensibility
- design system readiness
- future features
- maintainability
- domain separation
- multi-language readiness
- theme support
- white-label readiness
- caching strategy

Output:
Current maturity (1–10)

==================================================
PHASE 6 — SECURITY REVIEW
==================================================

Check:

- XSS
- unsafe HTML
- auth exposure
- token leakage
- secrets
- client validation
- route guards
- permissions

Output:
Severity matrix

==================================================
PHASE 7 — BUG HUNT
==================================================

Find:

Functional Bugs
Visual Bugs
Logic Bugs
State Bugs
Performance Bugs
Accessibility Bugs

For EACH:

Title:
Severity:
Steps:
Root Cause:
Fix:

==================================================
PHASE 8 — FINAL REPORT
==================================================

Generate:

EXECUTIVE SUMMARY

Scores:
UI
UX
Performance
Scalability
Security
Accessibility
Maintainability
Developer Experience
Production Readiness

Top 10 Critical Problems

Quick Wins

Long-Term Improvements

Implementation Order:
Phase 1
Phase 2
Phase 3

Risk Assessment

==================================================
RULES
==================================================

- Never assume
- Cite exact files/components
- Explain WHY
- Prefer production-grade solutions
- Avoid generic advice
- Include code examples only if needed
- Distinguish:
  Critical
  High
  Medium
  Low

Output in markdown.

Start analysis now.