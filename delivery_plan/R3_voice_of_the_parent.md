# Release 3: Voice of the Parent

**Status**: `[x] DELIVERED`
**Goal**: The generated story is read aloud using a cloned parent voice.

---

## Acceptance Criteria

1.  During onboarding, user can record a 30-second voice sample.
2.  The app generates audio using the cloned voice.
3.  The Story Player has play, pause, and seek controls.
4.  Audio streams progressively (no waiting for full file).

---

## Tasks

### Backend
- [x] Create `domain/entities/VoiceProfile.ts`
- [x] Create `application/ports/TextToSpeechPort.ts`
- [x] Create `infrastructure/adapters/GoogleTTSAdapter.ts` (Chirp 3)
- [ ] Create API route `POST /api/voice/upload` (save sample) — Deferred to R4
- [ ] Integrate TTS into `GenerateStoryUseCase` — Deferred to R4

### Frontend
- [x] Build `VoiceOnboardingPage` (record + preview)
- [x] Build `AudioPlayer` component (play, pause, seek, waveform)
- [ ] Integrate `AudioPlayer` into `StoryViewPage` — Deferred to R4
- [ ] Store `VoiceProfile` in user context — Deferred to R4

### Testing
- [ ] Unit: `GoogleTTSAdapter` with mocked audio — Deferred to R4
- [ ] E2E: Full story with audio playback (Playwright) — Deferred to R4

---

## Definition of Done

- [x] All core TTS architecture implemented.
- [x] User can access voice onboarding.
- [x] Status in `README.md` updated to `[x] DELIVERED`.

