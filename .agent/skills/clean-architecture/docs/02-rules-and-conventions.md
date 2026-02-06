# Rules & Conventions

This is the practical rulebook for keeping DreamWeaver maintainable as features grow.

## Non-negotiable rules

### 1) Ports live in Application
If the code needs “the outside world” (DB, cache, AI, email, file system), define a port in:
- Backend: `api/src/application/ports/*`
- Frontend: `src/application/ports/*`

Infrastructure implements ports.

### 2) Domain must not depend on frameworks
Domain code must not import:
- Hono/Express/HTTP libraries
- Supabase/Redis clients
- React/Vite/browser globals (in backend domain)

### 3) Use-cases own orchestration
Use-cases:
- validate input (lightweight, boundary-level)
- call domain logic and ports
- return DTOs or domain objects (depending on the boundary)

Routes and UI components should not contain business decisions.

### 4) Presentation adapts transport, never business rules
Routes/components:
- parse input
- call a use-case
- map output to response/UI

### 5) Composition happens in one place
Backend composition root:
- `api/src/di/container.ts`

Frontend composition is typically via hooks and repository constructors under `src/infrastructure/**`.

## Naming conventions (DreamWeaver style)

Backend:
- `*UseCase.ts` for application workflows
- `*RepositoryPort.ts` for persistence contracts
- `Supabase*Repository.ts`, `Redis*State.ts`, `*Adapter.ts` for concrete implementations
- `routes/*.ts` expose HTTP endpoints and use `authMiddleware` when needed

Frontend:
- `Api*Repository.ts` for HTTP-backed persistence adapters
- `*Service.ts` for lightweight API client groupings (when not expressed as repository ports)
- `pages/*Page.tsx`, `components/*` for UI

## Boundaries and DTO guidance

Backend route boundary:
- Accept only primitives/JSON/`FormData`
- Return DTOs, not live class instances

Public responses:
- Avoid leaking internal user IDs when returning shareable content
- Prefer explicit “public serialization” methods where needed

## Testing expectations

- Domain: fast unit tests (behavior rules)
- Application: unit tests mocking ports
- Infrastructure: integration tests when feasible (Supabase/Redis adapters)
- Routes: request/response tests with mocked middleware and services

