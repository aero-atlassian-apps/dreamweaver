---
name: agent-state-pattern
description: >
  Use this skill when implementing conversation persistence, context window management,
  agent memory systems, goal-directed behavior, or ambient context injection.
  Covers: chat history storage, sliding window strategies, summarization, RAG integration,
  Memory Vault, preference learning, and active goal tracking for agentic systems.
---

# Agent State Pattern Skill

## 1. The Importance of State
Agents are stateless by default. "Memory" is just context window management. This skill defines how we persist and retrieve that state to create a cohesive user experience.

## 2. Database Schema (Supabase)
We use a relational structure to store conversation history.

### 2.1 Core Tables
- `conversations`: Stores metadata (id, userId, title, created_at).
- `messages`: Stores individual turns (id, conversationId, role, content, tool_calls, tool_results).

### 2.2 Persistence Layer
- **Auto-save**: Every message implementation must immediately persist to the database.
- **Optimistic UI**: Update the UI immediately, then sync with the DB in the background.

## 3. Context Window Management
LLMs have finite context windows. We must manage what goes into the prompt.

### 3.1 Strategies
1.  **Sliding Window**: Keep only the last $N$ messages.
2.  **Summarization**: Periodically summarize older messages into a "memory" block injected at the start of the context.
3.  **RAG (Retrieval Augmented Generation)**: specific to knowledge base queries, not just chat history.

## 4. Client-Side State (React)
- Use `useChat` hooks (from Vercel AI SDK or custom) to manage the immediate stream.
- Sync these hooks with the backend `conversations` table.
- **Handling Interruption**: If the user navigates away, ensure the stream is either cancelled or the background worker completes it.

## 5. Goal-Directed Behavior (Agentic)
Unlike simple chatbots, our agents have **Active Goals**.

### 5.1 Goal Stickiness
- Goals persist across turns. If the goal is "Get child to sleep", the agent should not abandon it just because the child asks a question. It should answer *and then* return to the sleep goal.
- **Storage**: Store `activeGoals` in the `conversations` table or a dedicated `agent_state` table.

```typescript
interface ActiveGoal {
  id: string;
  type: 'PHYSIOLOGICAL' | 'EMOTIONAL';
  description: 'Child asleep within 15m';
  status: 'PENDING' | 'ACHIEVED' | 'FAILED';
  priority: number;
}
```

## 6. Memory Vault & Implicit Signals
Reflecting the "DreamWeaver" vFinal requirements for learning without asking.

### 6.1 Implicit Signals
Capture signals that the user doesn't explicitly type.
- **Completion Rate**: Did they finish the story?
- **Interruption Count**: Engagement proxy.

### 6.2 Preference Learning (DPO-Lite)
Store preference pairs to train the recommendation engine.

```typescript
interface PreferencePair {
  context: AmbientContext; // Time, Weather
  chosen: StoryAttributes; // The story they finished
  rejected: StoryAttributes; // The one they skipped
}
```

## 7. Ambient Context
The context window must include more than just chat history. Inject "Ambient Intelligence" at the system prompt level:
- **Time**: "It is 9:30 PM (Late)"
- **Weather**: "Raining outside"
- **Recent Events**: "Child asked about Mars yesterday"

