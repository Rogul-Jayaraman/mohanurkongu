---
trigger: model_decision
description: Github rules to be followed for Branching strategy and release workflow for AI-agent development
---

# Branching Strategy

## Strictly Follow
- Only need to create the pr 
- Dont merge automatically 
- Merging will be done by user
 

## Branch types
- `main` = stable production branch.
- `feature/*` = new feature work.
- `release/*` = stabilization branch before a release.
- `hotfix/*` = urgent production fixes.

## Rules
- One feature = one branch.
- Never work directly on `main`.
- Keep feature branches small and focused.
- Commit often with clear messages.
- Merge through PR only.
- Keep `main` always deployable.
- Use `release/*` only for bug fixes, testing, and version finalization.
- Use `hotfix/*` only for production emergencies.
