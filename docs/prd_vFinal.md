# DreamWeaver PRD vFinal

## Product Requirement Document — Agentic AI Edition

| Field | Value |
|-------|-------|
| **Product Name** | DreamWeaver |
| **Codename** | BedtimeAI |
| **Version** | Final (YC-Ready) |
| **Last Updated** | January 2026 |
| **Status** | Ready for Implementation |

---

## 0. Preface: Why This PRD Exists

> [!IMPORTANT]
> **This document supersedes PRD v1 and v2.** It combines the emotional vision of v1 with the technical discipline of v2, while adding what BOTH were missing: **TRUE AGENTIC CAPABILITIES**.

### The Problem with Previous Versions

| Version | Strength | Fatal Flaw |
|---------|----------|------------|
| **v1** | Emotional resonance, user personas | Technically vague, no FinOps |
| **v2** | Clean Architecture, FinOps | "Agentic" in name only — actually just orchestration |

**The Hard Truth:** A system that runs 7 parallel LLM calls (AoT decomposition) and plays audio is NOT agentic. It's a sophisticated **LLM Wrapper**.

### What Makes This Version Different

This PRD defines a system where the AI:
1. **Has Goals** — Not just tasks, but persistent adaptive objectives
2. **Has Memory** — Not just storage, but active contextual recall
3. **Has Agency** — Makes decisions without explicit user prompts
4. **Learns** — Improves from interaction, not just from training data
5. **Anticipates** — Proactively surfaces value before user asks

---

## 1. Executive Summary

### Vision (Refined)

DreamWeaver is a **family AI companion** that actively participates in the bedtime ritual—listening, learning, anticipating, and creating moments that matter. It doesn't wait for commands; it understands context and takes initiative.

### Mission

Transform passive screen time into an adaptive, emotionally intelligent bedtime experience that strengthens family bonds and captures developmental milestones automatically.

### Value Proposition (Sharpened)

> "The AI that knows your family—when your child is tired, what story will spark joy tonight, and why Tuesday bedtimes are harder than Fridays. It acts before you ask."

### What's New in vFinal

- **True Agentic Behavior**: Proactive, goal-directed, and context-aware
- **Conversational Child Interaction**: Child can interrupt, ask questions, direct the story
- **Ambient Intelligence**: Time, weather, recent events inform story selection
- **Learning Loop**: DPO-style preference learning from family signals
- **Sleep Intelligence**: Detects sleep cues, adjusts story pacing in real-time
- **Golden Moment Detection**: Identifies & auto-preserves developmental milestones
- **Family Graph**: Multi-caregiver coordination with shared context
- **Grandma Mode**: Secure, one-tap story sharing with emotional hook

---

## 2. The Agentic Difference

### 2.1 LLM Wrapper vs. Agentic AI

| Characteristic | LLM Wrapper | DreamWeaver (Agentic) |
|----------------|-------------|----------------------|
| **Trigger** | User command | Context + User OR Autonomous |
| **Memory** | Session-only | Persistent family context |
| **Decision-making** | None (execute prompt) | Goal-directed with trade-offs |
| **Learning** | None | Active preference adaptation |
| **Proactivity** | Never | Suggests, warns, anticipates |
| **Feedback Loop** | Star ratings | Implicit signals (completion, interruptions, sleep time) |

### 2.2 Agent Goals (Not Tasks)

The Bedtime Conductor maintains **active goals**, not just a task queue:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ACTIVE GOALS (per session)                        │
├─────────────────────────────────────────────────────────────────────────┤
│  1. EMOTIONAL: Strengthen parent-child bond tonight                      │
│  2. PHYSIOLOGICAL: Child asleep within 15 minutes                       │
│  3. DEVELOPMENTAL: One learning moment (vocabulary, concept)            │
│  4. MEMORY: Capture at least 1 Golden Moment                            │
│  5. SATISFACTION: Parent feels less stressed than before story          │
└─────────────────────────────────────────────────────────────────────────┘
```

Goals can **conflict** (excitement vs. sleep) — the agent makes **trade-offs** based on context:
- Time: 7:30pm → more educational, 9:30pm → pure calm
- Child energy: high → gentle story, low → skip to comfort ending
- Parent energy (detected from voice): exhausted → shortest happy path

### 2.3 The Autonomy Spectrum

```
Level 0: No autonomy (execute exactly what user says)
         ↓
Level 1: Suggestions (offer options, user decides)         ← v1/v2 were here
         ↓
Level 2: Defaults + Override (agent decides, user can veto) ← vFinal target
         ↓
Level 3: Transparent autonomy (agent acts, explains after)
         ↓
Level 4: Full autonomy (agent manages domain without user)
```

**vFinal Target: Level 2** — Agent makes story choice, parent sees "Tonight I'm thinking Emma would love 'The Moon Garden'—she asked about plants today. Shall I begin?" Parent can override or add constraints.

---

## 3. Core Agentic Architecture

### 3.1 Agent Hierarchy (Refined)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       BEDTIME CONDUCTOR                                  │
│                   (META-AGENT: Goal-Directed)                           │
│                                                                         │
│  Active Goals:                                                          │
│  • Child asleep in optimal time window                                  │
│  • Capture 1+ golden moments                                            │
│  • Reduce parent bedtime stress                                         │
│                                                                         │
│  Context Window:                                                        │
│  • Time of day, day of week, recent events                              │
│  • Child's questions from past 7 days                                   │
│  • Parent's voice energy (live analysis)                                │
│  • Story preferences (implicit signals)                                 │
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
│                 │ │                 │ │                 │ │                 │
│ Listens to:     │ │ Listens to:     │ │ Listens to:     │ │ Listens to:     │
│ • Sleep Sentinel│ │ • Child energy  │ │ • Transcription │ │ • Audio stream  │
│ • Child input   │ │ • Sleep cues    │ │ • Emotions      │ │ • Silence gaps  │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
         ▲                   ▲                   ▲                   ▲
         └───────────────────┴───────────────────┴───────────────────┘
                              Message Bus (Real-time)
```

### 3.2 NEW: Sleep Sentinel Agent

**Why This Is Critical**: A bedtime product that doesn't know when the child is asleep is broken.

```typescript
// Domain Service
class SleepSentinelAgent implements AgentPort {
  private readonly sleepCueDetectors: SleepCueDetector[];
  
  constructor(
    private readonly audioAnalyzer: AudioAnalyzerPort,
    private readonly movementDetector: MovementDetectorPort, // optional: phone accelerometer
    private readonly messageBus: MessageBusPort,
  ) {}

  async monitorSession(session: StorySession): Promise<void> {
    await this.audioAnalyzer.streamAnalysis(session.audioStream, {
      onSilence: (duration) => {
        if (duration > 30_000) { // 30s silence
          this.messageBus.publish(new SleepCueDetected('silence', 0.7));
        }
      },
      onBreathingChange: (pattern) => {
        if (pattern === 'slow_regular') {
          this.messageBus.publish(new SleepCueDetected('breathing', 0.9));
        }
      },
      onNoChildResponse: (missedPrompts) => {
        if (missedPrompts >= 2) {
          this.messageBus.publish(new SleepCueDetected('unresponsive', 0.8));
        }
      },
    });
  }
}
```

**Agent Behaviors Based on Sleep Cues**:
- `confidence < 0.5`: Continue normally
- `confidence 0.5-0.7`: Slow pacing, softer voice, simpler vocabulary
- `confidence > 0.7`: Begin gentle story wrap-up
- `confidence > 0.9`: Fade to sleep sounds, end session gracefully

### 3.3 NEW: Conversational Child Interaction

**The Killer Feature**: Child is not a passive listener. Child can:
1. **Interrupt** — "Wait, what happened to the bunny?"
2. **Direct** — "Make her go to the moon!"
3. **Ask** — "Why is the sky blue?"
4. **Participate** — Name characters, choose paths

```typescript
// Domain Service
class ConversationalStoryEngine {
  async handleChildInterruption(
    currentStory: StoryState,
    childUtterance: ChildUtterance,
  ): Promise<StoryAction> {
    const intent = await this.classifyIntent(childUtterance);
    
    switch (intent.type) {
      case 'QUESTION':
        // Answer in character, weave answer into story
        return this.answerInNarrative(intent.question, currentStory);
      
      case 'DIRECTION':
        // Adapt story to child's wish
        return this.adaptToDirection(intent.wish, currentStory);
      
      case 'PARTICIPATION':
        // Incorporate child's input into story
        return this.incorporateInput(intent.input, currentStory);
      
      case 'DISTRESS':
        // Detect fear/anxiety, soften immediately
        return this.gentlePivot(currentStory);
      
      default:
        // Acknowledge but continue
        return this.gentleAcknowledge();
    }
  }
}
```

**User Flow Example**:
```
Story: "And so Luna the astronaut looked out at the stars—"
Child: "What's that big red star?"
AI (in parent voice): "Ah, Emma, you're so curious! That's Mars—some 
people call it the Red Planet. Luna waved at Mars and said 'Maybe 
I'll visit you next!' Now, where were we..."
[Memory Curator auto-tags: "Emma asked about Mars, 2026-01-13, 8:22pm"]
```

### 3.4 NEW: Ambient Intelligence Context

Agent considers **environmental context** without user telling it:

```typescript
interface AmbientContext {
  // Time-based
  currentTime: Date;        // 9:30pm = shorter story
  dayOfWeek: DayOfWeek;     // Friday = more lenient on length
  isSchoolNight: boolean;   // Affects strictness
  
  // Environmental
  weather?: WeatherCondition; // Rainy = cozy cave stories
  season: Season;            // Winter = snow adventures
  
  // Recent events (from Memory Vault)
  recentMilestones: Milestone[]; // New pet? Weave into story
  recentDifficulties: string[];  // Bad day at school? Comfort themes
  
  // Child state (inferred)
  estimatedEnergyLevel: 'high' | 'medium' | 'low';
  recentQuestions: Question[];   // Curious about plants? Garden story
}
```

**Proactive Story Suggestion**:
```
[8:15pm, Tuesday, rainy outside]
Agent: "It's a cozy rainy night—perfect for 'The Umbrella Kingdom'. 
Emma asked about rainbows last week, and this story has a beautiful 
one at the end. Ready?"
```

---

## 4. Learning & Personalization (True AI)

### 4.1 The Data Flywheel (Not Just Storage)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         THE LEARNING LOOP                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐                                                        │
│  │   STORY     │ ──→ Implicit Signals ──→ ┌─────────────────────┐      │
│  │   SESSION   │                          │  SIGNAL ANALYZER     │      │
│  └─────────────┘                          │  (Preference Model)  │      │
│        │                                  └──────────┬──────────┘      │
│        │                                             │                  │
│        ▼                                             ▼                  │
│  Implicit Signals:                         Learned Preferences:         │
│  • Story completion % (75%?)               • Optimal story length       │
│  • Time-to-sleep (12 min)                  • Favorite themes            │
│  • Child interruptions (engaged or bored?) • Best pacing for this child │
│  • Parent skip behavior                    • Vocabulary ceiling         │
│  • Replay requests ("Again!")              • Sensitive topics to avoid  │
│  • Chapter selection (which parts?)        • Peak engagement moments    │
│                                                                         │
│                           ┌─────────────────────────────────────┐       │
│                           │       PREFERENCE STORE              │       │
│                           │   (per child, updated continuously) │       │
│                           └─────────────────────────────────────┘       │
│                                            │                            │
│                                            ▼                            │
│                                   Next Story Generation                 │
│                                   (informed by preferences)             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Implicit Signal Extraction

**What we learn WITHOUT asking**:

| Signal | What It Tells Us | Action |
|--------|-----------------|--------|
| Story finished 100% | Engaging | Weight toward similar themes |
| Skip at 3 min | Too long/boring | Shorten, change pace |
| "Again! Again!" | Perfect match | Prioritize in recommendations |
| Child asks 5+ questions | Highly engaged | More interactive stories |
| Child asks 0 questions | Either sleepy or disengaged | Check sleep cues |
| Parent pauses 3x | Distractions, tired | Suggest "quick version" |
| Always stops at action scenes | Overstimulating | Reduce action |

### 4.3 Preference Learning (DPO-Lite)

We don't do full DPO training, but we capture preference pairs:

```typescript
interface PreferencePair {
  context: StoryContext;
  chosen: StoryCharacteristics;      // The story they finished
  rejected: StoryCharacteristics;    // The story they skipped/stopped
}

// Example:
{
  context: { time: "9pm", childAge: 6, dayOfWeek: "Tuesday" },
  chosen: { theme: "cozy", length: "short", pace: "slow", characters: ["animals"] },
  rejected: { theme: "adventure", length: "medium", pace: "fast", characters: ["pirates"] }
}
```

Over time, the recommendation engine uses these pairs to personalize.

---

## 5. The Magic Features (UX Differentiators)

### 5.1 "Again!" Button (The Viral Moment)

**Insight**: Kids want to hear the SAME story. Parents hate repetition. Solution: **Same structure, new details**.

```
First time: "Luna the astronaut visited the Ice Moon..."
"Again!" → "Luna the astronaut visited the Rainbow Moon..." (same beats, new setting)
"Again!" → "Luna the astronaut visited the Dinosaur Moon..." (same beats, new theme)
```

**Implementation**: Store story beats as abstract structure, re-instantiate with variations.

### 5.2 "Grandma Mode" (The Growth Engine)

**The Viral Loop DreamWeaver Needs**:

```
Parent → Creates Story → Shares one-tap link → Grandma
                                                  ↓
                                         Listens to grandchild's voice
                                         asking about stars
                                                  ↓
                                         Emotional hook → Shares with friends
                                         OR gifts subscription to another grandparent
```

**Security**: 
- Link expires in 48 hours
- No public indexing
- View count limited to 3
- Email-only delivery (no social media links)

### 5.3 "Dream Companions" (Child Retention)

**Problem**: PRD focuses on parent. But child is the gatekeeper.

**Solution**: Gamified rewards:
- 5 stories → Unlock a "Dream Friend" (digital pet/character)
- Dream Friend appears in future stories as recurring character
- Child accumulates collection, asks to use DreamWeaver

### 5.4 "Weekly Time Capsule" (The Retention Weapon)

Every Sunday, parents receive a beautiful email:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ✨ Emma's Week in Moments                                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  📅 January 6-13, 2026                                                  │
│                                                                         │
│  🌟 Moment of the Week:                                                 │
│  "Why do stars twinkle, Mommy?"                                         │
│  Emma, during "Luna's Light Journey" - Tuesday 8:22pm                   │
│  [Play audio 15s] [View story]                                          │
│                                                                         │
│  📊 This Week:                                                          │
│  • 5 stories told                                                       │
│  • 1h 23min of quality time                                             │
│  • 12 questions asked                                                   │
│  • Favorite theme: Space exploration                                    │
│                                                                         │
│  💡 New This Week:                                                      │
│  Emma used the word "hypothesis" correctly for the first time!          │
│                                                                         │
│  🎁 Share this moment with Grandma? [One-tap share]                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Technology Stack (Inherited from v2 + Additions)

### 6.1 Core Stack (Unchanged)

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Frontend** | React 18 + Vite | Fast, lightweight, Vercel-compatible |
| **Backend** | Vercel Serverless | Native, no Express overhead |
| **Database** | Supabase (PostgreSQL + pgvector) | Free tier, RAG-ready |
| **AI Reasoning** | Gemini 2.0 Flash/Pro | Cost-effective, fast |
| **TTS** | Google Cloud TTS + Chirp 3 | 85% cheaper than ElevenLabs |
| **Images** | Imagen 3 | Native Google integration |

### 6.2 New Components for Agentic Features

| Feature | Technology | Rationale |
|---------|------------|-----------|
| **Real-time Audio** | Vercel Edge + WebSocket | Low-latency child interaction |
| **Sleep Detection** | WebRTC + Local ML | Privacy-preserving, no cloud |
| **Preference Learning** | pgvector + Lightweight ranking | No heavy ML infra needed |
| **Family Graph** | Supabase Row-Level Security | Multi-caregiver context |
| **Ambient Context** | OpenWeatherMap + Browser APIs | Time, weather, location |

### 6.3 Architecture Addition: Event-Driven Messaging

Agents communicate via an event bus, not direct calls:

```typescript
// New: Message Bus for Agent Communication
interface AgentMessage {
  source: AgentId;
  type: 'SLEEP_CUE' | 'CHILD_INTERRUPT' | 'STORY_BEAT' | 'GOLDEN_MOMENT';
  payload: unknown;
  timestamp: Date;
}

class InMemoryMessageBus implements MessageBusPort {
  private subscribers: Map<string, ((msg: AgentMessage) => void)[]> = new Map();

  publish(message: AgentMessage): void {
    const handlers = this.subscribers.get(message.type) ?? [];
    handlers.forEach(h => h(message));
  }

  subscribe(type: string, handler: (msg: AgentMessage) => void): void {
    const handlers = this.subscribers.get(type) ?? [];
    handlers.push(handler);
    this.subscribers.set(type, handlers);
  }
}
```

---

## 7. Success Metrics (Agentic Focus)

### 7.1 Agentic Behavior Metrics

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| **Proactive suggestions accepted** | >40% | Proves autonomy is valuable |
| **Sleep detection accuracy** | >85% | Core feature works |
| **Child interactions per story** | 2+ avg | Child is engaged, not passive |
| **Stories without explicit request** | >30% | Agent anticipating needs |
| **Preference accuracy** | >75% | Learning loop works |

### 7.2 Business Metrics

| Metric | Target | Rationale |
|--------|--------|-----------|
| **D7 Retention** | >50% | Parents return after first week |
| **Stories per week (active users)** | 5+ | Habit formed |
| **Grandma Mode shares** | 1 per 10 stories | Viral loop working |
| **Time to first "Again!"** | <3 stories | Child is hooked |
| **Premium conversion** | >5% | Free tier is compelling enough |

### 7.3 Product Quality

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Latency (first audio)** | <2s | P95 |
| **Cost per story** | <$0.10 | Daily average |
| **Child safety incidents** | 0 | Manual + automated audit |
| **Golden Moment detection F1** | >0.8 | Precision/recall balance |
| **Story completion rate** | >80% | Stories are engaging |

---

## 8. Roadmap (Agentic-First)

### Phase 1: Agentic Foundation (Weeks 1-4)

- [ ] Project scaffolding (React + Vite + Vercel)
- [ ] Clean Architecture setup (ports, adapters, use cases)
- [ ] Core agent framework with message bus
- [ ] Bedtime Conductor with goal management
- [ ] Story Weaver with AoT pipeline
- [ ] Sleep Sentinel (basic audio cue detection)
- [ ] Memory Curator (golden moment extraction)
- [ ] Google TTS + Chirp 3 voice cloning
- [ ] Safety Guardian (4-layer defense)

### Phase 2: Agentic Intelligence (Weeks 5-6)

- [ ] Conversational interaction (child interrupts)
- [ ] Ambient context (time, weather, day of week)
- [ ] Preference learning pipeline (implicit signals)
- [ ] Proactive story suggestions
- [ ] "Again!" with variation engine
- [ ] Weekly Time Capsule email

### Phase 3: Viral & Retention (Weeks 7-8)

- [ ] Grandma Mode (secure sharing)
- [ ] Dream Companions (gamification)
- [ ] Multi-caregiver support (Family Graph)
- [ ] Onboarding optimization
- [ ] Private beta (50 families)

### Phase 4: Launch (Week 9+)

- [ ] Public launch
- [ ] Monitoring & iteration based on real usage
- [ ] Premium tier activation

---

## 9. Risks & Mitigations

### 9.1 "Agentic" Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Agent makes wrong decision | Parent frustrated | Always show "Why I chose this" + easy override |
| Too much autonomy feels creepy | Trust broken | Default conservative, earn autonomy over time |
| Child interaction misunderstood | Story goes off track | Fallback to gentle acknowledge, not action |
| Sleep detection false positives | Story ends abruptly | Gradual fade, never hard stop |

### 9.2 Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Vercel cold starts | Audio delay | Pre-warm critical functions, edge optimization |
| Google Chirp voice quality | "Uncanny valley" | A/B test, fallback to ElevenLabs for first story (hook user) |
| Real-time audio latency | Breaks immersion | WebSocket + edge processing |

---

## 10. Appendix: Why This Wins (YC Pitch Lens)

### The Story

"Every night, millions of parents feel guilty because they're too exhausted to read with enthusiasm. Current solutions are glorified audiobooks—they don't know your child, don't remember last night, and don't adapt to your family's unique rhythms.

DreamWeaver is different. It's an AI that **knows** your family. It suggests 'The Moon Garden' because Emma asked about plants today. It slows down when it detects she's falling asleep. It captures the moment she asks 'Can robots cry?' and resurfaces it years later.

We're not an LLM wrapper. We're building the first true **Family AI Companion**—and bedtime is just the beginning."

### The Moat

1. **Data Flywheel**: Every story session teaches us more about this family. Competitors start from zero.
2. **Voice Clone Lock-in**: 5-minute recording = months of stories in YOUR voice. Switching cost is emotional.
3. **Memory Vault**: 50 stored memories = never churning family.
4. **Network Effects**: Grandma Mode creates organic growth.

### The Opportunity

- 40M parents in the US with kids 3-8
- $50B/year spent on children's content
- Bedtime = daily habit = subscription-ready
- No incumbent owns this space

---

**Document Status**: Ready for Implementation  
**Approved By**: Product Strategy  
**Last Updated**: January 2026
