# Implementation Status (Source of Truth Companion)

This document summarizes what is implemented in the repository vs what is partial or planned. It exists to keep vision/strategy documents accurate without forcing them to read like release notes.

## Status Legend
- **Implemented**: Present and wired into a working flow.
- **Partial**: Present, but gated by configuration, missing UX polish, or missing automation.
- **Planned**: Mentioned in vision/roadmap but not implemented here.

## User-Facing App (Web/PWA)
- **Auth flows — Implemented**: Login/signup and protected routes.
- **Dashboard — Implemented**: Main home experience for signed-in users.
- **Story request — Implemented**: Theme selection and voice-input mode for story prompts.
- **Story view/player — Implemented**: Story viewing and audio playback UI; conversational interruption is handled via Live Mode.
- **Library — Implemented**: List/search and recent/featured presentation.
- **Memory Vault — Implemented**: Vault UI exists and reads stored “moments”; moment creation runs automatically after story completion (and can be tuned over time).
- **Companions — Implemented**: Collection UX + persisted companion unlocks based on story count thresholds.
- **Settings/Profile — Implemented**: Preferences and basic account UI.
- **Demo page — Implemented**: `/demo` exists for no-login demo flow (API demo endpoints are enabled by default; set `PUBLIC_DEMO_ENABLED=false` to disable in production).
- **PWA — Implemented**: Service worker + manifest; offline behavior depends on cached assets and runtime caching rules.

## API (Hono)
- **Health — Implemented**: `/api/v1/health`.
- **Story generation — Implemented**: HTTP endpoints for generating stories and returning persisted story objects.
- **Story retrieval — Implemented**: Fetch story by id.
- **Model transparency — Implemented**: `GET /api/v1/meta/gemini-models` reports resolved Flash/Pro/Live model names.
- **Live Mode — Implemented**:
  - HTTP session init + tool execution endpoints exist.
  - WebSocket relay is implemented via the included Cloudflare Worker (`ws-worker`) and is production-ready when deployed.
- **Sharing (Grandma Mode) — Implemented**: Share-link creation and email sharing endpoints.
- **Moments — Implemented**: Store and list “moments” records for the authenticated user.
- **Preferences — Implemented**: Read/write user preferences used by the app.
- **Rate limiting/session state — Implemented**: Production requires Redis/Upstash configuration; development falls back to in-memory.

## AI + Safety
- **Gemini 3 usage — Implemented**: Flash/Pro/Live model roles are configurable via env vars and exposed via the meta endpoint.
- **SafetyGuardian — Implemented**: Multi-layer safety checks (including prompt-injection defense and fail-closed behavior on safety-check errors).
- **Verification pipeline — Implemented**: Verification and quality gates exist; operational thresholds/policies are configurable and can be tuned over time.

## Voice
- **Preset TTS (Google) — Implemented**: Stable, fast TTS for standard voices.
- **Voice cloning (Hugging Face) — Implemented**: Optional adapter behind `VOICE_CLONING_ENABLED`; supports recording/upload and use in TTS (reliability depends on Hugging Face inference behavior/latency).

## Sleep Sentinel
- **RMS/stability-based cues — Implemented**: Live session audio drives a sleep-confidence heuristic and publishes sleep-cue events.
- **Breathing cadence detection — Implemented**: FFT-based cadence detection over the RMS envelope to detect steady “breathing-like” rhythm (heuristic; not ML).

## What Is Explicitly Planned (Not Implemented Here)
- Smart home integrations (e.g., lights) — **Planned**: would require vendor APIs/devices (Matter/HomeKit/Hue), permissions, and a home-automation integration layer.
- Multi-child shared sessions with arbitration — **Planned**: needs a real-time multi-user session model, identity/permissions per child, and conflict resolution logic.
- Physical “Dream Companion” hardware — **Planned**: out of scope for this repository; requires firmware, manufacturing, and device provisioning.
- Licensed voice marketplace and IP partnerships — **Planned**: depends on legal/commercial agreements plus a billing/licensing backend.
