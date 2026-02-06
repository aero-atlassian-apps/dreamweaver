# DreamWeaver Environment Variables

## Frontend (Vite)
- Required
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Recommended
  - `VITE_API_BASE_URL` (default: `http://localhost:3001`)
- Optional
  - `VITE_WS_BASE_URL` (use when WebSockets are hosted separately from the HTTP API)

## API (Node)
- Required (production)
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (required for cron jobs and admin operations)
  - `GEMINI_API_KEY` (required for Gemini Live + real AI mode)
- Required (production, operational hardening)
  - `REDIS_URL` (required for server-side session state)
  - `UPSTASH_REDIS_REST_URL` (required for distributed rate limiting & AI cache)
  - `UPSTASH_REDIS_REST_TOKEN` (required for distributed rate limiting & AI cache)
  - `WS_WORKER_INTERNAL_TOKEN` (shared secret used only by the WS relay worker to consume one-time tickets)
  - `GOOGLE_TTS_API_KEY` (required for TTS in production)
- Optional (feature-based)
  - `PUBLIC_DEMO_ENABLED` (`true|false`; demo endpoints are enabled by default — set to `false` to disable `/api/v1/demo/*` in production)
  - `HUGGINGFACE_API_KEY` (required if `VOICE_CLONING_ENABLED=true`)
  - `VOICE_CLONING_ENABLED` (`true|false`, default `false`)
  - `OPENWEATHER_API_KEY` (enables ambient weather context)
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (enables email sending)
  - `CRON_SECRET` (required to lock down cron endpoints in production)
  - `ALLOWED_ORIGINS` (CSV; default allows localhost)
  - `PUBLIC_APP_URL` (used to build share links; default `http://localhost:5173`)
  - `PORT` (default `3001`)
  - `USE_MOCK_AI` (when `true`, uses mock AI)
  - `ENABLE_LOAD_TEST_AUTH` (when `true` and not production, enables mock auth token)
  - `GEMINI_MODEL` (fallback model name used when per-task model vars are not set)
  - `GEMINI_MODEL_FLASH` (recommended: `gemini-3-flash-preview`)
  - `GEMINI_MODEL_PRO` (recommended: `gemini-3-pro-preview`)
  - `GEMINI_LIVE_MODEL` (recommended: `models/gemini-3-flash-preview`)
  - `GEMINI_ENABLE_THINKING_LEVEL` (`true|false`, default `false`; passes thinking level to Gemini when enabled)
  - `GEMINI_THINKING_LEVEL_FLASH` (e.g. `MINIMAL|MEDIUM`, only used if `GEMINI_ENABLE_THINKING_LEVEL=true`)
  - `GEMINI_THINKING_LEVEL_PRO` (e.g. `MINIMAL|MEDIUM`, only used if `GEMINI_ENABLE_THINKING_LEVEL=true`)
  - `GEMINI_TIMEOUT_MS` (Gemini request timeout override)
  - `AI_TOKEN_BUDGET` (per-session token budget guardrail)
  - `AI_COST_THRESHOLD` (per-session cost threshold guardrail in USD)
  - `ALLOW_INMEMORY_RATELIMIT` (`true|false`; prod override, not recommended)
  - `NODE_ENV`

## WS Worker (Cloudflare Workers)
- Required
  - `DW_API_BASE_URL` (base URL of the HTTP API, e.g. `https://<api>.vercel.app` or `https://<api>.vercel.app/api/v1`)
  - `WS_WORKER_INTERNAL_TOKEN` (must match API `WS_WORKER_INTERNAL_TOKEN`)
  - `GEMINI_API_KEY`
- Recommended
  - `ALLOWED_ORIGINS` (CSV; include your Vercel app origin)
  - `GEMINI_LIVE_MODEL` (recommended: `models/gemini-3-flash-preview`)
  - `GEMINI_ENABLE_THINKING_LEVEL` (`true|false`, default `false`)
  - `GEMINI_LIVE_THINKING_LEVEL` (e.g. `MINIMAL|MEDIUM`, only used if `GEMINI_ENABLE_THINKING_LEVEL=true`)

## Notes
- Frontend env vars must be prefixed with `VITE_` to be available in the browser build.
- Keep service role keys server-only; never put service-role keys into frontend env files.
