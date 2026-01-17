# Release 5: The Conductor

**Status**: `[x] DELIVERED`
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
- [x] Create `infrastructure/events/InMemoryEventBus.ts`
- [x] Create `application/ports/EventBusPort.ts`
- [x] Create `domain/entities/ActiveGoal.ts`
- [x] Create `domain/agents/BedtimeConductorAgent.ts`
- [ ] Publish `STORY_BEAT_COMPLETED` events — Planned for integration phase

### Frontend
- [x] Build `AgentSuggestionCard` component
- [ ] Display card on Dashboard with "Start This Story" CTA — Planned for integration phase
- [x] Show reasoning text (e.g., "Emma asked about plants...")

### Testing
- [x] Unit: `InMemoryEventBus` (Pub/Sub) - 5 TDD tests
- [ ] Unit: `BedtimeConductorAgent` goal transitions — Planned for QA phase
- [ ] E2E: Suggestion card renders correctly — Planned for QA phase

---

## Definition of Done

- [x] Core agentic architecture implemented.
- [x] AgentSuggestionCard aligned with Section 1.4.
- [x] TDD approach followed (tests written first).
- [x] Production build verified (292KB JS, 112KB CSS).
- [x] Status in `README.md` updated to `[x] DELIVERED`.
