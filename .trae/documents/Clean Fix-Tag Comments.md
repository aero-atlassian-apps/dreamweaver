## Goal
- Remove/clean “fix-session” comments across the repo (e.g. `// FIX`, `// [AUDIT-FIX]`, `// [AUTH-FIX]`, `// [BUG-01]`) so the codebase has only clean, intentional comments.

## What I Found
- Fix-tag style comments exist in 15 code files (mostly `api/src/**` plus `src/presentation/pages/LoginPage.tsx`).
- Typical patterns are bracket tags (`[AUDIT-FIX]`, `[AUTH-FIX]`, `[FIX]`, `[BUG-01]`) inside `//` comments and JSDoc `/** ... */` lines.

## Cleanup Rules (Safe + Deterministic)
- **Remove fix tags, keep useful text**
  - Example: `// [AUDIT-FIX] Validate config` → `// Validate config`
  - Example: `* [AUDIT-FIX] Circuit Breaker State` → `* Circuit Breaker State`
  - Example: `const x = 1 // [FIX] reason` → `const x = 1 // reason`
- **Delete comments that become empty** after tag removal
  - Example: `setupTracing() // [AUDIT-FIX]` → `setupTracing()`
- **Also remove trivial fix markers** like `(Fix)` / `(Bug)` inside comments when they’re just status labels.
- **Do not touch** non-source artifacts (lockfiles, generated files, `docs/**`, `.trae/**`, `.agent/**`) to avoid false positives like dependency names containing “fix”.

## Files Likely to Change
- API: `GeminiAIGateway.ts`, `SafetyGuardian.ts`, `app.ts`, `tracing.ts`, `rateLimit.ts`, `auth.ts`, `ApiEnv.ts`, `story.ts`, `feedback.ts`, `FlagContentUseCase.ts`, `ToolExecutionRouter.ts`, `BedtimeConductorAgent.ts`, `BedtimeConductorAgent.*.test.ts`
- App: `LoginPage.tsx`
- Optional small cleanup: `scripts/verify_unlock_fix.ts` (remove “(Bug)/(Fix)” status-only comment text)

## Verification
- Re-scan the repo to ensure **0 remaining occurrences** of the fix-tag patterns in code comments.
- Run existing checks to ensure no accidental formatting/compile issues:
  - root: lint + typecheck + tests
  - api: typecheck + tests

## Result
- No runtime behavior changes—only comment cleanup.
- The repo keeps meaningful comments, but loses “fix-session” markers and status annotations.