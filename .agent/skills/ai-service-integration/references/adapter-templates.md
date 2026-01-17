# AI Provider Adapter Templates

Reference templates for implementing AI service adapters in DreamWeaver.

## Base Interface

```typescript
// application/ports/AIModelPort.ts
import { z, ZodSchema } from 'zod';

export interface AIModelOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface AIModelPort {
  /**
   * Generate a text completion
   */
  complete(prompt: string, options?: AIModelOptions): Promise<string>;
  
  /**
   * Stream a text completion
   */
  stream(prompt: string, options?: AIModelOptions): AsyncGenerator<string>;
  
  /**
   * Generate a structured object matching a Zod schema
   */
  generateObject<T>(prompt: string, schema: ZodSchema<T>, options?: AIModelOptions): Promise<T>;
}
```

## Gemini Adapter

```typescript
// infrastructure/adapters/GeminiAdapter.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIModelPort, AIModelOptions } from '@/application/ports/AIModelPort';

export class GeminiAdapter implements AIModelPort {
  private client: GoogleGenerativeAI;
  
  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }
  
  async complete(prompt: string, options?: AIModelOptions): Promise<string> {
    const model = this.client.getGenerativeModel({ 
      model: options?.model ?? 'gemini-2.0-flash' 
    });
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 1024,
      },
    });
    
    return result.response.text();
  }
  
  async *stream(prompt: string, options?: AIModelOptions): AsyncGenerator<string> {
    const model = this.client.getGenerativeModel({ 
      model: options?.model ?? 'gemini-2.0-flash' 
    });
    
    const result = await model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 1024,
      },
    });
    
    for await (const chunk of result.stream) {
      yield chunk.text();
    }
  }
  
  async generateObject<T>(prompt: string, schema: ZodSchema<T>, options?: AIModelOptions): Promise<T> {
    // Implementation using Gemini's JSON mode + Zod validation
    const response = await this.complete(prompt + '\n\nRespond with valid JSON only.', options);
    const parsed = JSON.parse(response);
    return schema.parse(parsed);
  }
}
```

## Usage Example

```typescript
// Dependency injection
const aiService: AIModelPort = new GeminiAdapter(process.env.GEMINI_API_KEY!);

// Use in use case
const story = await aiService.generateObject(
  getStoryPrompt({ genre: 'fantasy', characterName: 'Luna', childAge: 6, duration: 'medium' }),
  StoryResponseSchema,
  { temperature: 0.9 }
);
```
