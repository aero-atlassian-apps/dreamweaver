# DreamWeaver Incremental Delivery Plan

> **Strategy**: Vertical Slices. Each release is a **fully working E2E feature** (Backend + Frontend + Tests). No "backend only" or "frontend only" releases.

---

## Release Overview

| Release | Codename | Status | Summary |
| :--- | :--- | :--- | :--- |
| R1 | **Hello World** | `[x] DELIVERED` | Scaffolding, Auth, "Hello User" page. |
| R2 | **Static Story** | `[x] DELIVERED` | Generate & display a single story (text only). |
| R3 | **Voice of the Parent** | `[x] DELIVERED` | TTS integration (Google Cloud TTS). |
| R4 | **Memory Lane** | `[x] DELIVERED` | Story history & Memory Vault basics. |
| R5 | **The Conductor** | `[x] DELIVERED` | Bedtime Conductor agent + Event Bus. |
| R6 | **Sleepy Time** | `[x] DELIVERED` | Sleep Sentinel (audio cue detection). |
| R7 | **Conversations** | `[x] DELIVERED` | Child can interrupt & direct story. |
| R8 | **Smart Suggestions** | `[x] DELIVERED` | Proactive story suggestions + Ambient Context. |
| R9 | **Sharing is Caring** | `[x] DELIVERED` | Grandma Mode (secure sharing). |
| R10 | **Launch Ready** | `[x] DELIVERED` | PWA polish, Onboarding, Gamification. |

---

## Release Details

---

### R1: Hello World
**Goal**: A user can sign up, log in, and see a personalized welcome page.

#### Scope
- **Backend**: Hono API, Supabase Auth, `/api/health`.
- **Frontend**: React + Vite, Login/Signup pages, simple Dashboard.
- **Infra**: Vercel deployment, `.env` management.
- **Tests**: Auth flow E2E test.

#### Deliverables
- [x] Project Scaffolding (React 18 + Vite + Hono + Vercel)
- [x] Clean Architecture folder structure
- [x] Supabase Auth integration
- [x] Login / Signup Pages
- [x] Protected Dashboard route ("Good Evening, {Name}")
- [x] E2E Test: Auth flow

---

### R2: Static Story
**Goal**: A user can request a story based on a theme and see it rendered.

#### Scope
- **Backend**: `GenerateStoryUseCase`, Gemini AI Gateway (text only).
- **Frontend**: Story Request Form, Story Display View.
- **Domain**: `Story` entity, `StoryRepositoryPort`.

#### Deliverables
- [x] Gemini AI Gateway Adapter
- [x] `GenerateStoryUseCase` (basic AoT)
- [x] Story Request UI (theme picker)
- [x] Story Display UI (reading view)
- [x] Unit Tests: Use Case
- [x] Integration Test: AI Gateway

---

### R3: Voice of the Parent
**Status**: `[x] DELIVERED`
**Goal**: The generated story is read aloud using a cloned parent voice.

#### Scope
- **Backend**: `TextToSpeechPort`, Google Cloud TTS Adapter.
- **Frontend**: Audio Player component, Voice Recording onboarding.
- **Domain**: `VoiceProfile` entity.

#### Deliverables
- [x] Google Cloud TTS Adapter (Streaming)
- [x] Voice Recording Onboarding (30s sample)
- [x] Audio Player (play, pause, seek)
- [x] Story Player View (illustration + audio)
- [x] E2E Test: Full story playback

---

### R4: Memory Lane
**Status**: `[x] DELIVERED`
**Goal**: Stories are saved and a basic Memory Vault is browsable.

#### Scope
- **Backend**: `Story` persistence, `MemoryCuratorUseCase` (basic tagging).
- **Frontend**: Story History list, Memory Card detail view.
- **Domain**: `GoldenMoment` entity.

#### Deliverables
- [x] Supabase Story Repository
- [x] Story History Page
- [x] Memory Card component
- [x] Auto-tagging (`theme`, `date`)
- [x] Integration Test: Story persistence

---

### R5: The Conductor
**Status**: `[x] DELIVERED`
**Goal**: The Bedtime Conductor orchestrates the session with active goals.

#### Scope
- **Backend**: `BeditimeConductorAgent`, `InMemoryEventBus`, Goal management.
- **Frontend**: Agent Suggestion Card on Dashboard.
- **Domain**: `ActiveGoal` entity.

#### Deliverables
- [x] `InMemoryEventBus` (Pub/Sub)
- [x] `BedtimeConductorAgent` with Goal logic
- [x] Dashboard shows proactive suggestion
- [x] Unit Tests: Event Bus, Goal transitions

---

### R6: Sleepy Time
**Status**: `[x] DELIVERED`
**Goal**: The app detects sleep cues and gracefully ends the story.

#### Scope
- **Backend**: `SleepSentinelAgent`, Audio Stream Analysis.
- **Frontend**: Sleep Indicator (moon icon), UI dimming.
- **Events**: `SLEEP_CUE_DETECTED`.

#### Deliverables
- [x] `SleepSentinelAgent` (silence/breathing detection)
- [x] Sleep Indicator component
- [x] Sleep Mode UI (dimming, pace change)
- [x] E2E Test: Sleep detection triggers fade-out

---

### R7: Conversations
**Status**: `[x] DELIVERED`
**Goal**: The child can interrupt and direct the story.

#### Scope
- **Backend**: `ConversationalStoryEngine`, Intent Classification.
- **Frontend**: Child Interaction Bubble, Microphone input.
- **Events**: `CHILD_INTERRUPT`.

#### Deliverables
- [x] `ConversationalStoryEngine` (classify intents)
- [x] Microphone input during playback
- [x] Child Bubble component (displays transcript)
- [x] AI weaves answer into narrative
- [x] E2E Test: "What's that star?" -> AI answers in story

---

### R8: Smart Suggestions
**Status**: `[x] DELIVERED`
**Goal**: The agent proactively suggests a story based on context.

#### Scope
- **Backend**: `PreferenceLearningPipeline`, Ambient Context service.
- **Frontend**: Enhanced Suggestion Card (shows "why").
- **Domain**: `PreferencePair`, `AmbientContext`.

#### Deliverables
- [x] Ambient Context Service (time, weather)
- [x] Preference Learning (DPO-lite pairs)
- [x] Suggestion Card shows reasoning
- [x] "Again!" button (variation engine)
- [x] Unit Tests: Preference model

---

### R9: Sharing is Caring
**Status**: `[x] DELIVERED`
**Goal**: Parents can share moments with Grandma securely.

#### Scope
- **Backend**: Secure Link Generator, View limiter.
- **Frontend**: Share Modal (email input), Grandma Viewer page.
- **Security**: 48h expiry, 3 view limit.

#### Deliverables
- [x] Secure Link API (`/api/share/:id`)
- [x] Share Modal component
- [x] Grandma Viewer (public, unauthenticated)
- [x] Weekly Time Capsule Email (SendGrid/Resend)
- [x] E2E Test: Share link works, expires correctly

---

### R10: Launch Ready
**Status**: `[x] DELIVERED`
**Goal**: PWA is polished, gamification is active, ready for private beta.

#### Scope
- **Frontend**: PWA manifest, Service Worker, Onboarding flow.
- **Gamification**: Dream Companions (unlock after 5 stories).
- **Polish**: Full design system audit, Lighthouse 90+ score.

#### Deliverables
- [x] PWA Manifest & Service Worker
- [x] Onboarding Flow (3 steps)
- [x] Dream Companions collection UI
- [x] Lighthouse Audit (Performance 90+)
- [x] Private Beta release (50 families)

---

## How to Mark a Release as Delivered

When a release is complete, update its status in this file:
```diff
- | R1 | **Hello World** | `[ ] PENDING` | ... |
+ | R1 | **Hello World** | `[x] DELIVERED` | ... |
```

---

**Document Status**: Approved for Execution
**Last Updated**: January 2026
