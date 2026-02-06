# 08. Solution Architecture

## High-Level Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                                 │
│  │   PWA   │  │   iOS   │  │ Android │    (Future native apps)         │
│  └────┬────┘  └────┬────┘  └────┬────┘                                 │
│       └──────────┬─┴───────────┘                                        │
│                  ▼                                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                          EDGE LAYER                                      │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Vercel (Static + Functions)    │  Cloudflare Worker (WebSocket)  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│                        APPLICATION LAYER                                 │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  Hono (REST API)  │  Use Cases  │  Domain Services                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│                      INFRASTRUCTURE LAYER                                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │  Supabase  │  │   Gemini   │  │ Google TTS │  │   Redis    │        │
│  │  (Postgres)│  │  3 Pro/Flash│  │  (Chirp 3) │  │  (Cache)   │        │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Clean Architecture Layers

### 1. Domain Layer (`src/domain/`)

Enterprise business rules that never change regardless of DB or UI.

```typescript
// Entity example
class Story {
  // Business rule: story cannot be "Completed" if not started
  complete(): Result<void> {
    if (this.status !== 'in_progress') {
      return err(new Error('Cannot complete story not in progress'));
    }
    this.status = 'completed';
    return ok(undefined);
  }
}
```

### 2. Application Layer (`src/application/`)

Use cases orchestrating domain objects.

```typescript
// Use case example
class GenerateStoryUseCase {
  async execute(input: GenerateStoryInput): Promise<Story> {
    const story = await this.storyRepository.create(input);
    const content = await this.aiService.generateStory(input);
    story.setContent(content);
    return story;
  }
}
```

### 3. Infrastructure Layer (`src/infrastructure/`)

External adapters (databases, AI, TTS).

```typescript
// Adapter example
class SupabaseStoryRepository implements StoryRepository {
  async create(input: CreateStoryInput): Promise<Story> {
    const { data } = await this.supabase.from('stories').insert(input);
    return Story.fromRow(data);
  }
}
```

### 4. Presentation Layer (`api/routes/`)

HTTP routes, request validation, response formatting.

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Hono over Express** | Web-standard APIs, edge-ready |
| **Supabase over Firebase** | Postgres + pgvector for RAG |
| **Cloudflare for WS** | Vercel Functions don't support WS |
| **Event Bus** | Decoupled agent communication |
