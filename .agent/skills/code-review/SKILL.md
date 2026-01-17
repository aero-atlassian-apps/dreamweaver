---
name: code-review
description: >
  Use this skill when reviewing code before committing, conducting security audits,
  checking for performance issues (N+1 queries, AI costs), validating Clean Architecture
  compliance, or running quality gates (lint, typecheck, test).
  Apply this checklist before submitting any code changes to the user.
---

# Code Review Skill

## 1. Purpose

This skill defines the criteria for reviewing code (both your own and others'). Antigravity must apply these checks *before* submitting changes to the user.

## When to use this skill

- Before creating any PR
- After making significant code changes
- When debugging unexpected behavior
- During security-sensitive implementations
- Before every release

## 2. Decision Tree

```
Is this a new feature?
├── Yes → Run full checklist (2.1-2.4)
└── No → Is it a bug fix?
    ├── Yes → Focus on 2.1 (Correctness) + 2.2 (Security)
    └── No → Is it a refactor?
        ├── Yes → Focus on 2.4 (Readability) + Clean Architecture
        └── No → It's a dependency update
            └── Run npm audit + check for breaking changes

Does the code touch authentication/authorization?
├── Yes → Apply security-audit skill (MANDATORY)
└── No → Continue

Does the code create UI components?
├── Yes → Verify against design_vFinal.md (MANDATORY)
└── No → Continue

Does the code touch AI/LLM calls?
├── Yes → Check token costs (2.3 FinOps)
└── No → Continue
```

## 3. The Checklist

### 3.1 Functionality & Correctness
- [ ] Does the code actually solve the user's problem?
- [ ] Are there edge cases? (Null inputs, network failures, empty lists)
- [ ] Is there a test covering this change? (TDD required)

### 3.2 Security (Critical)
Reference: security-audit skill for detailed checks
- [ ] **Injection**: Are SQL/NoSQL parameters escaped? (Use ORM/Query Builder)
- [ ] **Secrets**: Are API keys hardcoded? (MUST use `process.env`)
- [ ] **Auth**: Is the endpoint protected? (Check for `authMiddleware`)

### 3.3 Performance & FinOps
- [ ] **N+1 Queries**: Are we fetching data in a loop? (Use `Promise.all` or batching)
- [ ] **AI Costs**: Are we sending unnecessary context tokens to the LLM?
- [ ] **Re-renders**: (React) Are we causing infinite loops with `useEffect`?
- [ ] **Bundle Size**: Did we add unnecessary dependencies?

### 3.4 Readability & Maintainability
- [ ] **Naming**: Do variable names explain *what* they are? (`userList` vs `data`)
- [ ] **Comments**: Do comments explain *why*, not *how*?
- [ ] **Complexity**: Functions should be small (<30 lines ideally)
- [ ] **File length**: Files should be <200 lines ideally

## 4. Automated Quality Gates

Before notifying the user, run:
```bash
npm run lint
npm run typecheck
npm run test
npm audit --audit-level=moderate
```

## 5. Clean Architecture Compliance

- [ ] **Dependency Rule**: Domain entities must NOT depend on UI or Database layers
- [ ] **Separation**: Business logic belongs in `UseCases`, not in React Components
- [ ] **Ports**: External services accessed via ports (interfaces)
- [ ] **Layer Isolation**: Presentation → Application → Domain

## 6. Design Alignment (UI Changes)

- [ ] Compare against `docs/design_vFinal.md`
- [ ] Verify Lullaby Design Language v2 colors
- [ ] Confirm typography (Inter for UI, Newsreader for titles)
- [ ] Check 8px grid spacing
