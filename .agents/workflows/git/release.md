---
description: Release workflow for AI-agent development
---

#Important 

- Follow git.md rules

# Release Workflow

1. Create a release branch from the latest `main`.
   - `git checkout main`
   - `git pull origin main`
   - `git checkout -b release/v1.0.0`

2. Stabilize the release.
   - Fix only bugs, version updates, and release notes.
   - Do not add new features.

3. Commit release changes.
   - `git add .`
   - `git commit -m "chore: prepare release v1.0.0"`

4. Keep the release branch updated if needed.
   - `git checkout main`
   - `git pull origin main`
   - `git checkout release/v1.0.0`
   - `git merge main`

5. Test the release.
   - Run full testing.
   - Check UI, API, and regression cases.

6. Open a pull request.
   - From: `release/v1.0.0`
   - To: `main`
   - Add release notes, screenshots, and testing results.

7. Review and fix issues.
   - Apply fixes on the same release branch.

8. Merge after approval.
   - Merge into `main`.

9. Tag the release.
   - `git checkout main`
   - `git pull origin main`
   - `git tag v1.0.0`
   - `git push origin v1.0.0`

10. Clean up after release.
    - `git branch -d release/v1.0.0`