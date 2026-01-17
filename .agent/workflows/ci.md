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

---

## Code Review Checklist

After all automated checks pass, review the following. This is mandatory for every release.

### SOLID Principles
- [ ] **S** - Single Responsibility: Each class/function has one reason to change
- [ ] **O** - Open/Closed: Extensible without modification
- [ ] **L** - Liskov Substitution: Subtypes replaceable for base types
- [ ] **I** - Interface Segregation: Small, focused interfaces
- [ ] **D** - Dependency Inversion: Depend on abstractions, not concretions

### SonarQube-Style Static Analysis
- [ ] File length audit (flag files > 200 lines)
- [ ] Function length audit (flag functions > 30 lines)
- [ ] Naming conventions (clear, descriptive, consistent)
- [ ] Code duplication detection
- [ ] Dead code identification

### Security Review
- [ ] No hardcoded secrets/API keys
- [ ] Input validation/sanitization
- [ ] Authentication/authorization properly implemented
- [ ] CORS configured correctly
- [ ] SQL injection prevention

### Performance & Scalability
- [ ] No N+1 query patterns
- [ ] Proper async/await usage
- [ ] No memory leaks (event listeners, subscriptions)
- [ ] Caching strategy considerations
- [ ] Lazy loading opportunities

### Backend: DDD & Clean Architecture
- [ ] Domain layer has NO external dependencies
- [ ] Entities have behavior (not anemic)
- [ ] Value objects are immutable
- [ ] Use cases orchestrate, don't contain business logic
- [ ] Ports define interfaces, adapters implement
- [ ] Proper layer separation

### Frontend: Component Architecture
- [ ] Components are focused and reusable
- [ ] Proper prop typing
- [ ] State management appropriate
- [ ] No business logic in components
- [ ] Consistent styling approach

### BFF (Backend for Frontend) Readiness
- [ ] API responses are client-agnostic
- [ ] Proper REST/API structure
- [ ] Versioning strategy (/api/v1/)
- [ ] Mobile-friendly response formats
- [ ] Authentication ready for mobile clients

---

## After Review Complete

5. **Stage All Changes**
```bash
git add -A
```

6. **Show What Will Be Committed**
```bash
git diff --cached --stat
```

7. **Commit with Conventional Message**
```bash
git commit -m "<type>(<scope>): <description>"
```

8. **Push Feature Branch**
```bash
git push origin <feature-branch-name>
```

9. **Create Pull Request**
```bash
gh pr create --title "<title>" --body "<description>" --base main
```

10. **Wait for User Review**
    - **DO NOT merge the PR yourself**
    - Wait for user to review and merge

---

## Success Criteria

✅ Lint passes with no errors  
✅ TypeScript compiles with no errors  
✅ All tests pass  
✅ Build succeeds  
✅ Code review checklist completed  
✅ Feature branch pushed  
✅ PR created and waiting for review
