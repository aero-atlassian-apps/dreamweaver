# Prompt Template Example: Story Generation

This example demonstrates the recommended pattern for managing LLM prompts.

## Prompt Template

```typescript
// src/prompts/features/story-generation.ts
import { z } from 'zod';

export const StoryPromptSchema = z.object({
  genre: z.enum(['adventure', 'fantasy', 'bedtime', 'educational']),
  characterName: z.string().min(1),
  childAge: z.number().int().min(2).max(12),
  duration: z.enum(['short', 'medium', 'long']),
  themes: z.array(z.string()).optional(),
});

export type StoryPromptInput = z.infer<typeof StoryPromptSchema>;

export const getStorySystemPrompt = () => `
You are DreamWeaver, a world-class children's storyteller.
Your stories are magical, age-appropriate, and designed to help children wind down for sleep.

STYLE GUIDELINES:
- Use simple, vivid language appropriate for the child's age
- Include sensory details (sounds, textures, colors)
- Build anticipation but resolve gently
- End with a peaceful, sleepy conclusion

SAFETY GUARDRAILS:
- No scary or violent content
- No complex moral dilemmas
- Characters always find resolution
- Never reference real-world dangers
`;

export const getStoryPrompt = (input: StoryPromptInput): string => {
  const validatedInput = StoryPromptSchema.parse(input);
  
  return `
<task>
Create a ${validatedInput.duration} ${validatedInput.genre} story for a ${validatedInput.childAge}-year-old child.
The main character's name is "${validatedInput.characterName}".
${validatedInput.themes?.length ? `Incorporate these themes: ${validatedInput.themes.join(', ')}` : ''}
</task>

<output_format>
Return a JSON object matching this schema:
{
  "title": "string",
  "chapters": [
    {
      "title": "string", 
      "content": "string (2-4 paragraphs)",
      "audioHint": "string (mood for TTS: 'gentle', 'excited', 'whispered')"
    }
  ],
  "sleepScore": number (1-10, how sleep-inducing)
}
</output_format>
`;
};
```

## Key Patterns Used

1. **Type-safe inputs** - Zod schema validates all parameters
2. **Separated system prompt** - Persona/guardrails isolated
3. **XML-style delimiters** - Clear function sections in prompt
4. **Output specification** - Explicit JSON schema at the end
5. **Context injection** - Dynamic values clearly interpolated
