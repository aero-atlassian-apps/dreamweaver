---
name: prompt-management
description: >
  Use this skill when creating, organizing, or versioning LLM prompts, implementing
  prompt templates with type-safe variables, structuring system prompts, or iterating
  on prompt effectiveness. Covers: prompt-as-code patterns, context injection,
  output specification, safety guardrails, and eval-driven development.
---

# Prompt Management Skill

## 1. Philosophy: Prompts as Code
Prompts are the "source code" of the agent's cognition. They must be treated with the same rigor as TypeScript code.

## 2. Directory Structure
Store all prompts in a centralized `src/prompts` or `src/lib/ai/prompts` directory. **Do not** hardcode prompt strings inside React components or API routes.

```text
src/prompts/
├── core/
│   ├── system-prompt.ts      # The main persona
│   └── safety-guardrails.ts
├── features/
│   ├── story-generation.ts
│   └── code-review.ts
└── utils/
    └── prompt-renderer.ts
```

## 3. Prompt Construction

### 3.1 Template Variables
Use functions to generate valid prompt strings with type-safe arguments.
```typescript
export const getStoryPrompt = (genre: string, character: string) => `
You are a storyteller specializing in ${genre}.
Write a story about ${character}.
`;
```

### 3.2 Output Specification
Explicitly state the desired output format at the **end** of the prompt.
> "Return the result as a raw JSON object matching this schema: ..."

### 3.3 Context Injection
Dynamically inject relevant context (e.g., previous messages, user profile settings). Ensure this context is clearly demarcated:
```text
<user_context>
  { ... }
</user_context>
```

## 4. Versioning & Iteration
- When significantly changing a prompt, create a new version (e.g., `story-generation-v2.ts`) or use a Git-based workflow to track effectiveness.
- **Eval Driven Development**: Maintain a set of "golden inputs" to test prompts against whenever they are modified.

## 5. Security & Safety
- **Input Sandboxing**: Delineate user input clearly to avoid instruction override.
  - Good: "User input: ```{input}```"
  - Bad: "{input}"
