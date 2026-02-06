## Goals
- Make the Devpost wireup and docs unambiguously satisfy submission requirements and maximize judging rubric scores.
- Ensure judges can test a no-login demo reliably and see proof of Gemini 3 usage.

## What’s Already Strong (Keep)
- No-login demo route exists: frontend `/demo` and backend `POST /api/v1/demo/story`.
- Gemini 3 usage is real and provable:
  - Story generation uses Flash model and structured JSON validation.
  - Agent thought + structured generation use Pro model.
  - Live sessions are supported via `startLiveSession()` and `/api/v1/live/*` routes.

## Wireup Updates (Docs)
1. Upgrade `docs/devpost_submission.md` into a “judge-first” page:
   - Add a top “Judge Quickstart” section with:
     - Live Demo link (full URL to `/demo`)
     - Public repo link
     - 3-minute video link
     - Model proof endpoint (`/api/v1/meta/gemini-models`)
   - Add a small “Architecture” section with a Mermaid diagram showing:
     - Demo flow: `/demo` → `/api/v1/demo/story` → PromptService → GeminiAIGateway (Flash) → validated structured output
     - Live flow: `/live/init` → ticket → WS relay → tool router
     - Safety + resilience + guardrails around calls
   - Add 1–2 concrete outcome statements (no pricing) to strengthen “Potential Impact”.

2. Add/Update a dedicated judge README:
   - Create `docs/judges.md` (or extend existing) with:
     - “No login demo” instructions
     - “If demo is down” fallback: run locally
     - Required deployment env note (see code changes below)

## Code Changes (To Remove Demo Friction)
1. Make the public demo endpoint safe-by-default in production:
   - Change `api/src/routes/demo.ts` so the demo is enabled unless explicitly disabled.
   - Current behavior requires `PUBLIC_DEMO_ENABLED === 'true'` in production; this is risky (easy to forget and judges see 404).
   - Proposed behavior: demo is enabled by default; set `PUBLIC_DEMO_ENABLED=false` to disable.
   - Keep rate limiting (already 10/hour/IP) and strict input validation.

2. Make “Gemini proof” visible in the demo UI:
   - Update `src/presentation/pages/public/DemoPage.tsx` to fetch `/api/v1/meta/gemini-models` and render the active Flash/Pro/Live model names on screen.
   - Optionally show `traceId`/`requestId` from demo story response to reinforce production-grade observability.

## Consistency Check (Claims vs Code)
- Ensure the wireup wording matches exactly what the code does:
  - Flash used for story generation.
  - Pro used for structured/agent reasoning.
  - Live mode exists but requires sign-in.
  - “Structured outputs” are backed by schema validation.

## Validation
- Run lint/typecheck/tests after changes.
- Manually verify in browser:
  - `/demo` works without login
  - Demo story generation works
  - Model proof is displayed and endpoint returns values

## Deliverables
- Updated `docs/devpost_submission.md` (judge-ready, with diagram)
- New/updated `docs/judges.md`
- Safer default demo behavior in `api/src/routes/demo.ts`
- Demo UI displays Gemini model proof
- All checks passing

If you confirm, I’ll implement the above end-to-end and re-run lint/typecheck/tests.