# Release 8: Smart Suggestions (Super Agentic)

**Status**: `[ ] PENDING`
**Goal**: The agent proactively suggests content using Procedural Memory and Self-Correction.

---

## Acceptance Criteria

1.  **Reasoning Trace**: Suggestions explicitly state *why*: "I'm suggesting 'Space Bears' because it successfully induced sleep in < 10 mins last Tuesday (Procedural Memory)."
2.  **Procedural Memory**: The system learns *sequences* that work (e.g., "High-energy start -> Rapid tempo drop -> Silence").
3.  **Learning Loop (DPO)**: Uses **Direct Preference Optimization (DPO)** on "Completion Rates" and "Sleep Onset Time" to fine-tune the agent's internal model without manual rules.
4.  **Self-Correction**: If a suggestion is rejected ("No, not that one"), the agent immediately performs a **Reflection Step** to update its preference model before offering an alternative.

---

## Tasks

### Backend
- [ ] Implement **Direct Preference Optimization (DPO)** loop
- [ ] Upgrade `AgentMemoryPort` to support **Procedural Schemas**
- [ ] Implement **Reflection Agent** for failed suggestions

### Frontend
- [ ] "Why I picked this" tooltip (Reasoning Trace)
- [ ] Capture implicit negative signals (skip, volume down) as DPO penalties

### Testing
- [ ] Unit: DPO weight adjustment based on simulated feedback
- [ ] E2E: Reject suggestion -> Agent reflects -> Agent offers better alternative

---

## Definition of Done

- [ ] Suggestions improve over time (measurable by acceptance rate).
- [ ] Agent can explain its "winning strategy".
- [ ] Status in `README.md` updated to `[x] DELIVERED`.
