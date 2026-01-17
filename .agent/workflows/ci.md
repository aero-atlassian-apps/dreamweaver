---
description: Full CI pipeline - run all checks before creating PR
---

# Full CI Pipeline Workflow

// turbo-all

Run this workflow after completing feature work to verify everything passes before creating a PR.

## Steps

1. **Run Linter**
```bash
npm run lint
```

2. **Run TypeScript Type Check**
```bash
npm run typecheck
```

3. **Run Unit Tests**
```bash
npm run test
```

4. **Run Build (Production Verification)**
```bash
npm run build
```

5. **Review Changes** (Manual Step)
   - Apply `code-review` skill checklist
   - Check for security issues
   - Verify performance implications
   - Ensure Clean Architecture compliance

6. **Stage All Changes**
```bash
git add -A
```

7. **Show What Will Be Committed**
```bash
git diff --cached --stat
```

8. **Commit with Conventional Message**
```bash
git commit -m "<type>(<scope>): <description>"
```

9. **Push Feature Branch**
```bash
git push origin <feature-branch-name>
```

10. **Create Pull Request** (Manual Step)
    - Go to GitHub repository
    - Create PR from feature branch to main
    - Add description of changes
    - **Wait for user review**

## Success Criteria

✅ Lint passes with no errors  
✅ TypeScript compiles with no errors  
✅ All tests pass  
✅ Build succeeds  
✅ Code review checklist completed  
✅ Feature branch pushed  
✅ PR created and waiting for review  

## IMPORTANT

⚠️ **DO NOT merge the PR yourself**
⚠️ **Wait for user to review and merge**
⚠️ **After user merges, run `/release` if creating a release**
