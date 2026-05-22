---
description: Git feature workflow for AI-agent development
---

#Important 

- Follow git.md rules

# Feature workflow

1. Start from latest `main`.
   - `git checkout main`
   - `git pull origin main`

2. Create a feature branch.
   - `git checkout -b feature/your-feature-name`

3. Work and commit often.
   - `git add .`
   - `git commit -m "feat: your message"`

4. Push and create PR.
   - `git push origin feature/your-feature-name`
   - PR target: `main`

5. After review, merge into `main`.