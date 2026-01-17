# DreamWeaver Technical Architecture

## 1. Executive Summary

DreamWeaver is a **multi-client, agentic AI platform** built on a high-performance, edge-ready backbone. It is designed from Day 1 to support not just the initial PWA (Progressive Web App), but future native mobile applications (iOS/Android) with zero backend friction.

The core principle is **"Backend for Frontend" (BFF)** coupled with an **Agentic Event Bus**. This separates the UI optimization layer from the domain-heavy AI agency layer.

## 2. Target Architecture

### 2.1 Backend: The "Edge-Ready" Core
We use **Hono** as our specific framework choice.
*   **Why Hono?** It is standards-based (Web API), ultrafast (RegExpRouter), and allows us to deploy to Vercel Serverless/Edge today, but migrate to Cloudflare Workers or Dockerized Bun tomorrow without code changes.

#### Layers
1.  **Interface Layer (BFF)**: `api/routes/*`
    *   **Purpose**: Validates inputs (Zod), handles Auth (Supabase Auth), and formats responses for specific clients.
    *   **Web/PWA Routes**: Optimized for React hydration, cookie-based sessions.
    *   **Mobile Routes** (Future): Optimized for Swift/Kotlin, stateless JWTs, minimal payloads.
2.  **Application Layer (Use Cases)**: `src/application/use-cases/*`
    *   **Purpose**: Pure business logic (Clean Architecture). Orchestrates the flow.
    *   **Example**: `GenerateStoryUseCase` calls the Story Repository, then the AI Gateway, then the TTS Service.
3.  **Domain Layer (Entities)**: `src/domain/*`
    *   **Purpose**: Enterprise business rules that never change regardless of DB or UI.
    *   **Example**: `Story` entity enforces that a story cannot be "Completed" if it hasn't started.
4.  **Infrastructure Layer**: `src/infrastructure/*`
    *   **Purpose**: Adapters for external tools.
    *   **Components**: `SupabaseRepository`, `OpenAIGateway`, `GoogleTTSAdapter`.

### 2.2 Frontend: The "Premium" PWA
We use **React 18 + Vite** with a strict mobile-first methodology.
*   **Design System**: Custom Tailwind configuration for "Lullaby v2" (Glassmorphism, Dark Mode).
*   **State Management**: `TanStack Query` (Server State) + `Zustand` (Client State/Audio Player).
*   **PWA**: Service Workers for offline capabilities (critical for "Airplane Mode" playback).

## 3. Architecture Design Patterns

### 3.1 BFF (Backend for Frontend)
Instead of a generic REST API, we build specific endpoints for UI needs.
*   *Advantage*: The mobile app can request `/mobile/home-feed` and get a JSON optimized for the exact screen layout, while the Web PWA gets `/web/dashboard` with extra hydration data.

### 3.2 Agentic Event Bus
Agents (Sleep Sentinel, Story Weaver) are decoupled. They interact via **Events**, not direct method calls.
*   **Pattern**: Pub/Sub (Publish-Subscribe).
*   **Flow**:
    1.  `SleepSentinel` analyzes audio stream → detects `snoring`.
    2.  `SleepSentinel` publishes `Event('SLEEP_DETECTED', { confidence: 0.9 })`.
    3.  `StoryWeaver` (subscribed to `SLEEP_DETECTED`) → pivots story to "Ending Mode".
    4.  `ParentDashboard` (subscribed via WebSocket) → updates UI to show "Sleeping 🌙".

### 3.3 Hexagonal / Clean Architecture
*   **Ports**: Interfaces defined in the Application layer (e.g., `StoryRepositoryPort`).
*   **Adapters**: Implementations in Infrastructure (e.g., `SupabaseStoryRepository`).
*   *Benefit*: We can swap Supabase for Firebase, or Gemini for GPT-5, without touching a single line of business logic.

## 4. Security by Design

### 4.1 Zero Trust & Input Validation
*   **Zod Everywhere**: We do not trust ANY input. Every API route starts with `z.parse()`. If it fails, 400 Bad Request is returned automatically.
*   **Type Safety**: The backend Zod schemas are exported to the frontend, ensuring compile-time safety across the network boundary.

### 4.2 AuthZ at the Core
*   **RLS (Row Level Security)**: Supabase enforces that `User A` can never read `User B`'s stories at the database level. Even if the API code has a bug, the DB will reject the query.
*   **Middleware**: Hono middleware verifies JWTs before any route handler executes.

### 4.3 AI Safety
*   **Prompt Sanitization**: User inputs (child names, themes) are sanitized before insertion into prompts to prevent Injection Attacks.
*   **Output Validation**: We use `structured outputs` (JSON mode) to ensure the LLM generates valid data structures, not free-form text that could break the UI.

## 5. Performance by Design

### 5.1 The "100ms" Rule
*   **Interaction Latency**: Any click must yield visual feedback in <100ms.
*   **Optimistic UI**: When a user likes a story, the heart turns red *instantly*. The API call happens in the background. If it fails, we revert and show a toast.

### 5.2 Edge-First AI
*   **Streaming**: We stream text and audio chunks immediately. We do NOT wait for the full story to generate.
*   **Vercel Edge Functions**: AI orchestration happens on the Edge (close to the user), reducing network round-trips.

### 5.3 Asset Optimization
*   **Vector Graphics**: Use SVGs for UI elements (resolution independent).
*   **WebP/AVIF**: All generated images are compressed next-gen formats.

## 6. Observability by Design

### 6.1 FinOps & Tokenmetry
*   **Tagging**: Every log entry includes `cost_usd`, `model_name`, `input_tokens`, `output_tokens`.
*   **Budgeting**: Alerts trigger if a single user consumes >$1.00/day.

### 6.2 Distributed Tracing
*   **Correlation IDs**: A `x-request-id` header follows the request from Client → Nginx → Hono → AI Gateway → Database. We can trace 500 errors back to the exact user click.
*   **Structured Logging**: JSON logs only. No `console.log("here")`.
    ```json
    { "level": "info", "event": "story_generated", "latency_ms": 4500, "user_id": "u_123" }
    ```

## 7. Evolution Strategy (V1 to V2)

| Feature | V1 (MVP) | V2 (Scale) |
| :--- | :--- | :--- |
| **Event Bus** | In-Memory (Mitt) | Redis / Kafka |
| **Vector DB** | Postgres (pgvector) | Pinecone (if >100M vectors) |
| **TTS** | Google Cloud (Basic) | Custom Voice Clone Model |
| **Mobile** | PWA (Installable) | Native iOS/Android (via BFF) |

---
**Approved Standards**
*   **Language**: TypeScript (Strict Mode)
*   **Testing**: Vitest (100% Core Coverage)
*   **Linting**: Biome / ESLint
*   **Formatting**: Prettier
