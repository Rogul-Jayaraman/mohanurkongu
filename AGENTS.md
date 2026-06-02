<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **mohanurkongu** (6211 symbols, 10720 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Phase 6 — Frontend API Query/Mutation Migration

### Session (May 31 – Jun 1)
Migrated all remaining frontend components from ad-hoc API calls to dedicated query/mutation hooks:

| Component | Hook(s) |
|-----------|---------|
| `Shortlist.tsx` | `useShortlistedQuery` |
| `MyAccount.tsx` | `useBillingOverviewQuery` |
| `ChangePasswordForm.tsx` | `useChangePasswordMutation` |
| `AdminMembershipCard.tsx` | `useAdminUpdatePlanMutation` |
| `EditPlanModal.tsx` | `useAdminUpdatePlanMutation` |
| `AssignPlanModal.tsx` | `useAdminAssignSubscriptionMutation` |
| `UserManagement.tsx` | `useAdminAccountsQuery` + 3 mutations |
| `AdminLoginForm.tsx` | `useAdminLoginMutation` |
| `VerificationQueuePreview.tsx` | `useVerificationQueueQuery` + 2 mutations |
| `AuditPanel.tsx` | `useAuditTrailQuery` |
| `ProfileView.tsx` (admin) | `useAdminProfileDetailQuery` + 5 mutations |
| `Dashboard.tsx` | `useQuery(stats)` + `useVerificationQueueQuery` |
| `MatrimonialProfiles.tsx` | `useShowcaseQuery` |
| `UserProfileCard.tsx` | `useToggleShortlistMutation` |
| `SectionEditModal.tsx` | `useAdminUpdateProfileMutation` |
| `ProfileManagement.tsx` | Cleaned up unused import |

Created `useAdminMembershipMutations.ts`, added `sendPasswordResetOtp`/`verifyPasswordResetOtp` to `useAuthMutations.ts`, added `useAdminLoginMutation`. Fixed double-toast issues in `useToggleShortlistMutation` and `useAdminUpdateProfileMutation`.

### Session (Jun 2) — Mandapam Cache Pipeline Wiring

Implemented cache pipeline for the mandapam (hall booking) module:

- Extended `MandapamPipelineContext` with cache fields (`cacheManager`, `cacheEnabled`, `cacheResolved`, `cacheReadResult`, `cacheInvalidations`)
- Created cache step functions: `mandapamCacheRead`, `mandapamCacheWrite`, `mandapamFlushCacheInvalidations`, `addCacheInvalidationTag`
- Created `mandapam-cache-tags.ts` with tag builders and TTL constants for all mandapam entities (calendar, booking, catalog, packages)
- Wired cache invalidation into 5 step-based pipelines (booking-create, status, settlement, addon, financial-transaction)
- Added inline caching to direct-query pipelines: calendar-view (3 fns), booking-get, booking-list, catalog-entity, calendar-block, package-update
- Added `CacheManager` to `MandapamController` constructor and passed to all pipeline functions
- Public endpoints (packages, facilities, addons, calendar) now cache responses with language-aware keys
- Catalog entity CRUD steps cache LIST/PUBLIC_LIST reads and invalidate on CREATE/UPDATE/DELETE

Key design decisions:
- Cache is optional — pipelines work without it (graceful degradation)
- All cache failures are non-critical (logged, swallowed)
- Step-based pipelines use invalidation tags + flush in post-steps
- Direct-query pipelines use inline read/write pattern
- TTLs: 60s (booking list) to 1800s (catalog, public packages)

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/mohanurkongu/context` | Codebase overview, check index freshness |
| `gitnexus://repo/mohanurkongu/clusters` | All functional areas |
| `gitnexus://repo/mohanurkongu/processes` | All execution flows |
| `gitnexus://repo/mohanurkongu/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->