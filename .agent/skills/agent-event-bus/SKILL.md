---
name: agent-event-bus
description: >
  Use this skill when implementing pub/sub event communication between agents,
  designing event schemas with typed payloads, creating EventBus infrastructure,
  or handling inter-agent messaging for DreamWeaver's agentic architecture.
  Triggers on: event-driven design, agent messaging, pub/sub patterns, EventBus implementation.
---

# Agent Event Bus Skill

## 1. Overview
The "DreamWeaver" architecture relies on a decoupled, event-driven system where agents (Sleep Sentinel, Story Weaver, etc.) communicate via **events**, not direct method calls. This skill defines the patterns for this "Agentic Event Bus".

## 2. Core Concepts

### 2.1 Pub/Sub Pattern
Agents **Publish** events when something significant happens (e.g., "Sleep Detected"). Other agents **Subscribe** to events they care about (e.g., "Stop Story").

### 2.2 Event Schema
All events must strictly adhere to the `AgentMessage` interface:

```typescript
interface AgentMessage {
  source: AgentId;       // e.g., 'sleep-sentinel-01'
  type: EventType;       // e.g., 'SLEEP_CUE_DETECTED'
  payload: unknown;      // Fully typed Zod schema per event type
  timestamp: Date;       // ISO 8601
  correlationId?: string;// For tracing across services
}
```

## 3. Standard Event Types

| Event Type | Source | Payload | Subscriber Actions |
| :--- | :--- | :--- | :--- |
| `SLEEP_CUE_DETECTED` | Sleep Sentinel | `{ confidence: 0.85, cue: 'snoring' }` | **Story Weaver**: Slows pace, dims UI. |
| `CHILD_INTERRUPT` | Audio Service | `{ transcript: "Why?" }` | **Story Weaver**: Pauses, generates answer. |
| `STORY_BEAT_COMPLETED`| Story Weaver | `{ beatId: 12, nextBeat: 13 }` | **Music Engine**: Transitions theme. |
| `GOLDEN_MOMENT` | Memory Curator | `{ transcript: "...", tags: ["love"] }` | **DB**: Persists to Vault. |

## 4. Implementation

### 4.1 In-Memory Bus (MVP / Edge)
For the MVP running on Vercel Edge, use a lightweight in-memory emitter (like `mitt` or a custom `Map`).

```typescript
// infrastructure/events/InMemoryEventBus.ts
export class InMemoryEventBus implements EventBusPort {
  private subscribers = new Map<EventType, Handler[]>();

  publish(event: AgentMessage): void {
    const handlers = this.subscribers.get(event.type) || [];
    handlers.map(h => h(event)); // Fire and forget
  }
}
```

### 4.2 Distributed Bus (Scale)
For V2, this abstracts easily to Redis or Kafka. The *Application Layer* does not change; only the *Infrastructure Adapter* changes.

## 5. Best Practices

1.  **Async by Default**: Handlers should never block the main thread.
2.  **Idempotency**: Subscribers should handle receiving the same event twice gracefully.
3.  **Typed Payloads**: Always export a Zod schema for every `payload` type.
    ```typescript
    export const SleepCueSchema = z.object({
      confidence: z.number().min(0).max(1),
      cue: z.enum(['silence', 'snoring', 'breathing']),
    });
    ```
