# DreamWeaver: Complete Deployment Guide

> **From Zero to Production in ~30 Minutes**
> 
> This guide walks you through every step to deploy DreamWeaver, including database setup, API keys, and all services. Follow in order.

---

## Prerequisites

- [ ] Node.js 20+ installed
- [ ] Git installed
- [ ] GitHub account (for Vercel deployment)
- [ ] Credit card (for free tier signups — no charges)

---

## Phase 1: Supabase (Database)

### Step 1.1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com/) → **Start your project**
2. Sign in with GitHub
3. Click **New Project**
4. Fill in:
   - **Name:** `dreamweaver-prod`
   - **Database Password:** Generate a strong password (save it!)
   - **Region:** Choose closest to your users
5. Click **Create new project** (wait 2-3 minutes)

### Step 1.2: Get Supabase Keys

1. In your project dashboard, go to **Settings** → **API**
2. Copy these values:

| Key | Where to find | Env var |
|-----|---------------|---------|
| **Project URL** | Under "Project URL" | `SUPABASE_URL` |
| **anon/public** | Under "Project API keys" | `SUPABASE_ANON_KEY` |
| **service_role** | Under "Project API keys" (click reveal) | `SUPABASE_SERVICE_ROLE_KEY` |

> [!CAUTION]
> Never expose `service_role` key in frontend code!

### Step 1.3: Run Database Migrations

The project has **17 migration files** in `supabase/migrations/` that must be run in sequence.

#### Option A: Using Supabase CLI (Recommended)

1. Install Supabase CLI:

```bash
npm install -g supabase
```

2. Link to your project:

```bash
cd DreamWeaver
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

> [!TIP]
> Find your project ref in Supabase Dashboard → Settings → General → "Reference ID"

3. Run all migrations:

```bash
supabase db push
```

This will run all 17 migrations in order:
- `20260128000000_init_schema.sql` — Core tables (profiles, stories, moments)
- `20260128000001_security.sql` — RLS policies
- `20260128000002_logic.sql` — Functions and triggers
- `20260128000003_ws_tickets.sql` — WebSocket auth
- `20260129000004_share_rpc_hardening.sql` — Share link security
- `20260129000005_family_rls_hardening.sql` — Family data isolation
- `20260129000006_shared_link_logic_cleanup.sql` — Cleanup
- `20260130000007_voice_profiles.sql` — Voice cloning
- `20260130000008_domain_events_trace.sql` — Event tracing
- `20260130000009_agent_tool_audit.sql` — Agent audit logs
- `20260130000010_feedback.sql` — User feedback
- `20260201000011_secure_worker_rpc.sql` — Worker RPC
- `20260202000012_human_review_queue.sql` — Moderation queue
- `20260202000013_moderation_and_moments_status.sql` — Moderation status
- `20260202000014_memory_vector_search.sql` — Vector search (pgvector)
- `20260203000000_companion_unlocks.sql` — Gamification
- `20260203000001_companion_unlocks_security.sql` — Companion RLS

#### Option B: Manual SQL Execution

If you prefer to run SQL manually:

1. In Supabase dashboard, go to **SQL Editor**
2. For **each** file in `supabase/migrations/` (in order by filename):
   - Open the file locally
   - Copy the SQL content
   - Paste in SQL Editor
   - Click **Run**

> [!WARNING]
> Run migrations **in order** by filename. The numeric prefix determines the sequence.

#### Verify Migrations

After running migrations, check that tables exist:

```sql
-- Run in SQL Editor
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected tables: `companions`, `domain_events`, `feedback`, `golden_moments`, `human_review_queue`, `profiles`, `shared_links`, `stories`, `user_preferences`, `voice_profiles`, `ws_tickets`

### Step 1.4: Enable Email Auth

1. Go to **Authentication** → **Providers**
2. Ensure **Email** is enabled
3. (Optional) Enable **Google** or **GitHub** for social login

---

## Phase 2: Get API Keys

### Step 2.1: Google AI Studio (Gemini)

1. Go to [aistudio.google.com](https://aistudio.google.com/)
2. Sign in with Google
3. Click **Get API key** → **Create API key**
4. Choose "Create API key in new project" or select existing
5. Copy the key

| Key | Env var |
|-----|---------|
| API Key | `GEMINI_API_KEY` |

> [!TIP]
> Enable billing at [console.cloud.google.com](https://console.cloud.google.com/billing) to use your $300 free credits!

### Step 2.2: Upstash Redis

1. Go to [upstash.com](https://upstash.com/) → **Console**
2. Sign in with GitHub
3. Click **Create Database**
4. Fill in:
   - **Name:** `dreamweaver-cache`
   - **Region:** Choose closest to Vercel region
   - **Type:** Regional (free tier)
5. Click **Create**
6. Go to **REST API** tab and copy:

| Key | Env var |
|-----|---------|
| `UPSTASH_REDIS_REST_URL` | `UPSTASH_REDIS_REST_URL` |
| `UPSTASH_REDIS_REST_TOKEN` | `UPSTASH_REDIS_REST_TOKEN` |

Also copy the standard Redis URL for `REDIS_URL`.

### Step 2.3: Hugging Face (Voice Cloning - Optional)

1. Go to [huggingface.co](https://huggingface.co/) → **Sign Up**
2. Click your avatar → **Settings** → **Access Tokens**
3. Click **New Token**
4. Name: `dreamweaver-tts`, Role: **Read**
5. Copy the token

| Key | Env var |
|-----|---------|
| Token | `HUGGINGFACE_API_KEY` |

### Step 2.4: Google Cloud TTS (Optional)

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Create or select a project
3. Enable **Cloud Text-to-Speech API**
4. Go to **APIs & Services** → **Credentials**
5. Create an **API Key**

| Key | Env var |
|-----|---------|
| API Key | `GOOGLE_TTS_API_KEY` |

### Step 2.5: Generate Secrets

Generate two random secrets for internal auth:

```bash
# Run in terminal or use a password generator
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

| Purpose | Env var |
|---------|---------|
| WS Worker auth | `WS_WORKER_INTERNAL_TOKEN` |
| Cron endpoint auth | `CRON_SECRET` |

---

## Phase 3: Cloudflare Worker (WebSocket)

### Step 3.1: Create Cloudflare Account

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com/)
2. Sign up for free account

### Step 3.2: Install Wrangler CLI

```bash
npm install -g wrangler
wrangler login
```

### Step 3.3: Configure Worker

1. Navigate to the worker directory:

```bash
cd ws-worker
```

2. Create `.dev.vars` file for local testing:

```bash
# Copy example
cp .dev.vars.example .dev.vars
```

3. Edit `.dev.vars` with your values:

```env
DW_API_BASE_URL=http://localhost:3001/api/v1
WS_WORKER_INTERNAL_TOKEN=your-secret-from-step-2.5
GEMINI_API_KEY=your-gemini-key
GEMINI_LIVE_MODEL=models/gemini-live-2.5-flash-native-audio
ALLOWED_ORIGINS=http://localhost:5173
```

### Step 3.4: Deploy Worker

```bash
# Deploy to Cloudflare
npx wrangler deploy

# Note the URL, e.g.: https://dw-live.your-account.workers.dev
```

### Step 3.5: Set Production Secrets

```bash
# Set each secret
wrangler secret put DW_API_BASE_URL
# Enter: https://your-api.vercel.app/api/v1

wrangler secret put WS_WORKER_INTERNAL_TOKEN
# Enter: your-secret-from-step-2.5

wrangler secret put GEMINI_API_KEY
# Enter: your-gemini-key

wrangler secret put ALLOWED_ORIGINS
# Enter: https://your-app.vercel.app
```

📝 **Save your Worker URL:** `https://dw-live.your-account.workers.dev`

---

## Phase 4: Vercel API Deployment

### Step 4.1: Prepare Repository

1. Push your code to GitHub (if not already)
2. Go to [vercel.com](https://vercel.com/) → Sign in with GitHub

### Step 4.2: Import Project (API)

1. Click **Add New** → **Project**
2. Import your DreamWeaver repository
3. Configure:
   - **Root Directory:** `api`
   - **Framework Preset:** Other
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### Step 4.3: Set Environment Variables

Add these in Vercel's project settings → **Environment Variables**:

```env
# Required
NODE_ENV=production
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GEMINI_API_KEY=your-key
REDIS_URL=redis://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=your-token
WS_WORKER_INTERNAL_TOKEN=your-secret

# Gemini Models
GEMINI_MODEL_FLASH=gemini-3-flash-preview
GEMINI_MODEL_PRO=gemini-3-pro-preview
GEMINI_LIVE_MODEL=models/gemini-live-2.5-flash-native-audio

# App Config
PUBLIC_APP_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app

# Optional
GOOGLE_TTS_API_KEY=your-key
VOICE_CLONING_ENABLED=true
HUGGINGFACE_API_KEY=hf_...
HUGGINGFACE_TTS_MODEL=coqui/XTTS-v2
PUBLIC_DEMO_ENABLED=true
```

### Step 4.4: Deploy

1. Click **Deploy**
2. Wait for build to complete

📝 **Save your API URL:** `https://dreamweaver-api.vercel.app`

### Step 4.5: Update Cloudflare Worker

Now update the Cloudflare Worker with the real API URL:

```bash
wrangler secret put DW_API_BASE_URL
# Enter: https://dreamweaver-api.vercel.app/api/v1
```

---

## Phase 5: Vercel App Deployment

### Step 5.1: Import Project (App)

1. In Vercel, click **Add New** → **Project**
2. Import the same repository again
3. Configure:
   - **Root Directory:** `.` (root)
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### Step 5.2: Set Environment Variables

```env
# Required
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_BASE_URL=https://dreamweaver-api.vercel.app

# WebSocket (Cloudflare Worker)
VITE_WS_BASE_URL=wss://dw-live.your-account.workers.dev
```

### Step 5.3: Deploy

1. Click **Deploy**
2. Wait for build to complete

📝 **Save your App URL:** `https://dreamweaver-app.vercel.app`

---

## Phase 6: Final Configuration

### Step 6.1: Update CORS Origins

Go back to your API project in Vercel and update:

```env
ALLOWED_ORIGINS=https://dreamweaver-app.vercel.app
PUBLIC_APP_URL=https://dreamweaver-app.vercel.app
```

Redeploy the API.

### Step 6.2: Update Cloudflare Origins

```bash
wrangler secret put ALLOWED_ORIGINS
# Enter: https://dreamweaver-app.vercel.app
```

---

## Phase 7: Testing & Demo

### Step 7.1: Health Check

```bash
# Check API health
curl https://dreamweaver-api.vercel.app/api/v1/health

# Expected: { "status": "healthy", ... }
```

### Step 7.2: Model Verification

```bash
# Check Gemini models
curl https://dreamweaver-api.vercel.app/api/v1/meta/gemini-models

# Expected: { "success": true, "data": { "flashModel": "gemini-3-flash-preview", ... } }
```

### Step 7.3: Demo Page Test

1. Open: `https://dreamweaver-app.vercel.app/demo`
2. You should see the demo page with model proof
3. Click **Generate Story**
4. A story should generate using Gemini 3 Flash

### Step 7.4: Full User Flow Test

1. **Sign Up:**
   - Go to `https://dreamweaver-app.vercel.app`
   - Click Sign Up → Create account with email
   - Check email for confirmation link

2. **Create Story:**
   - After login, go to Dashboard
   - Click "New Story"
   - Select theme, enter child name
   - Generate story

3. **Test Live Mode:**
   - Click "Live Mode" on a story
   - Allow microphone access
   - Speak to test bidirectional audio

4. **Test Sharing (Grandma Mode):**
   - On any story, click "Share"
   - Copy the link
   - Open in incognito → Should work without login

---

## Troubleshooting

### "CORS Error"
- Check `ALLOWED_ORIGINS` includes your app URL
- Redeploy both API and Worker after changes

### "WebSocket Connection Failed"
- Check Cloudflare Worker logs: `wrangler tail`
- Verify `WS_WORKER_INTERNAL_TOKEN` matches in API and Worker
- Check `DW_API_BASE_URL` is correct in Worker

### "Gemini API Error"
- Verify `GEMINI_API_KEY` is valid
- Check billing is enabled in Google Cloud Console
- Test key directly: `curl -H "x-goog-api-key: YOUR_KEY" https://generativelanguage.googleapis.com/v1beta/models`

### "Database Error"
- Check Supabase dashboard → Logs → API
- Verify RLS policies are created
- Check `SUPABASE_SERVICE_ROLE_KEY` for service role operations

---

## Quick Reference

| Service | URL |
|---------|-----|
| **App** | https://dreamweaver-app.vercel.app |
| **API** | https://dreamweaver-api.vercel.app |
| **WebSocket** | wss://dw-live.your-account.workers.dev |
| **Supabase** | https://xxx.supabase.co |

| Dashboard | Link |
|-----------|------|
| Vercel | [vercel.com/dashboard](https://vercel.com/dashboard) |
| Cloudflare | [dash.cloudflare.com](https://dash.cloudflare.com) |
| Supabase | [supabase.com/dashboard](https://supabase.com/dashboard) |
| Google AI Studio | [aistudio.google.com](https://aistudio.google.com) |
| Upstash | [console.upstash.com](https://console.upstash.com) |

---

## 🎉 Congratulations!

You've deployed DreamWeaver. Your AI-powered bedtime storytelling app is now live!

**Next Steps:**
1. Configure custom domain (optional)
2. Set up monitoring with Vercel Analytics
3. Disable demo mode for production: `PUBLIC_DEMO_ENABLED=false`
