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

## 2. The Checklist

### 2.1 Functionality & Correctness
- [ ] Does the code actually solve the user's problem?
- [ ] Are there edge cases? (Null inputs, network failures, empty lists).
- [ ] Is there a test covering this change?

### 2.2 Security (Critical)
- [ ] **Injection**: Are SQL/NoSQL parameters escaped? (Use ORM/Query Builder).
- [ ] **Secrets**: Are API keys (OPENAI_KEY) hardcoded? (MUST use `process.env`).
- [ ] **Auth**: Is the endpoint protected? (Check for `authMiddleware`).

### 2.3 Performance & FinOps
- [ ] **N+1 Queries**: Are we fetching data in a loop? (Use `Promise.all` or batching).
- [ ] **AI Costs**: Are we sending unnecessary context tokens to the LLM?
- [ ] **Re-renders**: (React) Are we causing infinite loops with `useEffect`?

### 2.4 Readability & Maintainability
- [ ] **Naming**: Do variable names explain *what* they are? (`userList` vs `data`).
- [ ] **Comments**: Do comments explain *why*, not *how*?
- [ ] **Complexity**: functions should be small (<30 lines ideally).

## 3. Automated Quality Gates
Before notifying the user, run:
1.  `npm run lint` (ESLint)
2.  `npm run typecheck` (TypeScript)
3.  `npm run test` (Vitest)

## 4. Clean Architecture Compliance
- **Dependency Rule**: Domain entities must NOT depend on UI or Database layers.
- **Separation**: Business logic belongs in `UseCases`, not in standard React Components or API Controllers.
