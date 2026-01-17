# Release 2: Static Story

**Status**: `[ ] PENDING`
**Goal**: A user can request a story based on a theme and see it rendered.

---

## Acceptance Criteria

1.  User can select a theme (e.g., "Space", "Animals").
2.  User can click "Generate Story".
3.  A loading indicator is shown during generation.
4.  The generated story text is displayed in a readable format.
5.  Story title and content are visible.

---

## Tasks

### Backend (Clean Architecture)
- [ ] Create `domain/entities/Story.ts`
- [ ] Create `domain/value-objects/StoryContent.ts`
- [ ] Create `application/ports/AIServicePort.ts`
- [ ] Create `application/ports/StoryRepositoryPort.ts`
- [ ] Create `application/use-cases/GenerateStoryUseCase.ts`
- [ ] Create `infrastructure/adapters/GeminiAIGateway.ts`
- [ ] Create API route `POST /api/stories/generate`

### Frontend
- [ ] Build `StoryRequestPage` (theme picker + generate button)
- [ ] Build `StoryViewPage` (title + content display)
- [ ] Implement loading state with animated indicator
- [ ] Route: `/stories/new` → `/stories/:id`

### Testing
- [ ] Unit: `GenerateStoryUseCase` with mocked AI
- [ ] Integration: `GeminiAIGateway` (real API call, sandboxed)
- [ ] E2E: Generate story flow (Playwright)

---

## Definition of Done

- [ ] All tasks above are checked.
- [ ] Unit and E2E tests pass.
- [ ] A story can be generated and viewed end-to-end.
- [ ] Status in `README.md` updated to `[x] DELIVERED`.
