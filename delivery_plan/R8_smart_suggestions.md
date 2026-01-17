# Release 8: Smart Suggestions

**Status**: `[ ] PENDING`
**Goal**: The agent proactively suggests stories based on context.

---

## Acceptance Criteria

1.  Suggestion Card shows *why* this story was chosen.
2.  Agent considers time of day, weather, and recent child questions.
3.  "Again!" button generates a variation of the last story.
4.  Implicit signals (completion rate) are captured for learning.

---

## Tasks

### Backend
- [ ] Create `domain/value-objects/AmbientContext.ts`
- [ ] Create `infrastructure/adapters/OpenWeatherMapAdapter.ts`
- [ ] Create `domain/value-objects/PreferencePair.ts`
- [ ] Create `application/use-cases/CaptureFeedbackUseCase.ts`
- [ ] Implement "Again!" variation logic in `GenerateStoryUseCase`

### Frontend
- [ ] Enhance `AgentSuggestionCard` with reasoning text
- [ ] Add "Again!" button to Story Player
- [ ] Capture implicit signals (completion %, interruption count)

### Testing
- [ ] Unit: Preference pair storage
- [ ] E2E: "Again!" generates a variation

---

## Definition of Done

- [ ] All tasks above are checked.
- [ ] Suggestions are context-aware and explain reasoning.
- [ ] Status in `README.md` updated to `[x] DELIVERED`.
