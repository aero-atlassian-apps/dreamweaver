# Release 6: Sleepy Time (Super Agentic)

**Status**: `[ ] PENDING`
**Goal**: The agent anticipates sleep cues using MCP tools and autonomous reasoning.

---

## Acceptance Criteria

1.  **MCP Integration**: The agent connects to "Sleep Sensor Tools" via the **Model Context Protocol (MCP)** standard, ensuring plug-and-play compatibility with future wearables.
2.  **Autonomous Decision**: The `SleepSentinelAgent` runs a **ReAct Loop** (Observe Audio -> Reason Confidence -> Act Fade) to decide interventions.
3.  **Vector Memory**: Uses **Semantic Memory** to recall "Calming Moments" that worked in previous sessions for this specific child.
4.  **Transparent Autonomy**: UI displays the Reasoning Trace: "Detected breathing rate drop (MCP) -> High Sleep Confidence (90%) -> Triggering specific lullaby."

---

## Tasks

### Backend
- [ ] Implement **MCP Server** for Audio/Sleep Tools
- [ ] Upgrade `SleepSentinelAgent` to use **ReAct Pattern**
- [ ] Integrate **Supabase pgvector** for Semantic Retrieval of calming assets
- [ ] Publish `SLEEP_DECISION_REASONING` events for transparency

### Frontend
- [ ] Build `SleepStructureVisualization` (shows the agent's sleep model state)
- [ ] Visual indicator for "Agent Listening via MCP"

### Testing
- [ ] Unit: Verify MCP Tool calling sequence
- [ ] E2E: Simulate high-confidence sleep signal -> Reasoning Trace log -> Audio Fade

---

## Definition of Done

- [ ] Agent uses standard MCP to access sensors.
- [ ] Decisions are explanatorily transparent.
- [ ] Status in `README.md` updated to `[x] DELIVERED`.
