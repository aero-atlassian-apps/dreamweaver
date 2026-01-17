# Release 5: The Conductor

**Status**: `[ ] PENDING`
**Goal**: The Bedtime Conductor orchestrates sessions with active goals.

---

## Acceptance Criteria

1.  The Dashboard shows an "Agent Suggestion Card".
2.  The suggestion explains *why* this story was chosen.
3.  The agent has active goals (e.g., "Child asleep in 15m").
4.  Events are published when story beats occur.

---

## Tasks

### Backend
- [ ] Create `infrastructure/events/InMemoryEventBus.ts`
- [ ] Create `application/ports/EventBusPort.ts`
- [ ] Create `domain/entities/ActiveGoal.ts`
- [ ] Create `domain/agents/BedtimeConductorAgent.ts`
- [ ] Publish `STORY_BEAT_COMPLETED` events

### Frontend
- [ ] Build `AgentSuggestionCard` component
- [ ] Display card on Dashboard with "Start This Story" CTA
- [ ] Show reasoning text (e.g., "Emma asked about plants...")

### Testing
- [ ] Unit: `InMemoryEventBus` (Pub/Sub)
- [ ] Unit: `BedtimeConductorAgent` goal transitions
- [ ] E2E: Suggestion card renders correctly

---

## Definition of Done

- [ ] All tasks above are checked.
- [ ] Agent suggestions are visible on Dashboard.
- [ ] Status in `README.md` updated to `[x] DELIVERED`.
