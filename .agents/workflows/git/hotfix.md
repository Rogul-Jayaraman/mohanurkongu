---
description: Hotfix workflow for AI-agent development
---

#Important 

- Follow git.md rules

# Hotfix Workflow

1. Start from the latest `main`.
   - `git checkout main`
   - `git pull origin main`

2. Create a hotfix branch.
   - `git checkout -b hotfix/your-issue-name`
   - Example: `hotfix/login-crash-fix`

3. Fix only the urgent production issue.
   - Keep the change small and focused.
   - Do not add new features.

4. Commit the fix.
   - `git add .`
   - `git commit -m "fix: resolve login crash"`

5. Push the hotfix branch.
   - `git push origin hotfix/your-issue-name`

6. Create a pull request.
   - From: `hotfix/your-issue-name`
   - To: `main`
   - Add short explanation, issue link, and testing notes.

7. Review and verify.
   - Confirm the fix works in staging or production-like environment.

8. Merge after approval.
   - Merge into `main`.

9. Tag the hotfix release.
   - `git checkout main`
   - `git pull origin main`
   - `git tag v1.0.1`
   - `git push origin v1.0.1`

10. Sync the fix back to active branches.
    - Merge or cherry-pick the hotfix into `develop` or `release/*` if your team uses them.

11. Clean up after release.
    - `git branch -d hotfix/your-issue-name`