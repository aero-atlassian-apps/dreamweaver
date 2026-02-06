# 09. Technical Stack

## Overview

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | React 19 + TypeScript + Vite | Fast, lightweight, Vercel-compatible |
| **Backend** | Hono + Node.js (ESM) | Edge-ready, web-standard APIs |
| **Database** | Supabase (PostgreSQL + pgvector) | Free tier, RAG-ready |
| **AI Reasoning** | Gemini 3 Flash/Pro | Cost-effective, fast |
| **AI Live** | Gemini 2.5 Live | Real-time audio streaming |
| **TTS** | Google Cloud TTS (Chirp 3) | 85% cheaper than ElevenLabs |
| **Auth** | Supabase Auth | Built-in, JWT-based |
| **Cache** | Redis (Upstash) | Serverless-compatible |
| **Testing** | Vitest + Playwright | Unit + E2E |

---

## Frontend Stack

```
React 19
├── TypeScript (Strict Mode)
├── Vite (Build + Dev Server)
├── TanStack Query (Server State)
├── Zustand (Client State/Audio)
├── Tailwind CSS (Styling)
├── Radix UI (Accessible Primitives)
└── Service Workers (PWA Offline)
```

---

## Backend Stack

```
Hono
├── TypeScript (ESM)
├── Zod (Validation)
├── Supabase (Database + Auth)
├── @google/generative-ai (Gemini SDK)
├── ws (WebSocket - local dev)
└── ioredis (Redis client)
```

---

## Infrastructure Services

| Service | Provider | Tier |
|---------|----------|------|
| **Hosting (App + API)** | Vercel | Free |
| **WebSocket Relay** | Cloudflare Workers | Free |
| **Database** | Supabase | Free |
| **AI** | Google AI Studio (Gemini) | $300 credits |
| **Cache** | Upstash Redis | Free tier |
| **Monitoring** | Vercel Analytics | Free |

---

## Development Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | Linting |
| **Prettier** | Formatting |
| **Vitest** | Unit testing |
| **Playwright** | E2E testing |
| **Wrangler** | Cloudflare Workers CLI |
| **tsx** | TypeScript execution |
