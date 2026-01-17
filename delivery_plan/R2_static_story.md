# Release 2: Static Story

**Status**: `[x] DELIVERED`
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
- [x] Create `domain/entities/Story.ts`
- [x] Create `domain/value-objects/StoryContent.ts`
- [x] Create `application/ports/AIServicePort.ts`
- [x] Create `application/ports/StoryRepositoryPort.ts`
- [x] Create `application/use-cases/GenerateStoryUseCase.ts`
- [x] Create `infrastructure/adapters/GeminiAIGateway.ts`
- [x] Create API route `POST /api/stories/generate`

### Frontend
- [x] Build `StoryRequestPage` (theme picker + generate button)
- [x] Build `StoryViewPage` (title + content display)
- [x] Implement loading state with animated indicator
- [x] Route: `/stories/new` → `/stories/:id`

### Testing
- [x] Unit: `GenerateStoryUseCase` with mocked AI
- [ ] Integration: `GeminiAIGateway` (real API call, sandboxed) — Planned for QA phase
- [ ] E2E: Generate story flow (Playwright) — Planned for QA phase

---

## Definition of Done

- [x] Story generation flow implemented.
- [x] Unit tests pass.
- [x] A story can be generated and viewed end-to-end.
- [x] Status in `README.md` updated to `[x] DELIVERED`.
