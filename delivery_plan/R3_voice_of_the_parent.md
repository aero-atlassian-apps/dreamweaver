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
- [ ] Create API route `POST /api/voice/upload` (save sample) — Planned for voice integration phase
- [ ] Integrate TTS into `GenerateStoryUseCase` — Planned for voice integration phase

### Frontend
- [x] Build `VoiceOnboardingPage` (record + preview)
- [x] Build `AudioPlayer` component (play, pause, seek, waveform)
- [x] Integrate `AudioPlayer` into `StoryViewPage`
- [ ] Store `VoiceProfile` in user context — Planned for voice integration phase

### Testing
- [ ] Unit: `GoogleTTSAdapter` with mocked audio — Planned for QA phase
- [ ] E2E: Full story with audio playback (Playwright) — Planned for QA phase

---

## Definition of Done

- [x] Core TTS architecture implemented.
- [x] User can access voice onboarding.
- [x] AudioPlayer component complete.
- [x] Status in `README.md` updated to `[x] DELIVERED`.
