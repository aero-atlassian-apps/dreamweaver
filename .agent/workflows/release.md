---
description: Create a release branch, bump version, and prepare for deployment
---

# Release Workflow

Run this workflow when preparing a new release version.

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

3. **Create Release Branch**
   - Use semantic versioning: `release/vX.Y.Z`
   
```bash
git checkout -b release/v<VERSION>
```

4. **Update Version Number**
   - Update `package.json` version field
   - Update any version references in code

5. **Update CHANGELOG.md**
   - Add release date
   - Organize changes by category (Added, Changed, Fixed, Removed)
   - Reference issue/PR numbers

// turbo
6. **Run Full Quality Gates**
```bash
npm run lint && npm run typecheck && npm run test
```

7. **Commit Version Bump**
```bash
git add -A && git commit -m "chore(release): bump version to v<VERSION>"
```

8. **Create Tag**
```bash
git tag -a v<VERSION> -m "Release v<VERSION>"
```

// turbo
9. **Push Release Branch and Tags**
```bash
git push origin release/v<VERSION> && git push origin --tags
```

## Post-Release

- Create PR from release branch to main
- After merge, create PR from main to develop (if using GitFlow)
- Announce release in appropriate channels

## Semantic Versioning Guide

- **MAJOR** (X.0.0): Breaking changes
- **MINOR** (0.X.0): New features, backwards compatible
- **PATCH** (0.0.X): Bug fixes, backwards compatible
