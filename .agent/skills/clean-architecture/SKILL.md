---
name: clean-architecture
description: >
  Use this skill when creating services following Clean Architecture, implementing
  ports and adapters patterns, designing use cases, setting up dependency injection,
  or ensuring proper layer separation (Domain → Application → Infrastructure → Presentation).
  Triggers on: hexagonal architecture, DDD, dependency inversion, repository pattern.
---

# Clean Architecture Implementation

This skill provides detailed guidance for implementing Clean Architecture in TypeScript/JavaScript projects, following Domain-Driven Design principles.

## When to use this skill

- When creating new services or modules following Clean Architecture
- When refactoring existing code to follow proper layer separation
- When implementing ports and adapters patterns
- When designing use cases and domain services
- When setting up dependency injection

## Core Principles

### Layer Structure

```
src/
├── domain/           # Core business logic (no external dependencies)
│   ├── entities/     # Business objects with behavior
│   ├── value-objects/# Immutable typed values
│   └── services/     # Domain logic that doesn't fit entities
├── application/      # Use cases and orchestration
│   ├── use-cases/    # Application-specific business rules
│   └── ports/        # Interfaces for external services
├── infrastructure/   # External adapters and implementations
│   ├── adapters/     # Implementations of ports
│   ├── persistence/  # Database implementations
│   └── external/     # Third-party service adapters
└── presentation/     # UI layer (React components, API routes)
```

### The Dependency Rule

> Dependencies ALWAYS point inward. Inner layers know nothing about outer layers.

```
Presentation → Application → Domain
     ↓              ↓
Infrastructure ←───┘
```

## How to implement

### 1. Start with the Domain

Define entities and value objects first:

```typescript
// domain/entities/Story.ts
import { z } from 'zod';

export const StorySchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(5).max(100),
  status: z.enum(['draft', 'published', 'archived']),
});

export class Story {
  private constructor(
    readonly id: StoryId,
    readonly title: string,
    readonly content: StoryContent,
    readonly childProfile: ChildProfileId,
    private status: StoryStatus,
  ) {}

  static create(props: CreateStoryProps): Result<Story, ValidationError> {
    const result = StorySchema.safeParse(props);
    if (!result.success) {
      return Result.fail(new ValidationError(result.error));
    }
    return Result.ok(new Story(/* ... */));
  }
  
  // ... methods
}
```

### 1.1 Domain Events (Decoupled Side Effects)

Don't trigger side effects (like sending emails) directly in entities or use cases. Use Domain Events.

```typescript
// domain/events/StoryCompletedEvent.ts
export class StoryCompletedEvent implements DomainEvent {
  constructor(public readonly story: Story) {}
}

// domain/entities/Story.ts
complete(): void {
  this.status = StoryStatus.Completed;
  this.addDomainEvent(new StoryCompletedEvent(this));
}
```

### 2. Define Ports (Interfaces)

Ports define contracts for external services:

```typescript
// application/ports/StoryRepositoryPort.ts
export interface StoryRepositoryPort {
  findById(id: StoryId): Promise<Story | null>;
  findByChild(childId: ChildProfileId): Promise<Story[]>;
  save(story: Story): Promise<void>;
}

// application/ports/TextToSpeechPort.ts
export interface TextToSpeechPort {
  synthesize(text: string, voice: VoiceProfile): Promise<AudioBuffer>;
}
```

### 3. Create Use Cases

Use cases orchestrate domain logic:

```typescript
// application/use-cases/GenerateStoryUseCase.ts
export class GenerateStoryUseCase {
  constructor(
    private readonly storyRepository: StoryRepositoryPort,
    private readonly aiService: AIServicePort,
    private readonly tts: TextToSpeechPort,
  ) {}

  async execute(request: GenerateStoryRequest): Promise<GenerateStoryResponse> {
    // 1. Validate request
    // 2. Orchestrate domain services
    // 3. Return response DTO
  }
}
```

### 4. Implement Adapters

Adapters implement ports for specific technologies:

```typescript
// infrastructure/adapters/SupabaseStoryRepository.ts
export class SupabaseStoryRepository implements StoryRepositoryPort {
  constructor(private readonly client: SupabaseClient) {}

  async findById(id: StoryId): Promise<Story | null> {
    const { data } = await this.client
      .from('stories')
      .select('*')
      .eq('id', id.value)
      .single();
    
    return data ? StoryMapper.toDomain(data) : null;
  }
}
```

### 5. Wire Up with Dependency Injection

```typescript
// infrastructure/di/container.ts
export function createContainer(): Container {
  const supabase = createSupabaseClient();
  
  return {
    storyRepository: new SupabaseStoryRepository(supabase),
    generateStory: new GenerateStoryUseCase(
      new SupabaseStoryRepository(supabase),
      new GeminiAIService(geminiClient),
      new GoogleCloudTTS(ttsClient),
    ),
  };
}
```

## Anti-patterns to Avoid

1. **Leaking framework details into domain** - Never import Express, React, or database clients in domain layer
2. **Anemic domain models** - Entities should have behavior, not just data
3. **Use case bloat** - Keep use cases focused; split if doing too much
4. **Port pollution** - Don't create a port for every possible operation
5. **Skipping the application layer** - Presentation should never call domain directly

## Testing Strategy

- **Domain**: Pure unit tests, no mocks needed
- **Application**: Mock ports, test orchestration logic
- **Infrastructure**: Integration tests with real services (use test containers)
- **Presentation**: Component tests with mocked use cases

## Resources

- [Architecture Diagram](resources/clean-arch.mermaid)
- [Docs Index](docs/00-readme.md)
- Templates:
    - [Use Case Template](resources/templates/UseCase.ts.hbs)
    - [Port Interface Template](resources/templates/Port.ts.hbs)
    - [Adapter Template](resources/templates/Adapter.ts.hbs)
