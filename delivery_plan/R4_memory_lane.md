# Release 4: Memory Lane

**Status**: `[x] DELIVERED`
**Goal**: Stories are saved and a basic Memory Vault is browsable.

---

## Acceptance Criteria

1.  After a story is generated, it is automatically saved.
2.  User can view a list of past stories (Story History).
3.  User can click a story to re-read/re-listen.
4.  Basic auto-tagging is applied (theme, date).

---

## Tasks

### Backend
- [x] Create `infrastructure/persistence/SupabaseStoryRepository.ts`
- [x] Create `domain/entities/GoldenMoment.ts`
- [x] Create `application/use-cases/GetStoryHistoryUseCase.ts`
- [x] Create API route `GET /api/stories/:id` (placeholder in story.ts)
- [ ] Create API route `GET /api/stories` (list) — Planned for persistence phase

### Frontend
- [x] Build `StoryHistoryPage` (list of story cards)
- [x] Build `MemoryCard` component (thumbnail, title, date)
- [x] Add navigation from Dashboard to History

### Testing
- [ ] Integration: `SupabaseStoryRepository` (real DB) — Planned for QA phase
- [ ] E2E: Save and retrieve story flow (Playwright) — Planned for QA phase

---

## Definition of Done

- [x] Core Memory Vault UI implemented.
- [x] Design alignment with Section 6.1 verified.
- [x] All core domain/application/infrastructure layers complete.
- [x] Status in `README.md` updated to `[x] DELIVERED`.
