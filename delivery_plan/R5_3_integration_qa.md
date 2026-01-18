# Release 5.3: Integration & QA

**Status**: `[ ] PLANNED`
**Goal**: Complete all "Planned for" items from R1-R5 and achieve full E2E functionality.

---

## Context

Releases R1-R5 were marked as DELIVERED but left several tasks marked as "Planned for QA phase", "Planned for integration phase", or "Planned for voice integration phase". This release closes all those gaps to achieve a fully working, testable application.

> **Scope Boundary**: R5.3 does NOT include R6-R10 features (Sleep Sentinel, Conversations, Smart Suggestions, Grandma Mode, Dream Companions).

---

## Acceptance Criteria

1. **Voice Integration**: User can record voice, save to server, and stories use their voice for TTS.
2. **Story Persistence**: Stories are saved to DB and appear in Story History.
3. **Agent Integration**: Dashboard suggestion card is connected to real agent, clicking starts story generation.
4. **Event Publishing**: Story playback emits events through the event bus.
5. **E2E Tests**: All critical user flows have passing Playwright tests.

---

## Tasks

### 1. Backend Integration

#### Voice (from R3)
- [ ] Implement `POST /api/voice/upload` — Save voice sample to Supabase Storage
- [ ] Integrate `TextToSpeechPort` into `GenerateStoryUseCase` — Generate audio on story creation
- [ ] Store `VoiceProfile` reference in user record

#### Story Persistence (from R4)
- [ ] Implement `GET /api/stories` — List user's stories from SupabaseStoryRepository
- [ ] Verify `SupabaseStoryRepository.findByUserId` works with real DB

#### Agent/Events (from R5)
- [ ] Emit `STORY_BEAT_COMPLETED` events during playback
- [ ] Connect `BedtimeConductorAgent` to real child context (if available)

---

### 2. Frontend Integration

#### Voice (from R3)
- [ ] Connect `VoiceOnboardingPage` to `POST /api/voice/upload`
- [ ] Store `VoiceProfile` in React context after successful upload
- [ ] Show upload progress/success state

#### Story History (from R4)
- [ ] Connect `StoryHistoryPage` to `GET /api/stories`
- [ ] Display real stories from DB (not mock data)
- [ ] Handle empty state and loading state

#### Agent Dashboard (from R5)
- [ ] Wire `AgentSuggestionCard` on Dashboard to trigger `GenerateStoryUseCase`
- [ ] Remove hardcoded suggestion data in `DashboardPage.tsx`
- [ ] Connect "Start This Story" CTA to story generation flow

#### Audio Player (from R3)
- [ ] Ensure `AudioPlayer` plays actual audio URL from story entity
- [ ] Handle cases where audio URL is not yet available

---

### 3. Testing (QA Phase Items)

#### E2E Tests (Playwright)
- [ ] **Auth E2E**: Signup → Login → Dashboard redirect
- [ ] **Story E2E**: Generate Story → Save → Appear in History
- [ ] **Voice E2E**: Record Sample → Upload → Verify stored
- [ ] **Agent E2E**: Dashboard suggestion → Click → Story generates

#### Integration Tests
- [ ] `SupabaseStoryRepository`: Real CRUD operations
- [ ] `GeminiAIGateway`: Real API call (sandboxed/recorded)
- [ ] `GoogleTTSAdapter`: Minimal synthesis test

#### Unit Tests
- [ ] `BedtimeConductorAgent`: Goal state transitions
- [ ] `GoogleTTSAdapter`: Mocked audio generation

---

## Definition of Done

- [ ] All "Planned for X" items from R1-R5 are complete
- [ ] User can sign up, generate a story, and see it in history
- [ ] Voice recording is saved and used for TTS
- [ ] Dashboard shows dynamic agent suggestions
- [ ] All E2E tests pass
- [ ] All integration tests pass
- [ ] CI pipeline passes (`npm run lint`, `typecheck`, `test`, `build`)
- [ ] Production build verified

---

## Out of Scope (R6-R10)

The following features are explicitly NOT part of R5.3:

| Feature | Release |
|---------|---------|
| Sleep Sentinel (audio detection) | R6 |
| Child Conversations (interrupt/direct) | R7 |
| Ambient Context (weather/time) | R8 |
| Proactive Suggestions AI | R8 |
| Grandma Mode (secure sharing) | R9 |
| Dream Companions (gamification) | R10 |
| Weekly Time Capsule Email | R10 |

---

## Files Changed

### Modified
- `api/src/routes/voice.ts` — Complete upload endpoint
- `api/src/routes/story.ts` — Add GET list endpoint
- `api/src/application/use-cases/GenerateStoryUseCase.ts` — Integrate TTS
- `src/presentation/pages/DashboardPage.tsx` — Connect to real agent
- `src/presentation/pages/StoryHistoryPage.tsx` — Connect to real API
- `src/presentation/pages/VoiceOnboardingPage.tsx` — Connect to upload API
- `src/presentation/pages/StoryViewPage.tsx` — Connect AudioPlayer to real audio

### Created
- `e2e/auth.spec.ts` — Auth E2E tests
- `api/src/infrastructure/SupabaseStoryRepository.test.ts` — Integration tests
- `src/domain/agents/BedtimeConductorAgent.test.ts` — Unit tests
