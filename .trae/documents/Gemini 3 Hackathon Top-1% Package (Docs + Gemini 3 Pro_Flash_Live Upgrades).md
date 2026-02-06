## Goals
- Produce Devpost-ready submission assets: Gemini 3 integration write-up (~200 words), 3‑minute demo script, architecture + agentic diagrams.
- Update code so the app explicitly and demonstrably uses Gemini 3 **Pro + Flash + Live** (not just “Gemini”).
- Add proof points so judges can quickly verify Gemini 3 usage.

## Doc Deliverables (new files under docs/)
- Create docs/gemini3-integration.md
  - ~200-word Devpost “Gemini Integration” section.
  - A short “Which Gemini 3 model is used where” table (Pro vs Flash vs Live).
  - A “Where in code” section linking to the key files.
- Create docs/demo-script-3min.md
  - Timestamped script (0:00–3:00), exact lines to say, and what to show on screen.
  - “Judge-callouts” for the 40/30/20/10 scoring categories.
- Create docs/architecture.md
  - Mermaid architecture diagram (API + app + ws-worker + Supabase + Redis + Gemini 3).
  - Mermaid sequence diagram for Live mode (ticket → worker → Gemini Live).
- Create docs/agentic-diagrams.md
  - Mermaid “agent loop” diagram: BedtimeConductorAgent → tools → memory → quality gate → verification → output.
  - A “guardrails map” diagram: SafetyGuardian + VerificationPipeline + QualityGate + HumanReviewQueue.
- (Optional but recommended) Create docs/devpost-checklist.md
  - Submission checklist to avoid Stage One disqualification (public demo link, English video, repo link, third-party disclosure).

## Code Changes to “Use Gemini 3 to the Extreme”
### 1) Explicit multi-model routing (Pro vs Flash)
- Update the backend Gemini gateway so different tasks use the right Gemini 3 model:
  - Gemini 3 Pro Preview for: agent reasoning (BedtimeConductor), verification/structured outputs, summarization.
  - Gemini 3 Flash Preview for: story generation + streaming (latency-sensitive).
- Add env vars:
  - GEMINI_MODEL_PRO (default: gemini-3-pro-preview)
  - GEMINI_MODEL_FLASH (default: gemini-3-flash-preview)
  - GEMINI_MODEL (fallback)
- Implementation targets:
  - api/src/infrastructure/adapters/GeminiAIGateway.ts (choose model per method)
  - api/src/di/container.ts (wire new env vars into the gateway config)

### 2) Make Live mode Gemini 3 Live
- Switch Live defaults from gemini-2.0-flash-exp to Gemini 3 Flash Preview (Live-capable):
  - api/src/application/factories/LiveSessionFactory.ts
  - api/src/infrastructure/adapters/GeminiLiveSession.ts (fallback)
  - ws-worker/src/index.ts (fallback)
- Add env var:
  - GEMINI_LIVE_MODEL (default: models/gemini-3-flash-preview)

### 3) Gemini 3 feature knobs (where supported)
- Add structured config hooks so you can demonstrate “Gemini 3 controls” in the demo and docs:
  - thinking_level (or equivalent parameter) toggles for Pro vs Flash.
  - tool-calling emphasis in Live mode (the save_memory / suggest_theme tools already exist—docs and demo will highlight tool calls).
- If the current SDK can’t express a Gemini 3-only parameter cleanly, keep it behind env flags so it doesn’t break runtime; still demonstrate Pro/Flash/Live model separation clearly.

### 4) Proof for judges (fast verification)
- Add a lightweight API endpoint that returns the resolved model names (no secrets):
  - /api/v1/meta/gemini-models → { flashModel, proModel, liveModel }
- Mention this endpoint in docs and demo so judges can verify in seconds.

## Optional “Win Probability Booster” (Public Demo Without Login)
- Add a public, rate-limited demo flow that requires no auth:
  - A demo page in the web app (e.g., /demo) and a matching API endpoint that generates a short story safely.
  - Hard safety limits: short duration only, strict rate limit, no personalization storage, no user data.
- This directly addresses the Devpost requirement that the demo be publicly accessible without login.

## Validation
- Run the full test suite after changes:
  - root tests, API tests, app build, ws-worker typecheck.
- Add/adjust unit tests for:
  - model selection logic (Pro vs Flash)
  - Live config default model
  - meta endpoint response

## Submission Packaging Guidance (what we’ll include in docs)
- 200-word Gemini 3 integration paragraph (Devpost requirement).
- Architecture diagram + agentic loop diagram (judging “Presentation/Demo”).
- 3-minute demo script optimized for “Technical Execution” and “Wow factor”.
- “Third-party integrations disclosure” list (Supabase, Redis, etc.) per rules.
