---
name: ai-service-integration
description: >
  Use this skill when integrating LLM providers (OpenAI, Anthropic, Gemini), implementing
  the AI Gateway pattern, handling streaming responses, managing API keys securely,
  implementing Text-to-Speech (TTS), or tracking token usage for FinOps.
  Covers: retries, timeouts, structured outputs with Zod, audio services, and cost budgeting.
---

# AI Service Integration Skill

## 1. Overview
This skill defines the standard approach for integrating Large Language Models (LLMs) and other AI services into the application. It emphasizes abstraction, resilience, and type safety.

## 2. Architecture: The AI Gateway Pattern
Do not call dependencies (OpenAI, Anthropic, Gemini) directly from feature code. Use a centralized **AI Gateway** or **Model Service**.

### 2.1 Interface Definition
Define a common interface for all model interactions:
```typescript
interface AIModelService {
  complete(prompt: string, options?: AIModelOptions): Promise<string>;
  stream(prompt: string, options?: AIModelOptions): AsyncGenerator<string>;
  generateObject<T>(prompt: string, schema: ZodSchema<T>): Promise<T>;
}
```

### 2.2 Provider Abstraction
Implement adapters for each provider. This allows hot-swapping models without code changes.
- `OpenAIAdapter`
- `AnthropicAdapter`
- `GeminiAdapter`

## 3. Resilience & Observability

### 3.1 Retries and Backoff
- Implement exponential backoff for 429 (Rate Limit) and 5xx errors.
- **Do not** retry on 400 (Bad Request) errors.

### 3.2 timeouts
- Enforce strict timeouts. Long-running requests often indicate a stalled stream or hallucination loop.

### 3.3 Token Usage Tracking
- Log token usage (prompt + completion) for every request.
- Tag logs with `userId`, `featureId`, and `modelName` for FinOps/Tokenmetry.

## 4. Structured Outputs
**NEVER** parse raw JSON from strings manually using `JSON.parse()`.
- Use libraries like Vercel AI SDK `generateObject` or Zod Schema validation.
- Provide retry instructions to the model if validation fails.

## 5. Streaming
- Prioritize streaming for all user-facing text generation to reduce perceived latency.
- Ensure the UI handles stream chunks smoothly (don't flicker).

## 6. Security
- **NEVER** commit API keys to git. Use `.env`.
- **Sanitize** user inputs in prompts to prevent prompt injection (though modern models are more robust, it is still a best practice).

## 7. Audio & TTS Services
DreamWeaver is an audio-first experience.

### 7.1 Text-To-Speech (TTS)
- **Adapter Pattern**: Use `TextToSpeechPort`.
- **Google Chirp 3**: Primary provider for "Voice Cloning".
- **Streaming**: TTS *must* return a stream (AudioBuffer chunks), not wait for the full file.
- **Caching**: Cache generated audio segments (e.g., standard intros) to save costs.

### 7.2 Audio Input
- Handle raw audio streams via WebSocket or Edge Functions.
- Use VAD (Voice Activity Detection) to detect when the child stops speaking.

## 8. FinOps & Tokenmetry
We must build for profitability from Day 1.

### 8.1 Structured Logging
Every AI call must log the following fields for cost analysis:
```json
{
  "event": "ai_completion",
  "model": "gemini-2.0-flash",
  "input_tokens": 150,
  "output_tokens": 40,
  "cost_usd": 0.000045,
  "user_id": "u_123",
  "context": "story_generation"
}
```

### 8.2 Budget Enforcement
- Implement a "Circuit Breaker" if a user exceeds daily limits (e.g., $1.00/day).
- Graceful degradation: Switch to cheaper models (Gemini Flash vs Pro) if budget is tight.

