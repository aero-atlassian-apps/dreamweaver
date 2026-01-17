---
name: tool-construction
description: >
  Use this skill when building tools that LLM agents can invoke via function calling,
  defining tool schemas with Zod, implementing tool executors, or setting up tool registries.
  Covers: type-safe parameters, error handling for tools (return errors, don't throw),
  granular tool design, security considerations, and human-in-the-loop patterns.
---

# Tool Construction Skill

## 1. Tool Anatomy
A "Tool" is a function exposed to the LLM. It consists of:
1.  **Name**: Unique identifier (e.g., `getCurrentWeather`).
2.  **Description**: Detailed docstring explaining *what* it does and *when* to use it.
3.  **Schema**: Zod schema defining the arguments.
4.  **Executor**: The actual TypeScript function logic.

## 2. Best Practices

### 2.1 Type Safety with Zod
ALWAYS define inputs with Zod. This ensures the model's output is validated before your code runs.

```typescript
import { z } from 'zod';

export const weatherTool = {
  description: 'Get the current weather for a location',
  parameters: z.object({
    location: z.string().describe('The city and state, e.g. San Francisco, CA'),
    unit: z.enum(['celsius', 'fahrenheit']).default('celsius'),
  }),
  execute: async ({ location, unit }) => { ... }
};
```

### 2.2 Error Handling
**Do NOT throw exceptions** from tools if possible.
- If a tool fails (e.g., API error), return a descriptive string: `"Error: Could not fetch weather. API returned 404."`
- This allows the Agent to see the error and try again or apologize to the user, rather than crashing the conversation.

### 2.3 Granularity
- Tools should be atomic. Avoid "god tools" that do everything.
- If a task is complex, break it down into multiple tool calls (Chain of Thought).

## 3. Security
- **Authentication**: Tools operate with the agent's permissions. Verify the `userId` has access to the resource being requested.
- **Read-Only vs. Write**: Be extra careful with write-enabled tools. Consider asking for user confirmation (Human-in-the-Loop) for high-stakes actions.

## 4. Tool Registry
- Maintain a central registry (array or map) of available tools.
- This registry is passed to the `AIModelService` when initializing the stream.
