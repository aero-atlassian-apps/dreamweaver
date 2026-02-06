---
name: robust-error-handling
description: >
  Use this skill when implementing error handling strategies, defining custom error types,
  setting up global error boundaries, or configuring structured logging / observability.
  Triggers on: error handling, try-catch, exceptions, Result pattern, debugging.
---

# Robust Error Handling

## 1. Core Philosophy

> **"Errors are values, not exceptions."** (in Domain/Business Logic)

We prefer functional error handling (Result pattern) over `throw/catch` for anticipated business errors. This makes failure paths explicit and type-safe.

## 2. The Result Pattern

Use a `Result` type to return success or failure from domain methods and use cases.

### Result Type Definition

```typescript
// shared/core/Result.ts
export class Result<T, E = Error> {
  public isSuccess: boolean;
  public isFailure: boolean;
  private _error?: E;
  private _value?: T;

  private constructor(isSuccess: boolean, error?: E, value?: T) { ... }

  public static ok<U>(value: U): Result<U, never> { ... }
  public static fail<U, F>(error: F): Result<U, F> { ... }
  
  public getValue(): T { ... }
  public getError(): E { ... }
}
```

### Usage Example

```typescript
// GOOD: Explicit failure path
function divide(a: number, b: number): Result<number, string> {
  if (b === 0) {
    return Result.fail("Cannot divide by zero");
  }
  return Result.ok(a / b);
}

const result = divide(10, 0);
if (result.isFailure) {
  console.error(result.getError()); // Type-safe access
} else {
  console.log(result.getValue());
}
```

## 3. Error Classification

Start by defining a base application error:

```typescript
export abstract class AppError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'RESOURCE_NOT_FOUND');
  }
}
```

## 4. Layered Handling Strategy

| Layer | Strategy |
|-------|----------|
| **Domain** | Return `Result<T, DomainError>`. NEVER throw. |
| **Application** | Unwrap `Result`. If failure, return specific DTO or throw `AppError` if unrecoverable. |
| **Presentation (API)** | Middleware catches `AppError` -> converts to 4xx/5xx HTTP response. |
| **Presentation (UI)** | React Error Boundary catches crashes. Toast notifications for 4xx errors. |

## 5. React Error Boundaries

Wrap feature sub-trees (not just the whole app) to prevent white screens of death.

```tsx
<ErrorBoundary fallback={<ErrorComponent />}>
  <ComplexWidget />
</ErrorBoundary>
```

## 6. Observability & Logging

- **Structured Logging**: Always log context, not just messages.
- **Correlation IDs**: Trace checks across services.

```typescript
logger.error('Payment failed', { 
  userId: user.id, 
  amount: 100, 
  reason: error.message,
  correlationId: req.id 
});
```

## 7. Anti-patterns

- **Swallowing Errors**: `try { ... } catch (e) { }` // BAD!
- **Throwing Strings**: `throw "Something went wrong"` // BAD! Always throw Error objects.
- **Leaking Internal Details**: Never send stack traces to the client in production.
