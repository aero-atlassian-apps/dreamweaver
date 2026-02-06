# 06. Agentic AI Architecture

## What Makes DreamWeaver Truly Agentic

### LLM Wrapper vs. Agentic AI

| Characteristic | LLM Wrapper | DreamWeaver (Agentic) |
|----------------|-------------|----------------------|
| **Trigger** | User command | Context + User OR Autonomous |
| **Memory** | Session-only | Persistent family context |
| **Decision-making** | None (execute prompt) | Goal-directed with trade-offs |
| **Learning** | None | Active preference adaptation |
| **Proactivity** | Never | Suggests, warns, anticipates |

---

## Agent Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       BEDTIME CONDUCTOR                                  │
│                   (META-AGENT: Goal-Directed)                           │
│                                                                         │
│  Active Goals:                                                          │
│  • Child asleep in optimal time window                                  │
│  • Capture 1+ golden moments                                            │
│  • Reduce parent bedtime stress                                         │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┬───────────────────┐
         ▼                   ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  STORY WEAVER   │ │  VOICE ARTISAN  │ │ MEMORY CURATOR  │ │ SLEEP SENTINEL  │
│    (Agent)      │ │    (Agent)      │ │    (Agent)      │ │    (Agent)      │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│ Goals:          │ │ Goals:          │ │ Goals:          │ │ Goals:          │
│ • Engaging but  │ │ • Sound like    │ │ • Detect moments│ │ • Detect sleep  │
│   calming       │ │   parent        │ │ • Build context │ │   cues          │
│ • Age-right     │ │ • Match energy  │ │ • Surface gems  │ │ • Signal pacing │
│ • Personalized  │ │ • Soothing pace │ │ • Weekly digest │ │ • End gracefully│
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
         ▲                   ▲                   ▲                   ▲
         └───────────────────┴───────────────────┴───────────────────┘
                              Message Bus (Real-time)
```

---

## Agent Communication

Agents communicate via an **Event Bus**, not direct method calls:

```typescript
interface AgentMessage {
  source: AgentId;
  type: 'SLEEP_CUE' | 'CHILD_INTERRUPT' | 'STORY_BEAT' | 'GOLDEN_MOMENT';
  payload: unknown;
  timestamp: Date;
}
```

**Event Flow Example:**
1. Sleep Sentinel detects slow breathing → publishes `SLEEP_CUE`
2. Story Weaver receives event → begins gentle wrap-up
3. Voice Artisan receives event → slows pacing, softens tone
4. Parent Dashboard receives event → UI dims, shows "Sleeping 🌙"

---

## Autonomy Spectrum

```
Level 0: No autonomy (execute exactly what user says)
         ↓
Level 1: Suggestions (offer options, user decides)        ← v1/v2 were here
         ↓
Level 2: Defaults + Override (agent decides, user can veto) ← vFinal target
         ↓
Level 3: Transparent autonomy (agent acts, explains after)
```

**Current Target: Level 2**

The agent suggests: *"Tonight I'm thinking Emma would love 'The Moon Garden'—she asked about plants today. Shall I begin?"*

Parent can override or add constraints.

---

## Ambient Context

Agent considers environmental context without user telling it:

| Context | Example | Story Adaptation |
|---------|---------|------------------|
| Time | 9:30 PM | Shorter story |
| Weather | Rainy | Cozy cave stories |
| Recent events | New pet | Weave pet into story |
| Child questions | Asked about stars | Space theme |
