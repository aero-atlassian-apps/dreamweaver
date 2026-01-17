---
name: tdd-workflow
description: >
  Use this skill when implementing features using Test-Driven Development, following
  the Red-Green-Refactor cycle, or writing tests before implementation code.
  Enforces: write failing test first, make it pass with minimal code, then refactor.
  Covers: test co-location, mocking strategies, and testing layers (unit/integration/E2E).
---

# Test-Driven Development (TDD) Skill

## 1. The Golden Rule
**"Write the test BEFORE the code."**
You are strictly forbidden from writing functional code (implementation) until you have a failing test that defines the expected behavior.

## 2. The Cycle (Red-Green-Refactor)

### Phase 1: RED (The Failing Test)
Write a test that describes the *intent* of the feature.
- Use `describe()` and `it()` blocks to tell a story.
- Example: `it('should return 400 if the story prompt is empty', ...)`
- **Run the test**: It MUST fail (or fail to compile). If it passes, your test is vacuous.

### Phase 2: GREEN (Make it Pass)
Write the *minimum* amount of code necessary to make the test pass.
- Do not optimize yet.
- Do not add features "just in case".
- **Run the test**: It MUST pass.

### Phase 3: REFACTOR (Clean it Up)
Now that you have safety, improve the code.
- Remove duplication.
- Improve variable names.
- Apply Clean Architecture patterns.
- **Run the test**: It MUST still pass.

## 3. Test Structure

### 3.1 Co-location
Tests live *next to* the code they test.
```text
src/
  features/
    story-generator/
      StoryGenerator.ts
      StoryGenerator.test.ts  <-- Right here!
```

### 3.2 Testing Layers
1.  **Unit Tests** (Fast): Mock everything. Test logic in isolation.
2.  **Integration Tests** (Medium): Test DB queries, AI Gateway adapters.
3.  **E2E Tests** (Slow): Use Playwright to test the full user flow.

## 4. Mocking Strategy
- **Ports & Adapters**: Always mock the *Port* interface, never the concrete implementation classes.
- **AI Services**: **NEVER** call real AI endpoints in unit tests. Use a `MockAIService` that returns deterministic strings ("Mock Story Content").
