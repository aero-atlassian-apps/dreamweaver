---
description: Run quality gates (lint, typecheck, test) before committing any changes
---

# Quality Gates Workflow

Run this workflow after making code changes to ensure everything passes before committing.

## Steps

// turbo
1. **Run Linter**
```bash
npm run lint
```

// turbo
2. **Run TypeScript Type Check**
```bash
npm run typecheck
```

// turbo
3. **Run Tests**
```bash
npm run test
```

4. **Review Results**
   - If all pass ✅ → Proceed to commit
   - If any fail ❌ → Fix issues and re-run this workflow

## Notes

- This workflow should be run before EVERY commit
- Use `/commit` workflow after this passes
- For quick iteration, you can run individual commands manually
