# 05. Features

## Core Features

### 1. Story Engine

**What it does:** Generates personalized bedtime stories using Gemini 3 Flash/Pro.

| Capability | Description |
|------------|-------------|
| **Personalization** | Uses child's name, age, interests |
| **Voice Clone** | Stories narrated in parent's voice (Chirp 3) |
| **Adaptive Length** | Short (5 min), Medium (10 min), Long (15 min) |
| **Theme Intelligence** | AI suggests based on weather, day, recent events |
| **Safety Guardrails** | 4-layer content filtering |

---

### 2. Golden Moments (Memory Curator)

**What it does:** Automatically detects and preserves developmental milestones.

| Capability | Description |
|------------|-------------|
| **Auto-detection** | Identifies questions, new words, emotional moments |
| **Audio capture** | Preserves child's actual voice |
| **Weekly digest** | Sunday email with week's highlights |
| **Search** | Find moments by theme, date, milestone type |

---

### 3. Sleep Sentinel

**What it does:** Detects sleep cues and adjusts story pacing.

| Capability | Description |
|------------|-------------|
| **Voice analysis** | Detects breathing changes, silence |
| **Adaptive pacing** | Slows story as child approaches sleep |
| **Graceful ending** | Fades to ambient sounds when asleep |
| **UI adaptation** | Screen dims as confidence increases |

---

### 4. Grandma Mode

**What it does:** One-tap secure sharing of moments with family.

| Capability | Description |
|------------|-------------|
| **Magic links** | Expire in 48 hours, 3 view limit |
| **No account needed** | Grandma clicks and listens |
| **Privacy-first** | Not indexed, not public |
| **Emotional hook** | Child's voice included |

---

### 5. Dream Companions (Gamification)

**What it does:** Rewards that keep children engaged.

| Capability | Description |
|------------|-------------|
| **Collectibles** | Unlock characters after N stories |
| **Recurring friends** | Unlocked companions appear in future stories |
| **Progress tracking** | Visual progress toward next companion |

---

### 6. Live Mode (Gemini Live)

**What it does:** Real-time conversational storytelling.

| Capability | Description |
|------------|-------------|
| **Child interrupts** | "What's that star?" → AI answers in narrative |
| **Voice direction** | "Make her fly!" → Story adapts |
| **Real-time audio** | WebSocket streaming via Cloudflare Worker |

---

## Feature Status

| Feature | Status | Model |
|---------|--------|-------|
| Story Engine | ✅ Shipped | Gemini 3 Flash |
| Golden Moments | ✅ Shipped | Gemini 3 Pro |
| Sleep Sentinel | 🚧 Partial | - |
| Grandma Mode | ✅ Shipped | - |
| Dream Companions | 📋 Planned | - |
| Live Mode | ✅ Shipped | Gemini 2.5 Live |
