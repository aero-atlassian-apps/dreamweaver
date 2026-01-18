# Release 5.2: Convergence & Integration

**Status**: `[ ] PLANNED`
**Goal**: Integrate all isolated features from R1-R5 into a cohesive, fully functioning application with complete test coverage.

---

## Context
Previous releases (R1-R5) implemented core features in isolation with some tasks deferred to "Integration" or "QA" phases. This release bridges those gaps to ensure a working, polished product.

---

## Acceptance Criteria
1.  **Auth**: Full end-to-end signup and login flows work against real Supabase.
2.  **Story Generation**: User can generate a story that is *actually* saved to the DB and appears in their history.
3.  **Voice**: User can upload a voice sample, and it is used to generate audio for stories.
4.  **Agent**: The Dashboard suggestion card functions and leads to a story generation flow.
5.  **Quality**: All E2E tests pass, and no "mocked" data remains in critical user flows.

---

## Tasks

### 1. Backend Integration (Bridging the Gaps)
- [ ] **Voice**: Implement `POST /api/voice/upload` to upload/save voice samples.
- [ ] **Voice**: Integrate `TextToSpeechPort` into `GenerateStoryUseCase` (generate audio on story creation).
- [ ] **Memory**: Implement `GET /api/stories` endpoint for the History page.
- [ ] **Data**: Implement `SupabaseStoryRepository.findRecent` and `findByUserId` properly.
- [ ] **Events**: Emit `STORY_BEAT_COMPLETED` events during playback.

### 2. Frontend Integration (Connecting UI to Real Data)
- [ ] **Voice**: Connect `VoiceOnboardingPage` to the new upload endpoint.
- [ ] **Memory**: Connect `StoryHistoryPage` to the `GET /api/stories` endpoint.
- [ ] **Conductor**: Wire up `AgentSuggestionCard` on Dashboard to trigger `GenerateStoryUseCase`.
- [ ] **Player**: Ensure `AudioPlayer` plays the actual URL from the story entity.

### 3. Testing (Closing the Loops)
#### Integration Tests (Real/Sandboxed Infrastructure)
- [ ] `SupabaseStoryRepository`: Test real CRUD operations against Supabase.
- [ ] `GeminiAIGateway`: Test real calls (with recorded/vcr responses or strict sandboxing).
- [ ] `GoogleTTSAdapter`: Test minimal synthesis call.

#### End-to-End Tests (Playwright)
- [ ] **Auth**: Signup -> Login -> Dashboard.
- [ ] **Story**: Generate Story -> Save -> Appear in History.
- [ ] **Voice**: Record Sample -> Generate Story -> Play Audio.
- [ ] **Agent**: valid suggestion -> click -> story starts.

---

## Definition of Done
- [ ] All "Planned for X" and deferred tasks from R1-R5 are marked complete.
- [ ] Application is fully functional from a fresh user signup to story playback.
- [ ] CI/CD pipeline passes including new Integration and E2E tests.
- [ ] Production build verified.
