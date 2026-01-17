# Release 7: Conversations

**Status**: `[ ] PENDING`
**Goal**: The child can interrupt and direct the story.

---

## Acceptance Criteria

1.  Microphone is active during story playback.
2.  When child speaks, story pauses and transcript is shown.
3.  AI classifies intent (Question, Direction, Participation, Distress).
4.  AI answers in character and story resumes.

---

## Tasks

### Backend
- [ ] Create `domain/services/ConversationalStoryEngine.ts`
- [ ] Create `application/use-cases/HandleChildInterruptUseCase.ts`
- [ ] Implement intent classification (QUESTION, DIRECTION, etc.)
- [ ] Publish `CHILD_INTERRUPT` event

### Frontend
- [ ] Enable microphone input on Story Player
- [ ] Build `ChildBubble` component (shows child's transcript)
- [ ] Build `AgentResponseBubble` (shows AI's woven answer)
- [ ] Implement pause/resume audio flow

### Testing
- [ ] Unit: `ConversationalStoryEngine` intent classification
- [ ] E2E: Child asks "What's that star?", AI responds

---

## Definition of Done

- [ ] All tasks above are checked.
- [ ] Child can interact with story in real-time.
- [ ] Status in `README.md` updated to `[x] DELIVERED`.
