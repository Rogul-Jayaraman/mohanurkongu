# ADR-05: Why Feature-Based Architecture

## Context
Organizing frontend code: flat structure vs layered vs feature-based.

## Options Considered
| Option | Pros | Cons |
|---|---|---|
| **Feature-based** | Co-located concerns, clear ownership, scalable | Sometimes duplicates across features |
| Layered (controllers/services/repos) | Clear separation of concerns | Spreads feature code across many folders |
| Flat (all components in one folder) | Simple initially | Becomes unmanageable at scale |

## Decision
**Feature-based architecture** for frontend components. Each feature (auth, user, admin, mandapam, maaligai) has its own folder with co-located components. Shared UI primitives go in `components/ui/`.

```
components/features/
├── auth/        # Auth-specific components
├── user/        # User features (profile, browse, shortlist)
├── admin/       # Admin features (dashboard, bookings, verifications)
├── maaligai/    # Public mandapam info pages
└── landing/     # Landing page components
```

## Consequences
- ✅ Clear ownership — each feature is self-contained
- ✅ Easy to find code — feature components are near each other
- ✅ Easy to extract into separate packages if needed
- ❌ Some shared patterns may be duplicated across features
- ❌ Cross-feature refactoring requires updating multiple folders

## When to Revisit
- If cross-feature duplication becomes excessive → extract shared logic to `hooks/` or `lib/`
- If team grows → each team owns specific feature folders
