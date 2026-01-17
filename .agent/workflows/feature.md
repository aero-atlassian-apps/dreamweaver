---
description: Start a new feature branch from main with proper naming
---

# Feature Branch Workflow

Run this workflow when starting work on a new feature.

## Steps

// turbo
1. **Ensure Working Directory is Clean**
```bash
git status
```
   - If there are uncommitted changes, run `/commit` workflow first

// turbo
2. **Pull Latest Main**
```bash
git checkout main && git pull origin main
```

3. **Create Feature Branch**
   - Naming convention: `feature/<short-description>`
   - Use kebab-case for description
   
```bash
git checkout -b feature/<short-description>
```

// turbo
4. **Verify Branch Created**
```bash
git branch --show-current
```

## Feature Branch Naming Examples

- `feature/story-generation`
- `feature/user-authentication`
- `feature/sleep-detection`
- `feature/voice-cloning-integration`

## During Development

1. Commit frequently using `/commit` workflow
2. Keep commits atomic and focused
3. Run `/check` before every commit
4. Follow TDD with `/tdd` workflow for new features

## When Feature is Complete

1. Ensure all tests pass with `/check`
2. Push feature branch: `git push origin feature/<name>`
3. Create Pull Request to main
4. Request code review
5. After approval, merge and delete feature branch

## Notes

- Never commit directly to main
- Keep feature branches short-lived (< 1 week ideal)
- Rebase on main frequently to avoid merge conflicts
