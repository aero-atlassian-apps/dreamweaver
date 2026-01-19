# Release 7: Conversations (Super Agentic)

**Status**: `[ ] PENDING`
**Goal**: The child collborates with the story via full ReAct Orchestration.

---

## Acceptance Criteria

1.  **ReAct Orchestrator**: The backend uses a rigorous **Reason-Act-Observe** loop. Intent classification is just step 1; the agent then *Actions* (Checks Memory for "Favorite Characters") before *Observing* result and *Reasoning* the final response.
2.  **Episodic Memory**: The agent recalls *specific past interactions* (e.g., "Last time you asked about the moon, we said it was made of cheese. Do you remember?").
3.  **Active Listening**: The agent differentiates between "Background Noise" and "Intentful Speech" using multi-modal inputs.
4.  **Transparency**: The "Conversation Bubble" UI shows the agent's thought process (e.g., "Checking memory for previous moon references...").

---

## Tasks

### Backend
- [ ] Implement **LangGraph-style Orchestration** (Graph of Thought)
- [ ] Connect `ConversationalStoryEngine` to **AgentMemoryPort** (Episodic)
- [ ] Upgrade Intent Classifier to **ReAct Loop**

### Frontend
- [ ] `ReasoningBubble` component (shows "Thinking..." with transparency toggle)
- [ ] Interactive Transcript with "Memory Highlights" (links to past context)

### Testing
- [ ] Unit: Multi-turn conversation with memory recall
- [ ] E2E: Child asks a question referencing a previous session -> Agent recalls relevant fact

---

## Definition of Done

- [ ] Conversations feel continuous across sessions (Episodic Memory).
- [ ] Reasoning is transparent to the parent.
- [ ] Status in `README.md` updated to `[x] DELIVERED`.
