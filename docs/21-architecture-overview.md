# 21. Architecture Overview

## System Context

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           DREAMWEAVER SYSTEM                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐        ┌─────────────┐        ┌─────────────┐         │
│  │    User     │        │    User     │        │  Grandparent │         │
│  │   (Parent)  │        │   (Child)   │        │              │         │
│  └──────┬──────┘        └──────┬──────┘        └──────┬───────┘         │
│         │                      │                      │                  │
│         └──────────────────────┼──────────────────────┘                  │
│                                ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                        PWA (React 19)                               ││
│  │                                                                     ││
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        ││
│  │  │ Dashboard │  │  Story    │  │  Memory   │  │  Live     │        ││
│  │  │           │  │  Player   │  │  Vault    │  │  Mode     │        ││
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘        ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                │                                         │
│                    ┌───────────┴───────────┐                            │
│                    ▼                       ▼                            │
│  ┌────────────────────────┐  ┌────────────────────────┐                │
│  │      Vercel API        │  │   Cloudflare Worker    │                │
│  │      (Hono + Node)     │  │   (WebSocket Proxy)    │                │
│  │                        │  │                        │                │
│  │  ┌──────────────────┐  │  │  ┌──────────────────┐  │                │
│  │  │    Use Cases     │  │  │  │   WS → Gemini    │  │                │
│  │  │   (Application)  │  │  │  │   Live Relay     │  │                │
│  │  └──────────────────┘  │  │  └──────────────────┘  │                │
│  └───────────┬────────────┘  └────────────┬───────────┘                │
│              │                            │                             │
│              └────────────┬───────────────┘                             │
│                           ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │                      EXTERNAL SERVICES                              ││
│  │                                                                     ││
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐        ││
│  │  │ Supabase  │  │  Gemini   │  │  Google   │  │  Upstash  │        ││
│  │  │ (Postgres)│  │  3 / Live │  │   TTS     │  │  (Redis)  │        ││
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘        ││
│  │                                                                     ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Layer Breakdown

### Presentation Layer (Frontend)

| Component | Technology | Purpose |
|-----------|------------|---------|
| PWA Shell | React 19 + Vite | Application framework |
| State | TanStack Query + Zustand | Server + client state |
| Styling | Tailwind CSS | Design system |
| Offline | Service Workers | Offline capability |

### API Layer (Backend)

| Component | Technology | Purpose |
|-----------|------------|---------|
| HTTP Server | Hono | Web-standard framework |
| Validation | Zod | Input/output validation |
| Auth | Supabase Auth | JWT authentication |
| Routes | Express-style | RESTful endpoints |

### Domain Layer

| Component | Purpose |
|-----------|---------|
| Entities | Business objects (Story, Profile) |
| Value Objects | Immutable values (StoryId, GoldenMomentType) |
| Domain Services | Business logic |
| Repository Ports | Database abstraction |

### Infrastructure Layer

| Component | Technology | Purpose |
|-----------|------------|---------|
| Database | Supabase (PostgreSQL) | Persistence |
| AI Gateway | @google/generative-ai | LLM integration |
| Cache | Upstash Redis | Session state |
| Event Bus | In-memory (future: Redis) | Agent messaging |
