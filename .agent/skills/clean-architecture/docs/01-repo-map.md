# Repo Map (Layers & Boundaries)

DreamWeaver is a monorepo with two main “verticals” that each follow the same layering idea:
- Backend API (Hono) under `api/src`
- Frontend app (React) under `src`

## Backend (Hono API) — `api/src`

**Domain (core rules)**
- `api/src/domain/**`
  - Entities and value objects
  - Domain services (policy/logic that doesn’t belong to a single entity)
  - Agents (domain orchestration logic) when they represent product behavior, not transport

**Application (use-cases + ports)**
- `api/src/application/use-cases/**`
- `api/src/application/ports/**`
- `api/src/application/factories/**` (composition helpers that still depend only inward)

**Infrastructure (adapters + persistence)**
- `api/src/infrastructure/**`
  - Adapters to AI providers, TTS, storage, caches, etc.
  - Concrete repository implementations (Supabase, Redis/Upstash, file-backed)

**Presentation (HTTP routes + middleware)**
- `api/src/routes/**`
- `api/src/middleware/**`
- `api/src/app.ts` (route mounting and middleware wiring)

**Composition / DI**
- `api/src/di/container.ts` is the composition root for the backend.

## Frontend (React App) — `src`

**Domain (UI-independent business concepts)**
- `src/domain/**`

**Application (UI use-cases / ports)**
- `src/application/**`

**Infrastructure (API clients, persistence, device adapters)**
- `src/infrastructure/**`

**Presentation (React UI)**
- `src/presentation/**`

## Dependency Direction

Allowed:
- `presentation` imports `application` and `domain`
- `application` imports `domain`
- `infrastructure` imports `application` and `domain`

Avoid:
- `domain` importing `application`, `infrastructure`, or `presentation`
- `application` importing `presentation` or concrete infrastructure implementations

