---
description: TDD workflow - write failing test, implement, refactor
---

# TDD Workflow

Follow the Red-Green-Refactor cycle for test-driven development.

## Steps

1. **Create Failing Test (RED)**
   - Create a test file next to the implementation: `<FeatureName>.test.ts`
   - Write a test that describes the expected behavior
   - The test MUST fail initially

// turbo
2. **Verify Test Fails**
```bash
npm run test -- --run
```
   - If it passes, your test is wrong (vacuous truth)
   - If it fails, proceed to implementation

3. **Implement Minimum Code (GREEN)**
   - Write the smallest amount of code to make the test pass
   - Do NOT add extra features or optimize yet

// turbo
4. **Verify Test Passes**
```bash
npm run test -- --run
```
   - If it fails, fix the implementation
   - If it passes, proceed to refactor

5. **Refactor (REFACTOR)**
   - Clean up the code
   - Apply Clean Architecture patterns
   - Improve naming and structure

// turbo
6. **Verify Tests Still Pass**
```bash
npm run test -- --run
```

7. **Run Full Quality Gates**
   - Use `/check` workflow to run lint, typecheck, and all tests

## Best Practices

- Tests live next to code: `StoryGenerator.ts` → `StoryGenerator.test.ts`
- One assertion per test when possible
- Mock at boundaries (Ports), not internal modules
- Never call real AI/external services in unit tests
