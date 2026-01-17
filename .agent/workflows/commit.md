---
description: Review changes, update docs, then git add and commit with conventional commit message
---

# Commit Workflow

Run this workflow after all quality gates pass to commit your changes.

## Prerequisites

- Run `/check` workflow first and ensure all pass ✅
- Have a clear understanding of what was changed

## Steps

1. **Review Changes**
   - Apply the `code-review` skill checklist:
     - ✅ Functionality: Does it solve the problem? Edge cases covered?
     - ✅ Security: No hardcoded secrets? Queries parameterized?
     - ✅ Performance: No N+1 queries? No unnecessary AI tokens?
     - ✅ Readability: Good naming? Comments explain "why"?

2. **Update Documentation (if needed)**
   - Update README.md if adding new features
   - Update API docs if changing endpoints
   - Add JSDoc comments to new public functions
   - Update CHANGELOG.md with notable changes

// turbo
3. **Stage Changes**
```bash
git add -A
```

// turbo
4. **Check Status**
```bash
git status
```

5. **Commit with Conventional Commit Message**
   - Format: `<type>[scope]: <description>`
   - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`
   
```bash
git commit -m "<type>(<scope>): <description>"
```

## Example Commit Messages

- `feat(story): implement story generation use case`
- `fix(auth): handle expired JWT tokens correctly`
- `docs(readme): add installation instructions`
- `refactor(api): extract validation logic to middleware`
- `test(metrics): add unit tests for throughput calculation`

## Notes

- Always run `/check` before this workflow
- For breaking changes, add `BREAKING CHANGE:` in the commit body
- Keep commits atomic - one logical change per commit
