---
description: Create a release branch and tag after PR is merged to main
---

# Release Workflow

Run this workflow AFTER a PR has been merged to main to create a release snapshot.

## Prerequisites

- PR must be merged to main by the user
- All CI checks must have passed

## Steps

// turbo
1. **Fetch Latest and Checkout Main**
```bash
git fetch origin
git checkout main
git pull origin main
```

2. **Check if Release Branch Already Exists**
```bash
git branch -r | Select-String "release/v<VERSION>"
```
   - If exists, skip to "Tag the Release" step
   - If not, continue to create release branch

3. **Create Release Branch**
   - Use semantic versioning: `release/vX.Y.Z`
   
```bash
git checkout -b release/v<VERSION>
```

4. **Tag the Release**
```bash
git tag -a v<VERSION> -m "Release v<VERSION> - <Release Name>"
```

// turbo
5. **Push Release Branch and Tags**
```bash
git push origin release/v<VERSION>
git push origin --tags
```

6. **Return to Main for Next Development**
```bash
git checkout main
```

## Release Naming Convention

| Release | Version | Tag |
|---------|---------|-----|
| R1 Hello World | v0.1.0 | v0.1.0 |
| R2 Static Story | v0.2.0 | v0.2.0 |
| R3 Voice of Parent | v0.3.0 | v0.3.0 |
| ... | ... | ... |
| R10 Launch Ready | v1.0.0 | v1.0.0 |

## Semantic Versioning Guide

- **MAJOR** (X.0.0): Breaking changes or major milestones (e.g., v1.0.0 for launch)
- **MINOR** (0.X.0): New features/releases (R1, R2, R3, etc.)
- **PATCH** (0.0.X): Bug fixes after release

## Before Starting Next Release

Before starting work on the next release (e.g., R3):

1. Verify previous release branch exists (e.g., `release/v0.2.0`)
2. If not, create it from main
3. Then create new feature branch for next release
