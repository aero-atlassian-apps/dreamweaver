# DreamWeaver

AI-powered bedtime story generator with voice interaction.

## Features
- [x] **R7: Conversations** - Super Agentic UI, Memory Persistence, PWA & ReAct Loop
- [x] **R8: Smart Suggestions** - Predictive AI, Reflection Agent, DPO
- [x] **R9: Sharing is Caring** - Secure Sharing, Grandma Mode, Magic Links
- [x] **R10: Launch Ready** - PWA, Gamification, Polish

## Quick Start

```bash
# Install dependencies (includes workspace packages)
npm install

# Start development (frontend + API concurrently)
npm run dev
```

This starts:
- **Frontend**: http://localhost:5173
- **API**: http://localhost:3001

## Environment Variables

All environment variables are consolidated in a single `.env` file at the project root.

1. Copy `.env.example` to `.env`
2. Fill in required values (see [docs/18-env-reference.md](docs/18-env-reference.md))

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins (e.g., `http://localhost:5173,https://myapp.com`) |

> **Note:** The API dev script uses `--env-file=../.env` to load from the root.

## Testing

### Unit Tests
```bash
npm test              # Frontend tests (Vitest)
npm --prefix api test # API tests (Vitest)
```

### End-to-End Tests
```bash
npm run test:e2e      # Playwright E2E suite (23 tests, single worker for stability)
```

### Full Quality Gates
```bash
npm run typecheck     # Type check all projects
npm run lint          # Lint all projects
npm run build         # Production build
npm run test:e2e      # E2E verification
```

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **API**: Hono + Node.js (ESM)
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini API (Live WebSocket + Batch)
- **Auth**: Supabase Auth
- **Testing**: Vitest (unit) + Playwright (E2E)

## Architecture

Clean Architecture with Domain-Driven Design:
- `domain/` - Entities, value objects, agents
- `application/` - Use cases
- `infrastructure/` - External services, repositories
- `presentation/` - React components, pages

## Deployment

### Vercel (Recommended)

**Frontend Project:**
- Root Directory: repository root
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_API_BASE_URL` (your deployed API URL)

**API Project:**
- Root Directory: `api`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables: All server-side vars from `.env.example`

> ⚠️ **WebSocket Limitation**: Vercel Functions do not support persistent WebSocket connections. For Gemini Live features, deploy the `ws-worker` to Cloudflare Workers (recommended) or host the API on a WebSocket-capable platform if you want to use the Node WS upgrade paths.

See: [docs/19-deployment-vercel-cloudflare.md](docs/19-deployment-vercel-cloudflare.md)

## Security

This project follows security best practices:
- ✅ No hardcoded secrets (all via environment variables)
- ✅ CORS restricted via `ALLOWED_ORIGINS`
- ✅ Rate limiting on API endpoints
- ✅ Supabase RLS for database security
- ✅ Input validation with Zod schemas
- ✅ 0 npm audit vulnerabilities

Run security audit: `npm audit`

