# Release 3: Voice of the Parent

**Status**: `[ ] PENDING`
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
- [ ] Create `domain/entities/VoiceProfile.ts`
- [ ] Create `application/ports/TextToSpeechPort.ts`
- [ ] Create `infrastructure/adapters/GoogleTTSAdapter.ts` (Chirp 3)
- [ ] Create API route `POST /api/voice/upload` (save sample)
- [ ] Integrate TTS into `GenerateStoryUseCase`

### Frontend
- [ ] Build `VoiceOnboardingPage` (record + preview)
- [ ] Build `AudioPlayer` component (play, pause, seek, waveform)
- [ ] Integrate `AudioPlayer` into `StoryViewPage`
- [ ] Store `VoiceProfile` in user context

### Testing
- [ ] Unit: `GoogleTTSAdapter` with mocked audio
- [ ] E2E: Full story with audio playback (Playwright)

---

## Definition of Done

- [ ] All tasks above are checked.
- [ ] User can hear a story in their cloned voice.
- [ ] Status in `README.md` updated to `[x] DELIVERED`.
