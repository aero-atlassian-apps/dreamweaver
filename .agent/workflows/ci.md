---
description: Full CI pipeline - run all checks, review, and commit if everything passes
---

# Full CI Pipeline Workflow

// turbo-all

Run this complete workflow after making changes for a full CI-style verification.

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

6. **Update Documentation** (If Needed)
   - Add/update JSDoc comments
   - Update README if adding features
   - Update CHANGELOG.md

7. **Stage All Changes**
```bash
git add -A
```

8. **Show What Will Be Committed**
```bash
git diff --cached --stat
```

9. **Commit with Conventional Message**
```bash
git commit -m "<type>(<scope>): <description>"
```

## Success Criteria

✅ Lint passes with no errors  
✅ TypeScript compiles with no errors  
✅ All tests pass  
✅ Build succeeds  
✅ Code review checklist completed  
✅ Documentation updated  
✅ Commit follows conventional format  

## If Any Step Fails

- Fix the issue
- Re-run the failed step
- Once fixed, continue from where you left off
- Do NOT skip any steps
