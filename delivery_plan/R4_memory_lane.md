# Release 4: Memory Lane

**Status**: `[ ] PENDING`
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
- [ ] Create `infrastructure/persistence/SupabaseStoryRepository.ts`
- [ ] Create `domain/entities/GoldenMoment.ts`
- [ ] Create `application/use-cases/GetStoryHistoryUseCase.ts`
- [ ] Create API route `GET /api/stories` (list)
- [ ] Create API route `GET /api/stories/:id` (detail)

### Frontend
- [ ] Build `StoryHistoryPage` (list of story cards)
- [ ] Build `MemoryCard` component (thumbnail, title, date)
- [ ] Add navigation from Dashboard to History

### Testing
- [ ] Integration: `SupabaseStoryRepository` (real DB)
- [ ] E2E: Save and retrieve story flow (Playwright)

---

## Definition of Done

- [ ] All tasks above are checked.
- [ ] Stories persist across sessions.
- [ ] Status in `README.md` updated to `[x] DELIVERED`.
