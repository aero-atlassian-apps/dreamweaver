# Release 6: Sleepy Time

**Status**: `[ ] PENDING`
**Goal**: The app detects sleep cues and gracefully ends the story.

---

## Acceptance Criteria

1.  A "Sleep Indicator" (moon icon) is visible during playback.
2.  The indicator fills as sleep confidence increases.
3.  At high confidence, the UI dims and pace slows.
4.  Story fades to ambient sounds, then ends gracefully.

---

## Tasks

### Backend
- [ ] Create `domain/agents/SleepSentinelAgent.ts`
- [ ] Create `application/ports/AudioAnalyzerPort.ts`
- [ ] Implement silence/breathing detection logic
- [ ] Publish `SLEEP_CUE_DETECTED` event

### Frontend
- [ ] Build `SleepIndicator` component (moon icon + progress)
- [ ] Implement UI dimming (reduce brightness/contrast)
- [ ] Implement "Sleep Mode" color palette (deep grays)
- [ ] Story Player: fade audio to ambient sounds

### Testing
- [ ] Unit: `SleepSentinelAgent` with mock audio stream
- [ ] E2E: Simulate sleep cue, verify UI dims

---

## Definition of Done

- [ ] All tasks above are checked.
- [ ] Sleep detection triggers graceful story ending.
- [ ] Status in `README.md` updated to `[x] DELIVERED`.
