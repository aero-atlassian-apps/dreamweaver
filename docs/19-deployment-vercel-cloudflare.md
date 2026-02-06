# Deployment Guide: Vercel (App + API) + Cloudflare Worker (WebSockets)

## Architecture
- App: Vercel Static (Vite build output)
- API: Vercel Functions (HTTP REST endpoints only)
- WebSockets: Cloudflare Worker (Gemini Live relay) at `/api/v1/live/ws`
- Events: Supabase Realtime subscription to `domain_events` (no custom events websocket)

## Prerequisites
- Supabase project (Postgres + Auth)
- Gemini API key
- Vercel account (App + API as separate projects)
- Cloudflare account (Workers)

## 1) Supabase Setup
1. Apply migrations from `supabase/migrations` to your Supabase project.
2. Confirm these tables exist:
   - `stories`, `shared_links`, `domain_events`, `ws_tickets`
3. Confirm the RPC exists:
   - `consume_ws_ticket(p_ticket text) -> uuid`

## 2) Deploy the App to Vercel
### Project settings
- Root Directory: repository root
- Build Command: `npm run build`
- Output Directory: `dist`

### Environment variables (App)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_BASE_URL` = `https://<your-api-project>.vercel.app/api/v1`
- `VITE_WS_BASE_URL` = `https://<your-ws-worker>.<your-subdomain>.workers.dev/api/v1`

## 3) Deploy the API to Vercel
### Project settings
- Root Directory: `api`

### Runtime notes
- HTTP endpoints are served as Vercel Functions from `api/api/[...path].ts`
- WebSocket endpoints are not hosted on Vercel; the WS relay runs in the Cloudflare Worker
- Any Node WebSocket upgrade handlers in `api/src/index.ts` are for local/dev or non-Vercel hosting and are not part of this production deployment

### Environment variables (API)
- Required
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `GEMINI_API_KEY` (for non-live HTTP flows that generate stories/agent thoughts; set `USE_MOCK_AI=true` to bypass)
- Required (production hardening)
  - `REDIS_URL`
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
  - `WS_WORKER_INTERNAL_TOKEN`
  - `GOOGLE_TTS_API_KEY`
- Recommended
  - `ALLOWED_ORIGINS` (CSV with the App origin)
  - `PUBLIC_APP_URL` (your App URL, used to generate share links)
- `GEMINI_MODEL_FLASH` (recommended: `gemini-3-flash-preview`)
- `GEMINI_MODEL_PRO` (recommended: `gemini-3-pro-preview`)
- `GEMINI_LIVE_MODEL` (recommended: `models/gemini-3-flash-preview`)
- Optional
  - `PUBLIC_DEMO_ENABLED` (`true|false`; demo endpoints are enabled by default — set to `false` to disable `/api/v1/demo/*` in production)
  - `OPENWEATHER_API_KEY`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
  - `CRON_SECRET`
  - `USE_MOCK_AI`
  - `VOICE_CLONING_ENABLED` (`true|false`, default `false`)
  - `HUGGINGFACE_API_KEY` (required if `VOICE_CLONING_ENABLED=true`)
  - `GEMINI_ENABLE_THINKING_LEVEL` (`true|false`, default `false`)
  - `GEMINI_THINKING_LEVEL_FLASH` (only if thinking is enabled)
  - `GEMINI_THINKING_LEVEL_PRO` (only if thinking is enabled)
  - `GEMINI_TIMEOUT_MS`, `AI_TOKEN_BUDGET`, `AI_COST_THRESHOLD` (finops/guardrails)

## 4) Deploy the WebSocket Worker to Cloudflare
### What it does
- Accepts the client websocket at `/api/v1/live/ws`
- Authenticates using the one-time ticket embedded in `Sec-WebSocket-Protocol` as `ticket.<uuid>`
- Consumes the ticket by calling the API: `POST /api/v1/live/tickets/consume` with header `x-worker-token`
- Opens an upstream websocket to Gemini Live and relays:
  - Client binary PCM16 audio -> Gemini base64 media chunks
  - Gemini base64 audio -> client binary audio frames
  - Tool calls -> forwarded as JSON to client

### Deploy steps
1. Go to `ws-worker/`
2. Install dependencies
   - `npm install`
3. Configure local variables for testing
   - Copy `ws-worker/.dev.vars.example` to `ws-worker/.dev.vars`
   - Fill in values
4. Run locally
   - `npm run dev`
5. Deploy
   - `npm run deploy`

### Environment variables (Worker)
- `DW_API_BASE_URL` (base URL of the HTTP API, e.g. `https://<api>.vercel.app/api/v1`)
- `WS_WORKER_INTERNAL_TOKEN` (must match API `WS_WORKER_INTERNAL_TOKEN`)
- `GEMINI_API_KEY`
- `ALLOWED_ORIGINS` (CSV; must include your Vercel App origin)
- `GEMINI_LIVE_MODEL` (recommended: `models/gemini-3-flash-preview`)
- `GEMINI_ENABLE_THINKING_LEVEL` (`true|false`, default `false`)
- `GEMINI_LIVE_THINKING_LEVEL` (only if thinking is enabled)

## 5) End-to-End Smoke Test
1. Open the App (Vercel).
2. Start a Live session (Gemini Live page/flow).
3. Confirm:
   - `POST /api/v1/live/init` returns `{ config, ticket }`
   - Browser connects to `wss://<worker>/api/v1/live/ws` using protocols `dw.live.v1` and `ticket.<uuid>`
   - Audio flows in both directions and tool calls are relayed to `POST /api/v1/live/tool`
4. Confirm model visibility for judging:
  - `GET /api/v1/meta/gemini-models` returns the resolved Flash/Pro/Live model names.

## 6) Wiring Check (Critical)

Ensure your URLs are cross-referenced correctly:

| Service | Variable | Value | Purpose |
|---------|----------|-------|---------|
| **App** | `VITE_API_BASE_URL` | `https://<api-project>.vercel.app/api/v1` | App talks to API |
| **App** | `VITE_WS_BASE_URL` | `https://<worker-project>.workers.dev/api/v1` | App talks to Worker |
| **Worker** | `DW_API_BASE_URL` | `https://<api-project>.vercel.app/api/v1` | Worker calls API to consume tickets |
| **Worker** | `WS_WORKER_INTERNAL_TOKEN` | `<same as API>` | Shared secret for ticket consumption |
| **Worker**| `ALLOWED_ORIGINS` | `https://<app-project>.vercel.app` | Worker allows App |
| **API** | `ALLOWED_ORIGINS` | `https://<app-project>.vercel.app` | API allows App |
| **API** | `PUBLIC_APP_URL` | `https://<app-project>.vercel.app` | API generates links to App |

> [!IMPORTANT]
> If `VITE_WS_BASE_URL` is missing, the App will try to connect to `VITE_API_BASE_URL` for WebSockets. Since Vercel Functions don't support robust WebSockets, this will fail. You **MUST** set `VITE_WS_BASE_URL` to your Cloudflare Worker URL.

## Notes
- The Worker only serves `/api/v1/live/ws`. If you want an `/api/v1/events/ws` websocket, keep it as Supabase Realtime (recommended) or add another worker endpoint.
