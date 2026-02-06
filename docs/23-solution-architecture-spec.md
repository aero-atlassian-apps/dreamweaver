# DreamWeaver Solution Architecture — Source-Reviewed Specification

| Core Concept | Implementation |
|--------------|----------------|
| **Pattern** | Clean Architecture + BFF |
| **Agentic AI** | Multi-Agent Orchestration (ReAct) |
| **Real-time** | Gemini Live WebSocket Relay + Supabase Realtime (domain events) |
| **Persistence** | Supabase (Postgres + pgvector) |

---

## 1. System Architecture

### 1.1 Architectural Logic Flow
The system uses a **Backend for Frontend (BFF)** pattern to isolate client-specific logic from the core domain.

```mermaid
graph TD
    Client[Web/Mobile PWA] -->|HTTPS/WSS| BFF[Hono BFF Layer]
    BFF -->|Use Cases| App[Application Layer]
    App -->|Orchestration| Conductor[Bedtime Conductor Agent]
    Conductor -->|ReAct Loop| Gemini[Gemini 3 (Pro + Flash)]
    Conductor -->|Events| Bus[Agentic Event Bus]
    Bus -->|Broadcast| Client
    App -->|Persistence| DB[(Supabase/Postgres)]
```

### 1.2 Infrastructure Layers
1. **Interface (BFF)**: Hono middleware for JWT validation, one-time websocket ticket generation, and route-level validation (Zod).
2. **Application (Use Cases)**: Orchestrates transactions (e.g., `GenerateStoryUseCase`, `ManageSleepCycleUseCase`).
3. **Domain (Core)**: 
    - **Entities**: `User`, `Story`, `DreamCompanion`, `ActiveGoal`.
    - **Agents**: `BedtimeConductor`, `SleepSentinel`.
    - **Engines**: `AtomOfThoughtEngine` (Arbitrator).
4. **Infrastructure (Adapters)**: 
    - **AI**: Gemini 3 Flash (fast generation/streaming) / Gemini 3 Pro (verification + synthesis). Live Mode uses Gemini 3 Flash Live via the WS worker.
    - **Storage**: Supabase Client + Vector Store.
    - **Eventing**: `domain_events` persisted in Postgres + Supabase Realtime subscription (in-memory fallback for tests/dev).

---

## 2. Selected API Routes (Implemented)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/v1/live/init` | `POST` | Generates Live session config + one-time WS ticket (auth required). |
| `/api/v1/live/tool` | `POST` | Executes Gemini Live tool calls (auth required). |
| `/api/v1/live/tickets/consume` | `POST` | Internal endpoint used by WS worker to consume one-time tickets. |
| `/api/v1/stories/generate`| `POST` | Triggers the Conduct Session + Generation flow. |
| `/api/v1/conversations/turn`| `POST` | Processes interactive child turns. |
| `/api/v1/share/email` | `POST` | Sends a secure sharing link via email. |
| `/api/v1/meta/gemini-models` | `GET` | Public “judge proof” endpoint exposing resolved Gemini model names. |
| `/api/v1/demo/story` | `POST` | Public no-login demo story generation (enabled by default; set `PUBLIC_DEMO_ENABLED=false` to disable). |
| `Supabase Realtime: domain_events` | `SUBSCRIBE` | Real-time event stream (sleep cues, story beats, suggestions). |

Notes:
- Production deployment uses Supabase Realtime for events; there is no custom `/api/v1/events/ws` websocket in Vercel deployments.
- A Node WebSocket upgrade handler for events may exist for local/dev, but it is not a production architecture component.
- This table lists the key routes referenced by the architecture and demo; it is not a complete route inventory.

---

## 3. Agentic Intelligence Core

### 3.1 Multi-Goal Stack Implementation
The `BedtimeConductorAgent` manages a LIFO stack of goals:
- **Maximum Stack Depth**: 5.
- **Goal Types**: `STORY_COMPLETED`, `CHILD_ASLEEP`.
- **Arbitration Logic**: Prioritizes goals based on the stack order, with the top-most goal being actively tracked.

### 3.2 Resilience Engine
Handles AI failures autonomously:
- **`RETRY`**: Re-attempts the AI operation within defined limits.
- **`DEGRADE_SERVICE`**: Switches to a more efficient model configuration if needed.
- **`FALLBACK`**: Returns pre-authored "Safe Mode" content upon failure.

---

## 4. Data Model (From Supabase Migrations)

### 4.1 Table Definitions

```sql
-- User Preferences
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    mic_enabled BOOLEAN NOT NULL DEFAULT true,
    reminders_enabled BOOLEAN NOT NULL DEFAULT false,
    weekly_digest_enabled BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Golden Moments
CREATE TABLE golden_moments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    story_id UUID REFERENCES stories(id) ON DELETE SET NULL,
    media_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Memories
CREATE TABLE agent_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT,
    type TEXT NOT NULL CHECK (type IN ('EPISODIC', 'SEMANTIC', 'PROCEDURAL', 'PREFERENCE')),
    content TEXT NOT NULL,
    embedding VECTOR(768),
    confidence FLOAT DEFAULT 1.0,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Security & Safety

### 5.1 Safety Guardian (Multi-layer)
Every AI output is validated:
1. **Prompt-Injection Defense**: Blocks common prompt-injection patterns (fast checks).
2. **Pattern Matching**: Blocks obvious unsafe bedtime content (fast checks).
3. **AI Semantic Check (Fail-Closed)**: Validates bedtime domain compliance via a strict structured verdict.
4. **Heuristic Checks**: Age-appropriateness heuristics (e.g., “too complex” terms for very young children).
5. **Sanitization**: Removes internal artifacts (e.g., leaked `<thinking>` tags) before returning content.

---

## Parity Notes (Important)
- JWT validation is implemented using the **Supabase anon key** to validate the bearer token.
- `/api/v1/live/init` issues a **one-time websocket ticket** (not a Supabase RLS-scoped token).
- “4-layer safety” is implemented as: **regex/pattern scan → AI check (fail-closed) → heuristic checks → sanitization**.
- The SafetyGuardian also includes a prompt-injection defense step before pattern matching.
- Supabase migrations in-repo include the core tables (`stories`, `shared_links`, `domain_events`, and memory/graph tables) and define RLS policies.
