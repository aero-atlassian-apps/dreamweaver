# DreamWeaver UI/UX Design Document — vFinal

## User Interface & Experience Design Specification

| Field | Value |
|-------|-------|
| **Product Name** | DreamWeaver |
| **Design System** | Lullaby Design Language v2 |
| **Version** | Final (YC-Ready) |
| **Last Updated** | January 2026 |
| **Status** | Ready for Implementation |

---

## 0. Design Philosophy (Evolved)

### Core Principles (Inherited + Enhanced)

| Principle | Description |
|-----------|-------------|
| **Whisper, Don't Shout** | Interfaces for bedtime are calm, never jarring. Soft gradients, gentle animations, muted colors. |
| **One-Handed Elegance** | Every interaction achievable with thumb reach. No precision tapping. |
| **Invisible Complexity** | AI does heavy lifting; users see smooth magic. |
| **Memory as Art** | The Memory Vault is a curated gallery, not a database. |
| **Dark Mode First** | Bedtime happens in dimmed rooms. Dark mode is default. |
| **🆕 Proactive Intelligence** | UI surfaces AI suggestions before user asks. Agent takes initiative. |
| **🆕 Child as Participant** | Child is not passive listener—UI enables conversation, direction, interruption. |
| **🆕 Ambient Awareness** | UI reflects time, weather, mood. Context is visible, not hidden. |
| **🆕 Sleep-Aware Design** | UI adapts as child approaches sleep. Gentler, dimmer, slower. |

---

## 1. Design System: "Lullaby v2"

### 1.1 Color Palette

#### Primary Colors (Dark Mode Default)
```css
/* Background Hierarchy */
--bg-primary: #0A0E1A;        /* Deep midnight blue */
--bg-secondary: #141B2E;      /* Slightly lighter panels */
--bg-tertiary: #1E2942;       /* Elevated cards */
--bg-overlay: rgba(10, 14, 26, 0.95); /* Modals */

/* Text */
--text-primary: #E8EDF4;      /* Soft white (not harsh #FFF) */
--text-secondary: #A8B3C7;    /* Muted gray-blue */
--text-tertiary: #6B7A93;     /* Subtle hints */

/* Accent Colors */
--accent-primary: #7C9FFF;    /* Soft periwinkle blue */
--accent-secondary: #B8A1FF;  /* Gentle lavender */
--accent-tertiary: #FF9ECD;   /* Warm pink (success states) */

/* Semantic Colors */
--success: #6EE7B7;           /* Mint green (calm) */
--warning: #FCD34D;           /* Soft amber */
--error: #F87171;             /* Gentle coral */
--info: #7DD3FC;              /* Sky blue */

/* 🆕 Agentic States */
--agent-thinking: #A78BFA;    /* Violet glow when AI processing */
--agent-suggestion: #34D399;  /* Green pulse for proactive hints */
--sleep-mode: #4B5563;        /* Dimmed gray for sleep transitions */

/* 🆕 Sleep Mode Overrides */
--sleep-bg: #050810;          /* Near black */
--sleep-text: #6B7A93;        /* Muted text */
--sleep-accent: #4B5563;      /* Dim accents */

/* Special Gradients */
--memory-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--story-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
--agent-gradient: linear-gradient(135deg, #A78BFA 0%, #7C9FFF 100%);
```

#### Light Mode (Daytime Dashboard)
```css
--bg-primary-light: #F8FAFC;
--bg-secondary-light: #FFFFFF;
--bg-tertiary-light: #F1F5F9;
--text-primary-light: #1E293B;
--text-secondary-light: #475569;
```

### 1.2 Typography

```css
/* Primary: Inter (body, UI) */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

/* Secondary: Newsreader (story titles, memory cards) */
@import url('https://fonts.googleapis.com/css2?family=Newsreader:wght@400;600&display=swap');

/* Type Scale */
--text-display: 4rem/4.5rem, Newsreader, serif, 600;
--text-h1: 2.5rem/3rem, Newsreader, serif, 600;
--text-h2: 2rem/2.5rem, Newsreader, serif, 600;
--text-h3: 1.5rem/2rem, Inter, sans-serif, 600;
--text-body-lg: 1.125rem/1.75rem, Inter, sans-serif, 400;
--text-body: 1rem/1.5rem, Inter, sans-serif, 400;
--text-caption: 0.75rem/1rem, Inter, sans-serif, 500;
```

### 1.3 Spacing System (8px Grid)

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.5rem;    /* 24px */
--space-6: 2rem;      /* 32px */
--space-8: 3rem;      /* 48px */
--space-10: 4rem;     /* 64px */
```

### 1.4 🆕 Agentic UI Components

#### Agent Suggestion Card
```css
.agent-suggestion {
  background: var(--bg-tertiary);
  border: 2px solid var(--agent-suggestion);
  border-radius: 16px;
  padding: 1rem;
  animation: softPulse 3s ease-in-out infinite;
}

.agent-suggestion::before {
  content: '✨ DreamWeaver suggests';
  font: var(--text-caption);
  color: var(--agent-suggestion);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

@keyframes softPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.2); }
  50% { box-shadow: 0 0 20px 4px rgba(52, 211, 153, 0.3); }
}
```

#### Sleep Detector Indicator
```css
.sleep-indicator {
  position: fixed;
  bottom: 100px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sleep-indicator__moon {
  font-size: 24px;
  opacity: 0.3;
  transition: opacity 0.5s ease;
}

.sleep-indicator.detecting {
  animation: breathe 4s ease-in-out infinite;
}

.sleep-indicator.high-confidence .sleep-indicator__moon {
  opacity: 1;
  color: var(--accent-secondary);
}

@keyframes breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
```

#### Child Interaction Bubble
```css
.child-bubble {
  background: linear-gradient(135deg, #FF9ECD 0%, #FFB6C1 100%);
  color: var(--bg-primary);
  border-radius: 20px 20px 4px 20px;
  padding: 1rem 1.25rem;
  max-width: 80%;
  margin-left: auto;
  animation: bubbleIn 0.3s ease-out;
}

.child-bubble__label {
  font: var(--text-caption);
  color: rgba(0, 0, 0, 0.5);
  margin-bottom: 0.25rem;
}

@keyframes bubbleIn {
  from { transform: scale(0.8) translateY(10px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}
```

---

## 2. User Personas & Journey Maps

### 2.1 Primary Persona: Sarah (Exhausted Professional)

| Attribute | Detail |
|-----------|--------|
| **Age** | 35 |
| **Occupation** | Marketing Manager |
| **Children** | Emma (6), Noah (4) |
| **Tech Comfort** | High |
| **Pain Points** | Too tired to read with enthusiasm, guilt about screen time |
| **Magic Moment** | Hearing Emma ask "Can we use DreamWeaver tonight?" |

#### Sarah's Journey Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SARAH'S EVENING JOURNEY                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  6:30 PM          7:30 PM          8:00 PM          8:30 PM            │
│  ────────────────────────────────────────────────────────────           │
│      │               │               │               │                  │
│      ▼               ▼               ▼               ▼                  │
│  ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐                 │
│  │ Dinner │    │ Bath   │    │BEDTIME │    │ Memory │                 │
│  │ Chaos  │    │ Time   │    │ RITUAL │    │ Review │                 │
│  └────────┘    └────────┘    └────────┘    └────────┘                 │
│                                   │                                     │
│                          ┌────────┴────────┐                           │
│                          │  DreamWeaver    │                           │
│                          │  Active Zone    │                           │
│                          └─────────────────┘                           │
│                                                                         │
│  TOUCHPOINTS:                                                           │
│  • 7:55 PM: Push notification "Ready for bedtime?"                     │
│  • 8:00 PM: App opened, agent suggests tonight's story                 │
│  • 8:05 PM: Story begins streaming in Sarah's voice                    │
│  • 8:12 PM: Emma asks question, AI assists Sarah                       │
│  • 8:18 PM: Sleep detected, story fades gracefully                     │
│  • 8:30 PM: Memory card surfaces in app                                │
│  • Sunday 9 AM: Weekly digest email arrives                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Secondary Persona: Michael (Long-Distance Dad)

| Attribute | Detail |
|-----------|--------|
| **Age** | 42 |
| **Occupation** | Consultant (travels 2 weeks/month) |
| **Children** | Sophia (5) |
| **Pain Points** | Misses bedtime, video calls feel awkward |
| **Magic Moment** | Voice-cloned story plays on his daughter's device from hotel room |

#### Michael's Journey

```
HOTEL ROOM (8 PM LOCAL) → App → Record story request →
→ Story generates in Michael's voice →
→ Notification sent to Sophia's tablet at home →
→ Mom plays story for Sophia →
→ Memory captured: "Daddy's story from Chicago" →
→ Michael reviews memory next morning
```

### 2.3 Tertiary Persona: Linda (Grandparent)

| Attribute | Detail |
|-----------|--------|
| **Age** | 68 |
| **Role** | Caregiver 2 days/week |
| **Tech Comfort** | Low |
| **Pain Points** | Doesn't know current kids' stories, feels out of touch |
| **Magic Moment** | Receives Grandma Mode link, hears grandchild's voice asking about stars |

---

## 3. Onboarding Flow (Enhanced)

### 3.1 Welcome Screen

```
┌─────────────────────────────────────┐
│                                     │
│         [DreamWeaver Logo]          │
│        (Animated moon + stars)      │
│                                     │
│     "Your voice. Their stories.     │
│      Memories that last forever."   │
│                                     │
│    [Illustration: Parent + Child    │
│     in cozy starlit bedroom]        │
│                                     │
│     ┌─────────────────────────┐    │
│     │   Get Started  →        │    │
│     └─────────────────────────┘    │
│                                     │
│      Already have an account?       │
│            Sign In                  │
│                                     │
└─────────────────────────────────────┘
```

### 3.2 Voice Clone Setup (10-30 seconds only)

> [!NOTE]
> Per prd_vFinal, we use Chirp 3 Instant which only needs 10-30 seconds of audio.

```
┌─────────────────────────────────────┐
│  Step 1 of 3                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━        │
│                                     │
│      Let's Create Your Voice        │
│                                     │
│  Read this short passage aloud      │
│  (just 30 seconds!)                 │
│                                     │
│  ┌───────────────────────────────┐ │
│  │                               │ │
│  │  "Once upon a time, in a      │ │
│  │   cozy little house on a      │ │
│  │   starlit hill, there lived   │ │
│  │   a curious child who loved   │ │
│  │   to explore..."              │ │
│  │                               │ │
│  └───────────────────────────────┘ │
│                                     │
│    [Waveform Visualizer Area]       │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   🎙️  Hold to Record          │ │
│  └───────────────────────────────┘ │
│                                     │
│      Skip for now (generic voice)   │
│                                     │
└─────────────────────────────────────┘
```

**Recording States:**
- **Idle**: Pulsing mic icon, "Hold to record"
- **Recording**: Live waveform, countdown timer (0:30)
- **Processing**: "Creating your voice... (10 seconds)"
- **Preview**: Play sample, "Does this sound like you?"

### 3.3 Child Profile Setup

```
┌─────────────────────────────────────┐
│  Step 2 of 3                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━        │
│                                     │
│    Tell Us About Your Child         │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Child's Name *                 │ │
│  │ Emma                           │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Age                            │ │
│  │ 6 years old        [- / +]    │ │
│  └───────────────────────────────┘ │
│                                     │
│  What does Emma love? (Pick 3-5)   │
│                                     │
│  [ Space 🚀 ] [ Animals 🦁 ]       │
│  [ Robots 🤖] [ Dinosaurs 🦖 ]     │
│  [ Sports ⚽ ] [ Music 🎵 ]         │
│  [ Art 🎨 ] [ Science 🔬 ]         │
│  [ Magic ✨ ] [ Cooking 🍳 ]        │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   Continue →                   │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### 3.4 🆕 Permissions & Preferences

```
┌─────────────────────────────────────┐
│  Step 3 of 3                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━        │
│                                     │
│    Help DreamWeaver Help You        │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  🎙️ Microphone Access          │ │
│  │  So Emma can talk to stories  │ │
│  │                    [Allow]    │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  🔔 Bedtime Reminders          │ │
│  │  "Ready for bedtime?" at 8 PM │ │
│  │                    [Enable]   │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  📧 Weekly Memory Digest       │ │
│  │  Sunday mornings              │ │
│  │                    [Enable]   │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   Start Dreaming →            │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

---

## 4. Main Dashboard (Agentic Home)

### 4.1 🆕 Proactive Dashboard (Mobile)

```
┌─────────────────────────────────────┐
│                                     │
│  Good Evening, Sarah  ☾             │
│  It's a rainy Tuesday              │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ ✨ Tonight's Suggestion       │ │
│  │                               │ │
│  │ "The Umbrella Kingdom"        │ │
│  │                               │ │
│  │ Perfect for a cozy rainy      │ │
│  │ night. Emma asked about       │ │
│  │ rainbows last week—this       │ │
│  │ story has a beautiful one!    │ │
│  │                               │ │
│  │ ┌─────────────────────────┐  │ │
│  │ │  ▶️  Start This Story    │  │ │
│  │ └─────────────────────────┘  │ │
│  │                               │ │
│  │    Something else → [🎙️]     │ │
│  │                               │ │
│  └───────────────────────────────┘ │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Quick Ideas (based on Emma)        │
│                                     │
│  ┌────────┐ ┌────────┐ ┌────────┐ │
│  │ Space  │ │ Robots │ │ "Again │ │
│  │  🚀    │ │  🤖    │ │  🔁"   │ │
│  └────────┘ └────────┘ └────────┘ │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  This Week's Moments  3 new  →      │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  [Thumb] "Why do stars..."    │ │
│  │  Thursday 8:15 PM             │ │
│  └───────────────────────────────┘ │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  [🏠 Home] [📖 Stories] [💭 Memory] │
│           [👤 Profile]              │
└─────────────────────────────────────┘
```

**Key Differences from v1:**
1. **Agent Suggestion Card** — Proactive, explains *why* this story
2. **Ambient Context** — Shows weather, day of week
3. **"Again!" Button** — One-tap to replay last story with variation
4. **Quick Ideas** — Dynamic based on child's learned preferences

### 4.2 "Something Else" Voice Input

```
┌─────────────────────────────────────┐
│                                     │
│  ← Back                             │
│                                     │
│         Listening... 🎙️             │
│                                     │
│   ┌─────────────────────────────┐  │
│   │   [Large Waveform Animation] │  │
│   │   (Responds to voice level)  │  │
│   └─────────────────────────────┘  │
│                                     │
│      0:08 recording                 │
│                                     │
│   "Tell Cinderella but make her    │
│    a scientist who loves space"    │
│                                     │
│   (Live transcription appears)      │
│                                     │
│  ┌───────────────────────────────┐ │
│  │        ✓  Done                 │ │
│  └───────────────────────────────┘ │
│                                     │
│  Or type your request →             │
│                                     │
└─────────────────────────────────────┘
```

---

## 5. Story Experience (Agentic & Conversational)

### 5.1 Story Generation (AoT Progress)

```
┌─────────────────────────────────────┐
│                                     │
│     Creating Emma's Story...        │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ ✓ Story structure extracted    │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ ✓ Space adventure mapped       │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ ✓ Emma's interests woven in   │ │
│  │   (robots, stars, discovery)  │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ ✓ Bedtime tone calibrated     │ │
│  │   (Sarah sounds tired tonight)│ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ ✓ Safety check passed         │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ ⏳ Synthesizing in your voice...│ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### 5.2 🆕 Conversational Story Player

```
┌─────────────────────────────────────┐
│  ← Exit              ⋮ Menu   🌙 45%│
│                                     │
│   ┌───────────────────────────────┐│
│   │                               ││
│   │   [AI-Generated Illustration] ││
│   │   (Ken Burns slow zoom)       ││
│   │                               ││
│   └───────────────────────────────┘│
│                                     │
│  Emma the Space Scientist           │
│                                     │
│  ━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━ │
│  4:22                         12:15 │
│                                     │
│  ┌─────────────────────────────────┤
│  │ "...and so Luna looked up at    ││
│  │  the twinkling stars and        ││
│  │  wondered what secrets the      ││
│  │  Moon was hiding—"              ││
│  │                                 ││
│  │  [Current phrase highlighted]   ││
│  └─────────────────────────────────┘│
│                                     │
│      ⏮️      ⏸️      ⏭️             │
│    -15s    PAUSE    +15s            │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  🎙️ Emma can interrupt anytime │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

**🆕 Sleep Indicator (top right):**
- `🌙 0%` — Normal mode
- `🌙 45%` — Sleep cues detected (breathing slowing)
- `🌙 85%` — Approaching sleep (UI dims, pace slows)
- `😴 100%` — Story fades to ambient sounds

### 5.3 🆕 Child Interaction Mode

**When Emma speaks during story:**

```
┌─────────────────────────────────────┐
│  [Story automatically pauses]       │
│                                     │
│   ┌───────────────────────────────┐│
│   │   [Illustration dims slightly] ││
│   └───────────────────────────────┘│
│                                     │
│  ┌───────────────────────────────┐ │
│  │    🎙️ Emma says:              │ │
│  │                               │ │
│  │  "What's that big red star?"  │ │
│  │                               │ │
│  │  [Play audio: 0:03]           │ │
│  └───────────────────────────────┘ │
│                                     │
│         ⏳ Thinking...              │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  ✨ DreamWeaver will answer:   │ │
│  │                               │ │
│  │  "That's Mars—the Red Planet! │ │
│  │   Luna waved and said 'Maybe  │ │
│  │   I'll visit you next!'"      │ │
│  │                               │ │
│  │  (Woven into story narrative) │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │     Continue Story  →          │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │     I'll Answer Instead       │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

**Interaction Types:**
| Child Says | AI Response |
|------------|-------------|
| Question ("What's that?") | Answer woven into narrative |
| Direction ("Make her fly!") | Story adapts to child's wish |
| Participation ("Name it Luna!") | Incorporates input into story |
| Distress ("I'm scared") | Gently softens the story |

### 5.4 🆕 Sleep Detection Transition

**When sleep confidence > 85%:**

```
┌─────────────────────────────────────┐
│                                     │
│   [Screen dims to 30% brightness]   │
│                                     │
│   ┌───────────────────────────────┐│
│   │                               ││
│   │   [Illustration fades to      ││
│   │    gentle starfield]          ││
│   │                               ││
│   └───────────────────────────────┘│
│                                     │
│  Story winding down...              │
│                                     │
│  "...and Luna closed her eyes,      │
│   dreaming of all the stars         │
│   she would visit tomorrow.         │
│   The end."                         │
│                                     │
│  [Ambient night sounds fade in]     │
│                                     │
│                                     │
│       Sweet dreams, Emma 🌙         │
│                                     │
│                                     │
│   Session saved to Memory Vault     │
│                                     │
└─────────────────────────────────────┘
```

---

## 6. Memory Vault (Enhanced)

### 6.1 Memory Timeline

```
┌─────────────────────────────────────┐
│  ← Home          Memory Vault       │
│                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │ All │ │ ?   │ │ ⭐  │ │ 📅  │  │
│  └─────┘ └─────┘ └─────┘ └─────┘  │
│  🔍 Search memories...              │
│                                     │
│  This Week  (3 memories)            │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  [Illustration thumbnail]     │ │
│  │                               │ │
│  │  ⭐ Emma asked about Mars     │ │
│  │                               │ │
│  │  "What's that big red star?"  │ │
│  │                               │ │
│  │  🎙️ 0:08 • Tonight 8:22 PM    │ │
│  │                               │ │
│  │  #astronomy #conversation     │ │
│  │                               │ │
│  │  [▶️ Play] [📤 Share]         │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  [Illustration]               │ │
│  │                               │ │
│  │  First time saying "galaxy"   │ │
│  │                               │ │
│  │  #milestone #vocabulary       │ │
│  └───────────────────────────────┘ │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  [🏠 Home] [📖 Stories] [💭 Memory] │
│           [👤 Profile]              │
└─────────────────────────────────────┘
```

### 6.2 🆕 Grandma Mode Share

```
┌─────────────────────────────────────┐
│                                     │
│     Share This Moment 💌            │
│                                     │
│  ┌───────────────────────────────┐ │
│  │                               │ │
│  │  [Preview Card Image]         │ │
│  │                               │ │
│  │  "Emma asked about Mars"      │ │
│  │  January 13, 2026             │ │
│  │                               │ │
│  └───────────────────────────────┘ │
│                                     │
│  Send to:                           │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 📧 grandma@email.com          │ │
│  └───────────────────────────────┘ │
│                                     │
│  Include audio?                     │
│  ● Yes, include Emma's voice       │
│  ○ No, text only                   │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  🔒 Link expires in 48 hours        │
│  🔒 View limit: 3 plays             │
│  🔒 Not indexed by search engines   │
│                                     │
│  ┌───────────────────────────────┐ │
│  │     Send to Grandma  →        │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

---

## 7. 🆕 Dream Companions (Gamification)

### 7.1 Collection View

```
┌─────────────────────────────────────┐
│  ← Profile      Dream Companions    │
│                                     │
│  Emma's Dream Friends               │
│                                     │
│  ┌─────────┐ ┌─────────┐ ┌───────┐ │
│  │  🦉     │ │  🤖     │ │  ?    │ │
│  │ Ollie   │ │ Robo    │ │ 2 more│ │
│  │ Earned! │ │ Earned! │ │stories│ │
│  └─────────┘ └─────────┘ └───────┘ │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Next Companion: Luna the Starfish  │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  ⭐⭐⭐⭐○                    │ │
│  │  4/5 stories to unlock        │ │
│  └───────────────────────────────┘ │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Dream Companions appear in your    │
│  future stories as recurring        │
│  characters Emma already knows!     │
│                                     │
└─────────────────────────────────────┘
```

### 7.2 Companion Unlock

```
┌─────────────────────────────────────┐
│                                     │
│         🎉 New Dream Friend!        │
│                                     │
│         [Companion Animation]       │
│              🦋                     │
│           "Bella"                   │
│                                     │
│  Emma has unlocked Bella the        │
│  Butterfly! Bella will now appear   │
│  in future bedtime stories.         │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   Meet Bella Tonight  →       │ │
│  └───────────────────────────────┘ │
│                                     │
│       Save for Later                │
│                                     │
└─────────────────────────────────────┘
```

---

## 8. 🆕 Weekly Time Capsule Email

```
┌──────────────────────────────────────┐
│  [DreamWeaver Logo]                  │
│                                      │
│  ✨ Emma's Week in Moments           │
│  January 6-13, 2026                  │
│                                      │
│  Hi Sarah,                           │
│                                      │
│  What a week! Here are Emma's most   │
│  special bedtime moments.            │
│                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                      │
│  🌟 MOMENT OF THE WEEK               │
│                                      │
│  [Thumbnail Image]                   │
│                                      │
│  "What's that big red star?"         │
│  Emma, during Luna's Space Journey   │
│  Tuesday 8:22 PM                     │
│                                      │
│  [▶️ Listen to this moment]          │
│                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                      │
│  📊 THIS WEEK'S STATS                │
│                                      │
│  📖 5 stories created                │
│  ⏱️ 1h 23min of quality time         │
│  ❓ 12 questions asked               │
│  🎯 Favorite: Space exploration      │
│                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                      │
│  💡 SOMETHING NEW                    │
│                                      │
│  Emma used the word "hypothesis"     │
│  correctly for the first time!       │
│                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                      │
│  🎁 Share with Grandma?              │
│  [One-Tap Share Button]              │
│                                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                      │
│  [View All Memories]                 │
│                                      │
│  Keep capturing these moments—       │
│  they grow up so fast.               │
│                                      │
│  — The DreamWeaver Team              │
│                                      │
│  [Unsubscribe] [Settings]            │
└──────────────────────────────────────┘
```

---

## 9. Settings & Profile

### 9.1 Profile Overview

```
┌─────────────────────────────────────┐
│  ← Home              Profile         │
│                                     │
│       [Avatar Circle]               │
│         Sarah                       │
│      Premium Member                 │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Children                           │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  [👧] Emma, 6 • View Profile  │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │  [👦] Noah, 4 • View Profile  │ │
│  └───────────────────────────────┘ │
│  ┌───────────────────────────────┐ │
│  │  + Add Another Child          │ │
│  └───────────────────────────────┘ │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Voice Clone                        │
│  ┌───────────────────────────────┐ │
│  │  🎙️ Your Voice • Re-record    │ │
│  └───────────────────────────────┘ │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Settings                           │
│  • Notifications                    │
│  • Privacy & Sharing                │
│  • Subscription                     │
│  • Help & Support                   │
│                                     │
└─────────────────────────────────────┘
```

---

## 10. Animation & Motion Guidelines

### 10.1 Transition Principles

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Screen transitions | Fade + slide | 300ms | `ease-out` |
| Cards appearing | Scale + fade | 400ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Sleep mode dim | Brightness fade | 2000ms | `ease-in-out` |
| Agent suggestions | Soft pulse | 3000ms | `ease-in-out` (loop) |
| Child interrupt | Bounce in | 300ms | `cubic-bezier(0.68, -0.2, 0.27, 1.15)` |

### 10.2 Microinteractions

```css
/* Voice button pulse */
@keyframes voicePulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(124, 159, 255, 0.5); }
  50% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(124, 159, 255, 0); }
}

/* Sleep transition */
@keyframes sleepFade {
  from { filter: brightness(1); }
  to { filter: brightness(0.3); }
}

/* Dream companion unlock */
@keyframes companionReveal {
  0% { transform: scale(0) rotate(-180deg); opacity: 0; }
  60% { transform: scale(1.2) rotate(10deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
```

---

## 11. Responsive Breakpoints

| Breakpoint | Width | Adaptation |
|------------|-------|------------|
| Mobile | < 640px | Single column, large touch targets |
| Tablet Portrait | 640-1024px | Two-column where appropriate |
| Tablet Landscape | 1024-1280px | Side-by-side panels |
| Desktop | > 1280px | Dashboard layout, max-width 1400px |

---

## 12. Accessibility

### 12.1 Requirements

- **WCAG 2.1 AA** compliance minimum
- **Color contrast**: 4.5:1 for normal text, 3:1 for large text
- **Touch targets**: 48px minimum
- **Screen reader**: All actions have aria-labels
- **Reduced motion**: Respect `prefers-reduced-motion`
- **Voice control**: All actions accessible via voice

### 12.2 Sleep Mode Accessibility

- Screen dims but maintains 3:1 contrast for essential controls
- Exit button remains at full brightness
- Ambient sounds have volume control

---

**Document Status**: Ready for Implementation  
**Aligned With**: prd_vFinal.md  
**Last Updated**: January 2026
