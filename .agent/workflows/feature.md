---
description: Start a new feature/release branch from main with proper naming
---

# Feature Branch Workflow

Run this workflow when starting work on a new feature or release.

## Steps

// turbo
1. **Fetch Latest from Origin**
```bash
git fetch origin
```

// turbo
2. **Checkout Main and Pull Latest**
```bash
git checkout main
git pull origin main
```

3. **Create Feature Branch**
   - Naming convention: `feature/<short-description>` or `feature/r<N>-<description>`
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

- `feature/r3-voice-tts`
- `feature/story-generation`
- `feature/user-authentication`
- `feature/sleep-detection`

## During Development

1. Commit frequently using `/commit` workflow
2. Keep commits atomic and focused
3. Run `/check` before every commit
4. Follow TDD with `/tdd` workflow for new features

## When Feature is Complete

1. Run `/ci` workflow to ensure all checks pass
2. Push feature branch: `git push origin feature/<name>`
3. **Create Pull Request to main** (via GitHub)
4. **WAIT for user review and approval**
5. **DO NOT merge yourself** - user will merge after review
6. After PR is merged, use `/release` workflow if needed

## IMPORTANT

⚠️ **Never merge feature branches directly to main**
⚠️ **Always create a Pull Request and wait for user review**
⚠️ **Only the user merges PRs after reviewing**
