# Feature Walkthrough (End-to-End)

This walkthrough describes the “happy path” workflow for adding a new feature without breaking layering.

## Example: add a new backend capability

### Step 1: Define or extend a domain concept
- Add/extend entity/value object in `api/src/domain/**`
- Keep it framework-free

### Step 2: Add a port if you need external data
- Add interface to `api/src/application/ports/**`
- Keep method set minimal (don’t create a port per endpoint)

### Step 3: Implement the use-case
- Add `api/src/application/use-cases/*UseCase.ts`
- Inject ports + logger + required services
- Return a stable response shape (DTO)

### Step 4: Implement the adapter
- Add infrastructure implementation in `api/src/infrastructure/**`
- Implement the port and translate between external data and domain objects

### Step 5: Wire it in DI
- Register the adapter + use-case in `api/src/di/container.ts`

### Step 6: Expose it via a route
- Add route in `api/src/routes/**`
- Keep route “thin”: parse → auth → use-case → response

### Step 7: Test at the right layer
- Use-case unit test: mock ports
- Route test: mock auth + DI middleware and assert status/response

## Example: add a new frontend capability

### Step 1: Decide the boundary
- If it’s UI-only state: keep it in `src/presentation/**`
- If it’s business logic: put it in `src/application/**` and call it from UI

### Step 2: Add an infrastructure adapter for the API
- Prefer using `apiFetch` and authenticated requests
- Keep base URL handling centralized via `src/infrastructure/api/apiClient.ts`

### Step 3: Keep UI components thin
- UI is responsible for UX, not policy
- Put decisions (limits, gating, workflows) in application layer

## Common failure modes

- Duplicating `/api/v1` across call sites instead of using the shared API client
- Letting routes accumulate business rules (“just one more if statement”)
- Making entities data-bags without behavior
- Adding ports that mirror transport endpoints rather than domain needs

